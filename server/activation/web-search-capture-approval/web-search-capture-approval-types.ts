export type WebSearchCaptureApprovalStatus = 'approval_review_complete' | 'blocked_pending_evidence' | 'blocked_all'

export type WebSearchCaptureToolId =
  | 'searxng'
  | 'playwright'
  | 'sharp'
  | 'mozilla-readability'
  | 'brave-search-api'
  | 'tavily'
  | 'exa'
  | 'firecrawl'
  | 'browserless-browserbase'

export type WebSearchCaptureQaGateId =
  | 'tool_evidence'
  | 'license_review'
  | 'free_open_source_default'
  | 'paid_provider_disabled'
  | 'frontend_secret_safety'
  | 'no_live_search'
  | 'no_browser_execution'
  | 'no_public_artifacts'
  | 'risk_register_complete'
  | 'future_scope_defined'
  | 'package_scripts_present'
  | 'blocked_features'

export type WebSearchCaptureRiskSeverity = 'blocker' | 'warning'

export interface WebSearchCaptureApprovalConfig {
  phase: '49A'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'web_search_capture_approval_static'
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
}

export interface WebSearchToolEvidence {
  toolId: WebSearchCaptureToolId
  displayName: string
  role: string
  category:
    | 'free_open_source_search_infrastructure'
    | 'browser_automation_capture'
    | 'image_processing'
    | 'html_article_extraction'
    | 'optional_paid_provider'
  defaultStack: boolean
  optionalPaidProvider: boolean
  disabledByDefault: boolean
  requiresSecret: boolean
  notOpenSourceDefault: boolean
  notRequiredForInitialInternalTesting: boolean
  providerAllowed: false
  futureApprovalRequired: boolean
  sourceUrls: string[]
  license: string
  licenseStatus: 'clear_for_planning' | 'review_required_before_runtime'
  approvedPlanningUses: string[]
  runtimeNotes: string[]
  limitations: string[]
}

export interface WebSearchLicenseReview {
  toolId: WebSearchCaptureToolId
  license: string
  sourceEvidenceUrl: string
  planningDecision: 'approved_for_staging_planning' | 'disabled_pending_future_approval'
  runtimeDecision: 'blocked_in_phase49a'
  notes: string[]
}

export interface WebSearchProviderScope {
  searxngPlanningAllowed: boolean
  playwrightPlanningAllowed: boolean
  sharpPlanningAllowed: boolean
  readabilityPlanningAllowed: boolean
  liveSearchAllowed: false
  browserCaptureAllowed: false
  screenshotProcessingAllowed: false
  readabilityExtractionAllowed: false
  braveSearchAllowed: false
  tavilyAllowed: false
  exaAllowed: false
  firecrawlAllowed: false
  hostedBrowserAllowed: false
  providerAllowed: false
  frontendHoldsSearchSecrets: false
  frontendRunsHeavyBrowserAutomation: false
  workerExecutesRawChat: false
  approvedPlanSnapshotsRequired: true
  publicArtifactAllowed: false
  signedUrlsAsSourceOfTruthAllowed: false
  captchaBypassAllowed: false
  loginBypassAllowed: false
  paywallBypassAllowed: false
  robotsTermsBypassAllowed: false
}

export interface WebSearchRisk {
  riskId: string
  severity: WebSearchCaptureRiskSeverity
  currentStatus: 'blocked_by_policy' | 'warning_tracked'
  mitigation: string
  evidenceRequiredToClear: string
}

export interface WebSearchFuturePhase {
  phaseId: '49B' | '49C' | '49D' | '49E' | '49F'
  title: string
  scope: string[]
  allowed: boolean
  blockedInPhase49A: true
}

export interface WebSearchCommandPlan {
  commandId: string
  phase: '49B' | '49C' | '49D' | '49E' | '49F'
  purpose: string
  textOnlyByDefault: true
  allowedInPhase49A: false
  blockedReason: string
  executableCommand: null
  commandText: string
}

export interface WebSearchCaptureQaGate {
  gateId: WebSearchCaptureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchCaptureQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchCaptureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchCaptureApprovalReport {
  reportId: 'activation-phase-49a-web-search-capture-approval'
  createdAt: string
  phase: '49A'
  status: WebSearchCaptureApprovalStatus
  config: WebSearchCaptureApprovalConfig
  tools: WebSearchToolEvidence[]
  licenseReviews: WebSearchLicenseReview[]
  providerScope: WebSearchProviderScope
  risks: WebSearchRisk[]
  futureScope: WebSearchFuturePhase[]
  commandPlans: WebSearchCommandPlan[]
  codexDecision: 'staging_planning_approved_free_open_source_default'
  recommendedPhase49BPath: string
  phase49BReadiness: 'ready_for_private_generated_fixture_planning_only' | 'blocked'
  qa: WebSearchCaptureQaSummary
  blockers: string[]
  warnings: string[]
  searxngPlanningAllowed: boolean
  playwrightPlanningAllowed: boolean
  sharpPlanningAllowed: boolean
  readabilityPlanningAllowed: boolean
  liveSearchAllowed: false
  browserCaptureAllowed: false
  paidProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}
