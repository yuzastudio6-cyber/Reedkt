import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import type { CanonicalPlanApprovalHookResult } from '../../hooks/useCanonicalPlanApproval'
import { Badge } from '../Badge'

export function CanonicalPlanApprovalStatus({
  approving,
  result,
}: Pick<CanonicalPlanApprovalHookResult, 'approving' | 'result'>) {
  if (!approving && (!result || result.status === 'not_configured')) return null

  const success = result?.status === 'approved'
  const attention = !approving && !success
  const Icon = approving ? Loader2 : success ? CheckCircle2 : AlertTriangle
  const tone = approving ? 'active' : success ? 'success' : 'attention'
  const title = approving
    ? 'Recording this exact approval'
    : success
      ? 'Plan and credits approved'
      : approvalFailureTitle(result?.status)
  const message = approving
    ? 'Locking the reviewed plan, estimate, and private credit reservation. Editing will remain stopped.'
    : result?.message ?? 'Approval could not be confirmed.'

  return (
    <section
      aria-busy={approving}
      aria-label="Plan approval status"
      aria-live={attention ? 'assertive' : 'polite'}
      className={`canonical-journey-status canonical-journey-status-${tone}`}
      data-testid={`canonical-plan-approval-${approving ? 'approving' : result!.status.replaceAll('_', '-')}`}
      role={attention ? 'alert' : 'status'}
    >
      <div className="canonical-journey-status-icon" data-tone={tone}>
        <Icon aria-hidden="true" className={approving ? 'spin-icon' : undefined} size={18} />
      </div>
      <div className="canonical-journey-status-copy">
        <div className="canonical-journey-status-heading">
          <div>
            <span className="section-eyebrow">Plan approval</span>
            <strong>{title}</strong>
          </div>
          <Badge accent={success ? 'success' : approving ? 'cyan' : 'warning'}>
            {success ? 'Locked' : approving ? 'Approving' : 'Needs attention'}
          </Badge>
        </div>
        <p>{message}</p>
        <div className="canonical-journey-boundary">
          <ShieldCheck aria-hidden="true" size={14} />
          <span>{success
            ? 'The approved version is locked. Editing, rendering, and delivery have not started.'
            : 'No tool, provider, render, or delivery action starts from this status.'}</span>
        </div>
      </div>
    </section>
  )
}

function approvalFailureTitle(
  status: NonNullable<CanonicalPlanApprovalHookResult['result']>['status'] | undefined,
): string {
  if (status === 'insufficient_credits') return 'More credits are needed'
  if (status === 'access_denied') return 'Approval access changed'
  if (status === 'blocked') return 'Review the current plan again'
  if (status === 'invalid_response') return 'Approval needs verification'
  return 'Approval was not confirmed'
}
