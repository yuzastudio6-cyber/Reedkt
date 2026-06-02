export type ControlledLiveSearchStatus = 'planned' | 'completed' | 'blocked'
export type ControlledLiveSearchMode = 'controlled_private_live_search_capture_e2e'
export type Phase49HReadiness = 'ready_for_web_search_capture_internal_readiness_gate' | 'blocked'

export type ControlledLiveSearchQaGateId =
  | 'phase49f_evidence'
  | 'plan_snapshot_integrity'
  | 'private_searxng_query'
  | 'result_normalization'
  | 'allowlisted_capture_policy'
  | 'playwright_capture'
  | 'sharp_processing'
  | 'readability_extraction'
  | 'combined_manifest'
  | 'artifact_privacy'
  | 'blocked_features'

export interface ControlledLiveSearchConfig {
  phase: '49G'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: ControlledLiveSearchMode
  provider: 'searxng_private_cloud_run'
  serviceName: 'reeditpro-staging-private-searxng'
  queries: string[]
  allowedDomains: string[]
  maxQueries: 3
  maxResultsPerQuery: 5
  maxCapturePages: 2
  maxScreenshotWidth: 1366
  maxScreenshotHeight: 768
  maxHtmlBytes: number
  maxSanitizedHtmlChars: number
  maxTextChars: number
  textPreviewChars: number
  viewport: { width: 1366; height: 768; deviceScaleFactor: 1 }
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: string
  approvedPhase49FRunId: 'phase49f-20260602T204445'
  approvedPhase49FSourceManifestUri: string
  approvedPhase49FReportUri: string
}

export interface ControlledLiveSearchSafety {
  paidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  arbitraryUrlCaptureAllowed: false
  publicWebCaptureAllowed: true
  browserCaptureAllowed: true
  sharpProcessingAllowed: true
  readabilityExtractionAllowed: true
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface ControlledLiveSearchPlanSnapshot {
  planId: 'phase49g-controlled-live-search-capture-plan'
  phase49GRunId: string
  provider: 'private_searxng_cloud_run'
  serviceName: string
  queries: string[]
  maxResultsPerQuery: 5
  allowedDomains: string[]
  maxCapturePages: 2
  paidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  arbitraryUrlCaptureAllowed: false
  capturePolicy: 'allowlisted_search_results_only'
  readabilityPolicy: 'allowlisted_captured_pages_only'
  outputPrefixes: { generatedAssets: string; qaArtifacts: string }
  rawPromptExecution: false
  approvedPlanSnapshot: true
}

export interface ControlledLiveSearchRawResult {
  title?: string
  url?: string
  content?: string
  engine?: string | string[]
  engines?: string[]
  category?: string
  score?: number
}

export interface ControlledLiveSearchQueryResponse {
  query: string
  number_of_results?: number
  results: ControlledLiveSearchRawResult[]
  answers?: string[]
  corrections?: string[]
  suggestions?: string[]
  unresponsive_engines?: unknown[]
  queriedAt: string
}

export interface ControlledLiveSearchSourceRecord {
  sourceId: string
  provider: 'searxng'
  query: string
  queryIndex: number
  title: string
  url: string
  domain: string
  snippet: string
  rank: number
  category: string
  engine?: string
  retrievedAt: string
  sourceType: 'private_searxng_live_search_result'
  attributionRequired: true
  captureAllowed: boolean
  extractionAllowed: boolean
  paidProvider: false
  privateSearxngUsed: true
}

export interface ControlledLiveSearchSourceManifest {
  runId: string
  provider: 'searxng'
  serviceName: string
  queries: string[]
  sourceCount: number
  maxResultsPerQuery: 5
  allowedDomains: string[]
  sources: ControlledLiveSearchSourceRecord[]
  attributionPolicy: string
  privateSearxngUsed: true
  publicSearxngInstanceUsed: false
  paidProviderUsed: false
  browserCaptureUsed: boolean
  readabilityExtractionUsed: boolean
  captureStatus: 'allowlisted_capture_phase49g'
  extractionStatus: 'allowlisted_extraction_phase49g'
  warnings: string[]
  blockers: string[]
}

export interface ControlledLiveSearchCaptureTarget {
  sourceId: string
  title: string
  url: string
  domain: string
  query: string
  selectionReason: string
}

export interface ControlledLiveSearchSkippedTarget {
  sourceId: string
  url: string
  reason: string
}

export interface ControlledLiveSearchCaptureRecord {
  sourceId: string
  requestedUrl: string
  finalUrl: string
  finalDomain: string
  status?: number
  pageTitle: string
  browser: 'chromium'
  viewport: { width: 1366; height: 768; deviceScaleFactor: 1 }
  screenshotPath: string
  htmlPath: string
  fullPage: false
  allowlistedDomain: true
  loginBypassUsed: false
  captchaBypassUsed: false
  paywallBypassUsed: false
  linkClickUsed: false
  publicWebCaptureUsed: true
  capturedAt: string
  blockedRequests: string[]
  dom: {
    h1: string
    articleCount: number
    paragraphCount: number
  }
  screenshotDimensions: { width: number; height: number }
  warnings: string[]
}

export interface ControlledLiveSearchSharpRecord {
  sourceId: string
  originalPath: string
  previewPath: string
  thumbnailPath: string
  originalMetadata: { width: number; height: number; format?: string; sizeBytes: number }
  previewMetadata: { width: number; height: number; format?: string; sizeBytes: number }
  thumbnailMetadata: { width: number; height: number; format?: string; sizeBytes: number }
  processedAt: string
}

export interface ControlledLiveSearchRawExtraction {
  sourceId: string
  title: string
  byline?: string
  excerpt?: string
  textContent: string
  content: string
  length: number
  siteName?: string
  extractedAt: string
  sourceUrl: string
}

export interface ControlledLiveSearchSanitizedExtraction {
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

export interface ControlledLiveSearchExtractionRecord {
  sourceId: string
  extractionId: string
  sourceUrl: string
  title: string
  byline?: string
  excerpt?: string
  textContentPreview: string
  textLength: number
  wordCount: number
  sanitizedJsonPath: string
  textPath: string
  metadataPath: string
  displaySafe: true
  sourceAllowlisted: true
  paidProviderUsed: false
  publicSearxngUsed: false
}

export interface ControlledLiveSearchCombinedManifest {
  runId: string
  provider: 'searxng'
  serviceName: string
  queries: string[]
  normalizedSources: ControlledLiveSearchSourceRecord[]
  selectedCaptureTargets: ControlledLiveSearchCaptureTarget[]
  skippedCaptureTargets: ControlledLiveSearchSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  paidProviderUsed: false
  publicSearxngUsed: false
  arbitraryUrlCaptureUsed: false
  publicArtifactAccess: false
  warnings: string[]
  blockers: string[]
}

export interface ControlledLiveSearchArtifact {
  id: string
  kind: 'private_json' | 'private_text' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ControlledLiveSearchQaGate {
  gateId: ControlledLiveSearchQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface ControlledLiveSearchQa {
  status: 'passed' | 'blocked'
  gates: ControlledLiveSearchQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ControlledLiveSearchExecutionReport {
  ok: boolean
  phase: '49G'
  runId: string
  projectId: 'reeditpro'
  region: 'us-central1'
  mode: ControlledLiveSearchMode
  planSnapshot: ControlledLiveSearchPlanSnapshot
  serviceName: string
  privateSearxngServiceUrlRedacted: '[redacted-authenticated-cloud-run-url]' | 'unresolved'
  privateSearxngInvocationMethod?: 'audience_identity_token' | 'default_identity_token' | 'cloud_run_proxy'
  queryResponses: ControlledLiveSearchQueryResponse[]
  normalizedSources: ControlledLiveSearchSourceRecord[]
  sourceManifest: ControlledLiveSearchSourceManifest
  selectedCaptureTargets: ControlledLiveSearchCaptureTarget[]
  skippedCaptureTargets: ControlledLiveSearchSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  combinedManifest: ControlledLiveSearchCombinedManifest
  artifacts: ControlledLiveSearchArtifact[]
  qa: ControlledLiveSearchQa
  phase49HReadiness: Phase49HReadiness
  safety: ControlledLiveSearchSafety & {
    paidProviderCalled: false
    publicSearxngInstanceUsed: false
    arbitraryUrlCaptureUsed: false
    publicAccessEnabled: false
    signedUrlSourceOfTruth: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedControlledLiveSearchEvidence {
  phase: '49G'
  status: ControlledLiveSearchStatus
  runId?: string
  serviceName: string
  normalizedSourceCount?: number
  selectedCaptureTargetCount?: number
  successfulCaptureCount?: number
  successfulExtractionCount?: number
  sourceManifestUri?: string
  combinedManifestUri?: string
  qaReportUri?: string
  phase49gReportUri?: string
  phase49HReadiness: Phase49HReadiness
  blockers: string[]
  warnings: string[]
}

export interface ControlledLiveSearchReport {
  reportId: 'activation-phase-49g-controlled-private-live-search-capture-e2e'
  createdAt: string
  phase: '49G'
  status: ControlledLiveSearchStatus
  config: ControlledLiveSearchConfig
  approvedEvidence: ApprovedControlledLiveSearchEvidence
  executionReport?: ControlledLiveSearchExecutionReport
  qa: ControlledLiveSearchQa
  phase49HReadiness: Phase49HReadiness
  paidProviderAllowed: false
  publicSearxngInstanceAllowed: false
  arbitraryUrlCaptureAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  blockers: string[]
  warnings: string[]
}
