import React, { useState, useEffect } from 'react'

//  dialog
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

// Materal common
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

// Error dispatcher
import { useErrorStateValue } from '../../store'

const WorkspaceEditingDialog = ({ state, handleClose, updateProject, defaultName }) => {
  const [name, setName] = useState('')

  const errorDispatch = useErrorStateValue()[1]

  useEffect(() => {
    setName(defaultName)
  }, [defaultName])

  const handleEdit = async (e) => {
    if (name === '') {
      window.alert('Project needs a name!')
      return
    }
    try {
      if (defaultName !== name) {
        await updateProject({
          variables: {
            id: state.id,
            name
          }
        })
      }
      setName('')
      handleClose()
    } catch (err) {
      errorDispatch({
        type: 'setError',
        data: 'Access denied'
      })
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      handleEdit(e)
    }
  }

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Edit project</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Projects are used to manage the creation of workspaces
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          onKeyPress={handleKey}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
          </Button>
        <Button onClick={handleEdit} color="primary">
          Save
          </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WorkspaceEditingDialog