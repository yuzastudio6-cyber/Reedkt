import type { ReactNode } from 'react'

type ChatThreadProps = {
  children: ReactNode
  label?: string
  role?: 'log' | 'region'
}

export function ChatThread({ children, label = 'AI editor chat thread', role = 'log' }: ChatThreadProps) {
  return (
    <section aria-label={label} className="chat-native-thread" data-testid="chat-thread" role={role}>
      {children}
    </section>
  )
}
