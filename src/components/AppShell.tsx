import { useState, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { appNav, appSidebarNavLabels } from '../data/mockData'
import { AppShellChatToolbarContext } from './AppShellChatToolbarContext'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'

type AppShellProps = {
  children: ReactNode
  eyebrow?: string
  mode?: 'standard' | 'chat'
  title: string
  description: string
  primaryAction?: string | false
  primaryActionTo?: string
}

const EDITOR_SIDEBAR_STORAGE_KEY = 'reeditpro:editor-sidebar-visible'
const allowedSidebarLabels = new Set<string>(appSidebarNavLabels)
const sidebarNav = appNav.filter((item) => allowedSidebarLabels.has(item.label))

function getInitialEditorSidebarVisible() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(EDITOR_SIDEBAR_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function AppShell({
  children,
  description,
  eyebrow,
  mode = 'standard',
  primaryAction = 'Create project',
  primaryActionTo = '/projects/new',
  title,
}: AppShellProps) {
  const location = useLocation()
  const isChatMode = mode === 'chat'
  const [editorSidebarVisible, setEditorSidebarVisible] = useState(getInitialEditorSidebarVisible)
  const sidebarVisible = !isChatMode || editorSidebarVisible

  function toggleEditorSidebar() {
    setEditorSidebarVisible((current) => {
      const next = !current

      try {
        window.localStorage.setItem(EDITOR_SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // Keep the in-memory toggle working even if browser storage is unavailable.
      }

      return next
    })
  }

  return (
    <AppShellChatToolbarContext.Provider
      value={{
        sidebarToggleEnabled: isChatMode,
        sidebarVisible: editorSidebarVisible,
        toggleSidebar: toggleEditorSidebar,
      }}
    >
      <div className={`app-shell ${isChatMode ? 'app-shell-chat' : ''} ${isChatMode && !editorSidebarVisible ? 'sidebar-hidden' : ''}`.trim()}>
        {sidebarVisible && (
          <aside className="sidebar" data-testid="app-sidebar">
            <BrandLogo />
            <nav aria-label="Desktop app navigation">
              {sidebarNav.map((item) => {
                const [path, hash = ''] = item.to.split('#')
                const isActive = hash
                  ? location.pathname === path && location.hash === `#${hash}`
                  : (location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects/'))) && !location.hash

                return (
                  <Link className={`sidebar-link ${isActive ? 'active' : ''}`} key={item.to + item.label} to={item.to}>
                    <item.icon aria-hidden="true" size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        )}
        <main className={`app-main ${isChatMode ? 'app-main-chat' : ''}`.trim()}>
          {!isChatMode && (
            <header className="topbar">
              <div className="topbar-copy">
                {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
              <div className="topbar-actions">
                {primaryAction ? (
                  <Button icon={Sparkles} to={primaryActionTo} variant="primary">
                    {primaryAction}
                  </Button>
                ) : null}
              </div>
            </header>
          )}
          {children}
        </main>
      </div>
    </AppShellChatToolbarContext.Provider>
  )
}
