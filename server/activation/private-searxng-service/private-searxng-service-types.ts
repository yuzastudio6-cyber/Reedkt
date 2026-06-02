export type PrivateSearxngStatus = 'planned' | 'completed' | 'blocked'
export type PrivateSearxngMode = 'private_controlled_searxng'
export type Phase49GReadiness = 'ready_for_controlled_private_live_search_capture_e2e' | 'blocked'

export type PrivateSearxngQaGateId =
  | 'phase49e_evidence'
  | 'private_service_deployed_or_resolved'
  | 'service_access_control'
  | 'searxng_api_health'
  | 'controlled_query'
  | 'result_normalization'
  | 'artifact_privacy'
  | 'blocked_features'

export interface PrivateSearxngConfig {
  phase: '49F'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  serviceName: 'reeditpro-staging-private-searxng'
  serviceMode: PrivateSearxngMode
  provider: 'searxng'
  controlledQuery: 'ReeditPro open source video editing planning'
  maxResults: 5
  serviceAccountEmail: string
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: string
  imageRepository: string
  imageTag: string
  targetImage: string
  officialSearxngImage: string
  officialSearxngIndexDigest: string
  officialSearxngAmd64Digest: string
  cpu: '1'
  memory: '1Gi'
  minInstances: '0'
  maxInstances: '1'
  containerPort: '8080'
  approvedPhase49ERunId: 'phase49e-20260602T155154'
  approvedPhase49EReportUri: string
  approvedPhase49EManifestUri: string
}

export interface PrivateSearxngSafety {
  paidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  publicUnauthenticatedAccessAllowed: false
  broadCrawlingAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  gpuAllowed: false
  modelWeightsAllowed: false
}

export interface PrivateSearxngPlan {
  planId: 'phase49f-private-searxng-service-plan'
  runId: string
  serviceName: string
  serviceMode: PrivateSearxngMode
  provider: 'searxng'
  controlledQuery: string
  maxResults: 5
  rawPromptExecution: false
  approvedPlanSnapshot: true
  image: {
    targetImage: string
    officialBaseImage: string
    officialIndexDigest: string
    officialAmd64Digest: string
  }
  runtime: {
    cpuOnly: true
    cpu: '1'
    memory: '1Gi'
    minInstances: '0'
    maxInstances: '1'
    containerPort: '8080'
    unauthenticatedAccessAllowed: false
  }
  outputPrefixes: { generatedAssets: string; qaArtifacts: string }
  safety: PrivateSearxngSafety
}

export interface PrivateSearxngArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface PrivateSearxngServiceValidation {
  serviceName: string
  existsBeforeDeploy: boolean
  deployedOrResolved: boolean
  serviceUrlRedacted: string
  serviceUrlHost?: string
  publicUnauthenticatedAccess: false
  invokerMembers: string[]
  allUsersPresent: boolean
  allAuthenticatedUsersPresent: boolean
  cloudRunIngress: string
  serviceAccountEmail: string
  image?: string
  imageDigest?: string
  deployedAt?: string
  blockers: string[]
  warnings: string[]
}

export interface PrivateSearxngRawResult {
  title?: string
  url?: string
  content?: string
  engine?: string | string[]
  engines?: string[]
  category?: string
  score?: number
}

export interface PrivateSearxngQueryResponse {
  query: string
  number_of_results?: number
  results: PrivateSearxngRawResult[]
  answers?: string[]
  corrections?: string[]
  suggestions?: string[]
  unresponsive_engines?: unknown[]
}

export interface PrivateSearxngSourceRecord {
  sourceId: string
  provider: 'searxng'
  title: string
  url: string
  domain: string
  snippet: string
  rank: number
  category: string
  engine?: string
  retrievedAt: string
  sourceType: 'private_searxng_search_result'
  attributionRequired: true
  captureAllowed: false
  extractionAllowed: false
  paidProvider: false
  privateSearxngUsed: true
}

export interface PrivateSearxngSourceManifest {
  runId: string
  query: string
  provider: 'searxng'
  serviceMode: PrivateSearxngMode
  sourceCount: number
  maxResults: 5
  sources: PrivateSearxngSourceRecord[]
  attributionPolicy: string
  privateSearxngUsed: true
  publicSearxngInstanceUsed: false
  paidProviderUsed: false
  browserCaptureUsed: false
  readabilityExtractionUsed: false
  warnings: string[]
  blockers: string[]
}

export interface PrivateSearxngRuntimeMetadata {
  phase: '49F'
  runId: string
  serviceName: string
  image?: string
  imageDigest?: string
  officialSearxngImage: string
  controlledQuery: string
  resultCount: number
  deployedAt?: string
  queriedAt?: string
  queryInvocationMethod?: 'audience_identity_token' | 'default_identity_token' | 'cloud_run_proxy'
  iamChanges: string[]
  warnings: string[]
  blockers: string[]
}

export interface PrivateSearxngQaGate {
  gateId: PrivateSearxngQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface PrivateSearxngQa {
  status: 'passed' | 'blocked'
  gates: PrivateSearxngQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface PrivateSearxngExecutionReport {
  ok: boolean
  phase: '49F'
  runId: string
  projectId: 'reeditpro'
  region: 'us-central1'
  serviceMode: PrivateSearxngMode
  plan: PrivateSearxngPlan
  serviceValidation: PrivateSearxngServiceValidation
  queryResponse?: PrivateSearxngQueryResponse
  normalizedSources: PrivateSearxngSourceRecord[]
  sourceManifest: PrivateSearxngSourceManifest
  runtimeMetadata: PrivateSearxngRuntimeMetadata
  artifacts: PrivateSearxngArtifact[]
  qa: PrivateSearxngQa
  phase49GReadiness: Phase49GReadiness
  safety: PrivateSearxngSafety & {
    publicSearxngInstanceUsed: false
    paidProviderCalled: false
    browserCaptureUsed: false
    readabilityExtractionUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPrivateSearxngEvidence {
  phase: '49F'
  status: PrivateSearxngStatus
  runId?: string
  serviceName: string
  serviceMode: PrivateSearxngMode
  image?: string
  imageDigest?: string
  controlledQuery: string
  normalizedSourceCount?: number
  sourceManifestUri?: string
  qaReportUri?: string
  phase49fReportUri?: string
  phase49GReadiness: Phase49GReadiness
  blockers: string[]
  warnings: string[]
}

export interface PrivateSearxngReport {
  reportId: 'activation-phase-49f-private-searxng-service-validation'
  createdAt: string
  phase: '49F'
  status: PrivateSearxngStatus
  config: PrivateSearxngConfig
  approvedEvidence: ApprovedPrivateSearxngEvidence
  executionReport?: PrivateSearxngExecutionReport
  qa: PrivateSearxngQa
  phase49GReadiness: Phase49GReadiness
  blockers: string[]
  warnings: string[]
  paidProviderAllowed: false
  publicSearxngInstanceAllowed: false
  publicUnauthenticatedAccessAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}

export interface PrivateSearxngIamPlanEntry {
  bindingId: string
  target: 'cloud_run_service' | 'gcs_bucket'
  resource: string
  role: string
  member: string
  conditionTitle?: string
  conditionExpression?: string
  description: string
  commandString: string
  reportOnly: boolean
}

export interface PrivateSearxngCommandPlanEntry {
  commandId: string
  description: string
  allowedInPhase49F: boolean
  requiresConfirmation: boolean
  mutatesGcp: boolean
  executableCommand?: string
  blockedReason?: string
}
