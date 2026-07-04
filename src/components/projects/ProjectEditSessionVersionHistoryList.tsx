import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

type ProjectEditSessionVersionHistoryListProps = {
  items: ProjectEditSessionHistoryTimelineItem[]
}

export function ProjectEditSessionVersionHistoryList({ items }: ProjectEditSessionVersionHistoryListProps) {
  return (
    <section className="project-edit-session-history-section" data-testid="edit-session-version-history">
      <h4>Version History</h4>
      {items.length ? (
        <ul className="project-edit-session-history-list">
          {items.slice(-5).map((item) => (
            <li key={item.id}>
              <span>{item.title}</span>
              <small>{item.statusLabel ? `${item.statusLabel} - ${item.summary}` : item.summary}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No mock versions yet.</p>
      )}
    </section>
  )
}
