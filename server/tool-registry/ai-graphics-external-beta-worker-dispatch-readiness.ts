import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeProof,
  AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode,
} from './ai-graphics-external-beta-service-role-queue-smoke-proof'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_READINESS_DECISION =
  'ai_graphics_external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaWorkerDispatchReadinessStatus =
  | 'missing_external_beta_service_role_queue_smoke_proof'
  | 'external_beta_service_role_queue_smoke_proof_rejected'
  | 'missing_external_beta_worker_dispatch_controls'
  | 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks'

export interface AiGraphicsExternalBetaWorkerDispatchReadinessInput {
  sourceExternalBetaServiceRoleQueueSmokeProofPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokeProof
  externalBetaWorkerLeasePolicyRef?: string
  externalBetaWorkerDispatchPolicyRef?: string
  externalBetaWorkerIdempotencyNamespaceRef?: string
  externalBetaWorkerTelemetryRef?: string
  externalBetaGpuOnDemandPolicyRef?: string
  externalBetaPrivateArtifactPolicyRef?: string
}

export interface AiGraphicsExternalBetaWorkerDispatchReadinessRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId | null
  workerType: ProductionRegistryWorkerType | 'none'
  runtimeTarget: string
  sourceGatewayRuntimeAdmissionMode: AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode
  capabilityIds: string[]
  sourceServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence: boolean
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  workerLeaseReadinessPreparedWithProvidedEvidence: boolean
  workerDispatchReadinessPreparedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
  nextExternalBetaMilestone: string
}

export interface AiGraphicsExternalBetaWorkerDispatchCapabilityScenario {
  capabilityId: string
  selectedTools: AiGraphicsCanonicalToolId[]
  workerDispatchReadinessToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  capabilityWorkerDispatchReadinessPreparedWithProvidedEvidence: boolean
  canCreateLiveWorkerLeaseNow: false
  canDispatchLiveWorkerNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsExternalBetaWorkerDispatchReadiness {
  decision: AiGraphicsExternalBetaWorkerDispatchReadinessStatus
  sourceDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_READINESS_DECISION
  sourceServiceRoleQueueSmokeProofAccepted: boolean
  sourceServiceRoleQueueSmokeProofBridgeAccepted: boolean
  missingDispatchControls: string[]
  workerDispatchReadinessPreparedWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  workerDispatchReadinessRecordsPrepared: 21
  workerDispatchReadinessRecordsPreparedWithProvidedEvidence: number
  workerDispatchCapabilityScenariosPrepared: 12
  workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: number
  gpuRuntimeTargetedTools: 8
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  acceptedSourceEvidence: {
    serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence: boolean
    sourceLiveQueueWritesAcceptedWithProvidedEvidence: number
    sourceWorkerClaimRowsAcceptedWithProvidedEvidence: number
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
    sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0
    sourceToolExecutionsAcceptedWithProvidedEvidence: 0
    cleanupPersistedRowsAfterSmoke: 0
  }
  policy: {
    validatesDispatchReadinessOnly: true
    serviceRoleQueueSmokeProofRequired: true
    serviceRoleQueueSmokeProofBridgeRequired: true
    workerLeasePolicyRequired: true
    workerDispatchPolicyRequired: true
    workerIdempotencyRequired: true
    workerTelemetryRequired: true
    privateArtifactPolicyRequired: true
    gpuOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    noLiveWorkerLeaseByReadinessGate: true
    noLiveWorkerDispatchByReadinessGate: true
    noToolExecutionByReadinessGate: true
    noGpuRuntimeStartByReadinessGate: true
  }
  records: AiGraphicsExternalBetaWorkerDispatchReadinessRecord[]
  capabilityScenarios: AiGraphicsExternalBetaWorkerDispatchCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    externalBetaWorkerDispatchReadinessPrepared: true
    sourceServiceRoleQueueSmokeProofAccepted: boolean
    sourceServiceRoleQueueSmokeProofBridgeAccepted: boolean
    externalBetaWorkerLeasePolicyAccepted: boolean
    externalBetaWorkerDispatchPolicyAccepted: boolean
    externalBetaWorkerIdempotencyNamespaceAccepted: boolean
    externalBetaWorkerTelemetryAccepted: boolean
    externalBetaPrivateArtifactPolicyAccepted: boolean
    externalBetaGpuOnDemandPolicyAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21WorkerDispatchReadinessRecordsPreparedWithProvidedEvidence: boolean
    all12CapabilityDispatchScenariosPreparedWithProvidedEvidence: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
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

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
  (capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ),
)

const nextMilestones = [
  'Run the service-role queue smoke in a non-production external-beta Supabase project and validate the saved proof packet.',
  'Bind an accepted queue-smoke proof to a controlled worker lease/dispatch smoke that still uses mock handlers and executes no tools.',
  'Only allow GPU startup after a real accepted worker job leases a GPU-targeted tool and runtime proof for that tool has passed.',
  'Keep external beta closed until route, worker, provider, private artifact, cost, QA, and rollback gates pass end to end.',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sourceProofAccepted(
  packet?: AiGraphicsExternalBetaServiceRoleQueueSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.counts.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.sourceLiveQueueWritesAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceWorkerClaimRowsAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence === 1 &&
    packet.acceptedCpuStaticFirstCohortTools?.length === 1 &&
    packet.acceptedCpuStaticFirstCohortTools[0] === 'd3' &&
    packet.evidence.sourceGatewayRuntimeAdmissionModesByTool?.d3 ===
      'cpu_static_first_cohort' &&
    packet.evidence.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === true &&
    packet.counts.sourceWorkerDispatchesAcceptedWithProvidedEvidence === 0 &&
    packet.counts.sourceToolExecutionsAcceptedWithProvidedEvidence === 0 &&
    packet.counts.cleanupPersistedRowsAfterSmoke === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingDispatchControls(
  input: AiGraphicsExternalBetaWorkerDispatchReadinessInput,
): string[] {
  return [
    !hasValue(input.externalBetaWorkerLeasePolicyRef)
      ? 'external beta worker lease policy ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerDispatchPolicyRef)
      ? 'external beta worker dispatch policy ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerIdempotencyNamespaceRef)
      ? 'external beta worker idempotency namespace ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerTelemetryRef)
      ? 'external beta worker telemetry ref is missing'
      : undefined,
    !hasValue(input.externalBetaGpuOnDemandPolicyRef)
      ? 'external beta GPU on-demand policy ref is missing'
      : undefined,
    !hasValue(input.externalBetaPrivateArtifactPolicyRef)
      ? 'external beta private artifact policy ref is missing'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasProofPacket: boolean
  proofAccepted: boolean
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaWorkerDispatchReadinessStatus {
  if (!input.hasProofPacket) {
    return 'missing_external_beta_service_role_queue_smoke_proof'
  }
  if (!input.proofAccepted) {
    return 'external_beta_service_role_queue_smoke_proof_rejected'
  }
  return input.controlsSatisfied
    ? 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks'
    : 'missing_external_beta_worker_dispatch_controls'
}

function buildRecords(input: {
  proofAccepted: boolean
  controlsSatisfied: boolean
  sourceGatewayRuntimeAdmissionModesByTool?:
    Record<string, AiGraphicsExternalBetaSourceGatewayRuntimeAdmissionMode>
}): AiGraphicsExternalBetaWorkerDispatchReadinessRecord[] {
  return listAiGraphicsToolCallReadiness().map((record) => {
    const readyWithEvidence = input.proofAccepted && input.controlsSatisfied
    const sourceGatewayRuntimeAdmissionMode =
      input.sourceGatewayRuntimeAdmissionModesByTool?.[record.toolId] ??
      (record.toolId === 'd3' ? 'cpu_static_first_cohort' : 'all_tools_external_beta')
    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: record.productionWorkerType,
      runtimeTarget: record.runtimeTarget,
      sourceGatewayRuntimeAdmissionMode,
      capabilityIds: [...record.capabilities],
      sourceServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence:
        input.proofAccepted,
      sourceRuntimeQueueServiceProofBridgeAccepted: input.proofAccepted,
      workerLeaseReadinessPreparedWithProvidedEvidence: readyWithEvidence,
      workerDispatchReadinessPreparedWithProvidedEvidence: readyWithEvidence,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        readyWithEvidence && record.gpuRequiredForRuntime,
      gpuRuntimeShouldStartNow: false,
      liveWorkerLeaseCreatedNow: false,
      liveWorkerDispatchPerformedNow: false,
      toolExecutionPerformedNow: false,
      nextExternalBetaMilestone: record.gpuRequiredForRuntime
        ? 'native GPU/model runtime proof plus accepted worker lease/dispatch smoke'
        : 'accepted worker lease/dispatch smoke plus route and artifact gates',
    }
  })
}

function buildCapabilityScenarios(
  records: AiGraphicsExternalBetaWorkerDispatchReadinessRecord[],
): AiGraphicsExternalBetaWorkerDispatchCapabilityScenario[] {
  return productFacingCapabilities.map((capabilityId) => {
    const selectedTools = records
      .filter((record) => record.capabilityIds.includes(capabilityId))
      .map((record) => record.toolId)
    const readyTools = records
      .filter((record) => (
        record.capabilityIds.includes(capabilityId) &&
        record.workerDispatchReadinessPreparedWithProvidedEvidence
      ))
      .map((record) => record.toolId)
    return {
      capabilityId,
      selectedTools,
      workerDispatchReadinessToolsWithProvidedEvidence: readyTools,
      capabilityWorkerDispatchReadinessPreparedWithProvidedEvidence:
        selectedTools.length > 0 && readyTools.length === selectedTools.length,
      canCreateLiveWorkerLeaseNow: false,
      canDispatchLiveWorkerNow: false,
      canExecuteToolsNow: false,
    }
  })
}

export function evaluateAiGraphicsExternalBetaWorkerDispatchReadiness(
  input: AiGraphicsExternalBetaWorkerDispatchReadinessInput = {},
): AiGraphicsExternalBetaWorkerDispatchReadiness {
  const proofAccepted = sourceProofAccepted(
    input.sourceExternalBetaServiceRoleQueueSmokeProofPacket,
  )
  const missingControls = proofAccepted ? missingDispatchControls(input) : []
  const controlsSatisfied = proofAccepted && missingControls.length === 0
  const records = buildRecords({
    proofAccepted,
    controlsSatisfied,
    sourceGatewayRuntimeAdmissionModesByTool:
      input.sourceExternalBetaServiceRoleQueueSmokeProofPacket
        ?.evidence.sourceGatewayRuntimeAdmissionModesByTool,
  })
  const capabilityScenarios = buildCapabilityScenarios(records)
  const recordsReady = records.filter((record) => (
    record.workerDispatchReadinessPreparedWithProvidedEvidence
  )).length
  const capabilityScenariosReady = capabilityScenarios.filter((scenario) => (
    scenario.capabilityWorkerDispatchReadinessPreparedWithProvidedEvidence
  )).length

  return {
    decision: statusFromInput({
      hasProofPacket: Boolean(input.sourceExternalBetaServiceRoleQueueSmokeProofPacket),
      proofAccepted,
      controlsSatisfied,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_READINESS_DECISION,
    sourceServiceRoleQueueSmokeProofAccepted: proofAccepted,
    sourceServiceRoleQueueSmokeProofBridgeAccepted: proofAccepted,
    missingDispatchControls: missingControls,
    workerDispatchReadinessPreparedWithProvidedEvidence: controlsSatisfied,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productFacingCapabilities.length as 12,
    workerDispatchReadinessRecordsPrepared: records.length as 21,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: recordsReady,
    workerDispatchCapabilityScenariosPrepared: capabilityScenarios.length as 12,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence:
      capabilityScenariosReady,
    gpuRuntimeTargetedTools:
      records.filter((record) => record.workerType === 'gpu_ai_worker').length as 8,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    acceptedSourceEvidence: {
      serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence: proofAccepted,
      sourceLiveQueueWritesAcceptedWithProvidedEvidence: proofAccepted ? 21 : 0,
      sourceWorkerClaimRowsAcceptedWithProvidedEvidence: proofAccepted ? 21 : 0,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        proofAccepted ? 21 : 0,
      sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
      sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
      cleanupPersistedRowsAfterSmoke: 0,
    },
    policy: {
      validatesDispatchReadinessOnly: true,
      serviceRoleQueueSmokeProofRequired: true,
      serviceRoleQueueSmokeProofBridgeRequired: true,
      workerLeasePolicyRequired: true,
      workerDispatchPolicyRequired: true,
      workerIdempotencyRequired: true,
      workerTelemetryRequired: true,
      privateArtifactPolicyRequired: true,
      gpuOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noLiveWorkerLeaseByReadinessGate: true,
      noLiveWorkerDispatchByReadinessGate: true,
      noToolExecutionByReadinessGate: true,
      noGpuRuntimeStartByReadinessGate: true,
    },
    records,
    capabilityScenarios,
    nextMilestones,
    booleans: {
      externalBetaWorkerDispatchReadinessPrepared: true,
      sourceServiceRoleQueueSmokeProofAccepted: proofAccepted,
      sourceServiceRoleQueueSmokeProofBridgeAccepted: proofAccepted,
      externalBetaWorkerLeasePolicyAccepted: controlsSatisfied,
      externalBetaWorkerDispatchPolicyAccepted: controlsSatisfied,
      externalBetaWorkerIdempotencyNamespaceAccepted: controlsSatisfied,
      externalBetaWorkerTelemetryAccepted: controlsSatisfied,
      externalBetaPrivateArtifactPolicyAccepted: controlsSatisfied,
      externalBetaGpuOnDemandPolicyAccepted: controlsSatisfied,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21WorkerDispatchReadinessRecordsPreparedWithProvidedEvidence:
        recordsReady === 21,
      all12CapabilityDispatchScenariosPreparedWithProvidedEvidence:
        capabilityScenariosReady === 12,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
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
    },
  }
}
