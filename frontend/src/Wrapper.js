import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/react-hooks'
import { CssBaseline } from '@material-ui/core'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import MomentUtils from '@date-io/moment'

import App from './App'
import client from './apollo/apolloClient'
import { LoginStateProvider, MessagingStateProvider } from './lib/store'
import FocusOverlayProvider from './components/FocusOverlay'
import InfoBoxProvider from './components/InfoBox'
import InfoSnackbar from './components/InfoSnackbar'
import { DialogProvider } from './dialogs'
import { LoadingProvider } from './components/LoadingBar'
import { IntroDialogProvider } from './dialogs/intro'
import { AlertProvider } from './dialogs/alert'
import WindowTooSmall, { MIN_WIDTH } from './views/WindowTooSmall'

const ConceptsWrapper = () => {
  const [, rerender] = useState(false)

  if (window.innerWidth < MIN_WIDTH && !window.localStorage.ignoreWindowSize) {
    return <WindowTooSmall rerender={rerender} />
  }

  return (
    <BrowserRouter>
      <ApolloProvider client={client}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <MessagingStateProvider>
            <LoginStateProvider>
              <CssBaseline />
              <InfoSnackbar />
              <AlertProvider>
                <DialogProvider>
                  <IntroDialogProvider>
                    <FocusOverlayProvider>
                      <InfoBoxProvider>
                        <LoadingProvider>
                          <App />
                        </LoadingProvider>
                      </InfoBoxProvider>
                    </FocusOverlayProvider>
                  </IntroDialogProvider>
                </DialogProvider>
              </AlertProvider>
            </LoginStateProvider>
          </MessagingStateProvider>
        </MuiPickersUtilsProvider>
      </ApolloProvider>
    </BrowserRouter>
  )
}

export default ConceptsWrapper
