import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type {
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentPanelModel,
} from '../../../types/project-edit-brief-attachments'
import {
  addProjectEditBriefMetadataAttachmentViaApi,
  createProjectEditBriefAttachmentDraftFromPanelForUI,
  loadProjectEditBriefAttachmentPanelForUI,
  removeProjectEditBriefAttachmentViaApi,
} from '../../../lib/project-edit-brief-attachment-ui-adapter'
import { ProjectEditBriefAttachmentBoundaryNotice } from './ProjectEditBriefAttachmentBoundaryNotice'
import { ProjectEditBriefAttachmentChip } from './ProjectEditBriefAttachmentChip'
import { ProjectEditBriefAttachmentDetailCard } from './ProjectEditBriefAttachmentDetailCard'
import { ProjectEditBriefAttachmentForm } from './ProjectEditBriefAttachmentForm'

type ProjectEditBriefAttachmentPanelProps = {
  client?: ProjectEditBriefApiClient
  markerId: string
  onChanged?: (message: string) => void | Promise<void>
}

export function ProjectEditBriefAttachmentPanel({
  client,
  markerId,
  onChanged,
}: ProjectEditBriefAttachmentPanelProps) {
  const [model, setModel] = useState<ProjectEditBriefAttachmentPanelModel | undefined>()
  const [draft, setDraft] = useState<ProjectEditBriefAttachmentDraft | undefined>()
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Loading metadata-only attachments.')

  async function reload(nextStatus?: string, nextSelectedAttachmentId = selectedAttachmentId) {
    const nextModel = await loadProjectEditBriefAttachmentPanelForUI(markerId, client, nextSelectedAttachmentId)
    setModel(nextModel)
    if (nextModel?.selectedAttachment) setSelectedAttachmentId(nextModel.selectedAttachment.id)
    setStatus(nextStatus ?? (nextModel ? `${nextModel.attachments.length} metadata attachment(s) loaded.` : 'Attachment panel failed safely.'))
  }

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefAttachmentPanelForUI(markerId, client).then((nextModel) => {
      if (cancelled) return
      setModel(nextModel)
      if (nextModel?.selectedAttachment) setSelectedAttachmentId(nextModel.selectedAttachment.id)
      setStatus(nextModel ? `${nextModel.attachments.length} metadata attachment(s) loaded.` : 'Attachment panel failed safely.')
    })
    return () => {
      cancelled = true
    }
  }, [client, markerId])

  function openDraft() {
    if (!model) return
    setDraft(createProjectEditBriefAttachmentDraftFromPanelForUI({ panel: model }))
  }

  async function saveDraft() {
    if (!draft || busy) return
    setBusy(true)
    try {
      const result = await addProjectEditBriefMetadataAttachmentViaApi(draft, client)
      if (result.attachment) {
        setDraft(undefined)
        setSelectedAttachmentId(result.attachment.id)
        const nextStatus = result.intentBridge?.statusSuggestion === 'draft_intent'
          ? 'Attachment saved as marker-scoped metadata only. Missing asset is resolved to draft; confirm this marker before preparing plan hints.'
          : 'Attachment saved as marker-scoped metadata only.'
        await reload(nextStatus, result.attachment.id)
        await onChanged?.(nextStatus)
      } else {
        setStatus(result.warnings?.[0] ?? 'Attachment save blocked safely.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function removeAttachment(attachmentId: string) {
    if (busy) return
    setBusy(true)
    try {
      await removeProjectEditBriefAttachmentViaApi(attachmentId, client)
      setSelectedAttachmentId(undefined)
      const nextStatus = 'Attachment metadata removed. No files or media artifacts were touched.'
      await reload(nextStatus, undefined)
      await onChanged?.(nextStatus)
    } finally {
      setBusy(false)
    }
  }

  if (!model) {
    return (
      <section className="project-edit-brief-attachment-panel" data-testid="project-edit-brief-attachment-panel">
        <div className="project-edit-brief-attachment-panel__header">
          <h4>Marker attachments</h4>
          <Badge>Loading</Badge>
        </div>
        <p data-testid="project-edit-brief-attachment-status">{status}</p>
      </section>
    )
  }

  return (
    <section className="project-edit-brief-attachment-panel" data-testid="project-edit-brief-attachment-panel">
      <div className="project-edit-brief-attachment-panel__header">
        <div>
          <h4>Marker attachments</h4>
          <p data-testid="project-edit-brief-attachment-status">{status}</p>
        </div>
        <Badge accent="cyan">Metadata only</Badge>
      </div>
      <ProjectEditBriefAttachmentBoundaryNotice summary={model.boundarySummary} />
      <div className="project-edit-brief-attachment-chips" data-testid="project-edit-brief-attachment-chips">
        {model.attachments.length ? model.attachments.map((attachment) => (
          <ProjectEditBriefAttachmentChip
            attachment={attachment}
            isSelected={attachment.id === selectedAttachmentId}
            key={attachment.id}
            onSelect={setSelectedAttachmentId}
          />
        )) : (
          <p className="project-edit-brief-muted">No marker attachments yet. Add metadata labels or URL metadata without uploading files.</p>
        )}
      </div>
      {draft ? (
        <ProjectEditBriefAttachmentForm
          busy={busy}
          draft={draft}
          onCancel={() => setDraft(undefined)}
          onChange={setDraft}
          onSave={saveDraft}
        />
      ) : (
        <Button
          data-testid="project-edit-brief-attachment-add-button"
          disabled={!model.canAddMetadataAttachment || busy}
          icon={Plus}
          onClick={openDraft}
          size="sm"
          variant="secondary"
        >
          Add attachment
        </Button>
      )}
      <ProjectEditBriefAttachmentDetailCard
        attachment={model.attachments.find((attachment) => attachment.id === selectedAttachmentId) ?? model.selectedAttachment}
        busy={busy}
        onRemove={removeAttachment}
      />
      <ul className="project-edit-brief-note-list project-edit-brief-note-list--safety">
        {model.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </section>
  )
}
