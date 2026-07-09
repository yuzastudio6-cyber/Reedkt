import type { ProjectEditSessionAspectRatio } from '../../types/project-edit-session'
import { NEW_EDIT_SESSION_ASPECT_OPTIONS } from '../../lib/project-edit-session-create-flow-ui-adapter'

type NewEditSessionAspectRatioPickerProps = {
  value?: ProjectEditSessionAspectRatio
  onChange: (value: ProjectEditSessionAspectRatio) => void
}

export function NewEditSessionAspectRatioPicker({ onChange, value }: NewEditSessionAspectRatioPickerProps) {
  return (
    <fieldset className="new-edit-session-choice-group" data-testid="new-edit-aspect-picker">
      <legend>Output frame</legend>
      {!value ? <p className="new-edit-session-choice-group__hint">Choose the final frame before this edit can be created.</p> : null}
      <div className="new-edit-session-choice-grid">
        {NEW_EDIT_SESSION_ASPECT_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={`new-edit-session-choice ${value === option.id ? 'is-selected' : ''}`.trim()}
            data-testid={`new-edit-aspect-${option.id}`}
            disabled={option.disabled}
            key={option.id}
            onClick={() => {
              if (!option.disabled) onChange(option.id)
            }}
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
