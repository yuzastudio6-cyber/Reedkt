import type { EditScope } from '../../../types'

const SCOPE_LABELS: Record<EditScope, string> = {
  single_element: 'This element',
  sentence: 'This sentence',
  scene: 'This scene',
  group: 'This group',
  system: 'This system',
  whole_video: 'Whole video',
}

type EditScopeSelectorProps = {
  value: EditScope
  availableScopes: EditScope[]
  onChange?: (scope: EditScope) => void
}

export function EditScopeSelector({ availableScopes, onChange, value }: EditScopeSelectorProps) {
  return (
    <div className="edit-scope-selector" role="group" aria-label="Edit scope">
      {availableScopes.map((scope) => (
        <button
          aria-pressed={scope === value}
          className={scope === value ? 'edit-scope-option edit-scope-option--active' : 'edit-scope-option'}
          key={scope}
          onClick={() => onChange?.(scope)}
          type="button"
        >
          {SCOPE_LABELS[scope]}
        </button>
      ))}
    </div>
  )
}
