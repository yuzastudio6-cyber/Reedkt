import { ArrowRight, CheckCircle2, Coins, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MarketingNav } from '../components/MarketingNav'
import { PricingCard } from '../components/PricingCard'
import { pricingPlans } from '../data/mockData'

const creditPacks = [
  ['$5', '100 credits'],
  ['$10', '220 credits'],
  ['$25', '575 credits'],
  ['$50', '1,200 credits'],
  ['$100', '2,500 credits'],
]

export function PricingPage() {
  return (
    <div className="marketing-page pricing-page">
      <MarketingNav />
      <section className="pricing-hero">
        <Badge accent="cyan">Subscription + credits</Badge>
        <h1>Software access is weekly. AI generation uses Reedit Credits.</h1>
        <p>ReeditPro shows the edit plan and credit estimate before generation. No real payment, checkout, or credit deduction is included in this frontend phase.</p>
        <div className="hero-actions">
          <Button icon={ArrowRight} to="/projects/new" variant="primary">
            Start with chat
          </Button>
          <Button to="/dashboard" variant="secondary">
            View dashboard
          </Button>
        </div>
      </section>

      <section className="landing-section pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </section>

      <section className="landing-section credit-explainer-grid">
        <Card>
          <Coins size={24} />
          <h2>Credit model</h2>
          <p>Subscription is software access. Edit Credits pay for AI generation, rendering, editing usage, visual systems, SoundSync, and future export work.</p>
        </Card>
        <Card>
          <ShieldCheck size={24} />
          <h2>Approval gate</h2>
          <p>ReeditPro does not offer unlimited AI editing for $10/week or $20/week. Credits are estimated first and deducted only after approval in production.</p>
        </Card>
        <Card>
          <CheckCircle2 size={24} />
          <h2>Failure policy placeholder</h2>
          <p>Failed ReeditPro generation should be refundable later. This UI documents the rule but does not implement billing.</p>
        </Card>
      </section>

      <section className="landing-section credit-pack-section">
        <div className="section-heading">
          <span className="section-eyebrow">Mock credit packs</span>
          <h2>Buy more credits when an approved plan needs more generation.</h2>
          <p>These are placeholders only. There is no Stripe checkout or payment integration.</p>
        </div>
        <div className="credit-pack-grid">
          {creditPacks.map(([price, credits]) => (
            <article key={price}>
              <strong>{price}</strong>
              <span>{credits}</span>
              <Button size="sm" variant="secondary">
                Mock pack
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
