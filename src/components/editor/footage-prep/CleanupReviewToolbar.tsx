import { RotateCcw, ShieldCheck } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'

type CleanupReviewToolbarProps = {
  accepted: boolean
  operationCount: number
  onAcceptCleanup?: () => void
  onResetAll?: () => void
}

export function CleanupReviewToolbar({
  accepted,
  onAcceptCleanup,
  onResetAll,
  operationCount,
}: CleanupReviewToolbarProps) {
  return (
    <section className="inline-chat-card footage-prep-review-toolbar">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Clean Assembly Review</span>
          <h3>{accepted ? 'Cleanup accepted' : 'Review cleanup decisions'}</h3>
        </div>
        <Badge accent={accepted ? 'success' : 'warning'}>{accepted ? 'Accepted' : 'Reviewable'}</Badge>
      </div>

      <div className="footage-prep-review-toolbar-row">
        <p className="inline-helper">
          {operationCount === 0 ? 'No local review changes' : `${operationCount} local review changes`}
        </p>
        <div className="footage-prep-review-actions">
          <Button disabled={accepted} icon={ShieldCheck} onClick={onAcceptCleanup} variant={accepted ? 'secondary' : 'primary'}>
            Accept Clean Assembly
          </Button>
          <Button disabled={operationCount === 0} icon={RotateCcw} onClick={onResetAll} variant="secondary">
            Reset Review
          </Button>
        </div>
      </div>
    </section>
  )
}
