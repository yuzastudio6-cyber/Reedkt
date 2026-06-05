export const TRACK_B_NOOP_ROUTE_DRY_RUN_SCHEMA_VERSION = 'track-b-noop-route-dry-run-v1'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID = 'candidate-noop-sidecar-handshake'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_SYNTHETIC_TOOL_ID = 'track_b_noop_route_validator'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_COMPAT_TOOL_ID = 'local_worker_sidecar_planning'

export type NoopRouteDryRunStatus = 'passed' | 'blocked'

export interface NoopRoutePlanSnapshot {
  planSnapshotId?: string
  candidateId?: string
  routeId?: string
  toolId?: string
  capabilityId?: string
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  sourcePhase?: string
  confirmationPhase?: string
  rawChatExecution?: boolean
  publicOutputAllowed?: boolean
  broadMediaAllowed?: boolean
  arbitraryMediaAllowed?: boolean
  providerCallsAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  noExecutionPerformed?: boolean
  validatorCompatibility?: {
    mappedToolId?: string
    result?: {
      accepted?: boolean
      blockedReasons?: string[]
    }
  }
}

export interface NoopRouteArtifactScope {
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  noMediaInput?: boolean
  noAudioInput?: boolean
  noModelInput?: boolean
  noProviderOutput?: boolean
  privateMetadataOnlyReportScope?: boolean
  publicOutputAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  arbitraryPathAllowed?: boolean
  broadMediaAllowed?: boolean
  payloadUploadInPhase44L?: boolean
  artifactClasses?: string[]
  validatorCompatibility?: {
    result?: {
      accepted?: boolean
      blockedReasons?: string[]
    }
  }
}

export interface NoopRouteValidationResult {
  status: NoopRouteDryRunStatus
  passed: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface NoopRouteSecretPayloadRequest {
  serviceRoleSecretAccessRequested?: boolean
  providerSecretAccessRequested?: boolean
  secretManagerAccessRequested?: boolean
  envSecretAccessRequested?: boolean
  frontendSecretAccessRequested?: boolean
  secretPayloadReadAttempted?: boolean
  secretValuesInReports?: boolean
}

export interface NoopRouteSecretGuardReport extends NoopRouteValidationResult {
  serviceRoleSecretAccess: 'not_required'
  providerSecretAccess: 'not_required'
  secretManagerAccess: 'not_required'
  envSecretAccess: 'not_required'
  frontendSecretAccess: 'blocked'
  secretPayloadReadAttempted: false
  secretValuesInReports: false
  unexpectedSecretPayloadAccess: 'blocked' | 'not_observed'
}

export interface NoopRouteExecutionReport extends NoopRouteValidationResult {
  noopRouteDryRunStatus: NoopRouteDryRunStatus
  candidateId: string
  ephemeralHandshakeId: string | null
  persistentIdCreated: false
  executionPerformed: false
  routeExecutionPerformed: false
  workerExecutionPerformed: false
  toolExecutionPerformed: false
  sidecarProcessStarted: false
  providerCallsPerformed: false
  mediaAccessPerformed: false
  secretPayloadAccessPerformed: false
}

export interface NoopRouteFailureFixture {
  fixtureId: string
  mutation: 'secret' | 'plan' | 'artifact'
  expectedBlockedReason: string
  secretRequest?: NoopRouteSecretPayloadRequest
  planPatch?: Partial<NoopRoutePlanSnapshot>
  artifactPatch?: Partial<NoopRouteArtifactScope>
}

export interface NoopRouteFailureFixtureResult {
  fixtureId: string
  status: NoopRouteDryRunStatus
  blocked: boolean
  blockedReasons: string[]
  expectedBlockedReason: string
  expectedBlockedReasonObserved: boolean
}
