import { Plus } from 'lucide-react'
import { Button } from '../../Button'
import type { ProjectEditBriefAttachmentDraft } from '../../../types/project-edit-brief-attachments'
import {
  PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS,
  validateProjectEditBriefAttachmentDraftForUI,
} from '../../../lib/project-edit-brief-attachment-ui-adapter'
import { ProjectEditBriefAttachmentKindPicker } from './ProjectEditBriefAttachmentKindPicker'

type ProjectEditBriefAttachmentFormProps = {
  busy?: boolean
  draft: ProjectEditBriefAttachmentDraft
  onCancel: () => void
  onChange: (draft: ProjectEditBriefAttachmentDraft) => void
  onSave: () => void
}

export function ProjectEditBriefAttachmentForm({
  busy = false,
  draft,
  onCancel,
  onChange,
  onSave,
}: ProjectEditBriefAttachmentFormProps) {
  const validation = validateProjectEditBriefAttachmentDraftForUI(draft)
  const noteText = draft.notes.join('\n')
  const usesReferenceUrl = draft.inputMode === 'metadata_reference_url'

  return (
    <div className="project-edit-brief-attachment-form" data-testid="project-edit-brief-attachment-form">
      <ProjectEditBriefAttachmentKindPicker
        draft={draft}
        kinds={PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS}
        onChange={onChange}
      />
      <label className="project-edit-brief-marker-field">
        <span>{usesReferenceUrl ? 'Safe reference label' : 'Metadata label'}</span>
        <input
          data-testid="project-edit-brief-attachment-label-input"
          onChange={(event) => onChange({ ...draft, label: event.target.value })}
          placeholder={usesReferenceUrl ? 'Reference label' : 'Example: city-broll.mp4'}
          value={draft.label}
        />
      </label>
      {usesReferenceUrl ? (
        <label className="project-edit-brief-marker-field">
          <span>Reference URL metadata</span>
          <input
            data-testid="project-edit-brief-attachment-url-input"
            onChange={(event) => onChange({ ...draft, referenceUrl: event.target.value, referenceLabel: draft.label })}
            placeholder="https://example.com/reference"
            value={draft.referenceUrl ?? ''}
          />
          <small>Stored and redacted as metadata only; never fetched.</small>
        </label>
      ) : null}
      <label className="project-edit-brief-marker-field">
        <span>Notes</span>
        <textarea
          data-testid="project-edit-brief-attachment-notes-input"
          onChange={(event) => onChange({ ...draft, notes: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
          placeholder="Optional marker-scoped attachment notes."
          rows={3}
          value={noteText}
        />
      </label>
      <label className="project-edit-brief-attachment-upload-placeholder">
        <span>Real upload</span>
        <input aria-label="Real upload disabled" disabled type="file" />
        <small>Real uploads arrive after storage/media gates.</small>
      </label>
      {validation.blockedReasons.length ? (
        <ul className="project-edit-brief-marker-errors" data-testid="project-edit-brief-attachment-validation-errors">
          {validation.blockedReasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}
      <div className="project-edit-brief-attachment-actions">
        <Button disabled={busy} onClick={onCancel} size="sm" variant="ghost">Cancel</Button>
        <Button
          data-testid="project-edit-brief-attachment-save-button"
          disabled={busy || !validation.ok}
          icon={Plus}
          onClick={onSave}
          size="sm"
          variant="primary"
        >
          Add metadata
        </Button>
      </div>
    </div>
  )
}
