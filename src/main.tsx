import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

// Initialize Capacitor plugins
import { App } from '@capacitor/app'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

const isNativeApp = Boolean((window as any)?.Capacitor?.isNativePlatform?.())

function renderFallbackError(message: string) {
  const rootElement = document.getElementById('root')
  if (!rootElement) return

  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #0b1120;
      color: #f8fafc;
      font-family: Arial, sans-serif;
      text-align: center;
    ">
      <div style="max-width: 420px;">
        <h1 style="margin: 0 0 12px; font-size: 26px;">Aura Connect</h1>
        <p style="margin: 0 0 10px; font-size: 14px; opacity: 0.8;">App failed to start.</p>
        <p style="margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">${message}</p>
      </div>
    </div>
  `
}

const initializeApp = async () => {
  try {
    if (isNativeApp) {
      await SplashScreen.show({ showDuration: 0 })
      await StatusBar.setStyle({ style: 'dark' })

      if (typeof App?.addListener === 'function') {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('App is active')
          } else {
            console.log('App is in background')
          }
        })

        App.addListener('backButtonPressed', () => {
          if (window.history.length > 1) {
            window.history.back()
          } else {
            window.close?.()
          }
        })
      }
    }
  } catch (error) {
    console.error('Error initializing app:', error)
  } finally {
    try {
      if (isNativeApp && typeof SplashScreen?.hide === 'function') {
        await SplashScreen.hide()
      }
    } catch (error) {
      console.error('Error hiding splash screen:', error)
    }
  }
}

void initializeApp()

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error ?? event.message)
  renderFallbackError(event.error?.message ?? event.message ?? 'Unknown runtime error')
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  renderFallbackError(event.reason instanceof Error ? event.reason.message : String(event.reason))
})

const router = getRouter()
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found; app could not mount.')
  const fallback = document.createElement('div')
  fallback.id = 'root'
  document.body.appendChild(fallback)
}

try {
  const safeRootElement = document.getElementById('root')
  if (safeRootElement) {
    safeRootElement.innerHTML = ''
    const root = ReactDOM.createRoot(safeRootElement)
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    )
  }
} catch (error) {
  console.error('Failed to mount React app:', error)
  renderFallbackError(error instanceof Error ? error.message : 'Unknown mounting error')
}
