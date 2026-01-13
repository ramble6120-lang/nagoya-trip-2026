import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // ← 必ず './App.jsx' にする
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
