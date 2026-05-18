import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  MeaningPreservationCheck,
  MeaningPreservationStatus,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineTrimReviewCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function statusAccent(status: MeaningPreservationStatus) {
  if (status === 'blocking' || status === 'failed') return 'danger'
  if (status === 'warning') return 'warning'
  return 'success'
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function MeaningCheckList({ checks }: { checks: MeaningPreservationCheck[] }) {
  if (!checks.length) {
    return (
      <div className="trim-review-mock-note">
        <strong>No meaning warnings</strong>
        <span>Mock validation did not find risky meaning-preservation cuts.</span>
      </div>
    )
  }

  return (
    <div className="meaning-preservation-list">
      {checks.slice(0, 8).map((check) => (
        <article className="meaning-preservation-check" key={check.id}>
          <div className="compact-summary-row">
            <strong>{check.label}</strong>
            <span className="meaning-preservation-status-badge">{statusLabel(check.status)}</span>
          </div>
          <span className="meaning-preservation-risk-badge">{statusLabel(check.category)}</span>
          <small>{check.message}</small>
          <em>{check.recommendation}</em>
          {check.relatedClipIds.length > 0 && <small>Clips: {check.relatedClipIds.slice(0, 4).join(', ')}</small>}
        </article>
      ))}
    </div>
  )
}

export function InlineTrimReviewCard({ descriptor, plan }: InlineTrimReviewCardProps) {
  const trimReviewPlan = plan.trimReviewPlan

  if (!trimReviewPlan) {
    return null
  }

  const { meaningPreservationValidationPlan, retakeSelectionPlan } = trimReviewPlan
  const shouldExpand = descriptor?.defaultExpanded ?? (trimReviewPlan.approvalBlocked || meaningPreservationValidationPlan.userReviewRequired)

  return (
    <InlinePlanCardShell
      className="trim-review-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{trimReviewPlan.approvalBlocked ? 'approval locked' : 'reviewable'}</span>
          <span className="compact-summary-chip">{retakeSelectionPlan.items.length} retake groups</span>
          <span className="compact-summary-chip">{retakeSelectionPlan.userReviewRequiredCount} review</span>
          <span className="compact-summary-chip">meaning {statusLabel(meaningPreservationValidationPlan.status)}</span>
        </div>
      )}
      defaultExpanded={shouldExpand}
      eyebrow="Source QA"
      helper="ReeditPro reviews retakes and checks that cuts preserve meaning before final approval. This is mock review only; no real transcript/media comparison has run."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Trim review"
    >
      <div className="renderer-badge-row">
        <Badge accent={trimReviewPlan.approvalBlocked ? 'danger' : 'success'}>{trimReviewPlan.approvalBlocked ? 'Blocking' : 'Meaning preserved'}</Badge>
        <Badge accent="cyan">Retake selected</Badge>
        <Badge accent={meaningPreservationValidationPlan.userReviewRequired ? 'warning' : 'success'}>
          {meaningPreservationValidationPlan.userReviewRequired ? 'Needs user review' : 'No user review'}
        </Badge>
        <Badge accent={statusAccent(meaningPreservationValidationPlan.status)}>Meaning {statusLabel(meaningPreservationValidationPlan.status)}</Badge>
        <Badge accent="muted">Mock only</Badge>
      </div>

      <div className="trim-review-summary-grid">
        <span><strong>Approval blocked</strong>{trimReviewPlan.approvalBlocked ? 'yes' : 'no'}</span>
        <span><strong>Retake groups</strong>{retakeSelectionPlan.items.length}</span>
        <span><strong>Selected takes</strong>{retakeSelectionPlan.selectedCandidateCount}</span>
        <span><strong>User review</strong>{retakeSelectionPlan.userReviewRequiredCount}</span>
        <span><strong>Meaning status</strong>{statusLabel(meaningPreservationValidationPlan.status)}</span>
        <span><strong>Questions</strong>{trimReviewPlan.nextUserQuestions.length}</span>
      </div>

      {trimReviewPlan.approvalBlocked && (
        <div className="trim-review-blocked-note">
          <strong>Approval locked</strong>
          {trimReviewPlan.approvalBlockReasons.slice(0, 5).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}

      <div>
        <h4>Retake selection</h4>
        <div className="retake-selection-list">
          {retakeSelectionPlan.items.length === 0 ? (
            <article className="retake-selection-item">
              <strong>No retake groups inferred</strong>
              <span>Mock metadata did not identify repeated takes.</span>
            </article>
          ) : retakeSelectionPlan.items.map((item) => (
            <article className="retake-selection-item" key={item.id}>
              <div className="compact-summary-row">
                <strong>{item.label}</strong>
                <span className="retake-confidence-badge">{item.confidence}</span>
              </div>
              <span className="retake-strategy-badge">{statusLabel(item.strategy)}</span>
              <small>Selected: {item.selectedCandidateId ?? 'needs review'}</small>
              <small>Alternates: {item.alternateCandidateIds.join(', ') || 'none'}</small>
              <em>{item.reason}</em>
              <small>{item.userReviewRequired ? 'User review required' : 'Selection is reviewable'}</small>
            </article>
          ))}
        </div>
      </div>

      {retakeSelectionPlan.items.some((item) => item.candidates.length > 0) && (
        <div>
          <h4>Candidates</h4>
          <div className="retake-candidate-list">
            {retakeSelectionPlan.items.flatMap((item) => item.candidates).slice(0, 8).map((candidate) => (
              <article className="retake-candidate-item" key={candidate.id}>
                <div className="compact-summary-row">
                  <strong>{candidate.candidateLabel}</strong>
                  <span className={`retake-confidence-badge retake-confidence-${candidate.quality}`}>{statusLabel(candidate.quality)}</span>
                </div>
                <span>{candidate.clipId}</span>
                <small>Suggested use: {statusLabel(candidate.suggestedUse)}</small>
                <small>Strengths: {candidate.strengths.slice(0, 2).join(' ')}</small>
                <small>Weaknesses: {candidate.weaknesses.slice(0, 2).join(' ')}</small>
                <em>{candidate.reason}</em>
              </article>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4>Meaning preservation</h4>
        <MeaningCheckList checks={meaningPreservationValidationPlan.checks.filter((check) => check.status !== 'passed' || check.userReviewRequired)} />
      </div>

      {trimReviewPlan.nextUserQuestions.length > 0 && (
        <div>
          <h4>User review questions</h4>
          <div className="trim-review-user-question-list">
            {trimReviewPlan.nextUserQuestions.slice(0, 5).map((question) => (
              <span key={question}>{question}</span>
            ))}
          </div>
        </div>
      )}

      <div className="trim-review-mock-note">
        <strong>Mock-only review</strong>
        {trimReviewPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
