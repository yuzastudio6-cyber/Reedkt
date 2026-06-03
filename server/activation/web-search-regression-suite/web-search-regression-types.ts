export type WebSearchRegressionPhase = '49O'

export type WebSearchRegressionStatus = 'planned' | 'completed' | 'blocked'

export type WebSearchRegressionScenarioCategory =
  | 'success_baseline'
  | 'provider_blocking'
  | 'brave_policy'
  | 'searxng_policy'
  | 'capture_policy'
  | 'browser_capture_failure'
  | 'sharp_failure'
  | 'readability_failure'
  | 'artifact_privacy'
  | 'production_beta'
  | 'api_ui_gating'

export type WebSearchRegressionScenarioId =
  | 'searxng_default_provider_scope'
  | 'hybrid_consensus_evidence_present'
  | 'paid_provider_tavily_rejected'
  | 'paid_provider_exa_rejected'
  | 'paid_provider_firecrawl_rejected'
  | 'hosted_browser_provider_rejected'
  | 'brave_missing_secret_disables_provider'
  | 'brave_budget_zero_blocks_execution'
  | 'brave_raw_storage_rejected'
  | 'brave_snippet_storage_rejected'
  | 'public_searxng_instance_rejected'
  | 'private_searxng_required'
  | 'arbitrary_url_capture_rejected'
  | 'non_allowlisted_capture_domain_rejected'
  | 'unsafe_url_scheme_rejected'
  | 'redirect_to_non_allowlisted_domain_rejected'
  | 'playwright_timeout_records_failure'
  | 'playwright_no_login_captcha_bypass'
  | 'sharp_invalid_image_failure'
  | 'readability_empty_article_failure'
  | 'public_artifact_request_rejected'
  | 'signed_url_source_of_truth_rejected'
  | 'production_ready_flag_rejected'
  | 'external_beta_flag_rejected'
  | 'internal_api_rejects_blocked_provider'
  | 'internal_api_rejects_arbitrary_capture'

export type WebSearchRegressionScenarioOutcome = 'pass' | 'fail_closed'

export type WebSearchRegressionQaGateId =
  | 'phase49n_evidence'
  | 'provider_failure_modes'
  | 'capture_failure_modes'
  | 'browser_processing_failure_modes'
  | 'artifact_privacy_failures'
  | 'api_ui_gating_regression'
  | 'production_beta_blocking'
  | 'fail_closed_integrity'
  | 'artifact_privacy'

export interface WebSearchRegressionConfig {
  phase: WebSearchRegressionPhase
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: 'web_search_regression_failure_suite'
  canonicalPhase49NRunId: 'phase49n-20260603T18331'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefixBase: 'activation-web-search/phase49o'
}

export interface WebSearchRegressionSafetyFlags {
  liveSearchAllowed: false
  braveApiCallAllowed: false
  publicSearxngInstanceAllowed: false
  otherPaidProvidersAllowed: false
  browserLaunchAllowed: false
  publicBrowserCaptureAllowed: false
  readabilityLiveExtractionAllowed: false
  broadCrawlingAllowed: false
  arbitraryUrlCaptureAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  secretValueAccessAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface WebSearchRegressionEnvValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchRegressionScenario {
  scenarioId: WebSearchRegressionScenarioId
  category: WebSearchRegressionScenarioCategory
  input: Record<string, unknown>
  expectedResult: WebSearchRegressionScenarioOutcome
  actualResult: WebSearchRegressionScenarioOutcome
  passed: boolean
  failureMode: string
  safetyImpact: string
  artifactsGenerated: false
  notes: string[]
}

export interface WebSearchRegressionMatrix {
  generatedAt: string
  scenarioCount: number
  passedCount: number
  failedCount: number
  scenarios: WebSearchRegressionScenario[]
  summaryByCategory: Array<{
    category: WebSearchRegressionScenarioCategory
    scenarioCount: number
    passedCount: number
    failedCount: number
  }>
  blockers: string[]
  warnings: string[]
}

export interface WebSearchPhase49NEvidence {
  runId: 'phase49n-20260603T18331'
  status: 'verified' | 'not_verified'
  readinessReportUri: string
  readinessManifestUri: string
  gcsVerified: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchRegressionCommandPlan {
  commandId: string
  description: string
  allowedInPhase49O: boolean
  requiresConfirmation: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface WebSearchRegressionIamPlanEntry {
  bindingId: string
  role: string
  member: string
  bucket: string
  prefix: string
  condition: string
  requiredForExecution: boolean
  broadAccess: false
}

export interface WebSearchRegressionQaGate {
  gateId: WebSearchRegressionQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchRegressionQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchRegressionQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchRegressionArtifact {
  artifactId: string
  gcsUri: string
  contentType: 'private_json'
}

export interface WebSearchFailClosedPolicyVerification {
  failClosed: true
  noLiveProviderFallback: true
  noPublicSearxngFallback: true
  noOtherPaidProviderFallback: true
  noArbitraryCaptureFallback: true
  noSignedUrlSourceOfTruth: true
  noProductionBetaUnlock: true
  scenarioCount: number
  unsafeScenarioFailures: number
  blockers: string[]
  warnings: string[]
}

export interface WebSearchRegressionExecutionReport {
  runId: string
  ok: boolean
  createdAt: string
  config: WebSearchRegressionConfig
  phase49nEvidence: WebSearchPhase49NEvidence
  matrix: WebSearchRegressionMatrix
  failClosedPolicy: WebSearchFailClosedPolicyVerification
  qa: WebSearchRegressionQaSummary
  artifacts: WebSearchRegressionArtifact[]
  phase49PReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface WebSearchRegressionReport {
  reportId: 'activation-phase-49o-web-search-regression-suite'
  createdAt: string
  phase: '49O'
  status: WebSearchRegressionStatus
  config: WebSearchRegressionConfig
  executionReport?: WebSearchRegressionExecutionReport
  phase49nEvidence: WebSearchPhase49NEvidence
  matrix: WebSearchRegressionMatrix
  failClosedPolicy: WebSearchFailClosedPolicyVerification
  qa: WebSearchRegressionQaSummary
  safetyFlags: WebSearchRegressionSafetyFlags
  phase49PReadiness: string
  blockers: string[]
  warnings: string[]
}
