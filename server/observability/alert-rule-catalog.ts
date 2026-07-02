import type { AlertRuleTemplate } from './observability-types'

export const alertRuleCatalog: AlertRuleTemplate[] = [
  alert('high_worker_failure_rate', 'High worker failure rate.', 'worker_job_failure_count', 'error'),
  alert('stale_worker_leases', 'Worker leases are stale.', 'worker_blocked_count', 'warning'),
  alert('runaway_retries', 'Retry volume exceeds policy.', 'worker_retry_count', 'error'),
  alert('gpu_cost_spike', 'Estimated GPU cost spike.', 'estimated_gpu_cost', 'critical'),
  alert('render_export_failure_spike', 'Render/export failures increased.', 'worker_job_failure_count', 'error'),
  alert('readiness_blocker_regression', 'Readiness blockers increased.', 'readiness_blocker_count', 'error'),
  alert('secret_signed_url_safety_violation', 'Secret or signed URL safety violation.', 'secret_safety_violation_count', 'critical'),
  alert('final_delivery_qa_failures', 'Final delivery QA failures.', 'qa_gate_failure_count', 'critical'),
  alert('storage_growth_spike', 'Private artifact storage growth spike.', 'artifact_storage_bytes', 'warning'),
  alert('provider_call_attempted_when_blocked', 'Provider call attempted while blocked.', 'worker_job_failure_count', 'critical'),
  alert('tool_cost_event_persistent_write_failure', 'Tool cost event persistent writes failed.', 'tool_cost_persistent_write_failure_count', 'error'),
  alert('tool_cost_event_replay_spike', 'Tool cost event idempotent replay volume increased.', 'tool_cost_event_replay_count', 'warning'),
  alert('tool_cost_wallet_settlement_failure', 'Tool cost wallet settlement failed.', 'tool_cost_wallet_settlement_failure_count', 'error'),
  alert('tool_cost_rls_readback_failure', 'Tool cost billing RLS/member readback failed.', 'tool_cost_rls_readback_failure_count', 'error'),
  alert('beta_platform_billing_qa_failure', 'Beta platform billing QA reported missing evidence or failure.', 'beta_platform_billing_qa_missing_evidence_count', 'error'),
  alert('stripe_call_attempted_from_tool_cost_surface', 'Stripe call attempted from a tool-cost or billing-QA surface.', 'stripe_call_attempted_count', 'critical'),
]

function alert(alertId: string, description: string, metricName: string, severity: AlertRuleTemplate['severity']): AlertRuleTemplate {
  return { alertId, description, metricName, severity, templateOnly: true, doesNotDeploy: true }
}
