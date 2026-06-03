import { existsSync, readFileSync } from 'node:fs'
import {
  webSearchRegressionRequiredDocs,
  webSearchRegressionRequiredScenarioIds,
  webSearchRegressionRequiredScripts,
  webSearchRegressionSafetyFlags,
} from './web-search-regression-policy'
import type {
  WebSearchFailClosedPolicyVerification,
  WebSearchPhase49NEvidence,
  WebSearchRegressionArtifact,
  WebSearchRegressionMatrix,
  WebSearchRegressionQaGate,
  WebSearchRegressionQaGateId,
  WebSearchRegressionQaSummary,
} from './web-search-regression-types'

export function buildWebSearchRegressionQaSummary(input: {
  phase49nEvidence: WebSearchPhase49NEvidence
  matrix: WebSearchRegressionMatrix
  failClosedPolicy: WebSearchFailClosedPolicyVerification
  artifacts: WebSearchRegressionArtifact[]
  executionBlockers?: string[]
  executionWarnings?: string[]
}): WebSearchRegressionQaSummary {
  const requiredIds = new Set(webSearchRegressionRequiredScenarioIds)
  const scenariosById = new Map(input.matrix.scenarios.map((scenario) => [scenario.scenarioId, scenario]))
  const allRequiredScenariosPass = [...requiredIds].every((scenarioId) => scenariosById.get(scenarioId)?.passed)
  const phase49nEvidence = input.phase49nEvidence.status === 'verified' && input.phase49nEvidence.gcsVerified
  const providerFailureModes = categoryPasses(input.matrix, ['success_baseline', 'provider_blocking', 'brave_policy', 'searxng_policy'])
  const captureFailureModes = categoryPasses(input.matrix, ['capture_policy'])
  const browserProcessingFailureModes = categoryPasses(input.matrix, ['browser_capture_failure', 'sharp_failure', 'readability_failure'])
  const artifactPrivacyFailures = categoryPasses(input.matrix, ['artifact_privacy'])
  const apiUiGatingRegression = categoryPasses(input.matrix, ['api_ui_gating'])
  const productionBetaBlocking = categoryPasses(input.matrix, ['production_beta'])
  const failClosedIntegrity = input.failClosedPolicy.failClosed
    && input.failClosedPolicy.unsafeScenarioFailures === 0
    && allRequiredScenariosPass
    && input.matrix.scenarios.every((scenario) => scenario.expectedResult === 'pass' || scenario.actualResult === 'fail_closed')
  const artifactPrivacy = input.artifacts.length === 0
    || input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && artifact.contentType === 'private_json')
  const blockedFeatures = requiredScriptsPresent()
    && requiredDocsPresent()
    && Object.values(webSearchRegressionSafetyFlags).every((value) => value === false)

  const gates: WebSearchRegressionQaGate[] = [
    gate('phase49n_evidence', phase49nEvidence, 'Canonical Phase 49N readiness evidence exists and is private.'),
    gate('provider_failure_modes', providerFailureModes, 'Provider regressions reject paid providers, public SearXNG, and unsafe Brave states.'),
    gate('capture_failure_modes', captureFailureModes, 'Capture regressions reject arbitrary, non-allowlisted, unsafe, and redirect-violating URLs.'),
    gate('browser_processing_failure_modes', browserProcessingFailureModes, 'Playwright, Sharp, and Readability failure models fail closed.'),
    gate('artifact_privacy_failures', artifactPrivacyFailures, 'Public artifacts and signed URL source-of-truth requests fail closed.'),
    gate('api_ui_gating_regression', apiUiGatingRegression, 'Internal API/UI validators reject blocked provider and arbitrary capture requests.'),
    gate('production_beta_blocking', productionBetaBlocking, 'Production and external beta flags fail closed.'),
    gate('fail_closed_integrity', failClosedIntegrity, 'No unsafe scenario silently passes or falls back to public/paid providers.'),
    gate('artifact_privacy', artifactPrivacy && blockedFeatures, 'Regression artifacts are private JSON only and blocked feature flags remain false.'),
  ]
  const blockers = [
    ...(input.executionBlockers ?? []),
    ...input.phase49nEvidence.blockers,
    ...input.matrix.blockers,
    ...input.failClosedPolicy.blockers,
    ...(gates.every((entry) => entry.passed) ? [] : gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} failed.`)),
  ]
  const warnings = Array.from(new Set([
    ...(input.executionWarnings ?? []),
    ...input.phase49nEvidence.warnings,
    ...input.matrix.warnings,
    ...input.failClosedPolicy.warnings,
    'Phase 49O does not unlock production, external beta, paid production, broad media, public search, or public artifacts.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function categoryPasses(matrix: WebSearchRegressionMatrix, categories: Array<WebSearchRegressionMatrix['summaryByCategory'][number]['category']>): boolean {
  const categorySet = new Set(categories)
  const matching = matrix.scenarios.filter((scenario) => categorySet.has(scenario.category))
  return matching.length > 0 && matching.every((scenario) => scenario.passed)
}

function gate(gateId: WebSearchRegressionQaGateId, passed: boolean, summary: string): WebSearchRegressionQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return webSearchRegressionRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return webSearchRegressionRequiredDocs.every((doc) => existsSync(doc))
}
