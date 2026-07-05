import {
  AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION,
  evaluateAiGraphicsExternalBetaRuntimeQueueServiceBridge,
  type AiGraphicsExternalBetaRuntimeQueueServiceBridge,
  type AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput,
  type AiGraphicsExternalBetaRuntimeQueueServiceBridgeRecord,
} from './ai-graphics-external-beta-runtime-queue-service-bridge'
import type { ProductionWorkerRuntimeType } from '../workers/production'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION =
  'ai_graphics_external_beta_service_role_queue_smoke_readiness_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_runtime_queue_service_bridge'
  | 'missing_external_beta_service_role_queue_smoke_controls'
  | 'external_beta_service_role_queue_smoke_prepared_not_executed'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput
  extends AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput {
  sourceExternalBetaRuntimeQueueServiceBridgePacket?:
    AiGraphicsExternalBetaRuntimeQueueServiceBridge
  externalBetaServiceRoleQueueSmokeRef?: string
  externalBetaServiceRoleQueueSmokeEnvironmentRef?: string
  externalBetaServiceRoleQueueSmokeOwnerApprovalRef?: string
  externalBetaServiceRoleQueueSmokeRollbackRef?: string
  externalBetaServiceRoleQueueSmokeCleanupRef?: string
  externalBetaServiceRoleQueueSmokeTelemetryRef?: string
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessRecord {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  sourceGatewayRuntimeAdmissionMode: string
  capabilityIds: string[]
  sourceRuntimeQueueJobBatchId: string
  sourceRuntimeQueueJobIds: string[]
  approvedSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  serviceRoleQueueSmokeRef: string
  serviceRoleQueueSmokeEnvironmentRef: string
  serviceRoleQueueSmokeEnvironment: 'non_production_external_beta'
  enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs'
  claimRpcName: 'claim_ai_graphics_tool_runtime_job'
  recordWorkerEventRpcName: 'record_ai_graphics_worker_event'
  recordAuditEventRpcName: 'record_ai_graphics_audit_event'
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  requiredServerEnv: readonly [
    'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true',
    'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'E2E_RUNTIME_MODE=local',
    'WORKER_RUNTIME_MODE=mock',
  ]
  serviceRoleQueueSmokePreparedWithProvidedEvidence: boolean
  cleanupRequiredBeforeReady: true
  rollbackPlanRequiredBeforeReady: true
  telemetryRequiredBeforeReady: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveServiceRoleQueueSmokeExecutedNow: false
  liveSupabaseQueueWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness {
  decision: AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION
  sourceExternalBetaRuntimeQueueServiceBridgeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaRuntimeQueueServiceBridge:
    AiGraphicsExternalBetaRuntimeQueueServiceBridge
  sourceExternalBetaRuntimeQueueServiceBridgeAccepted: boolean
  sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: boolean
  missingServiceRoleQueueSmokeControls: string[]
  externalBetaServiceRoleQueueSmokeControlsSatisfied: boolean
  serviceRoleQueueSmokePreparedWithProvidedEvidence: boolean
  externalBetaServiceRoleQueueSmokeReadinessRecord:
    AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessRecord | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  liveServiceRoleQueueSmokeExecutedNow: false
  liveSupabaseQueueWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  serviceRoleQueueSmokePolicy: {
    sideEffectFreeReadinessCheck: true
    sourceRuntimeQueueServiceBridgePacketRequired: true
    sourceRuntimeQueueServiceProofBridgeRequired: true
    nonProductionEnvironmentRequired: true
    explicitSmokeConfirmationRequired: true
    serviceRoleCredentialsServerOnly: true
    rollbackPlanRequired: true
    cleanupPlanRequired: true
    telemetryPlanRequired: true
    liveRpcSmokeNotExecutedByDefault: true
    serviceRoleRpcNamesPreserved: true
    toolRouteAndWorkerDispatchRemainBlocked: true
    noSupabaseWritesByThisEvaluator: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaServiceRoleQueueSmokeReadinessPrepared: true
    sourceExternalBetaRuntimeQueueServiceBridgeAccepted: boolean
    sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: boolean
    externalBetaServiceRoleQueueSmokeControlsSatisfied: boolean
    serviceRoleQueueSmokePreparedWithProvidedEvidence: boolean
    serviceRoleQueueSmokeNonProductionOnly: boolean
    serviceRoleCredentialsServerOnly: true
    rollbackPlanAccepted: boolean
    cleanupPlanAccepted: boolean
    telemetryPlanAccepted: boolean
    canonicalRuntimeQueueServiceValidationAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    runtimeQueueServiceUsesServiceRoleRpcNames: true
    aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: boolean
    privateArtifactManifestOnly: boolean
    workerClaimSmokePreparedButNotCalled: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    liveQueueWriteApprovedNow: false
    liveJobBatchInsertApprovedNow: false
    liveJobInsertApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
    liveWorkerEventInsertApprovedNow: false
    liveAuditEventInsertApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    serviceRoleQueueSmokePerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const requiredServerEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
] as const

const serviceRoleQueueSmokePolicy = {
  sideEffectFreeReadinessCheck: true,
  sourceRuntimeQueueServiceBridgePacketRequired: true,
  sourceRuntimeQueueServiceProofBridgeRequired: true,
  nonProductionEnvironmentRequired: true,
  explicitSmokeConfirmationRequired: true,
  serviceRoleCredentialsServerOnly: true,
  rollbackPlanRequired: true,
  cleanupPlanRequired: true,
  telemetryPlanRequired: true,
  liveRpcSmokeNotExecutedByDefault: true,
  serviceRoleRpcNamesPreserved: true,
  toolRouteAndWorkerDispatchRemainBlocked: true,
  noSupabaseWritesByThisEvaluator: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function runtimeQueueServiceProofBridgeAccepted(
  packet: AiGraphicsExternalBetaRuntimeQueueServiceBridge,
): boolean {
  const localQueueStorage = packet.sourceExternalBetaLocalQueueStorage

  return (
    packet.sourceExternalBetaLocalQueueStorageProofBridgeAccepted === true &&
    packet.booleans?.sourceExternalBetaLocalQueueStorageProofBridgeAccepted === true &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord
      ?.sourceLocalQueueStorageProofBridgeAccepted === true &&
    localQueueStorage
      ?.sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted === true &&
    localQueueStorage?.booleans
      .sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted === true &&
    localQueueStorage?.externalBetaLocalQueueStorageRecord
      ?.sourceServiceRoleTransactionProofBridgeAccepted === true
  )
}

function bridgeAccepted(
  packet: AiGraphicsExternalBetaRuntimeQueueServiceBridge,
): boolean {
  return packet.decision === 'external_beta_runtime_queue_service_payload_ready' &&
    runtimeQueueServiceProofBridgeAccepted(packet) &&
    packet.sourceDecision ===
      AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION &&
    packet.runtimeQueueServicePayloadReadyWithProvidedEvidence === true &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord !== null &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord.queueServiceMockOnly === true &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord.insertedJobCount === 1 &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord.enqueueRpcName ===
      'enqueue_ai_graphics_tool_runtime_jobs' &&
    packet.externalBetaRuntimeQueueServiceBridgeRecord.claimRpcName ===
      'claim_ai_graphics_tool_runtime_job' &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingServiceRoleQueueSmokeControls(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput,
): string[] {
  return [
    !hasValue(input.externalBetaServiceRoleQueueSmokeRef)
      ? 'external beta service-role queue smoke reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleQueueSmokeEnvironmentRef)
      ? 'external beta service-role queue smoke environment reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleQueueSmokeOwnerApprovalRef)
      ? 'external beta service-role queue smoke owner approval reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleQueueSmokeRollbackRef)
      ? 'external beta service-role queue smoke rollback reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleQueueSmokeCleanupRef)
      ? 'external beta service-role queue smoke cleanup reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleQueueSmokeTelemetryRef)
      ? 'external beta service-role queue smoke telemetry reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  bridge: AiGraphicsExternalBetaRuntimeQueueServiceBridge
  sourceBridgeAccepted: boolean
  executionRequested: boolean
  smokePrepared: boolean
}): AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessStatus {
  if (input.bridge.decision === 'invalid_capability_blocked') {
    return 'invalid_capability_blocked'
  }
  if (input.bridge.decision === 'requested_tool_eliminated') {
    return 'requested_tool_eliminated'
  }
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceBridgeAccepted) {
    return 'missing_external_beta_runtime_queue_service_bridge'
  }
  return input.smokePrepared
    ? 'external_beta_service_role_queue_smoke_prepared_not_executed'
    : 'missing_external_beta_service_role_queue_smoke_controls'
}

function createServiceRoleQueueSmokeReadinessRecord(
  bridgeRecord: AiGraphicsExternalBetaRuntimeQueueServiceBridgeRecord,
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput,
): AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessRecord {
  return {
    toolId: bridgeRecord.toolId,
    productionToolId: bridgeRecord.productionToolId,
    workerType: bridgeRecord.workerType,
    runtimeTarget: bridgeRecord.runtimeTarget,
    sourceGatewayRuntimeAdmissionMode: bridgeRecord.sourceGatewayRuntimeAdmissionMode,
    capabilityIds: bridgeRecord.capabilityIds,
    sourceRuntimeQueueJobBatchId: bridgeRecord.runtimeQueueJobBatchId,
    sourceRuntimeQueueJobIds: bridgeRecord.runtimeQueueJobIds,
    approvedSnapshotId: bridgeRecord.approvedSnapshotId,
    creditReservationId: bridgeRecord.creditReservationId,
    privateArtifactManifestRef: bridgeRecord.privateArtifactManifestRef,
    serviceRoleQueueSmokeRef:
      input.externalBetaServiceRoleQueueSmokeRef ?? 'missing-smoke-ref',
    serviceRoleQueueSmokeEnvironmentRef:
      input.externalBetaServiceRoleQueueSmokeEnvironmentRef ??
        'missing-smoke-environment-ref',
    serviceRoleQueueSmokeEnvironment: 'non_production_external_beta',
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    recordWorkerEventRpcName: 'record_ai_graphics_worker_event',
    recordAuditEventRpcName: 'record_ai_graphics_audit_event',
    sourceRuntimeQueueServiceProofBridgeAccepted:
      bridgeRecord.sourceLocalQueueStorageProofBridgeAccepted,
    requiredServerEnv,
    serviceRoleQueueSmokePreparedWithProvidedEvidence: true,
    cleanupRequiredBeforeReady: true,
    rollbackPlanRequiredBeforeReady: true,
    telemetryRequiredBeforeReady: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      bridgeRecord.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
  }
}

export async function evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeReadiness(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput,
): Promise<AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness> {
  const bridge =
    input.sourceExternalBetaRuntimeQueueServiceBridgePacket ??
    await evaluateAiGraphicsExternalBetaRuntimeQueueServiceBridge(input)
  const executionRequested =
    input.executionRequested === true || bridge.executionRequested === true
  const sourceBridgeAccepted = bridgeAccepted(bridge)
  const sourceBridgeProofBridgeAccepted =
    runtimeQueueServiceProofBridgeAccepted(bridge)
  const missingControls = executionRequested
    ? missingServiceRoleQueueSmokeControls(input)
    : []
  const controlsSatisfied =
    executionRequested &&
    sourceBridgeAccepted &&
    missingControls.length === 0
  const bridgeRecord = bridge.externalBetaRuntimeQueueServiceBridgeRecord
  const smokeRecord =
    controlsSatisfied && bridgeRecord
      ? createServiceRoleQueueSmokeReadinessRecord(bridgeRecord, input)
      : null
  const smokePrepared =
    smokeRecord?.serviceRoleQueueSmokePreparedWithProvidedEvidence === true
  const privateArtifactManifestOnly = smokeRecord
    ? smokeRecord.privateArtifactManifestRef.startsWith('private://')
    : false
  const aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit =
    Boolean(smokeRecord?.approvedSnapshotId) &&
    Boolean(smokeRecord?.creditReservationId)
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    smokePrepared &&
    smokeRecord.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      bridge,
      sourceBridgeAccepted,
      executionRequested,
      smokePrepared,
    }),
    sourceDecision:
      AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION,
    sourceExternalBetaRuntimeQueueServiceBridgeDecision:
      AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION,
    capabilityId: bridge.capabilityId,
    requestedToolId: bridge.requestedToolId,
    executionRequested,
    sourceExternalBetaRuntimeQueueServiceBridge: bridge,
    sourceExternalBetaRuntimeQueueServiceBridgeAccepted: sourceBridgeAccepted,
    sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted:
      sourceBridgeProofBridgeAccepted,
    missingServiceRoleQueueSmokeControls: missingControls,
    externalBetaServiceRoleQueueSmokeControlsSatisfied: controlsSatisfied,
    serviceRoleQueueSmokePreparedWithProvidedEvidence: smokePrepared,
    externalBetaServiceRoleQueueSmokeReadinessRecord: smokeRecord,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    serviceRoleQueueSmokePolicy,
    booleans: {
      externalBetaServiceRoleQueueSmokeReadinessPrepared: true,
      sourceExternalBetaRuntimeQueueServiceBridgeAccepted: sourceBridgeAccepted,
      sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted:
        sourceBridgeProofBridgeAccepted,
      externalBetaServiceRoleQueueSmokeControlsSatisfied: controlsSatisfied,
      serviceRoleQueueSmokePreparedWithProvidedEvidence: smokePrepared,
      serviceRoleQueueSmokeNonProductionOnly: smokePrepared,
      serviceRoleCredentialsServerOnly: true,
      rollbackPlanAccepted:
        controlsSatisfied && hasValue(input.externalBetaServiceRoleQueueSmokeRollbackRef),
      cleanupPlanAccepted:
        controlsSatisfied && hasValue(input.externalBetaServiceRoleQueueSmokeCleanupRef),
      telemetryPlanAccepted:
        controlsSatisfied && hasValue(input.externalBetaServiceRoleQueueSmokeTelemetryRef),
      canonicalRuntimeQueueServiceValidationAccepted: sourceBridgeAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      runtimeQueueServiceUsesServiceRoleRpcNames: true,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit,
      privateArtifactManifestOnly,
      workerClaimSmokePreparedButNotCalled: smokePrepared,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
