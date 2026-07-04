import type { UserFacingEditLevel } from '../../types/reeditpro'
import { NEW_EDIT_SESSION_EDIT_LEVEL_OPTIONS } from '../../lib/project-edit-session-create-flow-ui-adapter'

type NewEditSessionEditLevelPickerProps = {
  value: UserFacingEditLevel
  onChange: (value: UserFacingEditLevel) => void
}

export function NewEditSessionEditLevelPicker({ onChange, value }: NewEditSessionEditLevelPickerProps) {
  return (
    <fieldset className="new-edit-session-choice-group" data-testid="new-edit-level-picker">
      <legend>Edit level</legend>
      <div className="new-edit-session-choice-grid">
        {NEW_EDIT_SESSION_EDIT_LEVEL_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={`new-edit-session-choice ${value === option.id ? 'is-selected' : ''}`.trim()}
            data-testid={`new-edit-level-${option.id}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
