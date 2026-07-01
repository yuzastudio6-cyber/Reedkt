import type { CreditSettlementReceiptViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditLineList, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function CreditSettlementReceiptCard({ settlement }: { settlement: CreditSettlementReceiptViewModel }) {
  return (
    <Card className="credit-ui-card credit-settlement-receipt-card">
      <CreditCardHeader badge={settlement.badge} eyebrow="Settlement receipt" title={settlement.title} />
      <p>{settlement.message}</p>
      <CreditMetricGrid metrics={settlement.metrics} />
      <CreditLineList lines={settlement.lineItems} />
      <CreditWarningList warnings={settlement.warnings} />
    </Card>
  )
}
