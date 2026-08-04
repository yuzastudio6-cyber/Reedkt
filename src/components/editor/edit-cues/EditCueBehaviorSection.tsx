import type {
  EditCueAudioBehavior,
  EditCueCropMode,
  EditCueMotionStyle,
  EditCueVisualBehavior,
  EditCueVisualPlacement,
} from '../../../types'

type EditCueBehaviorSectionProps = {
  audioBehavior?: EditCueAudioBehavior
  visualBehavior?: EditCueVisualBehavior
  onUpdateAudioBehavior?: (value: EditCueAudioBehavior) => void
  onUpdateVisualBehavior?: (patch: Partial<EditCueVisualBehavior>) => void
}

const audioOptions: Array<{ label: string; value: EditCueAudioBehavior }> = [
  { label: 'Keep main audio', value: 'keep_main_audio' },
  { label: 'Use asset audio', value: 'use_asset_audio' },
  { label: 'Mute asset audio', value: 'mute_asset_audio' },
  { label: 'Mix both', value: 'mix_both' },
  { label: 'AI decides', value: 'ai_decides' },
]

const placementOptions: Array<{ label: string; value: EditCueVisualPlacement }> = [
  { label: 'Full screen', value: 'full_screen' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Center', value: 'center' },
  { label: 'Lower third', value: 'lower_third' },
  { label: 'Upper third', value: 'upper_third' },
  { label: 'Background', value: 'background' },
  { label: 'AI decides', value: 'ai_decides' },
]

const cropOptions: Array<{ label: string; value: EditCueCropMode }> = [
  { label: 'Fill', value: 'fill' },
  { label: 'Fit', value: 'fit' },
  { label: 'Original', value: 'original' },
  { label: 'Safe crop', value: 'safe_crop' },
  { label: 'AI decides', value: 'ai_decides' },
]

const motionOptions: Array<{ label: string; value: EditCueMotionStyle }> = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Smooth', value: 'smooth' },
  { label: 'Dynamic', value: 'dynamic' },
  { label: 'Energetic', value: 'energetic' },
  { label: 'AI decides', value: 'ai_decides' },
]

export function EditCueBehaviorSection({
  audioBehavior = 'ai_decides',
  onUpdateAudioBehavior,
  onUpdateVisualBehavior,
  visualBehavior = {},
}: EditCueBehaviorSectionProps) {
  return (
    <section className="edit-cue-section">
      <div>
        <strong>Behavior</strong>
        <p className="inline-helper">These are instructions for professional integration, not raw layer placement.</p>
      </div>

      <div className="edit-cue-field-grid">
        <label className="edit-cue-field">
          <span>Audio</span>
          <select onChange={(event) => onUpdateAudioBehavior?.(event.target.value as EditCueAudioBehavior)} value={audioBehavior}>
            {audioOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="edit-cue-field">
          <span>Placement</span>
          <select onChange={(event) => onUpdateVisualBehavior?.({ placement: event.target.value as EditCueVisualPlacement })} value={visualBehavior.placement ?? 'ai_decides'}>
            {placementOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="edit-cue-field">
          <span>Crop</span>
          <select onChange={(event) => onUpdateVisualBehavior?.({ crop: event.target.value as EditCueCropMode })} value={visualBehavior.crop ?? 'ai_decides'}>
            {cropOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="edit-cue-field">
          <span>Motion</span>
          <select onChange={(event) => onUpdateVisualBehavior?.({ motion: event.target.value as EditCueMotionStyle })} value={visualBehavior.motion ?? 'ai_decides'}>
            {motionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="edit-cue-checkbox-row">
        {[
          ['safeZoneAware', 'Safe-zone aware'],
          ['avoidFaces', 'Avoid faces'],
          ['avoidCaptions', 'Avoid captions'],
          ['allowAiToImproveComposition', 'Allow AI to improve composition'],
        ].map(([key, label]) => (
          <label className="edit-cue-checkbox" key={key}>
            <input
              checked={Boolean(visualBehavior[key as keyof EditCueVisualBehavior])}
              onChange={(event) => onUpdateVisualBehavior?.({ [key]: event.target.checked })}
              type="checkbox"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
