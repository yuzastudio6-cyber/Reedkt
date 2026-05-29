import { ComputeRouteBadge } from '../components/ComputeRouteBadge'
import { StatusBadge } from '../components/StatusBadge'
import { computeRouteExamples } from '../web-shell-fixtures'

export function ComputeRoutesPage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Compute route visibility</p>
          <h2>Route categories are visible, but execution is disabled.</h2>
          <p>
            Phase 44C shows planned browser, cloud, render, blocked, approval-needed, and future desktop route categories
            without executing local or cloud work.
          </p>
        </div>
        <StatusBadge tone="blocked">Informational only</StatusBadge>
      </section>
      <section className="web-shell-route-table" aria-label="Compute route examples">
        {computeRouteExamples.map((route) => (
          <article key={route.routeId} className="web-shell-route-row">
            <div>
              <strong>{route.label}</strong>
              <span>{route.source} to {route.destination}</span>
            </div>
            <ComputeRouteBadge category={route.category} />
            <StatusBadge tone={route.status === 'blocked' ? 'blocked' : route.status === 'needs_approval' ? 'warning' : 'info'}>
              {route.status.replace('_', ' ')}
            </StatusBadge>
            <p>{route.summary}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
