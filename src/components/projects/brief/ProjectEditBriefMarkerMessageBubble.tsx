import type { ProjectEditBriefMarkerMessageRecord } from '../../../types/project-edit-brief'

type ProjectEditBriefMarkerMessageBubbleProps = {
  message: ProjectEditBriefMarkerMessageRecord
}

function roleLabel(role: ProjectEditBriefMarkerMessageRecord['role']) {
  if (role === 'assistant') return 'Mock assistant'
  if (role === 'system') return 'System'
  if (role === 'marker_status') return 'Marker status'
  return 'You'
}

export function ProjectEditBriefMarkerMessageBubble({ message }: ProjectEditBriefMarkerMessageBubbleProps) {
  return (
    <li
      className={`project-edit-brief-marker-chat-bubble project-edit-brief-marker-chat-bubble--${message.role}`}
      data-testid="project-edit-brief-marker-chat-message"
    >
      <span>{roleLabel(message.role)} · {message.kind.replace(/_/g, ' ')}</span>
      <p>{message.text}</p>
    </li>
  )
}
