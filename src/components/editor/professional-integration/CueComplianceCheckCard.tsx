import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { CueComplianceCheck, WorkflowTimeRange } from '../../../types'

type CueComplianceCheckCardProps = {
  check: CueComplianceCheck
  accepted?: boolean
  onAccept?: (checkId: string) => void
}

function formatRange(range?: WorkflowTimeRange) {
  if (!range) return 'No fixed timing'
  return `${(range.startMs / 1000).toFixed(1)}s-${(range.endMs / 1000).toFixed(1)}s`
}

function accentForStatus(status: CueComplianceCheck['status']) {
  if (status === 'passed') return 'success'
  if (status === 'failed' || status === 'warning') return 'warning'
  return 'muted'
}

export function CueComplianceCheckCard({
  accepted = false,
  check,
  onAccept,
}: CueComplianceCheckCardProps) {
  return (
    <article className={`cue-compliance-card professional-treatment-card cue-compliance-card--${check.status}`}>
      <div className="professional-treatment-card-header">
        <div>
          <span className="section-eyebrow">Cue Compliance</span>
          <h4>{check.editCueId}</h4>
        </div>
        <Badge accent={accepted ? 'success' : accentForStatus(check.status)}>
          {accepted ? 'Accepted' : check.status}
        </Badge>
      </div>
      <p className="inline-helper">Checks whether the user cue has a professional treatment path.</p>
      <p>{check.message}</p>

      <div className="professional-treatment-grid">
        <span><strong>Mapped range</strong><small>{formatRange(check.mappedTimeRange)}</small></span>
        <span><strong>User review</strong><small>{check.requiresUserReview ? 'Required' : 'Not required'}</small></span>
        <span><strong>Risks</strong><small>{check.risks.length}</small></span>
      </div>

      {check.risks.length > 0 && (
        <div className="professional-risk-chip-row">
          {check.risks.map((risk) => <span key={risk}>{risk.replaceAll('_', ' ')}</span>)}
        </div>
      )}

      <Button
        icon={CheckCircle2}
        disabled={accepted || check.status === 'failed'}
        onClick={() => onAccept?.(check.id)}
        size="sm"
        variant="secondary"
      >
        {accepted ? 'Check accepted' : check.status === 'failed' ? 'Resolve before accepting' : 'Accept Check'}
      </Button>
    </article>
  )
}
