import type {
  ProjectEditBriefMarkerDraftForUI,
  ProjectEditBriefMarkerFormModel,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'

type ProjectEditBriefMarkerAIModePickerProps = {
  draft: ProjectEditBriefMarkerDraftForUI
  form: ProjectEditBriefMarkerFormModel
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
}

export function ProjectEditBriefMarkerAIModePicker({ draft, form, onChange }: ProjectEditBriefMarkerAIModePickerProps) {
  return (
    <label className="project-edit-brief-marker-field">
      <span>AI mode metadata</span>
      <select
        data-testid="project-edit-brief-marker-ai-mode-picker"
        onChange={(event) => onChange({ ...draft, aiMode: event.target.value as ProjectEditBriefMarkerDraftForUI['aiMode'] })}
        value={draft.aiMode}
      >
        {form.aiModeOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
