import { buildProductionReadinessReport } from '../../workers/readiness-validation'
import type { ProductionReadinessReport } from '../../workers/readiness-validation'
import type { ProductionWorkflowMode, ProductionWorkflowReadinessSummary } from './production-workflow-types'

export function buildProductionWorkflowReadinessSummary(input: {
  mode: ProductionWorkflowMode
  report?: ProductionReadinessReport
  revideoRequested?: boolean
  signedUrlDetected?: boolean
  rawPromptDetected?: boolean
  upstreamBlockingQa?: boolean
}): ProductionWorkflowReadinessSummary {
  const report = input.report ?? buildProductionReadinessReport({ mode: 'static_only' })
  const blockerText = report.blockerSummaries.map((blocker) => `${blocker.id} ${blocker.message}`.toLowerCase())
  const modelWeightBlockerCount = blockerText.filter((text) => text.includes('model-weight') || text.includes('model weight')).length
  const manualReviewBlockerCount = blockerText.filter((text) => text.includes('review') || text.includes('license')).length
  const renderReadinessBlocked = blockerText.some((text) => text.includes('ffmpeg') || text.includes('remotion') || text.includes('libass'))
  const hardBlocked = report.overallStatus === 'blocked' || report.blockerSummaries.some((blocker) => blocker.severity === 'hard_blocker')
  const productionReadyAllowed = input.mode === 'production_ready' &&
    !hardBlocked &&
    !input.revideoRequested &&
    !input.signedUrlDetected &&
    !input.rawPromptDetected &&
    !input.upstreamBlockingQa

  return {
    overallStatus: report.overallStatus,
    productionReadyAllowed,
    blockerCount: report.blockerSummaries.length,
    modelWeightBlockerCount,
    manualReviewBlockerCount,
    renderReadinessBlocked,
    revideoRequested: Boolean(input.revideoRequested),
    warnings: [
      ...report.warnings,
      ...(input.revideoRequested ? ['Revideo requested and blocked from production execution.'] : []),
      ...(input.signedUrlDetected ? ['Signed URL detected and blocked as source of truth.'] : []),
      ...(input.rawPromptDetected ? ['Raw prompt execution field detected and blocked.'] : []),
      ...(input.upstreamBlockingQa ? ['Upstream blocking QA prevents production final render/export.'] : []),
    ],
    report,
  }
}

export function assertProductionWorkflowReadiness(input: {
  mode: ProductionWorkflowMode
  report?: ProductionReadinessReport
  revideoRequested?: boolean
  signedUrlDetected?: boolean
  rawPromptDetected?: boolean
  upstreamBlockingQa?: boolean
}): ProductionWorkflowReadinessSummary {
  const summary = buildProductionWorkflowReadinessSummary(input)
  if (input.mode === 'production_ready' && !summary.productionReadyAllowed) {
    return {
      ...summary,
      productionReadyAllowed: false,
    }
  }
  return summary
}
