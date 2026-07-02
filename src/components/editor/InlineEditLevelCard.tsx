import { Badge } from '../Badge'
import { Button } from '../Button'
import type { EditLevel } from '../../types/reeditpro'

type InlineEditLevelCardProps = {
  selectedLevel: EditLevel
  onSelect: (value: EditLevel) => void
  onConfirm?: () => void
  confirmed?: boolean
}

type EditLevelChoice = {
  value: EditLevel
  label: string
  badge: string
  bullets: string[]
}

const editLevelChoices: EditLevelChoice[] = [
  {
    value: 'basic',
    label: 'Basic',
    badge: 'Veo locked',
    bullets: [
      'Professional clean edit.',
      'Lower compute.',
      'More still cards and editor motion.',
      'Fewer generated AI-video assets.',
      'Wan only for simple animation.',
      'No Veo.',
    ],
  },
  {
    value: 'pro',
    label: 'Pro',
    badge: 'Veo locked',
    bullets: [
      'Main production tier.',
      'Stronger visual planning.',
      'GPT-Image-2 stills/keyframes.',
      'Wan primary.',
      'Hailuo fallback.',
      'No Veo.',
    ],
  },
  {
    value: 'premium',
    label: 'Premium',
    badge: 'Veo final fallback only',
    bullets: [
      'Deepest planning.',
      'More custom visual assets and retries.',
      'Stronger consistency checks.',
      'Wan primary.',
      'Hailuo fallback.',
      'Veo Lite final fallback/rescue only.',
      'Veo is not default.',
    ],
  },
]

export function InlineEditLevelCard({ confirmed = false, onConfirm, onSelect, selectedLevel }: InlineEditLevelCardProps) {
  return (
    <section className="inline-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Production depth</span>
          <h3>How deep should this edit be?</h3>
        </div>
        <Badge accent={selectedLevel === 'premium' ? 'warning' : 'cyan'}>
          {selectedLevel === 'premium' ? 'Veo final fallback only' : 'Veo locked'}
        </Badge>
      </div>
      <p className="inline-helper">
        Every level should meet a professional standard. The level changes planning depth, generated asset count, fallback depth, and credit estimate.
      </p>

      <div className="edit-level-grid">
        {editLevelChoices.map((level) => (
          <button
            aria-pressed={selectedLevel === level.value}
            className={`edit-level-card inline-setup-option ${selectedLevel === level.value ? 'active inline-setup-option-active' : ''}`.trim()}
            key={level.value}
            onClick={() => onSelect(level.value)}
            type="button"
          >
            <span className="choice-card-title">{level.label}</span>
            <Badge accent={level.value === 'premium' ? 'warning' : 'muted'}>{level.badge}</Badge>
            <ul>
              {level.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {onConfirm && (
        <div className="inline-card-actions">
          <Button onClick={onConfirm} variant={confirmed ? 'secondary' : 'primary'}>
            {confirmed ? 'Level selected' : 'Use this level'}
          </Button>
        </div>
      )}
    </section>
  )
}
