import type { Accent } from '../data/mockData'
import { Badge } from './Badge'
import { Card } from './Card'

type MetricCardProps = {
  accent: Accent
  detail: string
  label: string
  value: string
}

export function MetricCard({ accent, detail, label, value }: MetricCardProps) {
  return (
    <Card className={`metric-card metric-${accent}`}>
      <div className="metric-topline">
        <span>{label}</span>
        <Badge accent={accent}>{detail}</Badge>
      </div>
      <strong>{value}</strong>
      <span className="metric-line" aria-hidden="true" />
    </Card>
  )
}
