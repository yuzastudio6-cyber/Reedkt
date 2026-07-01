import { useMemo } from 'react'
import { createCreditLifecycleViewModel } from '../../lib/credit-ui-adapter'
import { createMockCreditLifecycleScenario } from '../../lib/credit-ui-fixtures'
import { CreditEstimateCard } from './CreditEstimateCard'
import { CreditExportLockCard } from './CreditExportLockCard'
import { CreditReservationCard } from './CreditReservationCard'
import { CreditRevisionActionCard } from './CreditRevisionActionCard'
import { CreditRuntimeGuardCard } from './CreditRuntimeGuardCard'
import { CreditSettlementReceiptCard } from './CreditSettlementReceiptCard'
import { CreditTopUpCard } from './CreditTopUpCard'
import { CreditWalletBalanceCard } from './CreditWalletBalanceCard'
import { StripeBillingStatusCard } from './StripeBillingStatusCard'

export function CreditLifecycleDemo() {
  const lifecycle = useMemo(
    () => createCreditLifecycleViewModel(createMockCreditLifecycleScenario()),
    [],
  )

  return (
    <section className="credit-lifecycle-demo" aria-label="Mock credit lifecycle cards">
      <div className="section-heading compact">
        <span className="section-eyebrow">External-beta credit lifecycle</span>
        <h2>Mock-safe credit cards from estimate to export gate</h2>
        <p>Fixture data only. This surface does not call Stripe, reserve credits, spend credits, change export readiness, call providers, or mutate production persistence.</p>
      </div>
      <div className="credit-lifecycle-grid">
        <CreditWalletBalanceCard wallet={lifecycle.wallet} />
        <CreditEstimateCard estimate={lifecycle.estimate} />
        <CreditReservationCard reservation={lifecycle.reservation} />
        <CreditRuntimeGuardCard runtimeGuard={lifecycle.runtimeGuard} />
        <CreditRevisionActionCard revisionAction={lifecycle.revisionAction} />
        <CreditSettlementReceiptCard settlement={lifecycle.settlement} />
        <CreditExportLockCard exportLock={lifecycle.exportLock} />
        <CreditTopUpCard topUp={lifecycle.topUp} />
        <StripeBillingStatusCard stripeBilling={lifecycle.stripeBilling} />
      </div>
    </section>
  )
}
