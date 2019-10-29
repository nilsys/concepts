import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useQuery, useMutation, useSubscription } from 'react-apollo-hooks'
import { Typography, Paper } from '@material-ui/core'

import { useMessageStateValue } from '../../lib/store'
import useRouter from '../../lib/useRouter'
import { WORKSPACE_BY_ID } from '../../graphql/Query'
import {
  CREATE_CONCEPT, CREATE_COURSE, DELETE_CONCEPT, DELETE_COURSE, UPDATE_CONCEPT, UPDATE_COURSE,
  UPDATE_WORKSPACE
} from '../../graphql/Mutation'
import cache from '../../apollo/update'
import client from '../../apollo/apolloClient'
import {
  COURSE_CREATED_SUBSCRIPTION, COURSE_DELETED_SUBSCRIPTION, COURSE_UPDATED_SUBSCRIPTION,
  CONCEPT_CREATED_SUBSCRIPTION, CONCEPT_UPDATED_SUBSCRIPTION, CONCEPT_DELETED_SUBSCRIPTION
} from '../../graphql/Subscription'
import { useInfoBox } from '../../components/InfoBox'
import LoadingBar from '../../components/LoadingBar'
import NotFoundView from '../error/NotFoundView'
import CourseList from './CourseList'
import ConceptList from './ConceptList'

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    // For some reason, this makes the 1fr sizing work without needing to hardcode heights of other
    // objects in the parent-level grid.
    overflow: 'hidden',
    gridGap: '16px',
    gridTemplate: `"header  header"    56px
                   "courses newCourse" 1fr
                  / 1fr     1fr`,
    '@media screen and (max-width: 1312px)': {
      width: 'calc(100% - 32px)'
    }
  },
  header: {
    gridArea: 'header',
    margin: '16px 0 0',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  },
  toolbar: {
    gridArea: 'toolbar'
  },
  courses: {
    gridArea: 'courses',
    overflow: 'hidden',
    '& > div': {
      height: '100%',
      overflow: 'auto'
    }
  },
  newCourse: {
    gridArea: 'newCourse',
    overflow: 'hidden',
    '& > div': {
      height: '100%',
      overflow: 'auto'
    }
  },
  courseEditor: {
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
    overflow: 'visible'
  }
}))

const WorkspaceManagementView = ({ urlPrefix, workspaceId, courseId }) => {
  const classes = useStyles()
  const infoBox = useInfoBox()
  const { history } = useRouter()

  // SUBSCRIBE
  useSubscription(COURSE_CREATED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { createCourse: { ...subscriptionData.data.courseCreated } } }
      cache.createCourseUpdate(workspaceId)(client, res)
    }
  })

  useSubscription(COURSE_DELETED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { deleteCourse: { ...subscriptionData.data.courseDeleted } } }
      cache.deleteCourseUpdate(workspaceId)(client, res)
    }
  })

  useSubscription(COURSE_UPDATED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { updateCourse: { ...subscriptionData.data.courseUpdated } } }
      cache.updateCourseUpdate(workspaceId)(client, res)
    }
  })

  useSubscription(CONCEPT_CREATED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { createConcept: { ...subscriptionData.data.conceptCreated } } }
      cache.createConceptUpdate(workspaceId)(client, res)
    }
  })

  useSubscription(CONCEPT_DELETED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { deleteConcept: { ...subscriptionData.data.conceptDeleted } } }
      cache.deleteConceptUpdate(client, res)
      cache.deleteConceptFromByIdUpdate(client, res, workspaceId)
    }
  })

  useSubscription(CONCEPT_UPDATED_SUBSCRIPTION, {
    variables: { workspaceId },
    onSubscriptionData: ({ subscriptionData }) => {
      const res = { data: { updateConcept: { ...subscriptionData.data.conceptUpdated } } }
      cache.updateConceptUpdate(workspaceId)(client, res)
    }
  })

  useEffect(() => {
    infoBox.setView('manager')
    return () => infoBox.unsetView('manager')
  }, [infoBox])

  const [, messageDispatch] = useMessageStateValue()

  const workspaceQuery = useQuery(WORKSPACE_BY_ID, {
    variables: { id: workspaceId }
  })

  const updateWorkspace = useMutation(UPDATE_WORKSPACE, {
    update: cache.updateWorkspaceUpdate(workspaceId)
  })
  const createCourse = useMutation(CREATE_COURSE, { update: cache.createCourseUpdate(workspaceId) })
  const updateCourse = useMutation(UPDATE_COURSE, { update: cache.updateCourseUpdate(workspaceId) })
  const deleteCourse = useMutation(DELETE_COURSE, { update: cache.deleteCourseUpdate(workspaceId) })
  const createConcept = useMutation(CREATE_CONCEPT, {
    update: cache.createConceptUpdate(workspaceId)
  })
  const updateConcept = useMutation(UPDATE_CONCEPT, {
    update: cache.updateConceptUpdate(workspaceId)
  })
  const deleteConcept = useMutation(DELETE_CONCEPT, {
    update: (store, response) => {
      cache.deleteConceptUpdate(store, response)
      cache.deleteConceptFromByIdUpdate(store, response, workspaceId)
    }
  })

  if (workspaceQuery.loading) {
    return <LoadingBar id='workspace-management' />
  } else if (workspaceQuery.error) {
    return <NotFoundView message='Workspace not found' />
  }

  const e = err => messageDispatch({
    type: 'setError',
    data: err.message
  })

  const workspace = workspaceQuery.data.workspaceById
  const focusedCourse = courseId && workspace.courses.find(c => c.id === courseId)
  if (courseId && !focusedCourse) {
    history.replace(urlPrefix)
  }

  return (
    <main className={classes.root}>
      <Typography className={classes.header} variant='h4'>
        Workspace: {workspace.name}
      </Typography>
      <div className={classes.courses}>
        <CourseList
          workspace={workspace}
          setFocusedCourseId={courseId => history.push(`${urlPrefix}/${courseId}`)}
          focusedCourseId={courseId}
          updateWorkspace={args => updateWorkspace({ variables: args }).catch(e)}
          deleteCourse={id => deleteCourse({ variables: { id } }).catch(e)}
          updateCourse={args => updateCourse({ variables: args }).catch(e)}
          createCourse={args => createCourse({ variables: { workspaceId, ...args } }).catch(e)}
        />
      </div>
      <div className={classes.newCourse}>
        {focusedCourse
          ? <ConceptList
            workspace={workspaceQuery.data.workspaceById}
            course={focusedCourse}
            updateCourse={args => updateCourse({ variables: args }).catch(e)}
            createConcept={args => createConcept({
              variables: {
                workspaceId,
                courseId: focusedCourse.id,
                ...args
              }
            }).catch(e)}
            deleteConcept={id => deleteConcept({ variables: { id } }).catch(e)}
            updateConcept={args => updateConcept({ variables: args }).catch(e)}
          /> : <Paper elevation={0} />
        }
      </div>
    </main>
  )
}

export default WorkspaceManagementView
