import type { ReactNode } from 'react'
import { Bell, ChevronDown, HardDrive, Sparkles, UserRound, Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { appNav } from '../data/mockData'
import { Badge } from './Badge'
import { BrandLogo } from './BrandLogo'
import { Button, IconButton } from './Button'
import { SearchInput } from './SearchInput'

type AppShellProps = {
  children: ReactNode
  eyebrow?: string
  title: string
  description: string
  primaryAction?: string
}

export function AppShell({ children, description, eyebrow, primaryAction = 'New project', title }: AppShellProps) {
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <BrandLogo />
        <nav aria-label="Desktop app navigation">
          {appNav.map((item) => {
            const [path, hash = ''] = item.to.split('#')
            const isActive = hash
              ? location.pathname === path && location.hash === `#${hash}`
              : (location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects/'))) && !location.hash

            return item.disabled ? (
              <button className="sidebar-link sidebar-link-disabled" disabled key={item.label} type="button">
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
                <small>Later</small>
              </button>
            ) : (
              <Link className={`sidebar-link ${isActive ? 'active' : ''}`} key={item.to + item.label} to={item.to}>
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-widget">
          <span className="widget-kicker">
            <Zap size={14} /> Personal
          </span>
          <strong>100 credits available</strong>
          <div className="storage-bar" aria-label="Storage 68 percent used">
            <span style={{ width: '68%' }} />
          </div>
          <p>68% storage used across active projects.</p>
          <Button size="sm" to="/wallet" variant="secondary">
            Open wallet
          </Button>
        </div>
        <div className="sidebar-profile">
          <span>
            <UserRound size={16} /> Tommy
          </span>
          <small>Creator workspace</small>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-copy">
            {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="topbar-actions">
            <SearchInput placeholder="Search projects, clips, edits" />
            <Badge accent="cyan">100 credits</Badge>
            <Badge accent="violet">Personal</Badge>
            <IconButton icon={Bell} label="Notifications" />
            <Button icon={Sparkles} to="/projects/new" variant="primary">
              {primaryAction}
            </Button>
            <button className="profile-button" type="button">
              <span>TP</span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>
          </div>
        </header>
        {children}
        <div className="app-footer-note">
          <HardDrive size={16} />
          Frontend-only MVP with static data. Future backend work should connect to Supabase project reeditpro.
        </div>
      </main>
    </div>
  )
}
