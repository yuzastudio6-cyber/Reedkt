type ProjectEditSessionVersionPreviewSummaryProps = {
  summary: string
  versionItems: string[]
  previewItems: string[]
}

export function ProjectEditSessionVersionPreviewSummary({
  previewItems,
  summary,
  versionItems,
}: ProjectEditSessionVersionPreviewSummaryProps) {
  const items = [...versionItems.slice(0, 3), ...previewItems.slice(0, 3)]
  return (
    <section className="project-edit-session-context-section" data-testid="edit-session-version-preview-summary">
      <h3>Versions and previews</h3>
      <p>{summary}</p>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
