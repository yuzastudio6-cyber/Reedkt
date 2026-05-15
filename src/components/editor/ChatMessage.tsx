import type { ReactNode } from 'react'

type ChatMessageProps = {
  children: ReactNode
  role: 'user' | 'ai'
}

export function ChatMessage({ children, role }: ChatMessageProps) {
  return (
    <article className={`chat-native-message chat-native-message-${role}`}>
      <strong>{role === 'user' ? 'You' : 'ReeditPro AI'}</strong>
      <div>{children}</div>
    </article>
  )
}
