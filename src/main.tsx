import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthSessionProvider } from './auth/AuthSessionContext'
import { appRouterBasename } from './auth/app-base-path'
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
], {
  basename: appRouterBasename(import.meta.env.BASE_URL),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
