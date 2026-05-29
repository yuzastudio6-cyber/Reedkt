import {
  Activity,
  BriefcaseBusiness,
  FolderKanban,
  Gauge,
  Home,
  Inbox,
  Library,
  MonitorCog,
  PanelTop,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { webShellNavigationSections } from '../web-shell-navigation'
import type { WebShellRouteId } from '../web-shell-types'

const routeIcons: Partial<Record<WebShellRouteId, LucideIcon>> = {
  home: Home,
  projects: FolderKanban,
  project_intake: Inbox,
  project_overview: BriefcaseBusiness,
  editor_workspace: PanelTop,
  job_queue: Activity,
  artifact_library: Library,
  system_readiness: Gauge,
  compute_routes: MonitorCog,
  settings: Settings,
}

export function Sidebar() {
  return (
    <aside className="web-shell-sidebar" aria-label="Primary navigation">
      <div className="web-shell-brand">
        <span className="web-shell-brand-mark">RP</span>
        <div>
          <strong>ReeditPro</strong>
          <span>Web-first shell</span>
        </div>
      </div>
      <nav className="web-shell-nav">
        {webShellNavigationSections.map((section) => (
          <section key={section.label} className="web-shell-nav-section">
            <p>{section.label}</p>
            {section.items.map((item) => {
              const Icon = routeIcons[item.routeId] ?? Home
              return (
                <NavLink
                  key={item.routeId}
                  className={({ isActive }) => `web-shell-nav-link${isActive ? ' active' : ''}`}
                  title={item.description}
                  to={item.href}
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </section>
        ))}
      </nav>
      <div className="web-shell-sidebar-note">
        <strong>Desktop deferred</strong>
        <span>No Tauri, Electron, local worker, or hardware scan in Phase 44C.</span>
      </div>
    </aside>
  )
}
