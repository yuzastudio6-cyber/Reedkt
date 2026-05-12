import { BadgeDollarSign, CheckCircle2, FilePenLine, Save } from 'lucide-react'
import type { CreditEstimate } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'

type CreditEstimateCardProps = {
  estimate: CreditEstimate
  approved: boolean
  onApprove: () => void
  onRevise: () => void
  onSaveDraft: () => void
}

export function CreditEstimateCard({ approved, estimate, onApprove, onRevise, onSaveDraft }: CreditEstimateCardProps) {
  const weeklyCredits = 100
  const purchasedCredits = 0
  const remaining = Math.max(0, weeklyCredits + purchasedCredits - estimate.total)

  return (
    <Card className="credit-estimate-card">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">Credit estimate before generation</span>
          <h2>Estimated {estimate.total} credits</h2>
        </div>
        <Badge accent={estimate.total > weeklyCredits ? 'warning' : 'success'}>
          {estimate.total > weeklyCredits ? 'May need purchased credits' : 'Covered by weekly bonus'}
        </Badge>
      </div>

      <div className="credit-breakdown">
        {estimate.breakdown.map((item) => (
          <div className="credit-row" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.credits} credits</strong>
            <small>{item.reason}</small>
          </div>
        ))}
      </div>

      <div className="credit-summary-grid">
        <article>
          <span>Available weekly bonus credits</span>
          <strong>{weeklyCredits}</strong>
        </article>
        <article>
          <span>Purchased credits</span>
          <strong>{purchasedCredits}</strong>
        </article>
        <article>
          <span>Estimated total</span>
          <strong>{estimate.total}</strong>
        </article>
        <article>
          <span>Remaining after approval</span>
          <strong>{remaining}</strong>
        </article>
      </div>

      <p className="credit-note">Credits are deducted only after approval. Failed ReeditPro generation should be refundable later. No real credits are deducted in this mock flow.</p>

      <div className="approval-actions">
        <Button disabled={approved} icon={CheckCircle2} onClick={onApprove} variant="primary">
          {approved ? 'Plan approved' : 'Approve plan'}
        </Button>
        <Button icon={FilePenLine} onClick={onRevise} variant="secondary">
          Revise plan
        </Button>
        {approved ? (
          <Button icon={BadgeDollarSign} to="/editor" variant="secondary">
            Open in AI Editor
          </Button>
        ) : (
          <Button disabled icon={BadgeDollarSign} variant="secondary">
            Open in AI Editor
          </Button>
        )}
        <Button icon={Save} onClick={onSaveDraft} variant="ghost">
          Save draft
        </Button>
      </div>
    </Card>
  )
}
