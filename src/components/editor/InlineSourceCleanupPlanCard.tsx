import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import type {
  ChatPlanningCardDescriptor,
  CleanupPreference,
  EditPlan,
  TrimRiskLevel,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSourceCleanupPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
  selectedCleanupPreference?: CleanupPreference
  cleanupPreferenceConfirmed: boolean
  onSelectCleanupPreference?: (preference: CleanupPreference) => void
  onConfirmCleanupPreference?: () => void
}

const preferenceLabels: Record<CleanupPreference, string> = {
  preserve_natural: 'Preserve natural',
  light_cleanup: 'Light cleanup',
  balanced_cleanup: 'Balanced cleanup',
  tight_retention_cleanup: 'Tight retention',
  aggressive_cleanup: 'Aggressive',
  documentary_faithful: 'Documentary faithful',
  tutorial_complete: 'Tutorial complete',
  custom: 'Custom',
}

const preferenceDescriptions: Record<CleanupPreference, string> = {
  preserve_natural: 'Keep authentic pauses and human rhythm.',
  light_cleanup: 'Remove only obvious dead space and mistakes.',
  balanced_cleanup: 'Professional default: remove filler/repeats while preserving meaning.',
  tight_retention_cleanup: 'Faster social pacing with tighter explanations.',
  aggressive_cleanup: 'Maximum cutdown for dense edits after review.',
  documentary_faithful: 'Preserve claim, proof, and source context.',
  tutorial_complete: 'Preserve all required product/tutorial steps.',
  custom: 'Use explicit cleanup instructions.',
}

function riskAccent(risk: TrimRiskLevel) {
  if (risk === 'blocking' || risk === 'high') return 'danger'
  if (risk === 'medium') return 'warning'
  return 'success'
}

function countDecisions(plan: EditPlan, decisionType: string) {
  return plan.sourceCleanupPlan?.decisions.filter((decision) => decision.decision === decisionType).length ?? 0
}

export function InlineSourceCleanupPlanCard({
  cleanupPreferenceConfirmed,
  descriptor,
  onConfirmCleanupPreference,
  onSelectCleanupPreference,
  plan,
  selectedCleanupPreference,
}: InlineSourceCleanupPlanCardProps) {
  const sourceCleanupPlan = plan.sourceCleanupPlan

  if (!sourceCleanupPlan) {
    return null
  }

  const recommended = sourceCleanupPlan.recommendedPreference.recommendedPreference
  const selected = selectedCleanupPreference ?? sourceCleanupPlan.selectedPreference ?? recommended
  const confirmed = cleanupPreferenceConfirmed && sourceCleanupPlan.status === 'confirmed'

  return (
    <InlinePlanCardShell
      className="source-cleanup-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{sourceCleanupPlan.status.replaceAll('_', ' ')}</span>
          <span className="compact-summary-chip">{preferenceLabels[selected]}</span>
          <span className="compact-summary-chip">{sourceCleanupPlan.decisions.length} decisions</span>
          <span className="compact-summary-chip">{sourceCleanupPlan.userReviewItems.length} review</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? !confirmed}
      eyebrow="Edit setup"
      helper="ReeditPro decides what to keep, cut, tighten, preserve, or repurpose. Cleanup style must be confirmed before final approval."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Source cleanup"
    >
      <div className="renderer-badge-row">
        <Badge accent={confirmed ? 'success' : 'warning'}>{confirmed ? 'Confirmed' : 'Needs confirmation'}</Badge>
        <Badge accent="blue">No random cuts</Badge>
        <Badge accent="cyan">Meaning first</Badge>
        <Badge accent="violet">Mock only</Badge>
      </div>

      {!confirmed && (
        <div className="cleanup-blocked-note">
          <strong>Approval is locked until cleanup style is confirmed.</strong>
          <span>Changing this later rebuilds timing, cuts, and the credit estimate.</span>
        </div>
      )}

      <div className="caption-policy-summary">
        <span><strong>Recommended</strong>{preferenceLabels[recommended]}</span>
        <span><strong>Selected</strong>{preferenceLabels[selected]}</span>
        <span><strong>Status</strong>{sourceCleanupPlan.status.replaceAll('_', ' ')}</span>
        <span><strong>Duration impact</strong>{sourceCleanupPlan.finalDurationImpactSeconds.toFixed(1)}s</span>
        <span><strong>Retake groups</strong>{sourceCleanupPlan.retakeGroups.length}</span>
        <span><strong>Review items</strong>{sourceCleanupPlan.userReviewItems.length}</span>
      </div>

      <section>
        <h4>{sourceCleanupPlan.cleanupQuestion.question}</h4>
        <p className="caption-visual-mock-note">{sourceCleanupPlan.cleanupQuestion.reason}</p>
        <div className="cleanup-preference-grid">
          {sourceCleanupPlan.cleanupQuestion.options.map((preference) => {
            const isSelected = preference === selected

            return (
              <button
                className={`cleanup-preference-option ${isSelected ? 'cleanup-preference-selected' : ''}`}
                key={preference}
                onClick={() => onSelectCleanupPreference?.(preference)}
                type="button"
              >
                <strong>{preferenceLabels[preference]}</strong>
                <span>{preferenceDescriptions[preference]}</span>
                {preference === recommended && <em>Recommended</em>}
              </button>
            )
          })}
        </div>
        <Button className="cleanup-confirm-button" icon={CheckCircle2} onClick={onConfirmCleanupPreference} variant={confirmed ? 'secondary' : 'primary'}>
          {confirmed ? 'Cleanup style confirmed' : `Confirm ${preferenceLabels[selected]}`}
        </Button>
      </section>

      <div className="cleanup-decision-summary-grid">
        <span><strong>Keep</strong>{countDecisions(plan, 'keep')}</span>
        <span><strong>Cut</strong>{countDecisions(plan, 'cut')}</span>
        <span><strong>Tighten</strong>{countDecisions(plan, 'tighten')}</span>
        <span><strong>Preserve</strong>{countDecisions(plan, 'preserve')}</span>
        <span><strong>B-roll</strong>{sourceCleanupPlan.decisions.filter((decision) => decision.finalUse === 'broll').length}</span>
        <span><strong>User review</strong>{sourceCleanupPlan.userReviewItems.length}</span>
      </div>

      <div>
        <h4>Trim decisions</h4>
        <div className="trim-decision-list">
          {sourceCleanupPlan.decisions.slice(0, 8).map((decision) => (
            <article className="trim-decision-item" key={decision.id}>
              <div className="compact-summary-row">
                <strong>{decision.clipId}</strong>
                <span className="trim-final-use-badge">{decision.finalUse.replaceAll('_', ' ')}</span>
                <span className="trim-risk-badge">{decision.riskLevel}</span>
              </div>
              <span className="trim-decision-meta">
                {decision.sourceRange.startSeconds.toFixed(0)}-{decision.sourceRange.endSeconds.toFixed(0)}s / {decision.decision.replaceAll('_', ' ')}
              </span>
              <small>{decision.reason}</small>
              <small>Keep: {decision.keepReasons.join(', ') || 'none'} / Cut: {decision.cutReasons.join(', ') || 'none'}</small>
              <Badge accent={riskAccent(decision.riskLevel)}>{decision.userReviewRequired ? 'User review' : 'Planned'}</Badge>
            </article>
          ))}
        </div>
      </div>

      {sourceCleanupPlan.retakeGroups.length > 0 && (
        <div>
          <h4>Retake groups</h4>
          <div className="retake-group-list">
            {sourceCleanupPlan.retakeGroups.map((group) => (
              <article className="retake-group-item" key={group.id}>
                <strong>{group.label}</strong>
                <span>Selected: {group.selectedClipId ?? 'review required'}</span>
                <small>{group.reason}</small>
              </article>
            ))}
          </div>
        </div>
      )}

      {sourceCleanupPlan.userReviewItems.length > 0 && (
        <div className="cleanup-user-review-note">
          <strong>User review needed</strong>
          {sourceCleanupPlan.userReviewItems.slice(0, 4).map((item) => (
            <span key={item.id}>{item.clipId}: {item.reason}</span>
          ))}
        </div>
      )}

      <div className="cleanup-mock-note">
        {sourceCleanupPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
