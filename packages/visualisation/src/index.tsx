import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import 'moment-duration-format'
import { ThemeProvider, createTheme } from '@mui/material'
import { IoProvider } from 'socket.io-react-hook'

const darkTheme = createTheme({
  overrides: {
    MuiStepIcon: {
      root: {
        '&$completed': {
          color: 'pink',
        },
        '&$active': {
          color: 'red',
        },
      },
      active: {},
      completed: {},
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#10c57b',
    },
  },
})

ReactDOM.render(
  <IoProvider>
    <ThemeProvider theme={darkTheme}>
      <App />
    </ThemeProvider>
  </IoProvider>,
  document.getElementById('root')
)
