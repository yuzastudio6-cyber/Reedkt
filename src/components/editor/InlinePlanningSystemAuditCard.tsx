import type { EditPlan, PlanningSystemAuditStatus } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlinePlanningSystemAuditCardProps = {
  plan: EditPlan
}

const statusLabels: Record<PlanningSystemAuditStatus, string> = {
  blocking: 'Blocking',
  connected: 'Connected',
  missing: 'Missing',
  partial: 'Partial',
  warning: 'Warning',
}

function badgeAccent(status: PlanningSystemAuditStatus) {
  if (status === 'blocking') return 'danger'
  if (status === 'warning' || status === 'missing') return 'warning'
  if (status === 'partial') return 'blue'
  return 'success'
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

function layerCounts(layers: NonNullable<EditPlan['planningSystemAuditReport']>['layers']) {
  return layers.reduce<Record<PlanningSystemAuditStatus, number>>(
    (counts, layer) => ({
      ...counts,
      [layer.status]: counts[layer.status] + 1,
    }),
    {
      blocking: 0,
      connected: 0,
      missing: 0,
      partial: 0,
      warning: 0,
    },
  )
}

export function InlinePlanningSystemAuditCard({ plan }: InlinePlanningSystemAuditCardProps) {
  const report = plan.planningSystemAuditReport

  if (!report) {
    return null
  }

  const counts = layerCounts(report.layers)
  const failedRules = report.hardRuleChecks.filter((rule) => !rule.passed)
  const launchStackChecks = report.launchToolStackChecks ?? []
  const failedLaunchStackChecks = launchStackChecks.filter((rule) => !rule.passed)
  const launchStackAligned = launchStackChecks.length > 0 && failedLaunchStackChecks.length === 0

  return (
    <InlinePlanCardShell
      className="planning-system-audit-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className={`planning-audit-status-badge planning-audit-${report.overallStatus}`}>{statusLabels[report.overallStatus]}</span>
          <span className="compact-summary-chip">{counts.connected} connected</span>
          <span className="compact-summary-chip">{counts.partial} partial</span>
          <span className="compact-summary-chip">{failedRules.length} failed rules</span>
          <span className="compact-summary-chip">{failedLaunchStackChecks.length} launch stack issues</span>
        </div>
      )}
      defaultExpanded={report.overallStatus === 'blocking'}
      eyebrow="Planning audit"
      helper="This checks whether ReeditPro's full planning system is connected and whether launch tool stack rules are aligned before backend work begins."
      priority="developer_detail"
      status={report.overallStatus === 'blocking' ? 'blocking' : report.overallStatus === 'connected' ? 'complete' : 'warning'}
      title="Planning system audit"
    >
      <div className="qa-badge-row">
        <Badge accent={badgeAccent(report.overallStatus)}>{statusLabels[report.overallStatus]}</Badge>
        <Badge accent={launchStackAligned ? 'success' : 'warning'}>{launchStackAligned ? 'Launch stack aligned' : 'Launch stack review'}</Badge>
        <Badge accent="success">Core rule passed</Badge>
        <Badge accent="blue">Mock only</Badge>
        <Badge accent="violet">Next phase</Badge>
      </div>

      <p className="inline-helper">{report.summary}</p>

      <div className="planning-audit-summary-grid">
        <span><strong>Connected</strong>{counts.connected}</span>
        <span><strong>Partial</strong>{counts.partial}</span>
        <span><strong>Missing</strong>{counts.missing}</span>
        <span><strong>Warnings</strong>{counts.warning}</span>
        <span><strong>Blocking</strong>{counts.blocking}</span>
      </div>

      <div className="planning-audit-hard-rule-list">
        {report.hardRuleChecks.map((rule) => (
          <article className={`planning-audit-hard-rule-item ${rule.passed ? 'planning-audit-connected' : 'planning-audit-blocking'}`} key={rule.label}>
            <strong>{rule.label}</strong>
            <span>{rule.passed ? 'Passed' : 'Needs attention'}</span>
            <p>{rule.message}</p>
          </article>
        ))}
      </div>

      {launchStackChecks.length > 0 && (
        <details className="compact-card-details">
          <summary>Launch tool stack checks</summary>
          <div className="planning-audit-launch-stack-list">
            {launchStackChecks.map((rule) => (
              <article className={`planning-audit-launch-stack-item ${rule.passed ? 'planning-audit-connected' : 'planning-audit-warning'}`} key={rule.label}>
                <strong>{rule.label}</strong>
                <span>{rule.passed ? 'Aligned' : 'Needs review'}</span>
                <p>{rule.message}</p>
              </article>
            ))}
          </div>
        </details>
      )}

      {report.duplicateOrLegacyWarnings.length > 0 && (
        <div className="planning-audit-warning-list">
          <strong>Duplicate or legacy warnings</strong>
          {report.duplicateOrLegacyWarnings.map((warning) => (
            <span className="planning-audit-missing-connection" key={warning}>{warning}</span>
          ))}
        </div>
      )}

      <details className="compact-card-details">
        <summary>Layer connection details</summary>
        <div className="planning-audit-layer-list">
          {report.layers.map((layer) => (
            <article className={`planning-audit-layer-item planning-audit-${layer.status}`} key={layer.id}>
              <div className="planning-audit-layer-heading">
                <strong>{layer.label}</strong>
                <span className={`planning-audit-status-badge planning-audit-${layer.status}`}>{statusLabels[layer.status]}</span>
              </div>
              <div className="planning-audit-summary-grid">
                <span><strong>Types</strong>{yesNo(layer.hasTypes)}</span>
                <span><strong>Planner</strong>{yesNo(layer.hasPlannerModule)}</span>
                <span><strong>UI card</strong>{yesNo(layer.hasUiCard)}</span>
                <span><strong>EditPlan</strong>{yesNo(layer.includedInEditPlan)}</span>
                <span><strong>Snapshot</strong>{yesNo(layer.includedInApprovedSnapshot)}</span>
                <span><strong>Validation</strong>{yesNo(layer.includedInValidation)}</span>
                <span><strong>Credits</strong>{yesNo(layer.includedInCreditEstimate)}</span>
              </div>
              {layer.notes.length > 0 && <p>{layer.notes.join(' ')}</p>}
              {layer.missingConnections.length > 0 && (
                <div className="planning-audit-warning-list">
                  {layer.missingConnections.map((connection) => (
                    <span className="planning-audit-missing-connection" key={connection}>{connection}</span>
                  ))}
                </div>
              )}
              <small>{formatLabel(layer.id)}</small>
            </article>
          ))}
        </div>
      </details>

      <div className="planning-audit-recommendation-list">
        <strong>Next phase recommendations</strong>
        {report.nextPhaseRecommendations.map((recommendation) => (
          <span key={recommendation}>{recommendation}</span>
        ))}
      </div>

      <div className="planning-audit-warning-list">
        <strong>Limitations</strong>
        {report.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
