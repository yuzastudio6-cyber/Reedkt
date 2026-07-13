import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mock } from 'node:test'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import {
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke,
  readPrivateCanonicalWorkerLeaseAggregate,
} from '../services/private-canonical-worker-lease-store'
import {
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  type PrivateEditAuthorityAggregate,
} from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

await import('./canonical-execution-readiness-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const routeWorkspaceId = 'workspace-authority-route-smoke'
const userId = 'user-authority-smoke'
const internalSecret = 'rp-verify-lease-secret-9Jm4Qx7Vc2Lp8Hd5Ns1Zk6Tw0By'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalSecret,
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'canonical-worker-lease-verification-smoke',
  auth: { userId, isMockUser: true },
}
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()

const mainAuthority = await requireEditAuthority(workspaceId)
const mainLeaseAuthorityBeforeClaim = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
const mainSelection = findClaimablePackagedRoot(mainAuthority, mainLeaseAuthorityBeforeClaim)
assert.ok(mainSelection)
const { snapshot: mainSnapshot, rootJob } = mainSelection
const dependentJob = mainAuthority.jobs.find((job) =>
  job.snapshotId === mainSnapshot.snapshotId && job.dependencyJobIds.length > 0)
assert.ok(dependentJob)

const routeAuthority = await requireEditAuthority(routeWorkspaceId)
const routeLeaseAuthorityBeforeClaim = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId: routeWorkspaceId,
})
const routeSelection = findClaimablePackagedRoot(routeAuthority, routeLeaseAuthorityBeforeClaim)
assert.ok(routeSelection)
const { snapshot: routeSnapshot, rootJob: routeRootJob } = routeSelection

const service = createCanonicalWorkerLeaseAuthorityService(context)
const claimInput = {
  workspaceId,
  projectId: mainSnapshot.projectId,
  editSessionId: mainSnapshot.editSessionId,
  jobId: rootJob.id,
  purpose: 'private_internal_canonical_lease_claim' as const,
  idempotencyKey: 'verification-smoke-main-claim',
}
const claim = (await service.claim(claimInput)).workerLeaseClaim
const verificationInput = {
  workspaceId,
  projectId: mainSnapshot.projectId,
  editSessionId: mainSnapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: claim.lease.leaseId,
  leaseCredential: claim.leaseCredential,
  purpose: 'private_internal_canonical_lease_verification' as const,
}
const storeBeforeVerification = await requireLeaseAuthority(workspaceId)
const storedClaimBeforeVerification = storeBeforeVerification.leases.find((lease) =>
  lease.id === claim.lease.leaseId)
assert.ok(storedClaimBeforeVerification)
const verification = (await service.verifyActive(verificationInput)).workerLeaseVerification
assert.equal(verification.verified, true)
assert.equal(verification.lease.status, 'active')
assert.equal(verification.lease.leaseId, claim.lease.leaseId)
assert.equal(verification.lease.attemptNumber, 1)
assert.equal(verification.lease.canonicalHashes.snapshotHash, claim.lease.canonicalHashes.snapshotHash)
assert.equal(verification.verificationEvidence.tenantAuthorization, 'passed')
assert.equal(verification.verificationEvidence.checksumProtectedStore, 'passed')
assert.equal(verification.verificationEvidence.timingSafeCredentialMatch, 'passed')
assert.equal(verification.verificationEvidence.activeAndUnexpired, 'passed')
assert.equal(verification.verificationEvidence.currentCanonicalReadiness, 'passed')
assert.equal(verification.verificationEvidence.currentReservation, 'passed')
assert.equal(verification.verificationEvidence.currentSourcePackageJobHashes, 'passed')
assert.equal(verification.verificationEvidence.leaseRenewed, false)
assert.equal(verification.verificationEvidence.credentialReturned, false)
assert.equal(verification.verificationEvidence.credentialHashReturned, false)
assert.equal(verification.executionAuthority.dispatchAuthorized, false)
assert.equal(verification.executionAuthority.toolExecutionAuthorized, false)
assert.equal(verification.executionAuthority.providerCallAuthorized, false)
assert.equal(verification.executionAuthority.sourceObjectReadAuthorized, false)
assert.equal(verification.executionAuthority.artifactWriteAuthorized, false)
assert.equal(verification.executionAuthority.renderAuthorized, false)
assert.equal(verification.executionAuthority.creditSpendAuthorized, false)
assert.equal(verification.persistenceEvidence.distributedAuthority, false)
assert.equal(verification.persistenceEvidence.productionAuthority, false)
assert.ok(Date.parse(verification.lease.expiresAt) > Date.parse(verification.verifiedAt))
const serializedVerification = JSON.stringify(verification)
assert.equal(serializedVerification.includes(claim.leaseCredential), false)
assert.equal(serializedVerification.includes('credentialHashSha256'), false)
assert.equal('leaseCredential' in verification, false)
const { verificationHash, ...verificationWithoutHash } = verification
assert.equal(verificationHash, sha256AuthorityValue(verificationWithoutHash))
const storeAfterVerification = await requireLeaseAuthority(workspaceId)
const storedClaimAfterVerification = storeAfterVerification.leases.find((lease) =>
  lease.id === claim.lease.leaseId)
assert.ok(storedClaimAfterVerification)
assert.equal(storeAfterVerification.revision, storeBeforeVerification.revision)
assert.equal(storeAfterVerification.auditEvents.length, storeBeforeVerification.auditEvents.length)
assert.equal(storedClaimAfterVerification.heartbeatAt, storedClaimBeforeVerification.heartbeatAt)
assert.equal(storedClaimAfterVerification.expiresAt, storedClaimBeforeVerification.expiresAt)

await expectApiError(
  () => service.verifyActive({
    ...verificationInput,
    approvedPlanSnapshot: { callerAuthored: true },
  } as never),
  'VALIDATION_FAILED',
)

await expectApiError(
  () => service.verifyActive({
    ...verificationInput,
    leaseCredential: `rpwl_v1_${'A'.repeat(43)}`,
  }),
  'WORKER_LEASE_EXPIRED',
)
assert.equal((await requireLeaseAuthority(workspaceId)).revision, storeBeforeVerification.revision)

await expectApiError(
  () => service.verifyActive({
    ...verificationInput,
    jobId: dependentJob.id,
  }),
  'WORKER_LEASE_EXPIRED',
)

await expectApiError(
  () => service.verifyActive({
    ...verificationInput,
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
  }),
  'WORKER_LEASE_EXPIRED',
)

const sourceObjectPath = await firstSourceObjectPath(workspaceId, mainSnapshot.projectId)
const originalSourceBytes = await readFile(sourceObjectPath)
try {
  await writeFile(sourceObjectPath, Buffer.concat([originalSourceBytes, Buffer.from('tampered')]))
  await expectApiError(() => service.verifyActive(verificationInput), 'UPLOAD_NOT_FINALIZED')
} finally {
  await writeFile(sourceObjectPath, originalSourceBytes)
}
assert.equal((await service.verifyActive(verificationInput)).workerLeaseVerification.verified, true)

const mainLeasePath = leaseAggregatePath(workspaceId)
const originalLeaseEnvelopeText = await readFile(mainLeasePath, 'utf8')
const invalidChecksumEnvelope = JSON.parse(originalLeaseEnvelopeText) as { checksumSha256: string }
invalidChecksumEnvelope.checksumSha256 = 'f'.repeat(64)
await writeFile(mainLeasePath, `${JSON.stringify(invalidChecksumEnvelope)}\n`)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
await expectApiError(() => service.verifyActive(verificationInput), 'VALIDATION_FAILED')
await writeFile(mainLeasePath, originalLeaseEnvelopeText)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()

const immutableTamperEnvelope = JSON.parse(originalLeaseEnvelopeText) as {
  aggregate: { leases: Array<{ canonicalHashes: { planHash: string } }> }
  checksumSha256: string
}
immutableTamperEnvelope.aggregate.leases[0]!.canonicalHashes.planHash = 'f'.repeat(64)
immutableTamperEnvelope.checksumSha256 = sha256AuthorityValue(immutableTamperEnvelope.aggregate)
await writeFile(mainLeasePath, `${JSON.stringify(immutableTamperEnvelope)}\n`)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
await expectApiError(() => service.verifyActive(verificationInput), 'VALIDATION_FAILED')
await writeFile(mainLeasePath, originalLeaseEnvelopeText)
clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
assert.equal((await service.verifyActive(verificationInput)).workerLeaseVerification.verified, true)

await service.release({
  workspaceId,
  projectId: mainSnapshot.projectId,
  editSessionId: mainSnapshot.editSessionId,
  jobId: rootJob.id,
  leaseId: claim.lease.leaseId,
  leaseCredential: claim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'verification-smoke-main-release',
})
await expectApiError(() => service.verifyActive(verificationInput), 'WORKER_LEASE_EXPIRED')

const controlledNow = Date.now()
mock.timers.enable({ apis: ['Date'], now: controlledNow })
try {
  const routeClaim = (await service.claim({
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'verification-smoke-route-expiry-claim',
  })).workerLeaseClaim
  const routeVerificationInput = {
    workspaceId: routeWorkspaceId,
    projectId: routeSnapshot.projectId,
    editSessionId: routeSnapshot.editSessionId,
    jobId: routeRootJob.id,
    leaseId: routeClaim.lease.leaseId,
    leaseCredential: routeClaim.leaseCredential,
    purpose: 'private_internal_canonical_lease_verification' as const,
  }
  assert.equal((await service.verifyActive(routeVerificationInput)).workerLeaseVerification.verified, true)
  mock.timers.setTime(controlledNow + (routeRootJob.attemptTimeoutSeconds + 1) * 1_000)
  await expectApiError(() => service.verifyActive(routeVerificationInput), 'WORKER_LEASE_EXPIRED')
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
  const expiredRouteAuthority = await requireLeaseAuthority(routeWorkspaceId)
  const expiredRouteLease = expiredRouteAuthority.leases.find((lease) =>
    lease.id === routeClaim.lease.leaseId)
  assert.ok(expiredRouteLease)
  assert.equal(expiredRouteLease.status, 'expired')
  assert.equal(expiredRouteAuthority.auditEvents.some((event) =>
    event.leaseId === routeClaim.lease.leaseId && event.eventType === 'expired'), true)
} finally {
  mock.timers.reset()
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
      REEDITPRO_INTERNAL_SERVICE_TOKEN: internalSecret,
    }),
  }).verifyActive(verificationInput),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'strict_identity_lease_and_opaque_credential_contract',
    'tenant_reauthorization_and_private_runtime_gate',
    'checksum_protected_store_and_timing_safe_credential_verification',
    'active_unexpired_lease_required_without_renewal',
    'current_reservation_source_package_job_and_hash_revalidation',
    'safe_hashed_verification_envelope_without_credential',
    'all_execution_authorizations_remain_false',
    'successful_verification_is_store_read_only',
    'forged_and_cross_scope_credential_rejected',
    'released_lease_rejected',
    'expired_lease_persisted_and_rejected_after_restart',
    'source_checksum_store_checksum_and_immutable_lineage_tamper_rejected',
    'production_and_distributed_authority_fail_closed',
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

function findClaimablePackagedRoot(
  aggregate: PrivateEditAuthorityAggregate,
  leaseAuthority: Awaited<ReturnType<typeof readPrivateCanonicalWorkerLeaseAggregate>>,
) {
  for (const snapshot of aggregate.snapshots) {
    const plan = aggregate.plans.find((candidate) => candidate.id === snapshot.planId)
    const estimate = aggregate.estimates.find((candidate) => candidate.id === snapshot.estimateId)
    const reservation = aggregate.reservations.find((candidate) => candidate.id === snapshot.reservationId)
    const approval = aggregate.approvals.find((candidate) => candidate.id === snapshot.approvalId)
    const executionPackage = aggregate.executionPackages.find((candidate) =>
      candidate.snapshotId === snapshot.snapshotId)
    const remainingReservedCredits = reservation
      ? reservation.reservedCredits - reservation.spentCredits - reservation.releasedCredits - reservation.refundedCredits
      : 0

    if (
      !executionPackage ||
      plan?.status !== 'approved' ||
      estimate?.status !== 'approved' ||
      !reservation ||
      !['reserved', 'partially_spent'].includes(reservation.status) ||
      remainingReservedCredits <= 0 ||
      Date.parse(reservation.expiresAt) <= Date.now() ||
      !approval ||
      approval.snapshotId !== snapshot.snapshotId ||
      approval.planId !== plan.id ||
      approval.estimateId !== estimate.id ||
      approval.reservationId !== reservation.id ||
      reservation.snapshotId !== snapshot.snapshotId ||
      reservation.planId !== plan.id ||
      reservation.estimateId !== estimate.id
    ) {
      continue
    }

    const rootJob = aggregate.jobs.find((job) => {
      if (
        job.snapshotId !== snapshot.snapshotId ||
        job.dependencyJobIds.length > 0 ||
        job.status !== 'ready'
      ) {
        return false
      }
      const priorLeases = leaseAuthority?.leases.filter((lease) => lease.jobId === job.id) ?? []
      return !priorLeases.some((lease) => lease.status === 'active') &&
        priorLeases.length < job.maxAttempts
    })
    if (rootJob) return { snapshot, rootJob }
  }

  return undefined
}

async function requireLeaseAuthority(targetWorkspaceId: string) {
  const aggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function firstSourceObjectPath(targetWorkspaceId: string, projectId: string): Promise<string> {
  const { readPrivateUploadMediaAuthorityAggregate } = await import('../services/private-upload-media-authority-store')
  const aggregate = await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  const storageObject = aggregate?.storageObjects.find((candidate) =>
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
    assert.equal(error.code, code)
  }
}
