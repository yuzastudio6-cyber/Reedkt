import { MoreHorizontal, WalletCards } from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'

type MinimalProjectHeaderProps = {
  approved: boolean
  credits: number
  previewReady: boolean
}

export function MinimalProjectHeader({ approved, credits, previewReady }: MinimalProjectHeaderProps) {
  return (
    <header className="chat-native-header">
      <div>
        <span className="section-eyebrow">AI chat editor</span>
        <h1>Premium real estate short</h1>
        <p>The chat is the editor. Send clips, approve the plan and credit estimate, then mock progress can begin.</p>
      </div>
      <div className="chat-native-header-actions">
        <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Plan + credits approved' : 'Waiting for approval'}</Badge>
        <span className="wallet-chip">
          <WalletCards size={16} />
          100 credits
        </span>
        <Badge accent={previewReady ? 'cyan' : 'muted'}>{previewReady ? 'Preview ready' : `${credits} estimated`}</Badge>
        <IconButton icon={MoreHorizontal} label="Project menu" />
      </div>
    </header>
  )
}
