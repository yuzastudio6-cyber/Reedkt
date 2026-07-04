import {
  PROJECT_EDIT_BRIEF_MARKER_STATUS_OPTIONS,
  type ProjectEditBriefMarkerDraftForUI,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'

type ProjectEditBriefMarkerStatusControlsProps = {
  draft: ProjectEditBriefMarkerDraftForUI
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
}

export function ProjectEditBriefMarkerStatusControls({ draft, onChange }: ProjectEditBriefMarkerStatusControlsProps) {
  return (
    <label className="project-edit-brief-marker-field">
      <span>Status</span>
      <select
        data-testid="project-edit-brief-marker-status-controls"
        onChange={(event) => onChange({ ...draft, status: event.target.value as ProjectEditBriefMarkerDraftForUI['status'] })}
        value={draft.status}
      >
        {PROJECT_EDIT_BRIEF_MARKER_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
