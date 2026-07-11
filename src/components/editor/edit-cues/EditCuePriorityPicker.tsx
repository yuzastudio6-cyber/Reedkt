import type { PriorityLevel } from '../../../types'

type EditCuePriorityPickerProps = {
  value: PriorityLevel
  onChange?: (priority: PriorityLevel) => void
}

const priorityOptions: Array<{ label: string; value: PriorityLevel }> = [
  { label: 'Must follow', value: 'must_follow' },
  { label: 'Prefer', value: 'prefer' },
  { label: 'Optional', value: 'optional' },
  { label: 'Avoid', value: 'avoid' },
  { label: 'Do not use', value: 'do_not_use' },
]

export function EditCuePriorityPicker({ onChange, value }: EditCuePriorityPickerProps) {
  return (
    <label className="edit-cue-field">
      <span>Priority</span>
      <select onChange={(event) => onChange?.(event.target.value as PriorityLevel)} value={value}>
        {priorityOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
