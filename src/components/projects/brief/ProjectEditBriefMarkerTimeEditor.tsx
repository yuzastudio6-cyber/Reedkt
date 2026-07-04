import type {
  ProjectEditBriefMarkerDraftForUI,
  ProjectEditBriefMarkerFormModel,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'

type ProjectEditBriefMarkerTimeEditorProps = {
  draft: ProjectEditBriefMarkerDraftForUI
  form: ProjectEditBriefMarkerFormModel
  onChange: (draft: ProjectEditBriefMarkerDraftForUI) => void
}

function numberValue(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function defaultRangeEndSeconds(draft: ProjectEditBriefMarkerDraftForUI): number {
  const fallbackEnd = draft.startTimeSeconds + 3
  return Math.min(fallbackEnd, draft.durationSeconds ?? fallbackEnd)
}

export function ProjectEditBriefMarkerTimeEditor({ draft, form, onChange }: ProjectEditBriefMarkerTimeEditorProps) {
  return (
    <fieldset className="project-edit-brief-marker-time-editor" data-testid="project-edit-brief-marker-time-editor">
      <legend>Time</legend>
      <label className="project-edit-brief-marker-field">
        <span>Mode</span>
        <select
          data-testid="project-edit-brief-marker-time-mode-picker"
          onChange={(event) => onChange({
            ...draft,
            timeMode: event.target.value as ProjectEditBriefMarkerDraftForUI['timeMode'],
            endTimeSeconds: event.target.value === 'range' ? draft.endTimeSeconds ?? defaultRangeEndSeconds(draft) : undefined,
          })}
          value={draft.timeMode}
        >
          {form.timeModeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="project-edit-brief-marker-field">
        <span>Start seconds</span>
        <input
          data-testid="project-edit-brief-marker-start-time-input"
          min={0}
          onChange={(event) => onChange({ ...draft, startTimeSeconds: numberValue(event.target.value) })}
          type="number"
          value={draft.startTimeSeconds}
        />
      </label>
      {draft.timeMode === 'range' ? (
        <label className="project-edit-brief-marker-field">
          <span>End seconds</span>
          <input
            data-testid="project-edit-brief-marker-end-time-input"
            min={0}
            onChange={(event) => onChange({ ...draft, endTimeSeconds: numberValue(event.target.value) })}
            type="number"
            value={draft.endTimeSeconds ?? draft.startTimeSeconds}
          />
        </label>
      ) : null}
      <small data-testid="project-edit-brief-marker-time-label">{form.timeLabel}</small>
    </fieldset>
  )
}
