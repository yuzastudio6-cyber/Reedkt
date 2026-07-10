import { productionWorkflowScenarios } from '../e2e/production-workflow'
import type { BetaScenarioReadiness } from './beta-readiness-types'

export interface BuildBetaScenarioReadinessMatrixOptions {
  productionReady?: boolean
}

export function buildBetaScenarioReadinessMatrix(
  options: BuildBetaScenarioReadinessMatrixOptions = {},
): BetaScenarioReadiness[] {
  const productionReady = options.productionReady === true
  return productionWorkflowScenarios.map((scenario) => ({
    scenarioId: scenario.scenarioId,
    dryRunReady: true,
    localDevFixtureReady: scenario.allowedLocalDevTools.length > 0,
    productionReady,
    blockers: productionReady ? scenario.expectedBlockers : [
      ...scenario.expectedBlockers,
      'Production readiness, deployment, model/license, security, and cost approvals are not complete.',
    ],
    nextActions: [
      'Keep validating this scenario in dry-run/static mode.',
      'Use generated local-dev fixtures only when explicitly enabled and tools are available.',
      'Do not process real user media until external beta and real-user-media gates pass.',
    ],
  }))
}
