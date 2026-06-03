import type { BraveSearchProviderMode, SearxngConfidenceInput, SearxngConfidenceResult } from '../brave-search-fallback-policy'

export type BraveSearchFixturePhase = '49K'
export type BraveSearchFixtureStatus = 'planned' | 'completed' | 'blocked'
export type BraveSearchFixtureProvider = 'brave_search'
export type BraveSearchFixtureMode = 'brave_shaped_fixture_normalizer'
export type BraveSnippetStorageStatus = 'blocked_by_default' | 'fixture_only'
export type Phase49LReadiness = 'ready_for_brave_controlled_live_api_validation' | 'blocked'

export type BraveSearchFixtureQaGateId =
  | 'phase49j_evidence'
  | 'brave_fixture_integrity'
  | 'brave_normalizer'
  | 'storage_rights_enforcement'
  | 'secret_safety'
  | 'searxng_confidence_policy'
  | 'provider_router_policy'
  | 'dedupe_policy'
  | 'paid_provider_blocked'
  | 'artifact_privacy'
  | 'blocked_features'

export interface BraveSearchFixtureConfig {
  phase: BraveSearchFixturePhase
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  provider: BraveSearchFixtureProvider
  mode: BraveSearchFixtureMode
  query: 'ReeditPro AI video editing planning tools'
  minResults: 5
  maxResults: 8
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
}

export interface BraveSearchFixtureSafetyFlags {
  braveEnabledByDefault: false
  liveBraveApiAllowed: false
  paidProviderAllowed: false
  requiresSecretForLiveUse: true
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  normalizedMinimalMetadataAllowed: true
  searxngDefaultProvider: true
  searxngOnlyDefaultMode: true
  fallbackPolicyOnly: true
  providerExecutionAllowed: false
  liveSearchAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface BraveShapedWebResult {
  title: string
  url: string
  description: string
  age?: string
  profile?: {
    name: string
    url: string
    longName?: string
  }
  familyFriendly: true
  type: 'search_result'
  category: 'documentation' | 'source' | 'planning' | 'tooling'
  rank: number
}

export interface BraveShapedFixtureResponse {
  type: 'search'
  query: {
    original: BraveSearchFixtureConfig['query']
    showStrictWarning: false
  }
  web: {
    type: 'search'
    results: BraveShapedWebResult[]
  }
  provider: BraveSearchFixtureProvider
  providerMode: 'fixture'
  generatedFixture: true
  liveProviderCallUsed: false
  rawProviderResponseStored: false
}

export interface NormalizedBraveSourceRecord {
  sourceId: string
  provider: BraveSearchFixtureProvider
  providerMode: 'fixture'
  title: string
  url: string
  domain: string
  snippetStorageStatus: BraveSnippetStorageStatus
  snippetPreview?: string
  rank: number
  category: BraveShapedWebResult['category']
  retrievedAt: string
  sourceType: 'generated_brave_fixture'
  attributionRequired: true
  captureAllowed: false
  extractionAllowed: false
  paidProvider: true
  liveProviderCallUsed: false
  rawProviderResponseStored: false
  generatedFixture: true
}

export interface BraveNormalizationResult {
  sources: NormalizedBraveSourceRecord[]
  warnings: string[]
  blockers: string[]
  rejectedUrls: Array<{ url: string; reason: string }>
}

export interface BraveSourceStoragePolicy {
  secretName: 'BRAVE_SEARCH_API_KEY'
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  fixtureSnippetPreviewAllowed: true
  normalizedMinimalMetadataAllowed: true
  rawPersistenceRequiresStorageRights: true
  snippetPersistenceRequiresStorageRights: true
  noRealBravePayloadStored: true
  warnings: string[]
  blockers: string[]
}

export interface SearxngConfidenceFixtureScenario {
  scenarioId: 'searxng_high_confidence' | 'searxng_low_confidence' | 'searxng_freshness_gap'
  summary: string
  input: SearxngConfidenceInput
  result: SearxngConfidenceResult & {
    braveExecutionAllowed: false
    fallbackBlockedReason: string
  }
  expectedFallbackRecommended: boolean
}

export interface SearchProviderRouterFixtureDecision {
  mode: BraveSearchProviderMode
  selectedProvider: 'searxng' | 'brave_search' | 'searxng_plus_brave'
  fallbackRecommended: boolean
  fallbackBlockedReason: string
  providerExecutionAllowed: false
  budgetRequired: boolean
  secretRequired: boolean
  storageRightsRequired: boolean
  planningOnly: true
}

export interface FixtureSearxngSourceRecord {
  sourceId: string
  provider: 'searxng'
  title: string
  url: string
  domain: string
  rank: number
  generatedFixture: true
}

export interface SearchResultDedupeFixture {
  searxngSources: FixtureSearxngSourceRecord[]
  braveSources: NormalizedBraveSourceRecord[]
  mergedSources: Array<FixtureSearxngSourceRecord | NormalizedBraveSourceRecord>
  duplicateGroups: Array<{
    normalizedUrl: string
    sourceIds: string[]
    providers: Array<'searxng' | 'brave_search'>
  }>
  providerAgreementScore: number
  sourceDiversityScore: number
  promotedSources: Array<FixtureSearxngSourceRecord | NormalizedBraveSourceRecord>
  providerContributionSummary: {
    searxngUnique: number
    braveUnique: number
    overlappingUrls: number
  }
  fixtureOnly: true
}

export interface BraveFixtureSourceManifest {
  runId: string
  provider: BraveSearchFixtureProvider
  generatedFixture: true
  liveProviderCallUsed: false
  rawProviderResponseStored: false
  storageRightsPolicy: BraveSourceStoragePolicy
  normalizedSourceCount: number
  sourceRecords: NormalizedBraveSourceRecord[]
  confidenceScenarios: SearxngConfidenceFixtureScenario[]
  routerDecisions: SearchProviderRouterFixtureDecision[]
  dedupeSummary: SearchResultDedupeFixture
  warnings: string[]
  blockers: string[]
}

export interface BraveFixturePlanSnapshot {
  planId: 'phase49k-brave-fixture-normalizer-plan'
  phase49KRunId: string
  provider: BraveSearchFixtureProvider
  providerMode: 'fixture'
  query: BraveSearchFixtureConfig['query']
  maxResults: number
  braveEnabledByDefault: false
  liveBraveApiAllowed: false
  paidProviderAllowed: false
  rawBraveResponseStorageAllowed: false
  rawPromptExecution: false
  approvedPlanSnapshot: true
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: BraveSearchFixtureSafetyFlags
}

export interface BraveFixtureArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface BraveFixtureQaGate {
  gateId: BraveSearchFixtureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface BraveFixtureQaSummary {
  status: 'passed' | 'blocked'
  gates: BraveFixtureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface BraveFixtureExecutionReport {
  ok: boolean
  phase: BraveSearchFixturePhase
  runId: string
  projectId: 'reeditpro'
  provider: BraveSearchFixtureProvider
  query: BraveSearchFixtureConfig['query']
  fixtureResultCount: number
  normalizedSourceCount: number
  planSnapshot: BraveFixturePlanSnapshot
  fixtureResponse: BraveShapedFixtureResponse
  normalizedSources: NormalizedBraveSourceRecord[]
  confidenceScenarios: SearxngConfidenceFixtureScenario[]
  routerDecisions: SearchProviderRouterFixtureDecision[]
  dedupeFixture: SearchResultDedupeFixture
  sourceManifest: BraveFixtureSourceManifest
  artifacts: BraveFixtureArtifact[]
  qa: BraveFixtureQaSummary
  phase49LReadiness: Phase49LReadiness
  safety: BraveSearchFixtureSafetyFlags & {
    braveApiCalled: false
    liveSearchExecuted: false
    browserLaunched: false
    screenshotCaptured: false
    readabilityExtractionRun: false
    paidProviderCalled: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface BraveSearchFixtureReport {
  reportId: 'activation-phase-49k-brave-search-fixture-normalizer'
  createdAt: string
  phase: BraveSearchFixturePhase
  status: BraveSearchFixtureStatus
  config: BraveSearchFixtureConfig
  executionReport?: BraveFixtureExecutionReport
  fixtureResponse: BraveShapedFixtureResponse
  normalizedSources: NormalizedBraveSourceRecord[]
  confidenceScenarios: SearxngConfidenceFixtureScenario[]
  routerDecisions: SearchProviderRouterFixtureDecision[]
  dedupeFixture: SearchResultDedupeFixture
  sourceManifest: BraveFixtureSourceManifest
  qa: BraveFixtureQaSummary
  phase49LReadiness: Phase49LReadiness
  blockers: string[]
  warnings: string[]
  braveEnabledByDefault: false
  braveLiveApiAllowed: false
  paidProviderAllowed: false
  rawBraveStorageAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface BraveFixtureIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  reportOnly: true
}

export interface BraveFixtureCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string | null
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  allowedInPhase49K: boolean
  warnings: string[]
  blockedReason?: string
}
