import type { JobRuntimeQueueItem, JobWorkerKind } from '../../types/job-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, nowIso } from '../mock/mock-database'
import { checkJobRuntimeGates, type JobRuntimeGateCheckInput } from './job-gate-service'

export interface QueueMockJobInput extends JobRuntimeGateCheckInput {
  jobId?: string
  jobBatchId?: string
  workerKind: JobWorkerKind
  dependsOnJobIds?: string[]
  blocksJobIds?: string[]
  payload?: Record<string, unknown>
}

export function createMockJobQueueItem(
  db: MockDatabase,
  input: QueueMockJobInput,
): JobRuntimeQueueItem {
  const gateCheck = checkJobRuntimeGates(db, input)
  const jobId = input.jobId ?? createMockId('job-runtime-job')

  return {
    id: createMockId('job-runtime-queue-item'),
    workspaceId: input.workspaceId ?? 'mock-workspace-missing',
    projectId: input.projectId ?? 'mock-project-missing',
    editPlanId: input.editPlanId,
    jobBatchId: input.jobBatchId,
    jobId,
    workerKind: input.workerKind,
    queueStatus: gateCheck.ok ? 'draft' : 'blocked',
    dependsOnJobIds: input.dependsOnJobIds ?? [],
    blocksJobIds: input.blocksJobIds ?? [],
    gateCheck,
    payload: {
      mockOnly: true,
      ...(input.payload ?? {}),
    },
    createdAt: nowIso(),
    mockOnly: true,
  }
}

export function queueMockJob(db: MockDatabase, input: QueueMockJobInput): JobRuntimeQueueItem {
  const queueItem = createMockJobQueueItem(db, input)
  if (queueItem.gateCheck.ok) {
    queueItem.queueStatus = 'queued'
    queueItem.updatedAt = nowIso()
  }
  return queueItem
}

export function queueMockJobBatch(db: MockDatabase, inputs: QueueMockJobInput[]): JobRuntimeQueueItem[] {
  const jobBatchId = createMockId('job-runtime-batch')
  return inputs.map((input) => queueMockJob(db, { ...input, jobBatchId: input.jobBatchId ?? jobBatchId }))
}

export function markJobRunningMock(queueItem: JobRuntimeQueueItem): JobRuntimeQueueItem {
  return updateQueueStatus(queueItem, 'running')
}

export function markJobCompletedMock(queueItem: JobRuntimeQueueItem): JobRuntimeQueueItem {
  return updateQueueStatus(queueItem, 'completed')
}

export function markJobFailedMock(queueItem: JobRuntimeQueueItem): JobRuntimeQueueItem {
  return updateQueueStatus(queueItem, 'failed')
}

export function markJobBlockedMock(queueItem: JobRuntimeQueueItem): JobRuntimeQueueItem {
  return updateQueueStatus(queueItem, 'blocked')
}

export function cancelJobMock(queueItem: JobRuntimeQueueItem): JobRuntimeQueueItem {
  return updateQueueStatus(queueItem, 'cancelled')
}

export function createJobQueueSummary(queueItem: JobRuntimeQueueItem): string {
  return `${queueItem.workerKind} job ${queueItem.jobId} is ${queueItem.queueStatus}. ${queueItem.gateCheck.message}`
}

function updateQueueStatus(
  queueItem: JobRuntimeQueueItem,
  queueStatus: JobRuntimeQueueItem['queueStatus'],
): JobRuntimeQueueItem {
  queueItem.queueStatus = queueStatus
  queueItem.updatedAt = nowIso()
  return queueItem
}
