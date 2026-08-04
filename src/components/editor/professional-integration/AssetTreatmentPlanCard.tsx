import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { AssetTreatmentPlan } from '../../../types'

type AssetTreatmentPlanCardProps = {
  plan: AssetTreatmentPlan
  accepted?: boolean
  onAccept?: (treatmentId: string) => void
}

function valueLabel(value?: boolean) {
  return value ? 'Yes' : 'No'
}

export function AssetTreatmentPlanCard({
  accepted = false,
  onAccept,
  plan,
}: AssetTreatmentPlanCardProps) {
  return (
    <article className="asset-treatment-card professional-treatment-card">
      <div className="professional-treatment-card-header">
        <div>
          <span className="section-eyebrow">Asset Treatment</span>
          <h4>{plan.mediaAssetId}</h4>
        </div>
        <Badge accent={accepted ? 'success' : 'muted'}>{accepted ? 'Accepted' : plan.kind.replaceAll('_', ' ')}</Badge>
      </div>
      <p className="inline-helper">This describes how the asset will be prepared before render.</p>
      <p>{plan.treatmentSummary}</p>

      <div className="professional-treatment-grid">
        <span><strong>Kind</strong><small>{plan.kind.replaceAll('_', ' ')}</small></span>
        <span><strong>Crop</strong><small>{plan.cropMode ?? 'AI decides'}</small></span>
        <span><strong>Aspect</strong><small>{plan.targetAspectRatio ?? 'custom'}</small></span>
        <span><strong>Color match</strong><small>{valueLabel(plan.colorMatch)}</small></span>
        <span><strong>Stabilize</strong><small>{valueLabel(plan.stabilize)}</small></span>
        <span><strong>Privacy blur</strong><small>{valueLabel(plan.privacyBlur)}</small></span>
      </div>

      {plan.qaRisks.length > 0 && (
        <div className="professional-risk-chip-row">
          {plan.qaRisks.map((risk) => <span key={risk}>{risk.replaceAll('_', ' ')}</span>)}
        </div>
      )}

      <Button icon={CheckCircle2} disabled={accepted} onClick={() => onAccept?.(plan.id)} size="sm" variant="secondary">
        {accepted ? 'Treatment accepted' : 'Accept Treatment'}
      </Button>
    </article>
  )
}
