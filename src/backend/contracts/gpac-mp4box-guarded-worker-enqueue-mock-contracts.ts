import type { ISODateString } from '../../types/shared'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { queueMockJob } from '../services/job-queue-runtime-service'
import {
  validateGpacMp4boxGuardedServiceRoleRouteMockRequest,
  type GpacMp4boxGuardedServiceRoleRouteMockRequest,
  type GpacMp4boxGuardedServiceRoleRouteStatus,
} from './gpac-mp4box-guarded-service-role-route-mock-contracts'

export type GpacMp4boxGuardedWorkerEnqueueLane =
  'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxGuardedWorkerEnqueueStatus =
  | 'queued_mock_contract_only'
  | 'blocked_route_mock_contract_invalid'
  | 'blocked_worker_execution_not_enabled'
  | 'blocked_storage_transfer_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_idempotency_mismatch'
  | 'blocked_job_queue_gate_failed'

export interface GpacMp4boxGuardedWorkerEnqueueMockInput {
  lane: GpacMp4boxGuardedWorkerEnqueueLane
  routeRequest: GpacMp4boxGuardedServiceRoleRouteMockRequest
  createdAt: ISODateString
  enqueueMode: 'mock_queue_contract_only'
  routeExecution: false
  workerDispatchAttempted: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
}

export interface GpacMp4boxGuardedWorkerEnqueueMockResult {
  lane: GpacMp4boxGuardedWorkerEnqueueLane
  ok: boolean
  enqueueStatus: GpacMp4boxGuardedWorkerEnqueueStatus
  blockers: GpacMp4boxGuardedWorkerEnqueueStatus[]
  routeBlockers: GpacMp4boxGuardedServiceRoleRouteStatus[]
  queueItem?: JobRuntimeQueueItem
  sanitizedPayload: {
    routeId: GpacMp4boxGuardedServiceRoleRouteMockRequest['routeId']
    routePath: GpacMp4boxGuardedServiceRoleRouteMockRequest['path']
    routeStatus: 'registered_disabled_backend_required'
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditReservationId: string
    jobId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: string
    privateInputManifestId: string
    privateArtifactManifestId: string
    privateArtifactChecksumId: string
    qaPolicyId: string
    cleanupPolicyId: string
    auditRecordId: string
    runtimeExecution: false
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
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1'
}

export function buildGpacMp4boxGuardedWorkerEnqueueMockInput(input: {
  routeRequest: GpacMp4boxGuardedServiceRoleRouteMockRequest
  createdAt: ISODateString
}): GpacMp4boxGuardedWorkerEnqueueMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1',
    routeRequest: input.routeRequest,
    createdAt: input.createdAt,
    enqueueMode: 'mock_queue_contract_only',
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

function createSanitizedPayload(
  input: GpacMp4boxGuardedWorkerEnqueueMockInput,
): GpacMp4boxGuardedWorkerEnqueueMockResult['sanitizedPayload'] {
  const { routeRequest } = input
  const { workerEnvelope } = routeRequest

  return {
    routeId: routeRequest.routeId,
    routePath: routeRequest.path,
    routeStatus: 'registered_disabled_backend_required',
    workspaceId: routeRequest.routeIdempotencyBasis.workspaceId,
    projectId: routeRequest.routeIdempotencyBasis.projectId,
    approvedSnapshotId: routeRequest.approvedSnapshotRef.id,
    approvalRecordId: routeRequest.approvalRecordRef.id,
    creditReservationId: routeRequest.creditReservationRef.id,
    jobId: routeRequest.jobRef.id,
    workerLeaseId: workerEnvelope.workerLeaseRef.id,
    routeIdempotencyKey: workerEnvelope.routeIdempotencyKey,
    commandTemplateId: workerEnvelope.commandTemplateId,
    privateInputManifestId: workerEnvelope.privateInputManifestRef.id,
    privateArtifactManifestId: workerEnvelope.privateArtifactManifestRef.id,
    privateArtifactChecksumId: workerEnvelope.privateArtifactChecksumRef.id,
    qaPolicyId: workerEnvelope.qaPolicyRef.id,
    cleanupPolicyId: workerEnvelope.cleanupPolicyRef.id,
    auditRecordId: workerEnvelope.auditRecordRef.id,
    runtimeExecution: false,
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

export function validateGpacMp4boxGuardedWorkerEnqueueMockInput(
  input: GpacMp4boxGuardedWorkerEnqueueMockInput,
): Omit<GpacMp4boxGuardedWorkerEnqueueMockResult, 'queueItem'> {
  const blockers: GpacMp4boxGuardedWorkerEnqueueStatus[] = []
  const routeValidation = validateGpacMp4boxGuardedServiceRoleRouteMockRequest(input.routeRequest)

  if (!routeValidation.ok) pushOnce(blockers, 'blocked_route_mock_contract_invalid')
  if (routeValidation.blockers.includes('blocked_idempotency_mismatch')) {
    pushOnce(blockers, 'blocked_idempotency_mismatch')
  }
  if (
    input.routeExecution ||
    input.workerDispatchAttempted ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.routeRequest.routeExecution ||
    input.routeRequest.workerExecution ||
    input.routeRequest.gpacMp4boxExecution ||
    input.routeRequest.workerEnvelope.routeExecution ||
    input.routeRequest.workerEnvelope.workerExecution ||
    input.routeRequest.workerEnvelope.runtimeExecution
  ) {
    pushOnce(blockers, 'blocked_worker_execution_not_enabled')
  }
  if (input.storageTransfer || input.routeRequest.storageTransfer) {
    pushOnce(blockers, 'blocked_storage_transfer_not_enabled')
  }
  if (
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.routeRequest.signedUrlCreation ||
    input.routeRequest.publicArtifactCreation ||
    input.routeRequest.workerEnvelope.privateArtifactManifestRef.signedUrlsAllowed ||
    input.routeRequest.workerEnvelope.privateArtifactManifestRef.publicArtifactsAllowed
  ) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  const sanitizedPayload = createSanitizedPayload(input)
  const ok = blockers.length === 0

  return {
    lane: input.lane,
    ok,
    enqueueStatus: ok ? 'queued_mock_contract_only' : blockers[0],
    blockers,
    routeBlockers: routeValidation.blockers,
    sanitizedPayload,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box guarded worker enqueue mock is queued as metadata only; worker dispatch and tool execution remain disabled.'
      : `GPAC/MP4Box guarded worker enqueue mock blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1',
  }
}

export function enqueueGpacMp4boxGuardedWorkerMock(
  db: MockDatabase,
  input: GpacMp4boxGuardedWorkerEnqueueMockInput,
): GpacMp4boxGuardedWorkerEnqueueMockResult {
  const validation = validateGpacMp4boxGuardedWorkerEnqueueMockInput(input)

  if (!validation.ok) return validation

  const queueItem = queueMockJob(db, {
    workspaceId: validation.sanitizedPayload.workspaceId,
    projectId: validation.sanitizedPayload.projectId,
    editPlanId: validation.sanitizedPayload.approvedSnapshotId,
    jobId: validation.sanitizedPayload.jobId,
    workerKind: 'render_export',
    mockSafe: true,
    requiresEditPlanApproval: false,
    requiresCreditEstimateApproval: false,
    requiresCreditReservation: false,
    requiresGenerationRequest: false,
    requiresProvider: false,
    requiresRequiredAssets: false,
    requiresTimingReadiness: false,
    requiresBackendRuntime: false,
    payload: {
      lane: input.lane,
      enqueueMode: input.enqueueMode,
      ...validation.sanitizedPayload,
    },
  })

  if (queueItem.queueStatus !== 'queued' || !queueItem.mockOnly || queueItem.payload.mockOnly !== true) {
    return {
      ...validation,
      ok: false,
      enqueueStatus: 'blocked_job_queue_gate_failed',
      blockers: ['blocked_job_queue_gate_failed'],
      queueItem,
      sanitizedSummary: 'GPAC/MP4Box guarded worker enqueue mock blocked by the local mock job queue gate.',
    }
  }

  return {
    ...validation,
    queueItem,
  }
}

export function summarizeGpacMp4boxGuardedWorkerEnqueueBoundary(): string[] {
  return [
    'Mock enqueue consumes the disabled backend/service-role route mock contract and sanitized worker envelope refs only.',
    'The queue item is mock-only metadata with no route execution, worker dispatch, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, or public artifact creation.',
    'Approved snapshot, approval record, credit reservation, job, worker lease, private manifests, checksum, QA, cleanup, audit, idempotency, and command-template refs remain the source-of-truth inputs.',
    'The next gate must still implement a separate guarded worker skeleton before any worker execution path can be considered.',
  ]
}
