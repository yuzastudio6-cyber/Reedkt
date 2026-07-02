import { Mic, Send } from 'lucide-react'
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
  const textareaRows = inputValue.includes('\n') ? 2 : 1

  return (
    <section className="chat-composer-shell">
      <ChatAttachmentTray clipsAttached={clipsAttached} onAttachClips={onAttachClips} onReference={onReference} />
      <div className="chat-composer-input-row">
        <label className="chat-native-input">
          <textarea
            disabled={disabled}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Tell ReeditPro what to edit, ask for revisions, or paste a reference link."
            rows={textareaRows}
            value={inputValue}
          />
        </label>
        <div className="chat-composer-side-actions">
          <button
            aria-label="Record voice note"
            className="chat-composer-icon-button chat-composer-mic"
            disabled={disabled}
            type="button"
          >
            <Mic aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Send message"
            className="chat-composer-icon-button chat-composer-send"
            disabled={disabled || inputValue.trim().length === 0}
            onClick={onSend}
            type="button"
          >
            <Send aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <p className="chat-composer-helper">Plan first. Approve credits. Then generate.</p>
    </section>
  )
}
