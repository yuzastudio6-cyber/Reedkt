import { Bell, MoreHorizontal } from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'

type MinimalProjectHeaderProps = {
  approved: boolean
  credits: number
  previewReady: boolean
}

export function MinimalProjectHeader({ approved, credits, previewReady }: MinimalProjectHeaderProps) {
  return (
    <header className="chat-project-strip" aria-label="Editor project status">
      <div className="chat-project-strip-main">
        <h1>Premium real estate short</h1>
        <div className="chat-project-status">
          <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Plan approved' : 'Waiting for approval'}</Badge>
          <Badge accent={previewReady ? 'cyan' : 'muted'}>{previewReady ? 'Preview ready' : `${credits} estimated`}</Badge>
        </div>
      </div>
      <div className="chat-project-utility">
        <Badge accent="cyan">100 credits</Badge>
        <Badge accent="violet">Personal</Badge>
        <IconButton icon={Bell} label="Notifications" />
        <IconButton icon={MoreHorizontal} label="Project menu" />
      </div>
    </header>
  )
}
