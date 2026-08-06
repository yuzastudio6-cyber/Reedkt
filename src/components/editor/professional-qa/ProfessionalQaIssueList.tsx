import type { ProfessionalQaItemStatus, ProfessionalQaReportItem } from '../../../types'
import { getQaItemStatusLabel } from '../../../lib/professional-qa'
import { ProfessionalQaIssueCard } from './ProfessionalQaIssueCard'

type ProfessionalQaIssueListProps = {
  items: ProfessionalQaReportItem[]
  onAcceptWarning?: (itemId: string) => void
}

const groupOrder: ProfessionalQaItemStatus[] = [
  'blocking',
  'warning',
  'accepted_warning',
  'passed',
  'info',
]

export function ProfessionalQaIssueList({
  items,
  onAcceptWarning,
}: ProfessionalQaIssueListProps) {
  if (items.length === 0) {
    return (
      <section className="inline-chat-card professional-qa-issue-list">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">QA items</span>
            <h3>No QA items yet</h3>
          </div>
        </div>
        <p className="inline-helper">Run QA to create a local report.</p>
      </section>
    )
  }

  return (
    <section className="inline-chat-card professional-qa-issue-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">QA items</span>
          <h3>Review QA findings</h3>
        </div>
      </div>
      <div className="professional-qa-issue-groups">
        {groupOrder.map((status) => {
          const groupItems = items.filter((item) => item.status === status)
          if (groupItems.length === 0) return null

          return (
            <div className="professional-qa-issue-group" key={status}>
              <h4>{getQaItemStatusLabel(status)}</h4>
              <div className="professional-qa-issue-stack">
                {groupItems.map((item) => (
                  <ProfessionalQaIssueCard
                    item={item}
                    key={item.id}
                    onAcceptWarning={onAcceptWarning}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
