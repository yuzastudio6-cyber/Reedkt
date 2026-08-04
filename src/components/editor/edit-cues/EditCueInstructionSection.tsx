type EditCueInstructionSectionProps = {
  instructions: string
  onChange?: (instructions: string) => void
}

export function EditCueInstructionSection({
  instructions,
  onChange,
}: EditCueInstructionSectionProps) {
  return (
    <label className="edit-cue-field edit-cue-instructions">
      <span>Instructions</span>
      <textarea
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Example: Use the kitchen clip as B-roll when I mention the renovated kitchen. Keep main voice audio, crop cleanly, and avoid covering captions."
        rows={3}
        value={instructions}
      />
    </label>
  )
}
