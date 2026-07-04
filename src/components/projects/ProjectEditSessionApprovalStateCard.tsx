import { Badge } from '../Badge'
import type { ProjectEditSessionApprovalStateModel } from '../../lib/project-edit-session-history-ui-adapter'

type ProjectEditSessionApprovalStateCardProps = {
  model: ProjectEditSessionApprovalStateModel
}

export function ProjectEditSessionApprovalStateCard({ model }: ProjectEditSessionApprovalStateCardProps) {
  return (
    <section className="project-edit-session-history-card" data-testid="edit-session-approval-state-card">
      <div className="project-edit-session-history-card__heading">
        <h4>Approval State</h4>
        <Badge accent={model.status === 'approved' ? 'success' : model.status === 'reset_after_revision' ? 'warning' : 'muted'}>
          {model.statusLabel}
        </Badge>
      </div>
      <p>{model.body}</p>
    </section>
  )
}
