import {
  buildFailClosedPolicyVerification,
  buildWebSearchRegressionMatrix,
} from '../web-search-regression-suite'
import type { WebSearchInternalBetaEvidenceChain, WebSearchInternalBetaRegressionAudit } from './web-search-internal-beta-types'

export function buildWebSearchBetaRegressionAudit(input: { evidenceChain: WebSearchInternalBetaEvidenceChain }): WebSearchInternalBetaRegressionAudit {
  const matrix = buildWebSearchRegressionMatrix()
  const failClosed = buildFailClosedPolicyVerification(matrix)
  const phase49OReady = input.evidenceChain.phases.some((phase) => phase.phase === '49O' && phase.status === 'completed' && phase.runId === 'phase49o-20260603T20311')
  const apiUiRegressionPassed = matrix.scenarios.filter((scenario) => scenario.category === 'api_ui_gating').every((scenario) => scenario.passed)
  const productionBetaBlockingPassed = matrix.scenarios.filter((scenario) => scenario.category === 'production_beta').every((scenario) => scenario.passed)
  const blockers = [
    phase49OReady ? '' : 'Canonical Phase 49O evidence is not completed.',
    matrix.scenarioCount === 26 && matrix.passedCount === 26 ? '' : 'Phase 49O regression scenario matrix is not fully passing.',
    failClosed.unsafeScenarioFailures === 0 ? '' : `${failClosed.unsafeScenarioFailures} unsafe regression scenarios did not fail closed.`,
    apiUiRegressionPassed ? '' : 'API/UI regression scenarios are not fully passing.',
    productionBetaBlockingPassed ? '' : 'Production/beta regression scenarios are not fully passing.',
  ].filter(Boolean)
  return {
    phase49ORunId: 'phase49o-20260603T20311',
    canonicalEvidenceReady: phase49OReady,
    scenarioCount: matrix.scenarioCount,
    passedCount: matrix.passedCount,
    failedCount: matrix.failedCount,
    failClosedVerified: failClosed.unsafeScenarioFailures === 0,
    apiUiRegressionPassed,
    productionBetaBlockingPassed,
    blockers,
    warnings: ['Phase 49P consumes the deterministic Phase 49O matrix; it does not rerun live search, capture, Sharp, or Readability work.'],
  }
}
