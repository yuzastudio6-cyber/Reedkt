import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type {
  CleanupPlan,
  CleanupPlanItem,
  CleanupReviewItemState,
  WorkflowTimeRange,
} from '../../../types'

type CleanupDecisionListProps = {
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  itemStates?: CleanupReviewItemState[]
  onAcceptItem?: (cleanupPlanItemId: string) => void
  onRestoreItem?: (cleanupPlanItemId: string) => void
  onMarkImportant?: (cleanupPlanItemId: string) => void
  onMarkDoNotUse?: (cleanupPlanItemId: string) => void
  onResetItem?: (cleanupPlanItemId: string) => void
}

const actionLabels: Record<CleanupPlanItem['action'], string> = {
  keep: 'Keep',
  keep_best_take: 'Keep best take',
  mark_do_not_use: 'Do not use',
  mark_important: 'Important',
  preserve: 'Preserve',
  remove: 'Remove',
  review: 'Review',
  tighten: 'Tighten',
}

function formatTime(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeRange(range: WorkflowTimeRange) {
  return `${formatTime(range.startMs)}-${formatTime(range.endMs)}`
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatPercent(value?: number) {
  if (typeof value !== 'number') return 'Confidence not set'

  return `${Math.round(value * 100)}% confidence`
}

function actionAccent(action: CleanupPlanItem['action']) {
  if (action === 'remove' || action === 'mark_do_not_use') return 'danger'
  if (action === 'tighten' || action === 'review') return 'warning'
  if (action === 'keep' || action === 'keep_best_take' || action === 'preserve') return 'success'
  return 'cyan'
}

function decisionForItem(item: CleanupPlanItem, itemStates?: CleanupReviewItemState[]) {
  return itemStates?.find((state) => state.cleanupPlanItemId === item.id)?.decision ?? item.userDecision ?? 'accepted'
}

function decisionAccent(decision: string) {
  if (decision === 'restored' || decision === 'marked_important') return 'success'
  if (decision === 'marked_do_not_use') return 'danger'
  if (decision === 'needs_review') return 'warning'
  return 'cyan'
}

export function CleanupDecisionList({
  cleanupPlan,
  cleanupPlanItems,
  itemStates,
  onAcceptItem,
  onMarkDoNotUse,
  onMarkImportant,
  onResetItem,
  onRestoreItem,
}: CleanupDecisionListProps) {
  return (
    <section className="inline-chat-card footage-prep-cleanup-decisions">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cleanup Decisions</span>
          <h3>What AI removed, kept, tightened, or preserved</h3>
        </div>
        <Badge accent="cyan">{cleanupPlanItems.length} decisions</Badge>
      </div>

      <p className="inline-helper">
        These decisions are local and non-destructive. Database-backed review persistence will be added in a later milestone.
      </p>

      <div className="footage-prep-decision-list">
        {cleanupPlanItems.map((item) => {
          const decision = decisionForItem(item, itemStates)

          return (
            <article className="footage-prep-decision-item" key={item.id}>
              <div className="footage-prep-decision-header">
                <div>
                  <strong>{item.label ?? actionLabels[item.action]}</strong>
                  <span>{formatTimeRange(item.sourceRange)} / {formatLabel(item.reason)}</span>
                </div>
                <Badge accent={actionAccent(item.action)}>{actionLabels[item.action]}</Badge>
              </div>
              <p>{item.explanation}</p>
              <div className="compact-summary-row">
                <span className="compact-summary-chip">{formatPercent(item.confidence)}</span>
                <Badge accent={decisionAccent(decision)}>{formatLabel(decision)}</Badge>
                {item.action === 'remove' && <span className="compact-summary-chip">Restore available</span>}
                {item.action === 'review' && <span className="compact-summary-chip">Needs review</span>}
              </div>
              <div className="footage-prep-decision-actions" aria-label={`Review actions for ${item.label ?? actionLabels[item.action]}`}>
                <Button onClick={() => onAcceptItem?.(item.id)} size="sm" variant="secondary">
                  Keep
                </Button>
                <Button onClick={() => onRestoreItem?.(item.id)} size="sm" variant="secondary">
                  Restore
                </Button>
                <Button onClick={() => onMarkImportant?.(item.id)} size="sm" variant="secondary">
                  Important
                </Button>
                <Button onClick={() => onMarkDoNotUse?.(item.id)} size="sm" variant="danger">
                  Do not use
                </Button>
                <Button onClick={() => onResetItem?.(item.id)} size="sm" variant="ghost">
                  Reset
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="footage-prep-summary-note">
        <strong>Plan summary</strong>
        <span>{cleanupPlan.summary}</span>
      </div>
    </section>
  )
}
