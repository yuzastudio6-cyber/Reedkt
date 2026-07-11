import type { EditLevelQAFallbackNoticeModel } from '../../types'

type EditLevelQAFallbackNoticeProps = {
  notice: EditLevelQAFallbackNoticeModel
}

export function EditLevelQAFallbackNotice({ notice }: EditLevelQAFallbackNoticeProps) {
  return (
    <section className="edit-level-qa-fallback-notice" data-testid="edit-level-qa-fallback-notice">
      <span className="section-eyebrow">QA fallback</span>
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
