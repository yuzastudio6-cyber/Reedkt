import { WalletCards } from 'lucide-react'
import type { CreditWalletSummaryViewModel } from '../../lib/credit-ui-adapter'
import { Card } from '../Card'
import { CreditCardHeader, CreditMetricGrid } from './CreditUIPrimitives'

export function CreditWalletBalanceCard({ wallet }: { wallet: CreditWalletSummaryViewModel }) {
  return (
    <Card className="credit-ui-card credit-wallet-balance-card">
      <CreditCardHeader badge={wallet.badge} eyebrow="Wallet balance" title={wallet.title} />
      <div className="credit-ui-icon-copy">
        <WalletCards aria-hidden="true" size={24} />
        <p>{wallet.usageCopy}</p>
      </div>
      <CreditMetricGrid metrics={wallet.metrics} />
      <div className="credit-ui-pill-row">
        {wallet.weeklyBonusCreditsLabel && <span>{wallet.weeklyBonusCreditsLabel}</span>}
        {wallet.purchasedCreditsLabel && <span>{wallet.purchasedCreditsLabel}</span>}
        {wallet.outstandingCreditsLabel && <strong>{wallet.outstandingCreditsLabel}</strong>}
      </div>
      <p className="credit-ui-muted">{wallet.mockCopy}</p>
    </Card>
  )
}
