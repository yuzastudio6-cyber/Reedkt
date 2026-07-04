import { useEffect, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Badge } from '../Badge'
import {
  readProjectEditSessionAccessPolicy,
  type ProjectEditSessionAccessPolicy,
} from '../../lib/project-edit-session-access-policy'

type ProjectEditSessionAccessPolicyNoticeProps = {
  projectId: string
  editSessionId?: string
}

export function ProjectEditSessionAccessPolicyNotice({
  editSessionId,
  projectId,
}: ProjectEditSessionAccessPolicyNoticeProps) {
  const [policy, setPolicy] = useState<ProjectEditSessionAccessPolicy | undefined>()

  useEffect(() => {
    let cancelled = false

    readProjectEditSessionAccessPolicy({ projectId, editSessionId }).then((nextPolicy) => {
      if (cancelled) return
      setPolicy(nextPolicy)
    })

    return () => {
      cancelled = true
    }
  }, [editSessionId, projectId])

  const statusLabel = policy?.status.replace(/_/g, ' ') ?? 'checking access policy'
  const missingEvidence = policy?.missingEvidence ?? []

  return (
    <section className="project-edit-session-access-policy" data-testid="project-edit-session-access-policy">
      <div className="project-edit-session-access-policy__icon" aria-hidden="true">
        {policy?.durableAuthenticatedAccessAllowed ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}
      </div>
      <div>
        <div className="project-edit-session-access-policy__heading">
          <strong>Project/session access policy</strong>
          <Badge accent={policy?.durableAuthenticatedAccessAllowed ? 'success' : 'cyan'}>{statusLabel}</Badge>
        </div>
        <p data-testid="project-edit-session-access-policy-message">
          {policy?.message ?? 'Checking read-only Auth and mock project/session access policy.'}
        </p>
        <dl className="project-edit-session-access-policy__facts" data-testid="project-edit-session-access-policy-facts">
          <div>
            <dt>Mock route access</dt>
            <dd>{policy?.mockInternalRouteAllowed === false ? 'blocked' : 'allowed'}</dd>
          </div>
          <div>
            <dt>Durable access</dt>
            <dd>{policy?.durableAuthenticatedAccessAllowed ? 'ready' : 'pending evidence'}</dd>
          </div>
          <div>
            <dt>Auth state</dt>
            <dd>{policy?.authStatus.replace(/_/g, ' ') ?? 'checking'}</dd>
          </div>
          <div>
            <dt>Persistence</dt>
            <dd>{policy?.persistenceMode.replace(/_/g, ' ') ?? 'mock internal'}</dd>
          </div>
        </dl>
        {missingEvidence.length > 0 ? (
          <ul className="project-edit-session-access-policy__missing" data-testid="project-edit-session-access-policy-missing">
            {missingEvidence.slice(0, 4).map((item) => (
              <li key={item}>{item.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
