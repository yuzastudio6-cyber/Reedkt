import { Badge } from '../Badge'
import { buildChatToolActivityCards, type ChatToolActivityCardStatus } from '../../lib/chat-tool-activity-ux'
import type { ChatPlanningCardDescriptor, ChatPlanningDisplayMode, EditPlan } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolCallIntentCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
  approved?: boolean
  displayMode?: ChatPlanningDisplayMode
  previewReady?: boolean
  progressStarted?: boolean
}

const statusLabels: Record<ChatToolActivityCardStatus, string> = {
  blocked: 'Blocked',
  complete: 'Complete',
  needs_approval: 'Needs approval',
  ready: 'Ready',
  running: 'Running',
  waiting: 'Waiting',
  warning: 'Needs review',
}

function statusAccent(status: ChatToolActivityCardStatus) {
  if (status === 'blocked') return 'danger'
  if (status === 'needs_approval' || status === 'warning') return 'warning'
  if (status === 'running') return 'cyan'
  if (status === 'complete' || status === 'ready') return 'success'
  return 'muted'
}

export function InlineToolCallIntentCard({
  approved = false,
  descriptor,
  displayMode = 'guided',
  plan,
  previewReady = false,
  progressStarted = false,
}: InlineToolCallIntentCardProps) {
  const toolCallIntentPlan = plan.toolCallIntentPlan

  if (!toolCallIntentPlan) {
    return null
  }

  const activityCards = buildChatToolActivityCards({
    approved,
    displayMode,
    plan,
    previewReady,
    progressStarted,
  })
  const planCard = activityCards.find((card) => card.kind === 'tool_plan')
  const readinessCard = activityCards.find((card) => card.kind === 'tool_readiness')
  const approvalCard = activityCards.find((card) => card.kind === 'approval_cost')
  const blockerCard = activityCards.find((card) => card.kind === 'blocker_next_action')

  return (
    <InlinePlanCardShell
      className="tool-call-intent-card edit-activity-overview-card"
      compactSummary={(
        <div className="compact-summary-row">
          {planCard?.chips.map((chip) => (
            <span className="compact-summary-chip" key={`plan-${chip}`}>{chip}</span>
          ))}
          {readinessCard?.chips.slice(0, 1).map((chip) => (
            <span className="compact-summary-chip" key={`ready-${chip}`}>{chip}</span>
          ))}
          {approvalCard?.chips.slice(1, 3).map((chip) => (
            <span className="compact-summary-chip" key={`cost-${chip}`}>{chip}</span>
          ))}
          {blockerCard && <span className="compact-summary-chip">{blockerCard.chips[0]}</span>}
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? true}
      eyebrow="Edit activity visibility"
      helper="This summarizes the behind-the-scenes edit work in plain language. Exact execution names stay out of guided chat and are available only in developer review."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="What will happen in the edit"
    >
      <div className="edit-activity-card-grid">
        {activityCards.map((card) => (
          <article className={`edit-activity-card edit-activity-card-${card.kind}`} key={card.kind}>
            <div className="edit-activity-card-heading">
              <div>
                <span className="section-eyebrow">{card.eyebrow}</span>
                <h4>{card.title}</h4>
              </div>
              <Badge accent={statusAccent(card.status)}>{statusLabels[card.status]}</Badge>
            </div>

            <p>{card.summary}</p>

            {card.chips.length > 0 && (
              <div className="understanding-chip-row">
                {card.chips.map((chip) => (
                  <span className="tool-planning-only-note" key={`${card.kind}-${chip}`}>{chip}</span>
                ))}
              </div>
            )}

            <div className="edit-activity-item-list">
              {card.items.slice(0, 5).map((item) => (
                <div className="edit-activity-item" key={`${card.kind}-${item.label}`}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                  {item.status && (
                    <em>{statusLabels[item.status]}</em>
                  )}
                </div>
              ))}
            </div>

            {card.nextAction && (
              <p className="edit-activity-next-action"><strong>Next action</strong>{card.nextAction}</p>
            )}

            {card.developerDetails?.map((details) => (
              <details className="edit-activity-developer-details" key={`${card.kind}-${details.label}`}>
                <summary>{details.label}</summary>
                <div className="understanding-chip-row">
                  {details.values.map((value) => (
                    <span className="tool-fallback-badge" key={`${card.kind}-${details.label}-${value}`}>{value}</span>
                  ))}
                </div>
              </details>
            ))}
          </article>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
