import { X } from 'lucide-react'
import { Button, IconButton } from '../Button'
import { Card } from '../Card'
import { Timeline } from '../Timeline'

type DetailedTimelineDrawerProps = {
  open: boolean
  onClose: () => void
}

export function DetailedTimelineDrawer({ onClose, open }: DetailedTimelineDrawerProps) {
  if (!open) {
    return null
  }

  return (
    <Card className="detailed-timeline-drawer">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">Detailed timeline - advanced view</span>
          <h2>Advanced timing layers</h2>
          <p>The timeline is secondary. Use it when you need precise layer timing after the AI chat plan is clear.</p>
        </div>
        <IconButton icon={X} label="Close detailed timeline" onClick={onClose} />
      </div>
      <Timeline compact />
      <div className="drawer-actions">
        <Button onClick={onClose} variant="secondary">
          Close timeline
        </Button>
      </div>
    </Card>
  )
}
