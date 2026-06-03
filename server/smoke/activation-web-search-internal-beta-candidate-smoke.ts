import {
  buildWebSearchInternalBetaCommandPlan,
  buildWebSearchInternalBetaIamPlan,
  buildWebSearchInternalBetaReport,
} from '../activation/web-search-internal-beta-candidate'

const report = buildWebSearchInternalBetaReport()
const commandPlan = buildWebSearchInternalBetaCommandPlan()
const iamPlan = buildWebSearchInternalBetaIamPlan()
const requiredPhases = ['49A', '49B', '49C', '49D', '49E', '49F', '49G', '49H', '49I', '49J', '49K', '49L', '49M', '49N', '49O']
const observedPhases = report.evidenceChain.phases.map((phase) => phase.phase)

assert(report.reportId === 'activation-phase-49p-web-search-internal-beta-candidate', 'Report id mismatch.')
assert(requiredPhases.every((phase) => observedPhases.includes(phase as typeof report.evidenceChain.phases[number]['phase'])), 'Evidence chain must include Phase 49A through 49O.')
assert(report.scopeManifest.scope === 'controlled_internal_beta_candidate_only', 'Scope must be controlled internal beta candidate only.')
assert(report.scopeManifest.defaultProvider === 'searxng', 'SearXNG must remain default.')
assert(report.scopeManifest.optionalProvider === 'brave_search', 'Brave must remain optional only.')
assert(report.scopeManifest.providerPolicy.publicSearxngAllowed === false, 'Public SearXNG must remain blocked.')
assert(report.scopeManifest.providerPolicy.braveEnabledByDefault === false, 'Brave must remain disabled by default.')
assert(report.scopeManifest.capturePolicy.arbitraryUrlCaptureAllowed === false, 'Arbitrary URL capture must remain blocked.')
assert(report.scopeManifest.artifactPolicy.rawBraveResponseStorageAllowed === false, 'Raw Brave response storage must remain blocked.')
assert(report.scopeManifest.artifactPolicy.braveSnippetStorageAllowed === false, 'Brave snippet storage must remain blocked.')
assert(report.uiApiAudit.frontendSecretExposureDetected === false, 'Frontend secret exposure must be false.')
assert(report.uiApiAudit.frontendHeavyCaptureDetected === false, 'Frontend heavy capture must be false.')
assert(report.regressionAudit.scenarioCount === 26, 'Phase 49O scenario count must be 26.')
assert(report.failurePolicy.failClosed, 'Failure policy must fail closed.')
assert(commandPlan.some((command) => command.commandId === 'phase49p_execute_evidence_audit' && command.requiresConfirmation), 'Execution command must require confirmation.')
assert(commandPlan.every((command) => command.allowedInPhase49P || command.command === null), 'Blocked commands must not include executable command text.')
assert(iamPlan.every((entry) => entry.broadAccess === false && entry.requiredForExecution === false), 'IAM plan must be report-only and non-broad.')
assert(report.phase50AReadiness === 'blocked_until_phase49p_execution_passes' || report.phase50AReadiness === 'ready_for_map_geospatial_stack_approval_and_architecture', 'Phase50A readiness must be explicit.')
assert(report.safetyFlags.productionReadyAllowed === false, 'Production must remain blocked.')
assert(report.safetyFlags.externalBetaAllowed === false, 'External beta must remain blocked.')
assert(report.safetyFlags.broadMediaAllowed === false, 'Broad media must remain blocked.')

console.log('Phase 49P web search internal beta candidate smoke passed.')

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}
