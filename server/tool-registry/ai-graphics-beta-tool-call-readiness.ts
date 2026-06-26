import {
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundleInput,
} from './ai-graphics-beta-evidence-bundle'
import {
  listAiGraphicsToolCallPlanEvaluations,
} from './ai-graphics-tool-call-plan-evaluator'
import {
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsCapabilityId,
} from './ai-graphics-tool-call-readiness'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_BETA_TOOL_CALL_READINESS_DECISION =
  'ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults'

export interface AiGraphicsBetaToolCallReadinessInput {
  evidenceBundle?: AiGraphicsBetaEvidenceBundle
  evidenceBundleInput?: AiGraphicsBetaEvidenceBundleInput
}

export interface AiGraphicsBetaToolCallReadinessTool {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  rankedCapabilities: AiGraphicsCapabilityId[]
  installReadyForPlannedSurface: true
  productionMapped: true
  planningSelectable: true
  betaEvidenceReadyForTool: boolean
  betaToolCallableWithProvidedEvidence: boolean
  betaToolCallableNow: false
  missingEvidenceBeforeBetaToolCall: string[]
  blockersBeforeBetaToolCall: string[]
}

export interface AiGraphicsBetaToolCallReadinessCapability {
  capabilityId: AiGraphicsCapabilityId
  rankedPlanningTools: AiGraphicsCanonicalToolId[]
  betaCallablePlanningToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  betaCallablePlanningToolsNow: []
  missingEvidenceBeforeBetaToolCall: string[]
}

export interface AiGraphicsBetaToolCallReadiness {
  decision: typeof AI_GRAPHICS_BETA_TOOL_CALL_READINESS_DECISION
  sourceEvidenceDecision: AiGraphicsBetaEvidenceBundle['decision']
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  betaToolCallableWithProvidedEvidenceTools: number
  betaToolCallableNowTools: 0
  all21BetaCallableWhenEvidenceBundlePasses: boolean
  capabilitiesWithBetaCallablePlanningTools: number
  sourceBetaEvidenceBundleAccepted: boolean
  missingEvidence: string[]
  tools: AiGraphicsBetaToolCallReadinessTool[]
  capabilities: AiGraphicsBetaToolCallReadinessCapability[]
  booleans: {
    betaToolCallReadinessContractPrepared: true
    sourceBetaEvidenceBundleAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    rankingSystemConnected: true
    all21BetaCallableWhenEvidenceBundlePasses: boolean
    all12CapabilitiesHaveBetaCallableSelectionWhenEvidenceBundlePasses: boolean
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

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildBundle(input: AiGraphicsBetaToolCallReadinessInput): AiGraphicsBetaEvidenceBundle {
  return input.evidenceBundle ?? buildAiGraphicsBetaEvidenceBundle(input.evidenceBundleInput ?? {})
}

export function buildAiGraphicsBetaToolCallReadiness(
  input: AiGraphicsBetaToolCallReadinessInput = {},
): AiGraphicsBetaToolCallReadiness {
  const evidenceBundle = buildBundle(input)
  const readinessRows = listAiGraphicsToolCallReadiness()
  const evaluations = listAiGraphicsToolCallPlanEvaluations()

  const tools = readinessRows.map((record): AiGraphicsBetaToolCallReadinessTool => {
    if (!record.productionToolId) {
      throw new Error(`AI graphics tool missing production mapping: ${record.toolId}`)
    }

    const evidenceRow = evidenceBundle.tools.find((tool) => tool.toolId === record.toolId)
    if (!evidenceRow) {
      throw new Error(`AI graphics tool missing beta evidence row: ${record.toolId}`)
    }

    const betaToolCallableWithProvidedEvidence =
      evidenceBundle.all21BetaEvidenceReady &&
      evidenceRow.betaTestingReadyNow === true
    const missingEvidenceBeforeBetaToolCall = unique([
      ...evidenceBundle.missingEvidence,
      ...evidenceRow.evidenceMissing,
      ...(!evidenceBundle.all21BetaEvidenceReady ? ['all21_beta_evidence_bundle'] : []),
    ])

    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      rankedCapabilities: [...record.capabilities],
      installReadyForPlannedSurface: true,
      productionMapped: true,
      planningSelectable: true,
      betaEvidenceReadyForTool: evidenceRow.betaTestingReadyNow,
      betaToolCallableWithProvidedEvidence,
      betaToolCallableNow: false,
      missingEvidenceBeforeBetaToolCall,
      blockersBeforeBetaToolCall: unique([
        ...record.blockersBeforeExecution,
        ...evidenceRow.blockers,
        ...missingEvidenceBeforeBetaToolCall,
      ]),
    }
  })

  const capabilities = evaluations.map((evaluation): AiGraphicsBetaToolCallReadinessCapability => {
    const rankedPlanningTools = evaluation.selectedTools.map((tool) => tool.toolId)
    const betaCallablePlanningToolsWithProvidedEvidence = rankedPlanningTools.filter((toolId) => (
      tools.find((tool) => tool.toolId === toolId)?.betaToolCallableWithProvidedEvidence === true
    ))
    const missingEvidenceBeforeBetaToolCall = unique([
      ...evidenceBundle.missingEvidence,
      ...evaluation.missingProofBeforeExecution,
      ...evaluation.missingExecutionGates,
      ...(!evidenceBundle.all21BetaEvidenceReady ? ['all21_beta_evidence_bundle'] : []),
    ])

    return {
      capabilityId: evaluation.capabilityId as AiGraphicsCapabilityId,
      rankedPlanningTools,
      betaCallablePlanningToolsWithProvidedEvidence,
      betaCallablePlanningToolsNow: [],
      missingEvidenceBeforeBetaToolCall,
    }
  })

  const betaToolCallableWithProvidedEvidenceTools =
    tools.filter((tool) => tool.betaToolCallableWithProvidedEvidence).length
  const capabilitiesWithBetaCallablePlanningTools =
    capabilities.filter((capability) => capability.betaCallablePlanningToolsWithProvidedEvidence.length > 0).length
  const all21BetaCallableWhenEvidenceBundlePasses =
    evidenceBundle.all21BetaEvidenceReady &&
    betaToolCallableWithProvidedEvidenceTools === 21
  const all12CapabilitiesHaveBetaCallableSelectionWhenEvidenceBundlePasses =
    all21BetaCallableWhenEvidenceBundlePasses &&
    capabilitiesWithBetaCallablePlanningTools === 12

  return {
    decision: AI_GRAPHICS_BETA_TOOL_CALL_READINESS_DECISION,
    sourceEvidenceDecision: evidenceBundle.decision,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    betaToolCallableWithProvidedEvidenceTools,
    betaToolCallableNowTools: 0,
    all21BetaCallableWhenEvidenceBundlePasses,
    capabilitiesWithBetaCallablePlanningTools,
    sourceBetaEvidenceBundleAccepted: evidenceBundle.all21BetaEvidenceReady,
    missingEvidence: unique([
      ...evidenceBundle.missingEvidence,
      ...(!evidenceBundle.all21BetaEvidenceReady ? ['all21_beta_evidence_bundle'] : []),
    ]),
    tools,
    capabilities,
    booleans: {
      betaToolCallReadinessContractPrepared: true,
      sourceBetaEvidenceBundleAccepted: evidenceBundle.all21BetaEvidenceReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      rankingSystemConnected: true,
      all21BetaCallableWhenEvidenceBundlePasses,
      all12CapabilitiesHaveBetaCallableSelectionWhenEvidenceBundlePasses,
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
