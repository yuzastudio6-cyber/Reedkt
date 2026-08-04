import { Badge } from '../Badge'

type InlineWorkflowChoiceCardProps = {
  selectedWorkflow: string
}

export function InlineWorkflowChoiceCard({ selectedWorkflow }: InlineWorkflowChoiceCardProps) {
  return (
    <section className="inline-chat-card workflow-choice-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit context</span>
          <h3>{selectedWorkflow}</h3>
        </div>
        <Badge accent="cyan">Context only</Badge>
      </div>
      <p className="inline-helper">
        This helps ReeditPro understand the job. It does not automatically decide animation, graphics,
        premium motion, music, or sound effects.
      </p>
    </section>
  )
}
