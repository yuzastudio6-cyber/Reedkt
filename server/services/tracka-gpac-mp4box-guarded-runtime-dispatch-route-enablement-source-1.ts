import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  buildGpacMp4boxGuardedServiceRoleRouteMockRequest,
  type GpacMp4boxGuardedServiceRoleRouteMockRequest,
  type GpacMp4boxGuardedServiceRoleRouteStatus,
  validateGpacMp4boxGuardedServiceRoleRouteMockRequest,
} from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerEnqueueMockInput,
  enqueueGpacMp4boxGuardedWorkerMock,
  type GpacMp4boxGuardedWorkerEnqueueMockResult,
  type GpacMp4boxGuardedWorkerEnqueueStatus,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerSkeletonMockInput,
  type GpacMp4boxGuardedWorkerSkeletonMockResult,
  validateGpacMp4boxGuardedWorkerSkeletonMockInput,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  gpacMp4boxApprovedCommandTemplateIds,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_PACKET =
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ROUTE-ENABLEMENT-SOURCE-1' as const

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_DECISION =
  'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source' as const

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_EXECUTION =
  'completed_guarded_backend_route_source_to_mock_queue_handoff_no_tool_execution' as const

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_SOURCE' as const

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH =
  '/v1/external-beta/gpac-mp4box/guarded-runtime-dispatch/generated-fixture/route-source/enqueue' as const

export const TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_NEXT_MILESTONE =
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1R' as const

export type GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus =
  | 'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source'
  | 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation'
  | 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_reference'
  | 'blocked_invalid_gpac_mp4box_guarded_runtime_dispatch_route_source_state'
  | 'blocked_unapproved_gpac_mp4box_command_template'
  | 'blocked_gpac_mp4box_route_source_idempotency_mismatch'
  | 'blocked_unsupported_gpac_mp4box_route_source_payload'
  | 'blocked_runtime_or_remote_execution_not_enabled_for_gpac_mp4box_route_source'
  | 'blocked_gpac_mp4box_route_contract_invalid'
  | 'blocked_gpac_mp4box_mock_enqueue_failed'
  | 'blocked_gpac_mp4box_worker_skeleton_validation_failed'

export interface GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  approvedSnapshotStatus: 'approved' | string
  approvalRecordId: string
  approvalRecordStatus: 'approved' | string
  creditReservationId: string
  creditReservationStatus: 'approved' | string
  jobId: string
  jobStatus: 'planned' | 'approved' | string
  workerLeaseId: string
  workerLeaseStatus: 'active' | string
  sourceSequenceMapId: string
  compiledIntentId: string
  modelRoutingPolicyId: string
  qaPolicyId: string
  cleanupPolicyId: string
  cleanupPolicyStatus: 'approved' | string
  cleanupStatus: 'cleanup_verified' | 'cleanup_required' | string
  auditRecordId: string
  privateInputManifestId: string
  privateInputManifestSourceClass: 'generated_fixture' | string
  privateInputStorageObjectPath: string
  privateInputChecksumSha256: string
  privateInputByteCount: number
  privateArtifactManifestId: string
  privateArtifactStorageObjectPrefix: string
  privateArtifactExpectedOutputFileNames: readonly string[]
  privateArtifactChecksumId: string
  toolRuntimePolicyId: string
  gpacMp4boxWorkerContractId: string
  gpacMp4boxRouteContractId: string
  commandTemplateId: GpacMp4boxCommandTemplateId | string
  routeIdempotencyKey: string
  routeSourceMode: 'guarded_route_source_to_mock_queue_handoff_only' | string
  routeOwner: 'backend_service_role_only' | string
  confirmation: boolean
  rawCommand?: string | null
  rawChat?: string | null
  arbitraryFilePath?: string | null
  frontendFilePath?: string | null
  privateMediaPath?: string | null
  userMediaPath?: string | null
  publicUrl?: string | null
  signedUrl?: string | null
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  gpacMp4boxExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  storageTransferRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  serviceRoleSecretPayloadAccessRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceResult {
  packet: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_PACKET
  decision: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_DECISION
  execution: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_EXECUTION
  ok: boolean
  status: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus
  blockers: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus[]
  confirmationGate: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV
  confirmationRequired: true
  routePath: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH
  routeContractRequest?: GpacMp4boxGuardedServiceRoleRouteMockRequest
  routeContractBlockers: GpacMp4boxGuardedServiceRoleRouteStatus[]
  enqueueResult?: GpacMp4boxGuardedWorkerEnqueueMockResult
  workerSkeletonResult?: GpacMp4boxGuardedWorkerSkeletonMockResult
  queueItem?: JobRuntimeQueueItem
  sanitizedRouteSource: {
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditReservationId: string
    jobId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: GpacMp4boxCommandTemplateId | string
    routeSourceMode: 'guarded_route_source_to_mock_queue_handoff_only'
    routeOwner: 'backend_service_role_only'
    privateInputManifestId: string
    privateInputSourceClass: 'generated_fixture'
    privateArtifactManifestId: string
    privateArtifactChecksumId: string
    qaPolicyId: string
    cleanupPolicyId: string
    auditRecordId: string
    localMockQueueItemCreated: boolean
    workerSkeletonValidated: boolean
    queueItemId: string | null
    queueStatus: 'queued' | 'not_queued'
    nextRuntimeDispatchGate: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_NEXT_MILESTONE
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    storageTransfer: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeSourceHandlerInvocation: 'completed_guarded_route_source_handler' | 'not_run_blocked_before_route_source'
    routeContractValidation: 'passed' | 'blocked'
    localMockQueueItemCreated: boolean
    workerSkeletonValidation: 'passed' | 'blocked' | 'not_run'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gpacMp4boxExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    storageTransfer: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_NEXT_MILESTONE
}

export interface GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceDependencies {
  db?: MockDatabase
  env?: NodeJS.ProcessEnv
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function unsupportedPayload(input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput): boolean {
  return [
    input.rawCommand,
    input.rawChat,
    input.arbitraryFilePath,
    input.frontendFilePath,
    input.privateMediaPath,
    input.userMediaPath,
    input.publicUrl,
    input.signedUrl,
  ].some(hasText)
}

function unsafeRequest(input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.gpacMp4boxExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.remotionExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.storageTransferRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.secretPayloadAccessRequestedNow,
    input.serviceRoleSecretPayloadAccessRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function isCommandTemplate(value: string): value is GpacMp4boxCommandTemplateId {
  return gpacMp4boxApprovedCommandTemplateIds.includes(value as GpacMp4boxCommandTemplateId)
}

function expectedRouteIdempotencyKey(
  input: Pick<
    GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'jobId' | 'commandTemplateId'
  >,
): string {
  if (!isCommandTemplate(input.commandTemplateId)) return ''
  return buildGpacMp4boxMockWorkerRouteIdempotencyKey({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    jobId: input.jobId,
    commandTemplateId: input.commandTemplateId,
  })
}

function buildWorkerEnvelope(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
): GpacMp4boxMockWorkerJobEnvelope {
  const commandTemplateId = isCommandTemplate(input.commandTemplateId)
    ? input.commandTemplateId
    : 'mp4box_package_validation_metadata_v1'

  return {
    lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
    approvedSnapshotRef: { id: input.approvedSnapshotId, status: 'approved' },
    approvalRecordRef: { id: input.approvalRecordId, status: 'approved' },
    jobRef: { id: input.jobId, status: input.jobStatus === 'approved' ? 'approved' : 'planned' },
    workerLeaseRef: { id: input.workerLeaseId, status: 'active', leaseStatus: 'active' },
    routeIdempotencyKey: input.routeIdempotencyKey,
    sourceSequenceMapRef: { id: input.sourceSequenceMapId, status: 'approved' },
    compiledIntentRef: { id: input.compiledIntentId, status: 'approved' },
    modelRoutingPolicyRef: { id: input.modelRoutingPolicyId, status: 'approved' },
    qaPolicyRef: {
      id: input.qaPolicyId,
      requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
      blocksPreview: true,
      blocksFinalExport: true,
    },
    privateInputManifestRef: {
      id: input.privateInputManifestId,
      sourceClass: 'generated_fixture',
      storageObjectPath: input.privateInputStorageObjectPath,
      checksumSha256: input.privateInputChecksumSha256,
      byteCount: input.privateInputByteCount,
      sourceOfTruth: true,
      privateArtifact: true,
    },
    privateArtifactManifestRef: {
      id: input.privateArtifactManifestId,
      storageObjectPrefix: input.privateArtifactStorageObjectPrefix,
      expectedOutputFileNames: [...input.privateArtifactExpectedOutputFileNames],
      expectedChecksumAlgorithm: 'sha256',
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
    },
    privateArtifactChecksumRef: { id: input.privateArtifactChecksumId, status: 'planned' },
    toolRuntimePolicyRef: { id: input.toolRuntimePolicyId, status: 'approved' },
    gpacMp4boxWorkerContractRef: { id: input.gpacMp4boxWorkerContractId, status: 'approved' },
    gpacMp4boxRouteContractRef: { id: input.gpacMp4boxRouteContractId, status: 'approved' },
    cleanupPolicyRef: {
      id: input.cleanupPolicyId,
      status: 'approved',
      cleanupStatus: input.cleanupStatus === 'cleanup_verified' ? 'cleanup_verified' : 'cleanup_required',
      tempArtifactScope: 'worker_temp_only',
    },
    auditRecordRef: { id: input.auditRecordId, status: 'planned' },
    commandTemplateId,
    createdAt: new Date().toISOString(),
    executionMode: 'mock_contract_only',
    runtimeExecution: false,
    workerExecution: false,
    routeExecution: false,
  }
}

function buildRouteContractRequest(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
): GpacMp4boxGuardedServiceRoleRouteMockRequest {
  return buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
    workerEnvelope: buildWorkerEnvelope(input),
    creditReservationRef: { id: input.creditReservationId, status: 'approved' },
    routeIdempotencyBasis: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      jobId: input.jobId,
      commandTemplateId: isCommandTemplate(input.commandTemplateId)
        ? input.commandTemplateId
        : 'mp4box_package_validation_metadata_v1',
    },
    createdAt: new Date().toISOString(),
  })
}

export function buildGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput(
  overrides: Partial<GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput> = {},
): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput {
  const base = {
    workspaceId: 'workspace-gpac-mp4box-route-source',
    projectId: 'project-gpac-mp4box-route-source',
    approvedSnapshotId: 'approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1',
    approvedSnapshotStatus: 'approved',
    approvalRecordId: 'approvalRecord.gpacMp4box.generatedSubtitleOnly.v1',
    approvalRecordStatus: 'approved',
    creditReservationId: 'creditReservation.gpacMp4box.generatedSubtitleOnly.v1',
    creditReservationStatus: 'approved',
    jobId: 'job.gpacMp4box.packageValidation.generatedSubtitleOnly.v1',
    jobStatus: 'planned',
    workerLeaseId: 'workerLease.gpacMp4box.packageValidation.generatedSubtitleOnly.v1',
    workerLeaseStatus: 'active',
    sourceSequenceMapId: 'sourceSequenceMap.gpacMp4box.generatedSubtitleOnly.v1',
    compiledIntentId: 'compiledIntent.gpacMp4box.generatedSubtitleOnly.v1',
    modelRoutingPolicyId: 'modelRoutingPolicy.gpacMp4box.generatedSubtitleOnly.v1',
    qaPolicyId: 'qa.gpacMp4box.packageValidation.generatedSubtitleOnly.v1',
    cleanupPolicyId: 'cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1',
    cleanupPolicyStatus: 'approved',
    cleanupStatus: 'cleanup_verified',
    auditRecordId: 'audit.gpacMp4box.dispatch.generatedSubtitleOnly.v1',
    privateInputManifestId: 'manifest.gpacMp4box.privateInput.generatedSubtitleOnly.v1',
    privateInputManifestSourceClass: 'generated_fixture',
    privateInputStorageObjectPath:
      'workspaces/workspace-gpac-mp4box-route-source/projects/project-gpac-mp4box-route-source/private/generated-synthetic-subtitles.srt',
    privateInputChecksumSha256: '8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea',
    privateInputByteCount: 73,
    privateArtifactManifestId: 'manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1',
    privateArtifactStorageObjectPrefix:
      'workspaces/workspace-gpac-mp4box-route-source/projects/project-gpac-mp4box-route-source/private/gpac-mp4box/',
    privateArtifactExpectedOutputFileNames: [
      'gpac-mp4box-package-validation-report.json',
      'gpac-mp4box-package-validation-manifest.json',
    ],
    privateArtifactChecksumId: 'checksum.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1',
    toolRuntimePolicyId: 'toolRuntimePolicy.gpacMp4box.officialApt.syntheticOnly.v1',
    gpacMp4boxWorkerContractId: 'workerContract.gpacMp4box.packageValidation.generatedSubtitleOnly.v1',
    gpacMp4boxRouteContractId: 'routeContract.gpacMp4box.serviceRolePackageMock.generatedSubtitleOnly.v1',
    commandTemplateId: 'mp4box_package_validation_metadata_v1',
    routeSourceMode: 'guarded_route_source_to_mock_queue_handoff_only',
    routeOwner: 'backend_service_role_only',
    confirmation: true,
    routeExecutionRequestedNow: false,
    workerDispatchRequestedNow: false,
    workerExecutionRequestedNow: false,
    workerProcessStartRequestedNow: false,
    workerLeaseClaimRequestedNow: false,
    persistentJobQueueWriteRequestedNow: false,
    gpacMp4boxExecutionRequestedNow: false,
    ffmpegFfprobeExecutionRequestedNow: false,
    dockerExecutionRequestedNow: false,
    remotionExecutionRequestedNow: false,
    mediaProcessingRequestedNow: false,
    privateMediaProcessingRequestedNow: false,
    userMediaProcessingRequestedNow: false,
    storageTransferRequestedNow: false,
    supabaseMutationRequestedNow: false,
    sqlExecutionRequestedNow: false,
    secretPayloadAccessRequestedNow: false,
    serviceRoleSecretPayloadAccessRequestedNow: false,
    signedUrlCreationRequestedNow: false,
    publicArtifactRequestedNow: false,
    finalRenderExportRequestedNow: false,
    externalBetaUnlockRequestedNow: false,
    paidProductionUnlockRequestedNow: false,
    productionUnlockRequestedNow: false,
    ...overrides,
  } as GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput

  return {
    ...base,
    routeIdempotencyKey: overrides.routeIdempotencyKey ?? expectedRouteIdempotencyKey(base),
  }
}

export function validateGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus[] {
  const blockers: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus[] = []

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.approvalRecordId,
    input.creditReservationId,
    input.jobId,
    input.workerLeaseId,
    input.sourceSequenceMapId,
    input.compiledIntentId,
    input.modelRoutingPolicyId,
    input.qaPolicyId,
    input.cleanupPolicyId,
    input.auditRecordId,
    input.privateInputManifestId,
    input.privateInputStorageObjectPath,
    input.privateInputChecksumSha256,
    input.privateArtifactManifestId,
    input.privateArtifactStorageObjectPrefix,
    input.privateArtifactChecksumId,
    input.toolRuntimePolicyId,
    input.gpacMp4boxWorkerContractId,
    input.gpacMp4boxRouteContractId,
    input.commandTemplateId,
    input.routeIdempotencyKey,
  ]) {
    if (blank(value)) {
      pushOnce(blockers, 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_reference')
    }
  }
  if (
    input.approvedSnapshotStatus !== 'approved' ||
    input.approvalRecordStatus !== 'approved' ||
    input.creditReservationStatus !== 'approved' ||
    input.workerLeaseStatus !== 'active' ||
    input.privateInputManifestSourceClass !== 'generated_fixture' ||
    input.cleanupPolicyStatus !== 'approved' ||
    input.routeSourceMode !== 'guarded_route_source_to_mock_queue_handoff_only' ||
    input.routeOwner !== 'backend_service_role_only'
  ) {
    pushOnce(blockers, 'blocked_invalid_gpac_mp4box_guarded_runtime_dispatch_route_source_state')
  }
  if (!isCommandTemplate(input.commandTemplateId)) {
    pushOnce(blockers, 'blocked_unapproved_gpac_mp4box_command_template')
  }
  if (input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_gpac_mp4box_route_source_idempotency_mismatch')
  }
  if (unsupportedPayload(input)) {
    pushOnce(blockers, 'blocked_unsupported_gpac_mp4box_route_source_payload')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_or_remote_execution_not_enabled_for_gpac_mp4box_route_source')
  }

  return blockers
}

function buildResult(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
  ok: boolean,
  status: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus,
  blockers: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus[],
  routeContractRequest?: GpacMp4boxGuardedServiceRoleRouteMockRequest,
  routeContractBlockers: GpacMp4boxGuardedServiceRoleRouteStatus[] = [],
  enqueueResult?: GpacMp4boxGuardedWorkerEnqueueMockResult,
  workerSkeletonResult?: GpacMp4boxGuardedWorkerSkeletonMockResult,
): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceResult {
  const queueItem = enqueueResult?.queueItem
  const localMockQueueItemCreated = Boolean(ok && queueItem)
  const workerSkeletonValidated = Boolean(ok && workerSkeletonResult?.ok)

  return {
    packet: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_PACKET,
    decision: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_DECISION,
    execution: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV,
    confirmationRequired: true,
    routePath: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH,
    routeContractRequest,
    routeContractBlockers,
    enqueueResult,
    workerSkeletonResult,
    queueItem,
    sanitizedRouteSource: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      approvalRecordId: input.approvalRecordId,
      creditReservationId: input.creditReservationId,
      jobId: input.jobId,
      workerLeaseId: input.workerLeaseId,
      routeIdempotencyKey: input.routeIdempotencyKey,
      commandTemplateId: input.commandTemplateId,
      routeSourceMode: 'guarded_route_source_to_mock_queue_handoff_only',
      routeOwner: 'backend_service_role_only',
      privateInputManifestId: input.privateInputManifestId,
      privateInputSourceClass: 'generated_fixture',
      privateArtifactManifestId: input.privateArtifactManifestId,
      privateArtifactChecksumId: input.privateArtifactChecksumId,
      qaPolicyId: input.qaPolicyId,
      cleanupPolicyId: input.cleanupPolicyId,
      auditRecordId: input.auditRecordId,
      localMockQueueItemCreated,
      workerSkeletonValidated,
      queueItemId: queueItem?.id ?? null,
      queueStatus: queueItem?.queueStatus === 'queued' ? 'queued' : 'not_queued',
      nextRuntimeDispatchGate: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_NEXT_MILESTONE,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      storageTransfer: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeSourceHandlerInvocation: ok
        ? 'completed_guarded_route_source_handler'
        : 'not_run_blocked_before_route_source',
      routeContractValidation: routeContractBlockers.length === 0 ? 'passed' : 'blocked',
      localMockQueueItemCreated,
      workerSkeletonValidation: workerSkeletonResult?.ok ? 'passed' : workerSkeletonResult ? 'blocked' : 'not_run',
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gpacMp4boxExecution: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      storageTransfer: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_NEXT_MILESTONE,
  }
}

function blockedResult(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
  blockers: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus[],
): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceResult {
  return buildResult(
    input,
    false,
    blockers[0] ?? 'blocked_invalid_gpac_mp4box_guarded_runtime_dispatch_route_source_state',
    blockers,
  )
}

function mapEnqueueBlocker(blockers: GpacMp4boxGuardedWorkerEnqueueStatus[]): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus {
  if (blockers.includes('blocked_idempotency_mismatch')) return 'blocked_gpac_mp4box_route_source_idempotency_mismatch'
  return 'blocked_gpac_mp4box_mock_enqueue_failed'
}

function mapSkeletonBlocker(): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceStatus {
  return 'blocked_gpac_mp4box_worker_skeleton_validation_failed'
}

export function runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource(
  input: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
  dependencies: GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceDependencies = {},
): GpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceResult {
  const blockers = validateGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput(input)
  const env = dependencies.env ?? process.env
  if (env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers)

  const routeContractRequest = buildRouteContractRequest(input)
  const routeContractValidation = validateGpacMp4boxGuardedServiceRoleRouteMockRequest(routeContractRequest)
  if (!routeContractValidation.ok) {
    return buildResult(
      input,
      false,
      'blocked_gpac_mp4box_route_contract_invalid',
      ['blocked_gpac_mp4box_route_contract_invalid'],
      routeContractRequest,
      routeContractValidation.blockers,
    )
  }

  const db = dependencies.db ?? createMockDatabase()
  const enqueueResult = enqueueGpacMp4boxGuardedWorkerMock(
    db,
    buildGpacMp4boxGuardedWorkerEnqueueMockInput({
      routeRequest: routeContractRequest,
      createdAt: new Date().toISOString(),
    }),
  )
  if (!enqueueResult.ok) {
    const status = mapEnqueueBlocker(enqueueResult.blockers)
    return buildResult(
      input,
      false,
      status,
      [status],
      routeContractRequest,
      routeContractValidation.blockers,
      enqueueResult,
    )
  }

  const workerSkeletonResult = validateGpacMp4boxGuardedWorkerSkeletonMockInput(
    buildGpacMp4boxGuardedWorkerSkeletonMockInput({
      enqueueResult,
      createdAt: new Date().toISOString(),
    }),
  )
  if (!workerSkeletonResult.ok) {
    const status = mapSkeletonBlocker()
    return buildResult(
      input,
      false,
      status,
      [status],
      routeContractRequest,
      routeContractValidation.blockers,
      enqueueResult,
      workerSkeletonResult,
    )
  }

  return buildResult(
    input,
    true,
    'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source',
    [],
    routeContractRequest,
    [],
    enqueueResult,
    workerSkeletonResult,
  )
}

export function summarizeGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceBoundary(): string[] {
  return [
    'Adds a guarded backend route-source bridge for GPAC/MP4Box generated-fixture package validation.',
    'Fails closed unless approved snapshot, approval, credit reservation, worker lease, command allowlist, idempotency, private manifest, cleanup, and REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_SOURCE=true are present.',
    'Creates only a local mock queue item and validates the disabled worker skeleton; it does not dispatch a worker, run GPAC/MP4Box, process media, transfer storage, mutate Supabase, run SQL, or create signed/public artifacts.',
    'The next milestone may retry the confirmed runtime dispatch runner, but tool execution still requires its own explicit confirmation and source handler.',
  ]
}
