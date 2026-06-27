import assert from 'node:assert/strict'
import { alertRuleCatalog, productionMetricsCatalog } from '../observability'

const requiredMetrics = new Map([
  ['tool_cost_event_write_count', ['workspaceId', 'toolId', 'billableToUser', 'failureCategory']],
  ['tool_cost_event_replay_count', ['workspaceId', 'toolId']],
  ['tool_cost_persistent_write_failure_count', ['workspaceId', 'reason']],
  ['tool_cost_wallet_settlement_count', ['workspaceId', 'status', 'settlementType']],
  ['tool_cost_wallet_settlement_credit_delta', ['workspaceId', 'status', 'settlementType']],
  ['tool_cost_wallet_settlement_failure_count', ['workspaceId', 'reason']],
  ['tool_cost_rls_readback_failure_count', ['workspaceId', 'tableName']],
  ['beta_platform_billing_qa_run_count', ['workspaceId', 'status']],
  ['beta_platform_billing_qa_missing_evidence_count', ['workspaceId', 'evidenceType']],
  ['stripe_call_attempted_count', ['surface']],
])

const requiredAlerts = new Map([
  ['tool_cost_event_persistent_write_failure', 'tool_cost_persistent_write_failure_count'],
  ['tool_cost_event_replay_spike', 'tool_cost_event_replay_count'],
  ['tool_cost_wallet_settlement_failure', 'tool_cost_wallet_settlement_failure_count'],
  ['tool_cost_rls_readback_failure', 'tool_cost_rls_readback_failure_count'],
  ['beta_platform_billing_qa_failure', 'beta_platform_billing_qa_missing_evidence_count'],
  ['stripe_call_attempted_from_tool_cost_surface', 'stripe_call_attempted_count'],
])

for (const [metricName, requiredLabels] of requiredMetrics) {
  const metric = productionMetricsCatalog.find((item) => item.metricName === metricName)
  assert.ok(metric, `missing beta platform monitoring metric: ${metricName}`)
  for (const label of requiredLabels) {
    assert.ok(metric.labels.includes(label), `${metricName} must include ${label} label`)
  }
}

for (const [alertId, metricName] of requiredAlerts) {
  const alert = alertRuleCatalog.find((item) => item.alertId === alertId)
  assert.ok(alert, `missing beta platform monitoring alert: ${alertId}`)
  assert.equal(alert.metricName, metricName, `${alertId} should watch ${metricName}`)
  assert.equal(alert.templateOnly, true, `${alertId} must remain template-only`)
  assert.equal(alert.doesNotDeploy, true, `${alertId} must not deploy monitoring`)
}

const stripeAlert = alertRuleCatalog.find((item) => item.alertId === 'stripe_call_attempted_from_tool_cost_surface')
assert.equal(stripeAlert?.severity, 'critical', 'Stripe boundary violations should be critical')

const deployedAlerts = alertRuleCatalog.filter((item) => !item.templateOnly || !item.doesNotDeploy)
assert.deepEqual(deployedAlerts, [], 'monitoring catalog smoke must not deploy alerts')

console.log(JSON.stringify({
  ok: true,
  metrics: [...requiredMetrics.keys()],
  alerts: [...requiredAlerts.keys()],
  templateOnly: true,
  deployedMonitoring: false,
}, null, 2))
