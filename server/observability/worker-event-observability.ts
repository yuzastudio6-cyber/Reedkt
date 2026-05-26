import { sanitizeLogPayload } from './sanitized-log-policy'
import type { ProductionWorkerEventRecord } from '../workers/production'

export function buildObservableWorkerEvent(event: ProductionWorkerEventRecord): ProductionWorkerEventRecord {
  const sanitized = sanitizeLogPayload(event).sanitized
  return sanitized
}
