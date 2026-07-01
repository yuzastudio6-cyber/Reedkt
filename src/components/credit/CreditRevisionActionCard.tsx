import type { CreditRevisionActionCardViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditActionRow, CreditCardHeader, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function CreditRevisionActionCard({ revisionAction }: { revisionAction: CreditRevisionActionCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-revision-action-card">
      <CreditCardHeader badge={revisionAction.badge} eyebrow="Revised credit action" title={revisionAction.title} />
      <p>{revisionAction.message}</p>
      <CreditMetricGrid metrics={revisionAction.metrics} />
      <CreditActionRow actions={revisionAction.options} />
      <CreditWarningList warnings={revisionAction.warnings} />
    </Card>
  )
}
