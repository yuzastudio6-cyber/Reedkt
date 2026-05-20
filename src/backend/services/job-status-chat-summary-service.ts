import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type { JobRetryRuntimePlan } from './job-retry-runtime-service'

export function createJobStatusChatSummary(queueItem: JobRuntimeQueueItem): string {
  return `The ${queueItem.workerKind} job is ${queueItem.queueStatus}. ${queueItem.gateCheck.message}`
}

export function createJobBlockedChatSummary(queueItem: JobRuntimeQueueItem): string {
  const reasons = queueItem.gateCheck.blockReasons.join(', ') || 'unknown'
  return `The ${queueItem.workerKind} job is blocked because ${reasons}.`
}

export function createJobCompletedChatSummary(queueItem: JobRuntimeQueueItem): string {
  return `The mock ${queueItem.workerKind} job completed and is ready for the next QA or preview step.`
}

export function createJobFailedChatSummary(queueItem: JobRuntimeQueueItem): string {
  return `The ${queueItem.workerKind} job failed in mock runtime. Reserved credits should not be spent until recovery succeeds.`
}

export function createJobRetryChatSummary(queueItem: JobRuntimeQueueItem, retryPlan: JobRetryRuntimePlan): string {
  return retryPlan.shouldRetry
    ? `The ${queueItem.workerKind} job will retry in ${retryPlan.retryDelaySeconds} seconds after gates are checked again.`
    : `The ${queueItem.workerKind} job will not retry automatically. ${retryPlan.message}`
}
