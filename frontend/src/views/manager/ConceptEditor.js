import React, { useRef, useState } from 'react'
import {
  Button, Checkbox, FormControl, FormControlLabel,
  TextField
} from '@material-ui/core'
import Select from 'react-select/creatable'
import Autocomplete from '@material-ui/lab/Autocomplete'

import { useLoginStateValue } from '../../lib/store'
import {
  backendToSelect, selectToBackend, onTagCreate, tagSelectStyles
} from '../../dialogs/tagSelectUtils'
import { Role } from '../../lib/permissions'
import useStyles from './editorStyles'

const initialState = {
  name: '',
  description: '',
  tags: [],
  bloomTag: '',
  official: undefined,
  frozen: undefined
}

const ConnectableSubmitButton = ({ disabled, ref, action }) => {
  const classes = useStyles()

  return (
    <Button
      color='primary'
      variant='contained'
      disabled={disabled}
      type='submit'
      ref={ref}
      className={classes.submit}
    >
      { action }
    </Button>
  )
}

const ConnectableTextfield = ({ value, name, label, inputRef, onChange, autoFocus, ref }) => {
  const classes = useStyles()

  return <TextField
    className={classes.textfield}
    variant='outlined'
    margin='dense'
    name={name}
    label={label}
    type='text'
    value={value}
    fullWidth
    inputRef={inputRef}
    onChange={onChange}
    autoFocus={autoFocus}
    ref={ref}
  />
}

const StaffOnly = ({ children }) => {
  const [{ user }] = useLoginStateValue()
  return user.role >= Role.STAFF && children
}

const conceptsToSelect = concepts => concepts ? concepts.map(concept => ({
  value: concept.id,
  label: concept.name,
  id: concept.id
})) : []

const ConceptEditor = ({
  submit,
  cancel,
  action,
  tagOptions,
  defaultValues = {},
  workspace
}) => {
  const classes = useStyles()
  const [input, setInput] = useState({
    ...initialState,
    ...defaultValues,
    tags: defaultValues.tags ? backendToSelect(defaultValues.tags) : []
  })

  const nameRef = useRef()
  const selectRef = useRef(null)

  const onSubmit = evt => {
    evt.preventDefault()
    delete input.bloomTag
    submit({
      ...input,
      tags: selectToBackend(input.tags)
    })
    if (action === 'Create') {
      nameRef.current.focus()
      setInput({ ...initialState, ...defaultValues })
    }
  }

  const onKeyDown = evt => {
    if (cancel && evt.key === 'Escape') {
      cancel()
    }
  }

  const onChange = evt => setInput({ ...input, [evt.target.name]: evt.target.value })

  console.log('hello')
  return (
    <form
      className={classes.form}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
    >
      <Autocomplete
        id='common-concept-complete'
        freeSolo
        options={workspace.commonConcepts.map(concept => concept.name)}
        renderInput={params =>
          <TextField {...params} label='freeSolo' margin='normal' variant='outlined' fullWidth />
        }
      />
      <ConnectableTextfield
        name='name'
        label={`${input.level.toTitleCase()} name`}
        autoFocus={action !== 'Create'}
        inputRef={nameRef}
        onChange={onChange}
        value={input.name}
      />
      <ConnectableTextfield
        name='description'
        label={`${input.level.toTitleCase()} description`}
        onChange={onChange}
        value={input.description}
      />
      <Select
        onChange={selected => setInput({ ...input, tags: selected || [] })}
        onCreateOption={newOption => setInput({
          ...input,
          tags: [...input.tags, onTagCreate(newOption)]
        })}
        styles={tagSelectStyles}
        options={tagOptions}
        value={input.tags}
        isMulti
        placeholder='Select tags...'
        menuPlacement='auto'
        ref={element => {
          if (action === 'Create' && element?.select?.select) {
            selectRef.current = element.select.select
          }
        }}
        menuPortalTarget={document.body}
      />
      <ConnectableSubmitButton disabled={!input.name} action={action} />
      {cancel &&
        <Button color='primary' variant='contained' onClick={cancel} className={classes.cancel}>
          Cancel
        </Button>
      }

      <StaffOnly>
        <FormControl className={classes.formControl}>
          <FormControlLabel
            control={
              <Checkbox
                checked={input.official}
                onChange={evt => setInput({ ...input, official: evt.target.checked })}
                value='official'
                color='primary'
              />
            }
            label='Official'
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormControlLabel
            control={
              <Checkbox
                checked={input.frozen}
                onChange={evt => setInput({ ...input, frozen: evt.target.checked })}
                value='frozen'
                color='primary'
              />
            }
            label='Frozen'
          />
        </FormControl>
      </StaffOnly>
    </form>
  )
}

export default ConceptEditor
