import { useEffect, useState } from 'react'
import { Badge } from '../Badge'
import { Card } from '../Card'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'
import {
  applyPreferenceToProjectEditSessionViaApi,
  clearPreferenceFromProjectEditSessionViaApi,
  createProjectEditSessionPreferenceBoundarySummary,
  loadProjectEditSessionPreferencePanelForUI,
  type ProjectEditSessionPreferencePanelForUI,
} from '../../lib/project-edit-session-preference-ui-adapter'
import type { ProjectEditSessionPreferenceOption } from '../../types/project-edit-session-preference'
import { ProjectEditSessionDNAStatusCard } from './ProjectEditSessionDNAStatusCard'
import { ProjectEditSessionDoNotCopyRulesCard } from './ProjectEditSessionDoNotCopyRulesCard'
import { ProjectEditSessionPreferencePicker } from './ProjectEditSessionPreferencePicker'
import { ProjectEditSessionPreferenceStatusCard } from './ProjectEditSessionPreferenceStatusCard'

type ProjectEditSessionPreferencePanelProps = {
  client: ProjectEditSessionApiClient
  editSessionId: string
  onPreferenceChanged: (message: string) => Promise<void> | void
  projectId: string
}

export function ProjectEditSessionPreferencePanel({
  client,
  editSessionId,
  onPreferenceChanged,
  projectId,
}: ProjectEditSessionPreferencePanelProps) {
  const [model, setModel] = useState<ProjectEditSessionPreferencePanelForUI | undefined>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Loading Edit Preference state.')

  async function loadPanel() {
    const next = await loadProjectEditSessionPreferencePanelForUI({ client, editSessionId, projectId })
    setModel(next)
    setStatus(next.panelModel.selectedPreferenceHandle ? 'Selected Edit Preference loaded.' : 'No Edit Preference selected.')
  }

  useEffect(() => {
    let cancelled = false
    loadProjectEditSessionPreferencePanelForUI({ client, editSessionId, projectId }).then((next) => {
      if (cancelled) return
      setModel(next)
      setStatus(next.panelModel.selectedPreferenceHandle ? 'Selected Edit Preference loaded.' : 'No Edit Preference selected.')
    })
    return () => {
      cancelled = true
    }
  }, [client, editSessionId, projectId])

  async function handleApply(option: ProjectEditSessionPreferenceOption) {
    setBusy(true)
    setStatus(`Applying ${option.handle ?? option.name} mock-locally...`)
    const result = await applyPreferenceToProjectEditSessionViaApi({
      client,
      editSessionId,
      preferenceHandle: option.handle,
      preferenceOptionId: option.id,
      projectId,
    })
    await loadPanel()
    await onPreferenceChanged(result.ok
      ? `${option.handle ?? option.name} applied to this mock Edit Chat.`
      : 'Preference apply failed safely without production side effects.')
    setBusy(false)
  }

  async function handleClear() {
    setBusy(true)
    setStatus('Clearing selected Edit Preference mock-locally...')
    const result = await clearPreferenceFromProjectEditSessionViaApi({ client, editSessionId, projectId })
    await loadPanel()
    await onPreferenceChanged(result.ok
      ? 'Selected Edit Preference cleared from this mock Edit Chat.'
      : 'Preference clear failed safely without production side effects.')
    setBusy(false)
  }

  const panel = model?.panelModel
  const boundary = model?.boundarySummary ?? createProjectEditSessionPreferenceBoundarySummary()

  return (
    <Card className="project-edit-session-preference-panel" data-testid="edit-session-preference-panel">
      <div className="project-edit-session-preference-panel__heading">
        <div>
          <span className="section-eyebrow">Reusable style intelligence</span>
          <h3>Edit Preference for this Edit Chat</h3>
        </div>
        <Badge accent="cyan">Mock/local</Badge>
      </div>
      <p className="project-edit-session-preference-panel__status" data-testid="edit-session-preference-status">
        {status}
      </p>
      {panel ? (
        <>
          <ProjectEditSessionPreferenceStatusCard model={panel} />
          <ProjectEditSessionDNAStatusCard model={panel} />
          <ProjectEditSessionDoNotCopyRulesCard model={panel} />
          <ProjectEditSessionPreferencePicker
            busy={busy}
            canClear={panel.canClearPreference}
            onApply={handleApply}
            onClear={handleClear}
            options={model?.options ?? []}
            selectedHandle={panel.selectedPreferenceHandle}
          />
        </>
      ) : (
        <p>Preference panel is loading from the mock API client.</p>
      )}
      <p className="project-edit-session-preference-panel__boundary" data-testid="edit-session-preference-boundary">
        {boundary}
      </p>
    </Card>
  )
}
