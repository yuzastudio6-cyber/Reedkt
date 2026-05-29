import { webShellSafetyPolicy } from '../web-shell-policy'
import { StatusBadge } from './StatusBadge'

export function SafetyGateBanner() {
  return (
    <aside className="web-shell-safety-banner" aria-label="Current safety gates">
      <div>
        <p className="web-shell-eyebrow">Staging/private-test posture</p>
        <h2>Execution controls are gated while the web shell takes shape.</h2>
      </div>
      <div className="web-shell-banner-badges">
        <StatusBadge tone="blocked">Production blocked</StatusBadge>
        <StatusBadge tone="blocked">External beta blocked</StatusBadge>
        <StatusBadge tone="blocked">Broad real media blocked</StatusBadge>
        <StatusBadge tone="warning">Cloud execution gated</StatusBadge>
        <StatusBadge tone="future">Local compute deferred</StatusBadge>
      </div>
      <ul className="web-shell-compact-list">
        {webShellSafetyPolicy.notes.slice(0, 4).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </aside>
  )
}
