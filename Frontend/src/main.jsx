import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initStoredPreferences } from './utils/theme.js'

// Restore saved theme/compact preferences before first render
// so the UI never flashes with the wrong theme.
initStoredPreferences()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)