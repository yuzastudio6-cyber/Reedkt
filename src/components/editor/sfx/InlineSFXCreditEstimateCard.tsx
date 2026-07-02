import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { SFXCreditEstimateView } from './sfxChatUiData'

type InlineSFXCreditEstimateCardProps = {
  approved: boolean
  estimate: SFXCreditEstimateView
  onApprove: () => void
  onInternalLibraryOnly: () => void
  onLowerCost: () => void
  onMMAudioDraftOnly: () => void
  onSkipSFX: () => void
}

export function InlineSFXCreditEstimateCard({
  approved,
  estimate,
  onApprove,
  onInternalLibraryOnly,
  onLowerCost,
  onMMAudioDraftOnly,
  onSkipSFX,
}: InlineSFXCreditEstimateCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-credit-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">SFX credit estimate</span>
          <h3>{estimate.estimatedCredits} estimated SFX credits</h3>
        </div>
        <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Approval required'}</Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>SFX events</strong>{estimate.eventCount}</span>
        <span><strong>Library searches</strong>{estimate.librarySearchCount}</span>
        <span><strong>MMAudio draft</strong>{estimate.mmaudioDraftCount}</span>
        <span><strong>Mirelo production</strong>{estimate.mireloProductionCount}</span>
        <span><strong>Timing / trim</strong>{estimate.timingTrimCredits} credits</span>
        <span><strong>Mix / QA</strong>{estimate.mixQACredits} credits</span>
        <span><strong>Approval required</strong>{estimate.approvalRequired ? 'Yes' : 'No'}</span>
      </div>

      <p className="sfx-muted-note">SFX generation starts only after approval. This mock demo does not spend real credits.</p>

      <div className="inline-card-actions">
        <Button disabled={approved} onClick={onApprove} variant="primary">{approved ? 'SFX credits approved' : 'Approve SFX credits'}</Button>
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower SFX cost</Button>
        <Button disabled={approved} onClick={onInternalLibraryOnly} variant="ghost">Use internal library only</Button>
        <Button disabled={approved} onClick={onMMAudioDraftOnly} variant="ghost">Use MMAudio draft only</Button>
        <Button disabled={approved} onClick={onSkipSFX} variant="ghost">Skip SFX</Button>
      </div>
    </section>
  )
}
