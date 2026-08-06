import { Badge } from '../../Badge'
import type { RevisionCreditEstimate } from '../../../types'

type RevisionCreditEstimateCardProps = {
  estimate: RevisionCreditEstimate | null
}

export function RevisionCreditEstimateCard({ estimate }: RevisionCreditEstimateCardProps) {
  if (!estimate) {
    return (
      <section className="inline-chat-card revision-credit-estimate-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Revision estimate</span>
            <h3>No credits required</h3>
          </div>
          <Badge accent="success">Free/local</Badge>
        </div>
        <p className="inline-helper">Local-only and metadata-only revisions do not require a credit estimate.</p>
      </section>
    )
  }

  return (
    <section className="inline-chat-card revision-credit-estimate-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision estimate</span>
          <h3>{estimate.totalCredits} internal test credits</h3>
        </div>
        <Badge accent={estimate.totalCredits > 0 ? 'warning' : 'success'}>{estimate.status}</Badge>
      </div>
      <p className="inline-helper">{estimate.explanation}</p>
      <div className="revision-credit-line-list">
        {estimate.lineItems.length === 0 ? (
          <span className="revision-credit-line-item">
            <strong>0 credits</strong>
            <small>No credit-bearing revision work.</small>
          </span>
        ) : estimate.lineItems.map((item) => (
          <span className="revision-credit-line-item" key={item.id}>
            <strong>{item.label}: {item.credits}</strong>
            <small>{item.quantity} x internal test rule · {item.explanation}</small>
          </span>
        ))}
      </div>
      <p className="inline-helper">This estimate is for internal testing; billing remains disabled.</p>
    </section>
  )
}
