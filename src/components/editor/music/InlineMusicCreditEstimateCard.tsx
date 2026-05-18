import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { MusicCreditEstimateView } from './musicChatUiData'

type InlineMusicCreditEstimateCardProps = {
  approved: boolean
  estimate: MusicCreditEstimateView
  onApprove: () => void
  onDialogueBedOnly: () => void
  onLowerCost: () => void
  onSkipMusic: () => void
}

export function InlineMusicCreditEstimateCard({
  approved,
  estimate,
  onApprove,
  onDialogueBedOnly,
  onLowerCost,
  onSkipMusic,
}: InlineMusicCreditEstimateCardProps) {
  return (
    <section className="inline-chat-card music-inline-card music-credit-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Music credit estimate</span>
          <h3>{estimate.totalCredits} estimated music credits</h3>
        </div>
        <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Approval required'}</Badge>
      </div>
      <div className="music-score-grid">
        <span><strong>Music cue count</strong>{estimate.cueCount}</span>
        <span><strong>Generated cues</strong>{estimate.generatedCueCount}</span>
        <span><strong>Lyria prompt planning</strong>{estimate.planningCredits} credits</span>
        <span><strong>Generated music cues</strong>{estimate.generationCredits} credits</span>
        <span><strong>QA / mix planning</strong>{estimate.qaMixCredits} credits</span>
        <span><strong>Render support</strong>{estimate.renderSupportCredits} credits</span>
        <span><strong>Available credits</strong>{estimate.availableCredits}</span>
        <span><strong>Approval required</strong>Yes</span>
      </div>
      <p className="music-muted-note">Music generation starts only after approval. This mock demo does not spend real credits.</p>
      <div className="inline-card-actions">
        <Button disabled={approved} onClick={onApprove} variant="primary">
          {approved ? 'Music credits approved' : 'Approve music credits'}
        </Button>
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower music cost</Button>
        <Button disabled={approved} onClick={onDialogueBedOnly} variant="ghost">Generate only dialogue bed</Button>
        <Button disabled={approved} onClick={onSkipMusic} variant="ghost">Skip music</Button>
      </div>
    </section>
  )
}
