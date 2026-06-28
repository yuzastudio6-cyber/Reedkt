import type { EditLevelEstimateBoundaryNoticeModel } from '../../types'

type EditLevelEstimateBoundaryNoticeProps = {
  notice: EditLevelEstimateBoundaryNoticeModel
}

export function EditLevelEstimateBoundaryNotice({ notice }: EditLevelEstimateBoundaryNoticeProps) {
  return (
    <section className="edit-level-estimate-boundary-notice" data-testid="edit-level-estimate-boundary-notice">
      <span className="section-eyebrow">Estimate boundary</span>
      <h3>{notice.displayName} estimate-only boundary</h3>
      <p>{notice.shortCopy}</p>
      <p>{notice.detailedCopy}</p>
      <ul>
        {notice.notices.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
