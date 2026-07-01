import type { CreditReservationCardViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditLineList, CreditMetricGrid, CreditWarningList } from './CreditUIPrimitives'

export function CreditReservationCard({ reservation }: { reservation: CreditReservationCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-reservation-card">
      <CreditCardHeader badge={reservation.badge} eyebrow="Credit reservation" title={reservation.title} />
      <p>{reservation.message}</p>
      <CreditMetricGrid metrics={reservation.metrics} />
      <CreditLineList lines={reservation.lineItems} />
      <CreditWarningList warnings={reservation.warnings} />
    </Card>
  )
}
