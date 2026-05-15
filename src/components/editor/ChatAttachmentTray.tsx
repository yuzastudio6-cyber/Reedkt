import { FileVideo, Link2, Plus } from 'lucide-react'
import { Button } from '../Button'

type ChatAttachmentTrayProps = {
  clipsAttached: boolean
  onAttachClips: () => void
  onReference: () => void
}

export function ChatAttachmentTray({ clipsAttached, onAttachClips, onReference }: ChatAttachmentTrayProps) {
  return (
    <div className="chat-attachment-tray" aria-label="Chat attachments">
      <Button icon={clipsAttached ? Plus : FileVideo} onClick={onAttachClips} size="sm" variant="secondary">
        {clipsAttached ? 'Add mock clip' : 'Attach 4 mock clips'}
      </Button>
      <Button icon={Link2} onClick={onReference} size="sm" variant="ghost">
        Attach reference
      </Button>
    </div>
  )
}
