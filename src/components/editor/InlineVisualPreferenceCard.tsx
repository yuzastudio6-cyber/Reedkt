import { Badge } from '../Badge'
import { Button } from '../Button'
import { visualPreferenceOptions } from '../../lib/workflow-profiles'
import type { VisualPreference } from '../../types/reeditpro'

type InlineVisualPreferenceCardProps = {
  selectedPreference: VisualPreference
  onSelect: (value: VisualPreference) => void
  onConfirm?: () => void
  confirmed?: boolean
}

const visualPreferenceDescriptions: Record<VisualPreference, string> = {
  let_ai_decide: 'Let ReeditPro choose visuals only where they improve the story.',
  keep_visuals_minimal: 'Keep the edit mostly footage, captions, and light editor motion.',
  balanced_visual_mix: 'Use a balanced mix of stills, cards, light motion, and selected animation.',
  more_stroke_motion: 'Favor narrative Stroke Motion when story beats need action or emotion.',
  more_graphic_design: 'Favor controlled cards, diagrams, labels, and VisualExplain frames.',
  real_motion_if_useful: 'Allow credit-heavy Real Motion only where it clearly supports proof or product moments.',
  no_extra_visuals: 'Avoid extra visual systems unless the user later approves a change.',
}

export function InlineVisualPreferenceCard({ confirmed = false, onConfirm, onSelect, selectedPreference }: InlineVisualPreferenceCardProps) {
  return (
    <section className="inline-chat-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Optional visual direction</span>
          <h3>Choose the visual preference</h3>
        </div>
        <Badge accent={confirmed ? 'success' : 'muted'}>{confirmed ? 'Preference confirmed' : 'Optional'}</Badge>
      </div>
      <p className="inline-helper">
        Visual preference guides the plan, but ReeditPro still decides per segment whether a visual actually improves the edit.
      </p>
      <p className="inline-helper">
        Stroke Motion = story/action/emotion. Graphic Design / VisualExplain = education/diagrams/lists/concepts. Real Motion = realistic object/product/proof moments, premium/credit-heavy.
      </p>

      <div className="visual-preference-choice-grid">
        {visualPreferenceOptions.map((option) => (
          <button
            aria-pressed={selectedPreference === option.value}
            className={`visual-preference-choice-card inline-setup-option ${selectedPreference === option.value ? 'active inline-setup-option-active' : ''}`.trim()}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            <span className="choice-card-title">{option.label}</span>
            <small>{visualPreferenceDescriptions[option.value]}</small>
          </button>
        ))}
      </div>

      {onConfirm && (
        <div className="inline-card-actions">
          <Button onClick={onConfirm} variant={confirmed ? 'secondary' : 'primary'}>
            {confirmed ? 'Preference selected' : 'Use this preference'}
          </Button>
        </div>
      )}
    </section>
  )
}
