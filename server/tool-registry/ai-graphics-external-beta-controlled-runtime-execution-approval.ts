import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { listAiGraphicsToolCallHandoffTools } from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION,
  type AiGraphicsExternalBetaCandidateEvidenceAssembly,
} from './ai-graphics-external-beta-candidate-evidence-assembly'
import {
  AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION,
  type AiGraphicsExternalBetaRuntimeAdmission,
} from './ai-graphics-external-beta-runtime-admission'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION,
  type AiGraphicsExternalBetaCpuStaticRuntimeAdmission,
} from './ai-graphics-external-beta-cpu-static-runtime-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION =
  'ai_graphics_external_beta_controlled_runtime_execution_approval_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaControlledRuntimeExecutionApprovalStatus =
  | 'missing_external_beta_candidate_evidence_assembly'
  | 'external_beta_candidate_evidence_assembly_rejected'
  | 'missing_external_beta_runtime_admission'
  | 'external_beta_runtime_admission_rejected'
  | 'awaiting_external_beta_controlled_runtime_execution_approval'
  | 'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked'

export type AiGraphicsExternalBetaRuntimeAdmissionSource =
  | AiGraphicsExternalBetaRuntimeAdmission
  | AiGraphicsExternalBetaCpuStaticRuntimeAdmission

export interface AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput {
  sourceCandidateEvidenceAssemblyPacket?: AiGraphicsExternalBetaCandidateEvidenceAssembly
  sourceExternalBetaRuntimeAdmissionPacket?: AiGraphicsExternalBetaRuntimeAdmission
  sourceExternalBetaCpuStaticRuntimeAdmissionPacket?: AiGraphicsExternalBetaCpuStaticRuntimeAdmission
  externalBetaControlledRuntimeExecutionApprovalGranted?: boolean
  externalBetaControlledRuntimeExecutionApprovalRef?: string
  externalBetaControlledRuntimeExecutionApproverRole?: string
}

export interface AiGraphicsExternalBetaControlledRuntimeActivationPolicy {
  onDemandOnly: true
  noIdleGpuRuntimeApproved: true
  startsOnlyForApprovedWorkerOrToolCall: true
  cpuFallbackAllowedForHeavyTools: false
}

export interface AiGraphicsExternalBetaControlledRuntimeExecutionScope {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  controlledRuntimeActivationPolicy:
    AiGraphicsExternalBetaControlledRuntimeActivationPolicy | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  candidateEvidenceAssembledWithProvidedEvidence: boolean
  controlledRuntimeExecutionScopeApprovedWithProvidedEvidence: boolean
  liveWorkerQueueApprovedNow: false
  liveWorkerDispatchApprovedNow: false
  liveToolExecutionApprovedNow: false
  nextRuntimeProofMilestone: string
}

export interface AiGraphicsExternalBetaControlledRuntimeExecutionApproval {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION
  sourceCandidateEvidenceAssemblyDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION
  sourceRuntimeAdmissionDecision:
    | typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION
    | typeof AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
    | null
  sourceRuntimeAdmissionMode:
    | 'all_tools_external_beta'
    | 'cpu_static_first_cohort'
    | 'missing'
  status: AiGraphicsExternalBetaControlledRuntimeExecutionApprovalStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  candidateEvidenceAssembledToolsWithProvidedEvidence: number
  runtimeAdmissionAcceptedWithProvidedEvidenceRequests: number
  controlledRuntimeExecutionCandidateToolsWithProvidedEvidence: number
  controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence: number
  gpuRuntimeTargetedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: number
  heavyToolsIncorrectlyTargetingCpu: 0
  liveWorkerQueueApprovedNowTools: 0
  liveWorkerDispatchApprovedNowTools: 0
  liveToolExecutionApprovedNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceCandidateEvidenceAssembly: AiGraphicsExternalBetaCandidateEvidenceAssembly | null
  sourceRuntimeAdmission: AiGraphicsExternalBetaRuntimeAdmissionSource | null
  controlledRuntimeExecutionApprovalRecord: {
    accepted: boolean
    approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER'
    approvalRef: string | null
    approvesLiveQueueNow: false
    approvesWorkerDispatchNow: false
    approvesToolExecutionNow: false
    approvesRuntimeNow: false
  }
  gpuRuntimeActivationPolicy: AiGraphicsExternalBetaControlledRuntimeActivationPolicy
  allowedControlledRuntimeApprovalActions: string[]
  blockedRuntimeActions: string[]
  toolScopes: AiGraphicsExternalBetaControlledRuntimeExecutionScope[]
  nextMilestones: string[]
  booleans: {
    externalBetaControlledRuntimeExecutionApprovalPrepared: true
    sourceCandidateEvidenceAssemblyAccepted: boolean
    sourceExternalBetaRuntimeAdmissionAccepted: boolean
    sourceRuntimeAdmissionRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceRuntimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted: boolean
    controlledRuntimeExecutionApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ControlledRuntimeExecutionScopesPrepared: boolean
    all21ControlledRuntimeExecutionScopesApprovedWithProvidedEvidence: boolean
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

const gpuRuntimeActivationPolicy: AiGraphicsExternalBetaControlledRuntimeActivationPolicy = {
  onDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  startsOnlyForApprovedWorkerOrToolCall: true,
  cpuFallbackAllowedForHeavyTools: false,
}

const allowedControlledRuntimeApprovalActions = [
  'accept assembled all-21 external-beta candidate evidence with private artifact controls',
  'accept a side-effect-free external-beta runtime admission record with provided evidence',
  'record controlled runtime execution approval metadata without enqueueing work',
  'bind GPU startup to accepted external-beta worker/tool jobs only',
  'keep live queue writes, worker dispatch, tool execution, storage, public artifacts, beta, and production blocked',
]

const blockedRuntimeActions = [
  'live worker queue enqueue',
  'worker lease creation',
  'worker dispatch',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'Feed this approval packet into a future environment-scoped live enqueue authorization that still requires explicit non-production external-beta operator confirmation.',
  'Keep GPU workers cold until an accepted GPU/model tool job reaches worker execution, then release GPU resources after the job completes.',
  'Require per-tool runtime proof recheck and QA result evidence before any external-beta callable status can move above zero.',
  'Require production launch approval, incident response, rollback, support, and cost guardrails before production readiness can be considered.',
]

function hasPrivateApprovalRef(value?: string): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-runtime://') ||
    normalized.startsWith('external-beta-evidence://')
}

function candidateEvidenceAssemblyAccepted(
  packet?: AiGraphicsExternalBetaCandidateEvidenceAssembly,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION &&
    packet.status === 'external_beta_candidate_evidence_assembled_runtime_still_blocked' &&
    packet.counts.assembledExternalBetaCandidateToolsWithProvidedEvidence === 21 &&
    packet.counts.gpuRuntimeTargetedTools === 8 &&
    packet.counts.heavyToolsIncorrectlyTargetingCpu === 0 &&
    packet.counts.externalBetaReadyNowTools === 0 &&
    packet.counts.productionReadyNowTools === 0 &&
    packet.booleans.sourceExternalBetaEndToEndReadinessAccepted === true &&
    packet.booleans.sourceExternalBetaPrivateArtifactManifestAccepted === true &&
    packet.booleans.assembledExternalBetaCandidateWithProvidedEvidence === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerExecutionApprovedNow === false &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function allToolsRuntimeAdmissionAccepted(
  packet: AiGraphicsExternalBetaRuntimeAdmission,
): boolean {
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION &&
    packet.decision === 'external_beta_runtime_admission_ready_for_worker_enqueue' &&
    packet.sourceLaunchGoNoGoAccepted === true &&
    packet.sourceLaunchGoNoGoRuntimeProofBridgeAccepted === true &&
    packet.sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.externalBetaRuntimeAdmissionReadyWithProvidedEvidence === true &&
    packet.externalBetaWorkerEnqueueAllowedWithProvidedEvidence === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceExternalBetaLaunchGoNoGoAccepted === true &&
    packet.booleans.sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function cpuStaticRuntimeAdmissionAccepted(
  packet: AiGraphicsExternalBetaCpuStaticRuntimeAdmission,
): boolean {
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION &&
    packet.decision === 'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue' &&
    packet.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.cpuStaticRuntimeAdmissionReadyWithProvidedEvidence === true &&
    packet.externalBetaWorkerEnqueueAllowedWithProvidedEvidence === true &&
    packet.selectedToolInCpuStaticCohort === true &&
    packet.selectedToolBlockedPendingNativeGpuProof === false &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function sourceRuntimeAdmission(
  input: AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput,
): AiGraphicsExternalBetaRuntimeAdmissionSource | null {
  return input.sourceExternalBetaRuntimeAdmissionPacket ??
    input.sourceExternalBetaCpuStaticRuntimeAdmissionPacket ??
    null
}

function runtimeAdmissionAccepted(
  packet: AiGraphicsExternalBetaRuntimeAdmissionSource | null,
): boolean {
  if (!packet) return false
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
    ? cpuStaticRuntimeAdmissionAccepted(packet as AiGraphicsExternalBetaCpuStaticRuntimeAdmission)
    : allToolsRuntimeAdmissionAccepted(packet as AiGraphicsExternalBetaRuntimeAdmission)
}

function runtimeAdmissionRuntimeQueueServiceProofBridgeAccepted(
  packet: AiGraphicsExternalBetaRuntimeAdmissionSource | null,
): boolean {
  if (!packet) return false
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
    ? (packet as AiGraphicsExternalBetaCpuStaticRuntimeAdmission)
      .sourceRuntimeQueueServiceProofBridgeAccepted === true
    : (packet as AiGraphicsExternalBetaRuntimeAdmission)
      .sourceLaunchGoNoGoRuntimeProofBridgeAccepted === true
}

function runtimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted(
  packet: AiGraphicsExternalBetaRuntimeAdmissionSource | null,
): boolean {
  if (!packet) return false
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
    ? (packet as AiGraphicsExternalBetaCpuStaticRuntimeAdmission)
      .sourceServiceRoleQueueSmokeAuthorizationAccepted === true
    : (packet as AiGraphicsExternalBetaRuntimeAdmission)
      .sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted === true
}

function runtimeAdmissionMode(
  packet: AiGraphicsExternalBetaRuntimeAdmissionSource | null,
): 'all_tools_external_beta' | 'cpu_static_first_cohort' | 'missing' {
  if (!packet) return 'missing'
  return packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_RUNTIME_ADMISSION_DECISION
    ? 'cpu_static_first_cohort'
    : 'all_tools_external_beta'
}

function controlledRuntimeApprovalRecordAccepted(
  input: AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput,
): boolean {
  return input.externalBetaControlledRuntimeExecutionApprovalGranted === true &&
    hasPrivateApprovalRef(input.externalBetaControlledRuntimeExecutionApprovalRef) &&
    (input.externalBetaControlledRuntimeExecutionApproverRole ??
      'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER') ===
        'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER'
}

function statusFromInput(input: {
  hasCandidatePacket: boolean
  candidateAccepted: boolean
  hasRuntimeAdmission: boolean
  runtimeAdmissionAccepted: boolean
  approvalAccepted: boolean
}): AiGraphicsExternalBetaControlledRuntimeExecutionApprovalStatus {
  if (!input.hasCandidatePacket) return 'missing_external_beta_candidate_evidence_assembly'
  if (!input.candidateAccepted) return 'external_beta_candidate_evidence_assembly_rejected'
  if (!input.hasRuntimeAdmission) return 'missing_external_beta_runtime_admission'
  if (!input.runtimeAdmissionAccepted) return 'external_beta_runtime_admission_rejected'
  if (!input.approvalAccepted) {
    return 'awaiting_external_beta_controlled_runtime_execution_approval'
  }
  return 'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked'
}

export function buildAiGraphicsExternalBetaControlledRuntimeExecutionApproval(
  input: AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput = {},
): AiGraphicsExternalBetaControlledRuntimeExecutionApproval {
  const sourceCandidateEvidenceAssembly =
    input.sourceCandidateEvidenceAssemblyPacket ?? null
  const candidateAccepted = candidateEvidenceAssemblyAccepted(
    input.sourceCandidateEvidenceAssemblyPacket,
  )
  const runtimeAdmission = sourceRuntimeAdmission(input)
  const runtimeAccepted = runtimeAdmissionAccepted(runtimeAdmission)
  const runtimeProofBridgeAccepted =
    runtimeAdmissionRuntimeQueueServiceProofBridgeAccepted(runtimeAdmission)
  const runtimeAuthorizationAccepted =
    runtimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted(runtimeAdmission)
  const approvalAccepted = controlledRuntimeApprovalRecordAccepted(input)
  const status = statusFromInput({
    hasCandidatePacket: Boolean(sourceCandidateEvidenceAssembly),
    candidateAccepted,
    hasRuntimeAdmission: Boolean(runtimeAdmission),
    runtimeAdmissionAccepted: runtimeAccepted,
    approvalAccepted,
  })
  const approved =
    status === 'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked'
  const mode = runtimeAdmissionMode(runtimeAdmission)

  const toolScopes = listAiGraphicsToolCallHandoffTools()
    .map((tool): AiGraphicsExternalBetaControlledRuntimeExecutionScope => {
      const scopeApproved =
        approved &&
        (mode === 'all_tools_external_beta' || tool.gpuRequiredForRuntime === false)
      return {
        toolId: tool.toolId,
        productionToolId: tool.productionToolId,
        workerType: tool.workerType,
        runtimeTarget: tool.runtimeTarget,
        capabilityIds: [...tool.capabilities],
        gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
        controlledRuntimeActivationPolicy:
          tool.gpuRequiredForRuntime ? gpuRuntimeActivationPolicy : null,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
          approved && mode === 'all_tools_external_beta' && tool.gpuRequiredForRuntime,
        gpuRuntimeShouldStartNow: false,
        candidateEvidenceAssembledWithProvidedEvidence: candidateAccepted,
        controlledRuntimeExecutionScopeApprovedWithProvidedEvidence: scopeApproved,
        liveWorkerQueueApprovedNow: false,
        liveWorkerDispatchApprovedNow: false,
        liveToolExecutionApprovedNow: false,
        nextRuntimeProofMilestone: tool.nextProofMilestone,
      }
    })
  const gpuRuntimeTargetedTools =
    toolScopes.filter((scope) => scope.gpuRequiredForRuntime).length
  const controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence =
    toolScopes.filter((scope) => scope.controlledRuntimeExecutionScopeApprovedWithProvidedEvidence).length
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools =
    toolScopes.filter((scope) => scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob).length

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_RUNTIME_EXECUTION_APPROVAL_DECISION,
    sourceCandidateEvidenceAssemblyDecision:
      AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION,
    sourceRuntimeAdmissionDecision: runtimeAdmission?.sourceDecision ?? null,
    sourceRuntimeAdmissionMode: mode,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    candidateEvidenceAssembledToolsWithProvidedEvidence:
      candidateAccepted ? 21 : 0,
    runtimeAdmissionAcceptedWithProvidedEvidenceRequests:
      runtimeAccepted ? 1 : 0,
    controlledRuntimeExecutionCandidateToolsWithProvidedEvidence:
      candidateAccepted && runtimeAccepted ? 21 : 0,
    controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence,
    gpuRuntimeTargetedTools,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    liveWorkerQueueApprovedNowTools: 0,
    liveWorkerDispatchApprovedNowTools: 0,
    liveToolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceCandidateEvidenceAssembly,
    sourceRuntimeAdmission: runtimeAdmission,
    controlledRuntimeExecutionApprovalRecord: {
      accepted: approvalAccepted,
      approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER',
      approvalRef:
        input.externalBetaControlledRuntimeExecutionApprovalRef ?? null,
      approvesLiveQueueNow: false,
      approvesWorkerDispatchNow: false,
      approvesToolExecutionNow: false,
      approvesRuntimeNow: false,
    },
    gpuRuntimeActivationPolicy,
    allowedControlledRuntimeApprovalActions,
    blockedRuntimeActions,
    toolScopes,
    nextMilestones,
    booleans: {
      externalBetaControlledRuntimeExecutionApprovalPrepared: true,
      sourceCandidateEvidenceAssemblyAccepted: candidateAccepted,
      sourceExternalBetaRuntimeAdmissionAccepted: runtimeAccepted,
      sourceRuntimeAdmissionRuntimeQueueServiceProofBridgeAccepted:
        runtimeProofBridgeAccepted,
      sourceRuntimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted:
        runtimeAuthorizationAccepted,
      controlledRuntimeExecutionApprovalRecordAccepted: approvalAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ControlledRuntimeExecutionScopesPrepared: toolScopes.length === 21,
      all21ControlledRuntimeExecutionScopesApprovedWithProvidedEvidence:
        controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence === 21,
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
