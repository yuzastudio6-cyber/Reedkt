import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthSessionProvider } from './auth/AuthSessionContext'
import './index.css'
import App from './App.tsx'

const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthSessionProvider>
        <App />
      </AuthSessionProvider>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
