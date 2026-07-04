import { ArrowLeft, BadgeCheck, Film } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import type { ProjectEditSessionChatHeaderModel } from '../../lib/project-edit-session-chat-ui-adapter'

type ProjectEditSessionChatHeaderProps = {
  header: ProjectEditSessionChatHeaderModel
}

export function ProjectEditSessionChatHeader({ header }: ProjectEditSessionChatHeaderProps) {
  return (
    <header className="project-edit-session-chat-header" data-testid="edit-session-chat-header">
      <div className="project-edit-session-chat-header__icon" aria-hidden="true">
        <Film size={28} />
      </div>
      <div className="project-edit-session-chat-header__copy">
        <span className="section-eyebrow">Persistent Edit Chat</span>
        <h1>{header.title}</h1>
        <p>{header.projectId}</p>
        <div className="project-edit-session-chat-header__badges">
          <Badge accent="cyan">Mock/local Edit Chat</Badge>
          <Badge>{header.aspectRatioLabel}</Badge>
          <Badge>{header.platformLabel}</Badge>
          <Badge>{header.statusLabel}</Badge>
          <Badge>{header.editLevelLabel}</Badge>
          <Badge accent={header.dnaLabel === 'DNA applied' ? 'violet' : 'muted'}>{header.dnaLabel}</Badge>
          <Badge accent="cyan">{header.dnaQALabel}</Badge>
          <Badge>{header.doNotCopyLabel}</Badge>
        </div>
      </div>
      <div className="project-edit-session-chat-header__actions">
        <BadgeCheck aria-hidden="true" size={18} />
        <Button icon={ArrowLeft} to={header.projectRoute} variant="secondary">
          Back to project
        </Button>
      </div>
    </header>
  )
}
