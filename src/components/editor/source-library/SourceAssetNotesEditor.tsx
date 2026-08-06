type SourceAssetNotesEditorProps = {
  value?: string
  onChange: (notes: string) => void
  disabled?: boolean
}

export function SourceAssetNotesEditor({ disabled = false, onChange, value = '' }: SourceAssetNotesEditorProps) {
  return (
    <label className="source-asset-notes">
      <span>Notes</span>
      <textarea
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tell AI how this asset should be used..."
        rows={3}
        value={value}
      />
    </label>
  )
}
