import type { ReactNode } from 'react'

type ChatThreadProps = {
  children: ReactNode
  label?: string
}

export function ChatThread({ children, label = 'AI editor chat thread' }: ChatThreadProps) {
  return (
    <section aria-label={label} className="chat-native-thread" data-testid="chat-thread" role="log">
      {children}
    </section>
  )
}
