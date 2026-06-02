export type PrivateWebSearchCaptureE2EStatus = 'planned' | 'completed' | 'blocked'
export type PrivateWebSearchCaptureE2EMode = 'controlled_private_web_search_capture_e2e'
export type PrivateWebSearchProviderMode = 'private_fixture_provider' | 'private_searxng_endpoint'
export type PrivateWebPhase49FReadiness = 'ready_for_web_search_capture_internal_readiness_gate' | 'blocked'

export type PrivateWebE2EQaGateId =
  | 'phase49b_evidence'
  | 'phase49c_evidence'
  | 'phase49d_evidence'
  | 'plan_snapshot_integrity'
  | 'private_search_provider'
  | 'source_normalization'
  | 'private_fixture_pages'
  | 'playwright_capture'
  | 'sharp_processing'
  | 'readability_extraction'
  | 'combined_manifest'
  | 'artifact_privacy'
  | 'blocked_features'

export interface PrivateWebE2EConfig {
  phase: '49E'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: PrivateWebSearchCaptureE2EMode
  defaultProvider: 'searxng'
  providerMode: PrivateWebSearchProviderMode
  query: 'ReeditPro controlled private web search capture E2E fixture'
  approvedPhase49BRunId: 'phase49b-20260602T01332'
  approvedPhase49CRunId: 'phase49c-20260602T022008'
  approvedPhase49DRunId: 'phase49d-20260602T150908'
  approvedPhase49DReportUri: string
  maxResults: 3
  allowedResultDomains: ['fixture.local', 'example.invalid', 'private.test']
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  viewport: { width: 1366; height: 768; deviceScaleFactor: 1 }
  previewMaxWidth: 1280
  thumbnailWidth: 320
  maxPageBytes: number
  maxSanitizedHtmlChars: number
  maxTextChars: number
  textPreviewChars: number
  readabilityVersion: string
  domImplementation: 'jsdom'
  sanitizer: 'jsdom-dom-bounded-sanitizer'
}

export interface PrivateWebE2ESafetyFlags {
  privateFixtureProviderAllowed: true
  privateSearxngEndpointAllowed: true
  publicSearxngInstanceAllowed: false
  paidProvidersAllowed: false
  livePublicSearchAllowed: false
  publicWebCaptureAllowed: false
  arbitraryUrlCaptureAllowed: false
  browserCaptureAllowedForFixturePages: true
  sharpProcessingAllowedForPhaseScreenshots: true
  readabilityExtractionAllowedForFixtureHtml: true
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface PrivateWebE2EPlanSnapshot {
  planId: 'phase49e-private-web-search-capture-e2e-plan'
  phase49ERunId: string
  query: PrivateWebE2EConfig['query']
  providerMode: PrivateWebSearchProviderMode
  maxResults: 3
  allowedResultDomains: PrivateWebE2EConfig['allowedResultDomains']
  browserCaptureScope: 'phase_created_fixture_pages_only'
  readabilityScope: 'phase_created_fixture_html_only'
  rawPromptExecution: false
  approvedPlanSnapshot: true
  paidProvidersAllowed: false
  publicWebCaptureAllowed: false
  arbitraryUrlCaptureAllowed: false
  livePublicSearchAllowed: false
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: PrivateWebE2ESafetyFlags
}

export interface PrivateFixturePage {
  sourceId: string
  rank: number
  title: string
  url: string
  domain: 'fixture.local'
  fixturePath: string
  byline: string
  publishedDate: string
  excerpt: string
  sizeBytes: number
  sha256: string
  externalAssetCount: 0
  hasScriptTags: false
  hasIframes: false
  hasExternalImages: false
  hasRemoteFonts: false
  policyLabels: string[]
}

export interface PrivateSearxngResult {
  title: string
  url: string
  content: string
  engine: 'searxng'
  category: 'documentation' | 'source' | 'policy'
  score: number
  rank: number
  language: 'en'
  generatedFixture: true
}

export interface PrivateSearxngResponse {
  query: PrivateWebE2EConfig['query']
  provider: 'searxng'
  providerMode: PrivateWebSearchProviderMode
  generatedFixture: true
  privateFixtureProviderUsed: boolean
  liveSearchUsed: false
  paidProviderUsed: false
  results: PrivateSearxngResult[]
}

export interface PrivateWebSourceRecord {
  sourceId: string
  provider: 'searxng'
  providerMode: PrivateWebSearchProviderMode
  title: string
  url: string
  domain: 'fixture.local'
  snippet: string
  rank: number
  category: PrivateSearxngResult['category']
  retrievedAt: string
  sourceType: 'controlled_private_fixture_page'
  attributionRequired: true
  captureAllowed: true
  extractionAllowed: true
  paidProvider: false
  generatedFixture: true
}

export interface PrivateWebSourceManifest {
  runId: string
  query: PrivateWebE2EConfig['query']
  provider: 'searxng'
  providerMode: PrivateWebSearchProviderMode
  sourceCount: number
  sources: PrivateWebSourceRecord[]
  attributionPolicy: string
  liveSearchUsed: false
  paidProviderUsed: false
  publicWebCaptureUsed: false
  warnings: string[]
  blockers: string[]
}

export interface PrivateWebCaptureMetadata {
  sourceId: string
  browser: 'chromium'
  urlType: 'phase_fixture_file_url'
  fixtureUrl: string
  pageTitle: string
  viewport: PrivateWebE2EConfig['viewport']
  screenshotPath: string
  fullPage: true
  publicWebCaptureUsed: false
  publicNetworkRequests: string[]
  capturedAt: string
  dom: {
    h1: string
    policyLabelCount: number
    articleParagraphCount: number
  }
  screenshotDimensions: { width: number; height: number }
}

export interface PrivateWebSharpArtifact {
  path: string
  width: number
  height: number
  sizeBytes: number
  sha256: string
}

export interface PrivateWebSharpMetadata {
  sourceId: string
  inputPath: string
  original: PrivateWebSharpArtifact & { format: string }
  preview: PrivateWebSharpArtifact
  thumbnail: PrivateWebSharpArtifact
  processedAt: string
  remoteImagesFetched: false
}

export interface PrivateWebRawExtraction {
  sourceId: string
  title: string
  byline?: string
  excerpt?: string
  textContent: string
  content: string
  length: number
  siteName?: string
  publishedTime?: string
  extractedAt: string
  publicWebExtractionUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
  browserCaptureUsed: false
}

export interface PrivateWebSanitizedExtraction {
  sourceId: string
  title: string
  byline?: string
  excerpt?: string
  sanitizedHtml: string
  sanitizedText: string
  textLength: number
  wordCount: number
  displaySafe: true
  rawExtractionDisplaySafe: false
  truncated: boolean
  removedUnsafeTags: string[]
  removedUnsafeAttributes: string[]
  removedUnsafeUrls: string[]
}

export interface PrivateWebExtractionRecord {
  sourceId: string
  extractionId: string
  title: string
  byline?: string
  excerpt?: string
  textContentPreview: string
  textLength: number
  wordCount: number
  sanitizedHtmlPath: string
  textPath: string
  displaySafe: true
  generatedFixture: true
  publicWebExtractionUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
}

export interface PrivateWebE2EArtifact {
  id: string
  kind: 'private_json' | 'private_html' | 'private_text' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface PrivateWebE2EManifest {
  runId: string
  providerMode: PrivateWebSearchProviderMode
  sourceCount: number
  captureCount: number
  extractionCount: number
  sources: Array<{
    source: PrivateWebSourceRecord
    fixturePage: Pick<PrivateFixturePage, 'sourceId' | 'title' | 'url' | 'sizeBytes' | 'sha256'>
    capture: Omit<PrivateWebCaptureMetadata, 'screenshotPath'>
    sharp: Omit<PrivateWebSharpMetadata, 'inputPath'>
    extraction: PrivateWebExtractionRecord
  }>
  artifacts: PrivateWebE2EArtifact[]
  liveSearchUsed: false
  paidProviderUsed: false
  publicWebCaptureUsed: false
  publicWebExtractionUsed: false
  publicArtifactUsed: false
  warnings: string[]
  blockers: string[]
}

export interface PrivateWebE2EQaGate {
  gateId: PrivateWebE2EQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface PrivateWebE2EQaSummary {
  status: 'passed' | 'blocked'
  gates: PrivateWebE2EQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface PrivateWebE2EExecutionReport {
  ok: boolean
  phase: '49E'
  runId: string
  projectId: 'reeditpro'
  mode: PrivateWebSearchCaptureE2EMode
  providerMode: PrivateWebSearchProviderMode
  query: PrivateWebE2EConfig['query']
  planSnapshot: PrivateWebE2EPlanSnapshot
  searchResponse: PrivateSearxngResponse
  normalizedSources: PrivateWebSourceRecord[]
  sourceManifest: PrivateWebSourceManifest
  fixturePages: PrivateFixturePage[]
  captures: PrivateWebCaptureMetadata[]
  sharpProcessing: PrivateWebSharpMetadata[]
  extractions: PrivateWebExtractionRecord[]
  manifest?: PrivateWebE2EManifest
  artifacts: PrivateWebE2EArtifact[]
  qa: PrivateWebE2EQaSummary
  phase49FReadiness: PrivateWebPhase49FReadiness
  safety: PrivateWebE2ESafetyFlags & {
    livePublicSearchExecuted: false
    publicWebRequestMade: false
    publicWebCaptureUsed: false
    arbitraryUrlCaptureUsed: false
    paidProviderCalled: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPrivateWebE2EEvidence {
  phase: '49E'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  providerMode: PrivateWebSearchProviderMode
  query: PrivateWebE2EConfig['query']
  sourceCount?: number
  captureCount?: number
  extractionCount?: number
  planSnapshotUri?: string
  searchResponseUri?: string
  normalizedResultsUri?: string
  sourceManifestUri?: string
  combinedManifestUri?: string
  qaReportUri?: string
  phase49eReportUri?: string
  phase49FReadiness: PrivateWebPhase49FReadiness
  blockers: string[]
  warnings: string[]
}

export interface PrivateWebE2EReport {
  reportId: 'activation-phase-49e-private-web-search-capture-e2e'
  createdAt: string
  phase: '49E'
  status: PrivateWebSearchCaptureE2EStatus
  config: PrivateWebE2EConfig
  approvedEvidence: ApprovedPrivateWebE2EEvidence
  executionReport?: PrivateWebE2EExecutionReport
  qa: PrivateWebE2EQaSummary
  phase49FReadiness: PrivateWebPhase49FReadiness
  blockers: string[]
  warnings: string[]
  livePublicSearchAllowed: false
  publicWebCaptureAllowed: false
  arbitraryUrlCaptureAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
}

export interface PrivateWebE2EIamPlan {
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

export interface PrivateWebE2ECommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  allowedInPhase49E: boolean
  blockedReason?: string
}
