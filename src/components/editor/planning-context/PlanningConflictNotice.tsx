import { Badge } from '../../Badge'
import type { PlanningContext, PlanningReadinessIssue } from '../../../types'

type PlanningConflictNoticeProps = {
  planningContext: PlanningContext
}

function severityAccent(severity: PlanningReadinessIssue['severity']) {
  if (severity === 'blocking') return 'warning'
  if (severity === 'warning') return 'warning'
  return 'muted'
}

function severityLabel(severity: PlanningReadinessIssue['severity']) {
  if (severity === 'blocking') return 'Blocking'
  if (severity === 'warning') return 'Warning'
  return 'Info'
}

export function PlanningConflictNotice({ planningContext }: PlanningConflictNoticeProps) {
  const issues = [...planningContext.readinessIssues].sort((first, second) => {
    const order = { blocking: 0, warning: 1, info: 2 }
    return order[first.severity] - order[second.severity]
  })

  return (
    <section className="inline-chat-card planning-conflict-notice">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Planning issues</span>
          <h3>{issues.length ? 'Review these before generation' : 'Planning inputs look clean'}</h3>
        </div>
        <Badge accent={planningContext.blockingIssueCount > 0 ? 'warning' : 'success'}>
          {planningContext.unresolvedConflictIds.length} unresolved conflict{planningContext.unresolvedConflictIds.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {issues.length === 0 ? (
        <p className="inline-helper">No blocking planning issues or warnings are currently detected.</p>
      ) : (
        <div className="planning-issue-list">
          {issues.map((issue) => (
            <article className={`planning-issue planning-issue--${issue.severity}`} key={issue.id}>
              <div>
                <Badge accent={severityAccent(issue.severity)}>{severityLabel(issue.severity)}</Badge>
                <strong>{issue.message}</strong>
              </div>
              {issue.suggestedAction && <small>{issue.suggestedAction}</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
