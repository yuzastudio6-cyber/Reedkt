import type { ProfessionalIntegrationIssue } from '../../../types'

type ProfessionalQaRiskListProps = {
  issues: ProfessionalIntegrationIssue[]
  compact?: boolean
}

const severityOrder: ProfessionalIntegrationIssue['severity'][] = ['blocking', 'warning', 'info']

function severityLabel(severity: ProfessionalIntegrationIssue['severity']) {
  if (severity === 'blocking') return 'Needs review'
  if (severity === 'warning') return 'Warning'
  return 'Note'
}

export function ProfessionalQaRiskList({ compact = false, issues }: ProfessionalQaRiskListProps) {
  const sortedIssues = [...issues].sort((a, b) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  )

  return (
    <section className={`inline-chat-card professional-risk-list ${compact ? 'professional-risk-list-compact' : ''}`.trim()}>
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Professional QA risks</span>
          <h3>{issues.length === 0 ? 'Professional treatment checks look clean' : 'Review these before QA or generation'}</h3>
        </div>
      </div>

      {sortedIssues.length === 0 ? (
        <p className="inline-helper">Professional treatment checks look clean.</p>
      ) : (
        <div className="professional-risk-stack">
          {sortedIssues.map((issue) => (
            <div className={`professional-risk professional-risk--${issue.severity}`} key={issue.id}>
              <strong>{severityLabel(issue.severity)}</strong>
              <span>{issue.message}</span>
              {issue.suggestedAction && <small>{issue.suggestedAction}</small>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
