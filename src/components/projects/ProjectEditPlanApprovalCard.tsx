import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import type { ProjectEditPlanApprovalModel } from '../../lib/project-edit-plan-approval'

type ProjectEditPlanApprovalCardProps = {
  model: ProjectEditPlanApprovalModel
  onApprove: () => void
}

function statusLabel(status: ProjectEditPlanApprovalModel['status']): string {
  return status.replace(/_/g, ' ')
}

export function ProjectEditPlanApprovalCard({ model, onApprove }: ProjectEditPlanApprovalCardProps) {
  return (
    <Card className="project-edit-plan-approval-card" data-testid="project-edit-plan-approval-card">
      <div className="project-edit-plan-approval-card__header">
        <div>
          <span className="section-eyebrow">Plan approval</span>
          <h3>{model.title}</h3>
          <p>{model.sourceSummary}</p>
        </div>
        <Badge accent={model.approved ? 'success' : model.canApprove ? 'cyan' : 'purple'}>
          {statusLabel(model.status)}
        </Badge>
      </div>

      <p className="project-edit-plan-approval-card__summary">{model.summary}</p>

      <ol className="project-edit-plan-approval-card__steps">
        {model.steps.map((step) => (
          <li key={step.label}>
            <ClipboardCheck aria-hidden="true" size={16} />
            <span>
              <strong>{step.label}</strong>
              {step.summary}
            </span>
          </li>
        ))}
      </ol>

      <div className="project-edit-plan-approval-card__estimate" data-testid="project-edit-plan-credit-estimate">
        <span>
          <strong>{model.creditEstimate.lowCredits}</strong>
          low
        </span>
        <span>
          <strong>{model.creditEstimate.expectedCredits}</strong>
          expected
        </span>
        <span>
          <strong>{model.creditEstimate.highCredits}</strong>
          high
        </span>
      </div>

      {model.blockers.length > 0 ? (
        <div className="project-edit-plan-approval-card__blockers" data-testid="project-edit-plan-blockers">
          {model.blockers.map((blocker) => (
            <span key={blocker}>{blocker.replace(/_/g, ' ')}</span>
          ))}
        </div>
      ) : null}

      <Button
        data-testid="project-edit-plan-approve-button"
        disabled={!model.canApprove || model.approved}
        icon={CheckCircle2}
        onClick={onApprove}
        size="sm"
        type="button"
        variant={model.approved ? 'secondary' : 'primary'}
      >
        {model.approved ? 'Local plan approved' : 'Approve local test plan'}
      </Button>

      <p className="project-edit-brief-muted">
        Approval unlocks only the internal preview smoke path. It does not start production export, live providers, Supabase writes, or paid billing.
      </p>
    </Card>
  )
}
