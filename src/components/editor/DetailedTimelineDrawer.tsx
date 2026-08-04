import { useId } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from '../Button'
import { Card } from '../Card'
import { Timeline } from '../Timeline'

type DetailedTimelineDrawerProps = {
  open: boolean
  onClose: () => void
}

export function DetailedTimelineDrawer({ onClose, open }: DetailedTimelineDrawerProps) {
  const headingId = useId()

  if (!open) {
    return null
  }

  return (
    <Card className="detailed-timeline-drawer" data-testid="timeline-drawer">
      <div aria-labelledby={headingId} className="timeline-drawer-shell" role="region">
        <div className="panel-heading timeline-drawer-heading">
          <div>
            <span className="section-eyebrow">Advanced timeline</span>
            <h2 id={headingId}>Layer timing</h2>
            <p>Secondary timing view for checking captions, visuals, SFX, music, AI clips, and composition layers after the chat plan is clear.</p>
          </div>
          <IconButton data-testid="timeline-close" icon={X} label="Close advanced timeline" onClick={onClose} />
        </div>

        <div className="timeline-drawer-body">
          <div className="timeline-scroll-wrap">
            <Timeline compact />
          </div>
        </div>

        <div className="drawer-actions timeline-drawer-actions">
          <Button data-testid="timeline-close-secondary" onClick={onClose} variant="secondary">
            Close timeline
          </Button>
        </div>
      </div>
    </Card>
  )
}
