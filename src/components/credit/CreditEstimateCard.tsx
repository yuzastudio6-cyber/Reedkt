import type { CreditEstimateCardViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditActionRow, CreditCardHeader, CreditCopyList, CreditLineList, CreditWarningList } from './CreditUIPrimitives'

export function CreditEstimateCard({ estimate }: { estimate: CreditEstimateCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-estimate-lifecycle-card">
      <CreditCardHeader badge={estimate.badge} eyebrow="Credit estimate" title={estimate.title} />
      <div className="credit-ui-summary-strip">
        <span><strong>{estimate.estimateRange}</strong><small>Estimate range</small></span>
        <span><strong>{estimate.expectedEstimate}</strong><small>Expected estimate</small></span>
        <span><strong>{estimate.requiredHold}</strong><small>Required hold = maximum estimate</small></span>
        <span><strong>{estimate.topUpRequired}</strong><small>Required top-up</small></span>
      </div>
      <CreditCopyList copy={estimate.copy} />
      <CreditLineList lines={estimate.lineItems} />
      <CreditLineList lines={estimate.lowerCostOptions} />
      <CreditActionRow actions={estimate.actions} />
      <CreditWarningList warnings={estimate.warnings} />
    </Card>
  )
}
