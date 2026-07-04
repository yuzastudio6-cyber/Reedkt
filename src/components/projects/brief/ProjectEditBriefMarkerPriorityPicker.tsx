import type {
  ProjectEditBriefMarkerDraftForUI,
  ProjectEditBriefMarkerFormModel,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'

type ProjectEditBriefMarkerPriorityPickerProps = {
  draft: ProjectEditBriefMarkerDraftForUI
  form: ProjectEditBriefMarkerFormModel
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
}

export function ProjectEditBriefMarkerPriorityPicker({ draft, form, onChange }: ProjectEditBriefMarkerPriorityPickerProps) {
  return (
    <label className="project-edit-brief-marker-field">
      <span>Priority</span>
      <select
        data-testid="project-edit-brief-marker-priority-picker"
        onChange={(event) => onChange({ ...draft, priority: event.target.value as ProjectEditBriefMarkerDraftForUI['priority'] })}
        value={draft.priority}
      >
        {form.priorityOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
