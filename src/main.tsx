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

const router = getRouter()
const rootElement = document.getElementById('root')

if (rootElement) {
  rootElement.innerHTML = ''
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
} else {
  console.error('Root element not found; app could not mount.')
}
