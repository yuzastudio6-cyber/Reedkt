import assert from 'node:assert/strict'
import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  canonicalInternalAuthorityArtifactRelativePath,
} from '../services/canonical-internal-authority-artifact-verifier'
import { createCanonicalInternalAuthorityRunnerService } from '../services/canonical-internal-authority-runner-service'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import {
  clearPrivateArtifactQaAuthorityProcessStateForSmoke,
  privateArtifactQaAggregateRelativePath,
} from '../services/private-artifact-qa-authority-store'
import { createPrivateArtifactQaAuthorityService } from '../services/private-artifact-qa-authority-service'
import {
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke,
} from '../services/private-canonical-worker-lease-store'
import {
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Creates one authenticated, source-bound, approved and funded four-job graph.
await import('./canonical-execution-readiness-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-route-smoke'
const userId = 'user-authority-smoke'
const strongInternalSecret = 'rp-local-internal-runner-8Mx2Qv7Lc4Np9Hd3Ts6Za1Wk5Bj'
const context: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: strongInternalSecret,
    LOCAL_STORAGE_ROOT: localStorageRoot,
  }),
  clients: { admin: null, public: null },
  requestId: 'canonical-internal-authority-runner-smoke',
  auth: { userId, isMockUser: true },
}

// The imported authority integration already exercised this workspace's
// private runner. Preserve its immutable approval package, but start this
// runner-specific proof with fresh lease/artifact evidence so it cannot replay
// or collide with the prerequisite smoke's runtime records.
await Promise.all([
  'canonical-worker-leases',
  'artifact-qa-authority',
  'canonical-internal-authority-results',
].map((relativePath) => rm(join(localStorageRoot, relativePath), {
  force: true,
  recursive: true,
})))
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
clearPrivateArtifactQaAuthorityProcessStateForSmoke()

const authorityBefore = await requireEditAuthority()
const snapshot = authorityBefore.snapshots.find((candidate) => {
  const snapshotJobs = authorityBefore.jobs.filter((job) =>
    job.snapshotId === candidate.snapshotId)
  return authorityBefore.executionPackages.some((record) =>
    record.snapshotId === candidate.snapshotId) &&
    snapshotJobs.some((job) =>
      job.dependencyJobIds.length === 1 &&
      snapshotJobs.some((dependency) =>
        dependency.id === job.dependencyJobIds[0] &&
        dependency.dependencyJobIds.length === 0))
})
assert.ok(
  snapshot,
  JSON.stringify(authorityBefore.snapshots.map((candidate) => ({
    snapshotId: candidate.snapshotId,
    packagePresent: authorityBefore.executionPackages.some((record) =>
      record.snapshotId === candidate.snapshotId),
    jobs: authorityBefore.jobs
      .filter((job) => job.snapshotId === candidate.snapshotId)
      .map((job) => ({
        id: job.id,
        dependencies: job.dependencyJobIds,
      })),
  }))),
)
const canonicalAuthority = await createEditPlanningAuthorityService(context)
  .loadApprovedExecutionAuthority(snapshot.snapshotId, workspaceId)
const dependentJob = canonicalAuthority.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId &&
  candidate.dependencyJobIds.length === 1 &&
  canonicalAuthority.jobs.some((dependency) =>
    dependency.id === candidate.dependencyJobIds[0] &&
    dependency.dependencyJobIds.length === 0))
assert.ok(dependentJob)
const rootJob = canonicalAuthority.jobs.find((candidate) =>
  candidate.id === dependentJob.dependencyJobIds[0])
assert.ok(rootJob)
const rootWorkItem = canonicalAuthority.workItems.find((candidate) =>
  candidate.id === rootJob.approvedWorkItemId)
const dependentWorkItem = canonicalAuthority.workItems.find((candidate) =>
  candidate.id === dependentJob.approvedWorkItemId)
assert.ok(rootWorkItem)
assert.ok(dependentWorkItem)
const rootExpectedAssetId = rootJob.expectedAssetIds[0]
const dependentExpectedAssetId = dependentJob.expectedAssetIds[0]
assert.ok(rootExpectedAssetId)
assert.ok(dependentExpectedAssetId)

const leaseAuthority = createCanonicalWorkerLeaseAuthorityService(context)
const artifactAuthority = createPrivateArtifactQaAuthorityService(context)
const runner = createCanonicalInternalAuthorityRunnerService(context)
const rootClaim = (await leaseAuthority.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'internal-authority-root-lease-claim',
})).workerLeaseClaim

await expectApiError(
  () => leaseAuthority.claim({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: dependentJob.id,
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'dependent-before-root-artifact-must-fail',
  }),
  'JOB_DEPENDENCY_NOT_READY',
)

const runInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  expectedAssetId: rootExpectedAssetId,
  purpose: 'execute_canonical_internal_authority_validation' as const,
}
const serverLease = {
  leaseId: rootClaim.lease.leaseId,
  leaseCredential: rootClaim.leaseCredential,
}

await expectApiError(
  () => runner.execute({ ...runInput, outputPath: '/tmp/caller-owned' } as never, serverLease),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => runner.execute(runInput, {
    ...serverLease,
    leaseCredential: `rpwl_v1_${'A'.repeat(43)}`,
  }),
  'WORKER_LEASE_EXPIRED',
)
await expectApiError(
  () => runner.execute({ ...runInput, expectedAssetId: dependentExpectedAssetId }, serverLease),
  'APPROVED_SNAPSHOT_REQUIRED',
)

const preStartedFence = await leaseAuthority.beginInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: rootClaim.lease.leaseId,
  leaseCredential: rootClaim.leaseCredential,
  runnerClass: 'canonical_authority_validation_runner_v1',
})
assert.equal(preStartedFence.executionFence.state, 'started')
assert.equal(preStartedFence.replayed, false)
await expectApiError(
  () => leaseAuthority.release({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: rootJob.id,
    leaseId: rootClaim.lease.leaseId,
    leaseCredential: rootClaim.leaseCredential,
    purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: 'release-started-root-execution-must-fail',
  }),
  'WORKER_CLAIM_CONFLICT',
)

const [left, right] = await Promise.all([
  runner.execute(runInput, serverLease),
  runner.execute(runInput, serverLease),
])
assert.equal(left.result.artifactId, right.result.artifactId)
assert.equal(left.result.qaEvaluationId, right.result.qaEvaluationId)
assert.equal(left.result.reconciliationId, right.result.reconciliationId)
assert.equal(left.result.sha256, right.result.sha256)
assert.equal(left.result.privateObjectIdentityHash, right.result.privateObjectIdentityHash)
assert.equal(left.execution.actualInternalOperationCompleted, true)
assert.equal(left.execution.externalToolExecuted, false)
assert.equal(left.execution.providerCallMade, false)
assert.equal(left.execution.sourceIntegrityBytesVerified, true)
assert.equal(left.execution.sourceMediaDecodedOrTransformed, false)
assert.equal(left.execution.renderExecuted, false)
assert.equal(left.execution.actualInternalToolCostMicros, 0)
assert.equal(left.result.privateTestDependencySatisfied, true)
assert.equal(left.result.liveRuntimeDependencySatisfied, false)
assert.equal(left.result.finalRenderAuthorized, false)
assert.equal(left.lease.executionFenceCompleted, true)
assert.equal(left.replay.executionFenceBeginReplayed, true)
assert.ok([
  left.replay.executionFenceCompleteReplayed,
  right.replay.executionFenceCompleteReplayed,
].includes(true))
assert.ok([
  left.replay.artifactRecordReplayed,
  right.replay.artifactRecordReplayed,
].includes(true))
assert.ok([
  left.replay.qaRecordReplayed,
  right.replay.qaRecordReplayed,
].includes(true))
assert.ok([
  left.replay.reconciliationReplayed,
  right.replay.reconciliationReplayed,
].includes(true))
const serializedResponse = JSON.stringify([left, right])
assert.equal(serializedResponse.includes(rootClaim.leaseCredential), false)
assert.equal(serializedResponse.includes(localStorageRoot), false)
assert.equal(serializedResponse.includes('/tmp/'), false)
assert.equal(serializedResponse.includes('bucketName'), false)
assert.equal(serializedResponse.includes('objectPath'), false)
assert.ok(Object.values(left.permissions).every((value) => value === false))
assert.equal(left.persistence.productionAuthority, false)

const artifactPath = join(
  localStorageRoot,
  canonicalInternalAuthorityArtifactRelativePath(left.result.privateObjectIdentityHash),
)
const originalArtifactBytes = await readFile(artifactPath)
assert.equal(originalArtifactBytes.byteLength, left.result.byteLength)
assert.equal((await stat(artifactPath)).mode & 0o777, 0o600)
assert.equal((await stat(dirname(artifactPath))).mode & 0o777, 0o700)
const parsedArtifact = JSON.parse(originalArtifactBytes.toString('utf8')) as Record<string, unknown>
assert.equal(parsedArtifact.schemaVersion, 'canonical-authority-validation-artifact-v1')
assert.equal(parsedArtifact.valid, true)
assert.equal(JSON.stringify(parsedArtifact).includes(rootClaim.leaseCredential), false)
assert.equal(JSON.stringify(parsedArtifact).includes(localStorageRoot), false)

const dependentDependencyReadiness = await artifactAuthority.deriveJobDependencyReadiness({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  snapshotId: snapshot.snapshotId,
  jobId: dependentJob.id,
  purpose: 'derive_private_artifact_dependency_readiness',
})
assert.equal(dependentDependencyReadiness.readinessGroup, 'ready_now_private_test_only')
assert.equal(dependentDependencyReadiness.privateTestDependencySatisfied, true)
assert.equal(dependentDependencyReadiness.liveRuntimeDependencySatisfied, false)
assert.equal(dependentDependencyReadiness.workerExecutionAuthorized, false)
assert.equal(dependentDependencyReadiness.toolExecutionAuthorized, false)

const releasedRoot = await leaseAuthority.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: rootClaim.lease.leaseId,
  leaseCredential: rootClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-root-execution',
})
assert.equal(releasedRoot.workerLeaseRelease.lease.executionFence.state, 'completed')

await writeFile(artifactPath, Buffer.concat([originalArtifactBytes, Buffer.from('tamper')]))
await expectApiError(
  () => leaseAuthority.claim({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: dependentJob.id,
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'dependent-tampered-root-artifact-must-fail',
  }),
  'JOB_DEPENDENCY_NOT_READY',
)
await writeFile(artifactPath, originalArtifactBytes)

const dependentClaim = (await leaseAuthority.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'dependent-after-root-artifact-ready',
})).workerLeaseClaim
assert.equal(dependentClaim.lease.jobId, dependentJob.id)
assert.equal(dependentClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(dependentClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  dependentClaim.lease.dependencyAuthority.selectedArtifacts[0]?.executionAttemptId,
  left.execution.executionAttemptId,
)
assert.equal(dependentClaim.executionAuthority.dispatchAuthorized, false)
assert.equal(dependentClaim.executionAuthority.toolExecutionAuthorized, false)
assert.equal(dependentClaim.persistenceEvidence.productionAuthority, false)

const verifiedDependentLease = await leaseAuthority.verifyActive({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentJob.id,
  leaseId: dependentClaim.lease.leaseId,
  leaseCredential: dependentClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_verification',
})
assert.equal(verifiedDependentLease.workerLeaseVerification.verified, true)
assert.equal(verifiedDependentLease.workerLeaseVerification.executionAuthority.dispatchAuthorized, false)

const artifactAggregatePath = join(
  localStorageRoot,
  privateArtifactQaAggregateRelativePath(userId, workspaceId),
)
const originalArtifactAggregate = await readFile(artifactAggregatePath, 'utf8')
const tamperedArtifactAggregate = JSON.parse(originalArtifactAggregate) as { checksumSha256: string }
tamperedArtifactAggregate.checksumSha256 = 'f'.repeat(64)
await writeFile(artifactAggregatePath, `${JSON.stringify(tamperedArtifactAggregate)}\n`)
clearPrivateArtifactQaAuthorityProcessStateForSmoke()
await expectApiError(
  () => leaseAuthority.verifyActive({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: dependentJob.id,
    leaseId: dependentClaim.lease.leaseId,
    leaseCredential: dependentClaim.leaseCredential,
    purpose: 'private_internal_canonical_lease_verification',
  }),
  'VALIDATION_FAILED',
)
await writeFile(artifactAggregatePath, originalArtifactAggregate)
clearPrivateArtifactQaAuthorityProcessStateForSmoke()
assert.equal((await leaseAuthority.verifyActive({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentJob.id,
  leaseId: dependentClaim.lease.leaseId,
  leaseCredential: dependentClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_verification',
})).workerLeaseVerification.verified, true)

const authorityAfter = await requireEditAuthority()
assert.equal(sha256AuthorityValue(authorityAfter), sha256AuthorityValue(authorityBefore))

const productionContext: ServiceContext = {
  ...context,
  env: loadRuntimeEnv({
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'cloud_run',
    WORKER_RUNTIME_MODE: 'disabled',
    STORAGE_MODE: 'gcs_disabled',
    API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: strongInternalSecret,
  }),
}
await expectApiError(
  () => createCanonicalInternalAuthorityRunnerService(productionContext).execute(runInput, serverLease),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'identity_only_runner_request_rejects_caller_path',
    'opaque_active_lease_required_and_wrong_credential_rejected',
    'started_execution_fence_blocks_concurrent_lease_release',
    'exact_root_work_item_and_expected_output_required',
    'concurrent_execution_is_one_content_addressed_artifact_authority',
    'private_json_bytes_hash_size_mode_and_semantics_verified',
    'artifact_qa_reconciliation_records_are_server_derived_and_replay_safe',
    'dependency_ready_job_receives_lease_only_after_root_evidence',
    'dependency_lease_freezes_exact_artifact_qa_reconciliation_and_execution_fence',
    'lease_time_private_object_bytes_are_reopened_and_verified',
    'tampered_private_artifact_and_checksum_store_fail_closed',
    'no_credentials_paths_provider_tools_render_cost_or_settlement_leak',
    'canonical_snapshot_and_reservation_authority_remain_immutable',
    'all_live_runtime_and_production_permissions_remain_false',
    'production_runtime_fails_closed',
  ],
}))

async function requireEditAuthority() {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function expectApiError(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
  }
}
