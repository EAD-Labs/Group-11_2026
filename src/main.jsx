import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Analytics from './Analytics.jsx'
import InsightsPage from './InsightsPage.jsx'
import FloatingChatWidget from './components/FloatingChatWidget.jsx'

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
    <RootView />
  </StrictMode>,
)
