import type { ProductionWorkerFailureCategory, ProductionWorkerRuntimeType } from './production-worker-types'

const nonRetryableFailures = new Set<ProductionWorkerFailureCategory>([
  'policy_blocked',
  'license_blocked',
  'model_weight_blocked',
  'credit_blocked',
  'invalid_payload',
])

export function classifyWorkerFailure(error: unknown): ProductionWorkerFailureCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (message.includes('raw prompt') || message.includes('signed url') || message.includes('secret') || message.includes('payload')) {
    return 'invalid_payload'
  }
  if (message.includes('license')) return 'license_blocked'
  if (message.includes('model') || message.includes('checkpoint') || message.includes('weight')) return 'model_weight_blocked'
  if (message.includes('credit')) return 'credit_blocked'
  if (message.includes('policy') || message.includes('revideo') || message.includes('evaluation-only')) return 'policy_blocked'
  if (message.includes('artifact')) return 'missing_artifact'
  if (message.includes('qa')) return 'qa_failed'
  if (message.includes('tool unavailable')) return 'tool_unavailable'
  if (message.includes('timeout') || message.includes('transient')) return 'transient_runtime'

  return 'unknown'
}

export function maxAttemptsByWorkerType(workerType: ProductionWorkerRuntimeType): number {
  if (workerType === 'tool_readiness_worker') return 1
  if (workerType === 'gpu_ai_worker' || workerType === 'render_worker') return 2
  return 3
}

export function shouldRetryWorkerJob(input: {
  failureCategory: ProductionWorkerFailureCategory
  attempt: number
  maxAttempts: number
}): boolean {
  if (nonRetryableFailures.has(input.failureCategory)) return false
  if (input.attempt >= input.maxAttempts) return false
  return input.failureCategory === 'transient_runtime' ||
    input.failureCategory === 'tool_unavailable' ||
    input.failureCategory === 'missing_artifact'
}

export function nextRetryDelayMs(input: {
  failureCategory: ProductionWorkerFailureCategory
  attempt: number
}): number {
  if (!shouldRetryWorkerJob({ failureCategory: input.failureCategory, attempt: input.attempt, maxAttempts: input.attempt + 1 })) {
    return 0
  }

  return Math.min(60_000, 5_000 * 2 ** Math.max(0, input.attempt - 1))
}
