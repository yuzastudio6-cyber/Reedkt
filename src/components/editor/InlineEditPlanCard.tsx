import { Badge } from '../Badge'
import { Button } from '../Button'
import type { EditPlan } from '../../types/reeditpro'

const systemLabels = {
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design',
  real_motion: 'Real Motion',
  sound_sync: 'SoundSync',
  none: 'None',
}

type InlineEditPlanCardProps = {
  plan: EditPlan
  onApprove: () => void
  onLowerCost: () => void
  onRemoveRealMotion: () => void
}

export function InlineEditPlanCard({ onApprove, onLowerCost, onRemoveRealMotion, plan }: InlineEditPlanCardProps) {
  return (
    <section className="inline-chat-card edit-plan-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit plan</span>
          <h3>Here is the plan before spending credits</h3>
        </div>
        <Badge accent="warning">Approval required</Badge>
      </div>

      <div className="chat-plan-grid">
        <div>
          <strong>Goal</strong>
          <p>{plan.goalSummary}</p>
        </div>
        <div>
          <strong>Hook decision</strong>
          <p>{plan.hookDecision.recommendation}</p>
        </div>
      </div>

      <div className="inline-plan-section">
        <strong>Source sequence summary</strong>
        <ol>
          {plan.sourceSequenceMap.map((item) => (
            <li key={item.clipId}>Clip {item.uploadedOrder}: {item.detectedRole}</li>
          ))}
        </ol>
      </div>

      <div className="inline-plan-section">
        <strong>Recommended structure</strong>
        <ul>
          {plan.recommendedStructure.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="signature-inline-chips">
        {plan.signatureRoutes.map((route) => (
          <span className={`signature-inline-chip signature-inline-${route.system}`} key={`${route.timeRange}-${route.system}`}>
            <strong>{systemLabels[route.system]}</strong>
            <small>{route.timeRange} / {route.creditImpact}</small>
            {route.system === 'real_motion' && <em>Overlay-first. Face-safe. Credit-heavy.</em>}
          </span>
        ))}
      </div>

      <div className="inline-plan-section">
        <strong>SoundSync and captions</strong>
        <p>{plan.soundSyncDirection}</p>
        <p>{plan.captionDirection}</p>
      </div>

      <div className="inline-card-actions">
        <Button onClick={onApprove} variant="primary">Approve plan</Button>
        <Button onClick={onLowerCost} variant="secondary">Lower credit cost</Button>
        <Button onClick={onRemoveRealMotion} variant="ghost">Remove Real Motion</Button>
        <Button variant="ghost">Ask a question</Button>
      </div>
    </section>
  )
}
