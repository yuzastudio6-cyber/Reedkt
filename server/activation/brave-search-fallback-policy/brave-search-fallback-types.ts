export type BraveSearchFallbackPhase = '49J'

export type BraveSearchFallbackStatus = 'completed' | 'blocked'

export type BraveSearchProviderMode =
  | 'searxng_only'
  | 'searxng_with_brave_fallback'
  | 'hybrid_consensus'
  | 'brave_only_diagnostic'

export type SearxngConfidenceLevel = 'high' | 'medium' | 'low'

export type BraveSearchQaGateId =
  | 'brave_provider_evidence'
  | 'default_provider_integrity'
  | 'secret_safety'
  | 'cost_policy'
  | 'storage_rights_policy'
  | 'confidence_policy'
  | 'provider_router_policy'
  | 'paid_provider_blocked'
  | 'blocked_features'

export interface BraveSearchFallbackConfig {
  phase: BraveSearchFallbackPhase
  env: 'staging'
  defaultProvider: 'searxng'
  optionalProvider: 'brave_search'
  defaultProviderMode: 'searxng_only'
  reportOnly: true
}

export interface BraveSearchProviderEvidence {
  providerId: 'brave_search'
  providerType: 'optional_paid_search_provider'
  role: 'fallback_confidence_booster'
  defaultEnabled: false
  requiresSecret: true
  secretName: 'BRAVE_SEARCH_API_KEY'
  apiAuthHeader: 'X-Subscription-Token'
  endpoint: 'https://api.search.brave.com/res/v1/web/search'
  pricingKnown: true
  searchPlanPrice: '$5 per 1,000 requests'
  freeCreditsKnown: true
  freeCreditsSummary: '$5 in free monthly credits'
  storageRightsRequiredForRawPersistence: true
  providerAllowedInPhase49J: false
  liveApiCallAllowedInPhase49J: false
  rawResponseStorageAllowedByDefault: false
  sourceUrls: string[]
  notes: string[]
}

export interface BraveSearchCostPolicy {
  braveSearchEnabledDefault: false
  dailyLimitDefault: 0
  monthlyBudgetUsdDefault: 0
  maxResults: 5
  maxQueriesPerRun: 1
  timeoutMs: 8000
  storeRawResultsDefault: false
  unboundedRetriesAllowed: false
  automaticPaidProviderFallbackAllowed: false
  costRecordingRequiredInFutureQa: true
  blockers: string[]
}

export interface BraveSearchSecretPolicy {
  secretName: 'BRAVE_SEARCH_API_KEY'
  frontendExposureAllowed: false
  loggingAllowed: false
  docsValueAllowed: false
  gitValueAllowed: false
  serverSideOnly: true
  secretManagerIntegration: 'future_scoped'
  missingSecretBehavior: 'provider_disabled_default_searxng_unblocked'
  blockers: string[]
}

export interface BraveSearchStorageRightsPolicy {
  storeRawBraveResponseDefault: false
  storeBraveSnippetsDefault: false
  storeNormalizedMinimalMetadataDefault: false
  rawPersistenceRequiresStorageRights: true
  snippetPersistenceRequiresStorageRights: true
  capturedPageContentGovernedByPublisherTerms: true
  blockers: string[]
  warnings: string[]
}

export interface SearxngConfidenceInput {
  resultCount: number
  uniqueDomainCount: number
  officialSourceCount: number
  allowlistedDomainCount: number
  duplicateRatio: number
  emptySnippetRatio: number
  freshnessRequested: boolean
  recentResultCount: number
  blockedDomainCount: number
  sourceQualityScore?: number
}

export interface SearxngConfidenceResult {
  confidenceScore: number
  confidenceLevel: SearxngConfidenceLevel
  braveFallbackRecommended: boolean
  reasonCodes: string[]
}

export interface SearchProviderRouterModePolicy {
  mode: BraveSearchProviderMode
  defaultMode: boolean
  allowedInPhase49J: boolean
  braveExecutionAllowed: false
  summary: string
  requirements: string[]
}

export interface BraveSearchCommandPlan {
  commandId: string
  description: string
  allowedInPhase49J: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface BraveSearchFuturePhase {
  phaseId: '49K' | '49L' | '49M' | '49N'
  title: string
  summary: string
  liveBraveApiAllowed: boolean
}

export interface BraveSearchQaGate {
  gateId: BraveSearchQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface BraveSearchQaSummary {
  status: 'passed' | 'blocked'
  gates: BraveSearchQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface BraveSearchFallbackReport {
  reportId: 'activation-phase-49j-brave-search-fallback-policy'
  createdAt: string
  phase: BraveSearchFallbackPhase
  status: BraveSearchFallbackStatus
  config: BraveSearchFallbackConfig
  braveEvidence: BraveSearchProviderEvidence
  costPolicy: BraveSearchCostPolicy
  secretPolicy: BraveSearchSecretPolicy
  storageRightsPolicy: BraveSearchStorageRightsPolicy
  confidenceExamples: {
    healthySearxng: SearxngConfidenceResult
    lowConfidenceFreshness: SearxngConfidenceResult
  }
  providerRouterModes: SearchProviderRouterModePolicy[]
  commandPlan: BraveSearchCommandPlan[]
  futurePhases: BraveSearchFuturePhase[]
  qa: BraveSearchQaSummary
  phase49KReadiness: 'ready_for_brave_shaped_fixture_and_normalizer' | 'blocked'
  defaultProvider: 'SearXNG'
  braveStatus: 'optional_fallback_blocked_until_future_secret_backed_phase'
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
