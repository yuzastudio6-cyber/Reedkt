import { Eraser, WandSparkles } from 'lucide-react'
import { Button } from '../Button'
import type { ProjectEditSessionPreferenceOption } from '../../types/project-edit-session-preference'

type ProjectEditSessionPreferencePickerProps = {
  busy?: boolean
  canClear: boolean
  onApply: (option: ProjectEditSessionPreferenceOption) => void
  onClear: () => void
  options: ProjectEditSessionPreferenceOption[]
  selectedHandle?: string
}

export function ProjectEditSessionPreferencePicker({
  busy = false,
  canClear,
  onApply,
  onClear,
  options,
  selectedHandle,
}: ProjectEditSessionPreferencePickerProps) {
  const applyOptions = options.filter((option) => option.sourceKind !== 'none')
  return (
    <section className="project-edit-session-preference-picker" data-testid="edit-session-preference-picker">
      <div className="project-edit-session-preference-picker__grid">
        {applyOptions.map((option) => {
          const selected = selectedHandle === option.handle
          return (
            <button
              aria-pressed={selected}
              className={`project-edit-session-preference-choice ${selected ? 'is-selected' : ''}`.trim()}
              data-testid={`edit-session-preference-option-${option.handle ?? option.id}`}
              disabled={busy}
              key={option.handle ?? option.id}
              onClick={() => onApply(option)}
              type="button"
            >
              <strong>{option.handle ?? option.name}</strong>
              <span>{option.hasDNA ? 'DNA-backed mock preference' : 'Legacy no-DNA fallback'}</span>
            </button>
          )
        })}
      </div>
      <div className="project-edit-session-preference-picker__actions">
        <Button disabled={busy || !applyOptions.length} icon={WandSparkles} onClick={() => applyOptions[0] && onApply(applyOptions[0])} size="sm" variant="secondary">
          Apply first option
        </Button>
        <Button disabled={busy || !canClear} icon={Eraser} onClick={onClear} size="sm" variant="ghost">
          Clear preference
        </Button>
      </div>
    </section>
  )
}
