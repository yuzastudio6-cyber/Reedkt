import type { ProjectEditBriefAttachmentKind } from '../../../types/project-edit-brief'
import type {
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentKindDefinition,
} from '../../../types/project-edit-brief-attachments'

type ProjectEditBriefAttachmentKindPickerProps = {
  draft: ProjectEditBriefAttachmentDraft
  kinds: ProjectEditBriefAttachmentKindDefinition[]
  onChange: (draft: ProjectEditBriefAttachmentDraft) => void
}

export function ProjectEditBriefAttachmentKindPicker({
  draft,
  kinds,
  onChange,
}: ProjectEditBriefAttachmentKindPickerProps) {
  function updateKind(value: string) {
    const attachmentKind = value as ProjectEditBriefAttachmentKind
    onChange({
      ...draft,
      attachmentKind,
      inputMode: attachmentKind === 'reference_url_metadata_only' ? 'metadata_reference_url' : 'metadata_label',
      referenceUrl: attachmentKind === 'reference_url_metadata_only' ? draft.referenceUrl : undefined,
      safetyStatus: 'safe_metadata_only',
    })
  }

  return (
    <label className="project-edit-brief-marker-field">
      <span>Attachment kind</span>
      <select
        data-testid="project-edit-brief-attachment-kind-picker"
        onChange={(event) => updateKind(event.target.value)}
        value={draft.attachmentKind}
      >
        {kinds.map((kind) => (
          <option key={kind.kind} value={kind.kind}>
            {kind.displayName}
          </option>
        ))}
      </select>
      <small>All kinds are metadata-only in this milestone.</small>
    </label>
  )
}
