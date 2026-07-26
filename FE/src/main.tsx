import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
/**
 * Composes the frontend application shell, global providers, and top-level navigation.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
