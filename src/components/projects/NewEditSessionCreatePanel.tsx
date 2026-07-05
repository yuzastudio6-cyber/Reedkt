import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'
import {
  createProjectEditSessionBackendLocalFromNewEditForm,
  type ProjectEditSessionBackendLocalConfig,
} from '../../lib/project-edit-session-backend-local'
import {
  createDefaultNewEditSessionFormState,
  createProjectEditSessionFromNewEditForm,
  getConfirmedNewEditFrame,
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
  backendLocalConfig?: ProjectEditSessionBackendLocalConfig
  client: ProjectEditSessionApiClient
  open: boolean
  projectId: string
  onCancel: () => void
  onCreated: (result: NewEditSessionCreateResult) => Promise<void> | void
}

export function NewEditSessionCreatePanel({
  backendLocalConfig,
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
  const confirmedFrame = getConfirmedNewEditFrame(form)
  const createDisabled = submitting || !confirmedFrame

  if (!open) return null

  function updateForm(patch: Partial<NewEditSessionFormState>) {
    setForm((current) => ({ ...current, ...patch }))
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(undefined)

    let result: NewEditSessionCreateResult
    try {
      result = backendLocalConfig?.available && backendLocalConfig.apiBaseUrl
        ? await createProjectEditSessionBackendLocalFromNewEditForm({
          apiBaseUrl: backendLocalConfig.apiBaseUrl,
          form,
          projectId,
          workspaceId: backendLocalConfig.workspaceId,
        })
        : await createProjectEditSessionFromNewEditForm({
          projectId,
          form,
          client,
        })
    } catch (createError) {
      setSubmitting(false)
      setError(createError instanceof Error ? createError.message : 'The edit could not be created.')
      return
    }
    setLastResult(result)
    setSubmitting(false)

    if (!result.ok || !result.session) {
      setError(result.warnings[0] ?? 'The edit could not be created.')
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
            <span className="section-eyebrow">New edit</span>
            <h2>Create edit</h2>
            <p>Create an edit workspace for this video. Upload and brief work happen after the edit is created.</p>
          </div>
          <div className="new-edit-session-create-panel__badges">
            <Badge accent="cyan">Inside project</Badge>
          </div>
          <Button icon={X} onClick={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
        </div>

        <div className="new-edit-session-form-grid">
          <label className="new-edit-session-field new-edit-session-field--full">
            <span>Edit name</span>
            <input
              data-testid="new-edit-name-input"
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="Untitled edit"
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
            <span>{lastResult.session.name} was created. Open the edit workspace when ready.</span>
            <Button to={lastResult.openRoute ?? `/projects/${projectId}/edits/${lastResult.session.id}`} variant="secondary">
              Open edit
            </Button>
          </div>
        ) : null}

        <div className="new-edit-session-create-panel__footer">
          <p>
            {confirmedFrame
              ? 'Creating an edit does not start planning, tool execution, rendering, or credits. Those happen later after the edit is ready and approved.'
              : 'Choose the output frame and platform before creating this edit. ReEditPro does not silently pick a final canvas.'}
          </p>
          <div className="new-edit-session-create-panel__actions">
            {lastResult?.ok ? (
              <Button onClick={handleResetForAnother} type="button" variant="secondary">
                Create another
              </Button>
            ) : null}
            <Button disabled={createDisabled} type="submit" variant="primary">
              {submitting ? (
                <>
                  <Loader2 aria-hidden="true" size={18} />
                  <span>Creating...</span>
                </>
              ) : (
                'Create edit'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
