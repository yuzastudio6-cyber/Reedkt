import { existsSync, readFileSync } from 'node:fs'
import { searchProviderReadinessRequiredDocs, searchProviderReadinessRequiredScripts, searchProviderReadinessSafetyFlags } from './search-provider-readiness-policy'
import type {
  SearchProviderArtifactVerificationEntry,
  SearchProviderCostAudit,
  SearchProviderEvidenceChain,
  SearchProviderFailurePolicy,
  SearchProviderReadinessQaGate,
  SearchProviderReadinessQaGateId,
  SearchProviderReadinessQaSummary,
  SearchProviderRegistryAudit,
  SearchProviderScopeManifest,
  SearchProviderSecretAudit,
  SearchProviderServiceAudit,
  SearchProviderStoragePolicyAudit,
} from './search-provider-readiness-types'

export function buildSearchProviderReadinessQaSummary(input: {
  evidenceChain: SearchProviderEvidenceChain
  scopeManifest: SearchProviderScopeManifest
  providerRegistryAudit: SearchProviderRegistryAudit
  serviceAudit: SearchProviderServiceAudit
  secretAudit: SearchProviderSecretAudit
  costAudit: SearchProviderCostAudit
  storagePolicyAudit: SearchProviderStoragePolicyAudit
  failurePolicy: SearchProviderFailurePolicy
  artifactVerification: SearchProviderArtifactVerificationEntry[]
  executionBlockers?: string[]
  executionWarnings?: string[]
}): SearchProviderReadinessQaSummary {
  const phaseEvidenceChain = input.evidenceChain.searchProviderStackStatus === 'ready_for_controlled_internal_testing'
    && input.evidenceChain.phases.length === 13
    && input.evidenceChain.phases.every((phase) => phase.status === 'completed' || phase.status === 'approval_review_complete')
  const searxngDefaultReady = input.scopeManifest.searxngInternalReady
    && input.providerRegistryAudit.searxng.defaultProvider
    && input.providerRegistryAudit.searxng.freeOpenSource
    && input.providerRegistryAudit.searxng.privateServiceRequired
    && input.serviceAudit.exists
    && !input.serviceAudit.publicUnauthenticatedAccess
    && !input.serviceAudit.gpuDetected
  const braveOptionalReady = input.scopeManifest.braveOptionalFallbackReady
    && input.providerRegistryAudit.braveSearch.optionalFallback
    && !input.providerRegistryAudit.braveSearch.enabledByDefault
    && input.providerRegistryAudit.braveSearch.requiresSecret
    && input.providerRegistryAudit.braveSearch.requiresBudget
    && input.secretAudit.secretExists
    && input.secretAudit.enabledVersionPresent
    && input.secretAudit.approvedServiceAccountsHaveAccess
  const hybridConsensusReady = input.scopeManifest.hybridConsensusReady
    && input.evidenceChain.phases.some((phase) => phase.phase === '49M' && phase.status === 'completed' && phase.readiness === 'ready_for_search_provider_readiness_gate')
  const secretSafety = input.secretAudit.checkedWithoutAccessingValue
    && !input.secretAudit.secretValueAccessed
    && !input.secretAudit.secretValuePrinted
    && !input.secretAudit.allUsersPresent
    && !input.secretAudit.allAuthenticatedUsersPresent
    && !input.secretAudit.broadAccessDetected
  const costPolicy = !input.costAudit.braveEnabledByDefault
    && input.costAudit.defaultDailyLimit === 0
    && input.costAudit.defaultMonthlyBudgetUsd === 0
    && input.costAudit.futureMaxQueriesPerRun === 1
    && input.costAudit.futureMaxResults === 5
    && !input.costAudit.unboundedUsageAllowed
  const storagePolicy = !input.storagePolicyAudit.rawBraveResponseStorageAllowed
    && !input.storagePolicyAudit.braveSnippetStorageAllowed
    && !input.storagePolicyAudit.requestHeaderStorageAllowed
    && !input.storagePolicyAudit.apiKeyStorageAllowed
  const providerRegistry = input.providerRegistryAudit.defaultProvider === 'searxng'
    && input.providerRegistryAudit.disabledPaidProviders.every((provider) => !provider.enabled && !provider.requiredForInternalTesting)
  const failurePolicy = input.failurePolicy.failClosed
    && input.failurePolicy.noFallbackToPublicSearxng
    && input.failurePolicy.noAutomaticBraveFallback
    && input.failurePolicy.noFallbackToOtherPaidProviders
    && input.failurePolicy.noFallbackToArbitraryCapture
    && input.failurePolicy.noSignedUrlSourceOfTruth
  const artifactPrivacy = input.artifactVerification.length > 0
    && input.artifactVerification.filter((entry) => entry.required).every((entry) => entry.exists && entry.privateOnly && !entry.blocker)
  const blockedFeatures = requiredScriptsPresent()
    && requiredDocsPresent()
    && !searchProviderReadinessSafetyFlags.liveSearchDuringPhase49N
    && !searchProviderReadinessSafetyFlags.braveApiCallDuringPhase49N
    && !searchProviderReadinessSafetyFlags.browserCaptureDuringPhase49N
    && !searchProviderReadinessSafetyFlags.sharpProcessingDuringPhase49N
    && !searchProviderReadinessSafetyFlags.readabilityExtractionDuringPhase49N
    && !searchProviderReadinessSafetyFlags.publicSearxngInstanceAllowed
    && !searchProviderReadinessSafetyFlags.otherPaidProvidersAllowed
    && !searchProviderReadinessSafetyFlags.paidProviderExpansionAllowed
    && !searchProviderReadinessSafetyFlags.broadCrawlingAllowed
    && !searchProviderReadinessSafetyFlags.arbitraryUrlCaptureAllowed
    && !searchProviderReadinessSafetyFlags.publicArtifactAllowed
    && !searchProviderReadinessSafetyFlags.signedUrlSourceOfTruthAllowed
    && !searchProviderReadinessSafetyFlags.rawBraveResponseStorageAllowed
    && !searchProviderReadinessSafetyFlags.braveSnippetStorageAllowed
    && !searchProviderReadinessSafetyFlags.productionReadyAllowed
    && !searchProviderReadinessSafetyFlags.externalBetaAllowed
    && !searchProviderReadinessSafetyFlags.paidProductionAllowed
    && !searchProviderReadinessSafetyFlags.broadMediaAllowed

  const gates: SearchProviderReadinessQaGate[] = [
    gate('phase_evidence_chain', phaseEvidenceChain, 'Phase 49A through Phase 49M evidence exists and is complete.'),
    gate('searxng_default_ready', searxngDefaultReady, 'Private SearXNG remains the default free/open-source provider and is not publicly invokable.'),
    gate('brave_optional_ready', braveOptionalReady, 'Brave is optional only, disabled by default, and guarded by secret/budget/storage policy.'),
    gate('hybrid_consensus_ready', hybridConsensusReady, 'Phase 49M hybrid consensus evidence passed and marks Phase 49N ready.'),
    gate('secret_safety', secretSafety, 'Brave secret metadata was inspected without reading, printing, or storing the value, and public access is absent.'),
    gate('cost_policy', costPolicy, 'Brave default budget is zero and future use is bounded.'),
    gate('storage_policy', storagePolicy, 'Raw Brave response, snippets, headers, and key material storage remain blocked.'),
    gate('provider_registry', providerRegistry, 'SearXNG/Brave provider states are correct and other paid providers remain disabled.'),
    gate('failure_policy', failurePolicy, 'Fail-closed provider behavior is documented.'),
    gate('artifact_privacy', artifactPrivacy, 'Required evidence artifacts exist under private GCS paths with no signed URLs as source of truth.'),
    gate('blocked_features', blockedFeatures, 'Public SearXNG, paid-provider expansion, broad crawling, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...(input.executionBlockers ?? []),
    ...input.evidenceChain.blockers,
    ...input.providerRegistryAudit.blockers,
    ...input.serviceAudit.blockers,
    ...input.secretAudit.blockers,
    ...input.costAudit.blockers,
    ...input.storagePolicyAudit.blockers,
    ...input.artifactVerification.flatMap((entry) => entry.blocker ? [entry.blocker] : []),
    ...(phaseEvidenceChain ? [] : ['Phase 49A-49M evidence chain is incomplete or blocked.']),
    ...(searxngDefaultReady ? [] : ['SearXNG default readiness failed.']),
    ...(braveOptionalReady ? [] : ['Brave optional fallback readiness failed.']),
    ...(hybridConsensusReady ? [] : ['Phase 49M hybrid consensus readiness failed.']),
    ...(secretSafety ? [] : ['Brave secret safety audit failed.']),
    ...(costPolicy ? [] : ['Brave cost policy audit failed.']),
    ...(storagePolicy ? [] : ['Brave storage-rights policy audit failed.']),
    ...(providerRegistry ? [] : ['Provider registry audit failed.']),
    ...(failurePolicy ? [] : ['Failure policy audit failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy audit failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature flags or docs/scripts are inconsistent.']),
  ]
  const warnings = Array.from(new Set([
    ...(input.executionWarnings ?? []),
    ...input.evidenceChain.warnings,
    ...input.providerRegistryAudit.warnings,
    ...input.serviceAudit.warnings,
    ...input.secretAudit.warnings,
    ...input.costAudit.warnings,
    ...input.storagePolicyAudit.warnings,
    ...input.artifactVerification.flatMap((entry) => entry.warning ? [entry.warning] : []),
    'Phase 49N is readiness closure only; production, external beta, paid production, and broad media remain blocked.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: SearchProviderReadinessQaGateId, passed: boolean, summary: string): SearchProviderReadinessQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return searchProviderReadinessRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return searchProviderReadinessRequiredDocs.every((doc) => existsSync(doc))
}
