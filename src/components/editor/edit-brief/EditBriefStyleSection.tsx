import { EditBriefKeywordInput } from './EditBriefKeywordInput'

type EditBriefStyleSectionProps = {
  styleKeywords: string[]
  onUpdateStyleKeywords?: (keywords: string[]) => void
}

const suggestedKeywords = [
  'premium',
  'clean',
  'fast',
  'cinematic',
  'natural',
  'bold',
  'educational',
  'emotional',
  'luxury',
  'minimal',
  'high-energy',
  'trustworthy',
]

export function EditBriefStyleSection({
  onUpdateStyleKeywords,
  styleKeywords,
}: EditBriefStyleSectionProps) {
  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Style</span>
          <h3>Choose the creative direction.</h3>
        </div>
      </div>

      <EditBriefKeywordInput
        onChange={onUpdateStyleKeywords}
        placeholder="Add a style keyword..."
        suggestions={suggestedKeywords}
        value={styleKeywords}
      />
    </section>
  )
}
