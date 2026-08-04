import type { PriorityLevel } from '../../../types'

type SourceAssetPriorityPickerProps = {
  value: PriorityLevel
  onChange: (priority: PriorityLevel) => void
  disabled?: boolean
}

const priorityOptions: Array<{ label: string; value: PriorityLevel }> = [
  { label: 'Must use', value: 'must_follow' },
  { label: 'Prefer', value: 'prefer' },
  { label: 'Optional', value: 'optional' },
  { label: 'Avoid', value: 'avoid' },
  { label: 'Do not use', value: 'do_not_use' },
]

export function SourceAssetPriorityPicker({ disabled = false, onChange, value }: SourceAssetPriorityPickerProps) {
  return (
    <label className="source-asset-field">
      <span>Priority</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value as PriorityLevel)} value={value}>
        {priorityOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
