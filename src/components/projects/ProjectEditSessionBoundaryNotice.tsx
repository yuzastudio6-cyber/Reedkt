import { ShieldCheck } from 'lucide-react'
import { Badge } from '../Badge'
import type { ProjectEditSessionChatBoundarySummary } from '../../lib/project-edit-session-chat-ui-adapter'

type ProjectEditSessionBoundaryNoticeProps = {
  boundary: ProjectEditSessionChatBoundarySummary
}

export function ProjectEditSessionBoundaryNotice({ boundary }: ProjectEditSessionBoundaryNoticeProps) {
  return (
    <aside className="project-edit-session-chat-boundary" data-testid="edit-session-chat-boundary">
      <ShieldCheck aria-hidden="true" size={18} />
      <div>
        <strong>{boundary.title}</strong>
        <p>{boundary.body}</p>
        <div className="project-edit-session-chat-boundary__badges">
          <Badge accent="cyan">Mock/local</Badge>
          <Badge>No render</Badge>
          <Badge>No credits</Badge>
        </div>
      </div>
    </aside>
  )
}
