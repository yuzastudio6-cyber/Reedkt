type EditBriefGoalSectionProps = {
  goal?: string
  audience?: string
  onUpdateGoal?: (goal: string) => void
  onUpdateAudience?: (audience: string) => void
}

export function EditBriefGoalSection({
  audience = '',
  goal = '',
  onUpdateAudience,
  onUpdateGoal,
}: EditBriefGoalSectionProps) {
  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Goal</span>
          <h3>What should this edit accomplish?</h3>
        </div>
      </div>

      <label className="edit-brief-field">
        <span>Overall goal</span>
        <textarea
          data-testid="edit-brief-goal-input"
          onChange={(event) => onUpdateGoal?.(event.target.value)}
          placeholder="Example: Turn this into a fast 45-second real estate Reel that feels premium."
          rows={3}
          value={goal}
        />
      </label>

      <label className="edit-brief-field">
        <span>Audience</span>
        <input
          onChange={(event) => onUpdateAudience?.(event.target.value)}
          placeholder="Example: first-time homebuyers, local sellers, startup founders, fitness clients..."
          value={audience}
        />
      </label>
    </section>
  )
}
