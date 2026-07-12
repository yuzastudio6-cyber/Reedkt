import { SendHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { loadApprovedEditReferenceOptions, type ApprovedEditReferenceOption } from '../../lib/edit-reference-approved-options'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import { EDIT_REFERENCE_WORKSPACE_ID } from '../../lib/project-edit-session-edit-reference-integration'
import { Button } from '../Button'

const editReferenceApi = createEditReferenceApiClient()

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
  const [referenceOptions, setReferenceOptions] = useState<ApprovedEditReferenceOption[]>([])

  useEffect(() => {
    let cancelled = false
    void loadApprovedEditReferenceOptions({ api: editReferenceApi, workspaceId: EDIT_REFERENCE_WORKSPACE_ID }).then((result) => {
      if (!cancelled && result.ok) setReferenceOptions(result.options)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function insertReferenceHandle(handle: string) {
    const next = /@[\p{L}\p{N}_-]*$/u.test(value)
      ? value.replace(/@[\p{L}\p{N}_-]*$/u, handle)
      : `${value}${value.trim() ? ' ' : ''}${handle}`
    onChange(next)
  }

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
      <div className="project-edit-session-reference-command-help" data-testid="edit-session-reference-command-help">
        <span>Edit Reference commands</span>
        <p>Use an approved handle to apply, compare, replace, or remove reusable guidance. Replacement and removal always require confirmation.</p>
        {referenceOptions.length > 0 ? (
          <div aria-label="Approved Edit Reference handles">
            {referenceOptions.slice(0, 5).map((option) => (
              <button
                data-testid={`edit-session-reference-handle-${option.id}`}
                key={option.id}
                onClick={() => insertReferenceHandle(option.handle)}
                type="button"
              >
                {option.handle}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p>Messages can update the edit brief. Expensive work still waits for plan and credit approval.</p>
    </form>
  )
}
