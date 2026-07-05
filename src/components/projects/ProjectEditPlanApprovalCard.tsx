import { CheckCircle2, ClipboardCheck, LoaderCircle } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import type { ProjectEditPlanApprovalModel } from '../../lib/project-edit-plan-approval'

type ProjectEditPlanApprovalCardProps = {
  approvalError?: string
  approvalStatus?: 'idle' | 'approving' | 'approved' | 'failed'
  backendRecordId?: string
  model: ProjectEditPlanApprovalModel
  onApprove: () => void
}

function statusLabel(status: ProjectEditPlanApprovalModel['status']): string {
  return status.replace(/_/g, ' ')
}

export function ProjectEditPlanApprovalCard({
  approvalError,
  approvalStatus = 'idle',
  backendRecordId,
  model,
  onApprove,
}: ProjectEditPlanApprovalCardProps) {
  const approving = approvalStatus === 'approving'
  const approved = model.approved && approvalStatus === 'approved'

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

      <div className="project-edit-plan-approval-card__operations" data-testid="project-edit-plan-operation-manifest">
        <span>
          <strong>{model.operationManifest.operations.length}</strong>
          approved edit operations
        </span>
        <span>{model.operationManifest.professionalBaseline.replace(/_/g, ' ')}</span>
        <span>{model.operationManifest.sourceOrderPolicy.replace(/_/g, ' ')}</span>
      </div>

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
        disabled={!model.canApprove || approved || approving}
        icon={approving ? LoaderCircle : CheckCircle2}
        onClick={onApprove}
        size="sm"
        type="button"
        variant={approved ? 'secondary' : 'primary'}
      >
        {approving ? 'Approving plan' : approved ? 'Local plan approved' : 'Approve local test plan'}
      </Button>

      {backendRecordId ? (
        <p className="project-edit-plan-approval-card__backend" data-testid="project-edit-plan-backend-record">
          Backend-local plan record: {backendRecordId}
        </p>
      ) : null}
      {approvalError ? (
        <p className="project-edit-plan-approval-card__error" data-testid="project-edit-plan-approval-error">
          {approvalError}
        </p>
      ) : null}

      <p className="project-edit-brief-muted">
        Approval writes and reads back a backend-local plan record. It unlocks only the internal preview smoke path and does not start production export, live providers, Supabase writes, or paid billing.
      </p>
    </Card>
  )
}
