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

function formatLabel(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
        <Badge accent="warning">Plan + credit approval required</Badge>
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

      {plan.professionalEditingDirective && (
        <div className="inline-plan-section professional-direction-section">
          <strong>Professional editing direction</strong>
          <div className="professional-direction-grid">
            <span><small>Edit style</small>{formatLabel(plan.professionalEditingDirective.editStyle)}</span>
            <span><small>Pacing</small>{formatLabel(plan.professionalEditingDirective.pacingStyle)} / {formatLabel(plan.professionalEditingDirective.cutIntensity)}</span>
            <span><small>Color grade</small>{formatLabel(plan.professionalEditingDirective.colorGradeStyle)}</span>
            <span><small>Captions</small>{formatLabel(plan.professionalEditingDirective.captionStyle)}</span>
            <span><small>B-roll</small>{formatLabel(plan.professionalEditingDirective.brollPolicy)}</span>
            <span><small>Sound</small>{formatLabel(plan.professionalEditingDirective.soundStyle)}</span>
          </div>
          <p>
            Transitions: {plan.professionalEditingDirective.transitionFamilies.map(formatLabel).join(', ')}.
            The ontology guides the plan without limiting custom user requests.
          </p>
        </div>
      )}

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

      <p className="approval-gate-note">Mock progress starts only after you approve both the edit plan and credit estimate.</p>

      <div className="inline-card-actions">
        <Button onClick={onApprove} variant="primary">Approve plan and credits</Button>
        <Button onClick={onLowerCost} variant="secondary">Lower credit cost</Button>
        <Button onClick={onRemoveRealMotion} variant="ghost">Remove Real Motion</Button>
        <Button variant="ghost">Ask a question</Button>
      </div>
    </section>
  )
}
