import type { ISODateString } from '../../types/shared'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import {
  type GstreamerMkvtoolnixGuardedWorkerEnqueueResult,
} from './gstreamer-mkvtoolnix-guarded-worker-enqueue-contracts'
import {
  type GstreamerMkvtoolnixAllowedCommandTemplateId,
} from './gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts'

export type GstreamerMkvtoolnixGuardedWorkerSkeletonLane =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1'

export type GstreamerMkvtoolnixGuardedWorkerSkeletonId =
  'worker.gstreamerMkvtoolnix.guarded.disabledSkeleton'

export type GstreamerMkvtoolnixGuardedWorkerSkeletonStatus =
  | 'registered_disabled_worker_skeleton_metadata_only'
  | 'blocked_missing_mock_enqueue'
  | 'blocked_enqueue_contract_invalid'
  | 'blocked_queue_item_not_mock_only'
  | 'blocked_queue_item_not_queued'
  | 'blocked_worker_kind_mismatch'
  | 'blocked_skeleton_mode_not_disabled'
  | 'blocked_missing_required_metadata'
  | 'blocked_raw_or_unapproved_input_attempt'
  | 'blocked_worker_dispatch_not_enabled'
  | 'blocked_worker_execution_not_enabled'
  | 'blocked_tool_execution_not_enabled'
  | 'blocked_media_processing_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixGuardedWorkerSkeletonInput {
  lane: GstreamerMkvtoolnixGuardedWorkerSkeletonLane
  skeletonId: GstreamerMkvtoolnixGuardedWorkerSkeletonId
  enqueueResult: GstreamerMkvtoolnixGuardedWorkerEnqueueResult
  createdAt: ISODateString
  skeletonMode: 'disabled_worker_skeleton_metadata_only'
  workerOwner: 'backend_worker_only'
  workerKind: 'render_export'
  workerSkeletonRegistered: true
  workerSkeletonEnabled: false
  queueConsumptionMode: 'metadata_validation_only'
  rawCommandStringsAllowed: false
  rawChatAllowed: false
  frontendFilePathAllowed: false
  publicUrlSourceOfTruthAllowed: false
  signedUrlSourceOfTruthAllowed: false
  arbitraryPrivateMediaAllowed: false
  serviceRoleSecretPayloadAccess: false
  broadServiceRoleHandler: false
  routeExecution: false
  workerDispatchAttempted: false
  workerExecution: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  ffmpegFfprobeExecution: false
  dockerExecution: false
  remotionExecution: false
  mediaProcessing: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface GstreamerMkvtoolnixGuardedWorkerSkeletonResult {
  lane: GstreamerMkvtoolnixGuardedWorkerSkeletonLane
  skeletonId: GstreamerMkvtoolnixGuardedWorkerSkeletonId
  ok: boolean
  skeletonStatus: GstreamerMkvtoolnixGuardedWorkerSkeletonStatus
  blockers: GstreamerMkvtoolnixGuardedWorkerSkeletonStatus[]
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
    creditPolicyId: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation' | ''
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: GstreamerMkvtoolnixAllowedCommandTemplateId | ''
    privateInputManifestId: string
    expectedOutputManifestSchemaId: string
    expectedQaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    workerSkeletonEnabled: false
    routeExecution: false
    workerDispatchAttempted: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    mediaProcessing: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1'
}

const NEXT_REQUIRED_GATE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1' as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function getPayloadString(queueItem: JobRuntimeQueueItem | undefined, key: string): string {
  const value = queueItem?.payload[key]
  return typeof value === 'string' ? value : ''
}

function getPayloadFalse(queueItem: JobRuntimeQueueItem | undefined, key: string): boolean {
  return queueItem?.payload[key] === false
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function hasRequiredMetadata(queueItem: JobRuntimeQueueItem | undefined): boolean {
  return [
    'approvedSnapshotId',
    'approvalRecordId',
    'creditPolicyId',
    'jobId',
    'workerLeaseId',
    'routeIdempotencyKey',
    'commandTemplateId',
    'privateInputManifestId',
    'expectedOutputManifestSchemaId',
    'expectedQaReportSchemaId',
    'cleanupPolicyId',
    'retentionPolicyId',
    'failurePolicyId',
    'auditEventParentId',
  ].every((key) => hasText(getPayloadString(queueItem, key)))
}

function createSanitizedPayload(
  input: GstreamerMkvtoolnixGuardedWorkerSkeletonInput,
): GstreamerMkvtoolnixGuardedWorkerSkeletonResult['sanitizedPayload'] {
  const queueItem = input.enqueueResult.queueItem
  const creditPolicyMode = getPayloadString(queueItem, 'creditPolicyMode')
  const commandTemplateId = getPayloadString(queueItem, 'commandTemplateId')

  return {
    queueItemId: queueItem?.id ?? '',
    jobId: queueItem?.jobId ?? '',
    workspaceId: queueItem?.workspaceId ?? '',
    projectId: queueItem?.projectId ?? '',
    workerKind: 'render_export',
    queueStatus: 'queued',
    approvedSnapshotId: getPayloadString(queueItem, 'approvedSnapshotId'),
    approvalRecordId: getPayloadString(queueItem, 'approvalRecordId'),
    creditPolicyId: getPayloadString(queueItem, 'creditPolicyId'),
    creditPolicyMode: creditPolicyMode === 'no_spend_fixture_policy' || creditPolicyMode === 'credit_reservation'
      ? creditPolicyMode
      : '',
    workerLeaseId: getPayloadString(queueItem, 'workerLeaseId'),
    routeIdempotencyKey: getPayloadString(queueItem, 'routeIdempotencyKey'),
    commandTemplateId: commandTemplateId as GstreamerMkvtoolnixAllowedCommandTemplateId | '',
    privateInputManifestId: getPayloadString(queueItem, 'privateInputManifestId'),
    expectedOutputManifestSchemaId: getPayloadString(queueItem, 'expectedOutputManifestSchemaId'),
    expectedQaReportSchemaId: getPayloadString(queueItem, 'expectedQaReportSchemaId'),
    cleanupPolicyId: getPayloadString(queueItem, 'cleanupPolicyId'),
    retentionPolicyId: getPayloadString(queueItem, 'retentionPolicyId'),
    failurePolicyId: getPayloadString(queueItem, 'failurePolicyId'),
    auditEventParentId: getPayloadString(queueItem, 'auditEventParentId'),
    workerSkeletonEnabled: false,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

export function buildGstreamerMkvtoolnixGuardedWorkerSkeletonInput(input: {
  enqueueResult: GstreamerMkvtoolnixGuardedWorkerEnqueueResult
  createdAt: ISODateString
}): GstreamerMkvtoolnixGuardedWorkerSkeletonInput {
  return {
    lane: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1',
    skeletonId: 'worker.gstreamerMkvtoolnix.guarded.disabledSkeleton',
    enqueueResult: input.enqueueResult,
    createdAt: input.createdAt,
    skeletonMode: 'disabled_worker_skeleton_metadata_only',
    workerOwner: 'backend_worker_only',
    workerKind: 'render_export',
    workerSkeletonRegistered: true,
    workerSkeletonEnabled: false,
    queueConsumptionMode: 'metadata_validation_only',
    rawCommandStringsAllowed: false,
    rawChatAllowed: false,
    frontendFilePathAllowed: false,
    publicUrlSourceOfTruthAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    arbitraryPrivateMediaAllowed: false,
    serviceRoleSecretPayloadAccess: false,
    broadServiceRoleHandler: false,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }
}

export function validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput(
  input: GstreamerMkvtoolnixGuardedWorkerSkeletonInput,
): GstreamerMkvtoolnixGuardedWorkerSkeletonResult {
  const blockers: GstreamerMkvtoolnixGuardedWorkerSkeletonStatus[] = []
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
    input.skeletonMode !== 'disabled_worker_skeleton_metadata_only' ||
    input.workerOwner !== 'backend_worker_only' ||
    input.workerKind !== 'render_export' ||
    input.workerSkeletonRegistered !== true ||
    input.workerSkeletonEnabled !== false ||
    input.queueConsumptionMode !== 'metadata_validation_only'
  ) {
    pushOnce(blockers, 'blocked_skeleton_mode_not_disabled')
  }
  if (queueItem && !hasRequiredMetadata(queueItem)) pushOnce(blockers, 'blocked_missing_required_metadata')
  if (
    input.rawCommandStringsAllowed ||
    input.rawChatAllowed ||
    input.frontendFilePathAllowed ||
    input.publicUrlSourceOfTruthAllowed ||
    input.signedUrlSourceOfTruthAllowed ||
    input.arbitraryPrivateMediaAllowed ||
    input.serviceRoleSecretPayloadAccess ||
    input.broadServiceRoleHandler ||
    Boolean(queueItem?.payload.rawCommandString) ||
    Boolean(queueItem?.payload.rawChat) ||
    Boolean(queueItem?.payload.frontendFilePath) ||
    Boolean(queueItem?.payload.publicUrlSourceOfTruth) ||
    Boolean(queueItem?.payload.signedUrlSourceOfTruth) ||
    Boolean(queueItem?.payload.serviceRoleSecretPayload)
  ) {
    pushOnce(blockers, 'blocked_raw_or_unapproved_input_attempt')
  }
  if (input.workerDispatchAttempted || !getPayloadFalse(queueItem, 'workerDispatchAttempted')) {
    pushOnce(blockers, 'blocked_worker_dispatch_not_enabled')
  }
  if (input.workerExecution || !getPayloadFalse(queueItem, 'workerExecution')) {
    pushOnce(blockers, 'blocked_worker_execution_not_enabled')
  }
  if (
    input.gstreamerExecution ||
    input.mkvtoolnixExecution ||
    input.ffmpegFfprobeExecution ||
    input.dockerExecution ||
    input.remotionExecution ||
    !getPayloadFalse(queueItem, 'gstreamerExecution') ||
    !getPayloadFalse(queueItem, 'mkvtoolnixExecution')
  ) {
    pushOnce(blockers, 'blocked_tool_execution_not_enabled')
  }
  if (input.mediaProcessing || !getPayloadFalse(queueItem, 'mediaProcessing')) {
    pushOnce(blockers, 'blocked_media_processing_not_enabled')
  }
  if (
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    !getPayloadFalse(queueItem, 'signedUrlCreation') ||
    !getPayloadFalse(queueItem, 'publicArtifactCreation')
  ) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (
    input.routeExecution ||
    input.finalRenderExport ||
    input.externalBetaUnlock ||
    input.productionUnlock ||
    !getPayloadFalse(queueItem, 'routeExecution') ||
    !getPayloadFalse(queueItem, 'finalRenderExport')
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const ok = blockers.length === 0
  const sanitizedPayload = createSanitizedPayload(input)

  return {
    lane: input.lane,
    skeletonId: input.skeletonId,
    ok,
    skeletonStatus: ok ? 'registered_disabled_worker_skeleton_metadata_only' : blockers[0],
    blockers,
    queueItem,
    sanitizedPayload,
    sanitizedSummary: ok
      ? 'GStreamer/MKVToolNix guarded worker skeleton registered disabled metadata-only; worker dispatch and tool execution remain blocked.'
      : `GStreamer/MKVToolNix guarded worker skeleton blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: NEXT_REQUIRED_GATE,
  }
}

export function summarizeGstreamerMkvtoolnixGuardedWorkerSkeletonBoundary(): string[] {
  return [
    'The skeleton consumes only the mock queue metadata emitted by the guarded enqueue contract.',
    'The worker skeleton is registered disabled by default and does not call worker dispatch, tool binaries, route handlers, Supabase, SQL, storage, or media processing.',
    'Approved snapshot, approval record, credit/no-spend policy, job, disabled worker lease, idempotency, command-template allowlist, private manifest, output manifest, QA, cleanup, retention, failure, and audit refs remain required.',
    'The next gate must explicitly authorize a bounded confirmed runtime execution plan before any GStreamer or MKVToolNix invocation is considered.',
  ]
}
