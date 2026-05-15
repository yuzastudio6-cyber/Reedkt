import type { ReactNode } from 'react'

type ChatThreadProps = {
  children: ReactNode
}

export function ChatThread({ children }: ChatThreadProps) {
  return <section className="chat-native-thread" aria-label="AI editor chat thread">{children}</section>
}
