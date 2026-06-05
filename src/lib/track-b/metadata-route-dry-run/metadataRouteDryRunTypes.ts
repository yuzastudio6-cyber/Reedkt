export const TRACK_B_METADATA_ROUTE_DRY_RUN_SCHEMA_VERSION = 'track-b-metadata-route-dry-run-v1'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID = 'candidate-duckdb-metadata-route-dry-run'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_TOOL_ID = 'duckdb'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_CAPABILITY_ID = 'internal_qa_aggregation'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_ROUTE_ID = 'track_b_duckdb'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_MANIFEST_VERSION = 'track-b-route-manifest-v1'

export type MetadataRouteDryRunStatus = 'passed' | 'blocked'

export interface MetadataRoutePlanSnapshot {
  planSnapshotId?: string
  candidateId?: string
  routeManifestVersion?: string
  routeId?: string
  toolId?: string
  capabilityId?: string
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  sourcePhase?: string
  confirmationPhase?: string
  dryRunMode?: string
  executeTool?: boolean
  rawChatExecution?: boolean
  publicOutputAllowed?: boolean
  broadMediaAllowed?: boolean
  arbitraryMediaAllowed?: boolean
  providerCallsAllowed?: boolean
  secretPayloadAccessAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  duckDbRuntimeExecutionAllowed?: boolean
  polarsRuntimeExecutionAllowed?: boolean
  noExecutionPerformed?: boolean
  costHardBlockRequested?: boolean
  futureExecutionRequires?: string[]
  auditReportPath?: string
}

export interface MetadataRouteArtifactScope {
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  allowedInputArtifactClasses?: string[]
  allowedOutputArtifactClasses?: string[]
  noMediaInput?: boolean
  noAudioInput?: boolean
  noModelInput?: boolean
  noProviderOutput?: boolean
  noPayloadUploadInPhase44N?: boolean
  publicOutputAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  arbitraryLocalPathAllowed?: boolean
  arbitraryGcsPrefixAllowed?: boolean
  broadMediaAllowed?: boolean
  committedPayloadAllowed?: boolean
}

export interface MetadataRouteSecretPayloadRequest {
  serviceRoleSecretAccessRequested?: boolean
  providerSecretAccessRequested?: boolean
  secretManagerAccessRequested?: boolean
  envSecretAccessRequested?: boolean
  frontendSecretAccessRequested?: boolean
  secretPayloadReadAttempted?: boolean
  secretValuesInReports?: boolean
}

export interface MetadataRouteValidationResult {
  status: MetadataRouteDryRunStatus
  passed: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface MetadataRouteSecretGuardReport extends MetadataRouteValidationResult {
  serviceRoleSecretAccess: 'not_required'
  providerSecretAccess: 'not_required'
  secretManagerAccess: 'not_required'
  envSecretAccess: 'not_required'
  frontendSecretAccess: 'blocked'
  secretPayloadReadAttempted: false
  secretValuesInReports: false
  unexpectedSecretPayloadAccess: 'blocked' | 'not_observed'
}

export interface MetadataRouteManifestEntry {
  routeId?: string
  toolId?: string
  routeStatus?: string
  routeable?: boolean
  capabilityIds?: string[]
  runtimeExecutionAllowed?: boolean
  routeExecutionAllowed?: boolean
  publicOutputAllowed?: boolean
  providerCallsAllowed?: boolean
  broadMediaAllowed?: boolean
  arbitraryMediaAllowed?: boolean
  approvedInputArtifactTypes?: string[]
  approvedOutputArtifactTypes?: string[]
}

export interface MetadataRouteCostEntry {
  toolId?: string
  routeId?: string
  capabilityId?: string
  runtimeClass?: string
  executionClass?: string
  costRiskClass?: string
  estimateAllowed?: boolean
  blockers?: string[]
}

export interface MetadataRouteResolutionReport extends MetadataRouteValidationResult {
  routeResolved: boolean
  routeEligibleForFutureDryRun: boolean
  routeExecutionAllowed: false
  runtimeExecutionAllowed: false
  executionPerformed: false
  routeExecutionPerformed: false
  toolExecutionPerformed: false
  workerExecutionPerformed: false
  sidecarExecutionPerformed: false
  duckDbRuntimePerformed: false
}

export interface MetadataRouteCostGuardReport extends MetadataRouteValidationResult {
  costGuardStatus: MetadataRouteDryRunStatus
  billingApiCalls: 'not_run'
  cloudCalls: 'not_run'
  metadataOnlyCostAllowed: boolean
}

export interface MetadataRouteSidecarValidationReport extends MetadataRouteValidationResult {
  sidecarValidationStatus: MetadataRouteDryRunStatus
  planSnapshotAccepted: boolean
  artifactScopeAccepted: boolean
  executionBlockedResponse: {
    type: 'execution_blocked_response'
    blockedReason: string
    requiredFuturePhase: string
    auditRef: string
  }
  sidecarProcessStarted: false
}

export interface MetadataRouteExecutionReport extends MetadataRouteValidationResult {
  metadataRouteDryRunStatus: MetadataRouteDryRunStatus
  candidateId: string
  routeResolved: boolean
  routeEligibleForFutureDryRun: boolean
  executionPerformed: false
  routeExecutionPerformed: false
  runtimeExecutionPerformed: false
  workerExecutionPerformed: false
  toolExecutionPerformed: false
  sidecarExecutionPerformed: false
  duckDbRuntimePerformed: false
  polarsRuntimePerformed: false
  providerCallsPerformed: false
  mediaAccessPerformed: false
  audioAccessPerformed: false
  ocrRuntimePerformed: false
  vlmRuntimePerformed: false
  secretPayloadAccessPerformed: false
}

export interface MetadataRouteFailureFixture {
  fixtureId: string
  mutation: 'secret' | 'plan' | 'artifact' | 'cost'
  expectedBlockedReason: string
  secretRequest?: MetadataRouteSecretPayloadRequest
  planPatch?: Partial<MetadataRoutePlanSnapshot>
  artifactPatch?: Partial<MetadataRouteArtifactScope>
  costPatch?: { hardBlock?: boolean }
}

export interface MetadataRouteFailureFixtureResult {
  fixtureId: string
  status: MetadataRouteDryRunStatus
  blocked: boolean
  blockedReasons: string[]
  expectedBlockedReason: string
  expectedBlockedReasonObserved: boolean
}
