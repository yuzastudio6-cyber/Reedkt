import { ListPlus, RotateCcw } from 'lucide-react'
import { Button } from '../../Button'

type EditCuesToolbarProps = {
  cueCount: number
  operationCount: number
  blockingIssueCount: number
  onCreateCue?: () => void
  onResetCues?: () => void
}

export function EditCuesToolbar({
  blockingIssueCount,
  cueCount,
  onCreateCue,
  onResetCues,
  operationCount,
}: EditCuesToolbarProps) {
  return (
    <section className="inline-chat-card edit-cues-toolbar">
      <div className="edit-cues-toolbar-row">
        <div>
          <span className="section-eyebrow">Cue controls</span>
          <h3>{cueCount} cues</h3>
          <p className="inline-helper">
            {operationCount === 0 ? 'No local cue changes yet' : `${operationCount} local cue changes`}
            {blockingIssueCount > 0 ? ` · ${blockingIssueCount} blocking issues` : ''}
          </p>
        </div>

        <div className="edit-cues-toolbar-actions">
          <Button icon={ListPlus} onClick={onCreateCue} variant="secondary">
            Add Cue
          </Button>
          <Button
            disabled={cueCount === 0 && operationCount === 0}
            icon={RotateCcw}
            onClick={onResetCues}
            variant="ghost"
          >
            Reset Cues
          </Button>
        </div>
      </div>
    </section>
  )
}
