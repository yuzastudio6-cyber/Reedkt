import { AlertCircle, CheckCircle2, CloudUpload } from 'lucide-react'
import type { ExportItem } from '../data/mockData'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'

type ExportQueueCardProps = {
  item: ExportItem
}

export function ExportQueueCard({ item }: ExportQueueCardProps) {
  const Icon = item.accent === 'danger' ? AlertCircle : item.progress === 100 ? CheckCircle2 : CloudUpload

  return (
    <Card className={`export-card export-${item.accent}`}>
      <div className="export-icon">
        <Icon aria-hidden="true" size={22} />
      </div>
      <div>
        <h3>{item.title}</h3>
        <p>{item.destination}</p>
        <span>{item.detail}</span>
      </div>
      <Badge accent={item.accent}>{item.status}</Badge>
      <div className="progress-wrap" aria-label={`${item.progress}% complete`}>
        <span style={{ width: `${item.progress}%` }} />
      </div>
      <div className="export-actions">
        <Button size="sm" variant={item.accent === 'danger' ? 'danger' : 'secondary'}>
          {item.accent === 'danger' ? 'Mock retry' : 'View details'}
        </Button>
      </div>
    </Card>
  )
}
