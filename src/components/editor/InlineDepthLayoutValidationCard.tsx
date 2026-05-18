import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  DepthAwareLayoutValidationPlanItem,
  DepthLayoutValidationCheck,
  DepthLayoutValidationStatus,
  EditPlan,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineDepthLayoutValidationCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function statusAccent(status: DepthLayoutValidationStatus) {
  if (status === 'blocking' || status === 'failed') return 'danger'
  if (status === 'warning') return 'warning'
  return 'success'
}

function statusClass(status: DepthLayoutValidationStatus) {
  return `depth-validation-status-badge depth-validation-check-${status}`
}

function groupedChecks(checks: DepthLayoutValidationCheck[]) {
  const order: DepthLayoutValidationStatus[] = ['blocking', 'failed', 'warning', 'passed']

  return order
    .map((status) => ({
      status,
      checks: checks.filter((check) => check.status === status),
    }))
    .filter((group) => group.checks.length > 0)
}

function CheckList({ checks }: { checks: DepthLayoutValidationCheck[] }) {
  return (
    <div className="depth-validation-check-list">
      {groupedChecks(checks).map((group) => (
        <details key={group.status} open={group.status !== 'passed'}>
          <summary>{label(group.status)} checks ({group.checks.length})</summary>
          <div>
            {group.checks.map((check) => (
              <article className={`depth-validation-check-item depth-validation-check-${check.status}`} key={check.id}>
                <strong>{check.label}</strong>
                <span>{check.message}</span>
                {check.recommendation && <em>{check.recommendation}</em>}
              </article>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

function ValidationItem({ item }: { item: DepthAwareLayoutValidationPlanItem }) {
  return (
    <article className="depth-validation-item">
      <div className="visual-asset-header">
        <div>
          <span className="section-eyebrow">{label(item.complexity)}</span>
          <h4>{label(item.depthCompositingMode)} validation</h4>
          <p>{item.userFacingSummary}</p>
        </div>
        <div className="visual-asset-badges">
          <span className={statusClass(item.status)}>{label(item.status)}</span>
          <span className="depth-credit-profile-badge">{item.creditProfileId}</span>
          <span className="depth-credit-impact-badge">{label(item.creditImpact)}</span>
        </div>
      </div>

      <div className="depth-validation-meta">
        <span><strong>Layout</strong>{label(item.layoutMode)}</span>
        <span><strong>Depth mode</strong>{label(item.depthCompositingMode)}</span>
        <span><strong>Mask</strong>{label(item.maskStrategy)}</span>
        <span><strong>Risk</strong>{label(item.maskRisk)}</span>
        <span><strong>Tracking</strong>{label(item.trackingRequirement)}</span>
        <span><strong>Credits</strong>{item.estimatedPlanningCredits}</span>
      </div>

      <CheckList checks={item.checks} />

      {item.fallbackRecommendations.length > 0 && (
        <div className="depth-fallback-recommendation">
          <strong>Fallback recommendations</strong>
          {item.fallbackRecommendations.map((fallback) => (
            <span key={fallback.id}>
              {label(fallback.fromLayoutMode)}{' -> '}{label(fallback.toLayoutMode)}. {fallback.tradeoff}
            </span>
          ))}
        </div>
      )}

      {item.developerNotes.length > 0 && (
        <details className="depth-validation-limitation-note">
          <summary>Developer notes</summary>
          {item.developerNotes.map((note) => <span key={note}>{note}</span>)}
        </details>
      )}
    </article>
  )
}

export function InlineDepthLayoutValidationCard({ descriptor, plan }: InlineDepthLayoutValidationCardProps) {
  const validationPlan = plan.depthAwareLayoutValidationPlan

  if (!validationPlan?.active && descriptor?.status !== 'warning' && descriptor?.status !== 'blocking') {
    return null
  }

  if (!validationPlan) {
    return null
  }

  const majorChecks = validationPlan.globalChecks
    .filter((check) => check.status !== 'passed' || check.severity === 'blocking' || check.severity === 'high')
    .sort((left, right) => {
      const rank = { blocking: 0, failed: 1, warning: 2, passed: 3 }
      return rank[left.status] - rank[right.status]
    })

  return (
    <InlinePlanCardShell
      className="depth-layout-validation-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{validationPlan.active ? 'active' : 'inactive'}</span>
          <span className="compact-summary-chip">{label(validationPlan.overallStatus)}</span>
          <span className="compact-summary-chip">{validationPlan.totalEstimatedDepthPlanningCredits} depth credits</span>
          <span className="compact-summary-chip">{validationPlan.fallbackRecommendations.length} fallback</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? validationPlan.overallStatus !== 'passed'}
      eyebrow="Depth layout validation"
      helper="Depth-aware overlays can make edits feel premium, but they need fallback, safe zones, and QA. This validator checks the structured plan only; no real masks or pixels are processed in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Depth layout validation"
    >
      <div className="qa-badge-row">
        <Badge accent={statusAccent(validationPlan.overallStatus)}>{label(validationPlan.overallStatus)}</Badge>
        <Badge accent="cyan">Captions above all</Badge>
        <Badge accent="blue">Contact object validated</Badge>
        <Badge accent="warning">Credit impact</Badge>
        <Badge accent="violet">No real mask processing</Badge>
      </div>

      <div className="depth-validation-summary-grid">
        <span><strong>Active</strong>{validationPlan.active ? 'Yes' : 'No'}</span>
        <span><strong>Status</strong>{label(validationPlan.overallStatus)}</span>
        <span><strong>Items</strong>{validationPlan.items.length}</span>
        <span><strong>Credits</strong>{validationPlan.totalEstimatedDepthPlanningCredits}</span>
        <span><strong>Profiles</strong>{validationPlan.creditProfilesUsed.join(', ') || 'None'}</span>
        <span><strong>Fallbacks</strong>{validationPlan.fallbackRecommendations.length}</span>
        <span><strong>Tradeoffs</strong>{validationPlan.lowerCostAlternatives.length}</span>
        <span><strong>Limitations</strong>{validationPlan.limitations.length}</span>
      </div>

      <p className="inline-helper">{validationPlan.summary}</p>

      {majorChecks.length > 0 && (
        <section>
          <h4>Global checks</h4>
          <CheckList checks={majorChecks} />
        </section>
      )}

      <div className="layout-mode-list">
        {validationPlan.items.map((item) => (
          <ValidationItem item={item} key={item.id} />
        ))}
      </div>

      {validationPlan.lowerCostAlternatives.length > 0 && (
        <div className="depth-lower-cost-list">
          <strong>Lower-cost alternatives</strong>
          {validationPlan.lowerCostAlternatives.map((alternative) => (
            <span className="depth-lower-cost-item" key={`${alternative.label}-${alternative.estimatedSavings}`}>
              <b>{alternative.label}</b>
              Save about {alternative.estimatedSavings} credit{alternative.estimatedSavings === 1 ? '' : 's'}. {alternative.tradeoff}
            </span>
          ))}
        </div>
      )}

      <div className="depth-validation-limitation-note">
        <strong>Limitations</strong>
        {validationPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
