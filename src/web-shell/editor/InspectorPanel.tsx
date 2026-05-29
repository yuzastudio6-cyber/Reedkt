import { stagingPostureSummary } from '../web-shell-status'
import { StatusBadge } from '../components/StatusBadge'

export function InspectorPanel() {
  return (
    <section className="web-shell-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Inspector</h2>
        <StatusBadge tone="warning">Report-driven</StatusBadge>
      </div>
      <dl className="web-shell-meta-grid single">
        <div>
          <dt>Cloud execution</dt>
          <dd>Gated by backend jobs</dd>
        </div>
        <div>
          <dt>Local worker</dt>
          <dd>Future desktop path</dd>
        </div>
        <div>
          <dt>Browser media processing</dt>
          <dd>Disabled</dd>
        </div>
      </dl>
      <ul className="web-shell-compact-list">
        {stagingPostureSummary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
