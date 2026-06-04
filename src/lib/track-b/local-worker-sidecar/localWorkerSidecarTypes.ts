export const LOCAL_WORKER_SIDECAR_SCHEMA_VERSION = 'track-b-local-worker-sidecar-v1'
export const LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION = 'track-b-sidecar-protocol-v1'
export const LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION = 'track-b-plan-snapshot-policy-v1'
export const LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION = 'track-b-artifact-scope-policy-v1'
export const LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'

export type LocalWorkerSidecarToolId =
  | 'deepfilternet'
  | 'signalsmith_stretch'
  | 'demucs'
  | 'paddleocr'
  | 'paddlepaddle'
  | 'qwen3_vl'
  | 'vllm'
  | 'opencv'
  | 'pyav'
  | 'pyscenedetect'
  | 'sharp_libvips'
  | 'duckdb'
  | 'polars'
  | 'web_capability_profiler'
  | 'desktop_capability_profiler'
  | 'local_worker_sidecar_planning'
  | 'cost_estimator'
  | 'tool_route_manifest_integration'

export type LocalWorkerSidecarRequestedAction = 'validate_only' | 'execute'
export type LocalWorkerSidecarStatus = 'passed' | 'blocked'

export interface LocalWorkerSidecarHelloMessage {
  type: 'sidecar_hello'
  protocolVersion: string
  sidecarIdEphemeral: string
  supportedCapabilities: string[]
  runtimeKind: 'metadata_only' | 'future_node_sidecar' | 'future_electron_main_bridge'
  platformBucket: 'desktop_local' | 'unknown'
  privacyMode: 'no_persistent_identity'
  noPersistentIdentity: true
}

export interface LocalWorkerSidecarControllerHelloMessage {
  type: 'controller_hello'
  protocolVersion: string
  routeManifestVersion: string
  allowedToolIds: LocalWorkerSidecarToolId[]
  blockedToolIds: LocalWorkerSidecarToolId[]
  planSnapshotPolicyVersion: string
  artifactScopePolicyVersion: string
}

export interface LocalWorkerSidecarPlanSnapshotValidationRequest {
  type: 'plan_snapshot_validate_request'
  planSnapshotId?: string
  routeId?: string
  toolId?: LocalWorkerSidecarToolId
  capabilityId?: string
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  requestedAction?: LocalWorkerSidecarRequestedAction
  confirmationPhase?: string
  sourcePhase?: string
  routeManifestVersion?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  publicOutputAllowed?: boolean
  broadMediaAllowed?: boolean
  arbitraryMediaAllowed?: boolean
  providerCallsAllowed?: boolean
  rawChatText?: string
  arbitraryCommand?: string
  arbitraryLocalPath?: string
  arbitraryGcsPrefix?: string
  publicUrl?: string
  signedUrlAsSourceOfTruth?: boolean
  maxRuntimeBounds?: {
    maxDurationSeconds?: number
    maxInputCount?: number
    maxOutputSizeBytes?: number
  }
  auditReportPath?: string
}

export interface LocalWorkerSidecarPlanSnapshotValidationResponse {
  type: 'plan_snapshot_validate_response'
  accepted: boolean
  blockedReasons: string[]
  warnings: string[]
  normalizedPolicy: {
    noRawChatExecution: true
    executionBlockedInPhase44G: true
    failClosed: true
  }
}

export interface LocalWorkerSidecarArtifactScopeValidationRequest {
  type: 'artifact_scope_validate_request'
  artifactScopeId?: string
  artifactClasses?: string[]
  privateGcsPrefix?: string
  localTempScope?: string
  publicOutputRequested?: boolean
  arbitraryPathRequested?: boolean
  signedUrlAsSourceOfTruth?: boolean
  committedPrivatePayloadRequested?: boolean
  broadMediaBucketRequested?: boolean
}

export interface LocalWorkerSidecarArtifactScopeValidationResponse {
  type: 'artifact_scope_validate_response'
  accepted: boolean
  blockedReasons: string[]
  redactedScope: {
    artifactScopeId?: string
    privateGcsPrefixBucket?: string
    localTempScopePolicy: 'ephemeral_only'
  }
}

export interface LocalWorkerSidecarExecutionRequest {
  type: 'execution_request'
  planSnapshotId: string
  routeId: string
  toolId: LocalWorkerSidecarToolId
}

export interface LocalWorkerSidecarExecutionBlockedResponse {
  type: 'execution_blocked_response'
  blockedReason: 'phase44g_execution_not_allowed'
  requiredFuturePhase: 'Phase 44J or later explicit execution phase'
  auditRef: string
}

export interface LocalWorkerSidecarShutdownRequest {
  type: 'sidecar_shutdown_request'
  reason: 'metadata_fixture_complete' | 'operator_abort' | 'policy_block'
  timeoutMs: number
}

export interface LocalWorkerSidecarShutdownAck {
  type: 'sidecar_shutdown_ack'
  status: 'terminated_metadata_only'
}

export type LocalWorkerSidecarProtocolMessage =
  | LocalWorkerSidecarHelloMessage
  | LocalWorkerSidecarControllerHelloMessage
  | LocalWorkerSidecarPlanSnapshotValidationRequest
  | LocalWorkerSidecarPlanSnapshotValidationResponse
  | LocalWorkerSidecarArtifactScopeValidationRequest
  | LocalWorkerSidecarArtifactScopeValidationResponse
  | LocalWorkerSidecarExecutionRequest
  | LocalWorkerSidecarExecutionBlockedResponse
  | LocalWorkerSidecarShutdownRequest
  | LocalWorkerSidecarShutdownAck

export interface LocalWorkerSidecarFixture {
  fixtureId: string
  description: string
  planSnapshotRequest?: LocalWorkerSidecarPlanSnapshotValidationRequest
  artifactScopeRequest?: LocalWorkerSidecarArtifactScopeValidationRequest
  protocolVersion?: string
  expectedAccepted: boolean
  expectedBlockedReasons: string[]
}

export interface LocalWorkerSidecarFixtureResult {
  fixtureId: string
  status: LocalWorkerSidecarStatus
  accepted: boolean
  blockedReasons: string[]
  missingExpectedBlockedReasons: string[]
}
