import type { JobRuntimeEvent, JobRuntimeQueueItem, JobWorkerKind } from '../../src/types/job-runtime'
import type { WorkerLeaseClaimResult, WorkerLeaseStatus, WorkerRuntimeKind } from '../../src/types/worker-lease'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  claimWorkerLeaseMock,
  completeWorkerLeaseMock,
} from '../../src/backend/runtime/worker-lease-service'
import {
  createJobCompletedEvent,
  createJobProgressEvent,
  createJobStartedEvent,
} from '../../src/backend/services/job-event-runtime-service'
import {
  markJobCompletedMock,
  markJobRunningMock,
} from '../../src/backend/services/job-queue-runtime-service'
import {
  reviewInternalTestingMockWorkerQueue,
} from './internal-testing-mock-worker-queue-review'
import {
  reviewInternalTestingWorkerClaimDryRun,
} from './internal-testing-worker-claim-dry-run'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION =
  'internal_testing_mock_worker_execution_harness_passed_ready_for_private_review_result_dry_run'

export type InternalTestingMockWorkerExecutionHarnessStatus =
  | 'passed_ready_for_private_review_result_dry_run'
  | 'blocked_by_claim_or_completion_gate'

export interface InternalTestingMockWorkerExecutionHarnessResult {
  decision: typeof INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION
  status: InternalTestingMockWorkerExecutionHarnessStatus
  source: 'worker_claim_dry_run_and_metadata_only_job_runtime'
  workspaceId: string
  projectId: string
  editSessionId: string
  queuedItemCount: number
  completedItemCount: number
  completedLeaseCount: number
  eventCount: number
  metadataResultCount: number
  blockers: readonly string[]
  executionSummaries: readonly {
    jobId: string
    workerKind: JobWorkerKind
    workerRuntimeKind: WorkerRuntimeKind
    claimResult: WorkerLeaseClaimResult
    finalQueueStatus: JobRuntimeQueueItem['queueStatus']
    finalLeaseStatus: WorkerLeaseStatus | 'not_claimed'
    eventTypes: readonly JobRuntimeEvent['eventType'][]
    metadataOnly: true
  }[]
  metadataResults: readonly {
    jobId: string
    resultType: 'metadata_only_completion'
    privateManifestOnly: true
    generatedMedia: false
    providerCalls: false
    toolExecution: false
  }[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    realWorkerExecution: false
    toolExecution: false
    mediaProcessing: false
    renderOrExport: false
    generatedMediaArtifacts: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

function workerRuntimeKindFor(workerKind: JobWorkerKind): WorkerRuntimeKind {
  if (workerKind === 'music_generation') return 'lyria_worker'
  if (workerKind === 'sfx_generation') return 'sfx_worker'
  if (workerKind === 'render_preview' || workerKind === 'render_export') return 'render_worker'
  if (workerKind === 'qa') return 'qa_worker'
  if (workerKind === 'video_generation') return 'provider_worker'
  if (workerKind === 'custom') return 'custom_worker'
  return 'mock_worker'
}

function completeMetadataOnlyJob(
  queueItem: JobRuntimeQueueItem,
  index: number,
) {
  const db = createMockDatabase()
  const workerRuntimeKind = workerRuntimeKindFor(queueItem.workerKind)
  const claim = claimWorkerLeaseMock(db, {
    jobId: queueItem.jobId,
    jobBatchId: queueItem.jobBatchId,
    workspaceId: queueItem.workspaceId,
    projectId: queueItem.projectId,
    editPlanId: queueItem.editPlanId,
    workerId: `metadata-harness-${workerRuntimeKind}-${index + 1}`,
    workerKind: workerRuntimeKind,
    queueItem,
  })

  if (!claim.ok || !claim.lease) {
    return {
      queueItem,
      workerRuntimeKind,
      claim,
      complete: claim,
      events: [] as JobRuntimeEvent[],
    }
  }

  markJobRunningMock(queueItem)
  const events = [
    createJobStartedEvent(queueItem.jobId, 'Mock metadata harness accepted queued work.'),
    createJobProgressEvent(queueItem.jobId, 'Mock metadata harness recorded completion metadata only.', {
      metadataOnly: true,
      generatedMedia: false,
      providerCalls: false,
      toolExecution: false,
    }),
  ]
  markJobCompletedMock(queueItem)
  events.push(createJobCompletedEvent(queueItem.jobId, 'Mock metadata harness completed without running tools.'))
  const complete = completeWorkerLeaseMock(db, claim.lease.id, claim.lease.leaseToken)

  return {
    queueItem,
    workerRuntimeKind,
    claim,
    complete,
    events,
  }
}

export function reviewInternalTestingMockWorkerExecutionHarness(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingMockWorkerExecutionHarnessResult {
  const claimReview = reviewInternalTestingWorkerClaimDryRun(input)
  const queueReview = reviewInternalTestingMockWorkerQueue(input)

  if (claimReview.status !== 'passed_ready_for_mock_worker_execution_harness') {
    return {
      decision: INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION,
      status: 'blocked_by_claim_or_completion_gate',
      source: 'worker_claim_dry_run_and_metadata_only_job_runtime',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      queuedItemCount: queueReview.queuedItemCount,
      completedItemCount: 0,
      completedLeaseCount: 0,
      eventCount: 0,
      metadataResultCount: 0,
      blockers: claimReview.blockers,
      executionSummaries: [],
      metadataResults: [],
      productReady: false,
      blockedScope: blockedScope(),
    }
  }

  const completions = queueReview.queueItems.map((queueItem, index) => completeMetadataOnlyJob(queueItem, index))
  const completionBlockers = completions.flatMap((completion) => {
    const blockers: string[] = []
    if (!completion.claim.ok || !completion.claim.lease) {
      blockers.push(`${completion.queueItem.jobId}:${completion.claim.claimResult}`)
    }
    if (!completion.complete.ok) {
      blockers.push(`${completion.queueItem.jobId}:lease_completion_failed`)
    }
    if (completion.queueItem.queueStatus !== 'completed') {
      blockers.push(`${completion.queueItem.jobId}:queue_not_completed`)
    }
    if (completion.events.length !== 3) {
      blockers.push(`${completion.queueItem.jobId}:metadata_events_missing`)
    }
    return blockers
  })

  return {
    decision: INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION,
    status: completionBlockers.length === 0 && completions.length === queueReview.queuedItemCount
      ? 'passed_ready_for_private_review_result_dry_run'
      : 'blocked_by_claim_or_completion_gate',
    source: 'worker_claim_dry_run_and_metadata_only_job_runtime',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    queuedItemCount: queueReview.queuedItemCount,
    completedItemCount: completions.filter((completion) => completion.queueItem.queueStatus === 'completed').length,
    completedLeaseCount: completions.filter((completion) => completion.complete.lease?.status === 'completed').length,
    eventCount: completions.reduce((count, completion) => count + completion.events.length, 0),
    metadataResultCount: completions.length,
    blockers: completionBlockers,
    executionSummaries: completions.map((completion) => ({
      jobId: completion.queueItem.jobId,
      workerKind: completion.queueItem.workerKind,
      workerRuntimeKind: completion.workerRuntimeKind,
      claimResult: completion.claim.claimResult,
      finalQueueStatus: completion.queueItem.queueStatus,
      finalLeaseStatus: completion.complete.lease?.status ?? 'not_claimed',
      eventTypes: completion.events.map((event) => event.eventType),
      metadataOnly: true,
    })),
    metadataResults: completions.map((completion) => ({
      jobId: completion.queueItem.jobId,
      resultType: 'metadata_only_completion',
      privateManifestOnly: true,
      generatedMedia: false,
      providerCalls: false,
      toolExecution: false,
    })),
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function blockedScope(): InternalTestingMockWorkerExecutionHarnessResult['blockedScope'] {
  return {
    frontendToolExecution: false,
    rawPromptExecution: false,
    publicOrSignedUrlArtifacts: false,
    serviceRoleBrowserAccess: false,
    providerOrModelCalls: false,
    workerDispatch: false,
    realWorkerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    renderOrExport: false,
    generatedMediaArtifacts: false,
    creditSpend: false,
    ledgerWrites: false,
    supabaseWrites: false,
    externalBeta: false,
    paidProduction: false,
    productReady: false,
  }
}
