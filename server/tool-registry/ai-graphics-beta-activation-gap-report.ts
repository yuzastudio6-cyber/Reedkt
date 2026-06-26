import { evaluateToolLicensePolicy } from './tool-license-policy'
import { evaluateToolModelWeightPolicy } from './model-weight-policy'
import { evaluateRuntimePolicy } from './tool-runtime-policy'
import {
  AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
  buildAiGraphicsBetaReadinessGate,
} from './ai-graphics-beta-readiness-gate'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolStatus,
} from './production-tool-types'

export const AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION =
  'ai_graphics_beta_activation_gap_report_prepared_with_remaining_blocks'

export type AiGraphicsBetaActivationGapCategory =
  | 'install_surface_complete'
  | 'runtime_evidence_missing'
  | 'owner_or_policy_review_missing'
  | 'worker_or_route_gate_missing'
  | 'profile_migration_required'
  | 'artifact_or_credit_gate_missing'

export interface AiGraphicsBetaActivationToolGap {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  productionStatus: ProductionToolStatus
  runtimeTarget: string
  installSurface: string
  properInstallForPlannedSurface: true
  gpuRequiredForRuntime: boolean
  heavyToolTargetsGpu: boolean
  duplicateProductionMapping: false
  betaActivationReadyNow: false
  requiredEvidenceGates: string[]
  acceptedEvidenceGates: string[]
  remainingEvidenceGates: string[]
  policyGates: string[]
  profileMigrationGates: string[]
  routeWorkerGates: string[]
  gapCategories: AiGraphicsBetaActivationGapCategory[]
  nextAction: string
}

export interface AiGraphicsBetaActivationGapReport {
  decision: typeof AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION
  sourceBetaReadinessGateDecision: typeof AI_GRAPHICS_BETA_READINESS_GATE_DECISION
  totalAiGraphicsTools: 21
  properInstallForPlannedSurface: 21
  productionMappedTools: 21
  duplicateProductionMappings: 0
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  gpuRuntimeTargetsExact: true
  gpuRuntimeOnDemandOnly: true
  expectedGpuRuntimeTargets: Record<string, string>
  heavyToolsIncorrectlyTargetingCpu: 0
  betaActivationReadyTools: 0
  blockedTools: 21
  tools: AiGraphicsBetaActivationToolGap[]
  duplicateMappingRows: []
  committedRuntimeProofs: {
    nodeRuntimeProofAccepted: boolean
    browserRuntimeProofAccepted: boolean
    satoriFontRuntimeProofAccepted: boolean
    acceptedRuntimeProofGates: string[]
  }
  activationSequence: string[]
  booleans: {
    betaActivationGapReportPrepared: true
    committedNodeRuntimeProofAccepted: boolean
    committedBrowserRuntimeProofAccepted: boolean
    committedSatoriFontRuntimeProofAccepted: boolean
    sourceBetaReadinessGateAccepted: true
    all21ToolsCovered: true
    all21ToolsProperlyInstalledForPlannedSurface: true
    all21ToolsMappedToProductionRegistry: true
    noDuplicateProductionMappings: true
    gpuHeavyToolsTargetGpuRuntime: true
    gpuRuntimeTargetsExact: true
    gpuRuntimeOnDemandOnly: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

export interface AiGraphicsBetaActivationGapReportInput {
  nodeRuntimeProofAccepted?: boolean
  browserRuntimeProofAccepted?: boolean
  satoriFontRuntimeProofAccepted?: boolean
}

const commonEvidenceGates = [
  'approved_plan_snapshot_gate',
  'credit_reservation_gate',
  'artifact_boundary_gate',
  'internal_beta_owner_approval',
]

const commonRouteWorkerGates = [
  'tool_route_execution_approval',
  'worker_execution_approval',
  'worker_queue_transport_readiness',
  'worker_idempotency_key_readiness',
]

const activationSequence = [
  'Keep package/package-lock and GPU Docker install surfaces unchanged unless an explicit dependency milestone approves changes.',
  'Review private model-weight manifests for sam2, birefnet, real_esrgan, rembg, and transparent_background.',
  'Run native linux/amd64 NVIDIA L4 proof for gpu_worker_ai_graphics, sam2, birefnet, and real_esrgan, then validate with ai-graphics:gpu-runtime-proof-result:validate.',
  'Use accepted committed Node, browser/canvas/WebGL, and Satori font runtime proof packets unless they drift; do not rerun those proofs just to satisfy this gap report.',
  'Package/profile license review is narrowed for all 21 AI graphics tools; model-weight, native GPU, Tool Route, Worker, snapshot, credit, artifact, and beta owner gates remain evidence-driven.',
  'Pass approved plan snapshot, credit reservation, artifact boundary, Tool Route, Worker, and beta owner approval gates before any beta tool execution.',
]

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
} as const

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function gpuRuntimeTargetsExact(
  tools: AiGraphicsBetaActivationToolGap[],
): boolean {
  return Object.entries(expectedGpuRuntimeTargets).every(([toolId, runtimeTarget]) => (
    tools.some((tool) => (
      tool.toolId === toolId &&
      tool.workerType === 'gpu_ai_worker' &&
      tool.runtimeTarget === runtimeTarget
    ))
  ))
}

function categoryList(input: {
  requiredEvidenceGates: string[]
  policyGates: string[]
  profileMigrationGates: string[]
  routeWorkerGates: string[]
}): AiGraphicsBetaActivationGapCategory[] {
  const categories: AiGraphicsBetaActivationGapCategory[] = ['install_surface_complete']
  if (input.requiredEvidenceGates.length) categories.push('runtime_evidence_missing')
  if (input.policyGates.length) categories.push('owner_or_policy_review_missing')
  if (input.profileMigrationGates.length) categories.push('profile_migration_required')
  if (input.routeWorkerGates.length) categories.push('worker_or_route_gate_missing')
  categories.push('artifact_or_credit_gate_missing')
  return unique(categories) as AiGraphicsBetaActivationGapCategory[]
}

function requiredEvidenceGatesForTool(input: {
  toolId: AiGraphicsCanonicalToolId
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  modelWeightsRequired: boolean
}): string[] {
  return unique([
    ...commonEvidenceGates,
    input.gpuRequiredForRuntime ? 'native_gpu_runtime_proof_result_accepted' : '',
    input.modelWeightsRequired ? 'reviewed_private_model_weight_manifest' : '',
    input.runtimeTarget === 'browser_chart_runtime_later' ? 'browser_chart_runtime_sandbox_proof' : '',
    input.runtimeTarget === 'browser_animation_runtime_later' ? 'browser_animation_runtime_sandbox_proof' : '',
    input.runtimeTarget === 'browser_canvas_webgl_runtime_later' ? 'browser_canvas_webgl_runtime_sandbox_proof' : '',
    input.toolId === 'satori' ? 'approved_satori_font_fixture_for_text_svg_layout' : '',
  ])
}

function acceptedEvidenceGatesForTool(input: {
  toolId: AiGraphicsCanonicalToolId
  runtimeTarget: string
  evidence: Required<AiGraphicsBetaActivationGapReportInput>
}): string[] {
  return unique([
    input.runtimeTarget === 'browser_chart_runtime_later' && input.evidence.browserRuntimeProofAccepted
      ? 'browser_chart_runtime_sandbox_proof'
      : '',
    input.runtimeTarget === 'browser_animation_runtime_later' && input.evidence.browserRuntimeProofAccepted
      ? 'browser_animation_runtime_sandbox_proof'
      : '',
    input.runtimeTarget === 'browser_canvas_webgl_runtime_later' && input.evidence.browserRuntimeProofAccepted
      ? 'browser_canvas_webgl_runtime_sandbox_proof'
      : '',
    input.toolId === 'satori' && input.evidence.satoriFontRuntimeProofAccepted
      ? 'approved_satori_font_fixture_for_text_svg_layout'
      : '',
  ])
}

function nextActionForTool(input: {
  toolId: AiGraphicsCanonicalToolId
  gpuRequiredForRuntime: boolean
  modelWeightsRequired: boolean
  profileMigrationGates: string[]
  policyGates: string[]
  runtimeTarget: string
  remainingEvidenceGates: string[]
}): string {
  if (input.modelWeightsRequired) return `Review the private model-weight manifest and license/provenance evidence for ${input.toolId}.`
  if (input.gpuRequiredForRuntime) return `Run native NVIDIA L4 proof and validate the redacted proof result for ${input.toolId}.`
  if (
    input.runtimeTarget.startsWith('browser_') &&
    input.remainingEvidenceGates.some((gate) => gate.includes('browser_'))
  ) return `Run the approved browser/canvas/WebGL sandbox proof before enabling ${input.toolId} runtime.`
  if (input.profileMigrationGates.length) return `Promote ${input.toolId} from planning-only/future status through an owner-approved executable Tool Route/Worker lane.`
  if (input.policyGates.length) return `Complete policy review for ${input.toolId} before beta activation.`
  return `Pass shared approved-snapshot, credit, artifact, Tool Route, Worker, and beta owner gates for ${input.toolId}.`
}

function normalizeEvidence(
  input: AiGraphicsBetaActivationGapReportInput = {},
): Required<AiGraphicsBetaActivationGapReportInput> {
  return {
    nodeRuntimeProofAccepted: input.nodeRuntimeProofAccepted === true,
    browserRuntimeProofAccepted: input.browserRuntimeProofAccepted === true,
    satoriFontRuntimeProofAccepted: input.satoriFontRuntimeProofAccepted === true,
  }
}

function acceptedRuntimeProofGates(
  evidence: Required<AiGraphicsBetaActivationGapReportInput>,
): string[] {
  return unique([
    evidence.nodeRuntimeProofAccepted ? 'node_cpu_static_runtime_proof_packet' : '',
    evidence.browserRuntimeProofAccepted ? 'browser_canvas_webgl_runtime_sandbox_proof_packet' : '',
    evidence.satoriFontRuntimeProofAccepted ? 'satori_font_runtime_proof_packet' : '',
  ])
}

export function buildAiGraphicsBetaActivationGapReport(
  input: AiGraphicsBetaActivationGapReportInput = {},
): AiGraphicsBetaActivationGapReport {
  const evidence = normalizeEvidence(input)
  const betaGate = buildAiGraphicsBetaReadinessGate()
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const productionIds = readinessRecords.map((record) => record.productionToolId).filter(Boolean)
  const duplicateProductionIds = productionIds.filter((toolId, index) => productionIds.indexOf(toolId) !== index)

  const tools = readinessRecords.map((record): AiGraphicsBetaActivationToolGap => {
    const profile = getAiGraphicsMappedProductionProfile(record.toolId)
    if (!profile || !record.productionToolId) {
      throw new Error(`AI graphics tool is missing production mapping: ${record.toolId}`)
    }

    const runtimePolicy = evaluateRuntimePolicy(profile, profile.workerType)
    const licensePolicy = evaluateToolLicensePolicy(profile)
    const modelWeightPolicy = evaluateToolModelWeightPolicy(profile)

    const requiredEvidenceGates = requiredEvidenceGatesForTool({
      toolId: record.toolId,
      runtimeTarget: record.runtimeTarget,
      gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      modelWeightsRequired: profile.modelWeightsRequired,
    })
    const acceptedEvidenceGates = acceptedEvidenceGatesForTool({
      toolId: record.toolId,
      runtimeTarget: record.runtimeTarget,
      evidence,
    })
    const remainingEvidenceGates = requiredEvidenceGates
      .filter((gate) => !acceptedEvidenceGates.includes(gate))
    const profileMigrationGates = unique([
      profile.workerType === 'planning_only' ? 'production profile workerType must move away from planning_only before beta execution' : '',
      profile.executionMode === 'planning_metadata' ? 'production profile executionMode must move away from planning_metadata before beta execution' : '',
      profile.executionMode === 'evaluation_only' ? 'evaluation_only execution mode must be replaced by approved worker_recipe/render_pipeline before beta execution' : '',
      profile.productionStatus === 'future' ? 'productionStatus future must be promoted by owner approval before beta execution' : '',
      profile.productionStatus === 'evaluation_only' ? 'productionStatus evaluation_only must be promoted by owner approval before beta execution' : '',
    ])
    const policyGates = unique([
      ...licensePolicy.blockingReasons,
      ...modelWeightPolicy.blockingReasons,
      ...runtimePolicy.blockingReasons,
      profile.productionStatus === 'needs_license_review' ? `${record.toolId} production status still needs license review.` : '',
    ])
    const routeWorkerGates = [...commonRouteWorkerGates]
    const heavyToolTargetsGpu = !record.gpuRequiredForRuntime || (
      record.runtimeTarget.includes('nvidia_l4') &&
      profile.gpuRequired &&
      profile.cpuAllowed === false
    )

    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: profile.workerType,
      productionStatus: profile.productionStatus,
      runtimeTarget: record.runtimeTarget,
      installSurface: record.installSurface,
      properInstallForPlannedSurface: true,
      gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      heavyToolTargetsGpu,
      duplicateProductionMapping: false,
      betaActivationReadyNow: false,
      requiredEvidenceGates,
      acceptedEvidenceGates,
      remainingEvidenceGates,
      policyGates,
      profileMigrationGates,
      routeWorkerGates,
      gapCategories: categoryList({
        requiredEvidenceGates,
        policyGates,
        profileMigrationGates,
        routeWorkerGates,
      }),
      nextAction: nextActionForTool({
        toolId: record.toolId,
        gpuRequiredForRuntime: record.gpuRequiredForRuntime,
        modelWeightsRequired: profile.modelWeightsRequired,
        profileMigrationGates,
        policyGates,
        runtimeTarget: record.runtimeTarget,
        remainingEvidenceGates,
      }),
    }
  })

  if (tools.some((tool) => !tool.heavyToolTargetsGpu)) {
    throw new Error('One or more GPU-heavy AI graphics tools is not targeted to GPU runtime.')
  }
  if (!gpuRuntimeTargetsExact(tools)) {
    throw new Error('One or more GPU-heavy AI graphics tools is not using the exact expected GPU runtime target.')
  }
  if (duplicateProductionIds.length) {
    throw new Error(`Duplicate AI graphics production mappings found: ${duplicateProductionIds.join(', ')}`)
  }

  return {
    decision: AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION,
    sourceBetaReadinessGateDecision: AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
    totalAiGraphicsTools: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    properInstallForPlannedSurface: tools.filter((tool) => tool.properInstallForPlannedSurface).length as 21,
    productionMappedTools: tools.length as 21,
    duplicateProductionMappings: 0,
    gpuRuntimeTargetedTools: betaGate.gpuRuntimeTargetedTools,
    gpuRuntimeTargetsExact: true,
    gpuRuntimeOnDemandOnly: true,
    expectedGpuRuntimeTargets: { ...expectedGpuRuntimeTargets },
    heavyToolsIncorrectlyTargetingCpu: 0,
    betaActivationReadyTools: 0,
    blockedTools: tools.length as 21,
    tools,
    duplicateMappingRows: [],
    committedRuntimeProofs: {
      nodeRuntimeProofAccepted: evidence.nodeRuntimeProofAccepted,
      browserRuntimeProofAccepted: evidence.browserRuntimeProofAccepted,
      satoriFontRuntimeProofAccepted: evidence.satoriFontRuntimeProofAccepted,
      acceptedRuntimeProofGates: acceptedRuntimeProofGates(evidence),
    },
    activationSequence,
    booleans: {
      betaActivationGapReportPrepared: true,
      committedNodeRuntimeProofAccepted: evidence.nodeRuntimeProofAccepted,
      committedBrowserRuntimeProofAccepted: evidence.browserRuntimeProofAccepted,
      committedSatoriFontRuntimeProofAccepted: evidence.satoriFontRuntimeProofAccepted,
      sourceBetaReadinessGateAccepted: true,
      all21ToolsCovered: true,
      all21ToolsProperlyInstalledForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      noDuplicateProductionMappings: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
