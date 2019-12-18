import React, { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'react-apollo-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { Menu, MenuItem, Divider } from '@material-ui/core'

import { COURSE_BY_ID_WITH_LINKS } from '../../graphql/Query'
import NotFoundView from '../error/NotFoundView'
import LoadingBar from '../../components/LoadingBar'
import ConceptNode from './ConceptNode'
import { ConceptLink } from '../coursemapper/concept'
import {
  CREATE_CONCEPT,
  CREATE_CONCEPT_LINK,
  DELETE_CONCEPT,
  DELETE_CONCEPT_LINK,
  UPDATE_CONCEPT,
  DELETE_MANY_CONCEPTS
} from '../../graphql/Mutation'
import cache from '../../apollo/update'
import {
  useManyUpdatingSubscriptions,
  useUpdatingSubscription
} from '../../apollo/useUpdatingSubscription'
import CourseList from './CourseList'
import { useCreateConceptDialog, useEditConceptDialog } from '../../dialogs/concept'
import { Role } from '../../lib/permissions'
import { useLoginStateValue } from '../../lib/store'

const useStyles = makeStyles({
  root: {
    gridArea: 'content',
    position: 'relative',
    userSelect: 'none',
    transform: 'translate(0, 0)',
    transformOrigin: '0 0'
  },
  objectives: {
    position: 'fixed',
    right: 0,
    top: '48px',
    bottom: '56px',
    minWidth: '350px',
    width: '25%',
    padding: '8px',

    display: 'flex',
    flexDirection: 'column',

    backgroundColor: 'white',
    '& > $button': {
      width: '100%',
      marginTop: '16px'
    }
  },
  button: {},
  toolbar: {
    position: 'fixed',
    top: '60px',
    left: '10px'
  },
  selection: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, .25)',
    border: '4px solid red',
    display: 'none',
    zIndex: 6
  }
})

const sliderMinLinear = 0
const sliderMaxLinear = 200

const sliderMinLog = Math.log(0.2)
const sliderMaxLog = Math.log(5)

const sliderScale = (sliderMaxLog - sliderMinLog) / (sliderMaxLinear - sliderMinLinear)

const linearToLog = position =>
  Math.exp(sliderMinLog + (sliderScale * (position - sliderMinLinear)))
const logToLinear = value =>
  ((Math.log(value) - sliderMinLog) / sliderScale) + sliderMinLinear

const ConceptMapperView = ({ workspaceId, courseId, urlPrefix }) => {
  const classes = useStyles()
  const [{ user }] = useLoginStateValue()

  const [adding, setAdding] = useState(null)
  const [addingLink, setAddingLinkState] = useState(null)
  const addingLinkRef = useRef()
  const setAddingLink = val => {
    setAddingLinkState(val)
    addingLinkRef.current = val
  }
  const [menu, setMenu] = useState({ open: false })
  const panning = useRef(false)
  const pan = useRef({ x: 0, y: 0, zoom: 1, linearZoom: logToLinear(1) })
  const selected = useRef(new Set())
  const concepts = useRef({})
  const selection = useRef(null)
  const selectionRef = useRef()
  const main = useRef()
  const root = document.getElementById('root')

  // const openCreateObjectiveDialog =
  //   useCreateConceptDialog(workspaceId, user.role >= Role.STAFF, 'OBJECTIVE')

  const openEditConceptDialog = useEditConceptDialog(workspaceId, user.role >= Role.STAFF)

  const subscriptionArgs = { variables: { workspaceId } }
  useUpdatingSubscription('workspace', 'update', subscriptionArgs)
  useUpdatingSubscription('many concepts', 'delete', subscriptionArgs)
  useManyUpdatingSubscriptions(
    ['course', 'concept', 'concept link'], ['create', 'delete', 'update'], subscriptionArgs)

  const createConcept = useMutation(CREATE_CONCEPT, {
    update: cache.createConceptUpdate(workspaceId)
  })

  const updateConcept = useMutation(UPDATE_CONCEPT, {
    update: cache.updateConceptUpdate(workspaceId)
  })

  const deleteConcept = useMutation(DELETE_CONCEPT, {
    update: cache.deleteConceptUpdate(workspaceId)
  })

  const deleteManyConcepts = useMutation(DELETE_MANY_CONCEPTS, {
    update: cache.deleteManyConceptsUpdate(workspaceId)
  })

  const createConceptLink = useMutation(CREATE_CONCEPT_LINK, {
    update: cache.createConceptLinkUpdate()
  })

  const deleteConceptLink = useMutation(DELETE_CONCEPT_LINK, {
    update: cache.deleteConceptLinkUpdate()
  })

  const courseQuery = useQuery(COURSE_BY_ID_WITH_LINKS, {
    variables: { id: courseId, workspaceId }
  })

  const updateSelection = (axisKey, posKey, lenKey, value, offset) => {
    const initialValue = selection.current.start[axisKey]
    const minVal = Math.min(value, initialValue)
    const maxVal = Math.max(value, initialValue)
    selection.current.pos[posKey] = (minVal + offset) / pan.current.zoom
    selection.current.pos[lenKey] = (maxVal - minVal) / pan.current.zoom
    selectionRef.current.style[posKey] = `${selection.current.pos[posKey]}px`
    selectionRef.current.style[lenKey] = `${selection.current.pos[lenKey]}px`
  }

  const updateSelected = () => {
    const sel = selection.current.pos
    const selLeftEnd = sel.left + sel.width
    const selTopEnd = sel.top + sel.height
    for (const [id, state] of Object.entries(concepts.current)) {
      if (!state.node) continue
      if (state.x >= sel.left && state.x + state.width <= selLeftEnd
        && state.y >= sel.top && state.y + state.height <= selTopEnd) {
        selected.current.add(id)
        state.node.classList.add('selected')
      } else {
        selected.current.delete(id)
        state.node.classList.remove('selected')
      }
    }
  }

  const finishAddingLink = async to => {
    await createConceptLink({
      variables: {
        from: addingLinkRef.current,
        to,
        workspaceId
      }
    })
    setAddingLink(null)
  }

  const mouseDown = evt => {
    if (evt.button !== 0) {
      return
    }
    if (evt.target !== main.current && evt.target !== root) {
      const conceptRoot = evt.target.closest('.concept-root')
      if (addingLinkRef.current && conceptRoot?.hasAttribute('data-concept-id')) {
        finishAddingLink(conceptRoot.getAttribute('data-concept-id'))
      }
      return
    }
    if (addingLinkRef.current) {
      setAddingLink(null)
    }
    if (evt.shiftKey) {
      const x = evt.pageX - main.current.offsetLeft
      const y = evt.pageY - main.current.offsetTop
      selection.current = {
        pos: {
          left: (x + pan.current.x) / pan.current.zoom,
          top: (y + pan.current.y) / pan.current.zoom,
          width: 0,
          height: 0
        },
        start: { x, y }
      }
      selectionRef.current.style.left = `${selection.current.pos.left}px`
      selectionRef.current.style.top = `${selection.current.pos.top}px`
      selectionRef.current.style.width = 0
      selectionRef.current.style.height = 0
      selectionRef.current.style.display = 'block'
      updateSelected()
    } else {
      panning.current = true
    }
  }

  const mouseMove = evt => {
    if (panning.current) {
      pan.current.y -= evt.movementY
      pan.current.x -= evt.movementX
      main.current.style.transform =
        `translate(${-pan.current.x}px, ${-pan.current.y}px) scale(${pan.current.zoom})`
    } else if (selection.current) {
      updateSelection('x', 'left', 'width',
        evt.pageX - main.current.offsetLeft,
        pan.current.x)
      updateSelection('y', 'top', 'height',
        evt.pageY - main.current.offsetTop,
        pan.current.y)
      updateSelected()
    }
  }

  const mouseUp = () => {
    if (selection.current) {
      selection.current = null
      selectionRef.current.style.display = 'none'
    } else if (panning.current) {
      panning.current = false
    }
  }

  const mouseWheel = evt => {
    pan.current.linearZoom -= evt.deltaY
    if (pan.current.linearZoom < sliderMinLinear) {
      pan.current.linearZoom = sliderMinLinear
    } else if (pan.current.linearZoom > sliderMaxLinear) {
      pan.current.linearZoom = sliderMaxLinear
    }

    const mouseX = evt.pageX - main.current.offsetLeft
    const mouseY = evt.pageY - main.current.offsetTop
    const oldZoom = pan.current.zoom
    pan.current.zoom = linearToLog(pan.current.linearZoom)
    pan.current.x = ((pan.current.x + mouseX) / oldZoom * pan.current.zoom) - mouseX
    pan.current.y = ((pan.current.y + mouseY) / oldZoom * pan.current.zoom) - mouseY

    main.current.style.transform =
      `translate(${-pan.current.x}px, ${-pan.current.y}px) scale(${pan.current.zoom})`
  }

  const doubleClick = evt => {
    if (evt.target === main.current || evt.target === root) {
      setAdding({
        x: ((evt.pageX - main.current.offsetLeft + pan.current.x) / pan.current.zoom) - 100,
        y: ((evt.pageY - main.current.offsetTop + pan.current.y) / pan.current.zoom) - 17
      })
    }
  }

  const openBackgroundMenu = evt => {
    if (evt.target === main.current || evt.target === root) {
      setMenu({
        open: 'background',
        anchor: {
          left: evt.clientX - 2,
          top: evt.clientY - 4
        }
      })
      evt.preventDefault()
    }
  }

  useEffect(() => {
    window.addEventListener('mousedown', mouseDown)
    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mouseup', mouseUp)
    window.addEventListener('wheel', mouseWheel)
    window.addEventListener('dblclick', doubleClick)
    window.addEventListener('contextmenu', openBackgroundMenu)
    return () => {
      window.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mouseup', mouseUp)
      window.removeEventListener('wheel', mouseWheel)
      window.removeEventListener('dblclick', doubleClick)
      window.removeEventListener('contextmenu', openBackgroundMenu)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selected.current.size === 0) {
      return
    }
    console.log('Using concept set update effect')
    const conceptSet = new Set(courseQuery.data.courseById?.concepts
      .map(concept => `concept-${concept.id}`))
    for (const elem of selected.current) {
      if (!conceptSet.has(elem)) {
        selected.current.delete(elem)
      }
    }
  }, [courseQuery.data.courseById?.concepts])

  if (courseQuery.error) {
    return <NotFoundView message='Course not found' />
  } else if (!courseQuery.data.courseById) {
    return <LoadingBar id='course-view' />
  }

  const course = courseQuery.data.courseById
  const courses = courseQuery.data.courseById.workspace.courses

  const submitExistingConcept = id => ({ name, position }) => updateConcept({
    variables: {
      id,
      name,
      position
    }
  })

  const submitNewConcept = ({ name, position }) => {
    stopAdding()
    return createConcept({
      variables: {
        name,
        description: '',
        level: 'CONCEPT',
        position,
        workspaceId,
        courseId
      }
    })
  }

  const stopAdding = () => {
    delete concepts.current['concept-new']
    setAdding(null)
  }

  const openConceptMenu = id => openMenu('concept', id)
  const closeMenuById = id => () => menu.id === id && closeMenu()
  const openConceptLinkMenu = id => openMenu('concept-link', id)

  const openMenu = (type, id) => evt => {
    evt.preventDefault()
    setMenu({
      id,
      typeId: `${type}-${id}`,
      state: type === 'concept' && concepts.current[`concept-${id}`],
      open: type,
      anchor: {
        left: evt.clientX - 2,
        top: evt.clientY - 4
      }
    })
  }

  const closeMenu = () => {
    setMenu({
      ...menu,
      id: null,
      open: false
    })
  }

  const closeMenuAnd = (func, ...args) => () => {
    func(...args)
    closeMenu()
  }

  const menuAddLink = closeMenuAnd(setAddingLink, menu.id)

  const oppositeLevel = {
    OBJECTIVE: 'CONCEPT',
    CONCEPT: 'OBJECTIVE'
  }

  const clearSelected = () => {
    for (const state of Object.values(concepts.current)) {
      // eslint-disable-next-line no-unused-expressions
      state.node?.classList.remove('selected')
    }
    selected.current.clear()
  }

  const menuFlipLevel = closeMenuAnd(async () => {
    await updateConcept({
      variables: {
        id: menu.id,
        level: oppositeLevel[menu.state.concept.level]
      }
    })
    clearSelected()
  })

  const menuDeselectConcept = closeMenuAnd(() => {
    if (selected.current.has(menu.typeId)) {
      menu.state.node.classList.remove('selected')
      selected.current.delete(menu.typeId)
    } else {
      menu.state.node.classList.add('selected')
      selected.current.add(menu.typeId)
    }
  })

  const menuDeselectAll = closeMenuAnd(clearSelected)

  const menuDeleteConcept = closeMenuAnd(async () => {
    await deleteConcept({
      variables: {
        id: menu.id
      }
    })
  })

  const menuDeleteAll = closeMenuAnd(async () => {
    await deleteManyConcepts({
      variables: {
        ids: Array.from(selected.current).map(id => id.substr('concept-'.length))
      }
    })
  })

  const menuDeleteLink = closeMenuAnd(async() => {
    await deleteConceptLink({
      variables: {
        id: menu.id
      }
    })
  })

  const menuEditConcept = closeMenuAnd(openEditConceptDialog, menu.state?.concept)

  const menuAddConcept = closeMenuAnd(setTimeout, () => setAdding({
    x: ((menu.anchor.left - main.current.offsetLeft + pan.current.x) / pan.current.zoom) - 98,
    y: ((menu.anchor.top - main.current.offsetTop + pan.current.y) / pan.current.zoom) - 13
  }), 0)

  const linkOffsets = {
    y0: -58,
    y1: -58
  }

  return <>
    <main className={classes.root} ref={main}>
      {course.concepts.flatMap(concept => [
        <ConceptNode
          key={concept.id} workspaceId={workspaceId} concept={concept} pan={pan}
          openMenu={openConceptMenu(concept.id)} closeMenu={closeMenuById(concept.id)}
          concepts={concepts} selected={selected} submit={submitExistingConcept(concept.id)}
        />,
        ...concept.linksToConcept.map(link => <ConceptLink
          key={link.id} delay={1} active linkId={link.id}
          within='concept-mapper-link-container' posOffsets={linkOffsets}
          onContextMenu={openConceptLinkMenu(link.id)}
          scrollParentRef={pan} noListenScroll
          from={`concept-${concept.id}`} to={`concept-${link.from.id}`}
          fromConceptId={concept.id} toConceptId={link.from.id}
          fromAnchor='center middle' toAnchor='center middle'
        />)
      ])}
      {adding && <ConceptNode
        isNew concept={{ id: 'new', name: '', position: adding }}
        concepts={concepts} selected={selected}
        cancel={stopAdding} submit={submitNewConcept}
      />}
      {addingLink && <ConceptLink
        active within={document.body}
        followMouse from={`concept-${addingLink}`} to={`concept-${addingLink}`}
      />}
      <div ref={selectionRef} className={classes.selection} />
      <div id='concept-mapper-link-container' />
    </main>

    <section className={classes.toolbar}>
      <CourseList
        course={course} courses={courses} urlPrefix={urlPrefix} workspaceId={workspaceId}
      />
    </section>

    <Menu
      keepMounted anchorReference='anchorPosition' anchorPosition={menu.anchor}
      open={menu.open === 'concept'} onClose={closeMenu}
    >
      <MenuItem onClick={menuAddLink}>Add link</MenuItem>
      <MenuItem onClick={menuEditConcept}>Edit</MenuItem>
      <MenuItem onClick={menuDeleteConcept}>Delete</MenuItem>
      <MenuItem onClick={menuDeselectConcept}>
        {selected.current.has(menu.typeId) ? 'Deselect' : 'Select'}
      </MenuItem>
      <MenuItem onClick={menuFlipLevel}>
        Convert to {oppositeLevel[menu.state?.concept?.level]?.toLowerCase()}
      </MenuItem>
      <Divider component='li' style={{ margin: '4px 0' }} />
      <MenuItem onClick={menuDeselectAll} disabled={!selected.current.has(menu.typeId)}>
        Deselect all
      </MenuItem>
      <MenuItem onClick={menuDeleteAll} disabled={!selected.current.has(menu.typeId)}>
        Delete all
      </MenuItem>
      <MenuItem onClick={() => alert('NYI')} disabled={!selected.current.has(menu.typeId)}>
        Convert all to {oppositeLevel[menu.state?.concept?.level]?.toLowerCase()}
      </MenuItem>
    </Menu>
    <Menu
      keepMounted anchorReference='anchorPosition' anchorPosition={menu.anchor}
      open={menu.open === 'concept-link'} onClose={closeMenu}
    >
      <MenuItem onClick={menuDeleteLink}>Delete link</MenuItem>
    </Menu>
    <Menu
      keepMounted anchorReference='anchorPosition' anchorPosition={menu.anchor}
      open={menu.open === 'background'} onClose={closeMenu}
    >
      <MenuItem onClick={menuAddConcept}>Add concept</MenuItem>
    </Menu>
  </>
}

export default ConceptMapperView
