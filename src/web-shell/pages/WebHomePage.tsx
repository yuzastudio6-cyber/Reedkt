import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { getProjectRoutePath } from '../web-shell-routes'
import { webShellReadinessItems } from '../web-shell-status'

export function WebHomePage() {
  const blockedItems = webShellReadinessItems.filter((item) => item.tone === 'blocked')

  return (
    <div className="web-shell-page">
      <section className="web-shell-hero">
        <div>
          <p className="web-shell-eyebrow">Phase 44C</p>
          <h2>Web production shell for controlled editing workflows.</h2>
          <p>
            The shell now separates project intake, editor workspace, jobs, artifacts, readiness, and compute route
            visibility while keeping execution disabled in the browser.
          </p>
          <div className="web-shell-actions">
            <Link className="web-shell-button primary" to="/projects">
              <span>Open projects</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link className="web-shell-button" to={getProjectRoutePath('editor_workspace')}>
              Editor shell
            </Link>
          </div>
        </div>
        <div className="web-shell-hero-status">
          <ShieldAlert aria-hidden="true" size={28} />
          <strong>Launch gates remain closed</strong>
          <span>Production, external beta, and broad real media are blocked.</span>
        </div>
      </section>
      <section className="web-shell-grid three">
        {blockedItems.map((item) => (
          <article key={item.itemId} className="web-shell-panel">
            <div className="web-shell-panel-heading compact">
              <h3>{item.label}</h3>
              <StatusBadge tone={item.tone}>Blocked</StatusBadge>
            </div>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
