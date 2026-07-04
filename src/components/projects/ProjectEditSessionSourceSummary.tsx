type ProjectEditSessionSourceSummaryProps = {
  summary: string
  items: string[]
}

export function ProjectEditSessionSourceSummary({ items, summary }: ProjectEditSessionSourceSummaryProps) {
  return (
    <section className="project-edit-session-context-section" data-testid="edit-session-source-summary">
      <h3>Sources</h3>
      <p>{summary}</p>
      {items.length ? (
        <ul>
          {items.slice(0, 4).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
