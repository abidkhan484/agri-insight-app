import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TMAProvider } from '@shared/tma/TMAProvider'
import { LanguageProvider } from '@shared/i18n/LanguageContext'
import { LanguageText } from '@shared/i18n/LanguageContext'
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
          <h1><LanguageText bn="কৃষি সহকারী লোড করা যায়নি" en="Agriculture Assistant could not load" /></h1>
          <p><LanguageText bn="দুঃখিত, অ্যাপটি লোড করতে সমস্যা হয়েছে। পৃষ্ঠাটি আবার লোড করুন।" en="Sorry, the app encountered a problem. Reload the page." /></p>
          <button type="button" onClick={() => window.location.reload()}>
            <LanguageText bn="আবার চেষ্টা করুন" en="Reload" />
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || '/api/auth/telegram';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AppErrorBoundary>
        <TMAProvider authEndpoint={AUTH_ENDPOINT}>
          <App />
        </TMAProvider>
      </AppErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)
