import React, { createContext, useContext, useReducer } from 'react'

export const LoginStateContext = createContext(false)
export const MessageStateContext = createContext('')

const loginReducers = {
  login: (state, { data }) => ({ ...state, loggedIn: true, user: data }),
  logout: state => ({ ...state, loggedIn: false, user: {} }),
  setUserGuideProgress: (state, { data }) => ({
    ...state,
    user: {
      ...state.user,
      ...data
    }
  })
}

const loginReducer = (state, action) => loginReducers[action.type](state, action)

let user
try {
  user = JSON.parse(window.localStorage.currentUser).user
} catch (error) {}
const loggedIn = Boolean(user)

export const LoginStateProvider = ({ children }) => (
  <LoginStateContext.Provider value={useReducer(loginReducer, { user, loggedIn })}>
    {children}
  </LoginStateContext.Provider>
)

const messageReducers = {
  setError: (state, { data }) => ({ ...state, error: data }),
  clearError: state => ({ ...state, error: '' }),
  setNotification: (state, { data }) => ({ ...state, notification: data }),
  clearNotification: state => ({ ...state, notification: '' })
}

const messageReducer = (state, action) => messageReducers[action.type](state, action)

export const MessagingStateProvider = ({ children }) => (
  <MessageStateContext.Provider value={useReducer(messageReducer, { error: '', notification: '' })}>
    {children}
  </MessageStateContext.Provider>
)

export const useMessageStateValue = () => useContext(MessageStateContext)
export const useLoginStateValue = () => useContext(LoginStateContext)
