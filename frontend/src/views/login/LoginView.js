import React, { useState } from 'react'
import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import {
  Container, Button, TextField, Typography, FormHelperText, CircularProgress, Divider
} from '@material-ui/core'
import qs from 'qs'

import { MERGE_USER } from '../../graphql/Mutation'
import Auth, { useAuthState } from '../../lib/authentication'
import { useLoginStateValue, useMessageStateValue } from '../../lib/store'
import useRouter from '../../lib/useRouter'
import HakaIcon from './HakaIcon'
import { noDefault } from '../../lib/eventMiddleware'
import LoadingBar from '../../components/LoadingBar'

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  wrapper: {
    position: 'relative',
    margin: theme.spacing(1, 0)
  },
  form: {
    marginTop: theme.spacing(1)
  },
  signInButton: {
    marginBottom: theme.spacing(0.5)
  },
  guestButton: {
    marginTop: theme.spacing(0.5)
  },
  hakaButton: {
    width: '100%',
    margin: theme.spacing(3, 0),
    display: 'block'
  },
  buttonProgress: {
    color: 'white',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  }
}))

const LoginView = () => {
  const classes = useStyles()
  const { history, location } = useRouter()

  const [{ loggedIn }, dispatch] = useLoginStateValue()
  const [, messageDispatch] = useMessageStateValue()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState(false)
  const [loadingTMC, setLoadingTMC] = useState(false)
  const [loadingGuest, setLoadingGuest] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingHaka, setLoadingHaka] = useState(false)
  const loading = loadingTMC || loadingGuest || loadingGoogle

  const { google: googleLoginEnabled, haka: hakaLoginEnabled } = useAuthState()

  const showGuestButton = Boolean(location.state)
  const nextPath = location.state ? location.state.from.pathname : '/'

  const [mergeUser] = useMutation(MERGE_USER)

  if (loadingHaka) {
    return <LoadingBar id='login-haka' />
  }

  if (location.hash?.length > 1) {
    const data = qs.parse(location.hash.substr(1))
    if (window.localStorage.connectHaka && loggedIn) {
      delete window.localStorage.connectHaka
      mergeUser({
        variables: { accessToken: data.token }
      }).then(() => history.push('/user'), err => {
        console.error('Failed to merge haka account:', err)
        setLoadingHaka(false)
        messageDispatch({
          type: 'setError',
          data: 'Failed to merge account'
        })
      })
      setLoadingHaka(true)
      return null
    }
    if (data.token) {
      data.type = 'HAKA'
      dispatch({ type: 'login', data })
      history.push(nextPath)
      return null
    }
  }

  const authenticateGoogle = async () => {
    setLoadingGoogle(true)
    try {
      const data = await Auth.GOOGLE.signIn()
      dispatch({ type: 'login', data })
      history.push(nextPath)
    } catch (err) {
      console.error(err)
      messageDispatch({
        type: 'setError',
        data: 'Google login failed'
      })
    }
    setLoadingGoogle(false)
  }

  const authenticate = noDefault(async () => {
    setLoadingTMC(true)
    try {
      const data = await Auth.TMC.signIn({ email, password })
      dispatch({ type: 'login', data })
      history.push(nextPath)
    } catch {
      setError(true)
      setTimeout(() => {
        setError(false)
      }, 4000)
    }
    setLoadingTMC(false)
  })

  const createGuestAccount = noDefault(async () => {
    setLoadingGuest(true)
    try {
      const data = await Auth.GUEST.signIn()
      await dispatch({ type: 'login', data })
      history.push(nextPath)
    } catch {
      messageDispatch({ type: 'setError', data: 'Failed to create guest account' })
    }
    setLoadingGuest(false)
  })

  return (
    <Container component='main' maxWidth='xs'>
      {Auth.TMC.isEnabled() && <div className={classes.paper}>
        <Typography component='h1' variant='h5'>
          Sign in with <a href='https://www.mooc.fi/en/sign-up'>mooc.fi account</a>
        </Typography>

        <form
          className={classes.form}
          onSubmit={!loading ? authenticate : () => { }}
          noValidate
        >
          <TextField
            error={error}
            variant='outlined'
            margin='normal'
            required
            fullWidth
            label='email or username'
            name='email'
            autoComplete='email'
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            autoFocus
          />

          <TextField
            error={error}
            variant='outlined'
            margin='normal'
            required
            fullWidth
            name='password'
            label='password'
            type='password'
            autoComplete='current-password'
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <FormHelperText error={error}>
            {error ? 'Invalid username or password.' : null}
          </FormHelperText>
          <div className={classes.wrapper}>
            <Button
              className={classes.signInButton}
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
            >
              {!loadingTMC ? 'Sign In' : '\u00A0'}
            </Button>
            {loadingTMC && <CircularProgress size={24} className={classes.buttonProgress} />}
          </div>
        </form>
      </div>}
      {hakaLoginEnabled && <>
        <Divider />
        <div className={classes.wrapper}>
          <a className={classes.hakaButton} href={Auth.HAKA.signInURL}>
            <HakaIcon />
          </a>
        </div>
      </>}
      {googleLoginEnabled && <>
        <Divider />
        <div className={classes.wrapper}>
          <Button
            className={classes.googleButton}
            type='button'
            fullWidth
            variant='contained'
            color='primary'
            onClick={!loading ? authenticateGoogle : () => { }}
          >
            {!loadingGoogle ? 'Sign In with Google' : '\u00A0'}
          </Button>
          {loadingGoogle && <CircularProgress size={24} className={classes.buttonProgress} />}
        </div>
      </>}
      {showGuestButton && <>
        <Divider />
        <div className={classes.wrapper}>
          <Button
            className={classes.guestButton}
            type='button'
            fullWidth
            variant='contained'
            color='primary'
            onClick={!loading ? createGuestAccount : () => { }}
          >
            {!loadingGuest ? 'Continue as guest' : '\u00A0'}
          </Button>
          {loadingGuest && <CircularProgress size={24} className={classes.buttonProgress} />}
        </div>
      </>}
    </Container>
  )
}

export default LoginView
