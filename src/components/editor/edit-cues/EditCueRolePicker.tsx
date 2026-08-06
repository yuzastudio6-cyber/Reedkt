import type { EditCueRole } from '../../../types'

type EditCueRolePickerProps = {
  value: EditCueRole
  onChange?: (role: EditCueRole) => void
}

const roleOptions: Array<{ label: string; value: EditCueRole }> = [
  { label: 'B-roll', value: 'b_roll' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Picture-in-picture', value: 'picture_in_picture' },
  { label: 'Split screen', value: 'split_screen' },
  { label: 'Insert clip', value: 'insert_clip' },
  { label: 'Text overlay', value: 'text_overlay' },
  { label: 'Caption instruction', value: 'caption_instruction' },
  { label: 'Graphic', value: 'graphic' },
  { label: 'Sound effect', value: 'sound_effect' },
  { label: 'Music', value: 'music' },
  { label: 'Reference only', value: 'reference_only' },
  { label: 'Avoid', value: 'avoid' },
]

export function EditCueRolePicker({ onChange, value }: EditCueRolePickerProps) {
  return (
    <label className="edit-cue-field">
      <span>Role</span>
      <select onChange={(event) => onChange?.(event.target.value as EditCueRole)} value={value}>
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
