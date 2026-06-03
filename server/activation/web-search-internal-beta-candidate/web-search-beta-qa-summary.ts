import { existsSync, readFileSync } from 'node:fs'
import {
  webSearchInternalBetaRequiredDocs,
  webSearchInternalBetaRequiredScripts,
  webSearchInternalBetaSafetyFlags,
} from './web-search-internal-beta-policy'
import type {
  WebSearchInternalBetaArtifact,
  WebSearchInternalBetaArtifactAudit,
  WebSearchInternalBetaEvidenceChain,
  WebSearchInternalBetaFailurePolicy,
  WebSearchInternalBetaProviderAudit,
  WebSearchInternalBetaQaGate,
  WebSearchInternalBetaQaGateId,
  WebSearchInternalBetaQaSummary,
  WebSearchInternalBetaRegressionAudit,
  WebSearchInternalBetaScopeManifest,
  WebSearchInternalBetaUiApiAudit,
} from './web-search-internal-beta-types'

export function buildWebSearchInternalBetaQaSummary(input: {
  evidenceChain: WebSearchInternalBetaEvidenceChain
  scopeManifest: WebSearchInternalBetaScopeManifest
  providerAudit: WebSearchInternalBetaProviderAudit
  uiApiAudit: WebSearchInternalBetaUiApiAudit
  regressionAudit: WebSearchInternalBetaRegressionAudit
  artifactAudit: WebSearchInternalBetaArtifactAudit
  failurePolicy: WebSearchInternalBetaFailurePolicy
  uploadedArtifacts?: WebSearchInternalBetaArtifact[]
  executionBlockers?: string[]
  executionWarnings?: string[]
}): WebSearchInternalBetaQaSummary {
  const phaseEvidenceChain = input.evidenceChain.evidenceStatus === 'ready_for_internal_beta_candidate_gate'
    && input.evidenceChain.phases.length === 15
    && input.evidenceChain.phases.every((phase) => phase.status === 'completed' || phase.status === 'approval_review_complete')
  const providerReadiness = input.providerAudit.searxngDefaultReady
    && input.providerAudit.braveOptionalReady
    && input.providerAudit.hybridConsensusReady
    && input.providerAudit.disabledProviderIds.length >= 6
  const uiApiGating = input.uiApiAudit.phase49IEvidenceReady
    && input.uiApiAudit.serverRoutesMounted
    && input.uiApiAudit.apiRouteMetadataPresent
    && input.uiApiAudit.requestValidatorPresent
    && input.uiApiAudit.chatNativeGateCardPresent
    && input.uiApiAudit.runControlledGateOnly
    && !input.uiApiAudit.frontendSecretExposureDetected
    && !input.uiApiAudit.frontendHeavyCaptureDetected
  const regressionSuite = input.regressionAudit.canonicalEvidenceReady
    && input.regressionAudit.scenarioCount === 26
    && input.regressionAudit.passedCount === 26
    && input.regressionAudit.failedCount === 0
    && input.regressionAudit.failClosedVerified
    && input.regressionAudit.apiUiRegressionPassed
    && input.regressionAudit.productionBetaBlockingPassed
  const secretSafety = input.providerAudit.secretAudit.checkedWithoutAccessingValue
    && !input.providerAudit.secretAudit.secretValueAccessed
    && !input.providerAudit.secretAudit.secretValuePrinted
    && !input.providerAudit.secretAudit.allUsersPresent
    && !input.providerAudit.secretAudit.allAuthenticatedUsersPresent
    && !input.providerAudit.secretAudit.broadAccessDetected
  const costStoragePolicy = !input.providerAudit.costAudit.braveEnabledByDefault
    && input.providerAudit.costAudit.defaultDailyLimit === 0
    && input.providerAudit.costAudit.defaultMonthlyBudgetUsd === 0
    && !input.providerAudit.costAudit.unboundedUsageAllowed
    && !input.providerAudit.storagePolicyAudit.rawBraveResponseStorageAllowed
    && !input.providerAudit.storagePolicyAudit.braveSnippetStorageAllowed
    && !input.providerAudit.storagePolicyAudit.requestHeaderStorageAllowed
    && !input.providerAudit.storagePolicyAudit.apiKeyStorageAllowed
  const artifactPrivacy = input.artifactAudit.privateGcsOnly
    && !input.artifactAudit.signedUrlSourceOfTruthDetected
    && !input.artifactAudit.publicArtifactDetected
    && input.artifactAudit.entries.filter((entry) => entry.required).every((entry) => entry.exists && entry.privateOnly && !entry.blocker)
    && (input.uploadedArtifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && artifact.contentType === 'private_json')
  const failurePolicy = input.failurePolicy.failClosed
    && input.failurePolicy.noLiveSearchFallback
    && input.failurePolicy.noPublicSearxngFallback
    && input.failurePolicy.noPaidProviderExpansionFallback
    && input.failurePolicy.noArbitraryCaptureFallback
    && input.failurePolicy.noBrowserProviderFallback
    && input.failurePolicy.noPublicArtifactFallback
    && input.failurePolicy.noProductionBetaUnlock
  const readinessDocsConsistency = requiredScriptsPresent() && requiredDocsPresent()
  const blockedFeatures = Object.values(webSearchInternalBetaSafetyFlags).every((value) => value === false)
    && !input.scopeManifest.providerPolicy.publicSearxngAllowed
    && !input.scopeManifest.providerPolicy.braveEnabledByDefault
    && !input.scopeManifest.capturePolicy.arbitraryUrlCaptureAllowed
    && !input.scopeManifest.artifactPolicy.publicArtifactsAllowed
    && !input.scopeManifest.artifactPolicy.rawBraveResponseStorageAllowed
    && !input.scopeManifest.artifactPolicy.braveSnippetStorageAllowed

  const gates: WebSearchInternalBetaQaGate[] = [
    gate('phase_evidence_chain', phaseEvidenceChain, 'Phase 49A through Phase 49O evidence is complete and internally consistent.'),
    gate('provider_readiness', providerReadiness, 'Private SearXNG is default-ready, Brave is optional and gated, and hybrid consensus passed.'),
    gate('ui_api_gating', uiApiGating, 'Internal UI/API routes, validators, route metadata, and chat-native gate remain scoped and safe.'),
    gate('regression_suite', regressionSuite, 'Phase 49O deterministic regression suite passed all mandatory failure modes.'),
    gate('secret_safety', secretSafety, 'Brave secret metadata is audited without accessing, printing, storing, or exposing the value.'),
    gate('cost_storage_policy', costStoragePolicy, 'Brave budget defaults are zero and raw/snippet/header/key storage remains blocked.'),
    gate('artifact_privacy', artifactPrivacy, 'Evidence and Phase 49P outputs use private GCS JSON artifacts only.'),
    gate('failure_policy', failurePolicy, 'Final web search/capture failure policy fails closed.'),
    gate('readiness_docs_consistency', readinessDocsConsistency, 'Phase 49P scripts and docs are present.'),
    gate('blocked_features', blockedFeatures, 'Production, external beta, broad media, public search, arbitrary capture, and raw Brave storage remain blocked.'),
  ]
  const blockers = [
    ...(input.executionBlockers ?? []),
    ...input.evidenceChain.blockers,
    ...input.providerAudit.blockers,
    ...input.uiApiAudit.blockers,
    ...input.regressionAudit.blockers,
    ...input.artifactAudit.blockers,
    ...input.failurePolicy.blockers,
    ...(gates.every((entry) => entry.passed) ? [] : gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} failed.`)),
  ]
  const warnings = Array.from(new Set([
    ...(input.executionWarnings ?? []),
    ...input.evidenceChain.warnings,
    ...input.providerAudit.warnings,
    ...input.uiApiAudit.warnings,
    ...input.regressionAudit.warnings,
    ...input.artifactAudit.warnings,
    ...input.failurePolicy.warnings,
    'Phase 49P does not unlock production, external beta, paid production, broad media, public SearXNG, broad crawling, arbitrary URL capture, or raw Brave response/snippet storage.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: WebSearchInternalBetaQaGateId, passed: boolean, summary: string): WebSearchInternalBetaQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return webSearchInternalBetaRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return webSearchInternalBetaRequiredDocs.every((doc) => existsSync(doc))
}
