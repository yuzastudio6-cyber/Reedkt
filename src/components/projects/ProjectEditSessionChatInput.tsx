import { SendHorizontal } from 'lucide-react'
import { Button } from '../Button'

type ProjectEditSessionChatInputProps = {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ProjectEditSessionChatInput({
  disabled = false,
  onChange,
  onSubmit,
  value,
}: ProjectEditSessionChatInputProps) {
  return (
    <form
      className="project-edit-session-chat-input"
      data-testid="edit-session-chat-input-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label htmlFor="edit-session-chat-message">Send mock Edit Chat message</label>
      <div className="project-edit-session-chat-input__row">
        <textarea
          data-testid="edit-session-chat-input"
          disabled={disabled}
          id="edit-session-chat-message"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask for a change, capture a revision, or leave a mock editing note..."
          rows={3}
          value={value}
        />
        <Button disabled={disabled || !value.trim()} icon={SendHorizontal} type="submit" variant="primary">
          Send
        </Button>
      </div>
      <p>Mock only: sending saves messages and safe session records, not edit planning, preview, render, workers, providers, or credits.</p>
    </form>
  )
}
