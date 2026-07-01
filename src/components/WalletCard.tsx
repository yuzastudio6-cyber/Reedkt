import { BadgeDollarSign, CreditCard, Plus } from 'lucide-react'
import { creditActivity, walletStats } from '../data/mockData'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { CreditLifecycleDemo } from './credit'
import { MetricCard } from './MetricCard'

const creditPacks = [
  '100 credits = $10.00',
  '250 credits = $25.00',
  '500 credits = $50.00',
  '1,000 credits = $100.00',
  '2,500 credits = $250.00',
]

export function WalletOverview() {
  return (
    <div className="wallet-page-stack">
      <div className="wallet-grid">
        {walletStats.map((stat) => (
          <MetricCard accent={stat.accent} detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
        <Card className="wallet-card">
          <BadgeDollarSign size={26} />
          <h2>Credit Wallet</h2>
          <p>Subscription is software access. Credits pay for AI generation, rendering, editing usage, Real Motion, SoundSync, and future exports.</p>
          <p>The lifecycle cards below show mock/test estimate, reservation, revised-credit, settlement, export lock, top-up, and Stripe readiness states without real billing or export readiness changes.</p>
          <div className="wallet-actions">
            <Button icon={Plus} variant="primary">
              Add credits mock
            </Button>
            <Button icon={CreditCard} variant="secondary">
              Billing placeholder
            </Button>
          </div>
        </Card>
        <Card className="activity-card">
          <div className="panel-heading">
            <h2>Mock credit packs</h2>
            <Badge accent="warning">No payment integration</Badge>
          </div>
          {creditPacks.map((pack) => (
            <div className="activity-row" key={pack}>
              <span>{pack}</span>
              <Badge accent="blue">Mock</Badge>
            </div>
          ))}
        </Card>
        <Card className="activity-card">
          <div className="panel-heading">
            <h2>Credit activity</h2>
            <Badge accent="cyan">Mock data</Badge>
          </div>
          {creditActivity.map((item) => (
            <div className="activity-row" key={item.label}>
              <span>{item.label}</span>
              <Badge accent={item.state}>{item.value}</Badge>
            </div>
          ))}
        </Card>
      </div>
      <CreditLifecycleDemo />
    </div>
  )
}
