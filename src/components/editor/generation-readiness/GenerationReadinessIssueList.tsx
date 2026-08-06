import { Badge } from '../../Badge'
import type { GenerationReadinessIssue } from '../../../types'

type GenerationReadinessIssueListProps = {
  issues: GenerationReadinessIssue[]
}

const GROUPS: Array<{
  severity: GenerationReadinessIssue['severity']
  label: string
}> = [
  { severity: 'blocking', label: 'Blocking' },
  { severity: 'warning', label: 'Warnings' },
  { severity: 'info', label: 'Info' },
]

function accentForSeverity(severity: GenerationReadinessIssue['severity']) {
  if (severity === 'blocking') return 'danger'
  if (severity === 'warning') return 'warning'
  return 'cyan'
}

export function GenerationReadinessIssueList({ issues }: GenerationReadinessIssueListProps) {
  if (issues.length === 0) {
    return (
      <section className="inline-chat-card generation-readiness-issue-list">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Readiness issues</span>
            <h3>Private review checks look clean</h3>
          </div>
          <Badge accent="success">Clean</Badge>
        </div>
      </section>
    )
  }

  return (
    <section className="inline-chat-card generation-readiness-issue-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Readiness issues</span>
          <h3>Review readiness before private review</h3>
        </div>
      </div>

      <div className="generation-readiness-issue-groups">
        {GROUPS.map((group) => {
          const groupIssues = issues.filter((issue) => issue.severity === group.severity)
          if (groupIssues.length === 0) return null

          return (
            <div className="generation-readiness-issue-group" key={group.severity}>
              <h4>{group.label}</h4>
              <div className="generation-readiness-issue-stack">
                {groupIssues.map((issue) => (
                  <article className={`generation-readiness-issue generation-readiness-issue--${issue.severity}`} key={issue.id}>
                    <div className="generation-readiness-issue-header">
                      <strong>{issue.message}</strong>
                      <Badge accent={accentForSeverity(issue.severity)}>{issue.severity}</Badge>
                    </div>
                    {issue.suggestedAction && <small>{issue.suggestedAction}</small>}
                  </article>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
