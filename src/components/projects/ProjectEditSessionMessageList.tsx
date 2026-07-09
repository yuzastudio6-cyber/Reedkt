import { MessageSquareText } from 'lucide-react'
import { ProjectEditSessionMessageBubble } from './ProjectEditSessionMessageBubble'
import type { ProjectEditSessionChatMessageModel } from '../../lib/project-edit-session-chat-ui-adapter'

type ProjectEditSessionMessageListProps = {
  messages: ProjectEditSessionChatMessageModel[]
}

export function ProjectEditSessionMessageList({ messages }: ProjectEditSessionMessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="project-edit-session-message-list" data-testid="edit-session-message-list">
        <div className="project-edit-session-message-list__empty">
          <MessageSquareText aria-hidden="true" size={24} />
          <strong>No chat history yet</strong>
          <p>Send a message to describe the edit or ask for a change.</p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Edit message history" className="project-edit-session-message-list" data-testid="edit-session-message-list">
      {messages.map((message) => (
        <ProjectEditSessionMessageBubble key={message.id} message={message} />
      ))}
    </section>
  )
}
