import type { ReactNode } from 'react'
import type { Accent } from '../data/productContent'

type BadgeProps = {
  children: ReactNode
  accent?: Accent | 'muted'
}

export function Badge({ children, accent = 'muted' }: BadgeProps) {
  return <span className={`rp-badge rp-badge-${accent}`}>{children}</span>
}
