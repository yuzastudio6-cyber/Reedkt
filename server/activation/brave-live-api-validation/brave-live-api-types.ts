export type BraveLiveApiPhase = '49L'
export type BraveLiveApiStatus = 'planned' | 'completed' | 'blocked'
export type BraveLiveProvider = 'brave_search'
export type BraveLiveMode = 'controlled_live_api_validation'
export type BraveSecretSource = 'backend_env' | 'google_secret_manager' | 'missing'
export type Phase49MReadiness = 'ready_for_searxng_brave_hybrid_consensus_e2e' | 'blocked'

export type BraveLiveQaGateId =
  | 'phase49k_evidence'
  | 'secret_safety'
  | 'budget_guard'
  | 'brave_live_api_call'
  | 'result_normalization'
  | 'storage_rights_enforcement'
  | 'paid_provider_scope'
  | 'artifact_privacy'
  | 'blocked_features'

export interface BraveLiveApiConfig {
  phase: BraveLiveApiPhase
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  provider: BraveLiveProvider
  mode: BraveLiveMode
  endpoint: 'https://api.search.brave.com/res/v1/web/search'
  query: 'ReeditPro AI video editing planning tools'
  maxResults: 5
  maxQueriesPerRun: 1
  timeoutMs: 8000
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  secretName: 'BRAVE_SEARCH_API_KEY'
}

export interface BraveLiveSafetyFlags {
  braveEnabledByDefault: false
  searxngDefaultProvider: true
  liveBraveApiAllowedInPhase49L: true
  paidProviderAllowedOnlyForBrave: true
  otherPaidProvidersAllowed: false
  requiresSecret: true
  secretFrontendExposureAllowed: false
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  normalizedMinimalMetadataAllowed: true
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface BraveLiveEnvValidation {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveSecretResolution {
  configured: boolean
  source: BraveSecretSource
  secretValue?: string
  secretName: 'BRAVE_SEARCH_API_KEY'
  secretVersion: 'latest'
  secretValuePrinted: false
  secretValueStored: false
  frontendExposure: false
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveSecretMetadata {
  secretConfigured: boolean
  secretName: 'BRAVE_SEARCH_API_KEY'
  projectId: 'reeditpro'
  secretVersion: 'latest'
  versionEnabled: boolean
  approvedServiceAccountsHaveAccess: boolean
  approvedServiceAccounts: string[]
  missingServiceAccounts: string[]
  publicAccessDetected: boolean
  broadAccessDetected: boolean
  iamChanges: string[]
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveBudgetGuardResult {
  passed: boolean
  dailyLimit: number
  monthlyBudgetUsd: number
  maxResults: number
  maxQueriesPerRun: number
  estimatedCallCount: 1
  retriesAllowed: 0
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveQueryPlan {
  planId: 'phase49l-brave-live-api-validation-plan'
  phase49LRunId: string
  provider: BraveLiveProvider
  providerMode: 'live_controlled_validation'
  endpoint: BraveLiveApiConfig['endpoint']
  query: BraveLiveApiConfig['query']
  params: {
    count: 5
    search_lang: 'en'
    country: 'us'
    safesearch: 'moderate'
  }
  maxResults: 5
  maxQueriesPerRun: 1
  rawPromptExecution: false
  approvedPlanSnapshot: true
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: BraveLiveSafetyFlags
}

export interface BraveLiveApiCallSummary {
  attempted: boolean
  completed: boolean
  endpoint: BraveLiveApiConfig['endpoint']
  method: 'GET'
  statusCode?: number
  resultCount: number
  callCount: 0 | 1
  requestHeadersStored: false
  secretValuePrinted: false
  rawResponseStored: false
  snippetsStored: false
  disallowedEndpointUsed: false
  errorClass?: string
  errorMessage?: string
}

export interface BraveLiveWebResult {
  title?: string
  url?: string
  description?: string
  profile?: {
    name?: string
    url?: string
  }
}

export interface NormalizedBraveLiveSourceRecord {
  sourceId: string
  provider: BraveLiveProvider
  providerMode: 'live_controlled_validation'
  title: string
  url: string
  domain: string
  rank: number
  retrievedAt: string
  sourceType: 'live_brave_web_search_result'
  attributionRequired: true
  captureAllowed: false
  extractionAllowed: false
  paidProvider: true
  liveProviderCallUsed: true
  rawProviderResponseStored: false
  snippetStored: false
}

export interface BraveLiveNormalizationResult {
  sources: NormalizedBraveLiveSourceRecord[]
  warnings: string[]
  blockers: string[]
  rejectedUrls: Array<{ url: string; reason: string }>
}

export interface BraveLiveSourceManifest {
  runId: string
  provider: BraveLiveProvider
  generatedFixture: false
  liveProviderCallUsed: true
  rawProviderResponseStored: false
  snippetStored: false
  storageRightsApproved: false
  normalizedSourceCount: number
  sourceRecords: NormalizedBraveLiveSourceRecord[]
  budget: {
    estimatedCallCount: 1
    actualCallCount: 0 | 1
    maxQueriesPerRun: 1
    maxResults: 5
  }
  secret: {
    configured: boolean
    source: BraveSecretSource
    secretName: 'BRAVE_SEARCH_API_KEY'
    secretVersion: 'latest'
    secretValuePrinted: false
    secretValueStored: false
    frontendExposure: false
  }
  warnings: string[]
  blockers: string[]
}

export interface BraveLiveArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface BraveLiveQaGate {
  gateId: BraveLiveQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface BraveLiveQaSummary {
  status: 'passed' | 'blocked'
  gates: BraveLiveQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveMetadata {
  runId: string
  provider: BraveLiveProvider
  mode: BraveLiveMode
  endpoint: BraveLiveApiConfig['endpoint']
  queryHash: string
  callCount: 0 | 1
  normalizedSourceCount: number
  rawResponseStored: false
  snippetsStored: false
  requestHeadersStored: false
  secretValuePrinted: false
  secretSource: BraveSecretSource
  storageRightsApproved: false
}

export interface BraveLiveExecutionReport {
  ok: boolean
  phase: BraveLiveApiPhase
  status: 'completed' | 'blocked'
  runId: string
  projectId: 'reeditpro'
  provider: BraveLiveProvider
  mode: BraveLiveMode
  planSnapshot: BraveLiveQueryPlan
  secret: Omit<BraveLiveSecretResolution, 'secretValue'>
  secretMetadata: BraveLiveSecretMetadata
  budget: BraveLiveBudgetGuardResult
  apiCall: BraveLiveApiCallSummary
  normalizedSources: NormalizedBraveLiveSourceRecord[]
  sourceManifest: BraveLiveSourceManifest
  metadata: BraveLiveMetadata
  artifacts: BraveLiveArtifact[]
  qa: BraveLiveQaSummary
  phase49MReadiness: Phase49MReadiness
  safety: BraveLiveSafetyFlags
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveReport {
  reportId: 'activation-phase-49l-brave-live-api-validation'
  createdAt: string
  phase: BraveLiveApiPhase
  status: BraveLiveApiStatus
  config: BraveLiveApiConfig
  executionReport?: BraveLiveExecutionReport
  planSnapshot: BraveLiveQueryPlan
  qa: BraveLiveQaSummary
  phase49MReadiness: Phase49MReadiness
  braveLiveApiValidated: boolean
  rawBraveStorageAllowed: false
  snippetsStored: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface BraveLiveCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string | null
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  allowedInPhase49L: boolean
  warnings: string[]
  blockedReason?: string
}

export interface BraveLiveIamPlan {
  bindingId: string
  resource: string
  role: 'roles/storage.objectCreator' | 'roles/secretmanager.secretAccessor'
  member: string
  conditionTitle?: string
  conditionExpression?: string
  description: string
  commandString: string
  reportOnly: true
}
