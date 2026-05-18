import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan } from '../../types/reeditpro'
import type {
  AgentFailureFallbackDecision,
  AgentFailureScenario,
  AgentFallbackAction,
  AgentQAGateCheck,
} from '../../types/editing-agent-runtime'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineAgentQAFallbackCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function GateCheckCard({ gate }: { gate: AgentQAGateCheck }) {
  return (
    <article className="agent-gate-check-item">
      <div className="compact-summary-row">
        <strong>{gate.label}</strong>
        <span className="agent-gate-status-badge">{label(gate.status)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Gate</strong>{label(gate.gateType)}</span>
        <span><strong>Severity</strong>{gate.severity}</span>
        <span><strong>Work item</strong>{gate.relatedWorkItemId ?? 'none'}</span>
        <span><strong>Asset</strong>{gate.relatedAssetManifestItemId ?? 'none'}</span>
        <span><strong>Layer</strong>{gate.relatedRendererLayerId ?? 'none'}</span>
      </div>
      <p>{gate.message}</p>
      {gate.recommendation && <small>{gate.recommendation}</small>}
    </article>
  )
}

function FailureScenarioCard({ scenario }: { scenario: AgentFailureScenario }) {
  return (
    <article className="agent-failure-scenario-item">
      <div className="compact-summary-row">
        <strong>{label(scenario.category)}</strong>
        <span className="agent-failure-scope-badge">{label(scenario.scope)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Severity</strong>{scenario.severity}</span>
        <span><strong>Blocks work</strong>{scenario.blocksIndependentWork ? 'yes' : 'no'}</span>
        <span><strong>Blocks render</strong>{scenario.blocksFinalRender ? 'yes' : 'no'}</span>
        <span><strong>User review</strong>{scenario.requiresUserReviewByDefault ? 'yes' : 'no'}</span>
      </div>
      <p>{scenario.description}</p>
      <small>{scenario.likelyCauses.slice(0, 2).join(' ')}</small>
    </article>
  )
}

function FallbackActionCard({ action }: { action: AgentFallbackAction }) {
  return (
    <article className="agent-fallback-action-item">
      <div className="compact-summary-row">
        <strong>{action.label}</strong>
        <span className="agent-fallback-action-badge">{label(action.actionType)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Basic</strong>{action.allowedForTiers.basic ? 'yes' : 'no'}</span>
        <span><strong>Pro</strong>{action.allowedForTiers.pro ? 'yes' : 'no'}</span>
        <span><strong>Premium</strong>{action.allowedForTiers.premium ? 'yes' : 'no'}</span>
        <span><strong>Review</strong>{action.requiresUserReview ? 'yes' : 'no'}</span>
        <span><strong>Approval</strong>{action.requiresNewApproval ? 'yes' : 'no'}</span>
        <span><strong>Credits</strong>{label(action.estimatedCreditImpact)}</span>
      </div>
      <p>{action.description}</p>
      <small>Models: {action.allowedProviderModels.join(', ') || 'none'}</small>
      <small>Tools: {action.allowedToolIds.join(', ') || 'none'}</small>
      <small>{action.reason}</small>
    </article>
  )
}

function DecisionCard({ decision }: { decision: AgentFailureFallbackDecision }) {
  return (
    <article className="agent-fallback-decision-item">
      <div className="compact-summary-row">
        <strong>{decision.failureScenarioId}</strong>
        <span className="agent-recovery-state-badge">{label(decision.recoveryState)}</span>
      </div>
      <div className="edit-work-item-meta">
        <span><strong>Continue work</strong>{decision.continueIndependentWork ? 'yes' : 'no'}</span>
        <span><strong>Final blocked</strong>{decision.finalRenderBlocked ? 'yes' : 'no'}</span>
        <span><strong>Work item</strong>{decision.relatedWorkItemId ?? 'none'}</span>
        <span><strong>Asset</strong>{decision.relatedAssetManifestItemId ?? 'none'}</span>
      </div>
      <p>{decision.reason}</p>
      <small>Selected: {decision.selectedFallbackActionIds.join(', ') || 'none'}</small>
      <small>Blocked: {decision.blockedActionIds.slice(0, 6).join(', ') || 'none'}</small>
      {decision.userReviewQuestion && <small>{decision.userReviewQuestion}</small>}
      <small>{decision.creditImpactNote}</small>
    </article>
  )
}

export function InlineAgentQAFallbackCard({ descriptor, plan }: InlineAgentQAFallbackCardProps) {
  const fallbackPlan = plan.agentQAFallbackPlan

  if (!fallbackPlan) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="agent-qa-fallback-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{fallbackPlan.gateChecks.length} gates</span>
          <span className="compact-summary-chip">{fallbackPlan.failureScenarios.length} scenarios</span>
          <span className="compact-summary-chip">{fallbackPlan.decisions.length} decisions</span>
          <span className="compact-summary-chip">final {fallbackPlan.finalRenderBlocked ? 'blocked' : 'clear'}</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Execution safety"
      helper="ReeditPro checks every work item, asset, merge, provider request, and render step through QA gates. If something fails, the agent uses approved fallback paths instead of losing context or stopping unrelated work."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Agent QA + fallback matrix"
    >
      <div className="renderer-badge-row">
        <Badge accent="cyan">QA gate</Badge>
        <Badge accent="blue">Local failure</Badge>
        <Badge accent="warning">Global failure</Badge>
        <Badge accent="success">Continue independent work</Badge>
        <Badge accent="warning">Final render blocked</Badge>
        <Badge accent="violet">User review</Badge>
        <Badge accent="blue">Fallback allowed</Badge>
        <Badge accent="warning">Fallback blocked</Badge>
        <Badge accent="muted">Basic/Pro no Veo</Badge>
        <Badge accent="muted">Mock only</Badge>
      </div>

      <div className="agent-qa-summary-grid">
        <span><strong>Gate checks</strong>{fallbackPlan.gateChecks.length}</span>
        <span><strong>Scenarios</strong>{fallbackPlan.failureScenarios.length}</span>
        <span><strong>Actions</strong>{fallbackPlan.fallbackActions.length}</span>
        <span><strong>Decisions</strong>{fallbackPlan.decisions.length}</span>
        <span><strong>Local failures</strong>{fallbackPlan.localFailureCount}</span>
        <span><strong>Global failures</strong>{fallbackPlan.globalFailureCount}</span>
        <span><strong>User review</strong>{fallbackPlan.userReviewRequiredCount}</span>
        <span><strong>Final render</strong>{fallbackPlan.finalRenderBlocked ? 'blocked' : 'not blocked'}</span>
        <span><strong>Independent work</strong>{fallbackPlan.independentWorkCanContinue ? 'can continue' : 'limited'}</span>
      </div>

      <div className={fallbackPlan.finalRenderBlocked ? 'agent-final-render-blocked-badge' : 'agent-independent-work-badge'}>
        {fallbackPlan.finalRenderBlocked
          ? 'Final render is blocked until required failures are resolved.'
          : 'No required final-render failure is blocking in this mock plan.'}
      </div>

      <div>
        <h4>QA gates</h4>
        <div className="agent-gate-check-list">
          {fallbackPlan.gateChecks.slice(0, 10).map((gate) => (
            <GateCheckCard gate={gate} key={gate.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Failure scenarios</h4>
        <div className="agent-failure-scenario-list">
          {fallbackPlan.failureScenarios.slice(0, 10).map((scenario) => (
            <FailureScenarioCard scenario={scenario} key={scenario.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Fallback actions</h4>
        <div className="agent-fallback-action-list">
          {fallbackPlan.fallbackActions.slice(0, 10).map((action) => (
            <FallbackActionCard action={action} key={action.id} />
          ))}
        </div>
      </div>

      <div>
        <h4>Decisions</h4>
        <div className="agent-fallback-decision-list">
          {fallbackPlan.decisions.slice(0, 10).map((decision) => (
            <DecisionCard decision={decision} key={decision.id} />
          ))}
        </div>
      </div>

      <div className="agent-no-real-execution-note">
        <strong>Limitations</strong>
        {fallbackPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
