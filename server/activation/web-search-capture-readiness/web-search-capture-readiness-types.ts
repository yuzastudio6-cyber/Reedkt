export type WebSearchReadinessPhase = '49A' | '49B' | '49C' | '49D' | '49E' | '49F' | '49G' | '49H'

export type WebSearchReadinessStatus = 'completed' | 'blocked' | 'planned' | 'approval_review_complete'

export type WebSearchReadinessQaGateId =
  | 'phase_evidence_chain'
  | 'private_searxng_ready'
  | 'provider_scope_integrity'
  | 'controlled_search_scope'
  | 'capture_scope_integrity'
  | 'extraction_scope_integrity'
  | 'artifact_privacy'
  | 'frontend_secret_safety'
  | 'failure_policy'
  | 'readiness_docs_consistency'
  | 'blocked_features'

export interface WebSearchReadinessConfig {
  phase: '49H'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: 'web_search_capture_internal_readiness'
  serviceName: 'reeditpro-staging-private-searxng'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefixBase: 'activation-web-search/phase49h'
  canonicalPhase49GRunId: 'phase49g-20260602T222646'
}

export interface WebSearchReadinessSafetyFlags {
  liveSearchDuringPhase49H: false
  browserCaptureDuringPhase49H: false
  readabilityExtractionDuringPhase49H: false
  publicSearxngInstanceAllowed: false
  paidProviderAllowed: false
  providerFallbackAllowed: false
  broadCrawlingAllowed: false
  arbitraryUrlCaptureAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface WebSearchReadinessEnvValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface WebSearchPhaseEvidence {
  phase: WebSearchReadinessPhase
  status: WebSearchReadinessStatus
  runId?: string
  summary: string
  readiness: string
  artifactUris: string[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchEvidenceChain {
  generatedAt: string
  phases: WebSearchPhaseEvidence[]
  trackStatus: 'ready_for_internal_testing' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface WebSearchProviderGateAudit {
  defaultProvider: 'searxng'
  privateSearxngServiceName: string
  privateSearxngRequired: true
  publicSearxngInstancesAllowed: false
  paidProvidersAllowed: false
  paidProviders: Array<{
    providerId: string
    allowed: false
    requiresFutureApproval: true
  }>
  providerFallbackAllowed: false
  frontendSecretsAllowed: false
  workerOnlyRuntimeRequired: true
  blockers: string[]
  warnings: string[]
}

export interface WebSearchInternalScopeManifest {
  runId: string
  phase: '49H'
  scope: 'web_search_capture_internal_testing_readiness'
  track: 'web_search_capture'
  serviceName: string
  phaseEvidenceRequired: WebSearchReadinessPhase[]
  includedCapabilities: string[]
  excludedCapabilities: string[]
  safetyFlags: WebSearchReadinessSafetyFlags
  internalTestingReady: boolean
  phase49IReadiness: string
}

export interface WebSearchArtifactVerificationEntry {
  artifactId: string
  phase: WebSearchReadinessPhase
  gcsUri: string
  required: boolean
  exists?: boolean
  privateOnly?: boolean
  blocker?: string
  warning?: string
}

export interface WebSearchServiceAccessAudit {
  serviceName: string
  exists: boolean
  projectId: string
  region: string
  serviceUrlRedacted: string
  ingress?: string
  serviceAccountEmail?: string
  image?: string
  allUsersPresent: boolean
  allAuthenticatedUsersPresent: boolean
  invokerMembers: string[]
  publicUnauthenticatedAccess: boolean
  metadataSource: 'cloud_run_metadata_only' | 'not_checked'
  blockers: string[]
  warnings: string[]
}

export interface WebSearchFailurePolicy {
  failClosed: true
  noFallbackToPaidProviders: true
  noFallbackToPublicSearxng: true
  noFallbackToArbitraryCapture: true
  noSignedUrlSourceOfTruth: true
  failureModes: Array<{
    failureId: string
    behavior: 'block_internal_readiness' | 'defer_to_future_phase'
    summary: string
  }>
}

export interface WebSearchReadinessCommandPlan {
  commandId: string
  description: string
  allowedInPhase49H: boolean
  requiresConfirmation: boolean
  mutatesState: boolean
  command: string | null
  blockedReason?: string
}

export interface WebSearchReadinessIamPlanEntry {
  bindingId: string
  role: string
  member: string
  bucket: string
  prefix: string
  condition: string
  requiredForExecution: boolean
  broadAccess: false
}

export interface WebSearchReadinessQaGate {
  gateId: WebSearchReadinessQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchReadinessQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchReadinessQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchReadinessArtifact {
  artifactId: string
  gcsUri: string
  contentType: 'private_json'
}

export interface WebSearchReadinessExecutionReport {
  runId: string
  ok: boolean
  createdAt: string
  config: WebSearchReadinessConfig
  evidenceChain: WebSearchEvidenceChain
  internalScopeManifest: WebSearchInternalScopeManifest
  providerGateAudit: WebSearchProviderGateAudit
  artifactVerification: WebSearchArtifactVerificationEntry[]
  serviceAccessAudit: WebSearchServiceAccessAudit
  failurePolicy: WebSearchFailurePolicy
  qa: WebSearchReadinessQaSummary
  artifacts: WebSearchReadinessArtifact[]
  phase49IReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface ApprovedWebSearchCaptureReadinessEvidence {
  phase: '49H'
  status: 'completed' | 'blocked'
  runId?: string
  privateSearxngService: string
  evidenceChainUri?: string
  readinessManifestUri?: string
  providerGateAuditUri?: string
  artifactVerificationUri?: string
  serviceAccessAuditUri?: string
  qaReportUri?: string
  phase49hReportUri?: string
  webSearchCaptureInternalTestingReady: boolean
  phase49IReadiness: string
  blockers: string[]
  warnings: string[]
}

export interface WebSearchReadinessReport {
  reportId: 'activation-phase-49h-web-search-capture-internal-readiness'
  createdAt: string
  phase: '49H'
  status: 'completed' | 'blocked' | 'planned'
  config: WebSearchReadinessConfig
  approvedEvidence: ApprovedWebSearchCaptureReadinessEvidence
  executionReport?: WebSearchReadinessExecutionReport
  evidenceChain: WebSearchEvidenceChain
  internalScopeManifest: WebSearchInternalScopeManifest
  providerGateAudit: WebSearchProviderGateAudit
  artifactVerification: WebSearchArtifactVerificationEntry[]
  serviceAccessAudit: WebSearchServiceAccessAudit
  failurePolicy: WebSearchFailurePolicy
  qa: WebSearchReadinessQaSummary
  phase49IReadiness: string
  webSearchCaptureInternalTestingReady: boolean
  blockers: string[]
  warnings: string[]
  safetyFlags: WebSearchReadinessSafetyFlags
}
