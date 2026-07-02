import type { EditLevelSourceUnderstandingFallbackNoticeModel } from '../../types'

type EditLevelSourceUnderstandingFallbackNoticeProps = {
  notice: EditLevelSourceUnderstandingFallbackNoticeModel
}

export function EditLevelSourceUnderstandingFallbackNotice({
  notice,
}: EditLevelSourceUnderstandingFallbackNoticeProps) {
  return (
    <section className="edit-level-source-fallback-notice" data-testid="edit-level-source-fallback-notice">
      <span className="section-eyebrow">Source fallback</span>
      <h3>{notice.displayName} fallback policy</h3>
      <ul>
        {notice.notices.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="inline-helper">{notice.boundary}</p>
    </section>
  )
}
