import type { ProjectEditSessionPlatformTarget } from '../../types/project-edit-session'
import { NEW_EDIT_SESSION_PLATFORM_OPTIONS } from '../../lib/project-edit-session-create-flow-ui-adapter'

type NewEditSessionPlatformTargetPickerProps = {
  value?: ProjectEditSessionPlatformTarget
  onChange: (value: ProjectEditSessionPlatformTarget) => void
}

export function NewEditSessionPlatformTargetPicker({ onChange, value }: NewEditSessionPlatformTargetPickerProps) {
  return (
    <fieldset className="new-edit-session-choice-group" data-testid="new-edit-platform-picker">
      <legend>Platform target</legend>
      {!value ? <p className="new-edit-session-choice-group__hint">Choose where this edit is going so planning uses the right frame.</p> : null}
      <div className="new-edit-session-choice-grid new-edit-session-choice-grid--compact">
        {NEW_EDIT_SESSION_PLATFORM_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={`new-edit-session-choice ${value === option.id ? 'is-selected' : ''}`.trim()}
            data-testid={`new-edit-platform-${option.id}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
