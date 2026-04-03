import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename ต้องตรงกับ base ใน vite.config.js และ nginx location */}
    <BrowserRouter basename="/phatsadu">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
