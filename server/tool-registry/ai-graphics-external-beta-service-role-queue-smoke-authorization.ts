import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from './ai-graphics-external-beta-live-enqueue-authorization'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION,
  type AiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
} from './ai-graphics-external-beta-service-role-queue-smoke-preflight'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
} from './ai-graphics-external-beta-service-role-queue-smoke-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationStatus =
  | 'missing_external_beta_live_enqueue_authorization'
  | 'external_beta_live_enqueue_authorization_rejected'
  | 'missing_external_beta_service_role_queue_smoke_readiness'
  | 'external_beta_service_role_queue_smoke_readiness_rejected'
  | 'missing_external_beta_service_role_queue_smoke_preflight'
  | 'external_beta_service_role_queue_smoke_preflight_rejected'
  | 'awaiting_external_beta_service_role_queue_smoke_authorization'
  | 'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked'

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationInput {
  sourceExternalBetaLiveEnqueueAuthorizationPacket?:
    AiGraphicsExternalBetaLiveEnqueueAuthorization
  sourceExternalBetaServiceRoleQueueSmokeReadinessPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness
  sourceExternalBetaServiceRoleQueueSmokePreflightPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokePreflight
  externalBetaServiceRoleQueueSmokeAuthorizationGranted?: boolean
  externalBetaServiceRoleQueueSmokeAuthorizationRef?: string
  externalBetaServiceRoleQueueSmokeOperatorRole?: string
  externalBetaServiceRoleQueueSmokeReadinessRef?: string
  externalBetaServiceRoleQueueSmokePreflightRef?: string
  externalBetaNonProductionEnvironmentRef?: string
  externalBetaQueueWriteWindowRef?: string
  externalBetaCleanupPlanRef?: string
  externalBetaRollbackPlanRef?: string
  externalBetaTelemetryRef?: string
  externalBetaCostCeilingRef?: string
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationScope {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence: boolean
  sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidence: boolean
  sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidence: boolean
  serviceRoleQueueSmokeAuthorizationCandidateWithProvidedEvidence: boolean
  serviceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  serviceRoleQueueSmokeApprovedNow: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  nextExternalBetaMilestone: string
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION
  sourceExternalBetaLiveEnqueueAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION | null
  sourceExternalBetaServiceRoleQueueSmokeReadinessDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION | null
  sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION | null
  status: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: number
  sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidenceRequests: number
  sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests: number
  serviceRoleQueueSmokeAuthorizationCandidateToolsWithProvidedEvidence: number
  serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: number
  gpuRuntimeTargetedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: number
  heavyToolsIncorrectlyTargetingCpu: 0
  serviceRoleQueueSmokeApprovedNowTools: 0
  liveQueueWritesApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerDispatchApprovedNowTools: 0
  toolExecutionApprovedNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceExternalBetaLiveEnqueueAuthorization:
    AiGraphicsExternalBetaLiveEnqueueAuthorization | null
  sourceExternalBetaServiceRoleQueueSmokeReadiness:
    AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness | null
  sourceExternalBetaServiceRoleQueueSmokePreflight:
    AiGraphicsExternalBetaServiceRoleQueueSmokePreflight | null
  serviceRoleQueueSmokeAuthorizationRecord: {
    accepted: boolean
    operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR'
    authorizationRef: string | null
    smokeReadinessRef: string | null
    smokePreflightRef: string | null
    nonProductionEnvironmentRef: string | null
    queueWriteWindowRef: string | null
    cleanupPlanRef: string | null
    rollbackPlanRef: string | null
    telemetryRef: string | null
    costCeilingRef: string | null
    authorizesServiceRoleQueueSmokeNow: false
    authorizesLiveQueueWriteNow: false
    authorizesWorkerDispatchNow: false
    authorizesToolExecutionNow: false
    authorizesRuntimeNow: false
  }
  allowedServiceRoleQueueSmokeAuthorizationActions: string[]
  blockedRuntimeActions: string[]
  toolScopes: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationScope[]
  nextMilestones: string[]
  booleans: {
    externalBetaServiceRoleQueueSmokeAuthorizationPrepared: true
    sourceExternalBetaLiveEnqueueAuthorizationAccepted: boolean
    sourceExternalBetaServiceRoleQueueSmokeReadinessAccepted: boolean
    sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: boolean
    serviceRoleQueueSmokeAuthorizationRecordAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all21ServiceRoleQueueSmokeAuthorizationScopesPrepared: boolean
    all21ServiceRoleQueueSmokeAuthorizationScopesRecordedWithProvidedEvidence: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedOnlyForAcceptedJobs: true
    gpuRuntimeShouldStartNow: false
    cpuFallbackAllowedForHeavyTools: false
    serviceRoleCredentialsServerOnly: true
    nonProductionEnvironmentRequired: true
    explicitSmokeConfirmationRequired: true
    cleanupRequired: true
    rollbackRequired: true
    telemetryRequired: true
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

const allowedServiceRoleQueueSmokeAuthorizationActions = [
  'accept all-21 live-enqueue authorization evidence',
  'accept side-effect-free service-role queue smoke readiness evidence',
  'accept side-effect-free service-role queue smoke preflight evidence',
  'record non-production service-role queue smoke authorization metadata',
  'keep live Supabase queue writes and worker dispatch blocked in this evaluator',
]

const blockedRuntimeActions = [
  'service-role queue smoke execution now',
  'live Supabase queue write',
  'job batch insert',
  'job insert',
  'worker claim row insert',
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
  'run the explicitly confirmed non-production service-role queue write smoke in a private environment',
  'save a sanitized queue smoke result and validate it with the existing proof validator',
  'prove worker lease and dispatch after accepted service-role queue smoke proof',
  'keep GPU startup bound to accepted worker/tool jobs and never idle',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasPrivateEvidenceRef(value?: string): boolean {
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
    normalized.startsWith('external-beta-live-enqueue://') ||
    normalized.startsWith('external-beta-service-role-smoke://')
}

function liveEnqueueAuthorizationAccepted(
  packet?: AiGraphicsExternalBetaLiveEnqueueAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked' &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    packet.liveQueueWritesApprovedNowTools === 0 &&
    packet.liveQueueWritesPerformedNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence === true &&
    packet.booleans.gpuHeavyToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function serviceRoleQueueSmokeReadinessAccepted(
  packet?: AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision ===
      AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_READINESS_DECISION &&
    packet.decision === 'external_beta_service_role_queue_smoke_prepared_not_executed' &&
    packet.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted === true &&
    packet.externalBetaServiceRoleQueueSmokeControlsSatisfied === true &&
    packet.serviceRoleQueueSmokePreparedWithProvidedEvidence === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted === true &&
    packet.booleans.serviceRoleQueueSmokePreparedWithProvidedEvidence === true &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.serviceRoleCredentialsServerOnly === true &&
    packet.booleans.liveServiceRoleQueueSmokeExecutedNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function serviceRoleQueueSmokePreflightAccepted(
  packet?: AiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION &&
    packet.status === 'ready_to_execute_non_production_service_role_queue_smoke' &&
    packet.toolsCovered === 21 &&
    packet.productFacingCapabilitiesCovered === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.all21PayloadsPrepared === true &&
    packet.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.readyToExecuteLiveNonProductionSmoke === true &&
    packet.liveSupabaseQueueWritesNow === 0 &&
    packet.liveWorkerClaimRowsNow === 0 &&
    packet.liveWorkerDispatchesNow === 0 &&
    packet.liveToolExecutionsNow === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.requiredEnvironmentSatisfied === true &&
    packet.booleans.requiredFlagsSatisfied === true &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.readyToExecuteLiveNonProductionSmoke === true &&
    packet.booleans.secretsRedactedFromOutput === true &&
    packet.booleans.serviceRoleCredentialsServerOnly === true &&
    packet.booleans.liveServiceRoleQueueSmokeExecutedNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.serviceRoleQueueSmokePerformed === false &&
    packet.booleans.supabaseMutationPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function authorizationRecordAccepted(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationInput,
): boolean {
  return input.externalBetaServiceRoleQueueSmokeAuthorizationGranted === true &&
    hasPrivateEvidenceRef(input.externalBetaServiceRoleQueueSmokeAuthorizationRef) &&
    (input.externalBetaServiceRoleQueueSmokeOperatorRole ??
      'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR') ===
        'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR' &&
    hasPrivateEvidenceRef(input.externalBetaServiceRoleQueueSmokeReadinessRef) &&
    hasPrivateEvidenceRef(input.externalBetaServiceRoleQueueSmokePreflightRef) &&
    hasPrivateEvidenceRef(input.externalBetaNonProductionEnvironmentRef) &&
    hasPrivateEvidenceRef(input.externalBetaQueueWriteWindowRef) &&
    hasPrivateEvidenceRef(input.externalBetaCleanupPlanRef) &&
    hasPrivateEvidenceRef(input.externalBetaRollbackPlanRef) &&
    hasPrivateEvidenceRef(input.externalBetaTelemetryRef) &&
    hasPrivateEvidenceRef(input.externalBetaCostCeilingRef)
}

function statusFromInput(input: {
  hasLiveEnqueueAuthorization: boolean
  liveEnqueueAuthorizationAccepted: boolean
  hasReadiness: boolean
  readinessAccepted: boolean
  hasPreflight: boolean
  preflightAccepted: boolean
  authorizationAccepted: boolean
}): AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationStatus {
  if (!input.hasLiveEnqueueAuthorization) {
    return 'missing_external_beta_live_enqueue_authorization'
  }
  if (!input.liveEnqueueAuthorizationAccepted) {
    return 'external_beta_live_enqueue_authorization_rejected'
  }
  if (!input.hasReadiness) {
    return 'missing_external_beta_service_role_queue_smoke_readiness'
  }
  if (!input.readinessAccepted) {
    return 'external_beta_service_role_queue_smoke_readiness_rejected'
  }
  if (!input.hasPreflight) {
    return 'missing_external_beta_service_role_queue_smoke_preflight'
  }
  if (!input.preflightAccepted) {
    return 'external_beta_service_role_queue_smoke_preflight_rejected'
  }
  if (!input.authorizationAccepted) {
    return 'awaiting_external_beta_service_role_queue_smoke_authorization'
  }
  return 'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked'
}

export function buildAiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationInput = {},
): AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization {
  const liveEnqueueAuthorization =
    input.sourceExternalBetaLiveEnqueueAuthorizationPacket ?? null
  const readiness =
    input.sourceExternalBetaServiceRoleQueueSmokeReadinessPacket ?? null
  const preflight =
    input.sourceExternalBetaServiceRoleQueueSmokePreflightPacket ?? null
  const liveAccepted = liveEnqueueAuthorizationAccepted(
    input.sourceExternalBetaLiveEnqueueAuthorizationPacket,
  )
  const readinessAccepted = serviceRoleQueueSmokeReadinessAccepted(
    input.sourceExternalBetaServiceRoleQueueSmokeReadinessPacket,
  )
  const preflightAccepted = serviceRoleQueueSmokePreflightAccepted(
    input.sourceExternalBetaServiceRoleQueueSmokePreflightPacket,
  )
  const recordAccepted = authorizationRecordAccepted(input)
  const status = statusFromInput({
    hasLiveEnqueueAuthorization: Boolean(liveEnqueueAuthorization),
    liveEnqueueAuthorizationAccepted: liveAccepted,
    hasReadiness: Boolean(readiness),
    readinessAccepted,
    hasPreflight: Boolean(preflight),
    preflightAccepted,
    authorizationAccepted: recordAccepted,
  })
  const recorded =
    status ===
      'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked'
  const candidateReady = liveAccepted && readinessAccepted && preflightAccepted

  const sourceScopes = liveEnqueueAuthorization?.toolScopes ?? []
  const toolScopes = sourceScopes.map((scope): AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationScope => ({
    toolId: scope.toolId,
    productionToolId: scope.productionToolId,
    workerType: scope.workerType,
    runtimeTarget: scope.runtimeTarget,
    capabilityIds: [...scope.capabilityIds],
    gpuRequiredForRuntime: scope.gpuRequiredForRuntime,
    sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence:
      scope.liveEnqueueAuthorizationRecordedWithProvidedEvidence,
    sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidence:
      readinessAccepted,
    sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidence:
      preflightAccepted,
    serviceRoleQueueSmokeAuthorizationCandidateWithProvidedEvidence:
      candidateReady &&
      scope.liveEnqueueAuthorizationRecordedWithProvidedEvidence,
    serviceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence:
      recorded &&
      scope.liveEnqueueAuthorizationRecordedWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      recorded && scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    serviceRoleQueueSmokeApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    nextExternalBetaMilestone:
      'run the non-production service-role queue smoke and save sanitized proof',
  }))

  const capabilityIds = new Set(
    toolScopes.flatMap((scope) => scope.capabilityIds),
  )
  const sourceLiveRecorded = toolScopes.filter(
    (scope) => scope.sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence,
  ).length
  const candidateScopes = toolScopes.filter(
    (scope) => scope.serviceRoleQueueSmokeAuthorizationCandidateWithProvidedEvidence,
  ).length
  const recordedScopes = toolScopes.filter(
    (scope) => scope.serviceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence,
  ).length
  const gpuRuntimeTargetedTools =
    toolScopes.filter((scope) => scope.gpuRequiredForRuntime).length
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools =
    toolScopes.filter((scope) => scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob).length

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION,
    sourceExternalBetaLiveEnqueueAuthorizationDecision:
      liveEnqueueAuthorization?.decision ?? null,
    sourceExternalBetaServiceRoleQueueSmokeReadinessDecision:
      readiness?.sourceDecision ?? null,
    sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
      preflight?.decision ?? null,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence:
      sourceLiveRecorded,
    sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidenceRequests:
      readinessAccepted ? 1 : 0,
    sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests:
      preflightAccepted ? 1 : 0,
    serviceRoleQueueSmokeAuthorizationCandidateToolsWithProvidedEvidence:
      candidateScopes,
    serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence:
      recordedScopes,
    gpuRuntimeTargetedTools,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    serviceRoleQueueSmokeApprovedNowTools: 0,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceExternalBetaLiveEnqueueAuthorization: liveEnqueueAuthorization,
    sourceExternalBetaServiceRoleQueueSmokeReadiness: readiness,
    sourceExternalBetaServiceRoleQueueSmokePreflight: preflight,
    serviceRoleQueueSmokeAuthorizationRecord: {
      accepted: recordAccepted,
      operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR',
      authorizationRef:
        input.externalBetaServiceRoleQueueSmokeAuthorizationRef ?? null,
      smokeReadinessRef:
        input.externalBetaServiceRoleQueueSmokeReadinessRef ?? null,
      smokePreflightRef:
        input.externalBetaServiceRoleQueueSmokePreflightRef ?? null,
      nonProductionEnvironmentRef:
        input.externalBetaNonProductionEnvironmentRef ?? null,
      queueWriteWindowRef: input.externalBetaQueueWriteWindowRef ?? null,
      cleanupPlanRef: input.externalBetaCleanupPlanRef ?? null,
      rollbackPlanRef: input.externalBetaRollbackPlanRef ?? null,
      telemetryRef: input.externalBetaTelemetryRef ?? null,
      costCeilingRef: input.externalBetaCostCeilingRef ?? null,
      authorizesServiceRoleQueueSmokeNow: false,
      authorizesLiveQueueWriteNow: false,
      authorizesWorkerDispatchNow: false,
      authorizesToolExecutionNow: false,
      authorizesRuntimeNow: false,
    },
    allowedServiceRoleQueueSmokeAuthorizationActions,
    blockedRuntimeActions,
    toolScopes,
    nextMilestones,
    booleans: {
      externalBetaServiceRoleQueueSmokeAuthorizationPrepared: true,
      sourceExternalBetaLiveEnqueueAuthorizationAccepted: liveAccepted,
      sourceExternalBetaServiceRoleQueueSmokeReadinessAccepted: readinessAccepted,
      sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: preflightAccepted,
      serviceRoleQueueSmokeAuthorizationRecordAccepted: recordAccepted,
      all21ToolsCovered: toolScopes.length === 21,
      all12CapabilitiesCovered: capabilityIds.size === 12,
      all21ServiceRoleQueueSmokeAuthorizationScopesPrepared:
        toolScopes.length === 21,
      all21ServiceRoleQueueSmokeAuthorizationScopesRecordedWithProvidedEvidence:
        recordedScopes === 21,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
      gpuRuntimeShouldStartNow: false,
      cpuFallbackAllowedForHeavyTools: false,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
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
