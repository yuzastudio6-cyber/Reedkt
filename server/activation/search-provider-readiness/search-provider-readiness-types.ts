export type SearchProviderReadinessPhase =
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

export type SearchProviderReadinessStatus = 'completed' | 'blocked' | 'planned' | 'approval_review_complete'

export type SearchProviderReadinessQaGateId =
  | 'phase_evidence_chain'
  | 'searxng_default_ready'
  | 'brave_optional_ready'
  | 'hybrid_consensus_ready'
  | 'secret_safety'
  | 'cost_policy'
  | 'storage_policy'
  | 'provider_registry'
  | 'failure_policy'
  | 'artifact_privacy'
  | 'blocked_features'

export interface SearchProviderReadinessConfig {
  phase: '49N'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: 'search_provider_readiness_gate'
  serviceName: 'reeditpro-staging-private-searxng'
  braveSecretName: 'BRAVE_SEARCH_API_KEY'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefixBase: 'activation-web-search/phase49n'
  canonicalPhase49MRunId: 'phase49m-20260603T17105'
}

export interface SearchProviderReadinessSafetyFlags {
  liveSearchDuringPhase49N: false
  braveApiCallDuringPhase49N: false
  browserCaptureDuringPhase49N: false
  sharpProcessingDuringPhase49N: false
  readabilityExtractionDuringPhase49N: false
  publicSearxngInstanceAllowed: false
  otherPaidProvidersAllowed: false
  paidProviderExpansionAllowed: false
  broadCrawlingAllowed: false
  arbitraryUrlCaptureAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface SearchProviderReadinessEnvValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderPhaseEvidence {
  phase: SearchProviderReadinessPhase
  status: SearchProviderReadinessStatus
  runId?: string
  summary: string
  readiness: string
  artifactUris: string[]
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderEvidenceChain {
  generatedAt: string
  phases: SearchProviderPhaseEvidence[]
  searchProviderStackStatus: 'ready_for_controlled_internal_testing' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderScopeManifest {
  runId: string
  phase: '49N'
  scope: 'search_provider_controlled_internal_testing_readiness'
  defaultProvider: 'searxng'
  optionalProviders: Array<'brave_search'>
  disabledProviders: Array<'tavily' | 'exa' | 'firecrawl' | 'browserless' | 'browserbase' | 'public_searxng'>
  allowedModes: Array<'searxng_only' | 'searxng_with_brave_fallback' | 'hybrid_consensus' | 'brave_only_diagnostic'>
  blockedModes: Array<'public_searxng' | 'arbitrary_url_capture' | 'broad_crawling' | 'paid_provider_expansion'>
  secretPolicy: string
  costPolicy: string
  storagePolicy: string
  capturePolicy: string
  readinessDecision: 'ready_for_controlled_internal_testing' | 'blocked'
  searxngInternalReady: boolean
  braveOptionalFallbackReady: boolean
  hybridConsensusReady: boolean
  safetyFlags: SearchProviderReadinessSafetyFlags
}

export interface SearchProviderRegistryAudit {
  defaultProvider: 'searxng'
  searxng: {
    defaultProvider: true
    freeOpenSource: true
    internalTestingAllowed: boolean
    privateServiceRequired: true
    serviceName: string
  }
  braveSearch: {
    optionalFallback: true
    paidProvider: true
    enabledByDefault: false
    requiresSecret: true
    requiresBudget: true
    rawStorageAllowed: false
    snippetStorageAllowed: false
  }
  disabledPaidProviders: Array<{
    providerId: string
    enabled: false
    futureOptional: true
    requiredForInternalTesting: false
  }>
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderSecretAudit {
  secretName: 'BRAVE_SEARCH_API_KEY'
  projectId: 'reeditpro'
  checkedWithoutAccessingValue: true
  secretExists: boolean
  enabledVersionPresent: boolean
  approvedServiceAccounts: string[]
  approvedServiceAccountsHaveAccess: boolean
  missingApprovedServiceAccounts: string[]
  allUsersPresent: boolean
  allAuthenticatedUsersPresent: boolean
  broadAccessDetected: boolean
  secretValueAccessed: false
  secretValuePrinted: false
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderCostAudit {
  braveEnabledByDefault: false
  defaultDailyLimit: 0
  defaultMonthlyBudgetUsd: 0
  futureMaxResults: 5
  futureMaxQueriesPerRun: 1
  unboundedUsageAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderStoragePolicyAudit {
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  requestHeaderStorageAllowed: false
  apiKeyStorageAllowed: false
  normalizedMetadataAllowed: true
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderFailurePolicy {
  failClosed: true
  noFallbackToPublicSearxng: true
  noAutomaticBraveFallback: true
  noFallbackToOtherPaidProviders: true
  noFallbackToArbitraryCapture: true
  noSignedUrlSourceOfTruth: true
  failureModes: Array<{
    failureId: string
    behavior: 'block_readiness' | 'continue_searxng_only_with_warning' | 'defer_to_future_phase'
    summary: string
  }>
}

export interface SearchProviderServiceAudit {
  serviceName: string
  exists: boolean
  projectId: string
  region: string
  serviceUrlRedacted: string
  image?: string
  serviceAccountEmail?: string
  ingress?: string
  maxScale?: string
  cpuLimit?: string
  memoryLimit?: string
  gpuDetected: boolean
  modelWeightsDetected: boolean
  allUsersPresent: boolean
  allAuthenticatedUsersPresent: boolean
  invokerMembers: string[]
  publicUnauthenticatedAccess: boolean
  metadataSource: 'cloud_run_metadata_only' | 'not_checked'
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderArtifactVerificationEntry {
  artifactId: string
  phase: SearchProviderReadinessPhase
  gcsUri: string
  required: boolean
  exists?: boolean
  privateOnly?: boolean
  blocker?: string
  warning?: string
}

export interface SearchProviderReadinessCommandPlan {
  commandId: string
  description: string
  allowedInPhase49N: boolean
  requiresConfirmation: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface SearchProviderReadinessIamPlanEntry {
  bindingId: string
  role: string
  member: string
  bucket: string
  prefix: string
  condition: string
  requiredForExecution: boolean
  broadAccess: false
}

export interface SearchProviderReadinessQaGate {
  gateId: SearchProviderReadinessQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface SearchProviderReadinessQaSummary {
  status: 'passed' | 'blocked'
  gates: SearchProviderReadinessQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderReadinessArtifact {
  artifactId: string
  gcsUri: string
  contentType: 'private_json'
}

export interface SearchProviderReadinessExecutionReport {
  runId: string
  ok: boolean
  createdAt: string
  config: SearchProviderReadinessConfig
  evidenceChain: SearchProviderEvidenceChain
  scopeManifest: SearchProviderScopeManifest
  providerRegistryAudit: SearchProviderRegistryAudit
  serviceAudit: SearchProviderServiceAudit
  secretAudit: SearchProviderSecretAudit
  costAudit: SearchProviderCostAudit
  storagePolicyAudit: SearchProviderStoragePolicyAudit
  failurePolicy: SearchProviderFailurePolicy
  artifactVerification: SearchProviderArtifactVerificationEntry[]
  qa: SearchProviderReadinessQaSummary
  artifacts: SearchProviderReadinessArtifact[]
  searchProviderInternalTestingReady: boolean
  phase49OReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface SearchProviderReadinessReport {
  reportId: 'activation-phase-49n-search-provider-readiness-gate'
  createdAt: string
  phase: '49N'
  status: 'completed' | 'blocked' | 'planned'
  config: SearchProviderReadinessConfig
  executionReport?: SearchProviderReadinessExecutionReport
  evidenceChain: SearchProviderEvidenceChain
  scopeManifest: SearchProviderScopeManifest
  providerRegistryAudit: SearchProviderRegistryAudit
  serviceAudit: SearchProviderServiceAudit
  secretAudit: SearchProviderSecretAudit
  costAudit: SearchProviderCostAudit
  storagePolicyAudit: SearchProviderStoragePolicyAudit
  failurePolicy: SearchProviderFailurePolicy
  artifactVerification: SearchProviderArtifactVerificationEntry[]
  qa: SearchProviderReadinessQaSummary
  searchProviderInternalTestingReady: boolean
  phase49OReadiness: string
  blockers: string[]
  warnings: string[]
  safetyFlags: SearchProviderReadinessSafetyFlags
}
