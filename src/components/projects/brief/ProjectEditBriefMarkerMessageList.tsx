import type { ProjectEditBriefMarkerMessageRecord } from '../../../types/project-edit-brief'
import { ProjectEditBriefMarkerMessageBubble } from './ProjectEditBriefMarkerMessageBubble'

type ProjectEditBriefMarkerMessageListProps = {
  messages: ProjectEditBriefMarkerMessageRecord[]
}

export function ProjectEditBriefMarkerMessageList({ messages }: ProjectEditBriefMarkerMessageListProps) {
  if (!messages.length) {
    return (
      <div className="project-edit-brief-marker-chat-empty" data-testid="project-edit-brief-marker-chat-empty">
        No marker-scoped chat messages yet.
      </div>
    )
  }

  return (
    <ul className="project-edit-brief-marker-chat-list" data-testid="project-edit-brief-marker-chat-list">
      {messages.map((message) => (
        <ProjectEditBriefMarkerMessageBubble key={message.id} message={message} />
      ))}
    </ul>
  )
}
