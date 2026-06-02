export type PlaywrightSharpCaptureFixtureStatus = 'planned' | 'completed' | 'blocked'
export type PlaywrightSharpCaptureFixtureMode = 'generated_local_html_capture'
export type PlaywrightSharpPhase49DReadiness = 'ready_for_readability_extraction_fixture' | 'blocked_pending_phase49c_execution' | 'blocked'

export type PlaywrightSharpCaptureQaGateId =
  | 'phase49b_evidence'
  | 'local_fixture_integrity'
  | 'playwright_capture'
  | 'sharp_processing'
  | 'artifact_manifest'
  | 'artifact_privacy'
  | 'blocked_features'

export interface PlaywrightSharpCaptureConfig {
  phase: '49C'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  fixtureMode: PlaywrightSharpCaptureFixtureMode
  fixtureTitle: 'ReeditPro internal web search capture fixture'
  approvedPhase49BRunId: 'phase49b-20260602T01332'
  approvedPhase49BSourceManifestUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  viewport: {
    width: 1366
    height: 768
    deviceScaleFactor: 1
  }
  previewMaxWidth: 1280
  thumbnailWidth: 320
}

export interface PlaywrightSharpCaptureSafetyFlags {
  localOnlyCaptureAllowed: true
  browserCaptureLimitedToLocalFixture: true
  publicWebCaptureAllowed: false
  liveSearchAllowed: false
  paidProvidersAllowed: false
  readabilityExtractionAllowed: false
  sharpProcessingAllowedForGeneratedScreenshot: true
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface ApprovedPlaywrightSharpCapturePlanSnapshot {
  planId: 'phase49c-playwright-sharp-generated-local-capture-plan'
  phase49CRunId: string
  fixtureMode: PlaywrightSharpCaptureFixtureMode
  approvedPhase49BRunId: PlaywrightSharpCaptureConfig['approvedPhase49BRunId']
  approvedPhase49BSourceManifestUri: string
  browser: 'chromium'
  captureUrlType: 'local_fixture_file_url'
  viewport: PlaywrightSharpCaptureConfig['viewport']
  previewMaxWidth: number
  thumbnailWidth: number
  rawPromptExecution: false
  approvedPlanSnapshot: true
  liveSearchAllowed: false
  publicWebCaptureAllowed: false
  paidProviderAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: PlaywrightSharpCaptureSafetyFlags
}

export interface LocalHtmlFixtureResult {
  fixturePath: string
  title: PlaywrightSharpCaptureConfig['fixtureTitle']
  sourceCardCount: 3
  externalAssetCount: 0
  hasScriptTags: false
  hasIframes: false
  hasExternalImages: false
  hasRemoteFonts: false
  policyLabels: string[]
  sha256: string
  sizeBytes: number
}

export interface PlaywrightCaptureMetadata {
  browser: 'chromium'
  urlType: 'local_fixture'
  fixtureUrl: string
  pageTitle: string
  viewport: PlaywrightSharpCaptureConfig['viewport']
  screenshotPath: string
  fullPage: true
  publicWebCaptureUsed: false
  publicNetworkRequests: string[]
  capturedAt: string
  dom: {
    h1: string
    sourceCardCount: number
    policyLabelCount: number
  }
  screenshotDimensions: {
    width: number
    height: number
  }
}

export interface SharpProcessedArtifact {
  path: string
  width: number
  height: number
  sizeBytes: number
  sha256: string
}

export interface SharpPostprocessMetadata {
  inputPath: string
  original: {
    width: number
    height: number
    format: string
    sizeBytes: number
    sha256: string
  }
  preview: SharpProcessedArtifact
  thumbnail: SharpProcessedArtifact
  processedAt: string
  remoteImagesFetched: false
}

export interface PlaywrightSharpCaptureArtifact {
  id: string
  kind: 'private_json' | 'private_png' | 'private_html'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface CaptureArtifactManifest {
  runId: string
  fixtureMode: PlaywrightSharpCaptureFixtureMode
  sourcePlan: 'generated_fixture'
  publicWebCaptureUsed: false
  liveSearchUsed: false
  paidProviderUsed: false
  readabilityExtractionUsed: false
  playwright: PlaywrightCaptureMetadata
  sharp: SharpPostprocessMetadata
  artifacts: PlaywrightSharpCaptureArtifact[]
  warnings: string[]
  blockers: string[]
}

export interface PlaywrightSharpCaptureQaGate {
  gateId: PlaywrightSharpCaptureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface PlaywrightSharpCaptureQaSummary {
  status: 'passed' | 'blocked'
  gates: PlaywrightSharpCaptureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface PlaywrightSharpCaptureExecutionReport {
  ok: boolean
  phase: '49C'
  runId: string
  projectId: 'reeditpro'
  fixtureMode: PlaywrightSharpCaptureFixtureMode
  planSnapshot: ApprovedPlaywrightSharpCapturePlanSnapshot
  localFixture: LocalHtmlFixtureResult
  playwrightCapture?: PlaywrightCaptureMetadata
  sharpProcessing?: SharpPostprocessMetadata
  artifactManifest?: CaptureArtifactManifest
  artifacts: PlaywrightSharpCaptureArtifact[]
  qa: PlaywrightSharpCaptureQaSummary
  phase49DReadiness: PlaywrightSharpPhase49DReadiness
  safety: PlaywrightSharpCaptureSafetyFlags & {
    liveSearchExecuted: false
    publicWebRequestMade: false
    publicBrowserCaptureUsed: false
    paidProviderCalled: false
    readabilityExtractionRun: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlaywrightSharpCaptureEvidence {
  phase: '49C'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  fixtureMode: PlaywrightSharpCaptureFixtureMode
  localFixtureDescription: string
  playwrightBrowser?: 'chromium'
  viewport?: PlaywrightSharpCaptureConfig['viewport']
  originalScreenshotUri?: string
  previewScreenshotUri?: string
  thumbnailScreenshotUri?: string
  captureManifestUri?: string
  qaReportUri?: string
  phase49cReportUri?: string
  phase49DReadiness: PlaywrightSharpPhase49DReadiness
  blockers: string[]
  warnings: string[]
}

export interface PlaywrightSharpCaptureReport {
  reportId: 'activation-phase-49c-playwright-sharp-capture-fixture'
  createdAt: string
  phase: '49C'
  status: PlaywrightSharpCaptureFixtureStatus
  config: PlaywrightSharpCaptureConfig
  approvedEvidence: ApprovedPlaywrightSharpCaptureEvidence
  executionReport?: PlaywrightSharpCaptureExecutionReport
  qa: PlaywrightSharpCaptureQaSummary
  phase49DReadiness: PlaywrightSharpPhase49DReadiness
  blockers: string[]
  warnings: string[]
  liveSearchAllowed: false
  publicWebCaptureAllowed: false
  browserCaptureLimitedToLocalFixture: true
  readabilityExtractionAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
}

export interface PlaywrightSharpCaptureIamPlan {
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

export interface PlaywrightSharpCaptureCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}
