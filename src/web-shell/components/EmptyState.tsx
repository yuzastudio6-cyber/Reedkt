import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  children: ReactNode
}

export function EmptyState({ children, title }: EmptyStateProps) {
  return (
    <section className="web-shell-empty">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  )
}
