import { Badge } from '../Badge'
import type { EditLevelEstimateNoticeModel } from '../../lib/edit-level-ui-adapter'

type EditLevelEstimateNoticeProps = {
  notice: EditLevelEstimateNoticeModel
}

export function EditLevelEstimateNotice({ notice }: EditLevelEstimateNoticeProps) {
  return (
    <section className="edit-level-estimate-notice" data-testid="edit-level-estimate-notice">
      <div>
        <span className="section-eyebrow">Estimate only</span>
        <h3>{notice.displayName} estimate profile</h3>
        <p>{notice.notice}</p>
      </div>
      <div className="edit-level-estimate-badges">
        <Badge accent="muted">{notice.creditEstimateMultiplier}x estimate</Badge>
        <Badge accent="muted">Render budget future: {notice.renderBudgetFuture}</Badge>
        <Badge accent="success">No credits spent</Badge>
      </div>
    </section>
  )
}
