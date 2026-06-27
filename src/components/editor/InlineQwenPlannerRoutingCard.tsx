import { Badge } from '../Badge'
import { getQwenVlPlannerRoutingUiData } from '../../lib/qwen-vl-planner-routing-ui'
import type { ChatPlanningCardDescriptor } from '../../types/reeditpro'
import type {
  QwenVlPlannerRoutingUiHandoff,
  QwenVlPlannerRoutingUiStatus,
} from '../../lib/qwen-vl-planner-routing-ui'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineQwenPlannerRoutingCardProps = {
  descriptor?: ChatPlanningCardDescriptor
}

const statusLabels: Record<QwenVlPlannerRoutingUiStatus, string> = {
  advisory_metadata: 'Advisory',
  blocked_policy: 'Blocked',
  primary_metadata: 'Primary',
}

function label(value: string | null) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function statusAccent(status: QwenVlPlannerRoutingUiStatus) {
  if (status === 'blocked_policy') {
    return 'warning'
  }

  if (status === 'primary_metadata') {
    return 'cyan'
  }

  return 'blue'
}

function HandoffItem({ handoff }: { handoff: QwenVlPlannerRoutingUiHandoff }) {
  return (
    <article className="tool-chain-item">
      <div>
        <span className="section-eyebrow">{handoff.source}</span>
        <h4>{handoff.label}</h4>
        <p>{handoff.reason}</p>
      </div>
      <div className="understanding-chip-row">
        <Badge accent={statusAccent(handoff.status)}>{statusLabels[handoff.status]}</Badge>
        <span className="tool-status-badge">Runtime: {label(handoff.runtimeUseCase)}</span>
      </div>
      <div className="tool-chain-meta">
        <span><strong>Prereqs</strong>{handoff.deterministicPrerequisites.join(', ')}</span>
        <span><strong>Must not replace</strong>{handoff.mustNotReplace.join(', ')}</span>
      </div>
    </article>
  )
}

export function InlineQwenPlannerRoutingCard({ descriptor }: InlineQwenPlannerRoutingCardProps) {
  const data = getQwenVlPlannerRoutingUiData()
  const primary = data.handoffs.filter((handoff) => handoff.status === 'primary_metadata')
  const advisory = data.handoffs.filter((handoff) => handoff.status === 'advisory_metadata')
  const blocked = data.handoffs.filter((handoff) => handoff.status === 'blocked_policy')

  return (
    <InlinePlanCardShell
      className="tool-strategy-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{data.summary.totalPlannerTasks} tasks</span>
          <span className="compact-summary-chip">{data.summary.primaryMetadataRoutes} primary</span>
          <span className="compact-summary-chip">{data.summary.advisoryMetadataRoutes} advisory</span>
          <span className="compact-summary-chip">{data.summary.blockedRoutes} blocked</span>
          <span className="compact-summary-chip">no inference</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Visual analysis routing"
      helper="Qwen2.5-VL is surfaced as planner metadata for visual understanding and visual QA only. No model call, worker dispatch, Cloud Run invocation, generated asset, or render/export starts here."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title={data.title}
    >
      <div className="tool-strategy-summary-grid">
        <span><strong>{data.summary.totalPlannerTasks}</strong>planner tasks</span>
        <span><strong>{data.summary.primaryMetadataRoutes}</strong>primary VLM routes</span>
        <span><strong>{data.summary.advisoryMetadataRoutes}</strong>advisory routes</span>
        <span><strong>{data.summary.blockedRoutes}</strong>blocked routes</span>
      </div>

      <div className="understanding-chip-row">
        <span className="tool-planning-only-note">No Cloud Run invocation</span>
        <span className="tool-planning-only-note">No inference</span>
        <span className="tool-planning-only-note">No worker dispatch</span>
        <span className="tool-planning-only-note">No generated assets</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Primary Qwen routes</summary>
        <div className="tool-chain-list">
          {primary.map((handoff) => <HandoffItem handoff={handoff} key={handoff.id} />)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Advisory Qwen routes</summary>
        <div className="tool-chain-list">
          {advisory.map((handoff) => <HandoffItem handoff={handoff} key={handoff.id} />)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Blocked Qwen routes</summary>
        <div className="tool-chain-list">
          {blocked.map((handoff) => <HandoffItem handoff={handoff} key={handoff.id} />)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Runtime gates and ownership</summary>
        <div className="layout-mode-meta">
          {Object.entries(data.executionGates).map(([gate, value]) => (
            <span key={gate}><strong>{label(gate)}</strong>{String(value)}</span>
          ))}
          {data.ownerBoundaries.map((boundary) => (
            <span key={boundary}><strong>Boundary</strong>{boundary}</span>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
