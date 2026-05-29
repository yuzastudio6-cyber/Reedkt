import type { ReactNode } from 'react'
import { RouteCrumbs } from './RouteCrumbs'
import { SafetyGateBanner } from './SafetyGateBanner'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="web-shell">
      <Sidebar />
      <div className="web-shell-main">
        <TopBar />
        <RouteCrumbs />
        <SafetyGateBanner />
        <main className="web-shell-content">{children}</main>
      </div>
    </div>
  )
}
