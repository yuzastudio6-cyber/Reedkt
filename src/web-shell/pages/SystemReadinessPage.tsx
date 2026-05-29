import { StatusBadge } from '../components/StatusBadge'
import { stagingPostureSummary, webShellReadinessItems } from '../web-shell-status'

export function SystemReadinessPage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">System readiness</p>
          <h2>Report-driven readiness for staging and launch gates.</h2>
          <p>
            This page is static shell state in Phase 44C. It does not query live GCP, mutate Cloud Run jobs, or inspect
            private infrastructure from the browser.
          </p>
        </div>
      </section>
      <section className="web-shell-grid two">
        {webShellReadinessItems.map((item) => (
          <article key={item.itemId} className="web-shell-panel">
            <div className="web-shell-panel-heading compact">
              <h3>{item.label}</h3>
              <StatusBadge tone={item.tone}>{item.tone}</StatusBadge>
            </div>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>
      <section className="web-shell-panel">
        <div className="web-shell-panel-heading compact">
          <h2>Staging posture</h2>
          <StatusBadge tone="warning">Private test</StatusBadge>
        </div>
        <ul className="web-shell-check-list">
          {stagingPostureSummary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
