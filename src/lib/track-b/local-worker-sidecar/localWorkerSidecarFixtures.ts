import {
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
  LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
  type LocalWorkerSidecarFixture,
  type LocalWorkerSidecarFixtureResult,
} from './localWorkerSidecarTypes'
import { validateLocalWorkerArtifactScope } from './validateArtifactScope'
import { validateLocalWorkerPlanSnapshot, validateLocalWorkerProtocolVersion } from './validatePlanSnapshot'

const validPlan = {
  type: 'plan_snapshot_validate_request' as const,
  planSnapshotId: 'approved-plan-snapshot-phase44g-fixture',
  routeId: 'route-opencv-restricted-internal',
  toolId: 'opencv' as const,
  capabilityId: 'capability-opencv-restricted-internal',
  inputArtifactScopeId: 'artifact-scope-input-private-fixture',
  outputArtifactScopeId: 'artifact-scope-output-private-fixture',
  requestedAction: 'validate_only' as const,
  confirmationPhase: 'Phase 44G validation only',
  sourcePhase: '44G',
  routeManifestVersion: LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
  routeExecutionAllowed: false,
  runtimeExecutionAllowed: false,
  publicOutputAllowed: false,
  broadMediaAllowed: false,
  arbitraryMediaAllowed: false,
  providerCallsAllowed: false,
  maxRuntimeBounds: {
    maxDurationSeconds: 5,
    maxInputCount: 1,
    maxOutputSizeBytes: 1024,
  },
  auditReportPath: 'docs/activation-phase-44g-local-worker-sidecar-foundation-reports/phase_44g_local_worker_sidecar_validation_report.json',
}

const validArtifactScope = {
  type: 'artifact_scope_validate_request' as const,
  artifactScopeId: 'artifact-scope-private-phase44g-fixture',
  artifactClasses: ['metadata_json'],
  privateGcsPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44g/local-worker-sidecar/fixture/',
  localTempScope: 'phase44g-ephemeral-temp-only',
  publicOutputRequested: false,
  arbitraryPathRequested: false,
  signedUrlAsSourceOfTruth: false,
  committedPrivatePayloadRequested: false,
  broadMediaBucketRequested: false,
}

export const LOCAL_WORKER_SIDECAR_FIXTURES: LocalWorkerSidecarFixture[] = [
  {
    fixtureId: 'fixture-sidecar-handshake-valid',
    description: 'Valid metadata-only hello exchange with no execution.',
    protocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
    expectedAccepted: true,
    expectedBlockedReasons: [],
  },
  {
    fixtureId: 'fixture-plan-snapshot-valid-but-execution-blocked',
    description: 'Plan snapshot fields validate, but execution request remains blocked in Phase 44G.',
    planSnapshotRequest: { ...validPlan, requestedAction: 'execute' },
    expectedAccepted: false,
    expectedBlockedReasons: ['phase44g_execution_blocked', 'route_execution_not_allowed', 'runtime_execution_not_allowed'],
  },
  {
    fixtureId: 'fixture-artifact-scope-valid-private',
    description: 'Private scoped artifact input/output policy validates.',
    artifactScopeRequest: validArtifactScope,
    expectedAccepted: true,
    expectedBlockedReasons: [],
  },
  {
    fixtureId: 'fixture-deny-raw-chat-execution',
    description: 'Raw chat text cannot be used as an execution source.',
    planSnapshotRequest: { ...validPlan, rawChatText: 'run the tool from this chat' },
    expectedAccepted: false,
    expectedBlockedReasons: ['raw_chat_execution_blocked'],
  },
  {
    fixtureId: 'fixture-deny-arbitrary-path',
    description: 'Arbitrary local paths are blocked.',
    artifactScopeRequest: { ...validArtifactScope, arbitraryPathRequested: true },
    expectedAccepted: false,
    expectedBlockedReasons: ['arbitrary_path_blocked'],
  },
  {
    fixtureId: 'fixture-deny-public-artifact',
    description: 'Public output artifacts are blocked.',
    artifactScopeRequest: { ...validArtifactScope, publicOutputRequested: true },
    expectedAccepted: false,
    expectedBlockedReasons: ['public_artifact_blocked'],
  },
  {
    fixtureId: 'fixture-deny-demucs-route',
    description: 'Demucs remains blocked pending provenance/legal review.',
    planSnapshotRequest: { ...validPlan, toolId: 'demucs', routeId: 'route-demucs-blocked' },
    expectedAccepted: false,
    expectedBlockedReasons: ['demucs_route_blocked'],
  },
  {
    fixtureId: 'fixture-deny-vlm-route',
    description: 'Qwen/vLLM routes remain excluded while VLM runtime is blocked.',
    planSnapshotRequest: { ...validPlan, toolId: 'qwen3_vl', routeId: 'route-qwen3-vl-excluded' },
    expectedAccepted: false,
    expectedBlockedReasons: ['vlm_route_blocked'],
  },
  {
    fixtureId: 'fixture-protocol-version-mismatch',
    description: 'Mismatched protocol versions fail closed.',
    protocolVersion: 'track-b-sidecar-protocol-v0',
    expectedAccepted: false,
    expectedBlockedReasons: ['protocol_version_mismatch'],
  },
]

export function runLocalWorkerSidecarFixture(fixture: LocalWorkerSidecarFixture): LocalWorkerSidecarFixtureResult {
  const blockedReasons = [
    ...validateLocalWorkerProtocolVersion(fixture.protocolVersion ?? LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION),
    ...(fixture.planSnapshotRequest ? validateLocalWorkerPlanSnapshot(fixture.planSnapshotRequest).blockedReasons : []),
    ...(fixture.artifactScopeRequest ? validateLocalWorkerArtifactScope(fixture.artifactScopeRequest).blockedReasons : []),
  ]
  const accepted = blockedReasons.length === 0
  const missingExpectedBlockedReasons = fixture.expectedBlockedReasons.filter((reason) => !blockedReasons.includes(reason))
  return {
    fixtureId: fixture.fixtureId,
    status: accepted === fixture.expectedAccepted && missingExpectedBlockedReasons.length === 0 ? 'passed' : 'blocked',
    accepted,
    blockedReasons,
    missingExpectedBlockedReasons,
  }
}

export function runLocalWorkerSidecarFixtures(fixtures = LOCAL_WORKER_SIDECAR_FIXTURES): LocalWorkerSidecarFixtureResult[] {
  return fixtures.map((fixture) => runLocalWorkerSidecarFixture(fixture))
}
