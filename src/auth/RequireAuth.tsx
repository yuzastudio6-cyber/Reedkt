import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { buildSignInPath } from './auth-navigation'
import { ProjectPersistenceScopeProvider } from './ProjectPersistenceScopeProvider'
import { useAuthSession } from './useAuthSession'

export function RequireAuth() {
  const auth = useAuthSession()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <div aria-label="Checking ReeditPro session" aria-live="polite" className="route-loading-shell" role="status">
        <div className="route-loading-card">
          <span aria-hidden="true" className="route-loading-mark" />
          <div>
            <strong>Checking your session</strong>
            <p>Preparing the private workspace.</p>
          </div>
        </div>
      </div>
    )
  }

  if (auth.status !== 'signed_in') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate replace to={buildSignInPath(returnTo)} />
  }

  return (
    <ProjectPersistenceScopeProvider>
      <Outlet />
    </ProjectPersistenceScopeProvider>
  )
}
