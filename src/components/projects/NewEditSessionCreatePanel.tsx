import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'
import {
  createDefaultNewEditSessionFormState,
  createProjectEditSessionFromNewEditForm,
  type NewEditSessionCreateResult,
  type NewEditSessionFormState,
} from '../../lib/project-edit-session-create-flow-ui-adapter'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import { NewEditSessionAspectRatioPicker } from './NewEditSessionAspectRatioPicker'
import { NewEditSessionEditLevelPicker } from './NewEditSessionEditLevelPicker'
import { NewEditSessionPlatformTargetPicker } from './NewEditSessionPlatformTargetPicker'
import { NewEditSessionPreferencePicker } from './NewEditSessionPreferencePicker'
import { NewEditSessionSourceNotes } from './NewEditSessionSourceNotes'

type NewEditSessionCreatePanelProps = {
  client: ProjectEditSessionApiClient
  open: boolean
  projectId: string
  onCancel: () => void
  onCreated: (result: NewEditSessionCreateResult) => Promise<void> | void
}

export function NewEditSessionCreatePanel({
  client,
  onCancel,
  onCreated,
  open,
  projectId,
}: NewEditSessionCreatePanelProps) {
  const [form, setForm] = useState<NewEditSessionFormState>(() => createDefaultNewEditSessionFormState())
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<NewEditSessionCreateResult | undefined>()
  const [error, setError] = useState<string | undefined>()

  if (!open) return null

  function updateForm(patch: Partial<NewEditSessionFormState>) {
    setForm((current) => ({ ...current, ...patch }))
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(undefined)

    const result = await createProjectEditSessionFromNewEditForm({
      projectId,
      form,
      client,
    })
    setLastResult(result)
    setSubmitting(false)

    if (!result.ok || !result.session) {
      setError(result.warnings[0] ?? 'The mock Edit Chat could not be created.')
      return
    }

    await onCreated(result)
  }

  function handleResetForAnother() {
    setForm(createDefaultNewEditSessionFormState())
    setLastResult(undefined)
    setError(undefined)
  }

  return (
    <Card className="new-edit-session-create-panel" data-testid="new-edit-session-create-panel">
      <form onSubmit={handleSubmit}>
        <div className="new-edit-session-create-panel__header">
          <div>
            <span className="section-eyebrow">New Edit Chat</span>
            <h2>Create mock Edit Chat</h2>
            <p>Create a persistent mock/local editing workspace, then open the Edit Chat route explicitly.</p>
          </div>
          <div className="new-edit-session-create-panel__badges">
            <Badge accent="cyan">Mock/local only</Badge>
            <Badge>No upload</Badge>
            <Badge>No credits</Badge>
          </div>
          <Button icon={X} onClick={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
        </div>

        <div className="new-edit-session-form-grid">
          <label className="new-edit-session-field new-edit-session-field--full">
            <span>Edit Chat name</span>
            <input
              data-testid="new-edit-name-input"
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="Untitled Edit Chat"
              type="text"
              value={form.name}
            />
          </label>

          <NewEditSessionAspectRatioPicker
            onChange={(aspectRatio) => updateForm({ aspectRatio })}
            value={form.aspectRatio}
          />

          <NewEditSessionPlatformTargetPicker
            onChange={(platformTarget) => updateForm({ platformTarget })}
            value={form.platformTarget}
          />

          <NewEditSessionEditLevelPicker
            onChange={(selectedEditLevel) => updateForm({ selectedEditLevel })}
            value={form.selectedEditLevel}
          />

          <NewEditSessionPreferencePicker
            note={form.preferenceNote}
            onChange={(preferenceChoiceId) => updateForm({ preferenceChoiceId })}
            onNoteChange={(preferenceNote) => updateForm({ preferenceNote })}
            value={form.preferenceChoiceId}
          />

          <NewEditSessionSourceNotes
            onChange={(sourceNotes) => updateForm({ sourceNotes })}
            value={form.sourceNotes}
          />
        </div>

        {error ? <p className="new-edit-session-error" data-testid="new-edit-error">{error}</p> : null}

        {lastResult?.ok && lastResult.session ? (
          <div className="new-edit-session-success" data-testid="new-edit-success-message">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{lastResult.session.name} was created. Open the mock Edit Chat workspace when ready.</span>
            <Button to={`/projects/${projectId}/edits/${lastResult.session.id}`} variant="secondary">
              Open Edit Chat
            </Button>
          </div>
        ) : null}

        <div className="new-edit-session-create-panel__footer">
          <p>Creation uses the browser-safe mock API client. Progress, preview, rendering, workers, uploads, and credits stay off.</p>
          <div className="new-edit-session-create-panel__actions">
            {lastResult?.ok ? (
              <Button onClick={handleResetForAnother} type="button" variant="secondary">
                Create another
              </Button>
            ) : null}
            <Button disabled={submitting} type="submit" variant="primary">
              {submitting ? (
                <>
                  <Loader2 aria-hidden="true" size={18} />
                  <span>Creating...</span>
                </>
              ) : (
                'Create mock Edit Chat'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
