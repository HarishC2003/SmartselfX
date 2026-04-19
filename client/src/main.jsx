import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1E293B',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '14px'
        },
        success: { iconTheme: { primary: '#22C55E', secondary: '#1E293B' } },
        error:   { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } }
      }}
    />
  </StrictMode>,
)
