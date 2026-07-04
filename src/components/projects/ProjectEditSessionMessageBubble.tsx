import { Badge } from '../Badge'
import type { ProjectEditSessionChatMessageModel } from '../../lib/project-edit-session-chat-ui-adapter'

type ProjectEditSessionMessageBubbleProps = {
  message: ProjectEditSessionChatMessageModel
}

export function ProjectEditSessionMessageBubble({ message }: ProjectEditSessionMessageBubbleProps) {
  return (
    <article
      className={`project-edit-session-message ${message.bubbleClassName}`}
      data-testid={`edit-session-message-${message.role}`}
    >
      <div className="project-edit-session-message__meta">
        <strong>{message.roleLabel}</strong>
        <Badge>{message.kindLabel}</Badge>
        <span>{message.timestampLabel}</span>
      </div>
      <p>{message.text}</p>
    </article>
  )
}
