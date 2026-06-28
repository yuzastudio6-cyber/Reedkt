import {
  AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION,
  type AiGraphicsExternalBetaCpuStaticCohortAdmission,
} from './ai-graphics-external-beta-cpu-static-cohort-admission'
import {
  AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION,
  evaluateAiGraphicsOnDemandRuntimeAdmission,
  type AiGraphicsOnDemandRuntimeAdmission,
  type AiGraphicsOnDemandRuntimeAdmissionInput,
} from './ai-graphics-on-demand-runtime-admission'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION =
  'ai_graphics_external_beta_cpu_static_runtime_admission_prepared_with_gpu_blocks'

export type AiGraphicsExternalBetaCpuStaticRuntimeAdmissionStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_cpu_static_cohort_admission'
  | 'external_beta_cpu_static_runtime_admission_blocked'
  | 'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue'
  | 'requested_tool_not_in_cpu_static_cohort'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaCpuStaticRuntimeAdmissionInput
  extends AiGraphicsOnDemandRuntimeAdmissionInput {
  sourceExternalBetaCpuStaticCohortAdmissionPacket?: AiGraphicsExternalBetaCpuStaticCohortAdmission
  externalBetaCpuStaticFeatureFlagEnabled?: boolean
  externalBetaCpuStaticFeatureFlagRef?: string
  externalBetaCpuStaticRuntimeAdmissionRef?: string
  externalBetaCpuStaticToolAllowlistRef?: string
  externalBetaCpuStaticTrafficScopeRef?: string
  externalBetaCpuStaticTelemetryRef?: string
  externalBetaCpuStaticSupportRef?: string
  externalBetaCpuStaticCostGuardrailRef?: string
  externalBetaCpuStaticWorkerPoolRef?: string
}

export interface AiGraphicsExternalBetaCpuStaticRuntimeAdmission {
  decision: AiGraphicsExternalBetaCpuStaticRuntimeAdmissionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
  sourceCpuStaticCohortAdmissionDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION
  sourceOnDemandRuntimeAdmissionDecision: typeof AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION
  capabilityId: string
  requestedToolId: string | null
  selectedToolId: AiGraphicsCanonicalToolId | null
  executionRequested: boolean
  sourceCpuStaticCohortAdmissionAccepted: boolean
  selectedToolInCpuStaticCohort: boolean
  selectedToolBlockedPendingNativeGpuProof: boolean
  onDemandRuntimeAdmission: AiGraphicsOnDemandRuntimeAdmission
  missingExternalBetaCpuStaticRuntimeGates: string[]
  cpuStaticRuntimeAdmissionReadyWithProvidedEvidence: boolean
  externalBetaWorkerEnqueueAllowedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: false
  gpuRuntimeShouldStartNow: false
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  runtimeAdmissionPolicy: {
    sourceCpuStaticCohortAdmissionRequired: true
    cpuStaticCohortCandidateOnly: true
    externalBetaFeatureFlagRequired: true
    rolloutScopeRequired: true
    privateArtifactManifestRequired: true
    toolRouteAndWorkerRequired: true
    creditReservationRequired: true
    costGuardrailRequired: true
    supportAndTelemetryRequired: true
    gpuToolsBlockedPendingNativeGpuProof: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
    sideEffectFreeAdmissionCheck: true
  }
  booleans: {
    externalBetaCpuStaticRuntimeAdmissionPrepared: true
    sourceCpuStaticCohortAdmissionAccepted: boolean
    sourceOnDemandRuntimeAdmissionAccepted: boolean
    selectedToolInCpuStaticCohort: boolean
    selectedToolBlockedPendingNativeGpuProof: boolean
    cpuStaticRuntimeAdmissionReadyWithProvidedEvidence: boolean
    externalBetaWorkerEnqueueAllowedWithProvidedEvidence: boolean
    all13CpuStaticCandidatesRemainFirstCohort: boolean
    all8GpuToolsRemainBlockedPendingNativeGpuProof: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const runtimeAdmissionPolicy = {
  sourceCpuStaticCohortAdmissionRequired: true,
  cpuStaticCohortCandidateOnly: true,
  externalBetaFeatureFlagRequired: true,
  rolloutScopeRequired: true,
  privateArtifactManifestRequired: true,
  toolRouteAndWorkerRequired: true,
  creditReservationRequired: true,
  costGuardrailRequired: true,
  supportAndTelemetryRequired: true,
  gpuToolsBlockedPendingNativeGpuProof: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
  sideEffectFreeAdmissionCheck: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sourceCohortAccepted(packet?: AiGraphicsExternalBetaCpuStaticCohortAdmission): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_cpu_static_cohort_ready_with_gpu_blocks' &&
    packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION &&
    packet.sourcePerToolRuntimeProofAccepted === true &&
    packet.cpuStaticCohortCandidateToolsWithProvidedEvidence === 13 &&
    packet.gpuBlockedToolsPendingNativeGpuProof === 8 &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all13CpuStaticCandidatesReadyWithProvidedEvidence === true &&
    packet.booleans.all8GpuToolsRemainBlockedPendingNativeGpuProof === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.agentCanExecuteToolsNow === false
}

function cohortRecord(
  packet: AiGraphicsExternalBetaCpuStaticCohortAdmission | undefined,
  toolId: string | null,
) {
  return packet?.records.find((record) => record.toolId === toolId)
}

function missingRuntimeGates(input: {
  input: AiGraphicsExternalBetaCpuStaticRuntimeAdmissionInput
  sourceAccepted: boolean
  selectedToolInCohort: boolean
  selectedToolBlockedPendingGpu: boolean
  onDemandAdmission: AiGraphicsOnDemandRuntimeAdmission
}): string[] {
  return [
    !input.sourceAccepted ? 'external beta CPU/static cohort admission is missing' : undefined,
    input.selectedToolBlockedPendingGpu
      ? 'selected tool is blocked pending native GPU runtime proof'
      : undefined,
    !input.selectedToolInCohort ? 'selected tool is not in the CPU/static external-beta cohort' : undefined,
    input.input.externalBetaCpuStaticFeatureFlagEnabled !== true ||
      !hasValue(input.input.externalBetaCpuStaticFeatureFlagRef)
      ? 'external beta CPU/static feature flag approval is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticRuntimeAdmissionRef)
      ? 'external beta CPU/static runtime admission reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticToolAllowlistRef)
      ? 'external beta CPU/static tool allowlist reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticTrafficScopeRef)
      ? 'external beta CPU/static traffic scope reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticTelemetryRef)
      ? 'external beta CPU/static telemetry reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticSupportRef)
      ? 'external beta CPU/static support ownership reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticCostGuardrailRef)
      ? 'external beta CPU/static cost guardrail reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCpuStaticWorkerPoolRef)
      ? 'external beta CPU/static worker pool reference is missing'
      : undefined,
    !input.onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence
      ? 'on-demand runtime job admission is not ready with provided evidence'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  executionRequested: boolean
  onDemandAdmission: AiGraphicsOnDemandRuntimeAdmission
  sourceAccepted: boolean
  selectedToolInCohort: boolean
  selectedToolBlockedPendingGpu: boolean
  ready: boolean
}): AiGraphicsExternalBetaCpuStaticRuntimeAdmissionStatus {
  if (!input.onDemandAdmission.validCapability) return 'invalid_capability_blocked'
  if (!input.onDemandAdmission.selectedTool) return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceAccepted) return 'missing_external_beta_cpu_static_cohort_admission'
  if (input.selectedToolBlockedPendingGpu || !input.selectedToolInCohort) {
    return 'requested_tool_not_in_cpu_static_cohort'
  }
  return input.ready
    ? 'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue'
    : 'external_beta_cpu_static_runtime_admission_blocked'
}

export function evaluateAiGraphicsExternalBetaCpuStaticRuntimeAdmission(
  input: AiGraphicsExternalBetaCpuStaticRuntimeAdmissionInput,
): AiGraphicsExternalBetaCpuStaticRuntimeAdmission {
  const onDemandAdmission = evaluateAiGraphicsOnDemandRuntimeAdmission(input)
  const selectedToolId = onDemandAdmission.selectedTool?.toolId ?? null
  const sourceAccepted = sourceCohortAccepted(input.sourceExternalBetaCpuStaticCohortAdmissionPacket)
  const record = cohortRecord(input.sourceExternalBetaCpuStaticCohortAdmissionPacket, selectedToolId)
  const selectedToolInCohort =
    sourceAccepted &&
    record?.cohortStatus === 'external_beta_cpu_static_candidate_with_provided_evidence'
  const selectedToolBlockedPendingNativeGpuProof =
    sourceAccepted &&
    record?.cohortStatus === 'blocked_pending_native_gpu_runtime_proof'
  const missingExternalBetaCpuStaticRuntimeGates = input.executionRequested === true
    ? missingRuntimeGates({
      input,
      sourceAccepted,
      selectedToolInCohort,
      selectedToolBlockedPendingGpu: selectedToolBlockedPendingNativeGpuProof,
      onDemandAdmission,
    })
    : []
  const cpuStaticRuntimeAdmissionReadyWithProvidedEvidence =
    input.executionRequested === true &&
    sourceAccepted &&
    selectedToolInCohort &&
    !selectedToolBlockedPendingNativeGpuProof &&
    onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence &&
    missingExternalBetaCpuStaticRuntimeGates.length === 0

  return {
    decision: decisionFromInput({
      executionRequested: input.executionRequested === true,
      onDemandAdmission,
      sourceAccepted,
      selectedToolInCohort,
      selectedToolBlockedPendingGpu: selectedToolBlockedPendingNativeGpuProof,
      ready: cpuStaticRuntimeAdmissionReadyWithProvidedEvidence,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION,
    sourceCpuStaticCohortAdmissionDecision:
      AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION,
    sourceOnDemandRuntimeAdmissionDecision: AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION,
    capabilityId: input.capabilityId,
    requestedToolId: input.requestedToolId ?? null,
    selectedToolId,
    executionRequested: input.executionRequested === true,
    sourceCpuStaticCohortAdmissionAccepted: sourceAccepted,
    selectedToolInCpuStaticCohort: selectedToolInCohort,
    selectedToolBlockedPendingNativeGpuProof,
    onDemandRuntimeAdmission: onDemandAdmission,
    missingExternalBetaCpuStaticRuntimeGates,
    cpuStaticRuntimeAdmissionReadyWithProvidedEvidence,
    externalBetaWorkerEnqueueAllowedWithProvidedEvidence:
      cpuStaticRuntimeAdmissionReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: false,
    gpuRuntimeShouldStartNow: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    runtimeAdmissionPolicy,
    booleans: {
      externalBetaCpuStaticRuntimeAdmissionPrepared: true,
      sourceCpuStaticCohortAdmissionAccepted: sourceAccepted,
      sourceOnDemandRuntimeAdmissionAccepted:
        onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence,
      selectedToolInCpuStaticCohort: selectedToolInCohort,
      selectedToolBlockedPendingNativeGpuProof,
      cpuStaticRuntimeAdmissionReadyWithProvidedEvidence,
      externalBetaWorkerEnqueueAllowedWithProvidedEvidence:
        cpuStaticRuntimeAdmissionReadyWithProvidedEvidence,
      all13CpuStaticCandidatesRemainFirstCohort:
        input.sourceExternalBetaCpuStaticCohortAdmissionPacket
          ?.cpuStaticCohortCandidateToolsWithProvidedEvidence === 13,
      all8GpuToolsRemainBlockedPendingNativeGpuProof:
        input.sourceExternalBetaCpuStaticCohortAdmissionPacket
          ?.gpuBlockedToolsPendingNativeGpuProof === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
