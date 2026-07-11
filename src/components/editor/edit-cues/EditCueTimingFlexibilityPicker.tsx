import type { TimingFlexibility } from '../../../types'

type EditCueTimingFlexibilityPickerProps = {
  value: TimingFlexibility
  onChange?: (value: TimingFlexibility) => void
}

const timingOptions: Array<{ label: string; value: TimingFlexibility }> = [
  { label: 'Exact timing', value: 'exact' },
  { label: 'AI can adjust slightly', value: 'ai_can_adjust' },
  { label: 'AI decides best placement', value: 'ai_decides' },
]

export function EditCueTimingFlexibilityPicker({
  onChange,
  value,
}: EditCueTimingFlexibilityPickerProps) {
  return (
    <label className="edit-cue-field">
      <span>Timing</span>
      <select onChange={(event) => onChange?.(event.target.value as TimingFlexibility)} value={value}>
        {timingOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
