import { Badge } from '../../Badge'
import type { MockCreditEstimate } from '../../../types'

type MockCreditEstimateCardProps = {
  estimate: MockCreditEstimate | null
}

export function MockCreditEstimateCard({ estimate }: MockCreditEstimateCardProps) {
  return (
    <section className="inline-chat-card mock-credit-estimate-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Preview estimate</span>
          <h3>{estimate ? `${estimate.totalCredits} internal test credits` : 'Estimate pending'}</h3>
        </div>
        <Badge accent={estimate ? 'cyan' : 'muted'}>{estimate?.status ?? 'not ready'}</Badge>
      </div>

      <p className="inline-helper">
        {estimate?.explanation ?? 'An internal test estimate will appear when readiness can inspect the context stack.'}
      </p>
      <p className="inline-helper">This estimate is for internal testing; billing remains disabled.</p>

      {estimate && (
        <div className="mock-credit-line-list">
          {estimate.lineItems.map((item) => (
            <span key={item.id} className="mock-credit-line-item">
              <strong>{item.label}</strong>
              <small>{item.quantity} x {item.credits} credits</small>
              <small>{item.explanation}</small>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
