import type {
  ProjectEditBriefMarkerDraftForUI,
  ProjectEditBriefMarkerFormModel,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'

type ProjectEditBriefMarkerTypePickerProps = {
  draft: ProjectEditBriefMarkerDraftForUI
  form: ProjectEditBriefMarkerFormModel
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
}

export function ProjectEditBriefMarkerTypePicker({ draft, form, onChange }: ProjectEditBriefMarkerTypePickerProps) {
  return (
    <label className="project-edit-brief-marker-field">
      <span>Marker type</span>
      <select
        data-testid="project-edit-brief-marker-type-picker"
        onChange={(event) => onChange({ ...draft, markerType: event.target.value as ProjectEditBriefMarkerDraftForUI['markerType'] })}
        value={draft.markerType}
      >
        {form.markerTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
