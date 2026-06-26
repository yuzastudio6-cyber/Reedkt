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
  heavyToolsIncorrectlyTargetingCpu: 0
  betaActivationReadyTools: 0
  blockedTools: 21
  tools: AiGraphicsBetaActivationToolGap[]
  duplicateMappingRows: []
  activationSequence: string[]
  booleans: {
    betaActivationGapReportPrepared: true
    sourceBetaReadinessGateAccepted: true
    all21ToolsCovered: true
    all21ToolsProperlyInstalledForPlannedSurface: true
    all21ToolsMappedToProductionRegistry: true
    noDuplicateProductionMappings: true
    gpuHeavyToolsTargetGpuRuntime: true
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
  'Promote planning_only/future/evaluation profiles only through owner-approved Tool Route and Worker execution lanes.',
  'Run browser/canvas/WebGL sandbox proof for chart, animation, canvas, and WebGL scene tools before runtime execution.',
  'Pass approved plan snapshot, credit reservation, artifact boundary, Tool Route, Worker, and beta owner approval gates before any beta tool execution.',
]

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
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

function nextActionForTool(input: {
  toolId: AiGraphicsCanonicalToolId
  gpuRequiredForRuntime: boolean
  modelWeightsRequired: boolean
  profileMigrationGates: string[]
  policyGates: string[]
  runtimeTarget: string
}): string {
  if (input.modelWeightsRequired) return `Review the private model-weight manifest and license/provenance evidence for ${input.toolId}.`
  if (input.gpuRequiredForRuntime) return `Run native NVIDIA L4 proof and validate the redacted proof result for ${input.toolId}.`
  if (input.runtimeTarget.startsWith('browser_')) return `Run the approved browser/canvas/WebGL sandbox proof before enabling ${input.toolId} runtime.`
  if (input.profileMigrationGates.length) return `Promote ${input.toolId} from planning-only/future status through an owner-approved executable Tool Route/Worker lane.`
  if (input.policyGates.length) return `Complete policy review for ${input.toolId} before beta activation.`
  return `Pass shared approved-snapshot, credit, artifact, Tool Route, Worker, and beta owner gates for ${input.toolId}.`
}

export function buildAiGraphicsBetaActivationGapReport(): AiGraphicsBetaActivationGapReport {
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
      }),
    }
  })

  if (tools.some((tool) => !tool.heavyToolTargetsGpu)) {
    throw new Error('One or more GPU-heavy AI graphics tools is not targeted to GPU runtime.')
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
    heavyToolsIncorrectlyTargetingCpu: 0,
    betaActivationReadyTools: 0,
    blockedTools: tools.length as 21,
    tools,
    duplicateMappingRows: [],
    activationSequence,
    booleans: {
      betaActivationGapReportPrepared: true,
      sourceBetaReadinessGateAccepted: true,
      all21ToolsCovered: true,
      all21ToolsProperlyInstalledForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      noDuplicateProductionMappings: true,
      gpuHeavyToolsTargetGpuRuntime: true,
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
