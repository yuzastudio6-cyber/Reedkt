import type { StripeBillingStatusViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditCopyList, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function StripeBillingStatusCard({ stripeBilling }: { stripeBilling: StripeBillingStatusViewModel }) {
  return (
    <Card className="credit-ui-card stripe-billing-status-card">
      <CreditCardHeader badge={stripeBilling.badge} eyebrow="Stripe billing readiness" title={stripeBilling.title} />
      <CreditMetricGrid metrics={stripeBilling.metrics} />
      <CreditCopyList copy={stripeBilling.copy} />
      <CreditWarningList warnings={stripeBilling.warnings} />
    </Card>
  )
}
