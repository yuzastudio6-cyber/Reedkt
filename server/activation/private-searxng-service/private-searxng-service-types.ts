export type PrivateSearxngServiceStatus = 'planned' | 'completed' | 'blocked'
export type PrivateSearxngServiceMode = 'private_controlled_searxng'
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

export interface PrivateSearxngServiceConfig {
  phase: '49F'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  serviceName: 'reeditpro-staging-private-searxng'
  serviceMode: PrivateSearxngServiceMode
  provider: 'searxng'
  controlledQuery: 'ReeditPro open source video editing planning'
  maxResults: 5
  cpuOnly: true
  gpuAllowed: false
  modelWeightsAllowed: false
  paidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  publicUnauthenticatedAccessAllowed: false
  liveControlledSearchAllowed: true
  broadCrawlingAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
  broadMediaAllowed: false
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

export interface PrivateSearxngSafetyFlags {
  paidProvidersAllowed: false
  publicSearxngInstanceAllowed: false
  publicUnauthenticatedAccessAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  broadCrawlingAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
  broadMediaAllowed: false
  gpuAllowed: false
  modelWeightsAllowed: false
}

export interface PrivateSearxngServicePlan {
  planId: 'phase49f-private-searxng-service-plan'
  runId: string
  serviceName: PrivateSearxngServiceConfig['serviceName']
  serviceMode: PrivateSearxngServiceMode
  provider: 'searxng'
  controlledQuery: PrivateSearxngServiceConfig['controlledQuery']
  maxResults: 5
  rawPromptExecution: false
  approvedPlanSnapshot: true
  image: {
    repository: string
    tag: string
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
  outputPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  safety: PrivateSearxngSafetyFlags
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
  query: PrivateSearxngServiceConfig['controlledQuery']
  provider: 'searxng'
  serviceMode: PrivateSearxngServiceMode
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
  serviceMode: PrivateSearxngServiceMode
  image?: string
  imageDigest?: string
  officialSearxngImage: string
  officialSearxngIndexDigest: string
  officialSearxngAmd64Digest: string
  controlledQuery: string
  resultCount: number
  deployedAt?: string
  queriedAt?: string
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

export interface PrivateSearxngQaSummary {
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
  serviceMode: PrivateSearxngServiceMode
  plan: PrivateSearxngServicePlan
  serviceValidation: PrivateSearxngServiceValidation
  queryResponse?: PrivateSearxngQueryResponse
  normalizedSources: PrivateSearxngSourceRecord[]
  sourceManifest: PrivateSearxngSourceManifest
  runtimeMetadata: PrivateSearxngRuntimeMetadata
  artifacts: PrivateSearxngArtifact[]
  qa: PrivateSearxngQaSummary
  phase49GReadiness: Phase49GReadiness
  safety: PrivateSearxngSafetyFlags & {
    publicSearxngInstanceUsed: false
    paidProviderCalled: false
    browserCaptureUsed: false
    readabilityExtractionUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPrivateSearxngServiceEvidence {
  phase: '49F'
  status: PrivateSearxngServiceStatus
  runId?: string
  serviceName: string
  serviceMode: PrivateSearxngServiceMode
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

export interface PrivateSearxngServiceReport {
  reportId: 'activation-phase-49f-private-searxng-service-validation'
  createdAt: string
  phase: '49F'
  status: PrivateSearxngServiceStatus
  config: PrivateSearxngServiceConfig
  approvedEvidence: ApprovedPrivateSearxngServiceEvidence
  executionReport?: PrivateSearxngExecutionReport
  qa: PrivateSearxngQaSummary
  phase49GReadiness: Phase49GReadiness
  blockers: string[]
  warnings: string[]
  paidProviderAllowed: false
  publicSearxngInstanceAllowed: false
  publicUnauthenticatedAccessAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
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
