import { Badge } from '../Badge'
import type { EditLevelRevisionBudgetNoticeModel } from '../../types'

type EditLevelRevisionBudgetNoticeProps = {
  notice: EditLevelRevisionBudgetNoticeModel
}

export function EditLevelRevisionBudgetNotice({ notice }: EditLevelRevisionBudgetNoticeProps) {
  return (
    <section className="edit-level-revision-budget-notice" data-testid="edit-level-revision-budget-notice">
      <div>
        <span className="section-eyebrow">Future revision budget</span>
        <h3>{notice.displayName} revision budget</h3>
        <p>{notice.notice}</p>
      </div>
      <div className="edit-level-estimate-badges">
        <Badge accent="muted">Revision budget future: {notice.revisionBudgetFuture}</Badge>
        <Badge accent="success">No worker starts</Badge>
      </div>
    </section>
  )
}
