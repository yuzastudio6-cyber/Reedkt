import type { AssetUsageRole } from '../../../types'

type SourceAssetRolePickerProps = {
  value: AssetUsageRole
  onChange: (role: AssetUsageRole) => void
  disabled?: boolean
}

const roleOptions: Array<{ label: string; value: AssetUsageRole }> = [
  { label: 'Main footage', value: 'main_footage' },
  { label: 'B-roll', value: 'b_roll' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Picture-in-picture', value: 'picture_in_picture' },
  { label: 'Split screen', value: 'split_screen' },
  { label: 'Insert clip', value: 'insert_clip' },
  { label: 'Screenshot', value: 'screenshot' },
  { label: 'Logo', value: 'logo' },
  { label: 'Music', value: 'music' },
  { label: 'SFX', value: 'sfx' },
  { label: 'Reference only', value: 'reference_only' },
  { label: 'Do not use', value: 'do_not_use' },
  { label: 'Unknown', value: 'unknown' },
]

export function SourceAssetRolePicker({ disabled = false, onChange, value }: SourceAssetRolePickerProps) {
  return (
    <label className="source-asset-field">
      <span>Role</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value as AssetUsageRole)} value={value}>
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
