import { useState } from 'react'
import { Badge } from '../Badge'
import {
  approveMockVersionViaApi,
  createMockPreviewPlaceholderViaApi,
  rejectMockVersionViaApi,
  saveManualCheckpointViaApi,
  saveMockVersionViaApi,
  type ProjectEditSessionHistoryPanelModel,
} from '../../lib/project-edit-session-history-ui-adapter'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'
import { ProjectEditSessionApprovalStateCard } from './ProjectEditSessionApprovalStateCard'
import { ProjectEditSessionHistoryActions } from './ProjectEditSessionHistoryActions'
import { ProjectEditSessionPreviewHistoryCard } from './ProjectEditSessionPreviewHistoryCard'
import { ProjectEditSessionRevisionHistoryList } from './ProjectEditSessionRevisionHistoryList'
import { ProjectEditSessionSnapshotTimeline } from './ProjectEditSessionSnapshotTimeline'
import { ProjectEditSessionVersionHistoryList } from './ProjectEditSessionVersionHistoryList'

type ProjectEditSessionHistoryPanelProps = {
  client: ProjectEditSessionApiClient
  editSessionId: string
  model: ProjectEditSessionHistoryPanelModel
  onChanged: (message: string) => Promise<void> | void
  projectId: string
}

export function ProjectEditSessionHistoryPanel({
  client,
  editSessionId,
  model,
  onChanged,
  projectId,
}: ProjectEditSessionHistoryPanelProps) {
  const [busy, setBusy] = useState(false)
  const [actionMessage, setActionMessage] = useState('History is mock/local only.')

  async function runAction(label: string, action: () => Promise<{ ok: boolean; warnings: string[] }>) {
    if (busy) return
    setBusy(true)
    setActionMessage(`${label}...`)
    try {
      const result = await action()
      const message = result.ok
        ? `${label} completed. No render, progress, worker, provider, Supabase, or credit effect started.`
        : `${label} failed safely: ${result.warnings[0] ?? 'mock action returned a safe warning.'}`
      setActionMessage(message)
      await onChanged(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="project-edit-session-history-panel" data-testid="edit-session-history-panel">
      <div className="project-edit-session-history-panel__heading">
        <div>
          <h3>History</h3>
          <p>{model.summary}</p>
        </div>
        <Badge accent="cyan">Mock-only history</Badge>
      </div>

      <div className="project-edit-session-history-grid">
        <ProjectEditSessionPreviewHistoryCard model={model.latestPreview} />
        <ProjectEditSessionApprovalStateCard model={model.approval} />
      </div>

      <ProjectEditSessionHistoryActions
        busy={busy}
        onApproveVersion={() => runAction('Approve mock version', () => approveMockVersionViaApi({ projectId, editSessionId, client }))}
        onCreatePreview={() => runAction('Create preview placeholder', () => createMockPreviewPlaceholderViaApi({ projectId, editSessionId, client }))}
        onRejectVersion={() => runAction('Reject mock version', () => rejectMockVersionViaApi({ projectId, editSessionId, client }))}
        onSaveCheckpoint={() => runAction('Add checkpoint', () => saveManualCheckpointViaApi({ projectId, editSessionId, client }))}
        onSaveVersion={() => runAction('Save mock version', () => saveMockVersionViaApi({ projectId, editSessionId, client }))}
      />

      <p className="project-edit-session-history-status" data-testid="edit-session-history-action-status" role="status">
        {actionMessage}
      </p>

      <ProjectEditSessionSnapshotTimeline items={model.snapshotItems} />
      <ProjectEditSessionVersionHistoryList items={model.versionItems} />
      <ProjectEditSessionRevisionHistoryList items={model.revisionItems} />

      <section className="project-edit-session-history-section" data-testid="edit-session-history-event-log">
        <h4>History event log</h4>
        {model.eventItems.length ? (
          <ul className="project-edit-session-history-list">
            {model.eventItems.slice(-6).map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <small>{item.summary}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No history events yet.</p>
        )}
      </section>

      <p className="project-edit-session-history-boundary">{model.boundarySummary}</p>
    </section>
  )
}
