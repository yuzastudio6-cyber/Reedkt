import {
  buildWebSearchRegressionCommandPlan,
  buildWebSearchRegressionIamPlan,
  buildWebSearchRegressionReport,
  webSearchRegressionRequiredScenarioIds,
} from '../activation/web-search-regression-suite'

const report = buildWebSearchRegressionReport()
const commandPlan = buildWebSearchRegressionCommandPlan()
const iamPlan = buildWebSearchRegressionIamPlan()
const scenarioIds = new Set(report.matrix.scenarios.map((scenario) => scenario.scenarioId))

assert(report.reportId === 'activation-phase-49o-web-search-regression-suite', 'Report id mismatch.')
assert(webSearchRegressionRequiredScenarioIds.every((scenarioId) => scenarioIds.has(scenarioId)), 'Scenario matrix must include every required scenario.')
assert(report.matrix.scenarioCount >= 26, 'Scenario matrix must include at least 26 scenarios.')
assert(report.matrix.scenarios.every((scenario) => typeof scenario.failureMode === 'string' && typeof scenario.safetyImpact === 'string'), 'Every scenario must include failure mode and safety impact.')
assert(report.matrix.scenarios.filter((scenario) => scenario.category === 'provider_blocking').length >= 4, 'Paid provider rejection scenarios must exist.')
assert(scenarioIds.has('public_searxng_instance_rejected'), 'Public SearXNG rejection scenario must exist.')
assert(scenarioIds.has('arbitrary_url_capture_rejected'), 'Arbitrary URL capture rejection scenario must exist.')
assert(scenarioIds.has('brave_raw_storage_rejected') && scenarioIds.has('brave_snippet_storage_rejected'), 'Brave raw/snippet storage rejection scenarios must exist.')
assert(scenarioIds.has('playwright_timeout_records_failure') && scenarioIds.has('sharp_invalid_image_failure') && scenarioIds.has('readability_empty_article_failure'), 'Browser/Sharp/Readability failure scenarios must exist.')
assert(scenarioIds.has('production_ready_flag_rejected') && scenarioIds.has('external_beta_flag_rejected'), 'Production/beta rejection scenarios must exist.')
assert(report.qa.gates.length === 9, 'QA gates must be present.')
assert(commandPlan.some((command) => command.commandId === 'phase49o_execute_regression_suite' && command.requiresConfirmation), 'Execution command must require confirmation.')
assert(commandPlan.every((command) => command.allowedInPhase49O || command.command === null), 'Blocked command entries must not include executable commands.')
assert(iamPlan.every((entry) => entry.broadAccess === false && entry.requiredForExecution === false), 'IAM plan must be report-only and non-broad.')
assert(report.phase49PReadiness === 'blocked_until_phase49o_execution_passes' || report.phase49PReadiness === 'ready_for_controlled_internal_beta_candidate_gate_or_system_reconciliation', 'Phase49P readiness must be explicit.')
assert(report.safetyFlags.productionReadyAllowed === false, 'Production must remain blocked.')
assert(report.safetyFlags.externalBetaAllowed === false, 'External beta must remain blocked.')
assert(report.safetyFlags.broadMediaAllowed === false, 'Broad media must remain blocked.')

console.log('Phase 49O web search regression suite smoke passed.')

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}
