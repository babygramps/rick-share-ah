import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsconfig from './aws-exports'
import './index.css'
import App from './App.tsx'

// Configure Amplify
Amplify.configure(awsconfig)

// One-off: expose legacy-expense backfill in dev. Remove once run.
if (import.meta.env.DEV) {
  import('./devtools/backfillLegacyExpenses').then((m) => {
    ;(window as unknown as { __backfillLegacyExpenses: typeof m.backfillLegacyExpenses }).__backfillLegacyExpenses = m.backfillLegacyExpenses
    console.info('[devtools] run __backfillLegacyExpenses() in the console to backfill legacy CSV expenses.')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
