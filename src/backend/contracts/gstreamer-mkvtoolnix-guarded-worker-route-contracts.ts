import type { ID, ISODateString } from '../../types/shared'
import {
  buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput,
  validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput,
  type GstreamerMkvtoolnixAllowedCommandTemplateId,
  type GstreamerMkvtoolnixDisabledWorkerScaffoldInput,
  type GstreamerMkvtoolnixDisabledWorkerScaffoldRef,
  type GstreamerMkvtoolnixDisabledWorkerScaffoldStatus,
} from './gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts'

export type GstreamerMkvtoolnixGuardedWorkerRouteLane =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1'

export type GstreamerMkvtoolnixGuardedWorkerRouteId =
  'externalBeta.gstreamerMkvtoolnix.guardedWorkerRoute'

export type GstreamerMkvtoolnixGuardedWorkerRouteStatus =
  | 'registered_disabled_backend_service_role_route_contract'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_missing_approved_plan_snapshot'
  | 'blocked_missing_approval_record'
  | 'blocked_missing_credit_or_no_spend_policy'
  | 'blocked_missing_worker_lease'
  | 'blocked_missing_idempotency_key'
  | 'blocked_worker_contract_validation_failed'
  | 'blocked_idempotency_mismatch'
  | 'blocked_unapproved_command_template'
  | 'blocked_runtime_execution_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixServiceRoleRouteContextRef {
  owner: 'backend_service_role_only'
  serviceRoleOwned: true
  serviceRoleSecretPayloadAccess: false
  frontendCredentialExposure: false
  broadServiceRoleHandler: false
}

export interface GstreamerMkvtoolnixRouteIdempotencyBasis {
  workspaceId: ID
  projectId: ID
  approvedSnapshotId: ID
  jobId: ID
  commandTemplateId: GstreamerMkvtoolnixAllowedCommandTemplateId
}

export interface GstreamerMkvtoolnixGuardedWorkerRouteRequest {
  lane: GstreamerMkvtoolnixGuardedWorkerRouteLane
  routeId: GstreamerMkvtoolnixGuardedWorkerRouteId
  method: 'POST'
  path: '/api/external-beta/gstreamer-mkvtoolnix/worker/mock'
  routeOwner: 'backend_service_role_only'
  routeClass: 'guarded_disabled_route_contract_first'
  serviceRoleContextRef: GstreamerMkvtoolnixServiceRoleRouteContextRef
  approvedSnapshotRef: GstreamerMkvtoolnixDisabledWorkerScaffoldInput['approvedPlanSnapshotRef']
  approvalRecordRef: GstreamerMkvtoolnixDisabledWorkerScaffoldInput['approvalRecordRef']
  creditPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldInput['creditPolicyRef']
  jobRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  workerEnvelope: GstreamerMkvtoolnixDisabledWorkerScaffoldInput
  routeIdempotencyBasis: GstreamerMkvtoolnixRouteIdempotencyBasis
  routeIdempotencyKey: string
  createdAt: ISODateString
  routeRegistered: true
  routeEnabled: false
  routeExecution: false
  workerDispatch: false
  workerExecution: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  mediaProcessing: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
}

export interface GstreamerMkvtoolnixGuardedWorkerRouteValidationResult {
  ok: boolean
  routeStatus: GstreamerMkvtoolnixGuardedWorkerRouteStatus
  blockers: GstreamerMkvtoolnixGuardedWorkerRouteStatus[]
  workerBlockers: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus[]
  sanitizedSummary: string
  nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1'
}

export interface GstreamerMkvtoolnixGuardedWorkerRouteResponse {
  routeId: GstreamerMkvtoolnixGuardedWorkerRouteId
  routeStatus: 'registered_disabled_backend_service_role_route_contract'
  jobRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  sanitizedBlockers: GstreamerMkvtoolnixGuardedWorkerRouteStatus[]
  workerBlockers: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus[]
  manifestRefs: {
    privateInputManifestRef: GstreamerMkvtoolnixDisabledWorkerScaffoldInput['privateInputManifestRef']
    expectedOutputManifestSchemaRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  }
  qaReportRefs: {
    expectedQaReportSchemaRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  }
  cleanupRefs: {
    cleanupPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
    retentionPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
    failurePolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  }
  auditRefs: {
    auditEventParentRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  }
  routeIdempotencyKey: string
  nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1'
  routeExecution: false
  workerDispatch: false
  workerExecution: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  mediaProcessing: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
}

export const GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_ID:
GstreamerMkvtoolnixGuardedWorkerRouteId = 'externalBeta.gstreamerMkvtoolnix.guardedWorkerRoute'

export const GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_PATH =
  '/api/external-beta/gstreamer-mkvtoolnix/worker/mock' as const

const NEXT_REQUIRED_GATE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1' as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function mapWorkerBlocker(
  blocker: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus,
): GstreamerMkvtoolnixGuardedWorkerRouteStatus | undefined {
  switch (blocker) {
    case 'blocked_missing_approved_plan_snapshot':
      return 'blocked_missing_approved_plan_snapshot'
    case 'blocked_missing_approval_record':
      return 'blocked_missing_approval_record'
    case 'blocked_missing_credit_or_no_spend_policy':
      return 'blocked_missing_credit_or_no_spend_policy'
    case 'blocked_missing_worker_lease':
      return 'blocked_missing_worker_lease'
    case 'blocked_missing_idempotency_key':
      return 'blocked_missing_idempotency_key'
    case 'blocked_unapproved_command_template':
    case 'blocked_raw_command_string':
      return 'blocked_unapproved_command_template'
    case 'blocked_worker_or_tool_execution_attempt':
      return 'blocked_runtime_execution_not_enabled'
    case 'blocked_public_or_signed_url_source':
      return 'blocked_public_or_signed_artifact_attempt'
    case 'blocked_delivery_or_unlock_attempt':
      return 'blocked_delivery_or_unlock_attempt'
    default:
      return undefined
  }
}

export function buildGstreamerMkvtoolnixGuardedWorkerRouteIdempotencyKey(
  basis: GstreamerMkvtoolnixRouteIdempotencyBasis,
): string {
  return [
    'gstreamer-mkvtoolnix',
    basis.workspaceId,
    basis.projectId,
    basis.approvedSnapshotId,
    basis.jobId,
    basis.commandTemplateId,
  ].join(':')
}

export function buildGstreamerMkvtoolnixGuardedWorkerRouteRequest(input: {
  createdAt: ISODateString
  workspaceId?: ID
  projectId?: ID
  approvedSnapshotId?: ID
  jobId?: ID
  commandTemplateId?: GstreamerMkvtoolnixAllowedCommandTemplateId
}): GstreamerMkvtoolnixGuardedWorkerRouteRequest {
  const commandTemplateId = input.commandTemplateId ?? 'gst_controlled_generated_fixture_pipeline_v1'
  const approvedSnapshotId =
    input.approvedSnapshotId ?? 'approved-snapshot-gstreamer-mkvtoolnix-guarded-worker-route'
  const jobId = input.jobId ?? 'job-gstreamer-mkvtoolnix-guarded-worker-route'
  const routeIdempotencyBasis = {
    workspaceId: input.workspaceId ?? 'workspace-gstreamer-mkvtoolnix-guarded-worker-route',
    projectId: input.projectId ?? 'project-gstreamer-mkvtoolnix-guarded-worker-route',
    approvedSnapshotId,
    jobId,
    commandTemplateId,
  }
  const routeIdempotencyKey = buildGstreamerMkvtoolnixGuardedWorkerRouteIdempotencyKey(routeIdempotencyBasis)
  const workerEnvelope = buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
    createdAt: input.createdAt,
    approvedPlanSnapshotId: approvedSnapshotId,
    commandTemplateId,
  })

  return {
    lane: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1',
    routeId: GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_ID,
    method: 'POST',
    path: GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_PATH,
    routeOwner: 'backend_service_role_only',
    routeClass: 'guarded_disabled_route_contract_first',
    serviceRoleContextRef: {
      owner: 'backend_service_role_only',
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    approvedSnapshotRef: workerEnvelope.approvedPlanSnapshotRef,
    approvalRecordRef: workerEnvelope.approvalRecordRef,
    creditPolicyRef: workerEnvelope.creditPolicyRef,
    jobRef: {
      ...workerEnvelope.jobRef,
      id: jobId,
    },
    workerEnvelope: {
      ...workerEnvelope,
      jobRef: {
        ...workerEnvelope.jobRef,
        id: jobId,
      },
      idempotencyRef: {
        ...workerEnvelope.idempotencyRef,
        id: routeIdempotencyKey,
      },
    },
    routeIdempotencyBasis,
    routeIdempotencyKey,
    createdAt: input.createdAt,
    routeRegistered: true,
    routeEnabled: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

export function validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(
  request: GstreamerMkvtoolnixGuardedWorkerRouteRequest,
): GstreamerMkvtoolnixGuardedWorkerRouteValidationResult {
  const blockers: GstreamerMkvtoolnixGuardedWorkerRouteStatus[] = []
  const workerValidation = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput(request.workerEnvelope)

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

  for (const workerBlocker of workerValidation.blockers) {
    const mapped = mapWorkerBlocker(workerBlocker)
    if (mapped) pushOnce(blockers, mapped)
  }

  if (!workerValidation.ok) {
    pushOnce(blockers, 'blocked_worker_contract_validation_failed')
  }

  const expectedIdempotencyKey = buildGstreamerMkvtoolnixGuardedWorkerRouteIdempotencyKey(
    request.routeIdempotencyBasis,
  )
  if (!request.routeIdempotencyKey.trim() || !request.workerEnvelope.idempotencyRef.id.trim()) {
    pushOnce(blockers, 'blocked_missing_idempotency_key')
  }
  if (
    request.routeIdempotencyKey !== expectedIdempotencyKey ||
    request.workerEnvelope.idempotencyRef.id !== expectedIdempotencyKey
  ) {
    pushOnce(blockers, 'blocked_idempotency_mismatch')
  }

  if (
    request.routeEnabled ||
    request.routeExecution ||
    request.workerDispatch ||
    request.workerExecution ||
    request.gstreamerExecution ||
    request.mkvtoolnixExecution ||
    request.mediaProcessing ||
    request.workerEnvelope.safety.serviceRoleRouteExecution ||
    request.workerEnvelope.safety.routeExecution ||
    request.workerEnvelope.safety.workerDispatch ||
    request.workerEnvelope.safety.workerExecution ||
    request.workerEnvelope.safety.gstreamerExecution ||
    request.workerEnvelope.safety.mkvtoolnixExecution ||
    request.workerEnvelope.safety.mediaProcessing
  ) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  if (
    request.signedUrlCreation ||
    request.publicArtifactCreation ||
    request.workerEnvelope.safety.signedUrlCreation ||
    request.workerEnvelope.safety.publicArtifactCreation
  ) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  if (request.finalRenderExport || request.workerEnvelope.safety.finalRenderExport) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  return {
    ok: blockers.length === 0,
    routeStatus: blockers[0] ?? 'registered_disabled_backend_service_role_route_contract',
    blockers,
    workerBlockers: workerValidation.blockers,
    sanitizedSummary: blockers.length === 0
      ? 'GStreamer/MKVToolNix guarded worker route contract is backend-service-role-only, registered disabled, and ready for worker enqueue planning with no runtime execution.'
      : `GStreamer/MKVToolNix guarded worker route contract blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: NEXT_REQUIRED_GATE,
  }
}

export function createGstreamerMkvtoolnixGuardedWorkerRouteResponse(
  request: GstreamerMkvtoolnixGuardedWorkerRouteRequest,
): GstreamerMkvtoolnixGuardedWorkerRouteResponse {
  const validation = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(request)

  return {
    routeId: request.routeId,
    routeStatus: 'registered_disabled_backend_service_role_route_contract',
    jobRef: request.jobRef,
    sanitizedBlockers: validation.blockers,
    workerBlockers: validation.workerBlockers,
    manifestRefs: {
      privateInputManifestRef: request.workerEnvelope.privateInputManifestRef,
      expectedOutputManifestSchemaRef: request.workerEnvelope.expectedOutputManifestSchemaRef,
    },
    qaReportRefs: {
      expectedQaReportSchemaRef: request.workerEnvelope.expectedQaReportSchemaRef,
    },
    cleanupRefs: {
      cleanupPolicyRef: request.workerEnvelope.cleanupPolicyRef,
      retentionPolicyRef: request.workerEnvelope.retentionPolicyRef,
      failurePolicyRef: request.workerEnvelope.failurePolicyRef,
    },
    auditRefs: {
      auditEventParentRef: request.workerEnvelope.auditEventParentRef,
    },
    routeIdempotencyKey: request.routeIdempotencyKey,
    nextRequiredGate: NEXT_REQUIRED_GATE,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

export function summarizeGstreamerMkvtoolnixGuardedWorkerRouteBoundary(): string[] {
  return [
    'Backend-service-role-only route contract metadata; no browser/frontend execution surface.',
    'Route is registered disabled and cannot dispatch workers, execute routes, invoke GStreamer, invoke MKVToolNix, process media, or create artifacts.',
    'The request must carry approved snapshot, approval record, credit/no-spend policy, job, disabled worker lease, route idempotency, command-template, private manifest, output manifest, QA, cleanup, retention, failure, and audit references.',
    'Rejected inputs include raw chat, raw command strings, frontend paths, public URL or signed URL source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, broad service-role handlers, final render/export, and unlock attempts.',
    'The next gate is worker enqueue implementation; runtime execution remains blocked until a later explicit confirmed runtime packet.',
  ]
}
