import React, { useRef } from 'react'
import { useQuery } from 'react-apollo-hooks'
import { makeStyles, Menu, MenuItem } from '@material-ui/core'

import { ConceptLink } from './concept'
import { LINKS_IN_COURSE } from '../../graphql/Query'

const useStyles = makeStyles({
  root: {
    display: 'grid',
    // For some reason, this makes the 1fr sizing work without needing to hardcode heights of other
    // objects in the parent-level grid.
    overflow: 'hidden',
    gridTemplate: `"traySpacer traySpacer contentHeader activeHeader" 42px
                   "courseTray trayButton courses       activeCourse" 1fr
                  / 0          64px       8fr           3fr`,
    '&$courseTrayOpen': {
      gridTemplateColumns: '3fr 64px 7fr 3fr'
    },
    '@media screen and (max-width: 1999px)': {
      gridTemplateColumns: '0 64px 6fr 3fr',
      '&$courseTrayOpen': {
        gridTemplateColumns: '3fr 64px 5fr 3fr'
      }
    },
    '@media screen and (max-width: 1499px)': {
      gridTemplateColumns: '0 64px 4fr 3fr',
      '&$courseTrayOpen': {
        gridTemplateColumns: '3fr 64px 3fr 3fr'
      }
    }
  },
  courseTrayOpen: {},
  conceptLinkFlash: {
    animation: '$flash 3s'
  },
  '@keyframes flash': {
    '0%': { borderTopColor: '#f50057' },
    '25%': { borderTopColor: '#f50057' },
    '100%': { borderTopColor: 'rgba(117, 117, 117, 0.1)' }
  },
  conceptLinkWrapperFlash: {
    '&:before': {
      animation: '$flashWrapper 3s'
    }
  },
  '@keyframes flashWrapper': {
    '0%': { borderRightColor: 'red' },
    '25%': { borderRightColor: 'red' },
    '100%': { borderRightColor: '#f1f1f1' }
  }
})

const MapperLinks = ({
  courseId, flashingLink, addingLink, focusedConceptIds, conceptLinkMenu, courseLinkMap,
  collapsedCourseIds, handleMenuOpen, handleMenuClose, deleteLink
}) => {
  const classes = useStyles()
  const conceptLinkMenuRef = useRef()

  const linkQuery = useQuery(LINKS_IN_COURSE, {
    variables: { courseId }
  })

  const showLink = link => courseLinkMap.has(link.from.course.id)
    && !collapsedCourseIds.has(link.from.course.id)

  return <div style={{ display: 'contents' }}>
    {linkQuery.data.linksInCourse?.concepts.map(concept =>
      concept.linksToConcept.map(link => showLink(link) &&
        <ConceptLink
          key={`concept-link-${link.id}`} delay={1}
          active={flashingLink === link.id || (!addingLink && (
            focusedConceptIds.has(concept.id) || focusedConceptIds.has(link.from.id)
          ))}
          linkId={link.id}
          to={`concept-circle-active-${concept.id}`} from={`concept-circle-${link.from.id}`}
          toConceptId={concept.id} fromConceptId={link.from.id}
          fromAnchor='center middle' toAnchor='center middle' onContextMenu={handleMenuOpen}
          posOffsets={{ x0: -6, x1: +5 }}
          classes={flashingLink === link.id && !focusedConceptIds.has(concept.id)
          && !focusedConceptIds.has(link.from.id)
            ? {
              line: classes.conceptLinkFlash,
              wrapper: classes.conceptLinkWrapperFlash
            }
            : {}
          }
        />
      )
    )}
    <div ref={conceptLinkMenuRef} style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      top: `${conceptLinkMenu ? conceptLinkMenu.y : -1}px`,
      left: `${conceptLinkMenu ? conceptLinkMenu.x : -1}px`
    }} />
    <Menu
      anchorEl={conceptLinkMenuRef.current}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left'
      }}
      open={Boolean(conceptLinkMenu) && Boolean(conceptLinkMenuRef.current)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={deleteLink}>Delete link</MenuItem>
    </Menu>
    {addingLink && <ConceptLink
      active within={document.body} // This needs to be directly in body to work
      from={addingLink.type === 'concept-circle' && `${addingLink.type}-${addingLink.id}`}
      to={addingLink.type === 'concept-circle-active' && `${addingLink.type}-${addingLink.id}`}
      followMouse posOffsets={{
        x0: addingLink.type === 'concept-circle-active' ? -7 : 0,
        x1: addingLink.type === 'concept-circle' ? 7 : 0
      }}
    />}
  </div>
}

export default MapperLinks
