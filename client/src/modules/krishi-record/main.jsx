import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TMAProvider } from '../../shared-pwa/tma/TMAProvider'

// Point to the bot's auth endpoint (proxied or absolute URL)
const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || 'http://localhost:5000/api/auth/telegram';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TMAProvider authEndpoint={AUTH_ENDPOINT}>
      <App />
    </TMAProvider>
  </StrictMode>,
)
