import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

type ProjectEditSessionSnapshotTimelineProps = {
  items: ProjectEditSessionHistoryTimelineItem[]
}

export function ProjectEditSessionSnapshotTimeline({ items }: ProjectEditSessionSnapshotTimelineProps) {
  return (
    <section className="project-edit-session-history-section" data-testid="edit-session-snapshot-timeline">
      <h4>Snapshot Timeline</h4>
      {items.length ? (
        <ol className="project-edit-session-history-list">
          {items.slice(-6).map((item) => (
            <li key={item.id}>
              <span>{item.title}</span>
              <small>{item.summary}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>No snapshots yet.</p>
      )}
    </section>
  )
}
