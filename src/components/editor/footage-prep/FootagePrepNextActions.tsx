import { FileText, ListChecks, Search, Sparkles } from 'lucide-react'
import { Button } from '../../Button'
import type { EditBriefStatus } from '../../../types'

type FootagePrepNextActionsProps = {
  onContinueWithAiPlan?: () => void
  onAddEditBrief?: () => void
  onAddEditCues?: () => void
  onReviewCleanupDecisions?: () => void
  accepted?: boolean
  editBriefStatus?: EditBriefStatus
  cueCount?: number
}

const actions = [
  {
    description: 'Create the edit plan from the upload, prompt, setup choices, and any optional direction.',
    icon: Sparkles,
    key: 'continue',
    title: 'Create edit plan',
  },
  {
    description: 'Optional structured direction: goal, platform, style, pacing, captions, music, and source rules.',
    icon: FileText,
    key: 'brief',
    title: 'Add Edit Brief',
  },
  {
    description: 'Place specific instructions on moments, transcript lines, scenes, assets, or global rules.',
    icon: ListChecks,
    key: 'cues',
    title: 'Add Edit Cues',
  },
  {
    description: 'Check what AI removed, kept, tightened, or preserved.',
    icon: Search,
    key: 'review',
    title: 'Review Cleanup Decisions',
  },
] as const

export function FootagePrepNextActions({
  accepted = false,
  cueCount = 0,
  editBriefStatus,
  onAddEditBrief,
  onAddEditCues,
  onContinueWithAiPlan,
  onReviewCleanupDecisions,
}: FootagePrepNextActionsProps) {
  const handlers = {
    brief: onAddEditBrief,
    continue: onContinueWithAiPlan,
    cues: onAddEditCues,
    review: onReviewCleanupDecisions,
  }
  const editBriefStateLabel = editBriefStatus === 'ready' ? 'Edit Brief ready' : 'Optional'
  const canContinue = accepted
  const editCueStateLabel = cueCount > 0 ? `${cueCount} cues added` : 'Optional'

  return (
    <section className="inline-chat-card footage-prep-next-actions">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Ready for creative direction</span>
          <h3>Choose the next step</h3>
        </div>
      </div>

      <p className="inline-helper">
        {accepted
          ? 'Clean assembly accepted. You can continue from the prompt now or add an optional Edit Brief for more control.'
          : 'Accept cleanup before creating the edit plan. The Edit Brief is optional structured direction.'}
      </p>

      <div className="footage-prep-action-grid">
        {actions.map((action) => (
          <article className="footage-prep-action-card" key={action.key}>
            <div>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
              {action.key === 'brief' && <small className="footage-prep-action-status">{editBriefStateLabel}</small>}
              {action.key === 'cues' && <small className="footage-prep-action-status">{editCueStateLabel}</small>}
            </div>
            <Button
              disabled={action.key === 'continue' && !canContinue}
              icon={action.icon}
              onClick={handlers[action.key]}
              variant={action.key === 'continue' ? 'primary' : 'secondary'}
            >
              {action.title}
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
