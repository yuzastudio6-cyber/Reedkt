import { LogOut, RefreshCw, ShieldCheck, UserCircle } from 'lucide-react'
import type { AuthBootstrapStatus, AuthenticatedUserContext } from '../../types/auth-bootstrap'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'

type AuthBootstrapStatusCardProps = {
  loading?: boolean
  configured: boolean
  status: AuthBootstrapStatus
  userContext?: AuthenticatedUserContext
  warnings?: string[]
  onRefresh?: () => void
  onSignOut?: () => void
}

function statusLabel(status: AuthBootstrapStatus): string {
  if (status === 'not_configured') return 'Not configured'
  if (status === 'signed_out') return 'Signed out'
  if (status === 'profile_missing') return 'Profile missing'
  if (status === 'workspace_missing') return 'Workspace missing'
  if (status === 'membership_missing') return 'Membership missing'
  if (status === 'ready') return 'Ready'
  return 'Error'
}

function statusAccent(status: AuthBootstrapStatus): 'success' | 'warning' | 'danger' | 'blue' | 'muted' {
  if (status === 'ready') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'not_configured' || status === 'signed_out') return 'muted'
  if (status.includes('missing')) return 'warning'
  return 'blue'
}

export function AuthBootstrapStatusCard({
  configured,
  loading = false,
  onRefresh,
  onSignOut,
  status,
  userContext,
  warnings = [],
}: AuthBootstrapStatusCardProps) {
  return (
    <Card className="auth-bootstrap-status-card">
      <div className="plan-card-header">
        <div>
          <p className="eyebrow">Auth bootstrap</p>
          <h3>Session and workspace</h3>
        </div>
        <Badge accent={statusAccent(status)}>{loading ? 'Checking' : statusLabel(status)}</Badge>
      </div>

      <div className="auth-bootstrap-status-grid">
        <span>
          <ShieldCheck aria-hidden="true" size={16} />
          Supabase {configured ? 'configured' : 'not configured'}
        </span>
        <span>
          <UserCircle aria-hidden="true" size={16} />
          {userContext?.displayName ?? userContext?.email ?? 'No signed-in user'}
        </span>
      </div>

      {userContext?.currentWorkspaceId && (
        <p className="muted-text">Workspace: {userContext.currentWorkspaceId}</p>
      )}

      {warnings.length > 0 && (
        <ul className="auth-bootstrap-warning-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="auth-bootstrap-actions">
        {onRefresh && (
          <Button icon={RefreshCw} onClick={onRefresh} size="sm" variant="ghost">
            Refresh
          </Button>
        )}
        {onSignOut && status !== 'signed_out' && status !== 'not_configured' && (
          <Button icon={LogOut} onClick={onSignOut} size="sm" variant="ghost">
            Sign out
          </Button>
        )}
      </div>
    </Card>
  )
}
