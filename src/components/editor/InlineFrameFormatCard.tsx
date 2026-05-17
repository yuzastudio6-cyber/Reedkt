import { Badge } from '../Badge'
import { Button } from '../Button'
import type { AspectRatio, FrameTemplateType, TargetPlatform } from '../../types/reeditpro'
import { FrameLayoutPreview } from './FrameLayoutPreview'

type InlineFrameFormatCardProps = {
  selectedPlatform: TargetPlatform
  selectedAspectRatio: AspectRatio
  selectedFrameTemplate: FrameTemplateType
  onSelect: (platform: TargetPlatform, aspectRatio: AspectRatio, frameTemplate: FrameTemplateType) => void
  onConfirm?: () => void
  confirmed?: boolean
}

type FrameFormatChoice = {
  label: string
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  frameTemplate: FrameTemplateType
  description: string
}

const frameFormatChoices: FrameFormatChoice[] = [
  {
    label: 'TikTok / Reels / Shorts',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    frameTemplate: 'vertical_talking_head_lower_panel',
    description: 'Speaker-safe vertical layout with lower animation panel.',
  },
  {
    label: 'YouTube',
    targetPlatform: 'youtube',
    aspectRatio: '16:9',
    frameTemplate: 'youtube_side_panel',
    description: 'Landscape layout with controlled side panel or lower panel.',
  },
  {
    label: 'Square',
    targetPlatform: 'custom',
    aspectRatio: '1:1',
    frameTemplate: 'square_center_panel',
    description: 'Centered square layout for platform-flexible posts.',
  },
  {
    label: 'Let AI decide',
    targetPlatform: 'custom',
    aspectRatio: 'let_ai_decide',
    frameTemplate: 'let_ai_decide',
    description: 'ReeditPro chooses based on content and user goal.',
  },
]

function isSelected(choice: FrameFormatChoice, selectedPlatform: TargetPlatform, selectedAspectRatio: AspectRatio, selectedFrameTemplate?: FrameTemplateType) {
  if (selectedFrameTemplate) {
    return selectedFrameTemplate === choice.frameTemplate
  }

  return selectedPlatform === choice.targetPlatform && selectedAspectRatio === choice.aspectRatio
}

export function InlineFrameFormatCard({
  confirmed = false,
  onConfirm,
  onSelect,
  selectedAspectRatio,
  selectedFrameTemplate,
  selectedPlatform,
}: InlineFrameFormatCardProps) {
  const selectedChoice = frameFormatChoices.find((choice) => isSelected(choice, selectedPlatform, selectedAspectRatio, selectedFrameTemplate))

  return (
    <section className="inline-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Frame system</span>
          <h3>Where is this video going?</h3>
        </div>
        <Badge accent={confirmed ? 'success' : 'blue'}>{confirmed ? 'Format confirmed' : 'Panel based'}</Badge>
      </div>
      <p className="inline-helper">
        AI visuals are generated on the same background color as the selected panel. This avoids relying on background removal.
        Transparent overlays are future/controlled-renderer options, not the default for AI video models.
      </p>

      <FrameLayoutPreview compact templateType={selectedChoice?.frameTemplate ?? selectedFrameTemplate} />

      <div className="frame-format-grid">
        {frameFormatChoices.map((choice) => (
          <button
            aria-pressed={isSelected(choice, selectedPlatform, selectedAspectRatio, selectedFrameTemplate)}
            className={`frame-format-card inline-setup-option ${isSelected(choice, selectedPlatform, selectedAspectRatio, selectedFrameTemplate) ? 'active inline-setup-option-active' : ''}`.trim()}
            key={choice.frameTemplate}
            onClick={() => onSelect(choice.targetPlatform, choice.aspectRatio, choice.frameTemplate)}
            type="button"
          >
            <span className="choice-card-title">{choice.label}</span>
            <span>{choice.description}</span>
            <small>{choice.aspectRatio} / {choice.frameTemplate.replaceAll('_', ' ')}</small>
          </button>
        ))}
      </div>

      {onConfirm && (
        <div className="inline-card-actions">
          <Button onClick={onConfirm} variant={confirmed ? 'secondary' : 'primary'}>
            {confirmed ? 'Format selected' : 'Use this format'}
          </Button>
        </div>
      )}
    </section>
  )
}
