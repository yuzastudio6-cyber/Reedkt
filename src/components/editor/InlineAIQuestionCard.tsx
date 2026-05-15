import { Badge } from '../Badge'

type InlineAIQuestionCardProps = {
  onSelect: (value: string) => void
}

const choices = [
  'Simple clean edit',
  'Social short',
  'Talking head',
  'Podcast clip',
  'Vlog / lifestyle',
  'Product demo',
  'Real estate / property tour',
  'Education / explainer',
  'Marketing ad',
  'Testimonial / case study',
  'Custom / let AI decide',
]

export function InlineAIQuestionCard({ onSelect }: InlineAIQuestionCardProps) {
  return (
    <section className="inline-chat-card ai-question-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Question from AI</span>
          <h3>What kind of edit do you want?</h3>
        </div>
        <Badge>Optional</Badge>
      </div>
      <p className="inline-helper">You can choose one, or just type instructions. Workflow choices guide context and do not force signature systems.</p>
      <div className="inline-choice-grid">
        {choices.map((choice) => (
          <button key={choice} onClick={() => onSelect(choice)} type="button">
            {choice}
          </button>
        ))}
      </div>
    </section>
  )
}
