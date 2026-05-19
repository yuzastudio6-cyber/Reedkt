import { Badge } from '../../Badge'
import type { SFXDirectorPlanView } from './sfxChatUiData'

type InlineSFXDirectorPlanCardProps = {
  plan: SFXDirectorPlanView
}

export function InlineSFXDirectorPlanCard({ plan }: InlineSFXDirectorPlanCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-director-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">SFX Director Plan</span>
          <h3>Subtle edit-layer SFX strategy</h3>
        </div>
        <Badge accent="cyan">Mock planning</Badge>
      </div>

      <p className="sfx-success">ReeditPro adds SFX for edit-layer polish by default, not every real-world source action.</p>

      <div className="sfx-score-grid">
        <span><strong>Default policy</strong>{plan.defaultPolicy}</span>
        <span><strong>Source footage</strong>{plan.sourceFootagePolicy}</span>
        <span><strong>Decision states</strong>{plan.decisionStateSummary}</span>
        <span><strong>Volume</strong>{plan.volumePhilosophy}</span>
        <span><strong>Provider strategy</strong>{plan.providerStrategy}</span>
        <span><strong>Next step</strong>{plan.nextStep}</span>
      </div>

      <div className="sfx-pill-row">
        {plan.recommendedTargetLayers.map((layer) => (
          <span className="sfx-policy-badge" key={layer}>{layer}</span>
        ))}
      </div>

      <details className="sfx-details">
        <summary>Avoided source-action SFX</summary>
        <ul className="sfx-compact-list">
          {plan.avoidedSourceActionSFX.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>

      <p className="sfx-muted-note">{plan.creditApprovalRule}</p>
    </section>
  )
}
