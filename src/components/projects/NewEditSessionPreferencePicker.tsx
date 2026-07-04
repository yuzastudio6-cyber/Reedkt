import type { NewEditSessionPreferenceChoiceId } from '../../lib/project-edit-session-create-flow-ui-adapter'
import { NEW_EDIT_SESSION_PREFERENCE_OPTIONS } from '../../lib/project-edit-session-create-flow-ui-adapter'

type NewEditSessionPreferencePickerProps = {
  value: NewEditSessionPreferenceChoiceId
  note: string
  onChange: (value: NewEditSessionPreferenceChoiceId) => void
  onNoteChange: (value: string) => void
}

export function NewEditSessionPreferencePicker({
  note,
  onChange,
  onNoteChange,
  value,
}: NewEditSessionPreferencePickerProps) {
  return (
    <fieldset className="new-edit-session-choice-group" data-testid="new-edit-preference-picker">
      <legend>Edit Preference</legend>
      <div className="new-edit-session-choice-grid">
        {NEW_EDIT_SESSION_PREFERENCE_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={`new-edit-session-choice ${value === option.id ? 'is-selected' : ''}`.trim()}
            data-testid={`new-edit-preference-${option.id}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <strong>{option.handle ?? option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <label className="new-edit-session-field">
        <span>Preference note</span>
        <input
          data-testid="new-edit-preference-note"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Optional mock note for this Edit Chat"
          type="text"
          value={note}
        />
      </label>
    </fieldset>
  )
}
