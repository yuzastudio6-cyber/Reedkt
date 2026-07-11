import type {
  CaptionPreference,
  MusicPreference,
  PacingPreference,
} from '../../../types'

type EditBriefPreferenceSectionProps = {
  pacingPreference?: PacingPreference
  captionPreference?: CaptionPreference
  musicPreference?: MusicPreference
  bRollPreference?: string
  onUpdatePacingPreference?: (value: PacingPreference) => void
  onUpdateCaptionPreference?: (value: CaptionPreference) => void
  onUpdateMusicPreference?: (value: MusicPreference) => void
  onUpdateBRollPreference?: (value: string) => void
}

const pacingOptions: Array<{ label: string; value: PacingPreference }> = [
  { label: 'AI decides', value: 'ai_decides' },
  { label: 'Slow', value: 'slow' },
  { label: 'Natural', value: 'natural' },
  { label: 'Tight', value: 'tight' },
  { label: 'Fast', value: 'fast' },
  { label: 'Very fast', value: 'very_fast' },
]

const captionOptions: Array<{ label: string; value: CaptionPreference }> = [
  { label: 'AI decides', value: 'ai_decides' },
  { label: 'None', value: 'none' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Standard', value: 'standard' },
  { label: 'Dynamic', value: 'dynamic' },
  { label: 'Bold creator', value: 'bold_creator' },
  { label: 'Premium subtle', value: 'premium_subtle' },
]

const musicOptions: Array<{ label: string; value: MusicPreference }> = [
  { label: 'AI decides', value: 'ai_decides' },
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Energetic', value: 'energetic' },
  { label: 'Cinematic', value: 'cinematic' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Trend based', value: 'trend_based' },
]

export function EditBriefPreferenceSection({
  bRollPreference = '',
  captionPreference = 'ai_decides',
  musicPreference = 'ai_decides',
  onUpdateBRollPreference,
  onUpdateCaptionPreference,
  onUpdateMusicPreference,
  onUpdatePacingPreference,
  pacingPreference = 'ai_decides',
}: EditBriefPreferenceSectionProps) {
  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Preferences</span>
          <h3>Set planning preferences.</h3>
        </div>
      </div>

      <div className="edit-brief-preference-grid">
        <label className="edit-brief-field">
          <span>Pacing</span>
          <select onChange={(event) => onUpdatePacingPreference?.(event.target.value as PacingPreference)} value={pacingPreference}>
            {pacingOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="edit-brief-field">
          <span>Captions</span>
          <select onChange={(event) => onUpdateCaptionPreference?.(event.target.value as CaptionPreference)} value={captionPreference}>
            {captionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="edit-brief-field">
          <span>Music</span>
          <select onChange={(event) => onUpdateMusicPreference?.(event.target.value as MusicPreference)} value={musicPreference}>
            {musicOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="edit-brief-field">
        <span>B-roll preference</span>
        <textarea
          onChange={(event) => onUpdateBRollPreference?.(event.target.value)}
          placeholder="Example: Use B-roll during explanations, but keep the speaker visible during emotional moments."
          rows={3}
          value={bRollPreference}
        />
      </label>
    </section>
  )
}
