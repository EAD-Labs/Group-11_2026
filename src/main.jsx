import React, { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import Analytics from './Analytics.jsx'
import InsightsPage from './InsightsPage.jsx'
import FloatingChatWidget from './components/FloatingChatWidget.jsx'
import { canAccessRoute } from './utils/rbacGuard'

// Google OAuth Client ID (set via VITE_GOOGLE_CLIENT_ID or fallback to placeholder)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047123456789-placeholder.apps.googleusercontent.com'

function RootView() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  // Listen to browser Back / Forward events (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const isInsights = currentPath.startsWith('/insights')
  const isAnalytics = currentPath.startsWith('/analytics')

  if (isInsights) {
    // Strict RBAC Pre-Render Check
    const access = canAccessRoute('/insights')
    if (!access.allowed) {
      // Replace unauthorized history entry with '/' so browser Back doesn't re-trigger unauthorized loop
      window.history.replaceState(null, '', '/')
      return (
        <>
          <App
            initialAuthNotice={
              access.reason === 'AUTH_REQUIRED'
                ? 'Authentication Required: Please log in as an Asha Teacher or Admin to access the AI Visualizer.'
                : `Access Denied: Requires ${access.requiredRole} privileges.`
            }
          />
          <FloatingChatWidget />
        </>
      )
    }
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
