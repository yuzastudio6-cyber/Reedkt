import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION,
  type AiGraphicsExternalBetaControlledRuntimeActivationPolicy,
  type AiGraphicsExternalBetaControlledRuntimeExecutionApproval,
} from './ai-graphics-external-beta-controlled-runtime-execution-approval'
import {
  AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION,
  type AiGraphicsExternalBetaRuntimeQueueServiceBridge,
} from './ai-graphics-external-beta-runtime-queue-service-bridge'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaLiveEnqueueAuthorizationStatus =
  | 'missing_external_beta_controlled_runtime_execution_approval'
  | 'external_beta_controlled_runtime_execution_approval_rejected'
  | 'missing_external_beta_runtime_queue_service_bridge'
  | 'external_beta_runtime_queue_service_bridge_rejected'
  | 'awaiting_external_beta_live_enqueue_authorization'
  | 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked'

export interface AiGraphicsExternalBetaLiveEnqueueAuthorizationInput {
  sourceControlledRuntimeExecutionApprovalPacket?:
    AiGraphicsExternalBetaControlledRuntimeExecutionApproval
  sourceRuntimeQueueServiceBridgePacket?: AiGraphicsExternalBetaRuntimeQueueServiceBridge
  externalBetaLiveEnqueueAuthorizationGranted?: boolean
  externalBetaLiveEnqueueAuthorizationRef?: string
  externalBetaLiveEnqueueOperatorRole?: string
  externalBetaNonProductionEnvironmentRef?: string
  externalBetaQueueWriteWindowRef?: string
  externalBetaCleanupPlanRef?: string
  externalBetaRollbackPlanRef?: string
  externalBetaCostCeilingRef?: string
}

export interface AiGraphicsExternalBetaLiveEnqueueAuthorizationScope {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  controlledRuntimeActivationPolicy:
    AiGraphicsExternalBetaControlledRuntimeActivationPolicy | null
  sourceControlledRuntimeExecutionScopeApprovedWithProvidedEvidence: boolean
  sourceRuntimeQueueServiceBridgeAcceptedWithProvidedEvidence: boolean
  liveEnqueueAuthorizationCandidateWithProvidedEvidence: boolean
  liveEnqueueAuthorizationRecordedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveQueueWriteApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  nextExternalBetaMilestone: string
}

export interface AiGraphicsExternalBetaLiveEnqueueAuthorization {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION
  sourceControlledRuntimeExecutionApprovalDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION | null
  sourceRuntimeQueueServiceBridgeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION | null
  status: AiGraphicsExternalBetaLiveEnqueueAuthorizationStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  controlledRuntimeExecutionApprovedToolsWithProvidedEvidence: number
  runtimeQueueServiceBridgeAcceptedWithProvidedEvidenceRequests: number
  liveEnqueueAuthorizationCandidateToolsWithProvidedEvidence: number
  liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: number
  gpuRuntimeTargetedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: number
  heavyToolsIncorrectlyTargetingCpu: 0
  liveQueueWritesApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerDispatchApprovedNowTools: 0
  toolExecutionApprovedNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceControlledRuntimeExecutionApproval:
    AiGraphicsExternalBetaControlledRuntimeExecutionApproval | null
  sourceRuntimeQueueServiceBridge: AiGraphicsExternalBetaRuntimeQueueServiceBridge | null
  liveEnqueueAuthorizationRecord: {
    accepted: boolean
    operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR'
    authorizationRef: string | null
    nonProductionEnvironmentRef: string | null
    queueWriteWindowRef: string | null
    cleanupPlanRef: string | null
    rollbackPlanRef: string | null
    costCeilingRef: string | null
    authorizesLiveQueueWriteNow: false
    authorizesWorkerDispatchNow: false
    authorizesToolExecutionNow: false
    authorizesRuntimeNow: false
  }
  allowedLiveEnqueueAuthorizationActions: string[]
  blockedRuntimeActions: string[]
  toolScopes: AiGraphicsExternalBetaLiveEnqueueAuthorizationScope[]
  nextMilestones: string[]
  booleans: {
    externalBetaLiveEnqueueAuthorizationPrepared: true
    sourceControlledRuntimeExecutionApprovalAccepted: boolean
    sourceRuntimeQueueServiceBridgeAccepted: boolean
    liveEnqueueAuthorizationRecordAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all21LiveEnqueueAuthorizationScopesPrepared: boolean
    all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedOnlyForAcceptedJobs: true
    gpuRuntimeShouldStartNow: false
    cpuFallbackAllowedForHeavyTools: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    liveJobBatchInsertApprovedNow: false
    liveJobInsertApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
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

const allowedLiveEnqueueAuthorizationActions = [
  'accept all-21 controlled runtime execution approval evidence',
  'accept side-effect-free runtime queue service bridge evidence',
  'record non-production external-beta live-enqueue authorization metadata',
  'prepare all 21 enqueue authorization scopes without writing queue rows',
  'keep GPU startup bound to future accepted worker/tool jobs only',
]

const blockedRuntimeActions = [
  'live Supabase queue write',
  'job batch insert',
  'job insert',
  'worker lease creation',
  'worker dispatch',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'bind this authorization packet to a non-production service-role queue write smoke',
  'prove queue claim, worker lease, and worker dispatch in a private external-beta environment',
  'prove per-tool runtime execution with private artifacts before enabling external-beta traffic',
  'keep heavy model tools on GPU and start GPU only for accepted jobs',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasExternalBetaPrivateRef(value?: string): boolean {
  if (!hasValue(value)) return false
  const normalized = value?.trim().toLowerCase() ?? ''
  if (
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-runtime://') ||
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-live-enqueue://')
}

function controlledRuntimeExecutionApprovalAccepted(
  packet?: AiGraphicsExternalBetaControlledRuntimeExecutionApproval,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION &&
    packet.status ===
      'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked' &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    packet.heavyToolsIncorrectlyTargetingCpu === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all21ControlledRuntimeExecutionScopesApprovedWithProvidedEvidence === true &&
    packet.booleans.gpuHeavyToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function runtimeQueueServiceBridgeAccepted(
  packet?: AiGraphicsExternalBetaRuntimeQueueServiceBridge,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION &&
    packet.decision === 'external_beta_runtime_queue_service_payload_ready' &&
    packet.runtimeQueueServicePayloadReadyWithProvidedEvidence === true &&
    packet.sourceExternalBetaLocalQueueStorageProofBridgeAccepted === true &&
    packet.externalBetaRuntimeQueueServiceControlsSatisfied === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.runtimeQueueServicePayloadReadyWithProvidedEvidence === true &&
    packet.booleans.canonicalRuntimeQueueServiceValidationPassed === true &&
    packet.booleans.usesExistingAiGraphicsRuntimeQueueService === true &&
    packet.booleans.runtimeQueueServiceUsesServiceRoleRpcNames === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function authorizationRecordAccepted(
  input: AiGraphicsExternalBetaLiveEnqueueAuthorizationInput,
): boolean {
  return input.externalBetaLiveEnqueueAuthorizationGranted === true &&
    hasExternalBetaPrivateRef(input.externalBetaLiveEnqueueAuthorizationRef) &&
    (input.externalBetaLiveEnqueueOperatorRole ??
      'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR') ===
        'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR' &&
    hasExternalBetaPrivateRef(input.externalBetaNonProductionEnvironmentRef) &&
    hasExternalBetaPrivateRef(input.externalBetaQueueWriteWindowRef) &&
    hasExternalBetaPrivateRef(input.externalBetaCleanupPlanRef) &&
    hasExternalBetaPrivateRef(input.externalBetaRollbackPlanRef) &&
    hasExternalBetaPrivateRef(input.externalBetaCostCeilingRef)
}

function statusFromInput(input: {
  hasControlledApproval: boolean
  controlledApprovalAccepted: boolean
  hasRuntimeQueueServiceBridge: boolean
  runtimeQueueServiceBridgeAccepted: boolean
  authorizationAccepted: boolean
}): AiGraphicsExternalBetaLiveEnqueueAuthorizationStatus {
  if (!input.hasControlledApproval) {
    return 'missing_external_beta_controlled_runtime_execution_approval'
  }
  if (!input.controlledApprovalAccepted) {
    return 'external_beta_controlled_runtime_execution_approval_rejected'
  }
  if (!input.hasRuntimeQueueServiceBridge) {
    return 'missing_external_beta_runtime_queue_service_bridge'
  }
  if (!input.runtimeQueueServiceBridgeAccepted) {
    return 'external_beta_runtime_queue_service_bridge_rejected'
  }
  if (!input.authorizationAccepted) {
    return 'awaiting_external_beta_live_enqueue_authorization'
  }
  return 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked'
}

export function buildAiGraphicsExternalBetaLiveEnqueueAuthorization(
  input: AiGraphicsExternalBetaLiveEnqueueAuthorizationInput = {},
): AiGraphicsExternalBetaLiveEnqueueAuthorization {
  const controlledApproval =
    input.sourceControlledRuntimeExecutionApprovalPacket ?? null
  const runtimeQueueServiceBridge =
    input.sourceRuntimeQueueServiceBridgePacket ?? null
  const controlledAccepted = controlledRuntimeExecutionApprovalAccepted(
    input.sourceControlledRuntimeExecutionApprovalPacket,
  )
  const queueBridgeAccepted = runtimeQueueServiceBridgeAccepted(
    input.sourceRuntimeQueueServiceBridgePacket,
  )
  const recordAccepted = authorizationRecordAccepted(input)
  const status = statusFromInput({
    hasControlledApproval: Boolean(controlledApproval),
    controlledApprovalAccepted: controlledAccepted,
    hasRuntimeQueueServiceBridge: Boolean(runtimeQueueServiceBridge),
    runtimeQueueServiceBridgeAccepted: queueBridgeAccepted,
    authorizationAccepted: recordAccepted,
  })
  const recorded =
    status === 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked'
  const candidateReady = controlledAccepted && queueBridgeAccepted

  const sourceScopes = controlledApproval?.toolScopes ?? []
  const toolScopes = sourceScopes.map((scope): AiGraphicsExternalBetaLiveEnqueueAuthorizationScope => ({
    toolId: scope.toolId,
    productionToolId: scope.productionToolId,
    workerType: scope.workerType,
    runtimeTarget: scope.runtimeTarget,
    capabilityIds: [...scope.capabilityIds],
    gpuRequiredForRuntime: scope.gpuRequiredForRuntime,
    controlledRuntimeActivationPolicy: scope.controlledRuntimeActivationPolicy,
    sourceControlledRuntimeExecutionScopeApprovedWithProvidedEvidence:
      scope.controlledRuntimeExecutionScopeApprovedWithProvidedEvidence,
    sourceRuntimeQueueServiceBridgeAcceptedWithProvidedEvidence:
      queueBridgeAccepted,
    liveEnqueueAuthorizationCandidateWithProvidedEvidence:
      candidateReady &&
      scope.controlledRuntimeExecutionScopeApprovedWithProvidedEvidence,
    liveEnqueueAuthorizationRecordedWithProvidedEvidence:
      recorded &&
      scope.controlledRuntimeExecutionScopeApprovedWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      recorded && scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveQueueWriteApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    nextExternalBetaMilestone:
      'run non-production live queue write smoke after explicit service-role owner gate',
  }))

  const capabilityIds = new Set(
    toolScopes.flatMap((scope) => scope.capabilityIds),
  )
  const controlledApprovedScopes = toolScopes.filter(
    (scope) => scope.sourceControlledRuntimeExecutionScopeApprovedWithProvidedEvidence,
  ).length
  const candidateScopes = toolScopes.filter(
    (scope) => scope.liveEnqueueAuthorizationCandidateWithProvidedEvidence,
  ).length
  const recordedScopes = toolScopes.filter(
    (scope) => scope.liveEnqueueAuthorizationRecordedWithProvidedEvidence,
  ).length
  const gpuRuntimeTargetedTools =
    toolScopes.filter((scope) => scope.gpuRequiredForRuntime).length
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools =
    toolScopes.filter((scope) => scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob).length

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION,
    sourceControlledRuntimeExecutionApprovalDecision:
      controlledApproval?.decision ?? null,
    sourceRuntimeQueueServiceBridgeDecision:
      runtimeQueueServiceBridge?.sourceDecision ?? null,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    controlledRuntimeExecutionApprovedToolsWithProvidedEvidence:
      controlledApprovedScopes,
    runtimeQueueServiceBridgeAcceptedWithProvidedEvidenceRequests:
      queueBridgeAccepted ? 1 : 0,
    liveEnqueueAuthorizationCandidateToolsWithProvidedEvidence:
      candidateScopes,
    liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence:
      recordedScopes,
    gpuRuntimeTargetedTools,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceControlledRuntimeExecutionApproval: controlledApproval,
    sourceRuntimeQueueServiceBridge: runtimeQueueServiceBridge,
    liveEnqueueAuthorizationRecord: {
      accepted: recordAccepted,
      operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR',
      authorizationRef: input.externalBetaLiveEnqueueAuthorizationRef ?? null,
      nonProductionEnvironmentRef:
        input.externalBetaNonProductionEnvironmentRef ?? null,
      queueWriteWindowRef: input.externalBetaQueueWriteWindowRef ?? null,
      cleanupPlanRef: input.externalBetaCleanupPlanRef ?? null,
      rollbackPlanRef: input.externalBetaRollbackPlanRef ?? null,
      costCeilingRef: input.externalBetaCostCeilingRef ?? null,
      authorizesLiveQueueWriteNow: false,
      authorizesWorkerDispatchNow: false,
      authorizesToolExecutionNow: false,
      authorizesRuntimeNow: false,
    },
    allowedLiveEnqueueAuthorizationActions,
    blockedRuntimeActions,
    toolScopes,
    nextMilestones,
    booleans: {
      externalBetaLiveEnqueueAuthorizationPrepared: true,
      sourceControlledRuntimeExecutionApprovalAccepted: controlledAccepted,
      sourceRuntimeQueueServiceBridgeAccepted: queueBridgeAccepted,
      liveEnqueueAuthorizationRecordAccepted: recordAccepted,
      all21ToolsCovered: toolScopes.length === 21,
      all12CapabilitiesCovered: capabilityIds.size === 12,
      all21LiveEnqueueAuthorizationScopesPrepared: toolScopes.length === 21,
      all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence:
        recordedScopes === 21,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
      gpuRuntimeShouldStartNow: false,
      cpuFallbackAllowedForHeavyTools: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
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
