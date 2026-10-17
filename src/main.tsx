import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
    },
    secondary: {
      main: '#f59e0b',
    },
    success: {
      main: '#0f766e',
    },
    background: {
      default: '#f5f7ff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
