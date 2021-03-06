import { useEffect, useState } from 'react'

import client from '../../apollo/apolloClient'
import * as tmc from './tmc'
import * as google from './google'
import * as haka from './haka'
import * as guest from './guest'
import { GET_CURRENT_USER } from '../../graphql/Query'
import { LOGOUT } from '../../graphql/Mutation'
import { noReturn } from '../eventMiddleware'

class Auth {
  static idMap = new Map()

  static GUEST = new Auth('GUEST', 'guest', guest)
  static TMC = new Auth('TMC', 'mooc.fi', tmc)
  static GOOGLE = new Auth('GOOGLE', 'Google', google)
  static HAKA = new Auth('HAKA', 'Haka', haka)

  constructor(id, name, api) {
    this.id = id
    this.name = name
    this.api = api
    Auth.idMap.set(this.id, this)
  }

  isEnabled = (...args) => this.api.isEnabled(...args)
  signIn = (...args) => this.api.signIn(...args)
  signOut = (...args) => this.api.signOut(...args)
  get signInURL() { return this.api.getSignInURL() }

  static fromString = str => Auth.idMap.get(str)

  static async signOut() {
    await client.mutate({ mutation: LOGOUT })
    await client.clearStore()
    const { type } = JSON.parse(window.localStorage.currentUser || '{}')
    await Auth.fromString(type).signOut()
    window.localStorage.clear()
  }

  static async updateLocalInfo() {
    if (window.localStorage.currentUser) {
      let info
      try {
        info = await client.query({ query: GET_CURRENT_USER })
      } catch (err) {
        console.error('Auth check error:', err)
      }
      if (!info || info.data.currentUser === null) {
        await client.clearStore()
        window.localStorage.clear()
        return { type: 'logout' }
      } else {
        return { type: 'update', user: info.data.currentUser }
      }
    }
    return { type: 'noop' }
  }
}

export const useAuthState = () => {
  const [google, setGoogleLoginEnabled] = useState(window._googleAuthEnabled)
  useEffect(noReturn(() => Auth.GOOGLE.isEnabled().then(setGoogleLoginEnabled)), [])

  const [haka, setHakaLoginEnabled] = useState(window._hakaAuthEnabled)
  useEffect(noReturn(() => Auth.HAKA.isEnabled().then(setHakaLoginEnabled)), [])

  return {
    google,
    haka,
    tmc: Auth.TMC.isEnabled()
  }
}

export default Auth
