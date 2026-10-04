import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import Analytics from './Analytics.jsx'
import InsightsPage from './InsightsPage.jsx'
import FloatingChatWidget from './components/FloatingChatWidget.jsx'

// Google OAuth Client ID (set via VITE_GOOGLE_CLIENT_ID or fallback to placeholder)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047123456789-placeholder.apps.googleusercontent.com'

// Simple path-based view switch — no router needed.
const path = window.location.pathname
const isInsights = path.startsWith('/insights')
const isAnalytics = path.startsWith('/analytics')

function RootView() {
  if (isInsights) {
    return <InsightsPage />
  }
  if (isAnalytics) {
    return (
      <>
        <Analytics />
        <FloatingChatWidget />
      </>
    )
  }
  return (
    <>
      <App />
      <FloatingChatWidget />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RootView />
    </GoogleOAuthProvider>
  </StrictMode>,
)
