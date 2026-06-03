export type WebSearchUiApiGatingPhase = '49I'

export type WebSearchUiApiGatingStatus = 'planned' | 'completed' | 'blocked'

export type WebSearchUiApiProviderMode = 'private_fixture_provider'

export type WebSearchUiApiQaGateId =
  | 'phase49h_evidence'
  | 'api_route_gating'
  | 'request_validation'
  | 'provider_gate_integrity'
  | 'ui_scope_integrity'
  | 'frontend_secret_safety'
  | 'no_live_search_or_capture'
  | 'artifact_privacy'
  | 'docs_scripts_consistency'
  | 'blocked_features'

export interface WebSearchUiApiGatingConfig {
  phase: WebSearchUiApiGatingPhase
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: 'web_search_capture_ui_api_gating'
  serviceName: 'reeditpro-staging-private-searxng'
  canonicalPhase49HRunId: 'phase49h-20260603T020009'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefixBase: 'activation-web-search/phase49i'
}

export interface WebSearchUiApiGatingSafetyFlags {
  internalApiRoutesAllowed: true
  internalUxGateAllowed: true
  privateFixtureProviderModeAllowed: true
  liveSearchAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  screenshotProcessingAllowed: false
  paidProviderAllowed: false
  publicSearxngInstanceAllowed: false
  providerFallbackAllowed: false
  arbitraryUrlCaptureAllowed: false
  broadCrawlingAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  frontendSecretsAllowed: false
  frontendHeavyExecutionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface WebSearchUiApiEnvValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiRequest {
  workspaceId?: string
  projectId?: string
  query: string
  providerMode: WebSearchUiApiProviderMode
  maxResults: number
  maxCapturePages: 0
  mockOnly: true
  rawPromptExecution: false
  paidProvidersAllowed: false
  publicSearxngAllowed: false
  arbitraryUrlCaptureAllowed: false
  broadCrawlingAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  frontendExecutionRequested: false
  browserExecutionRequested: false
  liveSearchRequested: false
  captureRequested: false
  extractionRequested: false
}

export interface WebSearchUiApiValidationResult {
  ok: boolean
  request?: WebSearchUiApiRequest
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiPlanSnapshot {
  planId: string
  phase: WebSearchUiApiGatingPhase
  provider: 'searxng'
  providerMode: WebSearchUiApiProviderMode
  serviceName: string
  query: string
  maxResults: number
  maxCapturePages: 0
  apiGateOnly: true
  liveSearchAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  paidProvidersAllowed: false
  publicSearxngAllowed: false
  arbitraryUrlCaptureAllowed: false
  publicArtifactsAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptExecution: false
  approvedPlanSnapshot: true
  createdAt: string
}

export interface WebSearchUiApiRouteGate {
  routeId: string
  method: 'GET' | 'POST'
  path: string
  authenticated: true
  internalOnly: true
  liveSearchAllowed: false
  browserCaptureAllowed: false
  paidProvidersAllowed: false
  publicSearxngAllowed: false
  status: 'enabled_gate_only'
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiRouteAudit {
  routes: WebSearchUiApiRouteGate[]
  allRoutesGateOnly: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiRunEnvelope {
  runId: string
  status: 'accepted_gate_only'
  planSnapshot: WebSearchUiApiPlanSnapshot
  apiExecuted: true
  liveSearchExecuted: false
  browserCaptureExecuted: false
  readabilityExtractionExecuted: false
  paidProviderUsed: false
  publicSearxngUsed: false
  arbitraryUrlCaptureUsed: false
  artifactUploadPlannedOnly: true
  warnings: string[]
}

export interface WebSearchUiApiUxState {
  cardId: 'web_search_capture_gate'
  title: 'Web search/capture gate'
  phase: WebSearchUiApiGatingPhase
  internalUxReady: boolean
  status: 'ready_internal_gate_only' | 'blocked'
  defaultProvider: 'searxng'
  providerMode: WebSearchUiApiProviderMode
  privateSearxngService: string
  allowedControls: string[]
  blockedControls: string[]
  boundedLimits: {
    maxResults: number
    maxCapturePages: 0
  }
  frontendSecretSafe: boolean
  frontendHeavyExecutionAllowed: false
  warnings: string[]
  blockers: string[]
}

export interface WebSearchUiApiCommandPlan {
  commandId: string
  description: string
  allowedInPhase49I: boolean
  requiresConfirmation: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface WebSearchUiApiIamPlanEntry {
  bindingId: string
  role: string
  member: string
  bucket: string
  prefix: string
  condition: string
  requiredForExecution: boolean
  broadAccess: false
}

export interface WebSearchUiApiQaGate {
  gateId: WebSearchUiApiQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchUiApiQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchUiApiQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiArtifact {
  artifactId: string
  gcsUri: string
  contentType: 'private_json'
}

export interface WebSearchUiApiExecutionReport {
  runId: string
  ok: boolean
  createdAt: string
  config: WebSearchUiApiGatingConfig
  phase49HEvidence: {
    runId?: string
    status: string
    ready: boolean
    phase49hReportUri?: string
    blockers: string[]
    warnings: string[]
  }
  routeAudit: WebSearchUiApiRouteAudit
  requestValidation: WebSearchUiApiValidationResult
  planSnapshot: WebSearchUiApiPlanSnapshot
  runEnvelope: WebSearchUiApiRunEnvelope
  uxState: WebSearchUiApiUxState
  qa: WebSearchUiApiQaSummary
  artifacts: WebSearchUiApiArtifact[]
  phase49JReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface ApprovedWebSearchUiApiGatingEvidence {
  phase: WebSearchUiApiGatingPhase
  status: WebSearchUiApiGatingStatus
  runId?: string
  phase49HRunId: string
  privateSearxngService: string
  internalApiRoutesReady: boolean
  internalUxGateReady: boolean
  phase49JReadiness: string
  planSnapshotUri?: string
  routeGateAuditUri?: string
  requestValidationUri?: string
  uxStateUri?: string
  qaReportUri?: string
  phase49iReportUri?: string
  blockers: string[]
  warnings: string[]
}

export interface WebSearchUiApiGatingReport {
  reportId: 'activation-phase-49i-web-search-ui-api-gating'
  createdAt: string
  phase: WebSearchUiApiGatingPhase
  status: WebSearchUiApiGatingStatus
  config: WebSearchUiApiGatingConfig
  approvedEvidence: ApprovedWebSearchUiApiGatingEvidence
  executionReport?: WebSearchUiApiExecutionReport
  routeAudit: WebSearchUiApiRouteAudit
  requestValidation: WebSearchUiApiValidationResult
  planSnapshot: WebSearchUiApiPlanSnapshot
  runEnvelope: WebSearchUiApiRunEnvelope
  uxState: WebSearchUiApiUxState
  qa: WebSearchUiApiQaSummary
  internalApiRoutesReady: boolean
  internalUxGateReady: boolean
  phase49JReadiness: string
  blockers: string[]
  warnings: string[]
  safetyFlags: WebSearchUiApiGatingSafetyFlags
}
