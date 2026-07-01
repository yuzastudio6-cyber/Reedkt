import type { CreditRuntimeGuardCardViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function CreditRuntimeGuardCard({ runtimeGuard }: { runtimeGuard: CreditRuntimeGuardCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-runtime-guard-card">
      <CreditCardHeader badge={runtimeGuard.badge} eyebrow="Runtime guard" title={runtimeGuard.title} />
      <p>{runtimeGuard.message}</p>
      <CreditMetricGrid metrics={runtimeGuard.metrics} />
      <CreditWarningList warnings={runtimeGuard.warnings} />
    </Card>
  )
}
