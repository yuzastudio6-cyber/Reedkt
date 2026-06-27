import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsCapabilityId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
  evaluateAiGraphicsToolCallPlan,
  type AiGraphicsToolCallPlanEvaluation,
} from './ai-graphics-tool-call-plan-evaluator'
import type { AiGraphicsToolCallSelectedTool } from './ai-graphics-tool-call-plan-evaluator'

export const AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION =
  'ai_graphics_on_demand_runtime_admission_prepared_with_fail_closed_blocks'

export type AiGraphicsRuntimeJobAdmissionDecision =
  | 'planning_metadata_selected'
  | 'runtime_job_blocked'
  | 'runtime_job_admission_ready_for_worker_enqueue'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export type AiGraphicsGpuRuntimeStartupAuthorization =
  | 'not_requested_planning_metadata_only'
  | 'not_applicable_non_gpu_runtime'
  | 'blocked_missing_runtime_job_gates'
  | 'on_demand_start_allowed_after_live_worker_enqueue'

export interface AiGraphicsOnDemandRuntimeAdmissionInput {
  capabilityId: AiGraphicsCapabilityId | string
  requestedToolId?: AiGraphicsCanonicalToolId | string
  executionRequested?: boolean
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  artifactBoundaryApproved?: boolean
  artifactBoundaryApprovalRef?: string
  toolRouteApprovalRef?: string
  workerApprovalRef?: string
  runtimeEnqueueApprovalRef?: string
  ownerRuntimeApprovalRef?: string
  privateArtifactManifestRef?: string
  nodeRuntimeProofRef?: string
  browserRuntimeProofRef?: string
  satoriFontRuntimeProofRef?: string
  nativeGpuRuntimeProofRef?: string
  modelWeightManifestRef?: string
}

export interface AiGraphicsOnDemandRuntimeAdmission {
  decision: AiGraphicsRuntimeJobAdmissionDecision
  sourceDecision: typeof AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION
  sourcePlanEvaluatorDecision: typeof AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION
  capabilityId: string
  requestedToolId: string | null
  validCapability: boolean
  executionRequested: boolean
  selectedTool: AiGraphicsToolCallSelectedTool | null
  planEvaluation: AiGraphicsToolCallPlanEvaluation
  missingRuntimeJobGates: string[]
  missingRuntimeProofGates: string[]
  privateArtifactManifestAccepted: boolean
  runtimeJobAdmissionReadyWithProvidedEvidence: boolean
  gpuRuntimeStartupAuthorization: AiGraphicsGpuRuntimeStartupAuthorization
  gpuRuntimeStartAllowedForAcceptedJob: boolean
  gpuRuntimeShouldStartNow: false
  gpuRuntimePerformed: false
  runtimeActivationPolicy: {
    onDemandOnly: true
    noIdleGpuRuntimeApproved: true
    startsOnlyForApprovedWorkerOrToolCall: true
    cpuFallbackAllowedForHeavyTools: false
    sideEffectFreeAdmissionCheck: true
  }
  booleans: {
    onDemandRuntimeAdmissionPrepared: true
    sourcePlanEvaluatorAccepted: true
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    agentCanSelectForPlanning: true
    runtimeJobAdmissionReadyWithProvidedEvidence: boolean
    gpuRuntimeStartAllowedForAcceptedJob: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    cpuFallbackAllowedForHeavyTools: false
    privateArtifactManifestRequired: true
    privateArtifactManifestAccepted: boolean
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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

const modelWeightManifestRequiredTools = new Set<AiGraphicsCanonicalToolId>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

const runtimeActivationPolicy = {
  onDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  startsOnlyForApprovedWorkerOrToolCall: true,
  cpuFallbackAllowedForHeavyTools: false,
  sideEffectFreeAdmissionCheck: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function privateArtifactManifestAccepted(value?: string): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  return /^(private:\/\/|reeditpro-private:\/\/|reeditpro-private-artifact-ref-)/.test(value.trim())
}

function missingRuntimeJobGates(input: AiGraphicsOnDemandRuntimeAdmissionInput): string[] {
  return [
    !hasValue(input.approvedPlanSnapshotId) ? 'approved plan snapshot is missing' : undefined,
    !hasValue(input.creditReservationId) ? 'credit reservation is missing' : undefined,
    input.artifactBoundaryApproved !== true && !hasValue(input.artifactBoundaryApprovalRef)
      ? 'artifact boundary approval is missing'
      : undefined,
    !hasValue(input.toolRouteApprovalRef) ? 'Tool Route approval reference is missing' : undefined,
    !hasValue(input.workerApprovalRef) ? 'Worker approval reference is missing' : undefined,
    !hasValue(input.runtimeEnqueueApprovalRef) ? 'runtime enqueue approval reference is missing' : undefined,
    !hasValue(input.ownerRuntimeApprovalRef) ? 'owner runtime approval reference is missing' : undefined,
    !privateArtifactManifestAccepted(input.privateArtifactManifestRef)
      ? 'private artifact manifest reference is missing or not private-scoped'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function missingRuntimeProofGates(
  tool: AiGraphicsToolCallSelectedTool | null,
  input: AiGraphicsOnDemandRuntimeAdmissionInput,
): string[] {
  if (!tool) return []
  const gates: string[] = []

  if (tool.gpuRequiredForRuntime) {
    if (!hasValue(input.nativeGpuRuntimeProofRef)) {
      gates.push('native NVIDIA GPU runtime proof reference is missing')
    }
    if (
      modelWeightManifestRequiredTools.has(tool.toolId) &&
      !hasValue(input.modelWeightManifestRef)
    ) {
      gates.push('reviewed model-weight manifest reference is missing')
    }
    return gates
  }

  if (tool.runtimeTarget === 'node_cpu_static' && !hasValue(input.nodeRuntimeProofRef)) {
    gates.push('Node CPU/static runtime proof reference is missing')
  }

  if (tool.toolId === 'satori' && !hasValue(input.satoriFontRuntimeProofRef)) {
    gates.push('Satori approved font runtime proof reference is missing')
  }

  if (
    tool.runtimeTarget.startsWith('browser_') &&
    !hasValue(input.browserRuntimeProofRef)
  ) {
    gates.push('browser/canvas/WebGL runtime proof reference is missing')
  }

  return gates
}

function startupAuthorization(input: {
  executionRequested: boolean
  tool: AiGraphicsToolCallSelectedTool | null
  ready: boolean
}): AiGraphicsGpuRuntimeStartupAuthorization {
  if (!input.executionRequested) return 'not_requested_planning_metadata_only'
  if (!input.tool?.gpuRequiredForRuntime) return 'not_applicable_non_gpu_runtime'
  return input.ready
    ? 'on_demand_start_allowed_after_live_worker_enqueue'
    : 'blocked_missing_runtime_job_gates'
}

function decisionFromInput(input: {
  planEvaluation: AiGraphicsToolCallPlanEvaluation
  tool: AiGraphicsToolCallSelectedTool | null
  executionRequested: boolean
  ready: boolean
}): AiGraphicsRuntimeJobAdmissionDecision {
  if (!input.planEvaluation.validCapability) return 'invalid_capability_blocked'
  if (!input.tool) return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  return input.ready
    ? 'runtime_job_admission_ready_for_worker_enqueue'
    : 'runtime_job_blocked'
}

export function evaluateAiGraphicsOnDemandRuntimeAdmission(
  input: AiGraphicsOnDemandRuntimeAdmissionInput,
): AiGraphicsOnDemandRuntimeAdmission {
  const requestedToolIds = input.requestedToolId ? [input.requestedToolId] : undefined
  const planEvaluation = evaluateAiGraphicsToolCallPlan({
    capabilityId: input.capabilityId,
    requestedToolIds,
    executionRequested: input.executionRequested,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    artifactBoundaryApproved:
      input.artifactBoundaryApproved === true || hasValue(input.artifactBoundaryApprovalRef),
  })
  const selectedTool = planEvaluation.selectedTools[0] ?? null
  const jobGates = input.executionRequested === true ? missingRuntimeJobGates(input) : []
  const proofGates = input.executionRequested === true
    ? missingRuntimeProofGates(selectedTool, input)
    : []
  const ready =
    input.executionRequested === true &&
    Boolean(selectedTool) &&
    jobGates.length === 0 &&
    proofGates.length === 0
  const privateManifestAccepted = privateArtifactManifestAccepted(input.privateArtifactManifestRef)
  const gpuRuntimeStartAllowedForAcceptedJob = ready && selectedTool?.gpuRequiredForRuntime === true

  return {
    decision: decisionFromInput({
      planEvaluation,
      tool: selectedTool,
      executionRequested: input.executionRequested === true,
      ready,
    }),
    sourceDecision: AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION,
    sourcePlanEvaluatorDecision: AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
    capabilityId: input.capabilityId,
    requestedToolId: input.requestedToolId ?? null,
    validCapability: planEvaluation.validCapability,
    executionRequested: input.executionRequested === true,
    selectedTool,
    planEvaluation,
    missingRuntimeJobGates: jobGates,
    missingRuntimeProofGates: proofGates,
    privateArtifactManifestAccepted: privateManifestAccepted,
    runtimeJobAdmissionReadyWithProvidedEvidence: ready,
    gpuRuntimeStartupAuthorization: startupAuthorization({
      executionRequested: input.executionRequested === true,
      tool: selectedTool,
      ready,
    }),
    gpuRuntimeStartAllowedForAcceptedJob,
    gpuRuntimeShouldStartNow: false,
    gpuRuntimePerformed: false,
    runtimeActivationPolicy,
    booleans: {
      onDemandRuntimeAdmissionPrepared: true,
      sourcePlanEvaluatorAccepted: true,
      all21ToolsCovered: AI_GRAPHICS_CANONICAL_TOOL_IDS.length === 21,
      all12CapabilitiesCovered: AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
        .filter((capability) => !['planning_metadata_only', 'blocked_or_deferred'].includes(capability))
        .length === 12,
      agentCanSelectForPlanning: true,
      runtimeJobAdmissionReadyWithProvidedEvidence: ready,
      gpuRuntimeStartAllowedForAcceptedJob,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      privateArtifactManifestRequired: true,
      privateArtifactManifestAccepted: privateManifestAccepted,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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

export function buildAiGraphicsOnDemandRuntimeAdmissionExamples(): AiGraphicsOnDemandRuntimeAdmission[] {
  return [
    evaluateAiGraphicsOnDemandRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
    }),
    evaluateAiGraphicsOnDemandRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
      executionRequested: true,
    }),
    evaluateAiGraphicsOnDemandRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
      executionRequested: true,
      approvedPlanSnapshotId: 'approved_snapshot_internal_beta_fixture',
      creditReservationId: 'credit_reservation_internal_beta_fixture',
      artifactBoundaryApprovalRef: 'artifact_boundary_approval_internal_beta_fixture',
      toolRouteApprovalRef: 'tool_route_approval_internal_beta_fixture',
      workerApprovalRef: 'worker_approval_internal_beta_fixture',
      runtimeEnqueueApprovalRef: 'runtime_enqueue_approval_internal_beta_fixture',
      ownerRuntimeApprovalRef: 'owner_runtime_approval_internal_beta_fixture',
      privateArtifactManifestRef: 'private://ai-graphics/internal-beta/artifact-manifest.json',
      nativeGpuRuntimeProofRef: 'private://ai-graphics/gpu-proof/sam2-proof.json',
      modelWeightManifestRef: 'private://ai-graphics/model-manifests/sam2.json',
    }),
    evaluateAiGraphicsOnDemandRuntimeAdmission({
      capabilityId: 'chart_overlay',
      requestedToolId: 'd3',
      executionRequested: true,
      approvedPlanSnapshotId: 'approved_snapshot_internal_beta_fixture',
      creditReservationId: 'credit_reservation_internal_beta_fixture',
      artifactBoundaryApprovalRef: 'artifact_boundary_approval_internal_beta_fixture',
      toolRouteApprovalRef: 'tool_route_approval_internal_beta_fixture',
      workerApprovalRef: 'worker_approval_internal_beta_fixture',
      runtimeEnqueueApprovalRef: 'runtime_enqueue_approval_internal_beta_fixture',
      ownerRuntimeApprovalRef: 'owner_runtime_approval_internal_beta_fixture',
      privateArtifactManifestRef: 'private://ai-graphics/internal-beta/artifact-manifest.json',
      nodeRuntimeProofRef: 'private://ai-graphics/node-static-proof/d3.json',
    }),
  ]
}
