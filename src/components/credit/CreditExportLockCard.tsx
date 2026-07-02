import type { CreditExportLockCardViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function CreditExportLockCard({ exportLock }: { exportLock: CreditExportLockCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-export-lock-card">
      <CreditCardHeader badge={exportLock.badge} eyebrow="Export credit gate" title={exportLock.title} />
      <p>{exportLock.message}</p>
      <CreditMetricGrid metrics={exportLock.metrics} />
      <CreditWarningList warnings={exportLock.warnings} />
    </Card>
  )
}
