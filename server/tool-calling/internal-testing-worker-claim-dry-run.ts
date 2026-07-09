import type { JobWorkerKind } from '../../src/types/job-runtime'
import type { WorkerLeaseClaimResult, WorkerRuntimeKind } from '../../src/types/worker-lease'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  claimWorkerLeaseMock,
  releaseWorkerLeaseMock,
} from '../../src/backend/runtime/worker-lease-service'
import {
  reviewInternalTestingMockWorkerQueue,
} from './internal-testing-mock-worker-queue-review'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION =
  'internal_testing_worker_claim_dry_run_passed_ready_for_mock_worker_execution_harness'

export type InternalTestingWorkerClaimDryRunStatus =
  | 'passed_ready_for_mock_worker_execution_harness'
  | 'blocked_by_queue_or_claim_gate'

export interface InternalTestingWorkerClaimDryRunResult {
  decision: typeof INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION
  status: InternalTestingWorkerClaimDryRunStatus
  source: 'mock_worker_queue_review_and_worker_lease_service'
  workspaceId: string
  projectId: string
  editSessionId: string
  queuedItemCount: number
  claimAttemptCount: number
  claimedLeaseCount: number
  releasedLeaseCount: number
  duplicateClaimBlocked: boolean
  duplicateClaimResult: WorkerLeaseClaimResult | 'not_checked'
  blockers: readonly string[]
  claimSummaries: readonly {
    jobId: string
    workerKind: JobWorkerKind
    workerRuntimeKind: WorkerRuntimeKind
    claimResult: WorkerLeaseClaimResult
    leaseStatus: 'claimed' | 'not_claimed'
    released: boolean
  }[]
  queueStatusAfterClaim: readonly {
    jobId: string
    queueStatus: 'queued' | 'blocked' | 'draft' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retry_scheduled'
  }[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    workerExecution: false
    toolExecution: false
    mediaProcessing: false
    renderOrExport: false
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

export function reviewInternalTestingWorkerClaimDryRun(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingWorkerClaimDryRunResult {
  const queueReview = reviewInternalTestingMockWorkerQueue(input)
  const db = createMockDatabase()

  if (queueReview.status !== 'passed_ready_for_worker_claim_dry_run_review') {
    return {
      decision: INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION,
      status: 'blocked_by_queue_or_claim_gate',
      source: 'mock_worker_queue_review_and_worker_lease_service',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      queuedItemCount: queueReview.queuedItemCount,
      claimAttemptCount: 0,
      claimedLeaseCount: 0,
      releasedLeaseCount: 0,
      duplicateClaimBlocked: false,
      duplicateClaimResult: 'not_checked',
      blockers: queueReview.blockers,
      claimSummaries: [],
      queueStatusAfterClaim: [],
      productReady: false,
      blockedScope: blockedScope(),
    }
  }

  const claimResults = queueReview.queueItems.map((queueItem, index) => {
    const workerRuntimeKind = workerRuntimeKindFor(queueItem.workerKind)
    const claim = claimWorkerLeaseMock(db, {
      jobId: queueItem.jobId,
      jobBatchId: queueItem.jobBatchId,
      workspaceId: queueItem.workspaceId,
      projectId: queueItem.projectId,
      editPlanId: queueItem.editPlanId,
      workerId: `dry-run-${workerRuntimeKind}-${index + 1}`,
      workerKind: workerRuntimeKind,
      queueItem,
    })

    return { queueItem, workerRuntimeKind, claim }
  })

  const duplicateClaim = queueReview.queueItems[0]
    ? claimWorkerLeaseMock(db, {
      jobId: queueReview.queueItems[0].jobId,
      jobBatchId: queueReview.queueItems[0].jobBatchId,
      workspaceId: queueReview.queueItems[0].workspaceId,
      projectId: queueReview.queueItems[0].projectId,
      editPlanId: queueReview.queueItems[0].editPlanId,
      workerId: 'dry-run-duplicate-claim-check',
      workerKind: workerRuntimeKindFor(queueReview.queueItems[0].workerKind),
      queueItem: queueReview.queueItems[0],
    })
    : undefined

  const releaseResults = claimResults.map((result) => (
    result.claim.lease
      ? releaseWorkerLeaseMock(db, result.claim.lease.id, result.claim.lease.leaseToken)
      : result.claim
  ))

  const claimBlockers = claimResults.flatMap((result) => (
    result.claim.ok && result.claim.lease ? [] : [`${result.queueItem.jobId}:${result.claim.claimResult}`]
  ))
  const releaseBlockers = releaseResults.flatMap((result, index) => (
    result.ok ? [] : [`${claimResults[index]?.queueItem.jobId ?? `lease-${index + 1}`}:release_failed`]
  ))
  const duplicateClaimBlocked = duplicateClaim?.claimResult === 'already_claimed'
  const blockers = [
    ...claimBlockers,
    ...releaseBlockers,
    ...(duplicateClaimBlocked ? [] : ['duplicate_worker_claim_not_blocked']),
  ]

  return {
    decision: INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION,
    status: blockers.length === 0
      ? 'passed_ready_for_mock_worker_execution_harness'
      : 'blocked_by_queue_or_claim_gate',
    source: 'mock_worker_queue_review_and_worker_lease_service',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    queuedItemCount: queueReview.queuedItemCount,
    claimAttemptCount: claimResults.length + (duplicateClaim ? 1 : 0),
    claimedLeaseCount: claimResults.filter((result) => result.claim.ok && result.claim.lease).length,
    releasedLeaseCount: releaseResults.filter((result) => result.ok).length,
    duplicateClaimBlocked,
    duplicateClaimResult: duplicateClaim?.claimResult ?? 'not_checked',
    blockers,
    claimSummaries: claimResults.map((result, index) => ({
      jobId: result.queueItem.jobId,
      workerKind: result.queueItem.workerKind,
      workerRuntimeKind: result.workerRuntimeKind,
      claimResult: result.claim.claimResult,
      leaseStatus: result.claim.ok && result.claim.lease ? 'claimed' : 'not_claimed',
      released: releaseResults[index]?.ok ?? false,
    })),
    queueStatusAfterClaim: queueReview.queueItems.map((item) => ({
      jobId: item.jobId,
      queueStatus: item.queueStatus,
    })),
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function blockedScope(): InternalTestingWorkerClaimDryRunResult['blockedScope'] {
  return {
    frontendToolExecution: false,
    rawPromptExecution: false,
    publicOrSignedUrlArtifacts: false,
    serviceRoleBrowserAccess: false,
    providerOrModelCalls: false,
    workerDispatch: false,
    workerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    renderOrExport: false,
    creditSpend: false,
    ledgerWrites: false,
    supabaseWrites: false,
    externalBeta: false,
    paidProduction: false,
    productReady: false,
  }
}
