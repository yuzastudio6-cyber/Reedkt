import type { ReactNode } from 'react'
import { LogOut, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthSession } from '../auth/useAuthSession'
import { appNav } from '../data/productContent'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'

type AppShellProps = {
  children: ReactNode
  chrome?: 'standard' | 'editor'
  eyebrow?: string
  title: string
  description: string
  primaryAction?: string | false
}

export function AppShell({
  children,
  chrome = 'standard',
  description,
  eyebrow,
  primaryAction = 'Create project',
  title,
}: AppShellProps) {
  const auth = useAuthSession()
  const location = useLocation()
  const showStandardChrome = chrome === 'standard'
  const identityLabel = auth.identity?.displayName ?? auth.identity?.email ?? 'Signed-in user'
  const identityDetail = auth.identity?.email ?? (auth.mode === 'local_test' ? 'Local test session' : 'Verified session')

  return (
    <div className={`app-shell app-shell-${chrome}`} data-testid="app-shell">
      <aside className="sidebar" data-testid="app-sidebar">
        <BrandLogo />
        <nav aria-label="Desktop app navigation">
          {appNav.map((item) => {
            const [path, hash = ''] = item.to.split('#')
            const isActive = hash
              ? location.pathname === path && location.hash === `#${hash}`
              : (location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects/'))) && !location.hash

            return item.disabled ? (
              <button aria-disabled="true" className="sidebar-link sidebar-link-disabled" disabled key={item.label} type="button">
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
                <small>Later</small>
              </button>
            ) : (
              <Link aria-current={isActive ? 'page' : undefined} className={`sidebar-link ${isActive ? 'active' : ''}`} key={item.to + item.label} to={item.to}>
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <section aria-label="Current session" className="sidebar-auth" data-testid="app-session-identity">
          <div className="sidebar-auth-identity">
            <span aria-hidden="true" className="sidebar-auth-avatar">
              {identityLabel.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{identityLabel}</strong>
              <small>{identityDetail}</small>
            </div>
          </div>
          <span className="sidebar-auth-mode">
            {auth.mode === 'local_test' ? 'Test session' : 'Supabase session'}
          </span>
          <Button
            className="sidebar-auth-signout"
            data-unsaved-navigation="true"
            icon={LogOut}
            onClick={() => { void auth.signOut() }}
            size="sm"
            variant="ghost"
          >
            Sign out
          </Button>
        </section>
      </aside>
      <main className="app-main" data-testid="app-main">
        {showStandardChrome && (
          <header className="topbar">
            <div className="topbar-copy">
              {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <div className="topbar-actions">
              {primaryAction && (
                <Button icon={Plus} to="/projects/new" variant="primary">
                  {primaryAction}
                </Button>
              )}
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  )
}
