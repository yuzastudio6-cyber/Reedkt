import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
} from './ai-graphics-external-beta-service-role-queue-smoke-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION =
  'ai_graphics_external_beta_service_role_queue_smoke_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode =
  | 'all_tools_external_beta'
  | 'cpu_static_first_cohort'

export type AiGraphicsExternalBetaServiceRoleQueueSmokeProofStatus =
  | 'missing_external_beta_service_role_queue_smoke_result'
  | 'external_beta_service_role_queue_smoke_proof_rejected'
  | 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks'

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeResult {
  ok: true
  decision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup'
  status: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution'
  toolsSubmitted: number
  toolsSubmittedIds: AiGraphicsCanonicalToolId[]
  jobIdsReturned: number
  workerClaimsReturned: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: number
  sourceRuntimeQueueServiceProofBridgeAccepted: true
  liveServiceRoleQueueSmokeExecutedNow: true
  liveSupabaseQueueWritesNow: number
  liveWorkerClaimRowsNow: number
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  fixtureRowsPersistedAfterCleanup: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeProofInput {
  sourceExternalBetaServiceRoleQueueSmokeReadinessPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness
  serviceRoleQueueSmokeResult?: AiGraphicsExternalBetaServiceRoleQueueSmokeResult
  serviceRoleQueueSmokeEvidenceRef?: string
  serviceRoleQueueSmokeTelemetryRef?: string
  serviceRoleQueueSmokeCleanupProofRef?: string
}

export interface AiGraphicsExternalBetaServiceRoleQueueSmokeProof {
  decision: AiGraphicsExternalBetaServiceRoleQueueSmokeProofStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION
  sourceReadinessAccepted: boolean
  proofAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  acceptedTools: AiGraphicsCanonicalToolId[]
  acceptedGpuTools: AiGraphicsCanonicalToolId[]
  acceptedCpuStaticFirstCohortTools: AiGraphicsCanonicalToolId[]
  counts: {
    toolsCovered: 21
    productFacingCapabilitiesCovered: 12
    gpuToolsCovered: 8
    heavyToolsIncorrectlyTargetingCpu: 0
    serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: number
    sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence: number
    sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence: number
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
    sourceLiveQueueWritesAcceptedWithProvidedEvidence: number
    sourceWorkerClaimRowsAcceptedWithProvidedEvidence: number
    sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0
    sourceToolExecutionsAcceptedWithProvidedEvidence: 0
    cleanupPersistedRowsAfterSmoke: 0
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  evidence: {
    serviceRoleQueueSmokeEvidenceRef: string | null
    serviceRoleQueueSmokeTelemetryRef: string | null
    serviceRoleQueueSmokeCleanupProofRef: string | null
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    sourceGatewayRuntimeAdmissionModesByTool:
      Record<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode>
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: boolean
    sourceLiveServiceRoleQueueSmokeExecutedWithProvidedEvidence: boolean
    requiredExecutionEnvironment: 'non_production_external_beta'
    requiredWorkerMode: 'mock'
    requiredE2eRuntimeMode: 'local'
    serverOnlyServiceRoleCredentials: true
  }
  policy: {
    validatesSavedSmokeResultOnly: true
    noLiveSupabaseWriteByProofValidator: true
    noWorkerDispatchByProofValidator: true
    noToolExecutionByProofValidator: true
    noGpuRuntimeStartByProofValidator: true
    sourceRuntimeQueueServiceProofBridgeRequired: true
    cleanupMustPersistZeroRows: true
    nextGateRequiresWorkerLeaseAndDispatchProof: true
  }
  booleans: {
    externalBetaServiceRoleQueueSmokeProofPrepared: true
    sourceRuntimeQueueServiceBridgeAccepted: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeReadinessAccepted: boolean
    serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    heavyToolsIncorrectlyTargetingCpu: false
    sourceQueueWritesAcceptedWithProvidedEvidence: boolean
    sourceWorkerClaimsAcceptedWithProvidedEvidence: boolean
    cleanupVerifiedWithProvidedEvidence: boolean
    serverOnlyServiceRoleCredentials: true
    nonProductionEnvironmentRequired: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    liveQueueWriteApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
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
    routeExecutionPerformed: false
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

function productCapabilityCount(): 12 {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .filter((capability) => (
      capability !== 'planning_metadata_only' &&
      capability !== 'blocked_or_deferred'
    ))
    .length as 12
}

function gpuTools(): AiGraphicsCanonicalToolId[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => record.gpuRequiredForRuntime)
    .map((record) => record.toolId)
}

function sourceGatewayRuntimeAdmissionModeForTool(
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode {
  return toolId === 'd3' ? 'cpu_static_first_cohort' : 'all_tools_external_beta'
}

function sourceGatewayRuntimeAdmissionModesByTool():
  Record<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode> {
  return Object.fromEntries(
    AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => [
      toolId,
      sourceGatewayRuntimeAdmissionModeForTool(toolId),
    ]),
  ) as Record<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode>
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sameToolSet(input: readonly string[] | undefined): boolean {
  if (!input) return false
  const expected = [...AI_GRAPHICS_CANONICAL_TOOL_IDS].sort()
  const actual = [...input].sort()
  return expected.length === actual.length &&
    expected.every((toolId, index) => toolId === actual[index])
}

function readinessAccepted(
  packet?: AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_service_role_queue_smoke_prepared_not_executed' &&
    packet.serviceRoleQueueSmokePreparedWithProvidedEvidence === true &&
    packet.sourceExternalBetaRuntimeQueueServiceBridgeAccepted === true &&
    packet.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function validateSmokeResult(
  result: AiGraphicsExternalBetaServiceRoleQueueSmokeResult | undefined,
): string[] {
  if (!result) return ['external beta service-role queue smoke result is missing']
  return [
    result.ok !== true ? 'smoke result ok flag is not true' : undefined,
    result.decision !== 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup'
      ? 'smoke result decision is not accepted'
      : undefined,
    result.status !== 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution'
      ? 'smoke result status is not accepted'
      : undefined,
    result.toolsSubmitted !== 21 ? 'smoke result must submit all 21 tools' : undefined,
    !sameToolSet(result.toolsSubmittedIds)
      ? 'smoke result tool ids do not cover all 21 tools'
      : undefined,
    result.jobIdsReturned !== 21 ? 'smoke result must return 21 job ids' : undefined,
    result.workerClaimsReturned !== 21 ? 'smoke result must return 21 worker claims' : undefined,
    result.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== 8
      ? 'smoke result must preserve eight GPU-targeted tools'
      : undefined,
    result.sourceRuntimeQueueServiceProofBridgeAccepted !== true
      ? 'smoke result must preserve the runtime queue service proof bridge'
      : undefined,
    result.liveServiceRoleQueueSmokeExecutedNow !== true
      ? 'smoke result must come from the explicit live non-production smoke'
      : undefined,
    result.liveSupabaseQueueWritesNow !== 21
      ? 'smoke result must write exactly 21 queue rows before cleanup'
      : undefined,
    result.liveWorkerClaimRowsNow !== 21
      ? 'smoke result must claim exactly 21 worker rows before cleanup'
      : undefined,
    result.liveWorkerDispatchesNow !== 0
      ? 'smoke result must not dispatch workers'
      : undefined,
    result.liveToolExecutionsNow !== 0
      ? 'smoke result must not execute tools'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'smoke result must not start GPU runtime'
      : undefined,
    result.fixtureRowsPersistedAfterCleanup !== 0
      ? 'smoke cleanup must leave zero persisted rows'
      : undefined,
    result.externalBetaReadyNowTools !== 0
      ? 'smoke result must not unlock external beta ready-now tools'
      : undefined,
    result.productionReadyNowTools !== 0
      ? 'smoke result must not unlock production ready-now tools'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildBooleans(input: {
  accepted: boolean
  readiness: boolean
  sourceQueueWritesAccepted: boolean
  sourceWorkerClaimsAccepted: boolean
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  cleanupVerified: boolean
}) {
  return {
    externalBetaServiceRoleQueueSmokeProofPrepared: true,
    sourceRuntimeQueueServiceBridgeAccepted: input.readiness,
    sourceRuntimeQueueServiceProofBridgeAccepted:
      input.sourceRuntimeQueueServiceProofBridgeAccepted,
    sourceServiceRoleQueueSmokeReadinessAccepted: input.readiness,
    serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence: input.accepted,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all8GpuToolsTargetGpuRuntime: true,
    heavyToolsIncorrectlyTargetingCpu: false,
    sourceQueueWritesAcceptedWithProvidedEvidence: input.sourceQueueWritesAccepted,
    sourceWorkerClaimsAcceptedWithProvidedEvidence: input.sourceWorkerClaimsAccepted,
    cleanupVerifiedWithProvidedEvidence: input.cleanupVerified,
    serverOnlyServiceRoleCredentials: true,
    nonProductionEnvironmentRequired: true,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    workerQueueApprovedNow: false,
    serviceRoleQueueSmokeApprovedNow: false,
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveQueueWriteApprovedNow: false,
    liveWorkerClaimInsertApprovedNow: false,
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
    routeExecutionPerformed: false,
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
  } as const
}

export function evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeProof(
  input: AiGraphicsExternalBetaServiceRoleQueueSmokeProofInput = {},
): AiGraphicsExternalBetaServiceRoleQueueSmokeProof {
  const readiness = readinessAccepted(
    input.sourceExternalBetaServiceRoleQueueSmokeReadinessPacket,
  )
  const resultReasons = validateSmokeResult(input.serviceRoleQueueSmokeResult)
  const sourceRuntimeQueueServiceProofBridgeAccepted =
    readiness &&
    input.serviceRoleQueueSmokeResult?.sourceRuntimeQueueServiceProofBridgeAccepted === true
  const evidenceRefsMissing = [
    !hasValue(input.serviceRoleQueueSmokeEvidenceRef)
      ? 'service-role queue smoke evidence ref is missing'
      : undefined,
    !hasValue(input.serviceRoleQueueSmokeTelemetryRef)
      ? 'service-role queue smoke telemetry ref is missing'
      : undefined,
    !hasValue(input.serviceRoleQueueSmokeCleanupProofRef)
      ? 'service-role queue smoke cleanup proof ref is missing'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
  const readinessReasons = readiness
    ? []
    : ['accepted service-role queue smoke readiness packet is missing']
  const rejectionReasons = [
    ...readinessReasons,
    ...resultReasons,
    ...evidenceRefsMissing,
  ]
  const accepted = rejectionReasons.length === 0
  const tools = accepted ? [...AI_GRAPHICS_CANONICAL_TOOL_IDS] : []
  const gpu = accepted ? gpuTools() : []
  const sourceModes = sourceGatewayRuntimeAdmissionModesByTool()
  const cpuStaticFirstCohortTools = accepted
    ? tools.filter((toolId) => sourceModes[toolId] === 'cpu_static_first_cohort')
    : []

  return {
    decision: !input.serviceRoleQueueSmokeResult
      ? 'missing_external_beta_service_role_queue_smoke_result'
      : accepted
        ? 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks'
        : 'external_beta_service_role_queue_smoke_proof_rejected',
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION,
    sourceReadinessAccepted: readiness,
    proofAcceptedWithProvidedEvidence: accepted,
    rejectionReasons,
    acceptedTools: tools,
    acceptedGpuTools: gpu,
    acceptedCpuStaticFirstCohortTools: cpuStaticFirstCohortTools,
    counts: {
      toolsCovered: 21,
      productFacingCapabilitiesCovered: productCapabilityCount(),
      gpuToolsCovered: 8,
      heavyToolsIncorrectlyTargetingCpu: 0,
      serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: tools.length,
      sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence:
        accepted ? tools.length : 0,
      sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence:
        cpuStaticFirstCohortTools.length,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        accepted ? tools.length : 0,
      sourceLiveQueueWritesAcceptedWithProvidedEvidence: accepted ? 21 : 0,
      sourceWorkerClaimRowsAcceptedWithProvidedEvidence: accepted ? 21 : 0,
      sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
      sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
      cleanupPersistedRowsAfterSmoke: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      serviceRoleQueueSmokeEvidenceRef:
        input.serviceRoleQueueSmokeEvidenceRef ?? null,
      serviceRoleQueueSmokeTelemetryRef:
        input.serviceRoleQueueSmokeTelemetryRef ?? null,
      serviceRoleQueueSmokeCleanupProofRef:
        input.serviceRoleQueueSmokeCleanupProofRef ?? null,
      sanitizedSourceStatus: input.serviceRoleQueueSmokeResult?.status ?? null,
      sanitizedSourceDecision: input.serviceRoleQueueSmokeResult?.decision ?? null,
      sourceGatewayRuntimeAdmissionModesByTool: sourceModes,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        accepted && sourceRuntimeQueueServiceProofBridgeAccepted,
      sourceLiveServiceRoleQueueSmokeExecutedWithProvidedEvidence: accepted,
      requiredExecutionEnvironment: 'non_production_external_beta',
      requiredWorkerMode: 'mock',
      requiredE2eRuntimeMode: 'local',
      serverOnlyServiceRoleCredentials: true,
    },
    policy: {
      validatesSavedSmokeResultOnly: true,
      noLiveSupabaseWriteByProofValidator: true,
      noWorkerDispatchByProofValidator: true,
      noToolExecutionByProofValidator: true,
      noGpuRuntimeStartByProofValidator: true,
      sourceRuntimeQueueServiceProofBridgeRequired: true,
      cleanupMustPersistZeroRows: true,
      nextGateRequiresWorkerLeaseAndDispatchProof: true,
    },
    booleans: buildBooleans({
      accepted,
      readiness,
      sourceQueueWritesAccepted: accepted,
      sourceWorkerClaimsAccepted: accepted,
      sourceRuntimeQueueServiceProofBridgeAccepted,
      cleanupVerified: accepted,
    }),
  }
}
