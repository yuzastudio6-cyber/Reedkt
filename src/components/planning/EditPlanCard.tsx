import { AlertTriangle, CheckCircle2, Clock3, Sparkles } from 'lucide-react'
import type { EditPlan, SignatureSystem } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import { CreditEstimateCard } from './CreditEstimateCard'

type EditPlanCardProps = {
  plan: EditPlan
  approved: boolean
  onApprove: () => void
  onRevise: () => void
  onSaveDraft: () => void
}

const systemLabels: Record<SignatureSystem, string> = {
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design / VisualExplain',
  real_motion: 'Real Motion',
  sound_sync: 'SoundSync',
  none: 'None',
}

export function EditPlanCard({ approved, onApprove, onRevise, onSaveDraft, plan }: EditPlanCardProps) {
  return (
    <div className="edit-plan-stack">
      <Card className="edit-plan-card">
        <div className="panel-heading">
          <div>
            <span className="section-eyebrow">Mock AI edit plan</span>
            <h2>Plan first. Approve second. Generate third.</h2>
          </div>
          <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Approval required'}</Badge>
        </div>

        <div className="plan-callout">
          <Sparkles size={20} />
          <div>
            <strong>Edit goal</strong>
            <p>{plan.goalSummary}</p>
          </div>
        </div>

        <div className="plan-grid">
          <section>
            <h3>Source Sequence Map</h3>
            {plan.sourceSequenceMap.map((item) => (
              <article className="sequence-item" key={item.clipId}>
                <Badge accent="cyan">Clip {item.uploadedOrder}</Badge>
                <strong>{item.detectedRole}</strong>
                <p>{item.possibleUses.join(' / ')}</p>
                <small>{item.strengths.join(', ')}</small>
              </article>
            ))}
          </section>

          <section>
            <h3>Recommended Edit Structure</h3>
            <ol className="structure-list">
              {plan.recommendedStructure.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </div>

        <div className="hook-card">
          <Clock3 size={20} />
          <div>
            <h3>Hook decision</h3>
            <Badge accent="blue">{plan.hookDecision.policy.replaceAll('_', ' ')}</Badge>
            <p>{plan.hookDecision.recommendation}</p>
            <small>{plan.hookDecision.reason}</small>
          </div>
        </div>

        {plan.referenceVideoPlan?.referenceDNA && (
          <section className="reference-dna-grid">
            <div className="section-heading compact">
              <span className="section-eyebrow">Reference DNA</span>
              <h3>Style guidance, not shot-for-shot copying</h3>
            </div>
            <article>
              <strong>Topic</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.topic}</p>
            </article>
            <article>
              <strong>Pacing</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.pacing}</p>
            </article>
            <article>
              <strong>Captions</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.captionStyle}</p>
            </article>
            <article>
              <strong>Transitions</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.transitionStyle}</p>
            </article>
            <article>
              <strong>SoundSync</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.soundSyncStyle}</p>
            </article>
            <article>
              <strong>Do not copy</strong>
              <p>{plan.referenceVideoPlan.referenceDNA.doNotCopyRules[0]}</p>
            </article>
          </section>
        )}

        {!plan.referenceVideoPlan?.referenceDNA && plan.referenceDNA && (
          <section className="reference-dna-grid">
            <div className="section-heading compact">
              <span className="section-eyebrow">Reference DNA</span>
              <h3>Study the style, never copy shot-for-shot</h3>
            </div>
            {Object.entries(plan.referenceDNA).map(([label, value]) => (
              <article key={label}>
                <strong>{label.replace(/([A-Z])/g, ' $1')}</strong>
                <p>{value}</p>
              </article>
            ))}
          </section>
        )}

        <section className="signature-route-list">
          <div className="section-heading compact">
            <span className="section-eyebrow">Signature routing</span>
            <h3>Dropdown context does not force visual systems</h3>
          </div>
          {plan.signatureRoutes.map((route) => (
            <article className={`route-item route-${route.system}`} key={`${route.timeRange}-${route.system}`}>
              <Badge accent={route.system === 'real_motion' ? 'blue' : route.system === 'stroke_motion' ? 'cyan' : route.system === 'graphic_design' ? 'violet' : route.system === 'sound_sync' ? 'success' : 'muted'}>
                {systemLabels[route.system]}
              </Badge>
              <strong>{route.timeRange}</strong>
              <p>{route.reason}</p>
              <small>Credit impact: {route.creditImpact}</small>
            </article>
          ))}
        </section>

        <div className="direction-grid">
          <article>
            <h3>SoundSync/music direction</h3>
            <p>{plan.soundSyncDirection}</p>
          </article>
          <article>
            <h3>Captions direction</h3>
            <p>{plan.captionDirection}</p>
          </article>
        </div>

        <div className="approval-rule">
          <AlertTriangle size={18} />
          <p>User approval is required before any production generation or credit deduction.</p>
        </div>
      </Card>

      <CreditEstimateCard approved={approved} estimate={plan.creditEstimate} onApprove={onApprove} onRevise={onRevise} onSaveDraft={onSaveDraft} />

      {approved && (
        <Card className="approved-state">
          <CheckCircle2 size={22} />
          <div>
            <h3>Plan approved. ReeditPro would now begin generation in production.</h3>
            <p>No real generation, backend job, payment, or credit deduction happens in this mock frontend.</p>
          </div>
          <Button to="/editor" variant="primary">
            Open in AI Editor
          </Button>
        </Card>
      )}
    </div>
  )
}
