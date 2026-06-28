import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from './ai-graphics-external-beta-per-tool-runtime-proof'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION =
  'ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks'

export type AiGraphicsExternalBetaCpuStaticCohortAdmissionStatus =
  | 'missing_external_beta_per_tool_runtime_proof'
  | 'external_beta_per_tool_runtime_proof_rejected'
  | 'missing_external_beta_cpu_static_cohort_controls'
  | 'external_beta_cpu_static_cohort_ready_with_gpu_blocks'

export interface AiGraphicsExternalBetaCpuStaticCohortAdmissionInput {
  sourcePerToolRuntimeProofPacket?: AiGraphicsExternalBetaPerToolRuntimeProof
  externalBetaCpuStaticCohortPolicyRef?: string
  externalBetaCpuStaticCohortRolloutRef?: string
  externalBetaCpuStaticCohortTelemetryRef?: string
  externalBetaCpuStaticCohortRollbackRef?: string
  externalBetaCpuStaticCohortSupportRef?: string
}

export type AiGraphicsExternalBetaCpuStaticCohortAdmissionRecordStatus =
  | 'external_beta_cpu_static_candidate_with_provided_evidence'
  | 'blocked_pending_native_gpu_runtime_proof'
  | 'blocked_missing_external_beta_per_tool_runtime_proof'
  | 'blocked_missing_external_beta_cpu_static_cohort_controls'

export interface AiGraphicsExternalBetaCpuStaticCohortAdmissionRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: string[]
  sourceRuntimeProofStatus: string | null
  cohortStatus: AiGraphicsExternalBetaCpuStaticCohortAdmissionRecordStatus
  cohortCandidateWithProvidedEvidence: boolean
  blockedReason: string | null
  gpuRuntimeTargeted: boolean
  gpuRuntimeOnDemandOnly: true
  noIdleGpuRuntimeApproved: true
  externalBetaCallableNow: false
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  publicArtifactAllowed: false
  signedUrlAllowed: false
}

export interface AiGraphicsExternalBetaCpuStaticCohortAdmission {
  decision: AiGraphicsExternalBetaCpuStaticCohortAdmissionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION
  sourcePerToolRuntimeProofAccepted: boolean
  missingCpuStaticCohortControls: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  cpuStaticCohortCandidateToolsWithProvidedEvidence: number
  gpuBlockedToolsPendingNativeGpuProof: number
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  acceptedPrivateRefNamespaces: string[]
  forbiddenCohortRefPatterns: string[]
  records: AiGraphicsExternalBetaCpuStaticCohortAdmissionRecord[]
  policy: {
    sourcePerToolRuntimeProofRequired: true
    sourcePerToolRuntimeProofMustHave13JsAcceptedAnd8GpuBlocked: true
    cpuStaticCohortControlsRequired: true
    externalBetaCpuStaticCohortIsCandidateOnly: true
    noToolExecutionApproved: true
    noRouteExecutionApproved: true
    noWorkerDispatchApproved: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresExternalBetaRuntimeAdmissionAndGpuProof: true
  }
  booleans: {
    externalBetaCpuStaticCohortAdmissionPrepared: true
    sourcePerToolRuntimeProofAccepted: boolean
    cpuStaticCohortControlsAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all13CpuStaticCandidatesReadyWithProvidedEvidence: boolean
    all8GpuToolsRemainBlockedPendingNativeGpuProof: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerDispatchApprovedNow: false
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

const cpuStaticCohortTools = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const gpuRuntimeTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const cpuStaticCohortToolSet = new Set<AiGraphicsCanonicalToolId>(cpuStaticCohortTools)
const gpuRuntimeToolSet = new Set<AiGraphicsCanonicalToolId>(gpuRuntimeTools)

const acceptedPrivateRefNamespaces = [
  'private://',
  'reeditpro-private://',
  'backend-evidence://',
  'external-beta-evidence://',
]

const forbiddenCohortRefPatterns = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://',
  'gcs://',
]

function productCapabilities(): string[] {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ))
}

function productCapabilityCount(): 12 {
  return productCapabilities().length as 12
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafePrivateRef(value?: string | null): boolean {
  if (!hasValue(value ?? undefined)) return false
  const ref = String(value).trim()
  if (forbiddenCohortRefPatterns.some((pattern) => ref.startsWith(pattern))) return false
  const acceptedPrefix = acceptedPrivateRefNamespaces.find((prefix) => ref.startsWith(prefix))
  if (!acceptedPrefix) return false
  const suffix = ref.slice(acceptedPrefix.length)
  return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
}

function sourcePerToolRuntimeProofAccepted(packet?: AiGraphicsExternalBetaPerToolRuntimeProof): boolean {
  const records = packet?.records ?? []
  const acceptedCpuStaticRecords = records.filter((record) => (
    cpuStaticCohortToolSet.has(record.toolId) &&
    record.runtimeProofStatus === 'runtime_proof_accepted_with_provided_evidence' &&
    record.runtimeProofAcceptedWithProvidedEvidence === true
  ))
  const blockedGpuRecords = records.filter((record) => (
    gpuRuntimeToolSet.has(record.toolId) &&
    record.runtimeProofStatus === 'blocked_pending_native_gpu_runtime_proof' &&
    record.gpuRuntimeTargeted === true &&
    record.gpuRuntimeShouldStartNow === false
  ))

  return Boolean(packet) &&
    packet?.decision === 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks' &&
    packet.sourceDecision === 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks' &&
    packet.sourceToolRouteRuntimeProofAccepted === true &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.runtimeProofRecordsPrepared === 21 &&
    packet.runtimeProofAcceptedWithProvidedEvidenceTools === 13 &&
    packet.jsRuntimeProofAcceptedWithProvidedEvidenceTools === 13 &&
    packet.nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools === 0 &&
    packet.blockedPendingNativeGpuRuntimeProofTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    records.length === 21 &&
    acceptedCpuStaticRecords.length === 13 &&
    blockedGpuRecords.length === 8 &&
    packet.booleans.all13JsRuntimeProofsAccepted === true &&
    packet.booleans.all8NativeGpuRuntimeProofsAccepted === false &&
    packet.booleans.blockedPendingNativeGpuRuntimeProofTools === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingControls(input: AiGraphicsExternalBetaCpuStaticCohortAdmissionInput): string[] {
  return [
    !isSafePrivateRef(input.externalBetaCpuStaticCohortPolicyRef)
      ? 'external beta CPU/static cohort policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCpuStaticCohortRolloutRef)
      ? 'external beta CPU/static cohort rollout ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCpuStaticCohortTelemetryRef)
      ? 'external beta CPU/static cohort telemetry ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCpuStaticCohortRollbackRef)
      ? 'external beta CPU/static cohort rollback ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCpuStaticCohortSupportRef)
      ? 'external beta CPU/static cohort support ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceProof: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaCpuStaticCohortAdmissionStatus {
  if (!input.hasSourceProof) return 'missing_external_beta_per_tool_runtime_proof'
  if (!input.sourceAccepted) return 'external_beta_per_tool_runtime_proof_rejected'
  if (!input.controlsAccepted) return 'missing_external_beta_cpu_static_cohort_controls'
  return 'external_beta_cpu_static_cohort_ready_with_gpu_blocks'
}

export function buildAiGraphicsExternalBetaCpuStaticCohortAdmission(
  input: AiGraphicsExternalBetaCpuStaticCohortAdmissionInput = {},
): AiGraphicsExternalBetaCpuStaticCohortAdmission {
  const sourceAccepted = sourcePerToolRuntimeProofAccepted(input.sourcePerToolRuntimeProofPacket)
  const missing = sourceAccepted ? missingControls(input) : []
  const controlsAccepted = sourceAccepted && missing.length === 0

  const records = listAiGraphicsToolCallReadiness().map((tool): AiGraphicsExternalBetaCpuStaticCohortAdmissionRecord => {
    if (!tool.productionToolId) throw new Error(`AI graphics tool ${tool.toolId} is missing a productionToolId.`)
    const sourceRecord = input.sourcePerToolRuntimeProofPacket?.records.find((record) => (
      record.toolId === tool.toolId
    ))
    const isGpuTool = gpuRuntimeToolSet.has(tool.toolId)
    const isCpuStaticTool = cpuStaticCohortToolSet.has(tool.toolId)

    let cohortStatus: AiGraphicsExternalBetaCpuStaticCohortAdmissionRecordStatus
    let blockedReason: string | null = null

    if (!sourceAccepted) {
      cohortStatus = 'blocked_missing_external_beta_per_tool_runtime_proof'
      blockedReason = 'external beta per-tool runtime proof is missing or rejected'
    } else if (!controlsAccepted) {
      cohortStatus = 'blocked_missing_external_beta_cpu_static_cohort_controls'
      blockedReason = 'external beta CPU/static cohort controls are missing'
    } else if (isGpuTool) {
      cohortStatus = 'blocked_pending_native_gpu_runtime_proof'
      blockedReason = 'native linux/amd64 NVIDIA L4 GPU runtime proof and private model manifests are still pending'
    } else if (isCpuStaticTool) {
      cohortStatus = 'external_beta_cpu_static_candidate_with_provided_evidence'
    } else {
      cohortStatus = 'blocked_missing_external_beta_per_tool_runtime_proof'
      blockedReason = 'tool is outside the AI graphics CPU/static cohort'
    }

    return {
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.productionWorkerType === 'none' ? 'planning_only' : tool.productionWorkerType,
      runtimeTarget: tool.runtimeTarget,
      capabilityIds: tool.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      )),
      sourceRuntimeProofStatus: sourceRecord?.runtimeProofStatus ?? null,
      cohortStatus,
      cohortCandidateWithProvidedEvidence:
        cohortStatus === 'external_beta_cpu_static_candidate_with_provided_evidence',
      blockedReason,
      gpuRuntimeTargeted: isGpuTool,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      externalBetaCallableNow: false,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
    }
  })

  const cpuStaticCandidates = records.filter((record) => (
    record.cohortStatus === 'external_beta_cpu_static_candidate_with_provided_evidence'
  ))
  const blockedGpuRecords = records.filter((record) => (
    record.cohortStatus === 'blocked_pending_native_gpu_runtime_proof'
  ))

  return {
    decision: statusFromInput({
      hasSourceProof: Boolean(input.sourcePerToolRuntimeProofPacket),
      sourceAccepted,
      controlsAccepted,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_COHORT_ADMISSION_DECISION,
    sourcePerToolRuntimeProofAccepted: sourceAccepted,
    missingCpuStaticCohortControls: missing,
    totalAiGraphicsTools: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    totalProductFacingCapabilities: productCapabilityCount(),
    cpuStaticCohortCandidateToolsWithProvidedEvidence: cpuStaticCandidates.length,
    gpuBlockedToolsPendingNativeGpuProof: blockedGpuRecords.length,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    acceptedPrivateRefNamespaces,
    forbiddenCohortRefPatterns,
    records,
    policy: {
      sourcePerToolRuntimeProofRequired: true,
      sourcePerToolRuntimeProofMustHave13JsAcceptedAnd8GpuBlocked: true,
      cpuStaticCohortControlsRequired: true,
      externalBetaCpuStaticCohortIsCandidateOnly: true,
      noToolExecutionApproved: true,
      noRouteExecutionApproved: true,
      noWorkerDispatchApproved: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresExternalBetaRuntimeAdmissionAndGpuProof: true,
    },
    booleans: {
      externalBetaCpuStaticCohortAdmissionPrepared: true,
      sourcePerToolRuntimeProofAccepted: sourceAccepted,
      cpuStaticCohortControlsAccepted: controlsAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all13CpuStaticCandidatesReadyWithProvidedEvidence: cpuStaticCandidates.length === 13,
      all8GpuToolsRemainBlockedPendingNativeGpuProof: blockedGpuRecords.length === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
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
