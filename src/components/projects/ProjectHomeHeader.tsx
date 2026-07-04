import { FolderKanban } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'

type ProjectHomeHeaderProps = {
  projectTitle: string
  projectId: string
  context: string
  cardCount: number
  onNewEditClick: () => void
}

export function ProjectHomeHeader({ cardCount, context, onNewEditClick, projectId, projectTitle }: ProjectHomeHeaderProps) {
  return (
    <header className="project-home-header" data-testid="project-home-header">
      <div className="project-home-header__icon" aria-hidden="true">
        <FolderKanban size={28} />
      </div>
      <div className="project-home-header__copy">
        <span className="section-eyebrow">Project Home</span>
        <h1>{projectTitle}</h1>
        <p>{context}</p>
        <div className="project-home-header__meta">
          <Badge accent="cyan">Mock/local only</Badge>
          <Badge>{projectId}</Badge>
          <Badge>{cardCount} Edit Chats</Badge>
        </div>
      </div>
      <Button className="project-home-header__action" onClick={onNewEditClick} variant="primary">
        + New Edit
      </Button>
    </header>
  )
}
