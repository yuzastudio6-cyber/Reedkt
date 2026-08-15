import { X } from 'lucide-react'
import { Badge } from '../../Badge'
import { IconButton } from '../../Button'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type { ProjectEditBriefMarkerDetailModel } from '../../../lib/project-edit-brief-ui-adapter'
import type {
  ProjectEditBriefMarkerDraftForUI,
  ProjectEditBriefMarkerFormModel,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'
import {
  readProjectEditBriefVisualContextFromMarker,
} from '../../../lib/project-edit-brief-visual-context-ui-adapter'
import type { ProjectEditBriefMarkerRecord } from '../../../types/project-edit-brief'
import { ProjectEditBriefAttachmentPanel } from './ProjectEditBriefAttachmentPanel'
import { ProjectEditBriefMarkerAIModePicker } from './ProjectEditBriefMarkerAIModePicker'
import { ProjectEditBriefMarkerActionBar } from './ProjectEditBriefMarkerActionBar'
import { ProjectEditBriefMarkerPriorityPicker } from './ProjectEditBriefMarkerPriorityPicker'
import { ProjectEditBriefMarkerStatusControls } from './ProjectEditBriefMarkerStatusControls'
import { ProjectEditBriefMarkerTimeEditor } from './ProjectEditBriefMarkerTimeEditor'
import { ProjectEditBriefMarkerTypePicker } from './ProjectEditBriefMarkerTypePicker'
import { ProjectEditBriefMarkerChatPanel } from './ProjectEditBriefMarkerChatPanel'
import { ProjectEditBriefMarkerQAPanel } from './ProjectEditBriefMarkerQAPanel'
import { ProjectEditBriefVisualContextPanel } from './ProjectEditBriefVisualContextPanel'

type ProjectEditBriefMarkerDrawerProps = {
  busy?: boolean
  client?: ProjectEditBriefApiClient
  form: ProjectEditBriefMarkerFormModel
  marker?: ProjectEditBriefMarkerDetailModel
  markerRecord?: ProjectEditBriefMarkerRecord
  onArchive: () => void
  onAttachmentsChanged?: (message: string) => void
  onMarkerChatApplied?: (message: string) => void
  onMarkerQARan?: (message: string) => void
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
  onClose: () => void
  onConfirm: () => void
  onSave: () => void
}

export function ProjectEditBriefMarkerDrawer({
  busy = false,
  client,
  form,
  marker,
  markerRecord,
  onArchive,
  onAttachmentsChanged,
  onMarkerChatApplied,
  onMarkerQARan,
  onChange,
  onClose,
  onConfirm,
  onSave,
}: ProjectEditBriefMarkerDrawerProps) {
  const draft = form.draft
  const isEditMode = form.mode === 'edit'
  const canConfirm = isEditMode && draft.status !== 'confirmed' && draft.status !== 'archived'
  const canArchive = isEditMode && draft.status !== 'archived'
  const visualContext = readProjectEditBriefVisualContextFromMarker(markerRecord)

  return (
    <section className="project-edit-brief-marker-drawer" data-testid="project-edit-brief-marker-drawer">
      <div className="project-edit-brief-marker-drawer__header">
        <div>
          <span className="section-eyebrow">{isEditMode ? 'Edit Marker' : 'Add Marker'}</span>
          <h3>{isEditMode ? draft.title || 'Edit marker' : 'Add marker'}</h3>
        </div>
        <IconButton icon={X} label="Close marker drawer" onClick={onClose} />
      </div>

      <div className="project-edit-brief-marker-drawer__badges">
        <Badge accent="cyan">Mock/local</Badge>
        <Badge>{form.statusLabel}</Badge>
        <Badge>{form.timeLabel}</Badge>
      </div>

      <ProjectEditBriefMarkerTimeEditor draft={draft} form={form} onChange={onChange} />
      <div className="project-edit-brief-marker-form-grid">
        <ProjectEditBriefMarkerTypePicker draft={draft} form={form} onChange={onChange} />
        <ProjectEditBriefMarkerPriorityPicker draft={draft} form={form} onChange={onChange} />
        <ProjectEditBriefMarkerAIModePicker draft={draft} form={form} onChange={onChange} />
        <ProjectEditBriefMarkerStatusControls draft={draft} onChange={onChange} />
      </div>

      <label className="project-edit-brief-marker-field">
        <span>Title</span>
        <input
          data-testid="project-edit-brief-marker-title-input"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="What should happen here?"
          value={draft.title}
        />
      </label>

      <label className="project-edit-brief-marker-field">
        <span>Note</span>
        <textarea
          data-testid="project-edit-brief-marker-note-input"
          onChange={(event) => onChange({ ...draft, userNote: event.target.value })}
          placeholder="Describe the marker instruction."
          rows={5}
          value={draft.userNote}
        />
      </label>

      {form.validationErrors.length ? (
        <ul className="project-edit-brief-marker-errors" data-testid="project-edit-brief-marker-validation-errors">
          {form.validationErrors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      ) : null}

      {isEditMode && draft.markerId ? (
        markerRecord ? (
          <ProjectEditBriefVisualContextPanel
            marker={markerRecord}
          />
        ) : null
      ) : null}

      {isEditMode && draft.markerId ? (
        <ProjectEditBriefMarkerChatPanel
          client={client}
          key={`${draft.markerId}-${marker?.attachmentChips.length ?? 0}`}
          markerId={draft.markerId}
          onApplied={onMarkerChatApplied}
          visualContext={visualContext}
        />
      ) : null}

      {isEditMode && draft.markerId ? (
        <ProjectEditBriefAttachmentPanel
          client={client}
          markerId={draft.markerId}
          onChanged={onAttachmentsChanged}
        />
      ) : (
        <div className="project-edit-brief-attachment-panel" data-testid="project-edit-brief-attachment-panel">
          <h4>Marker attachments</h4>
          <p className="project-edit-brief-muted">Save this marker before adding metadata-only B-roll, image, music, SFX, or reference URL attachments.</p>
        </div>
      )}

      <ProjectEditBriefMarkerQAPanel
        client={client}
        marker={marker}
        onRan={onMarkerQARan}
      />

      <div className="project-edit-brief-marker-drawer__readonly" data-testid="project-edit-brief-marker-future-systems">
        <h4>Future marker systems</h4>
        <p>Planner application remains blocked until future approval.</p>
        <p>QA results are mock/local metadata only and do not auto-fix conflicts.</p>
      </div>

      <p className="project-edit-brief-muted">{form.boundary}</p>
      <ProjectEditBriefMarkerActionBar
        busy={busy}
        canArchive={canArchive}
        canConfirm={canConfirm}
        canSave={form.canSave}
        mode={form.mode}
        onArchive={onArchive}
        onCancel={onClose}
        onConfirm={onConfirm}
        onSave={onSave}
      />
    </section>
  )
}
