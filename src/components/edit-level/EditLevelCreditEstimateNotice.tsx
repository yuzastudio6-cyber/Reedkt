import { Badge } from '../Badge'
import type { EditLevelCreditEstimateNoticeModel } from '../../types'

type EditLevelCreditEstimateNoticeProps = {
  notice: EditLevelCreditEstimateNoticeModel
}

export function EditLevelCreditEstimateNotice({ notice }: EditLevelCreditEstimateNoticeProps) {
  return (
    <section className="edit-level-credit-estimate-notice" data-testid="edit-level-credit-estimate-notice">
      <div>
        <span className="section-eyebrow">Credit estimate</span>
        <h3>{notice.displayName} credit multiplier</h3>
        <p>{notice.notice}</p>
      </div>
      <div className="edit-level-estimate-badges">
        <Badge accent="muted">{notice.creditEstimateMultiplier.toFixed(1)}x placeholder</Badge>
        <Badge accent="success">No credits reserved</Badge>
        <Badge accent="success">No credit record</Badge>
      </div>
    </section>
  )
}
