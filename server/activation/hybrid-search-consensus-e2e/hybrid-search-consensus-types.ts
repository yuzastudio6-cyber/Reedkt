import type {
  BraveLiveApiCallSummary,
  BraveLiveBudgetGuardResult,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
  BraveLiveWebResult,
  NormalizedBraveLiveSourceRecord,
} from '../brave-live-api-validation'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchQueryResponse,
  ControlledLiveSearchSharpRecord,
  ControlledLiveSearchSourceRecord,
} from '../controlled-live-search-capture-e2e'

export type HybridSearchPhase = '49M'
export type HybridSearchStatus = 'planned' | 'completed' | 'blocked'
export type HybridSearchMode = 'searxng_brave_hybrid_consensus_e2e'
export type Phase49NReadiness = 'ready_for_search_provider_readiness_gate' | 'blocked'

export type HybridSearchQaGateId =
  | 'phase49l_evidence'
  | 'secret_safety'
  | 'searxng_default_integrity'
  | 'brave_confidence_booster'
  | 'storage_rights_enforcement'
  | 'result_normalization'
  | 'dedupe_consensus'
  | 'allowlisted_capture'
  | 'playwright_capture'
  | 'sharp_processing'
  | 'readability_extraction'
  | 'artifact_privacy'
  | 'blocked_features'

export interface HybridSearchConfig {
  phase: HybridSearchPhase
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: HybridSearchMode
  defaultProvider: 'searxng'
  braveRole: 'optional_paid_confidence_booster'
  serviceName: 'reeditpro-staging-private-searxng'
  braveEndpoint: 'https://api.search.brave.com/res/v1/web/search'
  query: 'site:docs.searxng.org searxng search api'
  allowedDomains: string[]
  maxQueries: 1
  maxSearxngResults: 5
  maxBraveResults: 5
  maxMergedSources: 8
  maxCapturePages: 2
  maxExtractionPages: 2
  timeoutMs: 8000
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: string
  approvedPhase49LRunId: 'phase49l-20260603T15002'
  approvedPhase49LReportUri: string
}

export interface HybridSearchSafetyFlags {
  searxngRequired: true
  searxngDefaultProvider: true
  braveAllowedInPhase49M: true
  braveOptionalFallback: true
  otherPaidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  rawBraveResponseStorageAllowed: false
  braveSnippetStorageAllowed: false
  requestHeadersStored: false
  browserCaptureAllowed: true
  readabilityExtractionAllowed: true
  arbitraryUrlCaptureAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface HybridSearchEnvValidation {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface HybridSearchPlanSnapshot {
  planId: 'phase49m-hybrid-search-consensus-plan'
  phase49MRunId: string
  query: HybridSearchConfig['query']
  providers: ['searxng_private_cloud_run', 'brave_search']
  providerMode: 'hybrid_consensus'
  defaultProvider: 'searxng'
  braveRole: 'optional_paid_confidence_booster'
  maxSearxngResults: 5
  maxBraveResults: 5
  maxMergedSources: 8
  maxCapturePages: 2
  allowedDomains: string[]
  storagePolicy: {
    rawBraveResponseStored: false
    braveSnippetStored: false
    requestHeadersStored: false
  }
  paidProviderBudget: {
    maxBraveQueries: 1
    maxBraveResults: 5
  }
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  rawPromptExecution: false
  approvedPlanSnapshot: true
  productionReadyAllowed: false
  externalBetaAllowed: false
}

export interface HybridBraveApiClientResult {
  summary: BraveLiveApiCallSummary
  results: BraveLiveWebResult[]
  warnings: string[]
  blockers: string[]
}

export type HybridNormalizedSearxngSource = ControlledLiveSearchSourceRecord & {
  hybridProviderRole: 'default_provider'
}

export type HybridNormalizedBraveSource = NormalizedBraveLiveSourceRecord & {
  hybridProviderRole: 'confidence_booster'
}

export interface HybridMergedSourceRecord {
  sourceId: string
  canonicalUrl: string
  title: string
  domain: string
  query: string
  providers: Array<'searxng' | 'brave_search'>
  providerRanks: Partial<Record<'searxng' | 'brave_search', number>>
  providerSourceIds: Partial<Record<'searxng' | 'brave_search', string>>
  sourceType: 'hybrid_merged_search_result'
  attributionRequired: true
  captureAllowed: boolean
  extractionAllowed: boolean
  paidProviderPresent: boolean
  searxngDefaultProvider: true
  braveConfidenceBoosterUsed: boolean
  consensusRank: number
  consensusScore: number
  selectionReason: string
}

export interface HybridDuplicateGroup {
  groupId: string
  canonicalUrl: string
  providers: Array<'searxng' | 'brave_search'>
  sourceIds: string[]
  titleSimilarityGroup: boolean
}

export interface HybridConsensusReport {
  query: string
  searxngSourceCount: number
  braveSourceCount: number
  mergedSourceCount: number
  duplicateGroupCount: number
  duplicateGroups: HybridDuplicateGroup[]
  providerAgreementScore: number
  sourceDiversityScore: number
  braveContributionCount: number
  searxngContributionCount: number
  fallbackReason?: string
  searxngDefaultProvider: true
  braveOptionalFallback: true
  rawBraveResponseStored: false
  braveSnippetStored: false
  warnings: string[]
  blockers: string[]
}

export interface HybridCaptureTarget {
  sourceId: string
  title: string
  url: string
  domain: string
  query: string
  selectionReason: string
}

export interface HybridSkippedTarget {
  sourceId: string
  url: string
  reason: string
}

export interface HybridConsensusManifest {
  runId: string
  mode: HybridSearchMode
  query: string
  defaultProvider: 'searxng'
  braveRole: 'optional_paid_confidence_booster'
  normalizedSearxngSources: HybridNormalizedSearxngSource[]
  normalizedBraveSources: HybridNormalizedBraveSource[]
  mergedSources: HybridMergedSourceRecord[]
  duplicateGroups: HybridDuplicateGroup[]
  selectedCaptureTargets: HybridCaptureTarget[]
  skippedCaptureTargets: HybridSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  paidProviderUsed: true
  publicSearxngUsed: false
  arbitraryUrlCaptureUsed: false
  publicArtifactAccess: false
  rawBraveResponseStored: false
  braveSnippetStored: false
  requestHeadersStored: false
  warnings: string[]
  blockers: string[]
}

export interface HybridSearchArtifact {
  id: string
  kind: 'private_json' | 'private_text' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface HybridSearchQaGate {
  gateId: HybridSearchQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface HybridSearchQaSummary {
  status: 'passed' | 'blocked'
  gates: HybridSearchQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface HybridSearchExecutionReport {
  ok: boolean
  phase: HybridSearchPhase
  status: 'completed' | 'blocked'
  runId: string
  projectId: 'reeditpro'
  region: 'us-central1'
  mode: HybridSearchMode
  planSnapshot: HybridSearchPlanSnapshot
  privateSearxngServiceUrlRedacted: '[redacted-authenticated-cloud-run-url]' | 'unresolved'
  privateSearxngInvocationMethod?: 'audience_identity_token' | 'default_identity_token' | 'cloud_run_proxy'
  searxngQueryResponses: ControlledLiveSearchQueryResponse[]
  braveApiCall: BraveLiveApiCallSummary
  secret: Omit<BraveLiveSecretResolution, 'secretValue'>
  secretMetadata: BraveLiveSecretMetadata
  budget: BraveLiveBudgetGuardResult
  normalizedSearxngSources: HybridNormalizedSearxngSource[]
  normalizedBraveSources: HybridNormalizedBraveSource[]
  mergedSources: HybridMergedSourceRecord[]
  dedupeReport: {
    duplicateGroups: HybridDuplicateGroup[]
    mergedSourceCount: number
  }
  consensusReport: HybridConsensusReport
  selectedCaptureTargets: HybridCaptureTarget[]
  skippedCaptureTargets: HybridSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  combinedManifest: HybridConsensusManifest
  artifacts: HybridSearchArtifact[]
  qa: HybridSearchQaSummary
  phase49NReadiness: Phase49NReadiness
  safety: HybridSearchSafetyFlags & {
    publicAccessEnabled: false
    signedUrlSourceOfTruth: false
    otherPaidProvidersCalled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface HybridSearchReport {
  reportId: 'activation-phase-49m-hybrid-search-consensus-e2e'
  createdAt: string
  phase: HybridSearchPhase
  status: HybridSearchStatus
  config: HybridSearchConfig
  executionReport?: HybridSearchExecutionReport
  planSnapshot: HybridSearchPlanSnapshot
  qa: HybridSearchQaSummary
  phase49NReadiness: Phase49NReadiness
  searxngDefaultProvider: true
  braveOptionalFallback: true
  rawBraveStorageAllowed: false
  snippetsStored: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface HybridSearchCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string | null
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  allowedInPhase49M: boolean
  warnings: string[]
  blockedReason?: string
}

export interface HybridSearchIamPlan {
  bindingId: string
  resource: string
  role: 'roles/storage.objectCreator' | 'roles/secretmanager.secretAccessor'
  member: string
  conditionTitle?: string
  conditionExpression?: string
  description: string
  commandString: string
  reportOnly: true
}
