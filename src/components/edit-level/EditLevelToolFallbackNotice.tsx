import { Badge } from '../Badge'
import type { EditLevelToolFallbackNoticeModel } from '../../types'

type EditLevelToolFallbackNoticeProps = {
  notice: EditLevelToolFallbackNoticeModel
}

export function EditLevelToolFallbackNotice({ notice }: EditLevelToolFallbackNoticeProps) {
  return (
    <section className="edit-level-tool-fallback-notice" data-testid="edit-level-tool-fallback-notice">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Fallbacks</span>
          <h3>{notice.displayName} degraded capability notices</h3>
        </div>
        <Badge accent="warning">Planning only</Badge>
      </div>
      <ul>
        {notice.notices.slice(0, 5).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="inline-helper">{notice.boundary}</p>
    </section>
  )
}
