import type { JobRuntimeQueueItem, JobWorkerKind } from '../../src/types/job-runtime'
import { createMockDatabase, insertMockRecord, type MockDatabase } from '../../src/backend/mock/mock-database'
import { queueMockJob } from '../../src/backend/services/job-queue-runtime-service'
import type { CloudWorkerType, WorkerJobPayload } from '../../src/backend/cloud/worker-job-contracts'
import {
  runInternalTestingWorkerPayloadDryRun,
  type InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION =
  'internal_testing_mock_worker_queue_review_passed_ready_for_worker_claim_dry_run_review'

export type InternalTestingMockWorkerQueueReviewStatus =
  | 'passed_ready_for_worker_claim_dry_run_review'
  | 'blocked_by_worker_payload_or_queue_gate'

export interface InternalTestingMockWorkerQueueReviewResult {
  decision: typeof INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION
  status: InternalTestingMockWorkerQueueReviewStatus
  source: 'worker_payload_dry_run_and_mock_job_queue_runtime'
  workspaceId: string
  projectId: string
  editSessionId: string
  payloadCount: number
  queuedItemCount: number
  replayedItemCount: number
  duplicateQueuedItemCount: number
  blockedItemCount: number
  blockers: readonly string[]
  queueItems: readonly JobRuntimeQueueItem[]
  replayedQueueItems: readonly JobRuntimeQueueItem[]
  queueSummaries: readonly {
    jobId: string
    workerKind: JobWorkerKind
    queueStatus: JobRuntimeQueueItem['queueStatus']
    gateStatus: JobRuntimeQueueItem['gateCheck']['gateStatus']
    idempotencyKey: string
    replayed: boolean
  }[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    workerClaim: false
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

function mapWorkerKind(workerType: CloudWorkerType): JobWorkerKind {
  switch (workerType) {
    case 'media_analysis_worker':
    case 'ffmpeg_media_worker':
    case 'browser_capture_worker':
    case 'audio_soundsync_worker':
      return 'custom'
    case 'image_asset_worker':
    case 'ai_video_asset_worker':
      return 'graphic_design_generation'
    case 'remotion_render_worker':
      return 'render_preview'
    case 'qa_worker':
      return 'qa'
    case 'export_worker':
      return 'render_export'
  }
}

function seedQueueGateRecords(db: MockDatabase, input: InternalTestingWorkerPayloadDryRunInput): void {
  insertMockRecord(db, 'editPlans', {
    id: input.editPlanId ?? input.toolExecutionPlanId ?? 'edit-plan-missing',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status: 'approved',
    approvalStatus: 'approved',
  } as never)
  insertMockRecord(db, 'creditEstimates', {
    id: input.creditEstimateId ?? 'credit-estimate-missing',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status: 'approved',
  } as never)
  insertMockRecord(db, 'creditReservations', {
    id: input.creditReservationId ?? 'credit-reservation-missing',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: input.creditEstimateId ?? 'credit-estimate-missing',
    status: 'reserved',
  } as never)
}

function idempotencyKeyFor(payload: WorkerJobPayload): string {
  return payload.idempotencyKey
}

function queuePayload(
  db: MockDatabase,
  payload: WorkerJobPayload,
  input: InternalTestingWorkerPayloadDryRunInput,
  idempotencyIndex: Map<string, JobRuntimeQueueItem>,
): { item: JobRuntimeQueueItem; replayed: boolean } {
  const key = idempotencyKeyFor(payload)
  const existing = idempotencyIndex.get(key)
  if (existing) {
    return { item: existing, replayed: true }
  }

  const item = queueMockJob(db, {
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    editPlanId: payload.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: payload.creditReservationId,
    jobBatchId: payload.jobBatchId,
    jobId: payload.jobId,
    workerKind: mapWorkerKind(payload.workerType),
    requiresEditPlanApproval: true,
    requiresCreditEstimateApproval: true,
    requiresCreditReservation: true,
    requiresBackendRuntime: false,
    mockSafe: true,
    payload: {
      dryRunOnly: true,
      source: 'internal_testing_worker_payload_dry_run',
      idempotencyKey: payload.idempotencyKey,
      approvedPlanSnapshotId: payload.approvedPlanSnapshotId,
      operationIds: payload.operationIds,
      toolStrategyItemIds: payload.toolStrategyItemIds,
      sourceAssetIds: payload.sourceAssetIds,
      metadata: payload.metadata,
      noWorkerClaim: true,
      noWorkerDispatch: true,
      noToolExecution: true,
      noMediaProcessing: true,
      noCreditSpend: true,
    },
  })
  idempotencyIndex.set(key, item)
  return { item, replayed: false }
}

export function reviewInternalTestingMockWorkerQueue(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingMockWorkerQueueReviewResult {
  const dryRun = runInternalTestingWorkerPayloadDryRun(input)
  const db = createMockDatabase()
  seedQueueGateRecords(db, input)

  if (dryRun.status !== 'passed_ready_for_mock_worker_queue_review') {
    return {
      decision: INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION,
      status: 'blocked_by_worker_payload_or_queue_gate',
      source: 'worker_payload_dry_run_and_mock_job_queue_runtime',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      payloadCount: dryRun.payloadCount,
      queuedItemCount: 0,
      replayedItemCount: 0,
      duplicateQueuedItemCount: 0,
      blockedItemCount: 0,
      blockers: dryRun.blockers,
      queueItems: [],
      replayedQueueItems: [],
      queueSummaries: [],
      productReady: false,
      blockedScope: blockedScope(),
    }
  }

  const idempotencyIndex = new Map<string, JobRuntimeQueueItem>()
  const firstPass = dryRun.payloads.map((payload) => queuePayload(db, payload, input, idempotencyIndex))
  const replayPass = dryRun.payloads.map((payload) => queuePayload(db, payload, input, idempotencyIndex))
  const queueItems = firstPass.map((result) => result.item)
  const replayedQueueItems = replayPass.map((result) => result.item)
  const queueBlockers = queueItems.flatMap((item) =>
    item.gateCheck.ok ? [] : item.gateCheck.blockReasons.map((reason) => `${item.jobId}:${reason}`),
  )
  const duplicateQueuedItemCount = replayPass.filter((result) => !result.replayed).length
  const blockers = [
    ...queueBlockers,
    ...(duplicateQueuedItemCount > 0 ? ['idempotent_replay_created_duplicate_queue_items'] : []),
  ]

  return {
    decision: INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION,
    status: blockers.length === 0 && queueItems.length === dryRun.payloadCount
      ? 'passed_ready_for_worker_claim_dry_run_review'
      : 'blocked_by_worker_payload_or_queue_gate',
    source: 'worker_payload_dry_run_and_mock_job_queue_runtime',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    payloadCount: dryRun.payloadCount,
    queuedItemCount: queueItems.filter((item) => item.queueStatus === 'queued').length,
    replayedItemCount: replayPass.filter((result) => result.replayed).length,
    duplicateQueuedItemCount,
    blockedItemCount: queueItems.filter((item) => item.queueStatus === 'blocked').length,
    blockers,
    queueItems,
    replayedQueueItems,
    queueSummaries: queueItems.map((item) => ({
      jobId: item.jobId,
      workerKind: item.workerKind,
      queueStatus: item.queueStatus,
      gateStatus: item.gateCheck.gateStatus,
      idempotencyKey: String(item.payload.idempotencyKey ?? ''),
      replayed: replayedQueueItems.some((replayedItem) => replayedItem.id === item.id),
    })),
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function blockedScope(): InternalTestingMockWorkerQueueReviewResult['blockedScope'] {
  return {
    frontendToolExecution: false,
    rawPromptExecution: false,
    publicOrSignedUrlArtifacts: false,
    serviceRoleBrowserAccess: false,
    providerOrModelCalls: false,
    workerDispatch: false,
    workerClaim: false,
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
