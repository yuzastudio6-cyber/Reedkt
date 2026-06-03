import type {
  SearchProviderCostAudit,
  SearchProviderSecretAudit,
  SearchProviderServiceAudit,
  SearchProviderStoragePolicyAudit,
} from '../search-provider-readiness'

export type WebSearchInternalBetaPhase =
  | '49A'
  | '49B'
  | '49C'
  | '49D'
  | '49E'
  | '49F'
  | '49G'
  | '49H'
  | '49I'
  | '49J'
  | '49K'
  | '49L'
  | '49M'
  | '49N'
  | '49O'

export type WebSearchInternalBetaStatus = 'planned' | 'completed' | 'blocked' | 'approval_review_complete'

export type WebSearchInternalBetaQaGateId =
  | 'phase_evidence_chain'
  | 'provider_readiness'
  | 'ui_api_gating'
  | 'regression_suite'
  | 'secret_safety'
  | 'cost_storage_policy'
  | 'artifact_privacy'
  | 'failure_policy'
  | 'readiness_docs_consistency'
  | 'blocked_features'

export interface WebSearchInternalBetaConfig {
  phase: '49P'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: 'web_search_internal_beta_candidate_gate'
  serviceName: 'reeditpro-staging-private-searxng'
  braveSecretName: 'BRAVE_SEARCH_API_KEY'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefixBase: 'activation-web-search/phase49p'
  canonicalPhase49NRunId: 'phase49n-20260603T18331'
  canonicalPhase49ORunId: 'phase49o-20260603T20311'
}

export interface WebSearchInternalBetaSafetyFlags {
  liveSearchAllowed: false
  braveApiCallAllowed: false
  publicSearxngInstanceAllowed: false
  paidProviderExpansionAllowed: false
  broadCrawlingAllowed: false
  arbitraryUrlCaptureAllowed: false
  browserCaptureAllowed: false
  sharpProcessingAllowed: false
  readabilityExtractionAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  secretValueAccessAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface WebSearchInternalBetaEnvValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaEvidencePhase {
  phase: WebSearchInternalBetaPhase
  status: WebSearchInternalBetaStatus
  runId?: string
  summary: string
  readiness: string
  artifactUris: string[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaEvidenceChain {
  generatedAt: string
  phases: WebSearchInternalBetaEvidencePhase[]
  phase49OScenarioCount: number
  phase49OScenariosPassed: number
  evidenceStatus: 'ready_for_internal_beta_candidate_gate' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaScopeManifest {
  runId: string
  phase: '49P'
  scope: 'controlled_internal_beta_candidate_only'
  allowedCapabilities: string[]
  blockedCapabilities: string[]
  defaultProvider: 'searxng'
  optionalProvider: 'brave_search'
  providerPolicy: {
    privateSearxngRequired: true
    publicSearxngAllowed: false
    braveEnabledByDefault: false
    braveRequiresSecretBudgetAndStoragePolicy: true
    otherPaidProvidersAllowed: false
  }
  capturePolicy: {
    allowlistedCaptureOnly: true
    arbitraryUrlCaptureAllowed: false
    broadCrawlingAllowed: false
    captchaLoginPaywallBypassAllowed: false
  }
  artifactPolicy: {
    privateGcsOnly: true
    publicArtifactsAllowed: false
    signedUrlSourceOfTruthAllowed: false
    rawBraveResponseStorageAllowed: false
    braveSnippetStorageAllowed: false
  }
  uiApiPolicy: {
    internalRoutesOnly: true
    mockOnlyControlledRunInPhase49I: true
    frontendSecretsAllowed: false
    frontendHeavyCaptureAllowed: false
  }
  safetyFlags: WebSearchInternalBetaSafetyFlags
  webSearchInternalBetaCandidateReady: boolean
  phase50AReadiness: 'ready_for_map_geospatial_stack_approval_and_architecture' | 'blocked_until_phase49p_passes'
}

export interface WebSearchInternalBetaProviderAudit {
  searxngDefaultReady: boolean
  braveOptionalReady: boolean
  hybridConsensusReady: boolean
  disabledProviderIds: string[]
  serviceAudit: SearchProviderServiceAudit
  secretAudit: SearchProviderSecretAudit
  costAudit: SearchProviderCostAudit
  storagePolicyAudit: SearchProviderStoragePolicyAudit
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaUiApiAudit {
  phase49IEvidenceReady: boolean
  serverRoutesMounted: boolean
  apiRouteMetadataPresent: boolean
  requestValidatorPresent: boolean
  chatNativeGateCardPresent: boolean
  runControlledGateOnly: boolean
  frontendSecretExposureDetected: false
  frontendHeavyCaptureDetected: false
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaRegressionAudit {
  phase49ORunId: 'phase49o-20260603T20311'
  canonicalEvidenceReady: boolean
  scenarioCount: number
  passedCount: number
  failedCount: number
  failClosedVerified: boolean
  apiUiRegressionPassed: boolean
  productionBetaBlockingPassed: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaArtifactAuditEntry {
  artifactId: string
  phase: WebSearchInternalBetaPhase
  gcsUri: string
  required: boolean
  exists?: boolean
  privateOnly?: boolean
  blocker?: string
  warning?: string
}

export interface WebSearchInternalBetaArtifactAudit {
  entries: WebSearchInternalBetaArtifactAuditEntry[]
  privateGcsOnly: boolean
  signedUrlSourceOfTruthDetected: false
  publicArtifactDetected: false
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaFailurePolicy {
  failClosed: true
  noLiveSearchFallback: true
  noPublicSearxngFallback: true
  noPaidProviderExpansionFallback: true
  noArbitraryCaptureFallback: true
  noBrowserProviderFallback: true
  noPublicArtifactFallback: true
  noProductionBetaUnlock: true
  failureModes: Array<{
    failureId: string
    behavior: 'block_internal_beta_candidate' | 'degrade_to_internal_searxng_only' | 'defer_to_future_phase'
    summary: string
  }>
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaCommandPlan {
  commandId: string
  description: string
  allowedInPhase49P: boolean
  requiresConfirmation: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface WebSearchInternalBetaIamPlanEntry {
  bindingId: string
  role: string
  member: string
  bucket: string
  prefix: string
  condition: string
  requiredForExecution: boolean
  broadAccess: false
}

export interface WebSearchInternalBetaQaGate {
  gateId: WebSearchInternalBetaQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchInternalBetaQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchInternalBetaQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaArtifact {
  artifactId: string
  gcsUri: string
  contentType: 'private_json'
}

export interface WebSearchInternalBetaExecutionReport {
  runId: string
  ok: boolean
  createdAt: string
  config: WebSearchInternalBetaConfig
  evidenceChain: WebSearchInternalBetaEvidenceChain
  scopeManifest: WebSearchInternalBetaScopeManifest
  providerAudit: WebSearchInternalBetaProviderAudit
  uiApiAudit: WebSearchInternalBetaUiApiAudit
  regressionAudit: WebSearchInternalBetaRegressionAudit
  artifactAudit: WebSearchInternalBetaArtifactAudit
  failurePolicy: WebSearchInternalBetaFailurePolicy
  qa: WebSearchInternalBetaQaSummary
  artifacts: WebSearchInternalBetaArtifact[]
  webSearchInternalBetaCandidateReady: boolean
  phase50AReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalBetaReport {
  reportId: 'activation-phase-49p-web-search-internal-beta-candidate'
  createdAt: string
  phase: '49P'
  status: 'planned' | 'completed' | 'blocked'
  config: WebSearchInternalBetaConfig
  executionReport?: WebSearchInternalBetaExecutionReport
  evidenceChain: WebSearchInternalBetaEvidenceChain
  scopeManifest: WebSearchInternalBetaScopeManifest
  providerAudit: WebSearchInternalBetaProviderAudit
  uiApiAudit: WebSearchInternalBetaUiApiAudit
  regressionAudit: WebSearchInternalBetaRegressionAudit
  artifactAudit: WebSearchInternalBetaArtifactAudit
  failurePolicy: WebSearchInternalBetaFailurePolicy
  qa: WebSearchInternalBetaQaSummary
  safetyFlags: WebSearchInternalBetaSafetyFlags
  webSearchInternalBetaCandidateReady: boolean
  phase50AReadiness: string
  blockers: string[]
  warnings: string[]
}
