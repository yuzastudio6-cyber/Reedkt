import { Send } from 'lucide-react'
import { Button } from '../Button'
import { ChatAttachmentTray } from './ChatAttachmentTray'

type ChatComposerProps = {
  clipsAttached: boolean
  disabled?: boolean
  inputValue: string
  onAttachClips: () => void
  onInputChange: (value: string) => void
  onReference: () => void
  onSend: () => void
}

export function ChatComposer({
  clipsAttached,
  disabled = false,
  inputValue,
  onAttachClips,
  onInputChange,
  onReference,
  onSend,
}: ChatComposerProps) {
  return (
    <section className="chat-composer-shell">
      <ChatAttachmentTray clipsAttached={clipsAttached} onAttachClips={onAttachClips} onReference={onReference} />
      <label className="chat-native-input">
        <span>Message ReeditPro</span>
        <textarea
          disabled={disabled}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Tell ReeditPro what to edit, ask for revisions, or paste a reference link."
          value={inputValue}
        />
      </label>
      <div className="chat-composer-actions">
        <p>Plan first. Approve credits. Then the AI edits in the background.</p>
        <Button disabled={disabled || inputValue.trim().length === 0} icon={Send} onClick={onSend} variant="primary">
          Send
        </Button>
      </div>
    </section>
  )
}
