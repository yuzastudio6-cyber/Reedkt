type EditLevelBoundaryNoticeProps = {
  summary: string[]
}

export function EditLevelBoundaryNotice({ summary }: EditLevelBoundaryNoticeProps) {
  return (
    <section className="edit-level-boundary-notice" data-testid="edit-level-boundary-notice">
      <span className="section-eyebrow">Mock/local beta boundary</span>
      <h3>Selection does not start execution</h3>
      <ul>
        {summary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
