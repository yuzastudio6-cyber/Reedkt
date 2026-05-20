import type { JobRuntimeEvent, JobRuntimeQueueItem } from '../../types/job-runtime'
import type { WorkerHeartbeatResult, WorkerLeaseRecord, WorkerRuntimeKind } from '../../types/worker-lease'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import { runMockLyriaWorkerFlow } from '../orchestrators/mock-lyria-worker-orchestrator'
import { runMockSFXWorkerFlow } from '../orchestrators/mock-sfx-worker-orchestrator'
import { createJobIdempotencyKey, recordIdempotencyResultMock } from '../runtime/idempotency-service'
import {
  claimWorkerLeaseMock,
  completeWorkerLeaseMock,
  failWorkerLeaseMock,
  heartbeatWorkerLeaseMock,
} from '../runtime/worker-lease-service'
import {
  createJobBlockedEvent,
  createJobCompletedEvent,
  createJobProgressEvent,
  createJobStartedEvent,
} from './job-event-runtime-service'
import { markJobCompletedMock, markJobFailedMock, markJobRunningMock } from './job-queue-runtime-service'

export interface WorkerDispatchRuntimeResult {
  ok: boolean
  queueItem: JobRuntimeQueueItem
  lease?: WorkerLeaseRecord
  heartbeat?: WorkerHeartbeatResult
  idempotencyKey?: string
  workerOutput?: unknown
  jobEvents: JobRuntimeEvent[]
  message: string
  warnings: string[]
  mockOnly: boolean
}

export function dispatchMockWorkerJob(queueItem: JobRuntimeQueueItem, db: MockDatabase = createMockDatabase()): WorkerDispatchRuntimeResult {
  if (!queueItem.gateCheck.ok || queueItem.queueStatus === 'blocked') {
    return {
      ok: false,
      queueItem,
      jobEvents: [createJobBlockedEvent(queueItem.jobId, queueItem.gateCheck.message)],
      message: 'Mock dispatch refused because job gates are blocked.',
      warnings: queueItem.gateCheck.warnings,
      mockOnly: true,
    }
  }

  const idempotencyKey = createJobIdempotencyKey(queueItem.jobId)
  const leaseResult = claimWorkerLeaseMock(db, {
    jobId: queueItem.jobId,
    jobBatchId: queueItem.jobBatchId,
    workspaceId: queueItem.workspaceId,
    projectId: queueItem.projectId,
    editPlanId: queueItem.editPlanId,
    workerId: `mock-${queueItem.workerKind}-worker`,
    workerKind: workerRuntimeKindForQueueItem(queueItem),
    queueItem,
  })

  if (!leaseResult.ok || !leaseResult.lease) {
    return {
      ok: false,
      queueItem,
      jobEvents: [createJobBlockedEvent(queueItem.jobId, leaseResult.message)],
      message: leaseResult.message,
      warnings: leaseResult.warnings,
      mockOnly: true,
    }
  }

  const heartbeat = heartbeatWorkerLeaseMock(db, leaseResult.lease.id, leaseResult.lease.leaseToken)

  if (queueItem.workerKind === 'music_generation') return dispatchLyriaMockWorker(queueItem, db, leaseResult.lease, heartbeat, idempotencyKey)
  if (queueItem.workerKind === 'sfx_generation') return dispatchSFXMockWorker(queueItem, db, leaseResult.lease, heartbeat, idempotencyKey)
  if (queueItem.workerKind === 'render_preview' || queueItem.workerKind === 'render_export') {
    return dispatchRenderMockWorker(queueItem, db, leaseResult.lease, heartbeat, idempotencyKey)
  }

  return dispatchGenericMockWorker(queueItem, db, leaseResult.lease, heartbeat, idempotencyKey)
}

export function dispatchLyriaMockWorker(
  queueItem: JobRuntimeQueueItem,
  db: MockDatabase = createMockDatabase(),
  lease?: WorkerLeaseRecord,
  heartbeat?: WorkerHeartbeatResult,
  idempotencyKey = createJobIdempotencyKey(queueItem.jobId),
): WorkerDispatchRuntimeResult {
  markJobRunningMock(queueItem)
  const workerRun = runMockLyriaWorkerFlow()
  const completed = workerRun.workerOutput.status === 'mock_generated'
  if (completed) {
    markJobCompletedMock(queueItem)
    if (lease) completeWorkerLeaseMock(db, lease.id, lease.leaseToken)
  } else {
    markJobFailedMock(queueItem)
    if (lease) failWorkerLeaseMock(db, lease.id, lease.leaseToken)
  }
  recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'job',
    sourceId: queueItem.jobId,
    result: { status: workerRun.workerOutput.status },
  })

  return {
    ok: completed,
    queueItem,
    lease,
    heartbeat,
    idempotencyKey,
    workerOutput: workerRun,
    jobEvents: [
      createJobStartedEvent(queueItem.jobId, 'Mock Lyria worker started.'),
      createJobProgressEvent(queueItem.jobId, 'Mock Lyria worker created generated music metadata.'),
      completed
        ? createJobCompletedEvent(queueItem.jobId, 'Mock Lyria worker completed and created a generated music placeholder.')
        : createJobBlockedEvent(queueItem.jobId, 'Mock Lyria worker did not complete successfully.'),
    ],
    message: completed ? 'Mock Lyria dispatch completed.' : 'Mock Lyria dispatch stopped before completion.',
    warnings: workerRun.warnings,
    mockOnly: true,
  }
}

export function dispatchSFXMockWorker(
  queueItem: JobRuntimeQueueItem,
  db: MockDatabase = createMockDatabase(),
  lease?: WorkerLeaseRecord,
  heartbeat?: WorkerHeartbeatResult,
  idempotencyKey = createJobIdempotencyKey(queueItem.jobId),
): WorkerDispatchRuntimeResult {
  markJobRunningMock(queueItem)
  const workerRun = runMockSFXWorkerFlow()
  const completed = ['mock_generated', 'library_match_used', 'completed'].includes(workerRun.workerOutput.status)
  if (completed) {
    markJobCompletedMock(queueItem)
    if (lease) completeWorkerLeaseMock(db, lease.id, lease.leaseToken)
  } else {
    markJobFailedMock(queueItem)
    if (lease) failWorkerLeaseMock(db, lease.id, lease.leaseToken)
  }
  recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'job',
    sourceId: queueItem.jobId,
    result: { status: workerRun.workerOutput.status },
  })

  return {
    ok: completed,
    queueItem,
    lease,
    heartbeat,
    idempotencyKey,
    workerOutput: workerRun,
    jobEvents: [
      createJobStartedEvent(queueItem.jobId, 'Mock SFX worker started.'),
      createJobProgressEvent(queueItem.jobId, 'Mock SFX worker created generated SFX metadata.'),
      completed
        ? createJobCompletedEvent(queueItem.jobId, 'Mock SFX worker completed and created SFX placeholders.')
        : createJobBlockedEvent(queueItem.jobId, 'Mock SFX worker did not complete successfully.'),
    ],
    message: completed ? 'Mock SFX dispatch completed.' : 'Mock SFX dispatch stopped before completion.',
    warnings: workerRun.warnings,
    mockOnly: true,
  }
}

export function dispatchRenderMockWorker(
  queueItem: JobRuntimeQueueItem,
  db: MockDatabase = createMockDatabase(),
  lease?: WorkerLeaseRecord,
  heartbeat?: WorkerHeartbeatResult,
  idempotencyKey = createJobIdempotencyKey(queueItem.jobId),
): WorkerDispatchRuntimeResult {
  markJobRunningMock(queueItem)
  markJobCompletedMock(queueItem)
  if (lease) completeWorkerLeaseMock(db, lease.id, lease.leaseToken)
  recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'render',
    sourceId: queueItem.jobId,
    result: { status: 'mock_render_placeholder' },
  })

  const workerOutput = {
    status: 'mock_render_placeholder',
    renderId: `mock-render-${queueItem.jobId}`,
    message: 'Generic mock render worker placeholder; no render worker skeleton exists yet.',
  }

  return {
    ok: true,
    queueItem,
    lease,
    heartbeat,
    idempotencyKey,
    workerOutput,
    jobEvents: [
      createJobStartedEvent(queueItem.jobId, 'Mock render placeholder started.'),
      createJobCompletedEvent(queueItem.jobId, 'Mock render placeholder completed without rendering media.'),
    ],
    message: 'Generic mock render dispatch completed.',
    warnings: ['Render worker skeleton files are missing; no real render happened.'],
    mockOnly: true,
  }
}

export function dispatchGenericMockWorker(
  queueItem: JobRuntimeQueueItem,
  db: MockDatabase = createMockDatabase(),
  lease?: WorkerLeaseRecord,
  heartbeat?: WorkerHeartbeatResult,
  idempotencyKey = createJobIdempotencyKey(queueItem.jobId),
): WorkerDispatchRuntimeResult {
  if (queueItem.workerKind === 'custom') {
    if (lease) failWorkerLeaseMock(db, lease.id, lease.leaseToken)
    return {
      ok: false,
      queueItem,
      lease,
      heartbeat,
      idempotencyKey,
      workerOutput: { status: 'not_implemented' },
      jobEvents: [createJobBlockedEvent(queueItem.jobId, 'Custom mock worker dispatch is not implemented.')],
      message: 'Mock worker dispatch is not implemented for custom jobs.',
      warnings: ['Add a specific mock worker before dispatching this job kind.'],
      mockOnly: true,
    }
  }

  markJobRunningMock(queueItem)
  markJobCompletedMock(queueItem)
  if (lease) completeWorkerLeaseMock(db, lease.id, lease.leaseToken)
  recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'job',
    sourceId: queueItem.jobId,
    result: { status: 'completed' },
  })

  return {
    ok: true,
    queueItem,
    lease,
    heartbeat,
    idempotencyKey,
    workerOutput: {
      status: 'completed',
      workerKind: queueItem.workerKind,
      message: 'Generic mock worker completed.',
    },
    jobEvents: [
      createJobStartedEvent(queueItem.jobId),
      createJobCompletedEvent(queueItem.jobId, `Generic mock ${queueItem.workerKind} worker completed.`),
    ],
    message: 'Generic mock worker dispatch completed.',
    warnings: ['Generic mock dispatch created no provider, storage, or render side effects.'],
    mockOnly: true,
  }
}

export function createWorkerDispatchSummary(result: WorkerDispatchRuntimeResult): string {
  return result.message
}

function workerRuntimeKindForQueueItem(queueItem: JobRuntimeQueueItem): WorkerRuntimeKind {
  if (queueItem.workerKind === 'music_generation') return 'lyria_worker'
  if (queueItem.workerKind === 'sfx_generation') return 'sfx_worker'
  if (queueItem.workerKind === 'render_preview' || queueItem.workerKind === 'render_export') return 'render_worker'
  if (queueItem.workerKind === 'qa') return 'qa_worker'
  if (queueItem.workerKind === 'video_generation') return 'provider_worker'
  if (queueItem.workerKind === 'custom') return 'custom_worker'
  return 'mock_worker'
}
