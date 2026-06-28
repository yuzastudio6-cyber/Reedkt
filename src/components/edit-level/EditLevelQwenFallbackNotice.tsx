import type { EditLevelQwenFallbackNoticeModel } from '../../types'

type EditLevelQwenFallbackNoticeProps = {
  notice: EditLevelQwenFallbackNoticeModel
}

export function EditLevelQwenFallbackNotice({ notice }: EditLevelQwenFallbackNoticeProps) {
  return (
    <section className="edit-level-qwen-fallback-notice" data-testid="edit-level-qwen-fallback-notice">
      <span className="section-eyebrow">Qwen fallback</span>
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
