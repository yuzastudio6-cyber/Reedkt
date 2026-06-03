import { buildApiGatingRegressionScenarios } from './api-gating-regression'
import { buildArtifactPrivacyScenarios } from './artifact-privacy-scenarios'
import { buildCaptureFailureScenarios } from './capture-failure-scenarios'
import { buildExtractionFailureScenarios } from './extraction-failure-scenarios'
import { buildProviderFailureScenarios } from './provider-failure-scenarios'
import { webSearchRegressionRequiredScenarioIds } from './web-search-regression-policy'
import type { WebSearchRegressionMatrix, WebSearchRegressionScenario, WebSearchRegressionScenarioCategory } from './web-search-regression-types'

export function buildWebSearchRegressionMatrix(): WebSearchRegressionMatrix {
  const scenarios = [
    ...buildProviderFailureScenarios(),
    ...buildCaptureFailureScenarios(),
    ...buildExtractionFailureScenarios(),
    ...buildArtifactPrivacyScenarios(),
    ...buildApiGatingRegressionScenarios(),
  ]
  const observed = new Set(scenarios.map((scenario) => scenario.scenarioId))
  const missing = webSearchRegressionRequiredScenarioIds.filter((scenarioId) => !observed.has(scenarioId))
  const duplicates = scenarios
    .map((scenario) => scenario.scenarioId)
    .filter((scenarioId, index, list) => list.indexOf(scenarioId) !== index)
  const categories = Array.from(new Set(scenarios.map((scenario) => scenario.category)))
  const summaryByCategory = categories.map((category) => summarizeCategory(category, scenarios))
  const blockers = [
    ...missing.map((scenarioId) => `Missing required scenario: ${scenarioId}`),
    ...duplicates.map((scenarioId) => `Duplicate scenario id: ${scenarioId}`),
    ...scenarios.filter((scenario) => !scenario.passed).map((scenario) => `Scenario failed: ${scenario.scenarioId}`),
  ]
  return {
    generatedAt: new Date().toISOString(),
    scenarioCount: scenarios.length,
    passedCount: scenarios.filter((scenario) => scenario.passed).length,
    failedCount: scenarios.filter((scenario) => !scenario.passed).length,
    scenarios,
    summaryByCategory,
    blockers,
    warnings: [
      'Phase 49O scenarios are deterministic policy regressions; no live search, Brave API call, browser launch, Sharp run, or Readability extraction occurred.',
    ],
  }
}

export function selectScenariosByCategory(matrix: WebSearchRegressionMatrix, categories: WebSearchRegressionScenarioCategory[]): WebSearchRegressionScenario[] {
  const allowed = new Set(categories)
  return matrix.scenarios.filter((scenario) => allowed.has(scenario.category))
}

function summarizeCategory(category: WebSearchRegressionScenarioCategory, scenarios: WebSearchRegressionScenario[]): WebSearchRegressionMatrix['summaryByCategory'][number] {
  const matching = scenarios.filter((scenario) => scenario.category === category)
  return {
    category,
    scenarioCount: matching.length,
    passedCount: matching.filter((scenario) => scenario.passed).length,
    failedCount: matching.filter((scenario) => !scenario.passed).length,
  }
}
