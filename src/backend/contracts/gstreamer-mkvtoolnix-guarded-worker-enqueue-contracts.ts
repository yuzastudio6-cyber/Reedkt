import type { ISODateString } from '../../types/shared'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { queueMockJob } from '../services/job-queue-runtime-service'
import {
  validateGstreamerMkvtoolnixGuardedWorkerRouteRequest,
  type GstreamerMkvtoolnixGuardedWorkerRouteRequest,
  type GstreamerMkvtoolnixGuardedWorkerRouteStatus,
} from './gstreamer-mkvtoolnix-guarded-worker-route-contracts'

export type GstreamerMkvtoolnixGuardedWorkerEnqueueLane =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1'

export type GstreamerMkvtoolnixGuardedWorkerEnqueueStatus =
  | 'queued_mock_contract_only'
  | 'blocked_route_contract_invalid'
  | 'blocked_worker_dispatch_not_enabled'
  | 'blocked_worker_execution_not_enabled'
  | 'blocked_tool_execution_not_enabled'
  | 'blocked_media_processing_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'
  | 'blocked_idempotency_mismatch'
  | 'blocked_job_queue_gate_failed'

export interface GstreamerMkvtoolnixGuardedWorkerEnqueueInput {
  lane: GstreamerMkvtoolnixGuardedWorkerEnqueueLane
  routeRequest: GstreamerMkvtoolnixGuardedWorkerRouteRequest
  createdAt: ISODateString
  enqueueMode: 'mock_queue_contract_only'
  routeExecution: false
  workerDispatchAttempted: false
  workerExecution: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  mediaProcessing: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
}

export interface GstreamerMkvtoolnixGuardedWorkerEnqueueResult {
  lane: GstreamerMkvtoolnixGuardedWorkerEnqueueLane
  ok: boolean
  enqueueStatus: GstreamerMkvtoolnixGuardedWorkerEnqueueStatus
  blockers: GstreamerMkvtoolnixGuardedWorkerEnqueueStatus[]
  routeBlockers: GstreamerMkvtoolnixGuardedWorkerRouteStatus[]
  queueItem?: JobRuntimeQueueItem
  sanitizedPayload: {
    routeId: GstreamerMkvtoolnixGuardedWorkerRouteRequest['routeId']
    routePath: GstreamerMkvtoolnixGuardedWorkerRouteRequest['path']
    routeStatus: 'registered_disabled_backend_service_role_route_contract'
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyId: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: string
    privateInputManifestId: string
    expectedOutputManifestSchemaId: string
    expectedQaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    routeExecution: false
    workerDispatchAttempted: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1'
}

const NEXT_REQUIRED_GATE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1' as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

export function buildGstreamerMkvtoolnixGuardedWorkerEnqueueInput(input: {
  routeRequest: GstreamerMkvtoolnixGuardedWorkerRouteRequest
  createdAt: ISODateString
}): GstreamerMkvtoolnixGuardedWorkerEnqueueInput {
  return {
    lane: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1',
    routeRequest: input.routeRequest,
    createdAt: input.createdAt,
    enqueueMode: 'mock_queue_contract_only',
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

function createSanitizedPayload(
  input: GstreamerMkvtoolnixGuardedWorkerEnqueueInput,
): GstreamerMkvtoolnixGuardedWorkerEnqueueResult['sanitizedPayload'] {
  const { routeRequest } = input
  const { workerEnvelope } = routeRequest

  return {
    routeId: routeRequest.routeId,
    routePath: routeRequest.path,
    routeStatus: 'registered_disabled_backend_service_role_route_contract',
    workspaceId: routeRequest.routeIdempotencyBasis.workspaceId,
    projectId: routeRequest.routeIdempotencyBasis.projectId,
    approvedSnapshotId: routeRequest.approvedSnapshotRef.id,
    approvalRecordId: routeRequest.approvalRecordRef.id,
    creditPolicyId: routeRequest.creditPolicyRef.id,
    creditPolicyMode: routeRequest.creditPolicyRef.mode,
    jobId: routeRequest.jobRef.id,
    workerLeaseId: workerEnvelope.workerLeaseRef.id,
    routeIdempotencyKey: routeRequest.routeIdempotencyKey,
    commandTemplateId: workerEnvelope.commandTemplateRef.templateId,
    privateInputManifestId: workerEnvelope.privateInputManifestRef.id,
    expectedOutputManifestSchemaId: workerEnvelope.expectedOutputManifestSchemaRef.id,
    expectedQaReportSchemaId: workerEnvelope.expectedQaReportSchemaRef.id,
    cleanupPolicyId: workerEnvelope.cleanupPolicyRef.id,
    retentionPolicyId: workerEnvelope.retentionPolicyRef.id,
    failurePolicyId: workerEnvelope.failurePolicyRef.id,
    auditEventParentId: workerEnvelope.auditEventParentRef.id,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

export function validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput(
  input: GstreamerMkvtoolnixGuardedWorkerEnqueueInput,
): Omit<GstreamerMkvtoolnixGuardedWorkerEnqueueResult, 'queueItem'> {
  const blockers: GstreamerMkvtoolnixGuardedWorkerEnqueueStatus[] = []
  const routeValidation = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(input.routeRequest)

  if (!routeValidation.ok) pushOnce(blockers, 'blocked_route_contract_invalid')
  if (routeValidation.blockers.includes('blocked_idempotency_mismatch')) {
    pushOnce(blockers, 'blocked_idempotency_mismatch')
  }
  if (input.routeExecution || input.routeRequest.routeExecution) {
    pushOnce(blockers, 'blocked_route_contract_invalid')
  }
  if (input.workerDispatchAttempted || input.routeRequest.workerDispatch) {
    pushOnce(blockers, 'blocked_worker_dispatch_not_enabled')
  }
  if (input.workerExecution || input.routeRequest.workerExecution || input.routeRequest.workerEnvelope.safety.workerExecution) {
    pushOnce(blockers, 'blocked_worker_execution_not_enabled')
  }
  if (
    input.gstreamerExecution ||
    input.mkvtoolnixExecution ||
    input.routeRequest.gstreamerExecution ||
    input.routeRequest.mkvtoolnixExecution ||
    input.routeRequest.workerEnvelope.safety.gstreamerExecution ||
    input.routeRequest.workerEnvelope.safety.mkvtoolnixExecution
  ) {
    pushOnce(blockers, 'blocked_tool_execution_not_enabled')
  }
  if (input.mediaProcessing || input.routeRequest.mediaProcessing || input.routeRequest.workerEnvelope.safety.mediaProcessing) {
    pushOnce(blockers, 'blocked_media_processing_not_enabled')
  }
  if (
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.routeRequest.signedUrlCreation ||
    input.routeRequest.publicArtifactCreation ||
    input.routeRequest.workerEnvelope.safety.signedUrlCreation ||
    input.routeRequest.workerEnvelope.safety.publicArtifactCreation
  ) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (input.finalRenderExport || input.routeRequest.finalRenderExport || input.routeRequest.workerEnvelope.safety.finalRenderExport) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
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
      ? 'GStreamer/MKVToolNix guarded worker enqueue contract queued mock-only metadata; worker dispatch and tool execution remain disabled.'
      : `GStreamer/MKVToolNix guarded worker enqueue contract blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: NEXT_REQUIRED_GATE,
  }
}

export function enqueueGstreamerMkvtoolnixGuardedWorkerMock(
  db: MockDatabase,
  input: GstreamerMkvtoolnixGuardedWorkerEnqueueInput,
): GstreamerMkvtoolnixGuardedWorkerEnqueueResult {
  const validation = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput(input)

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
      sanitizedSummary: 'GStreamer/MKVToolNix guarded worker enqueue contract blocked by the local mock queue gate.',
    }
  }

  return {
    ...validation,
    queueItem,
  }
}

export function summarizeGstreamerMkvtoolnixGuardedWorkerEnqueueBoundary(): string[] {
  return [
    'Mock enqueue consumes the disabled backend-service-role route contract and sanitized worker envelope refs only.',
    'The queue item is mock-only metadata with no route execution, no worker dispatch attempt, no worker execution, no GStreamer execution, no MKVToolNix execution, and no media processing.',
    'Approved snapshot, approval record, credit/no-spend policy, job, disabled worker lease, route idempotency, command-template, private manifest, output manifest, QA, cleanup, retention, failure, and audit refs remain required.',
    'The next gate must implement a separate guarded worker skeleton before any runtime worker execution path can be considered.',
  ]
}
