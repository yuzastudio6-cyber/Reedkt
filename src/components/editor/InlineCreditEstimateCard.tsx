import { Badge } from '../Badge'
import { Button } from '../Button'
import type { CreditEstimate } from '../../types/reeditpro'

type InlineCreditEstimateCardProps = {
  approved: boolean
  estimate: CreditEstimate
  onApprove: () => void
  onLowerCost: () => void
}

export function InlineCreditEstimateCard({ approved, estimate, onApprove, onLowerCost }: InlineCreditEstimateCardProps) {
  const remaining = Math.max(100 - estimate.total, 0)

  return (
    <section className="inline-chat-card credit-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Credit estimate</span>
          <h3>{estimate.total} estimated credits</h3>
        </div>
        <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Before generation'}</Badge>
      </div>
      <div className="credit-summary-grid">
        <div>
          <span>Weekly bonus credits</span>
          <strong>100</strong>
        </div>
        <div>
          <span>Purchased credits</span>
          <strong>0</strong>
        </div>
        <div>
          <span>Remaining after approval</span>
          <strong>{remaining}</strong>
        </div>
      </div>
      <div className="credit-breakdown-list">
        {estimate.breakdown.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.credits} credits</strong>
            <small>{item.reason}</small>
          </div>
        ))}
      </div>
      <p className="inline-helper">Credits are only deducted after you approve. This mock demo does not deduct real credits.</p>
      <div className="inline-card-actions">
        <Button disabled={approved} onClick={onApprove} variant="primary">
          {approved ? 'Approved' : 'Approve and start'}
        </Button>
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower credit cost</Button>
        <Button disabled={approved} variant="ghost">Revise plan</Button>
      </div>
    </section>
  )
}
