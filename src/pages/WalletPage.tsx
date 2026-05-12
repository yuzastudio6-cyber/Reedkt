import { AppShell } from '../components/AppShell'
import { WalletOverview } from '../components/WalletCard'

export function WalletPage() {
  return (
    <AppShell description="Track mock AI credits for edit planning, visual generation, Real Motion previews, SoundSync timing, and exports." eyebrow="Credit Wallet" title="Credit Wallet">
      <WalletOverview />
    </AppShell>
  )
}
