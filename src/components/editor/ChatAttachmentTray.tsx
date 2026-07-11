import { useRef, type ChangeEvent } from 'react'
import { FileVideo, Link2, Plus } from 'lucide-react'
import { IconButton } from '../Button'

type ChatAttachmentTrayProps = {
  disabled?: boolean
  clipsAttached: boolean
  onAttachClips: () => void
  onAttachFiles?: (files: File[]) => void
  onReference: () => void
}

export function ChatAttachmentTray({ clipsAttached, disabled = false, onAttachClips, onAttachFiles, onReference }: ChatAttachmentTrayProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const clipLabel = clipsAttached ? 'Add source files' : 'Attach source files'

  function handleAttachClick() {
    if (disabled) return
    if (onAttachFiles) {
      fileInputRef.current?.click()
      return
    }

    onAttachClips()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length > 0 && onAttachFiles) {
      onAttachFiles(files)
    }
  }

  return (
    <div className="chat-attachment-tray" aria-label="Chat attachments" data-testid="chat-composer-attachment-actions">
      {onAttachFiles && (
        <input
          accept="video/mp4,video/quicktime,video/webm,audio/wav,audio/mpeg,audio/mp3,image/png,image/jpeg,image/webp"
          hidden
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
      )}
      <IconButton
        className="chat-composer-icon-button"
        data-testid="chat-composer-attach"
        disabled={disabled}
        icon={clipsAttached ? Plus : FileVideo}
        label={clipLabel}
        onClick={handleAttachClick}
        title={clipLabel}
      />
      <IconButton
        className="chat-composer-icon-button"
        data-testid="chat-composer-reference"
        disabled={disabled}
        icon={Link2}
        label="Attach reference"
        onClick={onReference}
        title="Attach reference"
      />
    </div>
  )
}
