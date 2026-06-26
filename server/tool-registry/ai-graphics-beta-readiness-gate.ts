import { evaluateToolLicensePolicy } from './tool-license-policy'
import { evaluateToolModelWeightPolicy } from './model-weight-policy'
import { evaluateRuntimePolicy } from './tool-runtime-policy'
import {
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { buildAiGraphicsToolCallHandoffContract } from './ai-graphics-tool-call-handoff'
import type { ProductionRegistryWorkerType, ProductionToolId, ProductionToolStatus } from './production-tool-types'

export const AI_GRAPHICS_BETA_READINESS_GATE_DECISION =
  'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks'

export interface AiGraphicsBetaReadinessEvidence {
  approvedPlanSnapshotGatePassed?: boolean
  creditReservationGatePassed?: boolean
  artifactBoundaryGatePassed?: boolean
  toolRouteGatePassed?: boolean
  workerGatePassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  nativeGpuRuntimeProofPassed?: boolean
  modelWeightManifestsApproved?: boolean
  internalBetaOwnerApprovalGranted?: boolean
}

export interface AiGraphicsBetaReadinessToolGate {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  installReady: true
  productionMapped: true
  planningSelectable: true
  gpuRequiredForRuntime: boolean
  cpuFallbackAllowedForHeavyTool: false
  modelWeightsRequired: boolean
  licensePolicyAllowed: boolean
  modelWeightPolicyAllowed: boolean
  runtimePolicyAllowed: boolean
  productionStatus: ProductionToolStatus
  betaTestingReadyNow: boolean
  blockers: string[]
  warnings: string[]
}

export interface AiGraphicsBetaReadinessGate {
  decision: typeof AI_GRAPHICS_BETA_READINESS_GATE_DECISION
  toolsCovered: 21
  productFacingCapabilitiesCovered: 12
  installReadyTools: 21
  productionMappedTools: 21
  planningSelectableTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  heavyToolsIncorrectlyTargetingCpu: 0
  betaTestingReadyTools: number
  blockedTools: number
  evidence: Required<AiGraphicsBetaReadinessEvidence>
  tools: AiGraphicsBetaReadinessToolGate[]
  globalBlockers: string[]
}

const defaultEvidence: Required<AiGraphicsBetaReadinessEvidence> = {
  approvedPlanSnapshotGatePassed: false,
  creditReservationGatePassed: false,
  artifactBoundaryGatePassed: false,
  toolRouteGatePassed: false,
  workerGatePassed: false,
  browserCanvasWebglSandboxPassed: false,
  nativeGpuRuntimeProofPassed: false,
  modelWeightManifestsApproved: false,
  internalBetaOwnerApprovalGranted: false,
}

function normalizeEvidence(
  evidence: AiGraphicsBetaReadinessEvidence = {},
): Required<AiGraphicsBetaReadinessEvidence> {
  return {
    ...defaultEvidence,
    ...evidence,
  }
}

function buildSharedBlockers(evidence: Required<AiGraphicsBetaReadinessEvidence>): string[] {
  return [
    !evidence.approvedPlanSnapshotGatePassed ? 'approved plan snapshot gate is not passed' : undefined,
    !evidence.creditReservationGatePassed ? 'credit reservation gate is not passed' : undefined,
    !evidence.artifactBoundaryGatePassed ? 'artifact boundary gate is not passed' : undefined,
    !evidence.toolRouteGatePassed ? 'Tool Route approval gate is not passed' : undefined,
    !evidence.workerGatePassed ? 'Worker approval gate is not passed' : undefined,
    !evidence.internalBetaOwnerApprovalGranted ? 'internal beta owner approval is not granted' : undefined,
  ].filter((blocker): blocker is string => Boolean(blocker))
}

function buildRuntimeSpecificBlockers(input: {
  toolId: AiGraphicsCanonicalToolId
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  modelWeightsRequired: boolean
  modelWeightPolicyAllowed: boolean
  profileWorkerType: ProductionRegistryWorkerType
  productionStatus: ProductionToolStatus
  evidence: Required<AiGraphicsBetaReadinessEvidence>
}): string[] {
  const blockers: string[] = []

  if (input.profileWorkerType === 'planning_only') {
    blockers.push(`${input.toolId} production registry profile is still planning_only and needs an executable worker profile before beta execution.`)
  }

  if (input.productionStatus === 'future') {
    blockers.push(`${input.toolId} production registry profile is still future and needs owner-approved beta promotion before beta execution.`)
  }

  if (input.productionStatus === 'evaluation_only') {
    blockers.push(`${input.toolId} production registry profile is evaluation_only and needs owner-approved beta promotion before beta execution.`)
  }

  if (input.gpuRequiredForRuntime && !input.evidence.nativeGpuRuntimeProofPassed) {
    blockers.push(`${input.toolId} requires native NVIDIA GPU runtime proof before beta execution.`)
  }

  if (input.gpuRequiredForRuntime && !input.runtimeTarget.includes('nvidia_l4')) {
    blockers.push(`${input.toolId} is GPU-heavy but is not targeted to the native NVIDIA L4 runtime.`)
  }

  if (input.modelWeightsRequired && !input.evidence.modelWeightManifestsApproved) {
    blockers.push(`${input.toolId} requires reviewed model-weight manifests before beta execution.`)
  }

  if (input.modelWeightsRequired && !input.modelWeightPolicyAllowed) {
    blockers.push(`${input.toolId} production model-weight policy is still blocked or needs review.`)
  }

  if (
    (input.runtimeTarget === 'browser_chart_runtime_later' ||
      input.runtimeTarget === 'browser_animation_runtime_later' ||
      input.runtimeTarget === 'browser_canvas_webgl_runtime_later') &&
    !input.evidence.browserCanvasWebglSandboxPassed
  ) {
    blockers.push(`${input.toolId} requires approved browser/canvas/WebGL sandbox proof before beta execution.`)
  }

  return blockers
}

function buildReadinessRecordBlockers(input: {
  toolId: AiGraphicsCanonicalToolId
  blockersBeforeExecution: readonly string[]
  modelWeightsRequired: boolean
  evidence: Required<AiGraphicsBetaReadinessEvidence>
}): string[] {
  const blockers: string[] = []

  for (const blocker of input.blockersBeforeExecution) {
    if (
      blocker.includes('native linux/amd64 NVIDIA L4 runtime proof') &&
      input.evidence.nativeGpuRuntimeProofPassed
    ) {
      continue
    }

    if (
      blocker.includes('approved private model-weight or model-cache manifests') &&
      (!input.modelWeightsRequired || input.evidence.modelWeightManifestsApproved)
    ) {
      continue
    }

    if (
      blocker.includes('worker execution must remain behind approved snapshot and credit gates') &&
      input.evidence.approvedPlanSnapshotGatePassed &&
      input.evidence.creditReservationGatePassed &&
      input.evidence.workerGatePassed
    ) {
      continue
    }

    if (
      blocker.includes('Tool Route and Worker execution approval') &&
      input.evidence.toolRouteGatePassed &&
      input.evidence.workerGatePassed
    ) {
      continue
    }

    if (
      (blocker.includes('browser/canvas/WebGL runtime') || blocker.includes('Animation runtime')) &&
      input.evidence.browserCanvasWebglSandboxPassed
    ) {
      continue
    }

    if (
      (blocker.includes('render/export ownership') || blocker.includes('public artifact and signed URL gates')) &&
      input.evidence.artifactBoundaryGatePassed
    ) {
      continue
    }

    blockers.push(blocker)
  }

  return blockers
}

function modelWeightPolicyAllowedByEvidence(input: {
  modelWeightResultAllowed: boolean
  modelWeightsRequired: boolean
  evidence: Required<AiGraphicsBetaReadinessEvidence>
  reviewStatus: string
  commercialUseStatus: string
}): boolean {
  if (input.modelWeightResultAllowed) return true
  if (!input.modelWeightsRequired) return true
  if (!input.evidence.modelWeightManifestsApproved) return false

  return input.reviewStatus !== 'blocked' && input.commercialUseStatus !== 'blocked'
}

export function buildAiGraphicsBetaReadinessGate(
  evidenceInput: AiGraphicsBetaReadinessEvidence = {},
): AiGraphicsBetaReadinessGate {
  const evidence = normalizeEvidence(evidenceInput)
  const sharedBlockers = buildSharedBlockers(evidence)
  const handoff = buildAiGraphicsToolCallHandoffContract()
  const readinessRecords = listAiGraphicsToolCallReadiness()

  const tools = readinessRecords.map((record): AiGraphicsBetaReadinessToolGate => {
    const profile = getAiGraphicsMappedProductionProfile(record.toolId)
    if (!profile || !record.productionToolId) {
      throw new Error(`AI graphics tool is missing production mapping: ${record.toolId}`)
    }

    const licenseResult = evaluateToolLicensePolicy(profile)
    const modelWeightResult = evaluateToolModelWeightPolicy(profile)
    const modelWeightPolicyAllowed = modelWeightPolicyAllowedByEvidence({
      modelWeightResultAllowed: modelWeightResult.allowed,
      modelWeightsRequired: profile.modelWeightsRequired,
      evidence,
      reviewStatus: profile.modelWeightPolicy.reviewStatus,
      commercialUseStatus: profile.modelWeightPolicy.commercialUseStatus,
    })
    const runtimeResult = evaluateRuntimePolicy(profile, profile.workerType)
    const runtimeBlockers = buildRuntimeSpecificBlockers({
      toolId: record.toolId,
      runtimeTarget: record.runtimeTarget,
      gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      modelWeightsRequired: profile.modelWeightsRequired,
      modelWeightPolicyAllowed,
      profileWorkerType: profile.workerType,
      productionStatus: profile.productionStatus,
      evidence,
    })
    const readinessBlockers = buildReadinessRecordBlockers({
      toolId: record.toolId,
      blockersBeforeExecution: record.blockersBeforeExecution,
      modelWeightsRequired: profile.modelWeightsRequired,
      evidence,
    })

    const blockers = [
      ...sharedBlockers,
      ...readinessBlockers,
      ...runtimeResult.blockingReasons,
      ...licenseResult.blockingReasons,
      ...(modelWeightPolicyAllowed ? [] : modelWeightResult.blockingReasons),
      ...runtimeBlockers,
    ]
    const uniqueBlockers = Array.from(new Set(blockers))

    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: profile.workerType,
      runtimeTarget: record.runtimeTarget,
      installReady: true,
      productionMapped: true,
      planningSelectable: true,
      gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      cpuFallbackAllowedForHeavyTool: false,
      modelWeightsRequired: profile.modelWeightsRequired,
      licensePolicyAllowed: licenseResult.allowed,
      modelWeightPolicyAllowed,
      runtimePolicyAllowed: runtimeResult.allowed,
      productionStatus: profile.productionStatus,
      betaTestingReadyNow: uniqueBlockers.length === 0,
      blockers: uniqueBlockers,
      warnings: Array.from(new Set([
        ...runtimeResult.warnings,
        ...licenseResult.warnings,
        ...modelWeightResult.warnings,
      ])),
    }
  })

  const gpuRuntimeTargetedTools = tools
    .filter((tool) => tool.gpuRequiredForRuntime)
    .map((tool) => tool.toolId)
  const globalBlockers = Array.from(new Set(tools.flatMap((tool) => tool.blockers)))
  const betaTestingReadyTools = tools.filter((tool) => tool.betaTestingReadyNow).length
  const blockedTools = tools.length - betaTestingReadyTools

  return {
    decision: AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
    toolsCovered: tools.length as 21,
    productFacingCapabilitiesCovered: handoff.allCapabilitiesCovered,
    installReadyTools: tools.filter((tool) => tool.installReady).length as 21,
    productionMappedTools: tools.filter((tool) => tool.productionMapped).length as 21,
    planningSelectableTools: tools.filter((tool) => tool.planningSelectable).length as 21,
    gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    betaTestingReadyTools,
    blockedTools,
    evidence,
    tools,
    globalBlockers,
  }
}
