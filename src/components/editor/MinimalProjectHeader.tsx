import { MoreHorizontal, WalletCards } from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'

type MinimalProjectHeaderProps = {
  approved: boolean
  credits: number
  previewReady: boolean
  projectName?: string
  runtimeStatus?: string
}

export function MinimalProjectHeader({ approved, credits, previewReady, projectName = 'Premium real estate short', runtimeStatus }: MinimalProjectHeaderProps) {
  return (
    <header className="chat-native-header">
      <div>
        <span className="section-eyebrow">AI chat editor</span>
        <h1>{projectName}</h1>
        <p>The chat is the editor. Send clips, approve the plan and credit estimate, then mock progress can begin.</p>
      </div>
      <div className="chat-native-header-actions">
        <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Plan + credits approved' : 'Waiting for approval'}</Badge>
        <span className="wallet-chip">
          <WalletCards size={16} />
          100 credits
        </span>
        {runtimeStatus && <Badge accent="cyan">{runtimeStatus}</Badge>}
        <Badge accent={previewReady ? 'cyan' : 'muted'}>{previewReady ? 'Preview ready' : `${credits} estimated`}</Badge>
        <IconButton icon={MoreHorizontal} label="Project menu" />
      </div>
    </header>
  )
}
