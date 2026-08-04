import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { BrollIntegrationPlan, WorkflowTimeRange } from '../../../types'

type BrollIntegrationPlanCardProps = {
  plan: BrollIntegrationPlan
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

export function BrollIntegrationPlanCard({
  accepted = false,
  onAccept,
  plan,
}: BrollIntegrationPlanCardProps) {
  return (
    <article className="broll-treatment-card professional-treatment-card">
      <div className="professional-treatment-card-header">
        <div>
          <span className="section-eyebrow">B-roll Integration</span>
          <h4>{plan.mediaAssetId}</h4>
        </div>
        <Badge accent={accepted ? 'success' : 'muted'}>{accepted ? 'Accepted' : 'B-roll polish'}</Badge>
      </div>
      <p className="inline-helper">B-roll is integrated with timing, audio, crop, color, and stabilization polish.</p>

      <div className="professional-treatment-grid">
        <span><strong>Source trim</strong><small>{formatRange(plan.sourceTrimRange)}</small></span>
        <span><strong>Clean range</strong><small>{formatRange(plan.targetCleanAssemblyRange)}</small></span>
        <span><strong>Main audio</strong><small>{yesNo(plan.keepMainAudio)}</small></span>
        <span><strong>Mute asset</strong><small>{yesNo(plan.muteAssetAudio)}</small></span>
        <span><strong>Transition in</strong><small>{plan.transitionIn.replaceAll('_', ' ')}</small></span>
        <span><strong>Transition out</strong><small>{plan.transitionOut.replaceAll('_', ' ')}</small></span>
        <span><strong>Crop</strong><small>{plan.cropMode}</small></span>
        <span><strong>Color match</strong><small>{yesNo(plan.colorMatch)}</small></span>
        <span><strong>Stabilize</strong><small>{yesNo(plan.stabilize)}</small></span>
      </div>

      {plan.reasoning && <p>{plan.reasoning}</p>}

      <Button icon={CheckCircle2} disabled={accepted} onClick={() => onAccept?.(plan.id)} size="sm" variant="secondary">
        {accepted ? 'Treatment accepted' : 'Accept Treatment'}
      </Button>
    </article>
  )
}
