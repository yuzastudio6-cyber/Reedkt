import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan } from '../../types/reeditpro'
import type { ToolCallIntentReadinessState } from '../../types/tool-call-intents'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolCallIntentCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const readinessLabels: Record<ToolCallIntentReadinessState, string> = {
  blocked_by_owner_approval: 'Owner gated',
  blocked_by_provider_lane: 'Provider gated',
  blocked_by_storage_billing: 'Storage/billing gated',
  dry_run_only: 'Dry-run only',
  ready_for_backend_execution: 'Backend candidate',
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function readinessAccent(readinessState: ToolCallIntentReadinessState) {
  if (readinessState === 'ready_for_backend_execution') return 'success'
  if (readinessState === 'dry_run_only') return 'warning'
  return 'muted'
}

export function InlineToolCallIntentCard({ descriptor, plan }: InlineToolCallIntentCardProps) {
  const toolCallIntentPlan = plan.toolCallIntentPlan

  if (!toolCallIntentPlan) {
    return null
  }

  const creditGateSummary = toolCallIntentPlan.creditGateSummary
  const visibleIntents = toolCallIntentPlan.intents.slice(0, 7)
  const hiddenCount = Math.max(0, toolCallIntentPlan.intents.length - visibleIntents.length)
  const gatedCount =
    toolCallIntentPlan.readinessCounts.blocked_by_owner_approval +
    toolCallIntentPlan.readinessCounts.blocked_by_provider_lane +
    toolCallIntentPlan.readinessCounts.blocked_by_storage_billing

  return (
    <InlinePlanCardShell
      className="tool-call-intent-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{toolCallIntentPlan.intents.length} planned calls</span>
          <span className="compact-summary-chip">{toolCallIntentPlan.readinessCounts.ready_for_backend_execution} backend candidates</span>
          <span className="compact-summary-chip">{toolCallIntentPlan.readinessCounts.dry_run_only} dry-run</span>
          <span className="compact-summary-chip">{gatedCount} gated</span>
          <span className="compact-summary-chip">{creditGateSummary.totalExpectedCredits} expected credits</span>
          <span className="compact-summary-chip">{creditGateSummary.totalHighCredits} high credits</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? true}
      eyebrow="Tool-call intent"
      helper="These are the backend tool calls the edit plan expects after approval. They show dependencies, outputs, cost impact, readiness, and fallback before any tool runs."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Planned tool calls"
    >
      <p className="advanced-detail-note">{toolCallIntentPlan.summary}</p>
      <p className="advanced-detail-note">{creditGateSummary.userFacingSummary}</p>

      <div className="tool-chain-list">
        {visibleIntents.map((intent) => {
          const expectedCredits = intent.costEstimate.expectedCredits ?? intent.costEstimate.credits
          const highCredits = intent.costEstimate.highCredits ?? expectedCredits

          return (
            <article className="tool-chain-item" key={intent.id}>
              <div>
                <span className="section-eyebrow">{intent.capabilityLabel} / {label(intent.lane)}</span>
                <h4>{intent.toolLabel}</h4>
                <p>{intent.reason}</p>
              </div>

              <div className="understanding-chip-row">
                <Badge accent={readinessAccent(intent.readinessState)}>{readinessLabels[intent.readinessState]}</Badge>
                <span className="tool-primary-badge">{expectedCredits} expected / {highCredits} high credits</span>
                <span className="tool-planning-only-note">{label(intent.creditGate.status)}</span>
                <span className="tool-planning-only-note">approval first</span>
                <span className="tool-planning-only-note">backend only</span>
              </div>

              <div className="tool-chain-meta">
                <span><strong>Input</strong>{intent.inputArtifactDependency.description}</span>
                <span><strong>Output</strong>{intent.expectedOutputArtifact.description}</span>
                <span><strong>Cost basis</strong>{intent.costEstimate.basis}</span>
                <span><strong>Fallback</strong>{intent.fallback.strategy}</span>
              </div>

              <p>{intent.readinessExplanation}</p>

              {intent.fallback.fallbackToolIds.length > 0 && (
                <div className="understanding-chip-row">
                  {intent.fallback.fallbackToolIds.map((toolId) => (
                    <span className="tool-fallback-badge" key={`${intent.id}-${toolId}`}>Fallback: {label(toolId)}</span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {hiddenCount > 0 && <p className="advanced-detail-note">{hiddenCount} more planned tool-call intent{hiddenCount === 1 ? '' : 's'} are available in detailed/developer review.</p>}

      <div className="understanding-chip-row">
        {toolCallIntentPlan.notes.map((note) => (
          <span className="tool-planning-only-note" key={note}>{note}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
