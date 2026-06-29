import type { ID, ISODateString } from '../../types/shared'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  validateGpacMp4boxMockWorkerEnvelope,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
  type GpacMp4boxReference,
} from './gpac-mp4box-mock-worker-interface-contracts'

export type GpacMp4boxGuardedServiceRoleRouteLane =
  'TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxGuardedServiceRoleRouteId = 'render.gpacMp4box.serviceRolePackageMock'

export type GpacMp4boxGuardedServiceRoleRouteStatus =
  | 'registered_disabled_backend_required'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_missing_credit_reservation'
  | 'blocked_worker_contract_validation_failed'
  | 'blocked_idempotency_mismatch'
  | 'blocked_runtime_execution_not_enabled'
  | 'blocked_storage_transfer_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'

export interface GpacMp4boxServiceRoleRouteContextRef {
  owner: 'backend_service_role_only'
  serviceRoleOwned: true
  serviceRoleSecretPayloadAccess: false
  frontendCredentialExposure: false
  broadServiceRoleHandler: false
}

export interface GpacMp4boxRouteIdempotencyBasis {
  workspaceId: ID
  projectId: ID
  approvedSnapshotId: ID
  jobId: ID
  commandTemplateId: GpacMp4boxCommandTemplateId
}

export interface GpacMp4boxGuardedServiceRoleRouteMockRequest {
  lane: GpacMp4boxGuardedServiceRoleRouteLane
  routeId: GpacMp4boxGuardedServiceRoleRouteId
  method: 'POST'
  path: '/api/render/gpac-mp4box/package/mock'
  routeOwner: 'backend_service_role_only'
  routeClass: 'guarded_mock_route_implementation_first'
  serviceRoleContextRef: GpacMp4boxServiceRoleRouteContextRef
  approvedSnapshotRef: GpacMp4boxReference
  approvalRecordRef: GpacMp4boxReference
  creditReservationRef: GpacMp4boxReference
  jobRef: GpacMp4boxReference
  workerEnvelope: GpacMp4boxMockWorkerJobEnvelope
  routeIdempotencyBasis: GpacMp4boxRouteIdempotencyBasis
  createdAt: ISODateString
  runtimeMode: 'backend_required'
  routeRegistered: true
  routeEnabled: false
  routeExecution: false
  workerExecution: false
  gpacMp4boxExecution: false
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
}

export interface GpacMp4boxGuardedServiceRoleRouteMockValidationResult {
  ok: boolean
  routeStatus: GpacMp4boxGuardedServiceRoleRouteStatus
  blockers: GpacMp4boxGuardedServiceRoleRouteStatus[]
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1'
}

export interface GpacMp4boxGuardedServiceRoleRouteMockResponse {
  routeId: GpacMp4boxGuardedServiceRoleRouteId
  routeStatus: 'registered_disabled_backend_required'
  jobRef: GpacMp4boxReference
  sanitizedBlockers: GpacMp4boxGuardedServiceRoleRouteStatus[]
  manifestRefs: {
    privateInputManifestRef: GpacMp4boxMockWorkerJobEnvelope['privateInputManifestRef']
    privateArtifactManifestRef: GpacMp4boxMockWorkerJobEnvelope['privateArtifactManifestRef']
    privateArtifactChecksumRef: GpacMp4boxReference
  }
  qaReportRefs: {
    qaPolicyRef: GpacMp4boxMockWorkerJobEnvelope['qaPolicyRef']
  }
  cleanupRefs: {
    cleanupPolicyRef: GpacMp4boxMockWorkerJobEnvelope['cleanupPolicyRef']
  }
  auditRefs: {
    auditRecordRef: GpacMp4boxReference
  }
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1'
  runtimeExecution: false
  routeExecution: false
  workerExecution: false
  gpacMp4boxExecution: false
  storageTransfer: false
  publicArtifactCreation: false
  signedUrlCreation: false
}

export const GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID:
GpacMp4boxGuardedServiceRoleRouteId = 'render.gpacMp4box.serviceRolePackageMock'

export const GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_PATH =
  '/api/render/gpac-mp4box/package/mock' as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

export function buildGpacMp4boxGuardedServiceRoleRouteMockRequest(input: {
  workerEnvelope: GpacMp4boxMockWorkerJobEnvelope
  creditReservationRef: GpacMp4boxReference
  routeIdempotencyBasis: GpacMp4boxRouteIdempotencyBasis
  createdAt: ISODateString
}): GpacMp4boxGuardedServiceRoleRouteMockRequest {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1',
    routeId: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID,
    method: 'POST',
    path: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_PATH,
    routeOwner: 'backend_service_role_only',
    routeClass: 'guarded_mock_route_implementation_first',
    serviceRoleContextRef: {
      owner: 'backend_service_role_only',
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    approvedSnapshotRef: input.workerEnvelope.approvedSnapshotRef,
    approvalRecordRef: input.workerEnvelope.approvalRecordRef,
    creditReservationRef: input.creditReservationRef,
    jobRef: input.workerEnvelope.jobRef,
    workerEnvelope: input.workerEnvelope,
    routeIdempotencyBasis: input.routeIdempotencyBasis,
    createdAt: input.createdAt,
    runtimeMode: 'backend_required',
    routeRegistered: true,
    routeEnabled: false,
    routeExecution: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
  }
}

export function validateGpacMp4boxGuardedServiceRoleRouteMockRequest(
  request: GpacMp4boxGuardedServiceRoleRouteMockRequest,
): GpacMp4boxGuardedServiceRoleRouteMockValidationResult {
  const blockers: GpacMp4boxGuardedServiceRoleRouteStatus[] = []
  const workerValidation = validateGpacMp4boxMockWorkerEnvelope(request.workerEnvelope)

  if (
    request.routeOwner !== 'backend_service_role_only' ||
    request.serviceRoleContextRef.owner !== 'backend_service_role_only' ||
    request.serviceRoleContextRef.serviceRoleOwned !== true ||
    request.serviceRoleContextRef.serviceRoleSecretPayloadAccess !== false ||
    request.serviceRoleContextRef.frontendCredentialExposure !== false ||
    request.serviceRoleContextRef.broadServiceRoleHandler !== false
  ) {
    pushOnce(blockers, 'blocked_missing_backend_service_role_context')
  }

  if (!request.creditReservationRef.id?.trim() || request.creditReservationRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_credit_reservation')
  }

  if (!workerValidation.ok) pushOnce(blockers, 'blocked_worker_contract_validation_failed')

  const expectedIdempotencyKey = buildGpacMp4boxMockWorkerRouteIdempotencyKey(request.routeIdempotencyBasis)
  if (request.workerEnvelope.routeIdempotencyKey !== expectedIdempotencyKey) {
    pushOnce(blockers, 'blocked_idempotency_mismatch')
  }

  if (
    request.routeEnabled ||
    request.routeExecution ||
    request.workerExecution ||
    request.gpacMp4boxExecution ||
    request.workerEnvelope.routeExecution ||
    request.workerEnvelope.workerExecution ||
    request.workerEnvelope.runtimeExecution
  ) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  if (request.storageTransfer) pushOnce(blockers, 'blocked_storage_transfer_not_enabled')
  if (request.publicArtifactCreation || request.signedUrlCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  return {
    ok: blockers.length === 0,
    routeStatus: blockers[0] ?? 'registered_disabled_backend_required',
    blockers,
    sanitizedSummary: blockers.length === 0
      ? 'GPAC/MP4Box guarded service-role route mock interface is registered and backend-required while runtime execution remains disabled.'
      : `GPAC/MP4Box guarded service-role route mock interface blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1',
  }
}

export function createGpacMp4boxGuardedServiceRoleRouteMockResponse(
  request: GpacMp4boxGuardedServiceRoleRouteMockRequest,
): GpacMp4boxGuardedServiceRoleRouteMockResponse {
  const validation = validateGpacMp4boxGuardedServiceRoleRouteMockRequest(request)

  return {
    routeId: request.routeId,
    routeStatus: 'registered_disabled_backend_required',
    jobRef: request.jobRef,
    sanitizedBlockers: validation.blockers,
    manifestRefs: {
      privateInputManifestRef: request.workerEnvelope.privateInputManifestRef,
      privateArtifactManifestRef: request.workerEnvelope.privateArtifactManifestRef,
      privateArtifactChecksumRef: request.workerEnvelope.privateArtifactChecksumRef,
    },
    qaReportRefs: {
      qaPolicyRef: request.workerEnvelope.qaPolicyRef,
    },
    cleanupRefs: {
      cleanupPolicyRef: request.workerEnvelope.cleanupPolicyRef,
    },
    auditRefs: {
      auditRecordRef: request.workerEnvelope.auditRecordRef,
    },
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1',
    runtimeExecution: false,
    routeExecution: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    storageTransfer: false,
    publicArtifactCreation: false,
    signedUrlCreation: false,
  }
}

export function summarizeGpacMp4boxGuardedServiceRoleRouteBoundary(): string[] {
  return [
    'Backend/service-role-owned route metadata only.',
    'Route is registered as backend-required and disabled for runtime execution by default.',
    'The mock route contract requires approved snapshot, approval record, credit reservation, job, worker lease, private manifests, checksum, QA, cleanup, audit, idempotency, and command-template refs.',
    'Raw chat, raw command strings, frontend paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads remain rejected.',
    'No route execution, worker execution, GPAC/MP4Box execution, media processing, storage transfer, Supabase mutation, SQL execution, signed/public artifacts, external beta expansion, paid production, or production unlock is enabled.',
  ]
}
