import { CheckCircle2 } from 'lucide-react'
import type { PricingPlan } from '../data/mockData'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'

type PricingCardProps = {
  plan: PricingPlan
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <Card className={`pricing-card ${plan.featured ? 'pricing-featured' : ''}`}>
      {plan.featured && <Badge accent="cyan">Recommended</Badge>}
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
      <div className="price-row">
        <strong>{plan.price}</strong>
        <span>software access</span>
      </div>
      <Badge accent={plan.featured ? 'violet' : 'blue'}>{plan.credits}</Badge>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>
            <CheckCircle2 size={16} /> {feature}
          </li>
        ))}
      </ul>
      <Button to="/projects/new" variant={plan.featured ? 'primary' : 'secondary'}>
        {plan.featured ? 'Start Business placeholder' : 'Start Personal placeholder'}
      </Button>
    </Card>
  )
}
