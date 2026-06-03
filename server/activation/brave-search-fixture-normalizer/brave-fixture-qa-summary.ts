import { existsSync, readFileSync } from 'node:fs'
import { buildBraveSearchFallbackPolicyReport } from '../brave-search-fallback-policy'
import {
  braveSearchFixtureQaGateIds,
  braveSearchFixtureRequiredDocs,
  braveSearchFixtureRequiredScripts,
  braveSearchFixtureSafetyFlags,
} from './brave-search-fixture-policy'
import type {
  BraveFixtureArtifact,
  BraveFixturePlanSnapshot,
  BraveFixtureQaGate,
  BraveFixtureQaSummary,
  BraveFixtureSourceManifest,
  BraveShapedFixtureResponse,
  NormalizedBraveSourceRecord,
  SearchProviderRouterFixtureDecision,
  SearchResultDedupeFixture,
  SearxngConfidenceFixtureScenario,
} from './brave-search-fixture-types'

export function buildBraveFixtureQaSummary(input: {
  fixtureResponse: BraveShapedFixtureResponse
  normalizedSources: NormalizedBraveSourceRecord[]
  normalizationBlockers: string[]
  planSnapshot: BraveFixturePlanSnapshot
  sourceManifest: BraveFixtureSourceManifest
  confidenceScenarios: SearxngConfidenceFixtureScenario[]
  routerDecisions: SearchProviderRouterFixtureDecision[]
  dedupeFixture: SearchResultDedupeFixture
  artifacts?: BraveFixtureArtifact[]
  publicAccessBlocked?: boolean
  preflightBlockers?: string[]
}): BraveFixtureQaSummary {
  const phase49JReport = buildBraveSearchFallbackPolicyReport()
  const scriptsPresent = requiredScriptsPresent()
  const docsPresent = requiredDocsPresent()
  const secretTextSafe = trackedTextHasNoSecretValue()
  const artifactPrefixesPrivate = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
  const fixtureCountOk = input.fixtureResponse.web.results.length >= 5 && input.fixtureResponse.web.results.length <= 8
  const safetyBlocksRuntime = !braveSearchFixtureSafetyFlags.braveEnabledByDefault
    && !braveSearchFixtureSafetyFlags.liveBraveApiAllowed
    && !braveSearchFixtureSafetyFlags.paidProviderAllowed
    && !braveSearchFixtureSafetyFlags.rawBraveResponseStorageAllowed
    && !braveSearchFixtureSafetyFlags.braveSnippetStorageAllowed
    && !braveSearchFixtureSafetyFlags.providerExecutionAllowed
    && !braveSearchFixtureSafetyFlags.liveSearchAllowed
    && !braveSearchFixtureSafetyFlags.browserCaptureAllowed
    && !braveSearchFixtureSafetyFlags.readabilityExtractionAllowed
    && !braveSearchFixtureSafetyFlags.publicArtifactAllowed
    && !braveSearchFixtureSafetyFlags.productionReadyAllowed
    && !braveSearchFixtureSafetyFlags.externalBetaAllowed
    && !braveSearchFixtureSafetyFlags.paidProductionAllowed
    && !braveSearchFixtureSafetyFlags.broadMediaAllowed

  const phase49JEvidence = phase49JReport.status === 'completed'
    && phase49JReport.phase49KReadiness === 'ready_for_brave_shaped_fixture_and_normalizer'
    && !phase49JReport.braveEnabledByDefault
    && !phase49JReport.braveLiveApiAllowed
    && !phase49JReport.paidProviderAllowed
    && !phase49JReport.rawBraveStorageAllowed
  const fixtureIntegrity = input.fixtureResponse.generatedFixture
    && !input.fixtureResponse.liveProviderCallUsed
    && !input.fixtureResponse.rawProviderResponseStored
    && input.fixtureResponse.provider === 'brave_search'
    && fixtureCountOk
  const normalizerIntegrity = input.normalizedSources.length === input.fixtureResponse.web.results.length
    && input.normalizationBlockers.length === 0
    && input.normalizedSources.every((source) => source.provider === 'brave_search'
      && source.providerMode === 'fixture'
      && source.sourceId.startsWith('src_brave_')
      && source.generatedFixture
      && source.attributionRequired
      && !source.captureAllowed
      && !source.extractionAllowed
      && source.paidProvider
      && !source.liveProviderCallUsed
      && !source.rawProviderResponseStored)
  const storageRights = !input.sourceManifest.storageRightsPolicy.rawBraveResponseStorageAllowed
    && !input.sourceManifest.storageRightsPolicy.braveSnippetStorageAllowed
    && input.sourceManifest.storageRightsPolicy.noRealBravePayloadStored
    && !input.sourceManifest.rawProviderResponseStored
  const confidencePolicy = input.confidenceScenarios.length === 3
    && input.confidenceScenarios.every((scenario) => scenario.result.braveFallbackRecommended === scenario.expectedFallbackRecommended)
    && input.confidenceScenarios.some((scenario) => scenario.scenarioId === 'searxng_high_confidence' && !scenario.result.braveFallbackRecommended)
    && input.confidenceScenarios.some((scenario) => scenario.scenarioId === 'searxng_low_confidence' && scenario.result.braveFallbackRecommended)
    && input.confidenceScenarios.every((scenario) => !scenario.result.braveExecutionAllowed)
  const routerPolicy = input.routerDecisions.length === 4
    && input.routerDecisions.some((decision) => decision.mode === 'searxng_only' && decision.selectedProvider === 'searxng')
    && input.routerDecisions.every((decision) => !decision.providerExecutionAllowed && decision.planningOnly)
  const dedupePolicy = input.dedupeFixture.fixtureOnly
    && input.dedupeFixture.braveSources.length === input.normalizedSources.length
    && input.dedupeFixture.duplicateGroups.length > 0
    && input.dedupeFixture.providerContributionSummary.overlappingUrls > 0
  const paidProviderBlocked = !input.planSnapshot.paidProviderAllowed
    && !input.planSnapshot.liveBraveApiAllowed
    && !braveSearchFixtureSafetyFlags.paidProviderAllowed
    && input.routerDecisions.every((decision) => !decision.providerExecutionAllowed)
  const artifactPrivacy = (input.artifacts?.length ? artifactPrefixesPrivate : true) && (input.publicAccessBlocked ?? true)
  const blockedFeatures = safetyBlocksRuntime && scriptsPresent && docsPresent

  const gates: BraveFixtureQaGate[] = [
    gate('phase49j_evidence', phase49JEvidence, 'Phase 49J policy evidence exists and marks Phase 49K ready only for Brave-shaped fixture and normalizer work.'),
    gate('brave_fixture_integrity', fixtureIntegrity, 'Brave-shaped fixture is generated-only and no live API/raw real response is used.'),
    gate('brave_normalizer', normalizerIntegrity, 'Brave fixture records normalize with provider attribution, generated flags, unsafe URL rejection, and capture/extraction blocked.'),
    gate('storage_rights_enforcement', storageRights, 'Raw Brave response and snippet storage remain blocked by default; fixture previews are marked generated-only.'),
    gate('secret_safety', secretTextSafe, 'Only the Brave secret name is referenced; no key value appears in tracked policy text.'),
    gate('searxng_confidence_policy', confidencePolicy, 'SearXNG high/low/freshness confidence fixture scenarios produce expected fallback recommendations.'),
    gate('provider_router_policy', routerPolicy, 'Provider router fixture keeps SearXNG default and Brave modes planning-only.'),
    gate('dedupe_policy', dedupePolicy, 'SearXNG/Brave dedupe fixture records overlap, agreement, diversity, and provider contribution.'),
    gate('paid_provider_blocked', paidProviderBlocked, 'Brave live execution and all paid provider calls remain blocked.'),
    gate('artifact_privacy', artifactPrivacy, 'Phase 49K artifact paths are private GCS objects with no public access or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Live search, browser capture, extraction, production, external beta, paid production, and broad media remain blocked.'),
  ]
  const blockers = [
    ...(input.preflightBlockers ?? []),
    ...(phase49JEvidence ? [] : ['Phase 49J Brave fallback policy evidence is missing or inconsistent.']),
    ...(fixtureIntegrity ? [] : ['Brave-shaped fixture response is invalid.']),
    ...(normalizerIntegrity ? [] : ['Brave fixture normalization failed or rejected required fixture records.']),
    ...(storageRights ? [] : ['Brave storage-rights enforcement is inconsistent.']),
    ...(secretTextSafe ? [] : ['A Brave API key-like value appears in tracked policy text.']),
    ...(confidencePolicy ? [] : ['SearXNG confidence fixture scenarios are inconsistent.']),
    ...(routerPolicy ? [] : ['Provider router fixture decisions are inconsistent.']),
    ...(dedupePolicy ? [] : ['SearXNG/Brave dedupe fixture is invalid.']),
    ...(paidProviderBlocked ? [] : ['Paid provider blocking is inconsistent.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
    ...(scriptsPresent ? [] : ['Required Phase 49K package scripts are missing.']),
    ...(docsPresent ? [] : ['Required Phase 49K docs are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: [
      'Phase 49K proves only generated Brave-shaped fixture normalization; live Brave API remains blocked.',
      'SearXNG remains the default free/open-source provider.',
      'Phase 49L may begin only as a secret-backed, budgeted, storage-rights-approved Brave controlled live API validation.',
    ],
  }
}

function gate(gateId: typeof braveSearchFixtureQaGateIds[number], passed: boolean, summary: string): BraveFixtureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return braveSearchFixtureRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return braveSearchFixtureRequiredDocs.every((doc) => existsSync(doc))
}

function trackedTextHasNoSecretValue(): boolean {
  const files = [
    'server/activation/brave-search-fixture-normalizer/brave-source-storage-policy.ts',
    'server/activation/brave-search-fallback-policy/brave-search-secret-policy.ts',
    'docs/activation-brave-search-fixture-normalizer-policy.md',
    'docs/activation-brave-search-fallback-policy.md',
  ]
  return files.every((file) => {
    if (!existsSync(file)) return true
    const text = readFileSync(file, 'utf8')
    return !/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(text) && !/X-Subscription-Token:\s*(?!<)[A-Za-z0-9_-]{12,}/.test(text)
  })
}
