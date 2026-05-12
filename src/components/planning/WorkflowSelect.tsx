import type { SelectOption } from '../../lib/workflow-profiles'

type WorkflowSelectProps<T extends string> = {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  helper?: string
}

export function WorkflowSelect<T extends string>({ helper, label, onChange, options, value }: WorkflowSelectProps<T>) {
  return (
    <label className="planning-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value as T)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && <small>{helper}</small>}
    </label>
  )
}
