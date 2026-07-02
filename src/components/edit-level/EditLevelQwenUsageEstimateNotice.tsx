import type { EditLevelQwenUsageEstimateNoticeModel } from '../../types'

type EditLevelQwenUsageEstimateNoticeProps = {
  notice: EditLevelQwenUsageEstimateNoticeModel
}

export function EditLevelQwenUsageEstimateNotice({ notice }: EditLevelQwenUsageEstimateNoticeProps) {
  return (
    <section className="edit-level-qwen-usage-notice" data-testid="edit-level-qwen-usage-notice">
      <span className="section-eyebrow">Qwen usage estimate</span>
      <h3>{notice.displayName} planning estimate</h3>
      <div className="edit-level-qwen-badge-set">
        <span>{notice.usageEstimatePolicy.replaceAll('_', ' ')}</span>
        <span>{notice.creditBehavior.replaceAll('_', ' ')}</span>
      </div>
      <p>{notice.notice}</p>
    </section>
  )
}
