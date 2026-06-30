import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmoke,
  AiGraphicsExternalBetaWorkerDispatchSmokeCapabilityScenario,
  AiGraphicsExternalBetaWorkerDispatchSmokeRecord,
} from './ai-graphics-external-beta-worker-dispatch-smoke'

export const AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION =
  'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaWorkerDispatchSmokeProofStatus =
  | 'missing_external_beta_worker_dispatch_smoke_result'
  | 'external_beta_worker_dispatch_smoke_proof_rejected'
  | 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks'

export interface AiGraphicsExternalBetaWorkerDispatchSmokeProofInput {
  workerDispatchSmokeResult?: AiGraphicsExternalBetaWorkerDispatchSmoke
  workerDispatchSmokeEvidenceRef?: string
  workerDispatchSmokeTelemetryRef?: string
  workerDispatchSmokeLeaseAuditRef?: string
  workerDispatchSmokeCleanupProofRef?: string
}

export interface AiGraphicsExternalBetaWorkerDispatchSmokeProof {
  decision: AiGraphicsExternalBetaWorkerDispatchSmokeProofStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION
  proofAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  acceptedTools: AiGraphicsCanonicalToolId[]
  acceptedGpuTools: AiGraphicsCanonicalToolId[]
  counts: {
    toolsCovered: 21
    productFacingCapabilitiesCovered: 12
    gpuToolsCovered: 8
    workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: number
    sourceSmokeJobsCompletedWithProvidedEvidence: number
    sourceCapabilityScenariosCompletedWithProvidedEvidence: number
    sourceInMemoryLeaseRecordsCreated: number
    sourceInMemoryLeaseRecordsReleased: number
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: number
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: number
    sourceLiveWorkerLeasesCreatedNow: 0
    sourceLiveWorkerDispatchesNow: 0
    sourceLiveToolExecutionsNow: 0
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  evidence: {
    workerDispatchSmokeEvidenceRef: string | null
    workerDispatchSmokeTelemetryRef: string | null
    workerDispatchSmokeLeaseAuditRef: string | null
    workerDispatchSmokeCleanupProofRef: string | null
    serviceRoleQueueSmokeAuthorizationRef: string | null
    sanitizedSourceDecision: string | null
    sourceMockDispatcherSmokeCompletedWithProvidedEvidence: boolean
    sourceAllRoutesMockOnly: boolean
    sourceAllRoutesAiGraphicsToolCallHandoff: boolean
    sourceAllInMemoryLeasesCreated: boolean
    sourceAllInMemoryLeasesReleased: boolean
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: boolean
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
    requiredExecutionEnvironment: 'non_production_external_beta'
    requiredWorkerMode: 'mock'
    requiredE2eRuntimeMode: 'local'
  }
  policy: {
    validatesSavedWorkerDispatchSmokeResultOnly: true
    noLiveWorkerLeaseByProofValidator: true
    noLiveProductionWorkerDispatchByProofValidator: true
    noToolExecutionByProofValidator: true
    noProviderRuntimeByProofValidator: true
    noBrowserWebglCanvasRuntimeByProofValidator: true
    noGpuRuntimeStartByProofValidator: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresExternalBetaRuntimeExecutionProof: true
  }
  booleans: {
    externalBetaWorkerDispatchSmokeProofPrepared: true
    sourceWorkerDispatchSmokeAcceptedWithProvidedEvidence: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: boolean
    workerDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21SmokeJobsAcceptedWithProvidedEvidence: boolean
    all12CapabilitySmokeScenariosAcceptedWithProvidedEvidence: boolean
    allInMemoryLeasesCreatedWithProvidedEvidence: boolean
    allInMemoryLeasesReleasedWithProvidedEvidence: boolean
    allRoutesMockOnlyWithProvidedEvidence: boolean
    allRoutesAiGraphicsToolCallHandoffWithProvidedEvidence: boolean
    allToolRunResultsEmpty: boolean
    allArtifactRecordsEmpty: boolean
    allQualityGateResultsEmpty: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    backendQueueSubmissionPerformed: false
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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

function productCapabilities(): string[] {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ))
}

function productCapabilityCount(): 12 {
  return productCapabilities().length as 12
}

function gpuTools(): AiGraphicsCanonicalToolId[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => record.gpuRequiredForRuntime)
    .map((record) => record.toolId)
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sameSet(input: readonly string[] | undefined, expected: readonly string[]): boolean {
  if (!input) return false
  const actualSorted = [...input].sort()
  const expectedSorted = [...expected].sort()
  return actualSorted.length === expectedSorted.length &&
    expectedSorted.every((value, index) => value === actualSorted[index])
}

function falseGateReasons(
  booleans: Record<string, unknown> | undefined,
): string[] {
  if (!booleans) return ['worker dispatch smoke booleans are missing']
  return falseGateKeys
    .filter((key) => booleans[key] !== false)
    .map((key) => `worker dispatch smoke boolean ${key} must be false`)
}

function validateRecord(
  record: AiGraphicsExternalBetaWorkerDispatchSmokeRecord,
): string[] {
  return [
    !AI_GRAPHICS_CANONICAL_TOOL_IDS.includes(record.toolId)
      ? `unknown tool id ${record.toolId}`
      : undefined,
    record.payloadShapeValid !== true
      ? `payload shape is not valid for ${record.toolId}`
      : undefined,
    record.productionWorkerJobStatus !== 'completed'
      ? `worker job did not complete for ${record.toolId}`
      : undefined,
    record.mockOnlyRoute !== true
      ? `route is not mock-only for ${record.toolId}`
      : undefined,
    record.aiGraphicsToolCallHandoffRoute !== true
      ? `AI graphics handoff route is missing for ${record.toolId}`
      : undefined,
    record.hardGateBlockCount !== 0
      ? `hard gate blocked ${record.toolId}`
      : undefined,
    record.inMemoryLeaseCreated !== true
      ? `in-memory lease was not created for ${record.toolId}`
      : undefined,
    record.inMemoryLeaseReleased !== true
      ? `in-memory lease was not released for ${record.toolId}`
      : undefined,
    record.toolRunResultsCreated !== 0
      ? `tool runs were created for ${record.toolId}`
      : undefined,
    record.artifactRecordsCreated !== 0
      ? `artifact records were created for ${record.toolId}`
      : undefined,
    record.qualityGateResultsCreated !== 0
      ? `quality gate results were created for ${record.toolId}`
      : undefined,
    record.sourceRuntimeQueueServiceProofBridgeAccepted !== true
      ? `source runtime queue service proof bridge missing for ${record.toolId}`
      : undefined,
    record.sourceServiceRoleQueueSmokeAuthorizationAccepted !== true
      ? `source service-role queue smoke authorization missing for ${record.toolId}`
      : undefined,
    record.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted !== true
      ? `source route-bound operator preflight missing for ${record.toolId}`
      : undefined,
    record.gpuRuntimeShouldStartNow !== false
      ? `GPU runtime should not start for ${record.toolId}`
      : undefined,
    record.workerDispatchSmokeCompletedWithProvidedEvidence !== true
      ? `worker dispatch smoke evidence did not complete for ${record.toolId}`
      : undefined,
    record.liveWorkerLeaseCreatedNow !== false
      ? `live worker lease was created for ${record.toolId}`
      : undefined,
    record.liveWorkerDispatchPerformedNow !== false
      ? `live worker dispatch was performed for ${record.toolId}`
      : undefined,
    record.toolExecutionPerformedNow !== false
      ? `tool execution was performed for ${record.toolId}`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateCapabilityScenario(
  scenario: AiGraphicsExternalBetaWorkerDispatchSmokeCapabilityScenario,
): string[] {
  return [
    !productCapabilities().includes(scenario.capabilityId)
      ? `unknown product capability ${scenario.capabilityId}`
      : undefined,
    scenario.selectedTools.length === 0
      ? `capability ${scenario.capabilityId} has no selected tools`
      : undefined,
    scenario.capabilitySmokeCompletedWithProvidedEvidence !== true
      ? `capability smoke did not complete for ${scenario.capabilityId}`
      : undefined,
    scenario.canCreateLiveWorkerLeaseNow !== false
      ? `capability ${scenario.capabilityId} can create live worker lease now`
      : undefined,
    scenario.canDispatchLiveWorkerNow !== false
      ? `capability ${scenario.capabilityId} can dispatch live worker now`
      : undefined,
    scenario.canExecuteToolsNow !== false
      ? `capability ${scenario.capabilityId} can execute tools now`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateSmokeResult(
  result?: AiGraphicsExternalBetaWorkerDispatchSmoke,
): string[] {
  if (!result) return ['external beta worker dispatch smoke result is missing']
  const records = result.records ?? []
  const capabilityScenarios = result.capabilityScenarios ?? []
  return [
    result.decision !== 'external_beta_worker_dispatch_smoke_completed_without_tool_execution'
      ? 'worker dispatch smoke result decision is not accepted'
      : undefined,
    result.mockDispatcherSmokeCompletedWithProvidedEvidence !== true
      ? 'worker dispatch smoke did not complete with provided evidence'
      : undefined,
    result.sourceExternalBetaWorkerDispatchReadinessAccepted !== true
      ? 'source worker dispatch readiness was not accepted'
      : undefined,
    result.sourceWorkerDispatchReadinessProofBridgeAccepted !== true
      ? 'source worker dispatch readiness proof bridge was not accepted'
      : undefined,
    result.totalAiGraphicsTools !== 21 ? 'smoke result must cover 21 tools' : undefined,
    result.totalProductFacingCapabilities !== 12
      ? 'smoke result must cover 12 product-facing capabilities'
      : undefined,
    result.smokeJobsPrepared !== 21
      ? 'smoke result must prepare 21 jobs'
      : undefined,
    result.smokeJobsCompletedWithProvidedEvidence !== 21
      ? 'smoke result must complete 21 jobs with provided evidence'
      : undefined,
    result.smokeCapabilityScenariosPrepared !== 12
      ? 'smoke result must prepare 12 capability scenarios'
      : undefined,
    result.smokeCapabilityScenariosCompletedWithProvidedEvidence !== 12
      ? 'smoke result must complete 12 capability scenarios with provided evidence'
      : undefined,
    result.gpuRuntimeTargetedTools !== 8
      ? 'smoke result must preserve eight GPU-targeted tools'
      : undefined,
    result.inMemoryLeaseRecordsCreated !== 21
      ? 'smoke result must create 21 in-memory leases'
      : undefined,
    result.inMemoryLeaseRecordsReleased !== 21
      ? 'smoke result must release 21 in-memory leases'
      : undefined,
    result.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence !== 21
      ? 'smoke result must preserve the 21-tool runtime queue service proof bridge'
      : undefined,
    result.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence !== 21
      ? 'smoke result must preserve the 21-tool service-role queue smoke authorization'
      : undefined,
    result.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence !== 21
      ? 'smoke result must preserve the 21-tool route-bound operator preflight'
      : undefined,
    !hasValue(result.serviceRoleQueueSmokeAuthorizationRef ?? undefined)
      ? 'smoke result service-role queue smoke authorization ref is missing'
      : undefined,
    result.liveWorkerLeasesCreatedNow !== 0
      ? 'smoke result must not create live worker leases'
      : undefined,
    result.liveWorkerDispatchesNow !== 0
      ? 'smoke result must not dispatch live workers'
      : undefined,
    result.liveToolExecutionsNow !== 0
      ? 'smoke result must not execute tools'
      : undefined,
    result.externalBetaReadyNowTools !== 0
      ? 'smoke result must not unlock external beta ready-now tools'
      : undefined,
    result.productionReadyNowTools !== 0
      ? 'smoke result must not unlock production ready-now tools'
      : undefined,
    records.length !== 21 ? 'smoke result must include 21 records' : undefined,
    !sameSet(records.map((record) => record.toolId), AI_GRAPHICS_CANONICAL_TOOL_IDS)
      ? 'smoke result record tool ids do not cover all 21 tools'
      : undefined,
    records.filter((record) => record.workerType === 'gpu_ai_worker').length !== 8
      ? 'smoke result must target eight GPU worker records'
      : undefined,
    records.filter((record) => (
      record.sourceRuntimeQueueServiceProofBridgeAccepted === true
    )).length !== 21
      ? 'smoke result must preserve runtime queue service proof bridge on all 21 records'
      : undefined,
    records.filter((record) => (
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted === true
    )).length !== 21
      ? 'smoke result must preserve service-role queue smoke authorization on all 21 records'
      : undefined,
    records.filter((record) => (
      record.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
    )).length !== 21
      ? 'smoke result must preserve route-bound operator preflight on all 21 records'
      : undefined,
    capabilityScenarios.length !== 12
      ? 'smoke result must include 12 capability scenarios'
      : undefined,
    !sameSet(capabilityScenarios.map((scenario) => scenario.capabilityId), productCapabilities())
      ? 'smoke result capability scenarios do not cover all 12 capabilities'
      : undefined,
    ...(records.flatMap(validateRecord)),
    ...(capabilityScenarios.flatMap(validateCapabilityScenario)),
    ...falseGateReasons(result.booleans as Record<string, unknown> | undefined),
  ].filter((reason): reason is string => Boolean(reason))
}

function buildBooleans(input: {
  accepted: boolean
  sourceAccepted: boolean
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: boolean
  allJobsAccepted: boolean
  allCapabilityScenariosAccepted: boolean
  allLeasesCreated: boolean
  allLeasesReleased: boolean
  allRoutesMockOnly: boolean
  allRoutesHandoff: boolean
  allToolRunsEmpty: boolean
  allArtifactsEmpty: boolean
  allQualityGatesEmpty: boolean
}): AiGraphicsExternalBetaWorkerDispatchSmokeProof['booleans'] {
  return {
    externalBetaWorkerDispatchSmokeProofPrepared: true,
    sourceWorkerDispatchSmokeAcceptedWithProvidedEvidence: input.sourceAccepted,
    sourceRuntimeQueueServiceProofBridgeAccepted:
      input.sourceRuntimeQueueServiceProofBridgeAccepted,
    sourceServiceRoleQueueSmokeAuthorizationAccepted:
      input.sourceServiceRoleQueueSmokeAuthorizationAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted:
      input.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
    workerDispatchSmokeProofAcceptedWithProvidedEvidence: input.accepted,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all8GpuToolsTargetGpuRuntime: true,
    all21SmokeJobsAcceptedWithProvidedEvidence: input.allJobsAccepted,
    all12CapabilitySmokeScenariosAcceptedWithProvidedEvidence:
      input.allCapabilityScenariosAccepted,
    allInMemoryLeasesCreatedWithProvidedEvidence: input.allLeasesCreated,
    allInMemoryLeasesReleasedWithProvidedEvidence: input.allLeasesReleased,
    allRoutesMockOnlyWithProvidedEvidence: input.allRoutesMockOnly,
    allRoutesAiGraphicsToolCallHandoffWithProvidedEvidence: input.allRoutesHandoff,
    allToolRunResultsEmpty: input.allToolRunsEmpty,
    allArtifactRecordsEmpty: input.allArtifactsEmpty,
    allQualityGateResultsEmpty: input.allQualityGatesEmpty,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    gpuStartsOnlyForApprovedWorkerOrToolCall: true,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    workerQueueApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    productionWorkerDispatchApprovedNow: false,
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
    backendQueueSubmissionPerformed: false,
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
  }
}

export function evaluateAiGraphicsExternalBetaWorkerDispatchSmokeProof(
  input: AiGraphicsExternalBetaWorkerDispatchSmokeProofInput = {},
): AiGraphicsExternalBetaWorkerDispatchSmokeProof {
  const result = input.workerDispatchSmokeResult
  const resultReasons = validateSmokeResult(result)
  const evidenceRefsMissing = [
    !hasValue(input.workerDispatchSmokeEvidenceRef)
      ? 'worker dispatch smoke evidence ref is missing'
      : undefined,
    !hasValue(input.workerDispatchSmokeTelemetryRef)
      ? 'worker dispatch smoke telemetry ref is missing'
      : undefined,
    !hasValue(input.workerDispatchSmokeLeaseAuditRef)
      ? 'worker dispatch smoke lease audit ref is missing'
      : undefined,
    !hasValue(input.workerDispatchSmokeCleanupProofRef)
      ? 'worker dispatch smoke cleanup proof ref is missing'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
  const rejectionReasons = [
    ...resultReasons,
    ...evidenceRefsMissing,
  ]
  const accepted = rejectionReasons.length === 0
  const records = result?.records ?? []
  const sourceAccepted =
    result?.decision === 'external_beta_worker_dispatch_smoke_completed_without_tool_execution' &&
    result?.mockDispatcherSmokeCompletedWithProvidedEvidence === true
  const allJobsAccepted = result?.smokeJobsCompletedWithProvidedEvidence === 21
  const allCapabilityScenariosAccepted =
    result?.smokeCapabilityScenariosCompletedWithProvidedEvidence === 12
  const allLeasesCreated = result?.inMemoryLeaseRecordsCreated === 21
  const allLeasesReleased = result?.inMemoryLeaseRecordsReleased === 21
  const sourceRuntimeQueueServiceProofBridgeAccepted =
    result?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    records.length === 21 &&
    records.every((record) => (
      record.sourceRuntimeQueueServiceProofBridgeAccepted === true
    )) &&
    result?.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true
  const sourceServiceRoleQueueSmokeAuthorizationAccepted =
    result?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    hasValue(result.serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
    records.length === 21 &&
    records.every((record) => (
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted === true
    )) &&
    result?.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    result?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 21 &&
    records.length === 21 &&
    records.every((record) => (
      record.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
    )) &&
    result?.booleans?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
  const allRoutesMockOnly =
    records.length === 21 && records.every((record) => record.mockOnlyRoute)
  const allRoutesHandoff =
    records.length === 21 &&
    records.every((record) => record.aiGraphicsToolCallHandoffRoute)
  const allToolRunsEmpty =
    records.length === 21 &&
    records.every((record) => record.toolRunResultsCreated === 0)
  const allArtifactsEmpty =
    records.length === 21 &&
    records.every((record) => record.artifactRecordsCreated === 0)
  const allQualityGatesEmpty =
    records.length === 21 &&
    records.every((record) => record.qualityGateResultsCreated === 0)
  const tools = accepted ? [...AI_GRAPHICS_CANONICAL_TOOL_IDS] : []
  const gpu = accepted ? gpuTools() : []

  return {
    decision: !result
      ? 'missing_external_beta_worker_dispatch_smoke_result'
      : accepted
        ? 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks'
        : 'external_beta_worker_dispatch_smoke_proof_rejected',
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
    proofAcceptedWithProvidedEvidence: accepted,
    rejectionReasons,
    acceptedTools: tools,
    acceptedGpuTools: gpu,
    counts: {
      toolsCovered: 21,
      productFacingCapabilitiesCovered: productCapabilityCount(),
      gpuToolsCovered: 8,
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: tools.length,
      sourceSmokeJobsCompletedWithProvidedEvidence:
        accepted && result ? result.smokeJobsCompletedWithProvidedEvidence : 0,
      sourceCapabilityScenariosCompletedWithProvidedEvidence:
        accepted && result
          ? result.smokeCapabilityScenariosCompletedWithProvidedEvidence
          : 0,
      sourceInMemoryLeaseRecordsCreated:
        accepted && result ? result.inMemoryLeaseRecordsCreated : 0,
      sourceInMemoryLeaseRecordsReleased:
        accepted && result ? result.inMemoryLeaseRecordsReleased : 0,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        accepted && result
          ? result.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence
          : 0,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence:
        accepted && result
          ? result.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence
          : 0,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        accepted && result
          ? result.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence
          : 0,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      workerDispatchSmokeEvidenceRef:
        input.workerDispatchSmokeEvidenceRef ?? null,
      workerDispatchSmokeTelemetryRef:
        input.workerDispatchSmokeTelemetryRef ?? null,
      workerDispatchSmokeLeaseAuditRef:
        input.workerDispatchSmokeLeaseAuditRef ?? null,
      workerDispatchSmokeCleanupProofRef:
        input.workerDispatchSmokeCleanupProofRef ?? null,
      serviceRoleQueueSmokeAuthorizationRef:
        result?.serviceRoleQueueSmokeAuthorizationRef ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      sourceMockDispatcherSmokeCompletedWithProvidedEvidence:
        result?.mockDispatcherSmokeCompletedWithProvidedEvidence === true,
      sourceAllRoutesMockOnly: allRoutesMockOnly,
      sourceAllRoutesAiGraphicsToolCallHandoff: allRoutesHandoff,
      sourceAllInMemoryLeasesCreated: allLeasesCreated,
      sourceAllInMemoryLeasesReleased: allLeasesReleased,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        sourceRuntimeQueueServiceProofBridgeAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokeAuthorizationAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      requiredExecutionEnvironment: 'non_production_external_beta',
      requiredWorkerMode: 'mock',
      requiredE2eRuntimeMode: 'local',
    },
    policy: {
      validatesSavedWorkerDispatchSmokeResultOnly: true,
      noLiveWorkerLeaseByProofValidator: true,
      noLiveProductionWorkerDispatchByProofValidator: true,
      noToolExecutionByProofValidator: true,
      noProviderRuntimeByProofValidator: true,
      noBrowserWebglCanvasRuntimeByProofValidator: true,
      noGpuRuntimeStartByProofValidator: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresExternalBetaRuntimeExecutionProof: true,
    },
    booleans: buildBooleans({
      accepted,
      sourceAccepted,
      sourceRuntimeQueueServiceProofBridgeAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      allJobsAccepted,
      allCapabilityScenariosAccepted,
      allLeasesCreated,
      allLeasesReleased,
      allRoutesMockOnly,
      allRoutesHandoff,
      allToolRunsEmpty,
      allArtifactsEmpty,
      allQualityGatesEmpty,
    }),
  }
}
