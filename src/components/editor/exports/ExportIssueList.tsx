import { Badge } from '../../Badge'
import type { ExportReadinessIssue } from '../../../types'

type ExportIssueListProps = {
  issues: ExportReadinessIssue[]
}

const groups: Array<{ label: string; severity: ExportReadinessIssue['severity'] }> = [
  { label: 'Blocking', severity: 'blocking' },
  { label: 'Warnings', severity: 'warning' },
  { label: 'Info', severity: 'info' },
]

export function ExportIssueList({ issues }: ExportIssueListProps) {
  if (!issues.length) {
    return (
      <section className="inline-chat-card export-issue-list">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Export checks</span>
            <h3>Export readiness checks look clean</h3>
          </div>
          <Badge accent="success">Clean</Badge>
        </div>
      </section>
    )
  }

  return (
    <section className="inline-chat-card export-issue-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export checks</span>
          <h3>Readiness issues</h3>
        </div>
        <Badge accent="warning">{issues.length} items</Badge>
      </div>
      <div className="export-issue-groups">
        {groups.map((group) => {
          const groupIssues = issues.filter((issue) => issue.severity === group.severity)
          if (!groupIssues.length) return null
          return (
            <div className="export-issue-group" key={group.severity}>
              <h4>{group.label}</h4>
              <div className="export-issue-stack">
                {groupIssues.map((issue) => (
                  <article className={`export-issue export-issue--${issue.severity}`} key={issue.id}>
                    <strong>{issue.message}</strong>
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
