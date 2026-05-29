import { sampleProject } from '../web-shell-fixtures'
import { StatusBadge } from '../components/StatusBadge'

export function TimelinePanel() {
  return (
    <section className="web-shell-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Timeline</h2>
        <StatusBadge tone="info">Manifest preview</StatusBadge>
      </div>
      <div className="web-shell-timeline-ruler" aria-label="Static timeline placeholder">
        <span style={{ width: '24%' }} />
        <span style={{ width: '18%' }} />
        <span style={{ width: '32%' }} />
        <span style={{ width: '26%' }} />
      </div>
      <ul className="web-shell-compact-list">
        {sampleProject.chainSummary.slice(0, 3).map((summary) => (
          <li key={summary}>{summary}</li>
        ))}
      </ul>
    </section>
  )
}
