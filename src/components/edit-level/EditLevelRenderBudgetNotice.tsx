import { Badge } from '../Badge'
import type { EditLevelRenderBudgetNoticeModel } from '../../types'

type EditLevelRenderBudgetNoticeProps = {
  notice: EditLevelRenderBudgetNoticeModel
}

export function EditLevelRenderBudgetNotice({ notice }: EditLevelRenderBudgetNoticeProps) {
  return (
    <section className="edit-level-render-budget-notice" data-testid="edit-level-render-budget-notice">
      <div>
        <span className="section-eyebrow">Future render budget</span>
        <h3>{notice.displayName} render and variant budget</h3>
        <p>{notice.notice}</p>
      </div>
      <div className="edit-level-estimate-badges">
        <Badge accent="muted">Render passes future: {notice.renderPassBudgetFuture}</Badge>
        <Badge accent="muted">Variants future: {notice.variantBudgetFuture}</Badge>
        <Badge accent="success">No render starts</Badge>
      </div>
    </section>
  )
}
