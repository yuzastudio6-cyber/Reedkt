import type { ReactNode } from 'react'
import type { ReeditProChatMessage } from '../../types'
import { ChatMessage, type ChatMessageGroupPosition } from './ChatMessage'

type ChatMessageRendererProps = {
  children?: ReactNode
  compactLabel?: boolean
  groupPosition?: ChatMessageGroupPosition
  message: ReeditProChatMessage
}

export function ChatMessageRenderer({ children, compactLabel = false, groupPosition = 'single', message }: ChatMessageRendererProps) {
  const content = message.content ? <p>{message.content}</p> : null

  return (
    <ChatMessage
      ariaLabel={message.accessibilityLabel}
      ariaLive={message.ariaLive}
      className={children ? 'chat-native-message-with-cards' : 'chat-native-message-text-only'}
      compactLabel={compactLabel}
      groupPosition={groupPosition}
      id={message.id}
      label={message.label}
      role={message.role}
      status={message.status}
      type={message.type}
    >
      {content}
      {children ? <div className="chat-message-card-stack">{children}</div> : null}
    </ChatMessage>
  )
}
