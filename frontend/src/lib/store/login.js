import React, { createContext, useContext, useReducer } from 'react'

import { Role } from '../permissions'
import Auth from '../authentication'
import { changeSubscriptionToken } from '../../apollo/apolloClient'

export const LoginStateContext = createContext(false)

const fixRole = user => ({
  ...user,
  role: typeof user.role === 'string' ? Role.fromString(user.role) : user.role
})

const fixData = data => ({
  ...data,
  type: typeof data.type === 'string' ? Auth.fromString(data.type) : data.type,
  user: { ...fixRole(data.user) }
})

const updateSeenGuides = (data, newSeenGuides) => ({
  ...data,
  user: { ...data.user, seenGuides: newSeenGuides }
})

const loginReducers = {
  noop: state => state,
  login: (state, { data }) => {
    window.localStorage.currentUser = JSON.stringify({
      ...data
    })
    changeSubscriptionToken(data.token)
    return {
      loggedIn: true,
      ...fixData(data)
    }
  },
  guideSeen: (state, { data }) => {
    if (data.newSeenGuides) {
      const userData = fixData(JSON.parse(window.localStorage.currentUser))
      window.localStorage.currentUser = JSON
        .stringify(updateSeenGuides(userData, data.newSeenGuides))
    }
    return {
      ...state,
      user: {
        ...state.user,
        seenGuides: [...state.user.seenGuides || [], data.guide]
      }
    }
  },
  update: (state, { user }) => {
    window.localStorage.currentUser = JSON.stringify({
      token: state.token,
      displayname: state.displayname,
      type: state.type.id,
      user
    })
    return { ...state, user: fixRole(user) }
  },
  logout: () => {
    changeSubscriptionToken('')
    return { loggedIn: false, displayname: null, type: null, user: {} }
  }
}

const loginReducer = (state, action) => loginReducers[action.type](state, action)

let userData
try {
  userData = fixData(JSON.parse(window.localStorage.currentUser))
} catch (error) {
  userData = {}
}
userData.loggedIn = Boolean(userData.user)

export const LoginStateProvider = ({ children }) => (
  <LoginStateContext.Provider value={useReducer(loginReducer, userData)}>
    {children}
  </LoginStateContext.Provider>
)

export const useLoginStateValue = () => useContext(LoginStateContext)
