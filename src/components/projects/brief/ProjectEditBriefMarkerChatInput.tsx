import { Send } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefMarkerChatInputProps = {
  busy?: boolean
  canSend: boolean
  message: string
  onChange: (message: string) => void
  onSend: () => void
}

export function ProjectEditBriefMarkerChatInput({
  busy = false,
  canSend,
  message,
  onChange,
  onSend,
}: ProjectEditBriefMarkerChatInputProps) {
  return (
    <div className="project-edit-brief-marker-chat-input" data-testid="project-edit-brief-marker-chat-input">
      <textarea
        aria-label="Marker Chat message"
        data-testid="project-edit-brief-marker-chat-textarea"
        disabled={!canSend || busy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            onSend()
          }
        }}
        placeholder="Add marker-specific guidance..."
        rows={3}
        value={message}
      />
      <Button
        data-testid="project-edit-brief-marker-chat-send"
        disabled={!canSend || busy || !message.trim()}
        icon={Send}
        onClick={onSend}
        size="sm"
        variant="primary"
      >
        Send
      </Button>
    </div>
  )
}
