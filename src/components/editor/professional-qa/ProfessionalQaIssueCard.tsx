import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { ProfessionalQaReportItem } from '../../../types'
import {
  getQaCategoryLabel,
  getQaItemStatusLabel,
  isQaWarningAcceptable,
} from '../../../lib/professional-qa'

type ProfessionalQaIssueCardProps = {
  item: ProfessionalQaReportItem
  onAcceptWarning?: (itemId: string) => void
}

function badgeAccent(status: ProfessionalQaReportItem['status']) {
  if (status === 'blocking') return 'danger'
  if (status === 'warning') return 'warning'
  if (status === 'accepted_warning' || status === 'passed') return 'success'
  return 'info'
}

export function ProfessionalQaIssueCard({
  item,
  onAcceptWarning,
}: ProfessionalQaIssueCardProps) {
  const relatedIds = [
    item.relatedEditCueId ? `Cue ${item.relatedEditCueId}` : null,
    item.relatedMediaAssetId ? `Asset ${item.relatedMediaAssetId}` : null,
    item.relatedConflictId ? `Conflict ${item.relatedConflictId}` : null,
    item.relatedTreatmentPlanId ? `Treatment ${item.relatedTreatmentPlanId}` : null,
    item.relatedComplianceCheckId ? `Check ${item.relatedComplianceCheckId}` : null,
  ].filter((value): value is string => Boolean(value))

  return (
    <article className={`professional-qa-issue-card professional-qa-issue-card--${item.status}`.trim()}>
      <div className="professional-qa-issue-card-header">
        <div>
          <span className="section-eyebrow">{getQaCategoryLabel(item.category)}</span>
          <h4>{item.title}</h4>
        </div>
        <Badge accent={badgeAccent(item.status)}>{getQaItemStatusLabel(item.status)}</Badge>
      </div>
      <p>{item.message}</p>
      {item.suggestedAction && <small>{item.suggestedAction}</small>}
      {relatedIds.length > 0 && (
        <div className="professional-qa-related">
          {relatedIds.map((id) => (
            <span key={id}>{id}</span>
          ))}
        </div>
      )}
      {isQaWarningAcceptable(item) && (
        <Button icon={AlertTriangle} onClick={() => onAcceptWarning?.(item.id)} size="sm" variant="secondary">
          Accept warning
        </Button>
      )}
      {item.status === 'accepted_warning' && (
        <span className="professional-qa-accepted-note">
          <CheckCircle2 aria-hidden="true" size={15} />
          Warning accepted locally
        </span>
      )}
    </article>
  )
}
