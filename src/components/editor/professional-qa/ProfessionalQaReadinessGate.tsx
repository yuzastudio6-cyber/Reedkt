import { Badge } from '../../Badge'
import type { ProfessionalQaSummary } from '../../../types'

type ProfessionalQaReadinessGateProps = {
  summary: ProfessionalQaSummary
  canPreviewProceed: boolean
  readinessMessage?: string
}

function gateLabel(readiness: ProfessionalQaSummary['previewReadiness']) {
  if (readiness === 'ready_with_warnings') return 'Ready with warnings'
  if (readiness === 'not_run') return 'Not run'
  return readiness.replace(/_/g, ' ')
}

export function ProfessionalQaReadinessGate({
  canPreviewProceed,
  readinessMessage,
  summary,
}: ProfessionalQaReadinessGateProps) {
  const readiness = summary.previewReadiness
  const accent = readiness === 'ready' || readiness === 'ready_with_warnings'
    ? 'success'
    : readiness === 'blocked'
      ? 'danger'
      : 'warning'
  const message = canPreviewProceed
    ? 'Private review planning can continue.'
    : readiness === 'blocked'
      ? 'Private review preparation should not continue until blocking issues are resolved.'
      : readiness === 'needs_review'
        ? 'Warnings should be reviewed or accepted before moving forward.'
        : 'Run QA before treating the private review as ready.'

  return (
    <section className={`inline-chat-card professional-qa-readiness-gate professional-qa-status--${readiness}`.trim()}>
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Private review readiness gate</span>
          <h3>{readinessMessage ?? message}</h3>
        </div>
        <Badge accent={accent}>{gateLabel(readiness)}</Badge>
      </div>
      <p className="inline-helper">{message}</p>
      <p className="inline-helper">QA is local and non-destructive. It does not render or modify source media.</p>
    </section>
  )
}
