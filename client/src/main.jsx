import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TMAProvider } from '@shared/tma/TMAProvider'
import { LanguageProvider } from '@shared/i18n/LanguageContext'
import log from 'loglevel'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    log.error('Application render error', { error: error.message, componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-error-boundary">
          <h1>কৃষি সহকারী লোড করা যায়নি</h1>
          <p>দুঃখিত, অ্যাপটি লোড করতে সমস্যা হয়েছে। পৃষ্ঠাটি আবার লোড করুন।</p>
          <button type="button" onClick={() => window.location.reload()}>
            আবার চেষ্টা করুন (Reload)
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || 'https://agri-insight-app.onrender.com/api/auth/telegram';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <TMAProvider authEndpoint={AUTH_ENDPOINT}>
          <App />
        </TMAProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
