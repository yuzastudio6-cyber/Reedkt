import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import { nowIso } from '../mock/mock-database'

export interface JobRetryRuntimePlan {
  shouldRetry: boolean
  retryDelaySeconds: number
  nextAttempt: number
  maxAttempts: number
  message: string
  warnings: string[]
  mockOnly: boolean
}

export function shouldRetryJobMock(queueItem: JobRuntimeQueueItem, attemptCount = 0, maxAttempts = 3): boolean {
  return queueItem.queueStatus === 'failed' && attemptCount < maxAttempts
}

export function scheduleJobRetryMock(
  queueItem: JobRuntimeQueueItem,
  attemptCount = 0,
  maxAttempts = 3,
): JobRetryRuntimePlan {
  const shouldRetry = shouldRetryJobMock(queueItem, attemptCount, maxAttempts)

  if (!shouldRetry) {
    return markRetryLimitReachedMock(queueItem, attemptCount, maxAttempts)
  }

  queueItem.queueStatus = 'retry_scheduled'
  queueItem.updatedAt = nowIso()

  return {
    shouldRetry: true,
    retryDelaySeconds: calculateRetryDelayMock(attemptCount + 1),
    nextAttempt: attemptCount + 1,
    maxAttempts,
    message: `Mock retry scheduled for attempt ${attemptCount + 1} of ${maxAttempts}.`,
    warnings: ['Retry is mock-only; future workers must re-run gates before retrying unsafe work.'],
    mockOnly: true,
  }
}

export function calculateRetryDelayMock(attempt: number): number {
  return Math.min(900, 30 * 2 ** Math.max(0, attempt - 1))
}

export function markRetryLimitReachedMock(
  queueItem: JobRuntimeQueueItem,
  attemptCount = 3,
  maxAttempts = 3,
): JobRetryRuntimePlan {
  queueItem.queueStatus = 'failed'
  queueItem.updatedAt = nowIso()

  return {
    shouldRetry: false,
    retryDelaySeconds: 0,
    nextAttempt: attemptCount,
    maxAttempts,
    message: `Retry limit reached after ${attemptCount} attempt(s).`,
    warnings: ['Credit reservation should be released or refunded by the backend credit runtime.'],
    mockOnly: true,
  }
}

export function createJobFailureRecoveryPlan(
  queueItem: JobRuntimeQueueItem,
  attemptCount = 0,
  maxAttempts = 3,
): JobRetryRuntimePlan {
  return scheduleJobRetryMock(queueItem, attemptCount, maxAttempts)
}

export function createJobRetrySummary(plan: JobRetryRuntimePlan): string {
  return plan.message
}
