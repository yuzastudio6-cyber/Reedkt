export type ReadabilityExtractionFixtureStatus = 'planned' | 'completed' | 'blocked'
export type ReadabilityExtractionFixtureMode = 'generated_local_html_readability_extraction'
export type ReadabilityPhase49EReadiness = 'ready_for_controlled_private_web_search_capture_e2e' | 'blocked_pending_phase49d_execution' | 'blocked'

export type ReadabilityExtractionQaGateId =
  | 'phase49c_evidence'
  | 'local_article_fixture_integrity'
  | 'readability_extraction'
  | 'sanitization_integrity'
  | 'normalization_integrity'
  | 'artifact_manifest'
  | 'artifact_privacy'
  | 'blocked_features'

export interface ReadabilityExtractionConfig {
  phase: '49D'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  fixtureMode: ReadabilityExtractionFixtureMode
  fixtureTitle: 'ReeditPro internal source extraction fixture'
  approvedPhase49CRunId: 'phase49c-20260602T022008'
  approvedPhase49CManifestUri: string
  approvedPhase49CReportUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  readabilityVersion: string
  domImplementation: 'jsdom'
  sanitizer: 'jsdom-dom-bounded-sanitizer'
  maxSanitizedHtmlChars: number
  maxTextChars: number
  textPreviewChars: number
}

export interface ReadabilityExtractionSafetyFlags {
  localOnlyExtractionAllowed: true
  publicWebExtractionAllowed: false
  liveSearchAllowed: false
  paidProvidersAllowed: false
  browserCaptureAllowed: false
  playwrightAllowed: false
  sharpProcessingAllowed: false
  readabilityExtractionAllowedForGeneratedLocalFixture: true
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface ApprovedReadabilityExtractionPlanSnapshot {
  planId: 'phase49d-readability-generated-local-extraction-plan'
  phase49DRunId: string
  fixtureMode: ReadabilityExtractionFixtureMode
  approvedPhase49CRunId: ReadabilityExtractionConfig['approvedPhase49CRunId']
  approvedPhase49CManifestUri: string
  approvedPhase49CReportUri: string
  domImplementation: ReadabilityExtractionConfig['domImplementation']
  sanitizer: ReadabilityExtractionConfig['sanitizer']
  rawPromptExecution: false
  approvedPlanSnapshot: true
  liveSearchAllowed: false
  publicWebExtractionAllowed: false
  browserCaptureAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: ReadabilityExtractionSafetyFlags
}

export interface LocalArticleFixtureResult {
  fixturePath: string
  title: ReadabilityExtractionConfig['fixtureTitle']
  sourceReferenceCount: 3
  articleParagraphCount: number
  clutterSections: string[]
  externalAssetCount: 0
  hasScriptTags: false
  hasIframes: false
  hasExternalImages: false
  hasRemoteFonts: false
  policyLabels: string[]
  sha256: string
  sizeBytes: number
}

export interface RawReadabilityExtraction {
  title: string
  byline?: string
  dir?: string
  lang?: string
  excerpt?: string
  textContent: string
  content: string
  length: number
  siteName?: string
  publishedTime?: string
  extractedAt: string
  fixtureMode: ReadabilityExtractionFixtureMode
  publicWebExtractionUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
  browserCaptureUsed: false
}

export interface SanitizedReadabilityExtraction {
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

export interface NormalizedReadabilityExtractionRecord {
  extractionId: string
  sourceId: string
  fixtureMode: ReadabilityExtractionFixtureMode
  title: string
  byline?: string
  excerpt?: string
  textContentPreview: string
  textLength: number
  wordCount: number
  language: string
  publishedTime?: string
  sanitizedHtmlPath: string
  textPath: string
  displaySafe: true
  generatedFixture: true
  publicWebExtractionUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
}

export interface ReadabilityExtractionArtifact {
  id: string
  kind: 'private_json' | 'private_html' | 'private_text'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ReadabilityExtractionArtifactManifest {
  runId: string
  fixtureMode: ReadabilityExtractionFixtureMode
  sourcePlan: 'generated_local_article_fixture'
  publicWebExtractionUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
  browserCaptureUsed: false
  readabilityVersion: string
  domImplementation: ReadabilityExtractionConfig['domImplementation']
  sanitizer: ReadabilityExtractionConfig['sanitizer']
  artifacts: ReadabilityExtractionArtifact[]
  warnings: string[]
  blockers: string[]
}

export interface ReadabilityExtractionQaGate {
  gateId: ReadabilityExtractionQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface ReadabilityExtractionQaSummary {
  status: 'passed' | 'blocked'
  gates: ReadabilityExtractionQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ReadabilityExtractionExecutionReport {
  ok: boolean
  phase: '49D'
  runId: string
  projectId: 'reeditpro'
  fixtureMode: ReadabilityExtractionFixtureMode
  planSnapshot: ApprovedReadabilityExtractionPlanSnapshot
  localFixture: LocalArticleFixtureResult
  rawExtraction?: RawReadabilityExtraction
  sanitizedExtraction?: SanitizedReadabilityExtraction
  normalizedRecord?: NormalizedReadabilityExtractionRecord
  artifactManifest?: ReadabilityExtractionArtifactManifest
  artifacts: ReadabilityExtractionArtifact[]
  qa: ReadabilityExtractionQaSummary
  phase49EReadiness: ReadabilityPhase49EReadiness
  safety: ReadabilityExtractionSafetyFlags & {
    liveSearchExecuted: false
    publicWebRequestMade: false
    publicWebExtractionUsed: false
    browserLaunched: false
    screenshotCaptured: false
    paidProviderCalled: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedReadabilityExtractionEvidence {
  phase: '49D'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  fixtureMode: ReadabilityExtractionFixtureMode
  localFixtureDescription: string
  rawExtractionUri?: string
  sanitizedExtractionUri?: string
  textExtractionUri?: string
  extractionMetadataUri?: string
  extractionManifestUri?: string
  qaReportUri?: string
  phase49dReportUri?: string
  phase49EReadiness: ReadabilityPhase49EReadiness
  blockers: string[]
  warnings: string[]
}

export interface ReadabilityExtractionReport {
  reportId: 'activation-phase-49d-readability-extraction-fixture'
  createdAt: string
  phase: '49D'
  status: ReadabilityExtractionFixtureStatus
  config: ReadabilityExtractionConfig
  approvedEvidence: ApprovedReadabilityExtractionEvidence
  executionReport?: ReadabilityExtractionExecutionReport
  qa: ReadabilityExtractionQaSummary
  phase49EReadiness: ReadabilityPhase49EReadiness
  blockers: string[]
  warnings: string[]
  liveSearchAllowed: false
  publicWebExtractionAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionLimitedToLocalFixture: true
  paidProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
}

export interface ReadabilityExtractionIamPlan {
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

export interface ReadabilityExtractionCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  allowedInPhase49D: boolean
  blockedReason?: string
}
