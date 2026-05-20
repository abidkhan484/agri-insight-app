import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TMAProvider } from '@shared/tma/TMAProvider'

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || 'https://agri-bot.onrender.com/api/auth/telegram';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TMAProvider authEndpoint={AUTH_ENDPOINT}>
      <App />
    </TMAProvider>
  </StrictMode>,
)
