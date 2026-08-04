import type { EditCueValidationIssue } from '../../../types'

type EditCueValidationListProps = {
  issues: EditCueValidationIssue[]
  compact?: boolean
}

function severityLabel(severity: EditCueValidationIssue['severity']) {
  if (severity === 'blocking') return 'Needs fix'
  if (severity === 'warning') return 'Review'
  return 'Note'
}

export function EditCueValidationList({ compact = false, issues }: EditCueValidationListProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <div className={`edit-cue-validation-list ${compact ? 'edit-cue-validation-list-compact' : ''}`}>
      {issues.map((issue) => (
        <div className={`edit-cue-validation-item edit-cue-validation-${issue.severity}`} key={issue.id}>
          <strong>{severityLabel(issue.severity)}</strong>
          <span>{issue.message}</span>
          {!compact && issue.suggestedFix && <small>{issue.suggestedFix}</small>}
        </div>
      ))}
    </div>
  )
}
