import { Badge } from '../../Badge'
import type { ProjectEditBriefWorkspaceModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefHeaderProps = {
  editSessionTitle?: string
  model: ProjectEditBriefWorkspaceModel
}

export function ProjectEditBriefHeader({ editSessionTitle, model }: ProjectEditBriefHeaderProps) {
  return (
    <header className="project-edit-brief-header" data-testid="project-edit-brief-header">
      <div>
        <span className="section-eyebrow">Optional Edit Brief</span>
        <h2>{model.brief?.title ?? 'Edit Brief shell'}</h2>
        <p>{editSessionTitle ? `Inside ${editSessionTitle}` : 'Timeline instruction layer inside this Edit Chat.'}</p>
      </div>
      <div className="project-edit-brief-header__badges">
        <Badge accent="cyan">Mock/local</Badge>
        <Badge>{model.briefStatusLabel}</Badge>
        <Badge>{model.markerCountLabel}</Badge>
        <Badge>No execution</Badge>
      </div>
    </header>
  )
}
