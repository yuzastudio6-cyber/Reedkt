import { MessageSquareText } from 'lucide-react'
import { Card } from '../Card'

type InstructionTextareaProps = {
  value: string
  onChange: (value: string) => void
}

export function InstructionTextarea({ onChange, value }: InstructionTextareaProps) {
  return (
    <Card className="instruction-card">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">Highest priority</span>
          <h2>Custom instructions</h2>
        </div>
        <MessageSquareText size={22} />
      </div>
      <label className="planning-field">
        <span>Tell ReeditPro what matters</span>
        <textarea
          onChange={(event) => onChange(event.target.value)}
          placeholder="Example: Keep it natural, preserve the order, add captions, use subtle motion, and make it feel premium."
          value={value}
        />
        <small>Your instructions have highest priority in the edit plan.</small>
      </label>
    </Card>
  )
}
