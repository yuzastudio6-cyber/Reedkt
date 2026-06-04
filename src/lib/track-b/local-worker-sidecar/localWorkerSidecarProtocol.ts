import {
  LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION,
  LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION,
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
  LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
  type LocalWorkerSidecarControllerHelloMessage,
  type LocalWorkerSidecarExecutionBlockedResponse,
  type LocalWorkerSidecarHelloMessage,
} from './localWorkerSidecarTypes'

export const LOCAL_WORKER_SIDECAR_ALLOWED_TOOL_IDS = [
  'deepfilternet',
  'signalsmith_stretch',
  'paddleocr',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
] as const

export const LOCAL_WORKER_SIDECAR_BLOCKED_TOOL_IDS = [
  'demucs',
  'qwen3_vl',
  'vllm',
] as const

export function buildLocalWorkerSidecarProtocolSchema() {
  return {
    schemaVersion: 'track-b-local-worker-sidecar-schema-report-v1',
    protocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
    messageTypes: [
      'sidecar_hello',
      'controller_hello',
      'plan_snapshot_validate_request',
      'plan_snapshot_validate_response',
      'artifact_scope_validate_request',
      'artifact_scope_validate_response',
      'execution_request',
      'execution_blocked_response',
      'sidecar_shutdown_request',
      'sidecar_shutdown_ack',
    ],
    executionRequestPolicy: 'schema_defined_but_always_blocked_in_phase44g',
    rawChatPromptAllowed: false,
    arbitraryMediaPathAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    secretValuesAllowed: false,
    requiredPolicyVersions: {
      routeManifestVersion: LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
      planSnapshotPolicyVersion: LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION,
      artifactScopePolicyVersion: LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION,
    },
  }
}

export function buildFixtureSidecarHello(): LocalWorkerSidecarHelloMessage {
  return {
    type: 'sidecar_hello',
    protocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
    sidecarIdEphemeral: 'fixture-ephemeral-sidecar-id',
    supportedCapabilities: ['metadata_validation_only', 'policy_fixture_validation'],
    runtimeKind: 'metadata_only',
    platformBucket: 'desktop_local',
    privacyMode: 'no_persistent_identity',
    noPersistentIdentity: true,
  }
}

export function buildFixtureControllerHello(): LocalWorkerSidecarControllerHelloMessage {
  return {
    type: 'controller_hello',
    protocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
    routeManifestVersion: LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
    allowedToolIds: [...LOCAL_WORKER_SIDECAR_ALLOWED_TOOL_IDS],
    blockedToolIds: [...LOCAL_WORKER_SIDECAR_BLOCKED_TOOL_IDS],
    planSnapshotPolicyVersion: LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION,
    artifactScopePolicyVersion: LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION,
  }
}

export function buildExecutionBlockedResponse(auditRef: string): LocalWorkerSidecarExecutionBlockedResponse {
  return {
    type: 'execution_blocked_response',
    blockedReason: 'phase44g_execution_not_allowed',
    requiredFuturePhase: 'Phase 44J or later explicit execution phase',
    auditRef,
  }
}
