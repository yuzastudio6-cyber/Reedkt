import type { ISODateString } from '../../types/shared'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import {
  type GpacMp4boxGuardedWorkerEnqueueMockResult,
} from './gpac-mp4box-guarded-worker-enqueue-mock-contracts'

export type GpacMp4boxGuardedWorkerSkeletonLane =
  'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxGuardedWorkerSkeletonId =
  'worker.gpacMp4box.packageValidation.mock'

export type GpacMp4boxGuardedWorkerSkeletonStatus =
  | 'registered_disabled_mock_worker_skeleton'
  | 'blocked_missing_mock_enqueue'
  | 'blocked_enqueue_contract_invalid'
  | 'blocked_queue_item_not_mock_only'
  | 'blocked_queue_item_not_queued'
  | 'blocked_worker_kind_mismatch'
  | 'blocked_worker_execution_not_enabled'
  | 'blocked_storage_transfer_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'

export interface GpacMp4boxGuardedWorkerSkeletonMockInput {
  lane: GpacMp4boxGuardedWorkerSkeletonLane
  skeletonId: GpacMp4boxGuardedWorkerSkeletonId
  enqueueResult: GpacMp4boxGuardedWorkerEnqueueMockResult
  createdAt: ISODateString
  skeletonMode: 'disabled_mock_worker_skeleton_only'
  workerOwner: 'backend_worker_only'
  workerKind: 'render_export'
  workerSkeletonRegistered: true
  workerSkeletonEnabled: false
  queueConsumptionMode: 'metadata_validation_only'
  routeExecution: false
  workerDispatchAttempted: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
}

export interface GpacMp4boxGuardedWorkerSkeletonMockResult {
  lane: GpacMp4boxGuardedWorkerSkeletonLane
  skeletonId: GpacMp4boxGuardedWorkerSkeletonId
  ok: boolean
  skeletonStatus: GpacMp4boxGuardedWorkerSkeletonStatus
  blockers: GpacMp4boxGuardedWorkerSkeletonStatus[]
  queueItem?: JobRuntimeQueueItem
  sanitizedPayload: {
    queueItemId: string
    jobId: string
    workspaceId: string
    projectId: string
    workerKind: 'render_export'
    queueStatus: 'queued'
    approvedSnapshotId: string
    approvalRecordId: string
    creditReservationId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: string
    privateInputManifestId: string
    privateArtifactManifestId: string
    privateArtifactChecksumId: string
    qaPolicyId: string
    cleanupPolicyId: string
    auditRecordId: string
    workerSkeletonEnabled: false
    routeExecution: false
    workerDispatchAttempted: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-POLICY-MOCK-IMPLEMENTATION-1'
}

export function buildGpacMp4boxGuardedWorkerSkeletonMockInput(input: {
  enqueueResult: GpacMp4boxGuardedWorkerEnqueueMockResult
  createdAt: ISODateString
}): GpacMp4boxGuardedWorkerSkeletonMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1',
    skeletonId: 'worker.gpacMp4box.packageValidation.mock',
    enqueueResult: input.enqueueResult,
    createdAt: input.createdAt,
    skeletonMode: 'disabled_mock_worker_skeleton_only',
    workerOwner: 'backend_worker_only',
    workerKind: 'render_export',
    workerSkeletonRegistered: true,
    workerSkeletonEnabled: false,
    queueConsumptionMode: 'metadata_validation_only',
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function getPayloadString(queueItem: JobRuntimeQueueItem, key: string): string {
  const value = queueItem.payload[key]
  return typeof value === 'string' ? value : ''
}

function getPayloadFalse(queueItem: JobRuntimeQueueItem, key: string): boolean {
  return queueItem.payload[key] === false
}

function createSanitizedPayload(
  input: GpacMp4boxGuardedWorkerSkeletonMockInput,
): GpacMp4boxGuardedWorkerSkeletonMockResult['sanitizedPayload'] {
  const queueItem = input.enqueueResult.queueItem

  return {
    queueItemId: queueItem?.id ?? '',
    jobId: queueItem?.jobId ?? '',
    workspaceId: queueItem?.workspaceId ?? '',
    projectId: queueItem?.projectId ?? '',
    workerKind: 'render_export',
    queueStatus: 'queued',
    approvedSnapshotId: queueItem ? getPayloadString(queueItem, 'approvedSnapshotId') : '',
    approvalRecordId: queueItem ? getPayloadString(queueItem, 'approvalRecordId') : '',
    creditReservationId: queueItem ? getPayloadString(queueItem, 'creditReservationId') : '',
    workerLeaseId: queueItem ? getPayloadString(queueItem, 'workerLeaseId') : '',
    routeIdempotencyKey: queueItem ? getPayloadString(queueItem, 'routeIdempotencyKey') : '',
    commandTemplateId: queueItem ? getPayloadString(queueItem, 'commandTemplateId') : '',
    privateInputManifestId: queueItem ? getPayloadString(queueItem, 'privateInputManifestId') : '',
    privateArtifactManifestId: queueItem ? getPayloadString(queueItem, 'privateArtifactManifestId') : '',
    privateArtifactChecksumId: queueItem ? getPayloadString(queueItem, 'privateArtifactChecksumId') : '',
    qaPolicyId: queueItem ? getPayloadString(queueItem, 'qaPolicyId') : '',
    cleanupPolicyId: queueItem ? getPayloadString(queueItem, 'cleanupPolicyId') : '',
    auditRecordId: queueItem ? getPayloadString(queueItem, 'auditRecordId') : '',
    workerSkeletonEnabled: false,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
  }
}

export function validateGpacMp4boxGuardedWorkerSkeletonMockInput(
  input: GpacMp4boxGuardedWorkerSkeletonMockInput,
): GpacMp4boxGuardedWorkerSkeletonMockResult {
  const blockers: GpacMp4boxGuardedWorkerSkeletonStatus[] = []
  const queueItem = input.enqueueResult.queueItem

  if (!input.enqueueResult.ok || !queueItem) pushOnce(blockers, 'blocked_missing_mock_enqueue')

  if (input.enqueueResult.ok && input.enqueueResult.enqueueStatus !== 'queued_mock_contract_only') {
    pushOnce(blockers, 'blocked_enqueue_contract_invalid')
  }

  if (queueItem && (!queueItem.mockOnly || queueItem.payload.mockOnly !== true)) {
    pushOnce(blockers, 'blocked_queue_item_not_mock_only')
  }
  if (queueItem && queueItem.queueStatus !== 'queued') pushOnce(blockers, 'blocked_queue_item_not_queued')
  if (queueItem && queueItem.workerKind !== 'render_export') pushOnce(blockers, 'blocked_worker_kind_mismatch')

  if (
    input.workerSkeletonEnabled ||
    input.routeExecution ||
    input.workerDispatchAttempted ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    (queueItem && (
      !getPayloadFalse(queueItem, 'routeExecution') ||
      !getPayloadFalse(queueItem, 'workerDispatchAttempted') ||
      !getPayloadFalse(queueItem, 'workerExecution') ||
      !getPayloadFalse(queueItem, 'gpacMp4boxExecution') ||
      !getPayloadFalse(queueItem, 'mediaProcessing')
    ))
  ) {
    pushOnce(blockers, 'blocked_worker_execution_not_enabled')
  }
  if (input.storageTransfer || (queueItem && !getPayloadFalse(queueItem, 'storageTransfer'))) {
    pushOnce(blockers, 'blocked_storage_transfer_not_enabled')
  }
  if (
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    (queueItem && (!getPayloadFalse(queueItem, 'signedUrlCreation') || !getPayloadFalse(queueItem, 'publicArtifactCreation')))
  ) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  const ok = blockers.length === 0
  const sanitizedPayload = createSanitizedPayload(input)

  return {
    lane: input.lane,
    skeletonId: input.skeletonId,
    ok,
    skeletonStatus: ok ? 'registered_disabled_mock_worker_skeleton' : blockers[0],
    blockers,
    queueItem,
    sanitizedPayload,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box guarded worker skeleton is registered as disabled mock-only metadata; dispatch and tool execution remain blocked.'
      : `GPAC/MP4Box guarded worker skeleton blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-POLICY-MOCK-IMPLEMENTATION-1',
  }
}

export function summarizeGpacMp4boxGuardedWorkerSkeletonBoundary(): string[] {
  return [
    'The skeleton consumes only the mock queue metadata produced by the guarded enqueue contract.',
    'The skeleton is registered as disabled by default and does not call the worker dispatch service.',
    'No worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, or SQL execution is enabled.',
    'The next gate must define private artifact policy before any private artifact write/readback or tool execution can be considered.',
  ]
}
