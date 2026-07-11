import type { ReactNode } from 'react'
import type { ReeditProChatMessage } from '../../types'
import type { ChatMessageGroupPosition } from './ChatMessage'
import { ChatMessageRenderer } from './ChatMessageRenderer'

type ChatMessageListProps = {
  messages: ReeditProChatMessage[]
  renderCards?: (message: ReeditProChatMessage) => ReactNode
}

export function ChatMessageList({ messages, renderCards }: ChatMessageListProps) {
  return (
    <div className="chat-message-list">
      {messages.map((message, index) => {
        const previousMessage = messages[index - 1]
        const nextMessage = messages[index + 1]
        const sameAsPrevious = previousMessage?.role === message.role
        const sameAsNext = nextMessage?.role === message.role
        const groupPosition: ChatMessageGroupPosition = sameAsPrevious
          ? sameAsNext
            ? 'middle'
            : 'last'
          : sameAsNext
            ? 'first'
            : 'single'
        const compactLabel = groupPosition === 'middle' || groupPosition === 'last'

        return (
          <ChatMessageRenderer
            compactLabel={compactLabel}
            groupPosition={groupPosition}
            key={message.id}
            message={message}
          >
            {renderCards?.(message)}
          </ChatMessageRenderer>
        )
      })}
    </div>
  )
}
