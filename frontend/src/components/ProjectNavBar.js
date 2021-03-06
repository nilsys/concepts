import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import {
  BottomNavigation, BottomNavigationAction, Paper, IconButton, Menu, MenuItem, ListItemIcon, Tooltip
} from '@material-ui/core'
import {
  Shuffle as ShuffleIcon, Delete as DeleteIcon, Edit as EditIcon, Group as GroupIcon,
  MoreVert as MoreVertIcon, Share as ShareIcon, Timelapse as TimelapseIcon, HelpOutline as HelpIcon,
  Equalizer as EqualizerIcon
} from '@material-ui/icons'

import { Privilege } from '../lib/permissions'
import { PROJECT_BY_ID, PROJECTS_FOR_USER } from '../graphql/Query'
import { DELETE_PROJECT } from '../graphql/Mutation'
import { useMessageStateValue, useLoginStateValue } from '../lib/store'
import { useShareDialog } from '../dialogs/sharing'
import useEditProjectDialog from '../dialogs/project/useEditProjectDialog'
import useRouter from '../lib/useRouter'
import { useInfoBox } from './InfoBox'
import { useConfirmDelete } from '../dialogs/alert'

const useStyles = makeStyles({
  root: {
    gridArea: 'bottom-navbar',
    display: 'flex',
    justifyContent: 'space-between'
  },
  leftPlaceholder: {
    width: '56px',
    height: '56px'
  },
  navbar: {
    flex: 1,
    zIndex: 2
  },
  menuButton: {
    width: '56px',
    height: '56px'
  }
})

const ProjectNavBar = ({ page, projectId, urlPrefix }) => {
  const classes = useStyles()
  const { history } = useRouter()
  const [{ user }] = useLoginStateValue()
  const [, messageDispatch] = useMessageStateValue()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const infoBox = useInfoBox()
  const confirmDelete = useConfirmDelete()

  const projectQuery = useQuery(PROJECT_BY_ID, {
    variables: { id: projectId }
  })

  const [deleteProject] = useMutation(DELETE_PROJECT, {
    refetchQueries: [
      { query: PROJECTS_FOR_USER }
    ]
  })

  const openEditProjectDialog = useEditProjectDialog(projectId)
  const openShareProjectDialog = useShareDialog('project')

  const handleEditOpen = () => {
    setMenuAnchor(null)
    openEditProjectDialog(projectId, projectQuery.data.projectById.name)
  }

  const handleShareOpen = () => {
    setMenuAnchor(null)
    openShareProjectDialog(projectId, Privilege.EDIT)
  }

  const handleDelete = async () => {
    setMenuAnchor(null)

    const confirm = await confirmDelete(
      'Are you sure you want to delete this project?',
      {
        checkboxes: [{
          name: 'Also delete ALL related workspaces',
          id: 'deleteWorkspaces',
          default: false
        }]
      })
    if (!confirm.ok) {
      return
    }
    try {
      await deleteProject({
        variables: {
          id: projectId,
          deleteWorkspaces: confirm.deleteWorkspaces
        }
      })
    } catch {
      messageDispatch({
        type: 'setError',
        data: 'Failed to delete project'
      })
      setTimeout(() => messageDispatch({ type: 'clearError' }), 2000)
    }

    history.push('/')
  }

  const onChange = (event, newPage) => {
    history.push(`${urlPrefix}/${projectId}/${newPage}`)
  }

  const isOwner = Privilege.fromString(
    projectQuery.data?.projectById.participants.find(pcp => pcp.user.id === user.id)?.privilege
  ) === Privilege.OWNER

  return (
    <Paper component='footer' className={classes.root} square>
      <div className={classes.leftPlaceholder} />
      <BottomNavigation showLabels value={page} onChange={onChange} className={classes.navbar}>
        <BottomNavigationAction
          value='overview'
          label='Project overview'
          icon={<ShuffleIcon />}
        />
        <BottomNavigationAction
          value='statistics'
          label='Statistics'
          icon={<EqualizerIcon />}
        />
        <BottomNavigationAction
          value='points'
          label='Points'
          icon={<TimelapseIcon />}
        />
        {isOwner && <BottomNavigationAction
          value='members'
          label='Members'
          icon={<GroupIcon />}
        />}
      </BottomNavigation>
      <Tooltip title='Open the tutorial for this view' placement='top'>
        <IconButton
          className={classes.menuButton} onClick={infoBox.open}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
      <IconButton
        onClick={evt => setMenuAnchor(evt.currentTarget)}
        className={classes.menuButton}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}>
        {
          projectQuery.data?.projectById.participants.find(p =>
            p.user.id === user.id && Privilege.fromString(p.privilege) === Privilege.OWNER) &&
          <MenuItem aria-label='Share link' onClick={handleShareOpen}>
            <ListItemIcon>
              <ShareIcon />
            </ListItemIcon>
            Share link
          </MenuItem>
        }
        <MenuItem aria-label='Delete' onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          Delete
        </MenuItem>
        <MenuItem aria-label='Edit' onClick={handleEditOpen}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          Edit
        </MenuItem>
      </Menu>
    </Paper>
  )
}

export default ProjectNavBar
