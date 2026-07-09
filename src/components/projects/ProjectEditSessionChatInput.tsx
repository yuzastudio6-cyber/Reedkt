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
      <label htmlFor="edit-session-chat-message">Message ReEditPro</label>
      <div className="project-edit-session-chat-input__row">
        <textarea
          data-testid="edit-session-chat-input"
          disabled={disabled}
          id="edit-session-chat-message"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Describe the edit, ask for a change, or add a note..."
          rows={3}
          value={value}
        />
        <Button disabled={disabled || !value.trim()} icon={SendHorizontal} type="submit" variant="primary">
          Send
        </Button>
      </div>
      <p>Messages can update the edit brief. Expensive work still waits for plan and credit approval.</p>
    </form>
  )
}
