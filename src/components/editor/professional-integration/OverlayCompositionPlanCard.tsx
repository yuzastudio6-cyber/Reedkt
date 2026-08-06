import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { OverlayCompositionPlan, WorkflowTimeRange } from '../../../types'

type OverlayCompositionPlanCardProps = {
  plan: OverlayCompositionPlan
  accepted?: boolean
  onAccept?: (treatmentId: string) => void
}

function formatRange(range?: WorkflowTimeRange) {
  if (!range) return 'AI decides'
  return `${(range.startMs / 1000).toFixed(1)}s-${(range.endMs / 1000).toFixed(1)}s`
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

export function OverlayCompositionPlanCard({
  accepted = false,
  onAccept,
  plan,
}: OverlayCompositionPlanCardProps) {
  return (
    <article className="overlay-treatment-card professional-treatment-card">
      <div className="professional-treatment-card-header">
        <div>
          <span className="section-eyebrow">Overlay Composition</span>
          <h4>{plan.mediaAssetId}</h4>
        </div>
        <Badge accent={accepted ? 'success' : 'muted'}>{accepted ? 'Accepted' : plan.placement.replaceAll('_', ' ')}</Badge>
      </div>
      <p className="inline-helper">Overlay composition avoids raw pasted screenshots and protects readability.</p>
      <p>{plan.treatmentSummary}</p>

      <div className="professional-treatment-grid">
        <span><strong>Target range</strong><small>{formatRange(plan.targetRange)}</small></span>
        <span><strong>Placement</strong><small>{plan.placement.replaceAll('_', ' ')}</small></span>
        <span><strong>Safe zones</strong><small>{yesNo(plan.safeZoneAware)}</small></span>
        <span><strong>Avoid faces</strong><small>{yesNo(plan.avoidFaces)}</small></span>
        <span><strong>Avoid captions</strong><small>{yesNo(plan.avoidCaptions)}</small></span>
        <span><strong>Frame</strong><small>{plan.frameStyle.replaceAll('_', ' ')}</small></span>
        <span><strong>Transition in</strong><small>{plan.transitionIn.replaceAll('_', ' ')}</small></span>
        <span><strong>Transition out</strong><small>{plan.transitionOut.replaceAll('_', ' ')}</small></span>
        <span><strong>Privacy blur</strong><small>{yesNo(plan.privacyBlur)}</small></span>
        <span><strong>Mobile readable</strong><small>{yesNo(plan.readableOnMobile)}</small></span>
      </div>

      <Button icon={CheckCircle2} disabled={accepted} onClick={() => onAccept?.(plan.id)} size="sm" variant="secondary">
        {accepted ? 'Treatment accepted' : 'Accept Treatment'}
      </Button>
    </article>
  )
}
