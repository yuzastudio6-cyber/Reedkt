import assert from 'node:assert/strict'

import {
  createInternalBetaPrivateArtifactAccessPolicyLocalRuntime,
  type InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput,
} from '../services/internal-beta-private-artifact-access-policy-local-runtime'

const checksum = 'e'.repeat(64)

function buildInput(
  overrides: Partial<InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput> = {},
): InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput {
  return {
    workspaceId: 'workspace_private_artifact_access_001',
    projectId: 'project_private_artifact_access_001',
    userId: 'user_private_artifact_access_001',
    approvedPlanSnapshotId: 'approved_snapshot_private_artifact_access_001',
    artifactManifestId: 'artifact_manifest_private_artifact_access_001',
    artifactId: 'artifact_private_preview_001',
    fileName: 'private-preview.mp4',
    sha256: checksum,
    accessMode: 'private_preview_view',
    idempotencyKey: 'idempotency_private_artifact_access_001',
    authorizationContext: {
      workspaceMember: true,
      projectMember: true,
      serviceRoleRuntimeApproved: false,
      supabaseRlsStorageValidated: false,
    },
    metadata: { source: 'internal_beta_private_artifact_access_policy_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaPrivateArtifactAccessPolicyLocalRuntime>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.accessGrantedNow, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.serviceRoleSecretPayloadAccess, false)
  assert.equal(result.safety.frontendServiceRoleCredentialExposure, false)
  assert.equal(result.safety.storageObjectCreation, false)
  assert.equal(result.safety.storageObjectRead, false)
  assert.equal(result.safety.storageObjectDelete, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.remotionExecution, false)
  assert.equal(result.safety.ffmpegExecution, false)
  assert.equal(result.safety.ffprobeExecution, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_private_artifact_access_policy_validated_no_storage_read')
assert.equal(valid.localAccessPolicyRecorded, true)
assert.equal(valid.summary?.policyRecorded, true)
assert.equal(valid.summary?.accessGrantedNow, false)
assert.equal(valid.record?.accessGrantedNow, false)
assert.equal(valid.record?.storageObjectRead, false)
assert.equal(valid.record?.signedUrlCreated, false)
assert.equal(valid.record?.publicArtifactCreated, false)
assert.match(valid.recordHash ?? '', /^[a-f0-9]{64}$/)
assertSafety(valid)

const repeated = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(buildInput())
assert.equal(repeated.recordHash, valid.recordHash, 'same access policy basis should hash deterministically')
assert.equal(repeated.record?.id, valid.record?.id, 'same access policy basis should create deterministic id')
assertSafety(repeated)

const missingMembership = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(
  buildInput({ authorizationContext: { workspaceMember: false, projectMember: true } }),
)
assert.equal(missingMembership.ok, false)
assert.equal(missingMembership.status, 'blocked_invalid_private_artifact_access_policy_input')
assert.ok(missingMembership.validation.errors.some((error) => error.includes('workspaceMember')))
assertSafety(missingMembership)

const badChecksum = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(buildInput({ sha256: 'not-a-checksum' }))
assert.equal(badChecksum.ok, false)
assert.ok(badChecksum.validation.errors.some((error) => error.includes('SHA-256')))
assertSafety(badChecksum)

const pathFileName = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(buildInput({ fileName: '../preview.mp4' }))
assert.equal(pathFileName.ok, false)
assert.ok(pathFileName.validation.errors.some((error) => error.includes('file name only')))
assertSafety(pathFileName)

const signedUrl = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(
  buildInput({ metadata: { signedUrl: 'redacted-signed-url-placeholder' } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

console.log('internal-beta-private-artifact-access-policy-local-runtime-smoke passed')
