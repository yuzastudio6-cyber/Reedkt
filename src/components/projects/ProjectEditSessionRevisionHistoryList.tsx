import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

type ProjectEditSessionRevisionHistoryListProps = {
  items: ProjectEditSessionHistoryTimelineItem[]
}

export function ProjectEditSessionRevisionHistoryList({ items }: ProjectEditSessionRevisionHistoryListProps) {
  return (
    <section className="project-edit-session-history-section" data-testid="edit-session-revision-history">
      <h4>Revision History</h4>
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
        <p>No revisions yet.</p>
      )}
    </section>
  )
}
