import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsconfig from './aws-exports'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'

// Configure Amplify
Amplify.configure(awsconfig)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
