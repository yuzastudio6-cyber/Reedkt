import { findForbiddenWorkerPayloadEntries, isForbiddenWorkerPayloadKey, isUrlLikeOrSignedValue } from './production-worker-artifact-policy'
import type {
  ProductionWorkerEventRecord,
  ProductionWorkerEventType,
  ProductionWorkerJobPayload,
} from './production-worker-types'

function nowIso(): string {
  return new Date().toISOString()
}

export function sanitizeWorkerEventPayload(value: unknown): Record<string, unknown> {
  function sanitize(item: unknown): unknown {
    if (Array.isArray(item)) {
      return item.map((child) => sanitize(child))
    }

    if (!item || typeof item !== 'object') {
      if (typeof item === 'string' && isUrlLikeOrSignedValue(item)) {
        return '[REDACTED_URL]'
      }
      return item
    }

    return Object.entries(item as Record<string, unknown>).reduce<Record<string, unknown>>((safe, [key, child]) => {
      if (isForbiddenWorkerPayloadKey(key)) {
        safe.redacted = true
        return safe
      }

      safe[key] = sanitize(child)
      return safe
    }, {})
  }

  const sanitized = sanitize(value)
  return sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)
    ? sanitized as Record<string, unknown>
    : { value: sanitized }
}

export function assertWorkerEventPayloadSanitized(value: unknown): void {
  const findings = findForbiddenWorkerPayloadEntries(value)
  if (findings.length > 0) {
    throw new Error(`Worker event payload is not sanitized: ${findings.join(', ')}`)
  }
}

export function createProductionWorkerEvent(input: {
  eventName: ProductionWorkerEventType
  payload: ProductionWorkerJobPayload
  message: string
  progressPercent?: number
  payloadSummary?: Record<string, unknown>
}): ProductionWorkerEventRecord {
  const payloadSummary = sanitizeWorkerEventPayload({
    jobId: input.payload.jobId,
    workerType: input.payload.workerType,
    executionMode: input.payload.executionMode,
    attempt: input.payload.attempt,
    requestedToolIds: input.payload.requestedToolIds,
    requestedRecipeIds: input.payload.requestedRecipeIds,
    ...(input.payloadSummary ?? {}),
  })

  assertWorkerEventPayloadSanitized(payloadSummary)

  return {
    eventName: input.eventName,
    jobId: input.payload.jobId,
    workerType: input.payload.workerType,
    progressPercent: input.progressPercent,
    message: input.message,
    createdAt: nowIso(),
    payloadSummary,
  }
}
