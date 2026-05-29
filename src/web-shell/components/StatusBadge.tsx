import type { ReactNode } from 'react'
import type { WebShellSafetyTone } from '../web-shell-types'

interface StatusBadgeProps {
  children: ReactNode
  tone?: WebShellSafetyTone
}

export function StatusBadge({ children, tone = 'info' }: StatusBadgeProps) {
  return <span className={`web-shell-status web-shell-status-${tone}`}>{children}</span>
}
