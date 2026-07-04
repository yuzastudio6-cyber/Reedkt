import { Badge } from '../Badge'
import type { ProjectEditSessionPreviewHistoryCardModel } from '../../lib/project-edit-session-history-ui-adapter'

type ProjectEditSessionPreviewHistoryCardProps = {
  model: ProjectEditSessionPreviewHistoryCardModel
}

export function ProjectEditSessionPreviewHistoryCard({ model }: ProjectEditSessionPreviewHistoryCardProps) {
  return (
    <section className="project-edit-session-history-card" data-testid="edit-session-latest-preview-card">
      <div className="project-edit-session-history-card__heading">
        <h4>{model.title}</h4>
        <Badge accent="cyan">{model.statusLabel}</Badge>
      </div>
      <div className="project-edit-session-history-preview-frame" aria-label="Mock preview placeholder">
        <span>{model.previewUrl ? 'Mock preview URL' : 'No preview yet'}</span>
      </div>
      <p>{model.body}</p>
    </section>
  )
}
