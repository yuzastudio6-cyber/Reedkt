import type { ReactNode } from 'react'
import type { ReeditProChatMessage } from '../../types'
import type { ChatMessageGroupPosition } from './ChatMessage'
import { ChatMessageRenderer } from './ChatMessageRenderer'

type ChatMessageListProps = {
  hidden?: boolean
  messages: ReeditProChatMessage[]
  renderCards?: (message: ReeditProChatMessage) => ReactNode
}

export function ChatMessageList({ hidden = false, messages, renderCards }: ChatMessageListProps) {
  return (
    <div aria-hidden={hidden ? 'true' : undefined} className="chat-message-list" hidden={hidden}>
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
