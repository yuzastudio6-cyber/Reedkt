import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return (
    <div className="web-shell-page">
      <EmptyState title="Route not found">
        This web shell route does not exist. The production shell routes are explicit and report-only in Phase 44C.
      </EmptyState>
      <Link className="web-shell-button primary" to="/">
        Return home
      </Link>
    </div>
  )
}
