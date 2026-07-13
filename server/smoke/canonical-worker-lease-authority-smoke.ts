import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rename, stat, symlink, unlink, writeFile } from 'node:fs/promises'
import { mock } from 'node:test'
import { dirname, join } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS,
  createCanonicalWorkerLeaseAuthorityService,
} from '../services/canonical-worker-lease-authority-service'
import {
  MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS,
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke,
  readPrivateCanonicalWorkerLeaseAggregate,
  reconcileSnapshotLeasesForCompensation,
} from '../services/private-canonical-worker-lease-store'
import {
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import {
  CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY,
  canonicalWorkerLeaseAggregateSchema,
} from '../validation/canonical-worker-lease-authority-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Creates authenticated, approved, source-bound canonical snapshots, derived
// jobs, planned assets, funded reservations, and execution packages.
await import('./canonical-execution-readiness-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const routeWorkspaceId = 'workspace-authority-route-smoke'
const userId = 'user-authority-smoke'
const strongInternalSecret = 'rp-local-lease-secret-7Qv9m2Xc4Lk8Pw3Hd6Ns1Za5Tf0Bj'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: strongInternalSecret,
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'canonical-worker-lease-authority-smoke',
  auth: { userId, isMockUser: true },
}
const editAuthorityBefore = await requireEditAuthority(workspaceId)
const snapshot = editAuthorityBefore.snapshots.find((candidate) =>
  editAuthorityBefore.executionPackages.some((executionPackage) =>
    executionPackage.snapshotId === candidate.snapshotId))
assert.ok(snapshot)
const rootJob = editAuthorityBefore.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.dependencyJobIds.length === 0)
const dependentJob = editAuthorityBefore.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.dependencyJobIds.length > 0)
assert.ok(rootJob)
assert.ok(dependentJob)

const service = createCanonicalWorkerLeaseAuthorityService(context)
const claimInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  purpose: 'private_internal_canonical_lease_claim' as const,
  idempotencyKey: 'canonical-lease-claim-main-1',
}

await expectApiError(
  () => createCanonicalWorkerLeaseAuthorityService({
    ...context,
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      LOCAL_STORAGE_ROOT: localStorageRoot,
    }),
  }).claim(claimInput),
  'TOOL_NOT_READY',
)

await expectApiError(
  () => createCanonicalWorkerLeaseAuthorityService({
    ...context,
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      REEDITPRO_INTERNAL_SERVICE_TOKEN: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      LOCAL_STORAGE_ROOT: localStorageRoot,
    }),
  }).claim(claimInput),
  'TOOL_NOT_READY',
)

await expectApiError(
  () => service.claim({
    ...claimInput,
    approvedPlanSnapshot: { callerAuthored: true },
  } as never),
  'VALIDATION_FAILED',
)

await expectApiError(
  () => service.claim({
    ...claimInput,
    jobId: dependentJob.id,
    idempotencyKey: 'dependent-job-claim-must-fail',
  }),
  'JOB_DEPENDENCY_NOT_READY',
)

const [claimLeft, claimRight] = await Promise.all([
  service.claim(claimInput),
  service.claim(claimInput),
])
assert.deepEqual(claimLeft.workerLeaseClaim, claimRight.workerLeaseClaim)
const claim = claimLeft.workerLeaseClaim
const leaseCredential = claim.leaseCredential
assert.equal(claim.lease.workerIdentity, CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY)
assert.equal(claim.lease.attemptNumber, 1)
assert.equal(claim.lease.status, 'active')
assert.equal(claim.executionAuthority.dispatchAuthorized, false)
assert.equal(claim.executionAuthority.toolExecutionAuthorized, false)
assert.equal(claim.executionAuthority.providerCallAuthorized, false)
assert.equal(claim.executionAuthority.sourceObjectReadAuthorized, false)
assert.equal(claim.executionAuthority.artifactWriteAuthorized, false)
assert.equal(claim.executionAuthority.renderAuthorized, false)
assert.equal(claim.executionAuthority.creditSpendAuthorized, false)
assert.equal(claim.executionAuthority.noExecutionSideEffects, true)
assert.equal(claim.persistenceEvidence.distributedAuthority, false)
assert.equal(claim.persistenceEvidence.productionAuthority, false)
assert.equal(claim.persistenceEvidence.singleProcessSerializationOnly, true)
assert.equal(
  (Date.parse(claim.lease.expiresAt) - Date.parse(claim.lease.issuedAt)) / 1_000,
  Math.min(CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS, rootJob.attemptTimeoutSeconds),
)
assert.equal(
  (Date.parse(claim.lease.attemptDeadlineAt) - Date.parse(claim.lease.issuedAt)) / 1_000,
  rootJob.attemptTimeoutSeconds,
)

let leaseAggregate = await requireLeaseAggregate(workspaceId)
assert.equal(leaseAggregate.leases.length, 1)
assert.equal(leaseAggregate.idempotencyRecords.length, 1)
assert.equal(leaseAggregate.auditEvents.length, 1)
assert.equal(leaseAggregate.leases[0]!.credentialHashSha256, sha256Text(leaseCredential))
assert.equal(JSON.stringify(leaseAggregate).includes(leaseCredential), false)
assert.equal(JSON.stringify(leaseAggregate).includes(claimInput.idempotencyKey), false)
assert.equal(JSON.stringify(leaseAggregate.auditEvents).includes('credential'), false)
assert.equal(JSON.stringify(leaseAggregate.auditEvents).includes('workerIdentity'), false)
const capacityFixtureRecord = leaseAggregate.idempotencyRecords[0]!
assert.equal(canonicalWorkerLeaseAggregateSchema.safeParse({
  ...leaseAggregate,
  idempotencyRecords: Array.from(
    { length: MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS + 1 },
    (_, index) => ({
      ...capacityFixtureRecord,
      keyHash: sha256AuthorityValue({ capacityFixtureIndex: index }),
    }),
  ),
}).success, false)

const mainLeaseAggregatePath = leaseAggregatePath(workspaceId)
const persistedMainLeaseText = await readFile(mainLeaseAggregatePath, 'utf8')
assert.equal(persistedMainLeaseText.includes(leaseCredential), false)
assert.equal((await stat(mainLeaseAggregatePath)).mode & 0o777, 0o600)
assert.equal((await stat(dirname(mainLeaseAggregatePath))).mode & 0o777, 0o700)

const forgedCredential = `rpwl_v1_${'A'.repeat(43)}`
await expectApiError(
  () => service.heartbeat({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: rootJob.id,
    leaseId: claim.lease.leaseId,
    leaseCredential: forgedCredential,
    purpose: 'private_internal_canonical_lease_heartbeat',
    idempotencyKey: 'forged-heartbeat',
  }),
  'WORKER_LEASE_EXPIRED',
)

await expectApiError(
  () => service.heartbeat({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: dependentJob.id,
    leaseId: claim.lease.leaseId,
    leaseCredential,
    purpose: 'private_internal_canonical_lease_heartbeat',
    idempotencyKey: 'cross-job-heartbeat',
  }),
  'WORKER_LEASE_EXPIRED',
)

const heartbeatInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: claim.lease.leaseId,
  leaseCredential,
  purpose: 'private_internal_canonical_lease_heartbeat' as const,
  idempotencyKey: 'canonical-lease-heartbeat-main-1',
}
const [heartbeatLeft, heartbeatRight] = await Promise.all([
  service.heartbeat(heartbeatInput),
  service.heartbeat(heartbeatInput),
])
assert.deepEqual(heartbeatLeft.workerLeaseHeartbeat, heartbeatRight.workerLeaseHeartbeat)
assert.equal(heartbeatLeft.workerLeaseHeartbeat.executionAuthority.dispatchAuthorized, false)

const routeEditAuthority = await requireEditAuthority(routeWorkspaceId)
const routeLeasesAtSelection = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId: routeWorkspaceId,
})
const routeLeaseJobIds = new Set(routeLeasesAtSelection?.leases.map((lease) => lease.jobId) ?? [])
const newestRouteExecutionPackage = [...routeEditAuthority.executionPackages].reverse().find((executionPackage) => {
  const candidateSnapshot = routeEditAuthority.snapshots.find((candidate) =>
    candidate.snapshotId === executionPackage.snapshotId)
  const candidatePlan = candidateSnapshot
    ? routeEditAuthority.plans.find((plan) => plan.id === candidateSnapshot.planId)
    : undefined
  return candidatePlan?.status === 'approved' && routeEditAuthority.jobs.some((job) =>
    job.snapshotId === executionPackage.snapshotId &&
    job.dependencyJobIds.length === 0 &&
    job.maxAttempts >= 2 &&
    !routeLeaseJobIds.has(job.id))
})
assert.ok(newestRouteExecutionPackage)
const routeSnapshot = routeEditAuthority.snapshots.find((candidate) =>
  candidate.snapshotId === newestRouteExecutionPackage.snapshotId)
assert.ok(routeSnapshot)
const routeRootJob = routeEditAuthority.jobs.find((candidate) =>
  candidate.snapshotId === routeSnapshot.snapshotId &&
  candidate.dependencyJobIds.length === 0 &&
  candidate.maxAttempts >= 2 &&
  !routeLeaseJobIds.has(candidate.id))
assert.ok(routeRootJob)

await expectApiError(
  () => service.heartbeat({
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    leaseId: claim.lease.leaseId,
    leaseCredential,
    purpose: 'private_internal_canonical_lease_heartbeat',
    idempotencyKey: 'cross-workspace-heartbeat',
  }),
  'WORKER_LEASE_EXPIRED',
)

const releaseInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: claim.lease.leaseId,
  leaseCredential,
  purpose: 'private_internal_canonical_lease_release' as const,
  idempotencyKey: 'canonical-lease-release-main-1',
}
const releasedLeft = await service.release(releaseInput)
const releasedRight = await service.release(releaseInput)
assert.deepEqual(releasedLeft.workerLeaseRelease, releasedRight.workerLeaseRelease)
assert.equal(releasedLeft.workerLeaseRelease.lease.status, 'released')
assert.equal(releasedLeft.workerLeaseRelease.executionAuthority.dispatchAuthorized, false)

await expectApiError(
  () => service.heartbeat({
    ...heartbeatInput,
    idempotencyKey: 'heartbeat-after-release-must-fail',
  }),
  'WORKER_LEASE_EXPIRED',
)

clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
leaseAggregate = await requireLeaseAggregate(workspaceId)
assert.equal(leaseAggregate.leases[0]!.status, 'released')
const restartClaimReplay = await service.claim(claimInput)
assert.deepEqual(restartClaimReplay.workerLeaseClaim, claim)
assert.equal((await requireLeaseAggregate(workspaceId)).leases.length, 1)

const routeLeaseAggregateBeforeConcurrency = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId: routeWorkspaceId,
})
const controlledNow = Math.max(
  Date.now(),
  ...(routeLeaseAggregateBeforeConcurrency?.leases
    .filter((lease) => lease.jobId === routeRootJob.id && lease.status === 'active')
    .map((lease) => Date.parse(lease.expiresAt) + 1) ?? []),
)
mock.timers.enable({ apis: ['Date'], now: controlledNow })
try {
  const routeClaimInputA = {
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    purpose: 'private_internal_canonical_lease_claim' as const,
    idempotencyKey: 'route-expiry-claim-a',
  }
  const routeClaimInputB = {
    ...routeClaimInputA,
    idempotencyKey: 'route-expiry-claim-b',
  }
  const competingClaims = await Promise.allSettled([
    service.claim(routeClaimInputA),
    service.claim(routeClaimInputB),
  ])
  const successfulClaim = competingClaims.find((result) => result.status === 'fulfilled')
  const rejectedClaim = competingClaims.find((result) => result.status === 'rejected')
  assert.ok(
    successfulClaim?.status === 'fulfilled',
    `Expected one serialized claim to succeed: ${competingClaims.map((result) =>
      result.status === 'rejected' && result.reason instanceof ApiError
        ? `${result.reason.code}:${result.reason.message}`
        : result.status).join(' | ')}`,
  )
  assert.ok(rejectedClaim?.status === 'rejected')
  assert.ok(rejectedClaim.reason instanceof ApiError)
  assert.equal(rejectedClaim.reason.code, 'WORKER_CLAIM_CONFLICT')
  const routeClaim = successfulClaim.value.workerLeaseClaim
  const successfulRouteInput = routeClaimInputA.idempotencyKey === 'route-expiry-claim-a' &&
    (await service.claim(routeClaimInputA).catch(() => undefined))?.workerLeaseClaim.lease.leaseId === routeClaim.lease.leaseId
    ? routeClaimInputA
    : routeClaimInputB

  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
  assert.equal(
    (await requireLeaseAggregate(routeWorkspaceId)).leases.filter((lease) =>
      lease.jobId === routeRootJob.id).length,
    1,
  )

  const routeHeartbeatInput = {
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    leaseId: routeClaim.lease.leaseId,
    leaseCredential: routeClaim.leaseCredential,
    purpose: 'private_internal_canonical_lease_heartbeat' as const,
    idempotencyKey: 'route-live-revalidation-heartbeat',
  }
  const routeSourceObjectPath = await latestSourceObjectPath(routeWorkspaceId, routeSnapshot.projectId)
  const originalSourceBytes = await readFile(routeSourceObjectPath)
  try {
    await writeFile(routeSourceObjectPath, Buffer.concat([originalSourceBytes, Buffer.from('tampered')]))
    await expectApiError(() => service.heartbeat(routeHeartbeatInput), 'UPLOAD_NOT_FINALIZED')
  } finally {
    await writeFile(routeSourceObjectPath, originalSourceBytes)
  }
  const liveRevalidatedHeartbeat = await service.heartbeat(routeHeartbeatInput)
  assert.equal(liveRevalidatedHeartbeat.workerLeaseHeartbeat.lease.leaseId, routeClaim.lease.leaseId)
  const expiringStartedExecution = await service.beginInternalExecution({
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    leaseId: routeClaim.lease.leaseId,
    leaseCredential: routeClaim.leaseCredential,
    runnerClass: 'canonical_timeout_recovery_smoke_runner_v1',
  })
  assert.equal(expiringStartedExecution.executionFence.state, 'started')

  mock.timers.setTime(controlledNow + (routeRootJob.attemptTimeoutSeconds + 1) * 1_000)
  await expectApiError(
    () => service.heartbeat({
      ...routeHeartbeatInput,
      idempotencyKey: 'route-expired-heartbeat',
    }),
    'WORKER_LEASE_EXPIRED',
  )
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
  const expiredAggregate = await requireLeaseAggregate(routeWorkspaceId)
  assert.equal(
    expiredAggregate.leases.find((lease) => lease.id === routeClaim.lease.leaseId)?.status,
    'expired',
  )
  const expiredStartedLease = expiredAggregate.leases.find((lease) =>
    lease.id === routeClaim.lease.leaseId)
  assert.equal(expiredStartedLease?.executionFence.state, 'failed')
  assert.equal(expiredStartedLease?.executionFence.failureCategory, 'execution_timeout')
  assert.equal(expiredStartedLease?.executionFence.failureCode, 'WORKER_LEASE_EXPIRED')
  assert.equal(
    expiredStartedLease?.executionFence.recoveryPolicy,
    'same_operation_retry_within_approved_max_attempts',
  )
  assert.match(expiredStartedLease?.executionFence.failureEvidenceHash ?? '', /^[a-f0-9]{64}$/)
  assert.equal(expiredAggregate.auditEvents.some((event) => event.eventType === 'expired'), true)
  assert.equal(expiredAggregate.auditEvents.filter((event) =>
    event.leaseId === routeClaim.lease.leaseId && event.eventType === 'execution_failed').length, 1)
  const failedLeaseCompensationReadiness = await reconcileSnapshotLeasesForCompensation({
    scope: {
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    },
    snapshotId: routeSnapshot.snapshotId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    now: new Date().toISOString(),
  })
  assert.ok(failedLeaseCompensationReadiness.failedFenceCount >= 1)
  assert.equal(failedLeaseCompensationReadiness.inFlightStartedFenceCount, 0)

  const expiredExactReplay = await service.claim(successfulRouteInput)
  assert.equal(
    expiredExactReplay.workerLeaseClaim.lease.leaseId,
    routeClaim.lease.leaseId,
  )
  assert.equal(expiredExactReplay.workerLeaseClaim.leaseCredential, routeClaim.leaseCredential)
  assert.equal(expiredExactReplay.workerLeaseClaim.lease.executionFence.state, 'failed')
  assert.equal(
    expiredExactReplay.workerLeaseClaim.lease.executionFence.failureEvidenceHash,
    expiredStartedLease?.executionFence.failureEvidenceHash,
  )
  assert.equal(
    (await requireLeaseAggregate(routeWorkspaceId)).leases.find((lease) =>
      lease.id === routeClaim.lease.leaseId)?.status,
    'expired',
  )
  const retryClaim = (await service.claim({
    ...successfulRouteInput,
    idempotencyKey: 'route-attempt-two-after-terminal-timeout',
  })).workerLeaseClaim
  assert.equal(retryClaim.lease.attemptNumber, 2)
  assert.equal(retryClaim.lease.executionFence.state, 'not_started')
  await service.release({
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    leaseId: retryClaim.lease.leaseId,
    leaseCredential: retryClaim.leaseCredential,
    purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: 'release-route-attempt-two-after-timeout',
  })
  await expectApiError(
    () => service.claim({
      ...successfulRouteInput,
      idempotencyKey: 'route-attempt-three-over-approved-limit',
    }),
    'JOB_DEPENDENCY_NOT_READY',
  )
} finally {
  mock.timers.reset()
}

const editAuthorityAfter = await requireEditAuthority(workspaceId)
assert.equal(sha256AuthorityValue(editAuthorityAfter), sha256AuthorityValue(editAuthorityBefore))

const originalLeaseAggregateText = await readFile(mainLeaseAggregatePath, 'utf8')
const tamperedEnvelope = JSON.parse(originalLeaseAggregateText) as { checksumSha256: string }
tamperedEnvelope.checksumSha256 = 'f'.repeat(64)
await writeFile(mainLeaseAggregatePath, `${JSON.stringify(tamperedEnvelope)}\n`)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
await expectApiError(() => requireLeaseAggregate(workspaceId), 'VALIDATION_FAILED')
await writeFile(mainLeaseAggregatePath, originalLeaseAggregateText)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
assert.ok(await requireLeaseAggregate(workspaceId))

const symlinkTargetPath = `${mainLeaseAggregatePath}.real`
await rename(mainLeaseAggregatePath, symlinkTargetPath)
try {
  await symlink(symlinkTargetPath, mainLeaseAggregatePath)
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
  await expectApiError(() => requireLeaseAggregate(workspaceId), 'VALIDATION_FAILED')
} finally {
  await unlink(mainLeaseAggregatePath).catch(() => undefined)
  await rename(symlinkTargetPath, mainLeaseAggregatePath)
}

await expectApiError(
  () => createCanonicalWorkerLeaseAuthorityService({
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
  }).claim(claimInput),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'strict_identity_only_claim_contract',
    'strong_server_secret_required',
    'fixed_server_worker_identity_and_ttl_ceiling',
    'approved_attempt_deadline_caps_heartbeat',
    'root_or_verified_dependency_and_schedule_readiness_only',
    'concurrent_exact_claim_replay_once',
    'different_key_claim_conflict',
    'opaque_hmac_credential_sha256_only_at_rest',
    'timing_safe_forged_credential_rejection',
    'workspace_project_session_job_scope_isolation',
    'heartbeat_and_release_exact_replay',
    'live_canonical_source_and_hash_revalidation',
    'release_and_expiry_do_not_reactivate',
    'expired_started_execution_terminalizes_as_retry_bounded_failure',
    'failed_execution_fence_is_quiescent_for_post_dispatch_compensation',
    'restart_safe_deterministic_claim_replay',
    'bounded_checksum_protected_private_store',
    'private_modes_and_symlink_refusal',
    'no_dispatch_tool_provider_source_artifact_render_or_credit_authority',
    'canonical_edit_and_reservation_authority_not_mutated',
    'production_fail_closed',
  ],
}))

async function requireEditAuthority(targetWorkspaceId: string) {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function requireLeaseAggregate(targetWorkspaceId: string) {
  const aggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function latestSourceObjectPath(targetWorkspaceId: string, projectId: string): Promise<string> {
  const { readPrivateUploadMediaAuthorityAggregate } = await import('../services/private-upload-media-authority-store')
  const aggregate = await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  const storageObject = aggregate?.storageObjects.findLast((candidate) =>
    candidate.projectId === projectId && candidate.status === 'ready')
  assert.ok(storageObject)
  return join(localStorageRoot, storageObject.bucketName, storageObject.objectPath)
}

function leaseAggregatePath(targetWorkspaceId: string): string {
  return join(
    localStorageRoot,
    'canonical-worker-leases',
    'private-single-host-v1',
    sha256AuthorityValue({ ownerUserId: userId, workspaceId: targetWorkspaceId }),
    'aggregate.json',
  )
}

async function expectApiError(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code, error.message)
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
