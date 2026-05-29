import { Bell, ShieldCheck } from 'lucide-react'
import { WEB_SHELL_ACTIVE_SOURCE_PATH, WEB_SHELL_CANONICAL_WEB_BOUNDARY } from '../web-shell-routes'
import { StatusBadge } from './StatusBadge'

export function TopBar() {
  return (
    <header className="web-shell-topbar">
      <div>
        <p className="web-shell-eyebrow">ReeditPro Web</p>
        <h1>Production shell</h1>
      </div>
      <div className="web-shell-topbar-actions" aria-label="Shell status">
        <StatusBadge tone="info">{WEB_SHELL_CANONICAL_WEB_BOUNDARY}</StatusBadge>
        <StatusBadge tone="warning">active source: {WEB_SHELL_ACTIVE_SOURCE_PATH}</StatusBadge>
        <button className="web-shell-icon-button" type="button" disabled title="Notifications are mock-safe in Phase 44C">
          <Bell aria-hidden="true" size={18} />
          <span className="web-shell-sr-only">Notifications disabled</span>
        </button>
        <button className="web-shell-icon-button" type="button" disabled title="Safety controls are report-only in Phase 44C">
          <ShieldCheck aria-hidden="true" size={18} />
          <span className="web-shell-sr-only">Safety report only</span>
        </button>
      </div>
    </header>
  )
}
