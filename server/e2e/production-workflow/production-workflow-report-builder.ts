import { buildProductionWorkflowFallbackSummary } from './production-workflow-fallback-summary-builder'
import { buildProductionWorkflowQASummary } from './production-workflow-qa-summary-builder'
import { buildProductionWorkflowReadinessSummary } from './production-workflow-readiness-gate'
import type { ProductionWorkflowArtifactStore } from './production-workflow-artifact-store'
import type { ProductionWorkflowScenario } from './production-workflow-scenario-types'
import type { ProductionWorkflowMode, ProductionWorkflowReport, ProductionWorkflowStageResult } from './production-workflow-types'
import { workflowNow } from './production-workflow-types'

export function buildProductionWorkflowReport(input: {
  scenario: ProductionWorkflowScenario
  mode: ProductionWorkflowMode
  startedAt: string
  artifactStore: ProductionWorkflowArtifactStore
  stageResults: ProductionWorkflowStageResult[]
  revideoRequested?: boolean
  signedUrlDetected?: boolean
  rawPromptDetected?: boolean
}): ProductionWorkflowReport {
  const completedAt = workflowNow()
  const allQaResults = input.stageResults.flatMap((stage) => stage.qaResults)
  const finalExportArtifact = input.artifactStore.getArtifactsByType('final_export')[0]
  const artifactSummary = input.artifactStore.buildSummary(input.scenario.requiredArtifacts)
  const qaSummary = buildProductionWorkflowQASummary({ qaResults: allQaResults, finalExportArtifact })
  const fallbackSummary = buildProductionWorkflowFallbackSummary(input.stageResults)
  const upstreamBlockingQa = allQaResults.some((gate) => gate.blocking || gate.status === 'blocked' || gate.status === 'failed')
  const readinessSummary = buildProductionWorkflowReadinessSummary({
    mode: input.mode,
    revideoRequested: input.revideoRequested,
    signedUrlDetected: input.signedUrlDetected,
    rawPromptDetected: input.rawPromptDetected,
    upstreamBlockingQa,
  })
  const blockers = [
    ...input.stageResults.flatMap((stage) => stage.blockers),
    ...artifactSummary.missingRequiredArtifactTypes.map((artifactType) => `Missing required artifact type: ${artifactType}`),
    ...(fallbackSummary.qaBypassDetected ? ['Fallback decision attempted to bypass blocking QA.'] : []),
    ...(input.mode === 'production_ready' && !readinessSummary.productionReadyAllowed ? ['Production-ready workflow blocked by readiness/model/manual-review gates.'] : []),
  ]
  const warnings = [
    ...input.scenario.expectedWarnings,
    ...input.stageResults.flatMap((stage) => stage.warnings),
    ...readinessSummary.warnings,
  ]
  const status = blockers.length > 0 || input.stageResults.some((stage) => stage.status === 'blocked')
    ? 'blocked'
    : warnings.length > 0 || input.stageResults.some((stage) => stage.status === 'warning')
      ? 'warning'
      : 'passed'

  return {
    reportId: `production-e2e-${input.scenario.scenarioId}-${completedAt}`,
    scenarioId: input.scenario.scenarioId,
    mode: input.mode,
    status,
    startedAt: input.startedAt,
    completedAt,
    stageResults: input.stageResults,
    artifactSummary,
    qaSummary,
    fallbackSummary,
    readinessSummary,
    finalExportArtifact,
    blockers,
    warnings,
    nextActions: nextActions(input.mode, blockers.length, qaSummary.finalDeliveryAllowed),
    productionReadyAllowed: readinessSummary.productionReadyAllowed,
    finalDeliveryAllowed: qaSummary.finalDeliveryAllowed,
  }
}

function nextActions(mode: ProductionWorkflowMode, blockerCount: number, finalDeliveryAllowed: boolean): string[] {
  if (mode === 'production_ready' && blockerCount > 0) return ['Resolve readiness/model/manual-review blockers before enabling production E2E execution.']
  if (!finalDeliveryAllowed) return ['Keep final delivery blocked until private final_export exists and all blocking QA gates pass.']
  return ['Use the full E2E report as a fixture for M17 hardening and beta readiness.']
}
