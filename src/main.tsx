import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { initializeUIPrefsStore, useUIPrefsStore } from './stores/uiPrefsStore'
import './styles/index.css'

function AppRoot() {
  const lowPowerEnabled = useUIPrefsStore((state) => state.lowPowerEnabled)

  React.useEffect(() => {
    initializeUIPrefsStore()
  }, [])

  React.useEffect(() => {
    document.documentElement.dataset.lowPower = lowPowerEnabled ? 'true' : 'false'
  }, [lowPowerEnabled])

  return (
    <MotionConfig
      key={lowPowerEnabled ? 'low' : 'normal'}
      reducedMotion={lowPowerEnabled ? 'always' : 'user'}
    >
      <App />
    </MotionConfig>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
)

