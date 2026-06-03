import { existsSync, readFileSync } from 'node:fs'
import { buildBraveSearchFixtureNormalizerReport } from '../brave-search-fixture-normalizer'
import {
  braveLiveQaGateIds,
  braveLiveRequiredDocs,
  braveLiveRequiredScripts,
  braveLiveSafetyFlags,
} from './brave-live-api-policy'
import type {
  BraveLiveApiCallSummary,
  BraveLiveArtifact,
  BraveLiveBudgetGuardResult,
  BraveLiveQaGate,
  BraveLiveQaSummary,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
  BraveLiveSourceManifest,
  NormalizedBraveLiveSourceRecord,
} from './brave-live-api-types'

export function buildBraveLiveQaSummary(input: {
  secret: Omit<BraveLiveSecretResolution, 'secretValue'>
  secretMetadata: BraveLiveSecretMetadata
  budget: BraveLiveBudgetGuardResult
  apiCall: BraveLiveApiCallSummary
  normalizedSources: NormalizedBraveLiveSourceRecord[]
  sourceManifest: BraveLiveSourceManifest
  artifacts?: BraveLiveArtifact[]
  publicAccessBlocked?: boolean
  blockers?: string[]
  warnings?: string[]
}): BraveLiveQaSummary {
  const phase49KReport = buildBraveSearchFixtureNormalizerReport()
  const phase49KDocExists = existsSync('docs/activation-phase-49k-brave-search-fixture-normalizer-results.md')
  const phase49KDocText = phase49KDocExists ? readFileSync('docs/activation-phase-49k-brave-search-fixture-normalizer-results.md', 'utf8') : ''
  const phase49KCanonicalHandoff = phase49KDocText.includes('phase49k-20260603T13270')
    && phase49KDocText.includes('Phase 49L may run only')
    && phase49KDocText.includes('snippet storage')
  const phase49KEvidence = phase49KDocExists
    && phase49KCanonicalHandoff
    && phase49KReport.phase49LReadiness === 'ready_for_brave_controlled_live_api_validation'
    && !phase49KReport.braveLiveApiAllowed
    && !phase49KReport.rawBraveStorageAllowed
  const secretTextSafe = trackedTextHasNoSecretValue()
  const secretSafety = input.secret.configured
    && input.secret.secretValuePrinted === false
    && input.secret.secretValueStored === false
    && input.secret.frontendExposure === false
    && input.secretMetadata.secretConfigured
    && input.secretMetadata.versionEnabled
    && input.secretMetadata.approvedServiceAccountsHaveAccess
    && !input.secretMetadata.publicAccessDetected
    && !input.secretMetadata.broadAccessDetected
    && secretTextSafe
  const budgetGuard = input.budget.passed
    && input.budget.estimatedCallCount === 1
    && input.budget.maxResults <= 5
    && input.budget.maxQueriesPerRun <= 1
  const liveCall = input.apiCall.attempted
    && input.apiCall.completed
    && input.apiCall.callCount === 1
    && input.apiCall.resultCount > 0
    && input.apiCall.statusCode !== undefined
    && input.apiCall.statusCode >= 200
    && input.apiCall.statusCode < 300
    && !input.apiCall.requestHeadersStored
    && !input.apiCall.rawResponseStored
    && !input.apiCall.snippetsStored
    && !input.apiCall.disallowedEndpointUsed
  const normalization = input.normalizedSources.length > 0
    && input.normalizedSources.length <= 5
    && input.normalizedSources.every((source) => source.provider === 'brave_search'
      && source.providerMode === 'live_controlled_validation'
      && source.attributionRequired
      && !source.captureAllowed
      && !source.extractionAllowed
      && source.paidProvider
      && source.liveProviderCallUsed
      && !source.rawProviderResponseStored
      && !source.snippetStored)
  const storageRights = !input.sourceManifest.rawProviderResponseStored
    && !input.sourceManifest.snippetStored
    && !input.sourceManifest.storageRightsApproved
    && input.sourceManifest.sourceRecords.every((source) => !source.rawProviderResponseStored && !source.snippetStored)
  const paidProviderScope = input.apiCall.endpoint === 'https://api.search.brave.com/res/v1/web/search'
    && !input.apiCall.disallowedEndpointUsed
    && braveLiveSafetyFlags.otherPaidProvidersAllowed === false
  const artifactPrefixesPrivate = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
  const artifactPrivacy = (input.artifacts?.length ? artifactPrefixesPrivate : true) && (input.publicAccessBlocked ?? true)
  const blockedFeatures = requiredScriptsPresent()
    && requiredDocsPresent()
    && !braveLiveSafetyFlags.browserCaptureAllowed
    && !braveLiveSafetyFlags.readabilityExtractionAllowed
    && !braveLiveSafetyFlags.publicArtifactAllowed
    && !braveLiveSafetyFlags.productionReadyAllowed
    && !braveLiveSafetyFlags.externalBetaAllowed
    && !braveLiveSafetyFlags.paidProductionAllowed
    && !braveLiveSafetyFlags.broadMediaAllowed

  const gates: BraveLiveQaGate[] = [
    gate('phase49k_evidence', phase49KEvidence, 'Phase 49K fixture normalizer evidence exists and marks Phase 49L ready only for controlled live Brave validation.'),
    gate('secret_safety', secretSafety, 'Brave key is resolved backend-side only; no value is logged, stored, committed, exposed, or printed.'),
    gate('budget_guard', budgetGuard, 'Budget guard enforces one query, max five results, daily/monthly budget, and no pagination or extra snippets.'),
    gate('brave_live_api_call', liveCall, 'Exactly one Brave Search web endpoint call completed; request headers and raw response are not stored.'),
    gate('result_normalization', normalization, 'Live Brave results normalize into minimal ReeditPro source records with capture/extraction blocked.'),
    gate('storage_rights_enforcement', storageRights, 'Raw Brave response and snippets are not persisted; storage rights remain unapproved.'),
    gate('paid_provider_scope', paidProviderScope, 'Only Brave Search is used; other paid providers remain blocked.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts use private staging GCS paths with no signed URLs as source of truth.'),
    gate('blocked_features', blockedFeatures, 'Browser capture, extraction, production, external beta, paid production, and broad media remain blocked.'),
  ]
  const blockers = [
    ...(input.blockers ?? []),
    ...(phase49KEvidence ? [] : ['Phase 49K fixture normalizer evidence is missing or inconsistent.']),
    ...(secretSafety ? [] : ['Brave Search secret safety gate failed.']),
    ...(budgetGuard ? [] : ['Brave Search budget guard failed.']),
    ...(liveCall ? [] : ['Brave Search live API call did not complete successfully.']),
    ...(normalization ? [] : ['Brave live result normalization failed.']),
    ...(storageRights ? [] : ['Brave storage-rights enforcement failed.']),
    ...(paidProviderScope ? [] : ['Paid provider scope is inconsistent.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
    ...(requiredScriptsPresent() ? [] : ['Required Phase 49L package scripts are missing.']),
    ...(requiredDocsPresent() ? [] : ['Required Phase 49L docs are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set([
      ...(input.warnings ?? []),
      'Phase 49L validates only the Brave Search web endpoint as an optional paid fallback/confidence provider.',
      'SearXNG remains the default provider.',
      'Phase 49M may proceed only as SearXNG + Brave hybrid consensus E2E, not production or external beta.',
    ])),
  }
}

function gate(gateId: typeof braveLiveQaGateIds[number], passed: boolean, summary: string): BraveLiveQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return braveLiveRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return braveLiveRequiredDocs.every((doc) => existsSync(doc))
}

function trackedTextHasNoSecretValue(): boolean {
  const files = [
    'server/activation/brave-live-api-validation/brave-live-secret-resolver.ts',
    'docs/activation-brave-live-api-validation-policy.md',
    'docs/activation-brave-live-api-validation-runbook.md',
    'docs/activation-phase-49l-brave-live-api-validation-results.md',
  ]
  return files.every((file) => {
    if (!existsSync(file)) return true
    const text = readFileSync(file, 'utf8')
    return !/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(text) && !/X-Subscription-Token:\s*(?!<|redacted)[A-Za-z0-9_-]{12,}/.test(text)
  })
}
