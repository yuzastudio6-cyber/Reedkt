import type { EditBriefTargetPlatform } from '../../../types'

type EditBriefPlatformSectionProps = {
  targetPlatforms: EditBriefTargetPlatform[]
  targetDurationMs?: number
  onUpdatePlatforms?: (platforms: EditBriefTargetPlatform[]) => void
  onUpdateTargetDuration?: (durationMs?: number) => void
}

const platformOptions: Array<{ label: string; value: EditBriefTargetPlatform }> = [
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram Reels', value: 'instagram_reels' },
  { label: 'YouTube Shorts', value: 'youtube_shorts' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'X', value: 'x' },
  { label: 'Website', value: 'website' },
  { label: 'Custom', value: 'custom' },
]

const durationOptions = [
  { label: 'AI decides', value: '' },
  { label: '15 seconds', value: '15000' },
  { label: '30 seconds', value: '30000' },
  { label: '45 seconds', value: '45000' },
  { label: '60 seconds', value: '60000' },
  { label: '90 seconds', value: '90000' },
]

function togglePlatform(platforms: EditBriefTargetPlatform[], platform: EditBriefTargetPlatform) {
  if (platforms.includes(platform)) {
    return platforms.filter((item) => item !== platform)
  }

  return [...platforms, platform]
}

export function EditBriefPlatformSection({
  onUpdatePlatforms,
  onUpdateTargetDuration,
  targetDurationMs,
  targetPlatforms,
}: EditBriefPlatformSectionProps) {
  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Platform</span>
          <h3>Where should this edit be planned for?</h3>
        </div>
      </div>

      <div className="edit-brief-chip-grid" role="group" aria-label="Target platforms">
        {platformOptions.map((option) => {
          const selected = targetPlatforms.includes(option.value)
          return (
            <button
              className={`edit-brief-choice-chip ${selected ? 'edit-brief-choice-chip-selected' : ''}`}
              key={option.value}
              onClick={() => onUpdatePlatforms?.(togglePlatform(targetPlatforms, option.value))}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <label className="edit-brief-field">
        <span>Target duration</span>
        <select
          onChange={(event) => onUpdateTargetDuration?.(event.target.value ? Number(event.target.value) : undefined)}
          value={targetDurationMs ? String(targetDurationMs) : ''}
        >
          {durationOptions.map((option) => (
            <option key={option.value || 'ai-decides'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </section>
  )
}
