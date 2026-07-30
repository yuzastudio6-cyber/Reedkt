import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { IconButton } from '../Button'
import { ChatAttachmentTray } from './ChatAttachmentTray'

type ChatComposerProps = {
  attachmentsDisabled?: boolean
  clipsAttached: boolean
  disabled?: boolean
  inputValue: string
  onAttachClips: () => void
  onAttachFiles?: (files: File[]) => void
  onInputChange: (value: string) => void
  onReference: () => void
  onSend: () => void
  placeholder?: string
  sendLabel?: string
  showReference?: boolean
}

export function ChatComposer({
  attachmentsDisabled = false,
  clipsAttached,
  disabled = false,
  inputValue,
  onAttachClips,
  onAttachFiles,
  onInputChange,
  onReference,
  onSend,
  placeholder = 'Message ReeditPro...',
  sendLabel = 'Send',
  showReference = true,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    if (!inputValue.includes('\n')) {
      textarea.style.height = '40px'
      return
    }
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 104)}px`
  }, [inputValue])

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSend()
    }
  }

  return (
    <section className="chat-composer-shell" data-testid="chat-composer">
      <div className="chat-composer-surface chat-composer-bar" data-testid="chat-composer-surface">
        <ChatAttachmentTray
          disabled={attachmentsDisabled}
          clipsAttached={clipsAttached}
          onAttachClips={onAttachClips}
          onAttachFiles={onAttachFiles}
          onReference={onReference}
          showReference={showReference}
        />
        <label className="chat-native-input chat-composer-field">
          <span className="sr-only">Message ReeditPro</span>
          <textarea
            aria-describedby="chat-composer-helper"
            data-testid="chat-composer-textarea"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={placeholder}
            ref={textareaRef}
            rows={1}
            value={inputValue}
          />
        </label>
        <p className="sr-only" id="chat-composer-helper">Plan first. Approve credits. Then editing can begin.</p>
        <div className="chat-composer-control-row" aria-label="Composer controls">
          <IconButton
            className="chat-composer-send"
            data-testid="chat-composer-send"
            disabled={disabled || inputValue.trim().length === 0}
            icon={Send}
            label={sendLabel}
            onClick={onSend}
            title={sendLabel}
          />
        </div>
      </div>
    </section>
  )
}
