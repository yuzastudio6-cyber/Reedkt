import { sanitizeLogPayload } from '../observability'
import type { AuditEventType, ProductionAuditEvent } from './privacy-retention-types'

export const auditLogEventTypes: AuditEventType[] = [
  'approved_snapshot_created',
  'worker_job_created',
  'worker_job_executed',
  'tool_run_recorded',
  'artifact_created',
  'qa_gate_failed',
  'final_export_created',
  'signed_url_generated',
  'deletion_requested',
  'model_weight_approved',
  'license_reviewed',
  'cost_limit_hit',
  'kill_switch_toggled',
]

export function buildSanitizedAuditEvent(event: ProductionAuditEvent): ProductionAuditEvent {
  const { sanitized, findings } = sanitizeLogPayload(event.sanitizedSummary)
  if (findings.length > 0) {
    throw new Error(`Audit event contains forbidden sensitive fields: ${findings.map((finding) => finding.path).join(', ')}`)
  }
  return {
    ...event,
    sanitizedSummary: sanitized as Record<string, unknown>,
  }
}
