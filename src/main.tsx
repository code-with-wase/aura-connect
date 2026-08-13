import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

// Initialize Capacitor plugins
import { App } from '@capacitor/app'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Initialize the app
const initializeApp = async () => {
  try {
    // Keep splash screen visible
    await SplashScreen.show({
      showDuration: 0,
    })

    // Set status bar style
    await StatusBar.setStyle({ style: 'dark' })

    // Listen for app lifecycle
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App has been brought to the foreground
        console.log('App is active')
      } else {
        // App has been put in the background
        console.log('App is in background')
      }
    })

    // Listen for back button press
    App.addListener('backButtonPressed', () => {
      // Use browser's back navigation
      window.history.back()
    })

    // Hide splash screen after app is ready
    await SplashScreen.hide()
  } catch (error) {
    console.error('Error initializing app:', error)
  }
}

// Initialize the app
initializeApp()

// Create and render the router
const router = getRouter()

const rootElement = document.getElementById('root')

if (!rootElement?.innerHTML) {
  const root = ReactDOM.createRoot(rootElement!)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}
