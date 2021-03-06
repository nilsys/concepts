import React, { useEffect } from 'react'
import { makeStyles, IconButton, Tooltip } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { HelpOutline as HelpIcon } from '@material-ui/icons'

import { Role } from '../../lib/permissions'
import { WORKSPACES_FOR_USER, PROJECTS_FOR_USER } from '../../graphql/Query'
import WorkspaceList from './WorkspaceList'
import ProjectList from './ProjectList'
import LoadingBar from '../../components/LoadingBar'
import { useInfoBox } from '../../components/InfoBox'
import NotFoundView from '../error/NotFoundView'

const useStyles = makeStyles(() => ({
  root: {
    display: 'grid',
    gridTemplate: `"workspaces gap  projects" 1fr
                  / 1fr        16px 1fr`,
    width: '1440px',
    '@media screen and (max-width: 1472px)': {
      width: 'calc(100% - 32px)'
    },
    gridArea: 'content / content / bottom-navbar / bottom-navbar',
    overflow: 'hidden',
    margin: '6px auto 16px',
    '&:not(.staff):not(.admin)': {
      gridTemplateColumns: '1fr 0 0',
      width: '720px',
      '@media screen and (max-width: 752px)': {
        width: 'calc(100% - 32px)'
      }
    }
  },
  helpButton: {
    position: 'absolute',
    right: 20,
    bottom: 20
  }
}))

const UserViewContent = ({ user }) => {
  const workspaceQuery = useQuery(WORKSPACES_FOR_USER)

  const projectQuery = useQuery(PROJECTS_FOR_USER, {
    skip: user.role < Role.STAFF
  })

  const classes = useStyles()
  const infoBox = useInfoBox()

  useEffect(() => {
    infoBox.setView('home')
    return () => infoBox.unsetView('home')
  }, [infoBox])

  if (workspaceQuery.loading || (user.role >= Role.STAFF && projectQuery.loading)) {
    return <LoadingBar id='main-view' />
  } else if (workspaceQuery.error || projectQuery.error) {
    return <NotFoundView message='Failed to get workspace list' />
  }

  return (
    <main className={`${classes.root} ${user.role.toLowerCase()}`}>
      <WorkspaceList
        workspaces={workspaceQuery.data.workspacesForUser.map(ws => ws.workspace)
          .filter(workspace => !workspace.asTemplate)}
        urlPrefix='/workspaces'
      />
      {user.role >= Role.STAFF &&
        <ProjectList projects={projectQuery.data.projectsForUser.map(p => p.project)} />
      }
      <Tooltip title='View tutorial for this view' placement='top'>
        <IconButton className={classes.helpButton} onClick={infoBox.open}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </main>
  )
}

export default UserViewContent
