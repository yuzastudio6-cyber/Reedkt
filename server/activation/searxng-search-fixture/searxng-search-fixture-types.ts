export type SearxngSearchFixtureStatus = 'planned' | 'completed' | 'blocked'
export type SearxngSearchFixtureMode = 'generated_private_fixture'
export type SearxngSearchProvider = 'searxng'
export type SearxngPhase49CReadiness =
  | 'ready_for_playwright_sharp_generated_capture_fixture'
  | 'blocked_pending_phase49b_execution'
  | 'blocked'

export type SearxngSearchFixtureQaGateId =
  | 'phase49a_evidence'
  | 'fixture_integrity'
  | 'normalization_integrity'
  | 'plan_snapshot_integrity'
  | 'source_manifest_integrity'
  | 'paid_provider_blocking'
  | 'browser_capture_blocking'
  | 'artifact_privacy'
  | 'blocked_features'

export interface SearxngSearchFixtureConfig {
  phase: '49B'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  defaultProvider: SearxngSearchProvider
  fixtureMode: SearxngSearchFixtureMode
  query: 'ReeditPro open source video editing toolchain documentation'
  minResults: 5
  maxResults: 8
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
}

export interface SearxngFixtureResult {
  title: string
  url: string
  content: string
  engine: SearxngSearchProvider
  category: 'documentation' | 'source' | 'policy' | 'tooling'
  score: number
  rank: number
  publishedDate?: string
  language: 'en'
}

export interface SearxngFixtureResponse {
  query: SearxngSearchFixtureConfig['query']
  provider: SearxngSearchProvider
  mode: SearxngSearchFixtureMode
  generatedFixture: true
  liveSearchUsed: false
  results: SearxngFixtureResult[]
}

export interface NormalizedSearchSourceRecord {
  sourceId: string
  provider: SearxngSearchProvider
  title: string
  url: string
  domain: string
  snippet: string
  rank: number
  category: SearxngFixtureResult['category']
  retrievedAt: string
  sourceType: 'generated_search_fixture'
  attributionRequired: true
  captureAllowed: false
  extractionAllowed: false
  paidProvider: false
  generatedFixture: true
}

export interface ApprovedSearxngSearchPlanSnapshot {
  planId: 'phase49b-searxng-generated-private-fixture-plan'
  phase49BRunId: string
  query: SearxngSearchFixtureConfig['query']
  provider: SearxngSearchProvider
  mode: SearxngSearchFixtureMode
  maxResults: number
  allowedProviderIds: SearxngSearchProvider[]
  disabledProviderIds: ['brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase']
  liveSearchAllowed: false
  browserCaptureAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  rawPromptExecution: false
  approvedPlanSnapshot: true
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: SearxngSearchFixtureSafetyFlags
}

export interface SearxngSourceManifest {
  query: SearxngSearchFixtureConfig['query']
  provider: SearxngSearchProvider
  generatedFixture: true
  sourceCount: number
  sources: NormalizedSearchSourceRecord[]
  attributionPolicy: string
  captureStatus: 'not_captured_phase49b'
  extractionStatus: 'not_extracted_phase49b'
  paidProviderUsed: false
  liveSearchUsed: false
  warnings: string[]
  blockers: string[]
}

export interface SearxngSearchFixtureSafetyFlags {
  liveSearchAllowed: false
  publicSearxngInstanceAllowed: false
  paidProvidersAllowed: false
  browserCaptureAllowed: false
  playwrightAllowed: false
  sharpProcessingAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface SearxngSearchFixtureArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SearxngSearchFixtureQaGate {
  gateId: SearxngSearchFixtureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface SearxngSearchFixtureQaSummary {
  status: 'passed' | 'blocked'
  gates: SearxngSearchFixtureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SearxngSearchFixtureExecutionReport {
  ok: boolean
  phase: '49B'
  runId: string
  projectId: 'reeditpro'
  provider: SearxngSearchProvider
  query: SearxngSearchFixtureConfig['query']
  fixtureResultCount: number
  normalizedSourceCount: number
  planSnapshot: ApprovedSearxngSearchPlanSnapshot
  sourceManifest: SearxngSourceManifest
  artifacts: SearxngSearchFixtureArtifact[]
  qa: SearxngSearchFixtureQaSummary
  phase49CReadiness: SearxngPhase49CReadiness
  safety: SearxngSearchFixtureSafetyFlags & {
    liveSearchExecuted: false
    publicWebRequestMade: false
    browserLaunched: false
    screenshotCaptured: false
    readabilityExtractionRun: false
    sharpProcessingRun: false
    paidProviderCalled: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedSearxngSearchFixtureEvidence {
  phase: '49B'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  defaultProvider: SearxngSearchProvider
  query: SearxngSearchFixtureConfig['query']
  fixtureResultCount?: number
  normalizedSourceCount?: number
  planSnapshotUri?: string
  fixtureResponseUri?: string
  normalizedResultsUri?: string
  sourceManifestUri?: string
  metadataUri?: string
  qaReportUri?: string
  phase49bReportUri?: string
  phase49CReadiness: SearxngPhase49CReadiness
  blockers: string[]
  warnings: string[]
}

export interface SearxngSearchFixtureReport {
  reportId: 'activation-phase-49b-searxng-search-fixture'
  createdAt: string
  phase: '49B'
  status: SearxngSearchFixtureStatus
  config: SearxngSearchFixtureConfig
  approvedEvidence: ApprovedSearxngSearchFixtureEvidence
  executionReport?: SearxngSearchFixtureExecutionReport
  defaultProvider: SearxngSearchProvider
  query: SearxngSearchFixtureConfig['query']
  fixtureResponse: SearxngFixtureResponse
  normalizedSources: NormalizedSearchSourceRecord[]
  sourceManifest: SearxngSourceManifest
  qa: SearxngSearchFixtureQaSummary
  phase49CReadiness: SearxngPhase49CReadiness
  blockers: string[]
  warnings: string[]
  liveSearchAllowed: false
  browserCaptureAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
}

export interface SearxngSearchFixtureIamPlan {
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

export interface SearxngSearchFixtureCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}
