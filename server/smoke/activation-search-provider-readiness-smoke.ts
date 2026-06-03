import { buildSearchProviderReadinessCommandPlan, buildSearchProviderReadinessIamPlan, buildSearchProviderReadinessReport } from '../activation/search-provider-readiness'

const report = buildSearchProviderReadinessReport()
const commandPlan = buildSearchProviderReadinessCommandPlan()
const iamPlan = buildSearchProviderReadinessIamPlan()
const requiredPhases = ['49A', '49B', '49C', '49D', '49E', '49F', '49G', '49H', '49I', '49J', '49K', '49L', '49M']
const observedPhases = report.evidenceChain.phases.map((phase) => phase.phase)

assert(report.reportId === 'activation-phase-49n-search-provider-readiness-gate', 'Report id mismatch.')
assert(requiredPhases.every((phase) => observedPhases.includes(phase as typeof report.evidenceChain.phases[number]['phase'])), 'Evidence chain must include Phase 49A through 49M.')
assert(report.scopeManifest.defaultProvider === 'searxng', 'SearXNG must be default provider.')
assert(report.scopeManifest.optionalProviders.includes('brave_search'), 'Brave must be optional provider.')
assert(report.providerRegistryAudit.braveSearch.enabledByDefault === false, 'Brave must be disabled by default.')
assert(report.storagePolicyAudit.rawBraveResponseStorageAllowed === false, 'Raw Brave storage must be blocked.')
assert(report.storagePolicyAudit.braveSnippetStorageAllowed === false, 'Brave snippet storage must be blocked.')
assert(report.providerRegistryAudit.disabledPaidProviders.every((provider) => provider.enabled === false), 'Disabled paid providers must remain disabled.')
assert(report.failurePolicy.failClosed, 'Failure policy must fail closed.')
assert(report.secretAudit.secretValueAccessed === false && report.secretAudit.secretValuePrinted === false, 'Secret audit must not include or access the secret value.')
assert(report.artifactVerification.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-')), 'Artifact prefixes must be private GCS paths.')
assert(commandPlan.some((command) => command.commandId === 'phase49n_execute_metadata_audit' && command.requiresConfirmation), 'Execution command plan must require confirmation.')
assert(commandPlan.every((command) => command.allowedInPhase49N || command.command === null), 'Blocked commands must not include executable command text.')
assert(iamPlan.every((entry) => entry.broadAccess === false && entry.requiredForExecution === false), 'IAM plan must be report-only and non-broad.')
assert(report.phase49OReadiness === 'blocked_until_phase49n_execution_passes' || report.phase49OReadiness === 'ready_for_web_search_regression_failure_mode_suite_or_system_reconciliation', 'Phase49O readiness must be explicit.')
assert(report.safetyFlags.productionReadyAllowed === false, 'Production must remain blocked.')
assert(report.safetyFlags.externalBetaAllowed === false, 'External beta must remain blocked.')
assert(report.safetyFlags.broadMediaAllowed === false, 'Broad media must remain blocked.')

console.log('Phase 49N search provider readiness smoke passed.')

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}
