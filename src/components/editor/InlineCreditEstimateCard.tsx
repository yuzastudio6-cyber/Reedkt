import { Badge } from '../Badge'
import { Button } from '../Button'
import type { CreditEstimate, CreditEstimatePolicyNote, CreditEstimateRiskLevel, EditLevel, EditingCategory } from '../../types/reeditpro'

type InlineCreditEstimateCardProps = {
  approved: boolean
  estimate: CreditEstimate
  onApprove: () => void
  onLowerCost: () => void
}

const editLevelLabels: Record<EditLevel, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
}

const categoryLabels: Record<EditingCategory, string> = {
  storytelling: 'Storytelling',
  lifestyle: 'Lifestyle',
  business_brand: 'Business / Brand',
  education_explainer: 'Education / Explainer',
  documentary_case_study: 'Documentary / Case Study',
}

const riskAccent: Record<CreditEstimateRiskLevel, 'success' | 'cyan' | 'warning' | 'violet'> = {
  low: 'success',
  medium: 'cyan',
  high: 'warning',
  premium: 'violet',
}

const policyToneClass: Record<CreditEstimatePolicyNote['tone'], string> = {
  danger: 'credit-policy-note-danger',
  info: 'credit-policy-note-info',
  success: 'credit-policy-note-success',
  warning: 'credit-policy-note-warning',
}

function veoPolicyCopy(editLevel?: EditLevel) {
  if (editLevel === 'premium') {
    return 'Veo Lite available only as final fallback/rescue.'
  }

  if (editLevel === 'pro') {
    return 'Veo Lite locked for Pro.'
  }

  return 'Veo Lite locked for Basic.'
}

export function InlineCreditEstimateCard({ approved, estimate, onApprove, onLowerCost }: InlineCreditEstimateCardProps) {
  const remaining = Math.max(100 - estimate.total, 0)

  return (
    <section className="inline-chat-card credit-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Credit estimate</span>
          <h3>{estimate.total} estimated credits</h3>
        </div>
        <div className="renderer-badge-row">
          {estimate.riskLevel && <Badge accent={riskAccent[estimate.riskLevel]}>{estimate.riskLevel} risk</Badge>}
          <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Plan and credits approved' : estimate.approvalBlocked ? 'Approval locked' : 'Before generation'}</Badge>
        </div>
      </div>
      <div className="credit-estimate-summary">
        {estimate.editingCategory && (
          <div>
            <span>Editing category</span>
            <strong>{categoryLabels[estimate.editingCategory]}</strong>
          </div>
        )}
        {estimate.editLevel && (
          <div>
            <span>Edit level</span>
            <strong>{editLevelLabels[estimate.editLevel]}</strong>
          </div>
        )}
        {estimate.estimateVersion && (
          <div>
            <span>Estimate version</span>
            <strong>{estimate.estimateVersion}</strong>
          </div>
        )}
        <div>
          <span>Veo policy</span>
          <strong>{veoPolicyCopy(estimate.editLevel)}</strong>
        </div>
      </div>

      <div className="credit-summary-grid">
        <div>
          <span>Weekly bonus credits</span>
          <strong>100</strong>
        </div>
        <div>
          <span>Purchased credits</span>
          <strong>0</strong>
        </div>
        <div>
          <span>Remaining after approval</span>
          <strong>{remaining}</strong>
        </div>
      </div>

      {estimate.approvalCopy && <p className="approval-gate-note">{estimate.approvalCopy}</p>}
      {estimate.draftReason && <p className="frame-confirmation-warning">{estimate.draftReason}</p>}

      {typeof estimate.timingCredits === 'number' && (
        <div className="timing-credit-section">
          <strong>Timing complexity</strong>
          <span>{estimate.timingCredits} timing credit{estimate.timingCredits === 1 ? '' : 's'}</span>
          <small>Timing affects credits when the plan includes frame-accurate caption animation, visual cues, SoundSync, transitions, SFX, music ducking, AI clip duration, and Remotion layer timing.</small>
          {estimate.approvalBlocked && <em>Confirm/fix timing before final approval.</em>}
        </div>
      )}

      <div className="credit-breakdown-list">
        {estimate.breakdown.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.credits} credits</strong>
            <small>{item.reason}</small>
          </div>
        ))}
      </div>

      {(estimate.visualSystemSummary?.length ?? 0) > 0 && (
        <div className="credit-asset-summary-section">
          <strong>Visual system summary</strong>
          <div className="credit-asset-summary-grid">
            {estimate.visualSystemSummary?.map((item) => (
              <div className="credit-asset-summary-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.count} / {item.credits} credits</strong>
                <small>{item.reason}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {(estimate.assetTypeSummary?.length ?? 0) > 0 && (
        <div className="credit-asset-summary-section">
          <strong>Asset type summary</strong>
          <div className="credit-asset-summary-grid">
            {estimate.assetTypeSummary?.map((item) => (
              <div className="credit-asset-summary-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.count} / {item.credits} credits</strong>
                <small>{item.reason}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {typeof estimate.fallbackAllowanceCredits === 'number' && (
        <div className="fallback-allowance-card">
          <span>Fallback allowance</span>
          <strong>{estimate.fallbackAllowanceCredits} credits</strong>
          <small>Fallback depth is estimated before generation. Basic and Pro do not include Veo access; Premium allows Veo Lite only as final fallback/rescue.</small>
        </div>
      )}

      {(estimate.fallbackPolicyNotes?.length ?? 0) > 0 && (
        <div className="credit-policy-list">
          {estimate.fallbackPolicyNotes?.map((note) => (
            <div className={`credit-policy-note ${policyToneClass[note.tone]}`} key={note.label}>
              <strong>{note.label}</strong>
              <span>{note.message}</span>
            </div>
          ))}
        </div>
      )}

      {(estimate.lowerCostAlternatives?.length ?? 0) > 0 && (
        <div className="lower-cost-list">
          <strong>Lower-cost alternatives</strong>
          {estimate.lowerCostAlternatives?.map((alternative) => (
            <div className="lower-cost-item" key={alternative.label}>
              <span>{alternative.label}</span>
              <strong>Save about {alternative.estimatedSavings} credits</strong>
              <small>{alternative.tradeoff}</small>
              <em>{alternative.actionHint}</em>
            </div>
          ))}
        </div>
      )}

      {(estimate.timingTradeoffs?.length ?? 0) > 0 && (
        <div className="timing-lower-cost-list">
          <strong>Timing lower-cost options</strong>
          {estimate.timingTradeoffs?.slice(0, 4).map((tradeoff) => (
            <div className="timing-lower-cost-item" key={tradeoff.id}>
              <span>{tradeoff.label}</span>
              <strong>Save about {tradeoff.estimatedCreditSavings} credits</strong>
              <small>{tradeoff.tradeoff}</small>
              <em>{tradeoff.whatChanges.join('; ')}</em>
            </div>
          ))}
        </div>
      )}

      <p className="inline-helper">
        Credits are estimated before generation. Credits are deducted only after approval. This frontend demo does not deduct real credits.
        Provider costs are internal; users see Reedit Credits. Failed ReeditPro generation would be refunded or restored according to future billing policy.
      </p>
      <div className="inline-card-actions">
        <Button disabled={approved || estimate.approvalBlocked} onClick={onApprove} variant="primary">
          {approved ? 'Plan and credits approved' : estimate.approvalBlocked ? 'Resolve approval gate first' : 'Approve plan and credits'}
        </Button>
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower credit cost</Button>
        <Button disabled={approved} variant="ghost">Revise plan</Button>
      </div>
    </section>
  )
}
