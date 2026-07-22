import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY,
  CANONICAL_WORKER_LEASE_RECORD_VERSION,
  CANONICAL_WORKER_LEASE_RESPONSE_VERSION,
  CANONICAL_WORKER_LEASE_VERIFICATION_VERSION,
  canonicalWorkerLeaseClaimResponseSchema,
  canonicalWorkerLeaseHeartbeatResponseSchema,
  canonicalWorkerLeaseReleaseResponseSchema,
  canonicalWorkerLeaseVerificationResponseSchema,
  claimCanonicalWorkerLeaseSchema,
  heartbeatCanonicalWorkerLeaseSchema,
  releaseCanonicalWorkerLeaseSchema,
  verifyCanonicalWorkerLeaseSchema,
  type CanonicalWorkerLeaseAggregate,
  type CanonicalWorkerLeaseClaimResponse,
  type CanonicalWorkerLeaseDependencyAuthority,
  type CanonicalWorkerLeaseExecutionFence,
  type CanonicalWorkerLeaseHashes,
  type CanonicalWorkerLeaseHeartbeatResponse,
  type CanonicalWorkerLeaseIdempotencyRecord,
  type CanonicalWorkerLeaseRecord,
  type CanonicalWorkerLeaseReleaseResponse,
  type CanonicalWorkerLeaseVerificationResponse,
  type ClaimCanonicalWorkerLeaseInput,
  type HeartbeatCanonicalWorkerLeaseInput,
  type ReleaseCanonicalWorkerLeaseInput,
  type VerifyCanonicalWorkerLeaseInput,
} from '../validation/canonical-worker-lease-authority-schemas'
import {
  type CanonicalExecutionReadinessEnvelope,
} from '../validation/canonical-execution-readiness-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { withCanonicalExecutionDomainLock } from './canonical-execution-domain-lock'
import { verifyCanonicalInternalAuthorityArtifact } from './canonical-internal-authority-artifact-verifier'
import { verifyCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-verifier'
import { verifyCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-verifier'
import { verifyCanonicalPrivateMediaArtifact } from './canonical-private-media-artifact-verifier'
import { verifyCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-verifier'
import { verifyCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-verifier'
import { verifyCanonicalPrivateAudioArtifact } from './canonical-private-audio-artifact-verifier'
import { verifyCanonicalPrivateFinalCompositionArtifact } from './canonical-private-final-artifact-verifier'
import { verifyCanonicalPrivateProviderOutputArtifact } from
  './canonical-private-provider-output-artifact-verifier'
import { createPrivateArtifactQaAuthorityService } from './private-artifact-qa-authority-service'
import {
  MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS,
  MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS,
  MAX_CANONICAL_WORKER_LEASE_RECORDS,
  canonicalWorkerLeaseFailureEvidenceHash,
  canonicalWorkerLeaseImmutableHash,
  mutatePrivateCanonicalWorkerLeaseAggregate,
  readPrivateCanonicalWorkerLeaseAggregate,
  type CanonicalWorkerLeaseStoreScope,
} from './private-canonical-worker-lease-store'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS = 300 as const

const LEASE_CREDENTIAL_DOMAIN = 'reeditpro:canonical-private-worker-lease:v1'
const MINIMUM_LEASE_SECRET_BYTES = 32
const MINIMUM_LEASE_SECRET_UNIQUE_CHARACTERS = 12

type LeaseMutationOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError }

export interface CanonicalWorkerLeaseClaimResult {
  workerLeaseClaim: CanonicalWorkerLeaseClaimResponse
  warnings: string[]
}

export interface CanonicalWorkerLeaseHeartbeatResult {
  workerLeaseHeartbeat: CanonicalWorkerLeaseHeartbeatResponse
  warnings: string[]
}

export interface CanonicalWorkerLeaseReleaseResult {
  workerLeaseRelease: CanonicalWorkerLeaseReleaseResponse
  warnings: string[]
}

export interface CanonicalWorkerLeaseVerificationResult {
  workerLeaseVerification: CanonicalWorkerLeaseVerificationResponse
  warnings: string[]
}

export interface CanonicalWorkerLeaseInternalExecutionInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
  leaseId: string
  leaseCredential: string
  runnerClass: string
}

export interface CanonicalWorkerLeaseInternalExecutionFenceResult {
  lease: CanonicalWorkerLeaseRecord
  executionFence: CanonicalWorkerLeaseExecutionFence & {
    state: 'started' | 'completed'
    executionAttemptId: string
    runnerClass: string
    startedAt: string
  }
  replayed: boolean
  testOnly: true
}

export type CanonicalWorkerLeaseInternalFailureCategory =
  | 'runtime_unavailable'
  | 'execution_timeout'
  | 'output_validation_failed'
  | 'authority_changed'
  | 'unknown_internal'

export type CanonicalWorkerLeaseInternalFailureRecoveryPolicy =
  | 'same_operation_retry_within_approved_max_attempts'
  | 'fallback_or_user_review_required'

export interface CanonicalWorkerLeaseInternalExecutionFailureInput
  extends CanonicalWorkerLeaseInternalExecutionInput {
  failureCategory: CanonicalWorkerLeaseInternalFailureCategory
  failureCode: ApiErrorCode
  recoveryPolicy: CanonicalWorkerLeaseInternalFailureRecoveryPolicy
}

export interface CanonicalWorkerLeaseInternalExecutionFailureResult {
  lease: CanonicalWorkerLeaseRecord
  resolution:
    | 'released_before_execution'
    | 'failed_before_commit'
    | 'completed_requires_reconciliation'
  replayed: boolean
  testOnly: true
}

export function createCanonicalWorkerLeaseAuthorityService(context: ServiceContext) {
  return {
    async claim(input: ClaimCanonicalWorkerLeaseInput): Promise<CanonicalWorkerLeaseClaimResult> {
      const body = parseClaim(input)
      const secret = authorizeLeaseMutationRuntime(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      return withCanonicalExecutionDomainLock({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
      }, async () => {
      const eligibility = await loadLeaseEligibleJobReadiness(context, body)
      const { readiness, dependencyAuthority } = eligibility
      const canonicalHashes = hashesFromReadiness(readiness)
      const requestHash = leaseRequestHash('claim', access.userId, body)
      const keyHash = leaseIdempotencyKeyHash('claim', access.userId, body.workspaceId, body.idempotencyKey)
      const timestamp = new Date().toISOString()
      const attemptDeadlineAt = new Date(
        Date.parse(timestamp) + readiness.job.attemptTimeoutSeconds * 1_000,
      ).toISOString()
      const expiresAt = fixedLeaseExpiry(timestamp, attemptDeadlineAt)
      const scope = leaseStoreScope(context, access.userId, access.workspaceId)

      const outcome = await mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
        lease: CanonicalWorkerLeaseRecord
        idempotency: CanonicalWorkerLeaseIdempotencyRecord
      }>>({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const expirationChanged = expireActiveLeases(aggregate, timestamp)
          const replay = findIdempotency(aggregate, 'claim', keyHash)
          if (replay) {
            if (replay.requestHash !== requestHash) {
              return mutationError(idempotencyConflict(), expirationChanged)
            }
            const replayLease = aggregate.leases.find((lease) => lease.id === replay.leaseId)
            if (!replayLease) return mutationError(invalidLeaseAuthority('Claim replay lease is missing.'), expirationChanged)
            assertCredentialDerivationConsistent(secret, replayLease)
            return mutationSuccess({ lease: replayLease, idempotency: replay }, expirationChanged)
          }

          const activeLease = aggregate.leases.find((lease) =>
            lease.jobId === body.jobId && lease.status === 'active')
          if (activeLease) {
            return mutationError(
              new ApiError('WORKER_CLAIM_CONFLICT', 'Canonical job already has an active private worker lease.', 409),
              expirationChanged,
            )
          }
          const attemptNumber = aggregate.leases.filter((lease) => lease.jobId === body.jobId).length + 1
          if (attemptNumber > readiness.job.maxAttempts) {
            return mutationError(new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'Canonical job exhausted its immutable approved attempt allowance.',
              409,
              { requiredFlow: 'fallback_user_review_or_new_approval' },
            ), expirationChanged)
          }
          ensureLeaseCapacity(aggregate, { leases: 1, idempotency: 1, audit: 1 })

          const leaseId = `canonical_worker_lease_${randomUUID()}`
          const credential = deriveLeaseCredential(secret, {
            leaseId,
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId: body.jobId,
            approvedPlanSnapshotId: readiness.job.approvedPlanSnapshotId,
            reservationId: readiness.reservation.reservationId,
            workerIdentity: CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY,
            attemptNumber,
            issuedAt: timestamp,
            attemptDeadlineAt,
            authorityRevisionAtClaim: readiness.authorityRevision,
            canonicalHashes,
            dependencyAuthority,
            claimRequestHash: requestHash,
          })
          const leaseWithoutImmutableHash: Omit<CanonicalWorkerLeaseRecord, 'immutableLeaseHash'> = {
            schemaVersion: CANONICAL_WORKER_LEASE_RECORD_VERSION,
            id: leaseId,
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId: body.jobId,
            approvedPlanSnapshotId: readiness.job.approvedPlanSnapshotId,
            reservationId: readiness.reservation.reservationId,
            workerIdentity: CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY,
            attemptNumber,
            status: 'active',
            claimRequestHash: requestHash,
            credentialHashSha256: sha256Text(credential),
            authorityRevisionAtClaim: readiness.authorityRevision,
            canonicalHashes,
            dependencyAuthority,
            executionFence: { state: 'not_started' },
            issuedAt: timestamp,
            attemptDeadlineAt,
            initialExpiresAt: expiresAt,
            heartbeatAt: timestamp,
            expiresAt,
          }
          const lease: CanonicalWorkerLeaseRecord = {
            ...leaseWithoutImmutableHash,
            immutableLeaseHash: canonicalWorkerLeaseImmutableHash(leaseWithoutImmutableHash),
          }
          const idempotency: CanonicalWorkerLeaseIdempotencyRecord = {
            operation: 'claim',
            keyHash,
            requestHash,
            leaseId,
            responseStatus: 'active',
            responseAt: timestamp,
            responseExpiresAt: expiresAt,
            completedAt: timestamp,
          }
          aggregate.leases.push(lease)
          aggregate.idempotencyRecords.push(idempotency)
          aggregate.auditEvents.push(auditEvent('claimed', lease, timestamp))
          return mutationSuccess({ lease, idempotency }, true)
        },
      })
      const { lease, idempotency } = unwrapMutation(outcome)
      const leaseCredential = deriveAndVerifyStoredLeaseCredential(secret, lease)
      return {
        workerLeaseClaim: buildClaimResponse(lease, idempotency, leaseCredential),
        warnings: leaseWarnings(),
      }
      })
    },

    async heartbeat(input: HeartbeatCanonicalWorkerLeaseInput): Promise<CanonicalWorkerLeaseHeartbeatResult> {
      const body = parseHeartbeat(input)
      const secret = authorizeLeaseMutationRuntime(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const scope = leaseStoreScope(context, access.userId, access.workspaceId)
      await preflightVerifyLeaseCredential(scope, secret, body)
      const eligibility = await loadLeaseEligibleJobReadiness(context, body)
      const { readiness, dependencyAuthority } = eligibility
      const canonicalHashes = hashesFromReadiness(readiness)
      const presentedCredentialHash = sha256Text(body.leaseCredential)
      const requestHash = leaseRequestHash('heartbeat', access.userId, {
        ...body,
        leaseCredential: undefined,
        presentedCredentialHash,
      })
      const keyHash = leaseIdempotencyKeyHash('heartbeat', access.userId, body.workspaceId, body.idempotencyKey)
      const timestamp = new Date().toISOString()

      const outcome = await mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
        lease: CanonicalWorkerLeaseRecord
        idempotency: CanonicalWorkerLeaseIdempotencyRecord
      }>>({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const expirationChanged = expireActiveLeases(aggregate, timestamp)
          const lease = findScopedLease(aggregate, body)
          if (!lease) return mutationError(workerLeaseUnavailable(), expirationChanged)
          verifyLeaseCredential(secret, lease, body.leaseCredential)
          assertLiveCanonicalLeaseHashes(lease, canonicalHashes, readiness, dependencyAuthority)

          const replay = findIdempotency(aggregate, 'heartbeat', keyHash)
          if (replay) {
            if (replay.requestHash !== requestHash || replay.leaseId !== lease.id) {
              return mutationError(idempotencyConflict(), expirationChanged)
            }
            return mutationSuccess({ lease, idempotency: replay }, expirationChanged)
          }
          if (lease.status !== 'active' || Date.parse(lease.expiresAt) <= Date.parse(timestamp)) {
            return mutationError(workerLeaseUnavailable(), expirationChanged)
          }
          const expiresAt = fixedLeaseExpiry(timestamp, lease.attemptDeadlineAt)
          ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 1, audit: 1 })
          lease.heartbeatAt = timestamp
          lease.expiresAt = expiresAt
          const idempotency: CanonicalWorkerLeaseIdempotencyRecord = {
            operation: 'heartbeat',
            keyHash,
            requestHash,
            leaseId: lease.id,
            responseStatus: 'active',
            responseAt: timestamp,
            responseExpiresAt: expiresAt,
            completedAt: timestamp,
          }
          aggregate.idempotencyRecords.push(idempotency)
          aggregate.auditEvents.push(auditEvent('heartbeat', lease, timestamp))
          return mutationSuccess({ lease, idempotency }, true)
        },
      })
      const { lease, idempotency } = unwrapMutation(outcome)
      return {
        workerLeaseHeartbeat: buildHeartbeatResponse(lease, idempotency),
        warnings: leaseWarnings(),
      }
    },

    async release(input: ReleaseCanonicalWorkerLeaseInput): Promise<CanonicalWorkerLeaseReleaseResult> {
      const body = parseRelease(input)
      const secret = authorizeLeaseMutationRuntime(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const scope = leaseStoreScope(context, access.userId, access.workspaceId)
      await preflightVerifyLeaseCredential(scope, secret, body)
      const presentedCredentialHash = sha256Text(body.leaseCredential)
      const requestHash = leaseRequestHash('release', access.userId, {
        ...body,
        leaseCredential: undefined,
        presentedCredentialHash,
      })
      const keyHash = leaseIdempotencyKeyHash('release', access.userId, body.workspaceId, body.idempotencyKey)
      const timestamp = new Date().toISOString()

      const outcome = await mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
        lease: CanonicalWorkerLeaseRecord
        idempotency: CanonicalWorkerLeaseIdempotencyRecord
      }>>({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const expirationChanged = expireActiveLeases(aggregate, timestamp)
          const lease = findScopedLease(aggregate, body)
          if (!lease) return mutationError(workerLeaseUnavailable(), expirationChanged)
          verifyLeaseCredential(secret, lease, body.leaseCredential)
          const replay = findIdempotency(aggregate, 'release', keyHash)
          if (replay) {
            if (replay.requestHash !== requestHash || replay.leaseId !== lease.id) {
              return mutationError(idempotencyConflict(), expirationChanged)
            }
            return mutationSuccess({ lease, idempotency: replay }, expirationChanged)
          }
          if (lease.status !== 'active' || Date.parse(lease.expiresAt) <= Date.parse(timestamp)) {
            return mutationError(workerLeaseUnavailable(), expirationChanged)
          }
          if (lease.executionFence.state === 'started') {
            return mutationError(new ApiError(
              'WORKER_CLAIM_CONFLICT',
              'A started canonical worker execution must complete or expire before lease release.',
              409,
            ), expirationChanged)
          }
          ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 1, audit: 1 })
          lease.status = 'released'
          lease.releasedAt = timestamp
          const idempotency: CanonicalWorkerLeaseIdempotencyRecord = {
            operation: 'release',
            keyHash,
            requestHash,
            leaseId: lease.id,
            responseStatus: 'released',
            responseAt: timestamp,
            responseExpiresAt: lease.expiresAt,
            completedAt: timestamp,
          }
          aggregate.idempotencyRecords.push(idempotency)
          aggregate.auditEvents.push(auditEvent('released', lease, timestamp))
          return mutationSuccess({ lease, idempotency }, true)
        },
      })
      const { lease, idempotency } = unwrapMutation(outcome)
      return {
        workerLeaseRelease: buildReleaseResponse(lease, idempotency),
        warnings: leaseWarnings(),
      }
    },

    async verifyActive(input: VerifyCanonicalWorkerLeaseInput): Promise<CanonicalWorkerLeaseVerificationResult> {
      const body = parseVerification(input)
      const secret = authorizeLeaseMutationRuntime(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const scope = leaseStoreScope(context, access.userId, access.workspaceId)
      await preflightVerifyLeaseCredential(scope, secret, body)

      const preflightTimestamp = new Date().toISOString()
      const preflightOutcome = await verifyStoredActiveLease({
        scope,
        secret,
        body,
        timestamp: preflightTimestamp,
      })
      unwrapMutation(preflightOutcome)

      const eligibility = await loadLeaseEligibleJobReadiness(context, body)
      const { readiness, dependencyAuthority } = eligibility
      const canonicalHashes = hashesFromReadiness(readiness)
      const verifiedAt = new Date().toISOString()
      const finalOutcome = await verifyStoredActiveLease({
        scope,
        secret,
        body,
        timestamp: verifiedAt,
        canonicalHashes,
        readiness,
        dependencyAuthority,
      })
      const lease = unwrapMutation(finalOutcome).lease
      return {
        workerLeaseVerification: buildVerificationResponse(lease, verifiedAt),
        warnings: [
          ...leaseWarnings(),
          'Active lease verification is read-only except for safely persisting an observed expiry; it never renews the lease.',
          'Downstream execution must still satisfy separate dispatch, tool/provider, source-read, artifact, QA, render, and credit-spend gates.',
        ],
      }
    },

    async beginInternalExecution(
      input: CanonicalWorkerLeaseInternalExecutionInput,
    ): Promise<CanonicalWorkerLeaseInternalExecutionFenceResult> {
      return mutateInternalExecutionFence(context, input, 'begin')
    },

    async completeInternalExecution(
      input: CanonicalWorkerLeaseInternalExecutionInput & { executionAttemptId: string },
    ): Promise<CanonicalWorkerLeaseInternalExecutionFenceResult> {
      return mutateInternalExecutionFence(context, input, 'complete')
    },

    async failInternalExecution(
      input: CanonicalWorkerLeaseInternalExecutionFailureInput,
    ): Promise<CanonicalWorkerLeaseInternalExecutionFailureResult> {
      return mutateInternalExecutionFailure(context, input)
    },
  }
}

type LeaseIdentity = Pick<
  ClaimCanonicalWorkerLeaseInput,
  'workspaceId' | 'projectId' | 'editSessionId' | 'jobId'
>

interface LeaseEligibility {
  readiness: CanonicalExecutionReadinessEnvelope
  dependencyAuthority: CanonicalWorkerLeaseDependencyAuthority
}

async function mutateInternalExecutionFence(
  context: ServiceContext,
  input: CanonicalWorkerLeaseInternalExecutionInput & { executionAttemptId?: string },
  operation: 'begin' | 'complete',
): Promise<CanonicalWorkerLeaseInternalExecutionFenceResult> {
  assertExactInternalExecutionInput(input, operation)
  const body = parseVerification({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    jobId: input.jobId,
    leaseId: input.leaseId,
    leaseCredential: input.leaseCredential,
    purpose: 'private_internal_canonical_lease_verification',
  })
  assertSafeInternalExecutionIdentity(input.runnerClass, 'runner class')
  if (operation === 'complete') {
    assertSafeInternalExecutionIdentity(input.executionAttemptId, 'execution attempt id')
  } else if (input.executionAttemptId !== undefined) {
    throw validationError({ executionAttemptId: ['Begin must not accept a caller-authored execution attempt ID.'] })
  }

  const secret = authorizeLeaseMutationRuntime(context)
  const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
  const scope = leaseStoreScope(context, access.userId, access.workspaceId)
  return withCanonicalExecutionDomainLock({
    ...scope,
    projectId: body.projectId,
    editSessionId: body.editSessionId,
  }, async () => {
    const eligibility = await loadLeaseEligibleJobReadiness(context, body)
    const canonicalHashes = hashesFromReadiness(eligibility.readiness)
    const timestamp = new Date().toISOString()
    const outcome = await mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
      lease: CanonicalWorkerLeaseRecord
      replayed: boolean
    }>>({
      scope,
      now: timestamp,
      mutation: (aggregate) => {
      const expirationChanged = expireActiveLeases(aggregate, timestamp)
      const lease = findScopedLease(aggregate, body)
      if (!lease) return mutationError(workerLeaseUnavailable(), expirationChanged)
      verifyLeaseCredential(secret, lease, body.leaseCredential)
      assertLiveCanonicalLeaseHashes(
        lease,
        canonicalHashes,
        eligibility.readiness,
        eligibility.dependencyAuthority,
      )
      const deterministicAttemptId = internalExecutionAttemptId(lease, input.runnerClass)
      const fence = lease.executionFence

      if (operation === 'begin') {
        if (fence.state === 'failed') {
          return mutationError(new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'Canonical worker execution attempt is terminally failed.',
            409,
            {
              requiredGate: fence.recoveryPolicy ===
                'same_operation_retry_within_approved_max_attempts'
                ? 'canonical_retry_same_approved_operation'
                : 'canonical_failure_fallback_user_review_or_new_approval',
              failureCategory: fence.failureCategory,
              failureEvidenceHash: fence.failureEvidenceHash,
            },
          ), expirationChanged)
        }
        if (fence.state !== 'not_started') {
          if (
            fence.executionAttemptId !== deterministicAttemptId ||
            fence.runnerClass !== input.runnerClass ||
            (fence.state === 'started' && lease.status !== 'active')
          ) {
            return mutationError(invalidLeaseAuthority('Worker execution fence belongs to another attempt.'), expirationChanged)
          }
          return mutationSuccess({ lease: structuredClone(lease), replayed: true }, expirationChanged)
        }
        if (
          lease.status !== 'active' ||
          Date.parse(lease.expiresAt) <= Date.parse(timestamp) ||
          Date.parse(lease.attemptDeadlineAt) <= Date.parse(timestamp)
        ) {
          return mutationError(workerLeaseUnavailable(), expirationChanged)
        }
        ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 0, audit: 1 })
        lease.executionFence = {
          state: 'started',
          executionAttemptId: deterministicAttemptId,
          runnerClass: input.runnerClass,
          startedAt: timestamp,
        }
        aggregate.auditEvents.push(auditEvent('execution_started', lease, timestamp))
        return mutationSuccess({ lease: structuredClone(lease), replayed: false }, true)
      }

      if (
        fence.state === 'completed' &&
        fence.executionAttemptId === input.executionAttemptId &&
        fence.runnerClass === input.runnerClass
      ) {
        return mutationSuccess({ lease: structuredClone(lease), replayed: true }, expirationChanged)
      }
      if (
        lease.status !== 'active' ||
        Date.parse(lease.expiresAt) <= Date.parse(timestamp) ||
        Date.parse(lease.attemptDeadlineAt) <= Date.parse(timestamp) ||
        fence.state !== 'started' ||
        fence.executionAttemptId !== input.executionAttemptId ||
        fence.executionAttemptId !== deterministicAttemptId ||
        fence.runnerClass !== input.runnerClass
      ) {
        return mutationError(workerLeaseUnavailable(), expirationChanged)
      }
      ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 0, audit: 1 })
      lease.executionFence = {
        ...fence,
        state: 'completed',
        commitAuthorizedAt: timestamp,
        completedAt: timestamp,
      }
      aggregate.auditEvents.push(auditEvent('execution_completed', lease, timestamp))
      return mutationSuccess({ lease: structuredClone(lease), replayed: false }, true)
      },
    })
    const { lease, replayed } = unwrapMutation(outcome)
    const executionFence = requireCommittedExecutionFence(lease.executionFence, operation)
    return {
      lease,
      executionFence,
      replayed,
      testOnly: true,
    }
  })
}

async function mutateInternalExecutionFailure(
  context: ServiceContext,
  input: CanonicalWorkerLeaseInternalExecutionFailureInput,
): Promise<CanonicalWorkerLeaseInternalExecutionFailureResult> {
  assertExactInternalExecutionFailureInput(input)
  assertSafeInternalExecutionIdentity(input.runnerClass, 'runner class')
  assertFailureRecoveryPolicy(input.failureCategory, input.recoveryPolicy)
  const body = parseVerification({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    jobId: input.jobId,
    leaseId: input.leaseId,
    leaseCredential: input.leaseCredential,
    purpose: 'private_internal_canonical_lease_verification',
  })
  const secret = authorizeLeaseMutationRuntime(context)
  const ownerUserId = getRequiredAuthUserId(context)
  const scope = leaseStoreScope(context, ownerUserId, body.workspaceId)

  return withCanonicalExecutionDomainLock({
    ...scope,
    projectId: body.projectId,
    editSessionId: body.editSessionId,
  }, async () => {
    const timestamp = new Date().toISOString()
    const outcome = await mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
      lease: CanonicalWorkerLeaseRecord
      resolution: CanonicalWorkerLeaseInternalExecutionFailureResult['resolution']
      replayed: boolean
    }>>({
      scope,
      now: timestamp,
      mutation: (aggregate) => {
        const expirationChanged = expireActiveLeases(aggregate, timestamp)
        const lease = findScopedLease(aggregate, body)
        if (!lease) return mutationError(workerLeaseUnavailable(), expirationChanged)
        verifyLeaseCredential(secret, lease, body.leaseCredential)
        const deterministicAttemptId = internalExecutionAttemptId(lease, input.runnerClass)
        const fence = lease.executionFence

        if (fence.state === 'failed') {
          if (
            fence.executionAttemptId !== deterministicAttemptId ||
            fence.runnerClass !== input.runnerClass
          ) {
            return mutationError(
              invalidLeaseAuthority('Failed worker execution belongs to another attempt.'),
              expirationChanged,
            )
          }
          return mutationSuccess({
            lease: structuredClone(lease),
            resolution: 'failed_before_commit',
            replayed: true,
          }, expirationChanged)
        }

        if (fence.state === 'completed') {
          if (
            fence.executionAttemptId !== deterministicAttemptId ||
            fence.runnerClass !== input.runnerClass
          ) {
            return mutationError(
              invalidLeaseAuthority('Completed worker execution belongs to another attempt.'),
              expirationChanged,
            )
          }
          return mutationSuccess({
            lease: structuredClone(lease),
            resolution: 'completed_requires_reconciliation',
            replayed: true,
          }, expirationChanged)
        }

        if (fence.state === 'not_started') {
          if (lease.status === 'active') {
            ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 0, audit: 1 })
            lease.status = 'released'
            lease.releasedAt = timestamp
            aggregate.auditEvents.push(auditEvent('released', lease, timestamp))
            return mutationSuccess({
              lease: structuredClone(lease),
              resolution: 'released_before_execution',
              replayed: false,
            }, true)
          }
          return mutationSuccess({
            lease: structuredClone(lease),
            resolution: 'released_before_execution',
            replayed: true,
          }, expirationChanged)
        }

        if (
          lease.status !== 'active' ||
          fence.executionAttemptId !== deterministicAttemptId ||
          fence.runnerClass !== input.runnerClass
        ) {
          return mutationError(workerLeaseUnavailable(), expirationChanged)
        }

        ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 0, audit: 2 })
        const failedFenceWithoutHash = {
          state: 'failed' as const,
          executionAttemptId: fence.executionAttemptId!,
          runnerClass: fence.runnerClass!,
          startedAt: fence.startedAt!,
          failureCategory: input.failureCategory,
          failureCode: input.failureCode,
          recoveryPolicy: input.recoveryPolicy,
          failedAt: timestamp,
        }
        lease.executionFence = {
          ...failedFenceWithoutHash,
          failureEvidenceHash: canonicalWorkerLeaseFailureEvidenceHash({
            lease,
            fence: failedFenceWithoutHash,
          }),
        }
        lease.status = 'released'
        lease.releasedAt = timestamp
        aggregate.auditEvents.push(auditEvent('execution_failed', lease, timestamp))
        aggregate.auditEvents.push(auditEvent('released', lease, timestamp))
        return mutationSuccess({
          lease: structuredClone(lease),
          resolution: 'failed_before_commit',
          replayed: false,
        }, true)
      },
    })
    const resolved = unwrapMutation(outcome)
    return { ...resolved, testOnly: true }
  })
}

function assertExactInternalExecutionFailureInput(
  input: CanonicalWorkerLeaseInternalExecutionFailureInput,
): void {
  const expectedKeys = [
    'editSessionId',
    'failureCategory',
    'failureCode',
    'jobId',
    'leaseCredential',
    'leaseId',
    'projectId',
    'recoveryPolicy',
    'runnerClass',
    'workspaceId',
  ].sort()
  if (stableAuthorityStringify(Object.keys(input).sort()) !== stableAuthorityStringify(expectedKeys)) {
    throw validationError({ internalExecutionFailure: ['Internal failure input contains unsupported fields.'] })
  }
}

function assertFailureRecoveryPolicy(
  category: CanonicalWorkerLeaseInternalFailureCategory,
  policy: CanonicalWorkerLeaseInternalFailureRecoveryPolicy,
): void {
  if (
    ['authority_changed', 'unknown_internal'].includes(category) &&
    policy !== 'fallback_or_user_review_required'
  ) {
    throw validationError({
      recoveryPolicy: ['Authority and unknown failures cannot authorize automatic same-operation retry.'],
    })
  }
}

function assertExactInternalExecutionInput(
  input: CanonicalWorkerLeaseInternalExecutionInput & { executionAttemptId?: string },
  operation: 'begin' | 'complete',
): void {
  const expectedKeys = [
    'editSessionId',
    ...(operation === 'complete' ? ['executionAttemptId'] : []),
    'jobId',
    'leaseCredential',
    'leaseId',
    'projectId',
    'runnerClass',
    'workspaceId',
  ].sort()
  if (stableAuthorityStringify(Object.keys(input).sort()) !== stableAuthorityStringify(expectedKeys)) {
    throw validationError({ internalExecution: ['Internal execution-fence input contains unsupported fields.'] })
  }
}

function requireCommittedExecutionFence(
  fence: CanonicalWorkerLeaseExecutionFence,
  operation: 'begin' | 'complete',
): CanonicalWorkerLeaseInternalExecutionFenceResult['executionFence'] {
  if (
    (operation === 'begin' ? !['started', 'completed'].includes(fence.state) : fence.state !== 'completed') ||
    !fence.executionAttemptId ||
    !fence.runnerClass ||
    !fence.startedAt
  ) {
    throw invalidLeaseAuthority('Canonical worker execution fence did not reach the required state.')
  }
  return fence as CanonicalWorkerLeaseInternalExecutionFenceResult['executionFence']
}

function internalExecutionAttemptId(
  lease: CanonicalWorkerLeaseRecord,
  runnerClass: string,
): string {
  return `canonical_execution_attempt_${sha256AuthorityValue({
    domain: 'canonical_worker_internal_execution_fence_v1',
    leaseId: lease.id,
    jobId: lease.jobId,
    approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
    attemptNumber: lease.attemptNumber,
    immutableLeaseHash: lease.immutableLeaseHash,
    runnerClass,
  }).slice(0, 40)}`
}

function assertSafeInternalExecutionIdentity(value: string | undefined, label: string): asserts value is string {
  if (
    !value ||
    value !== value.trim() ||
    value.length > 160 ||
    value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) {
    throw validationError({ [label]: ['A safe server-owned execution identity is required.'] })
  }
}

async function loadLeaseEligibleJobReadiness(
  context: ServiceContext,
  identity: LeaseIdentity,
): Promise<LeaseEligibility> {
  const result = await createCanonicalExecutionReadinessService(context).inspectJob({
    workspaceId: identity.workspaceId,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    jobId: identity.jobId,
    purpose: 'private_internal_dry_run_readiness',
  })
  const readiness = result.executionReadinessEnvelope
  if (Date.parse(readiness.job.scheduledFor) > Date.now()) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'The canonical job cannot receive a private lease before its approved schedule has elapsed.',
      409,
      { requiredGate: 'canonical_job_schedule_readiness' },
    )
  }

  const isExactRootJob =
    readiness.readinessState === 'authority_verified_runtime_blocked' &&
    readiness.dependencyEvidenceState === 'not_required_for_root_job' &&
    readiness.gates.dependencyEvidence === 'not_required' &&
    readiness.job.canonicalGraphState === 'ready' &&
    readiness.job.dependencyJobIds.length === 0
  if (isExactRootJob) {
    return {
      readiness,
      dependencyAuthority: buildRootDependencyAuthority(readiness),
    }
  }

  const isExactDependentJob =
    readiness.readinessState === 'dependency_evidence_required_runtime_blocked' &&
    readiness.dependencyEvidenceState === 'required_results_and_qa_not_committed' &&
    readiness.gates.dependencyEvidence === 'blocked_pending_results_and_qa' &&
    readiness.job.canonicalGraphState === 'blocked' &&
    readiness.job.dependencyJobIds.length > 0
  if (!isExactDependentJob) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Canonical job graph state is not eligible for a private worker lease.',
      409,
      { requiredGate: 'canonical_root_or_dependency_evidence_readiness' },
    )
  }

  const artifactAuthority = createPrivateArtifactQaAuthorityService(context)
  const dependencyReadiness = await artifactAuthority.deriveJobDependencyReadiness({
      workspaceId: identity.workspaceId,
      projectId: identity.projectId,
      editSessionId: identity.editSessionId,
      snapshotId: readiness.job.approvedPlanSnapshotId,
      jobId: identity.jobId,
      purpose: 'derive_private_artifact_dependency_readiness',
    })
  if (
    dependencyReadiness.identity.workspaceId !== identity.workspaceId ||
    dependencyReadiness.identity.projectId !== identity.projectId ||
    dependencyReadiness.identity.editSessionId !== identity.editSessionId ||
    dependencyReadiness.identity.snapshotId !== readiness.job.approvedPlanSnapshotId ||
    dependencyReadiness.identity.jobId !== identity.jobId ||
    dependencyReadiness.readinessGroup !== 'ready_now_private_test_only' ||
    dependencyReadiness.privateTestDependencySatisfied !== true ||
    dependencyReadiness.liveRuntimeDependencySatisfied !== false ||
    dependencyReadiness.workerExecutionAuthorized !== false ||
    dependencyReadiness.toolExecutionAuthorized !== false ||
    dependencyReadiness.providerCallAuthorized !== false ||
    dependencyReadiness.renderAuthorized !== false ||
    dependencyReadiness.finalRenderAuthorized !== false
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Required private artifact, QA, and reconciliation evidence is not ready for this affected job.',
      409,
      {
        requiredGate: 'private_artifact_qa_dependency_readiness',
        readinessGroup: dependencyReadiness.readinessGroup,
      },
    )
  }
  const selectedArtifacts = await verifySelectedDependencyArtifacts({
    context,
    artifactAuthority,
    dependencyReadiness,
  })
  const dependencyAuthorityWithoutHash = {
    state: 'private_test_dependencies_verified' as const,
    readinessHash: dependencyReadiness.readinessHash,
    selectedArtifacts,
    liveRuntimeEligible: false as const,
  }
  return {
    readiness,
    dependencyAuthority: {
      ...dependencyAuthorityWithoutHash,
      authorityHash: sha256AuthorityValue(dependencyAuthorityWithoutHash),
    },
  }
}

async function verifySelectedDependencyArtifacts(input: {
  context: ServiceContext
  artifactAuthority: ReturnType<typeof createPrivateArtifactQaAuthorityService>
  dependencyReadiness: Awaited<ReturnType<
    ReturnType<typeof createPrivateArtifactQaAuthorityService>['deriveJobDependencyReadiness']
  >>
}): Promise<CanonicalWorkerLeaseDependencyAuthority['selectedArtifacts']> {
  const { dependencyReadiness } = input
  const selectedArtifacts: CanonicalWorkerLeaseDependencyAuthority['selectedArtifacts'] = []
  for (const dependency of dependencyReadiness.dependencies) {
    for (const expected of dependency.expectedAssets) {
      if (!dependency.required || !expected.required) continue
      if (!expected.privateTestSatisfied || !expected.selectedArtifactId) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Required private dependency artifact selection is incomplete.',
          409,
          { requiredGate: 'selected_private_dependency_artifact' },
        )
      }
      const authority = await input.artifactAuthority.readArtifactAuthority({
        workspaceId: dependencyReadiness.identity.workspaceId,
        projectId: dependencyReadiness.identity.projectId,
        editSessionId: dependencyReadiness.identity.editSessionId,
        snapshotId: dependencyReadiness.identity.snapshotId,
        jobId: dependency.dependencyJobId,
        expectedAssetId: expected.expectedAssetId,
        artifactId: expected.selectedArtifactId,
        purpose: 'read_private_artifact_qa_authority',
      })
      if (
        authority.qaEvaluation?.outcome !== 'passed' ||
        authority.reconciliation?.decision !== 'test_merged_not_live_authorized' ||
        authority.reconciliation.privateTestDependencySatisfied !== true ||
        authority.liveRuntimeEligible !== false
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Required private dependency artifact is missing exact QA and reconciliation authority.',
          409,
          { requiredGate: 'selected_private_dependency_artifact_qa' },
        )
      }
      const verifiedArtifact = [
        'authority_validation_evidence',
        'source_trim_validation_evidence',
      ].includes(authority.artifact.lineage.artifactType)
        ? await verifyCanonicalInternalAuthorityArtifact({
            localStorageRoot: input.context.env.localStorageRoot,
            artifact: authority.artifact,
          })
        : authority.artifact.actualRunEvidence.state ===
              'actual_provider_attempt_receipt_verified_v1' &&
            authority.artifact.actualRunEvidence.runnerClass ===
              'canonical_private_provider_attempt_receipt_v2' &&
            ['audio/mpeg', 'application/json', 'video/mp4'].includes(
              authority.artifact.content.contentType,
            )
          ? await verifyCanonicalPrivateProviderOutputArtifact({
              localStorageRoot: input.context.env.localStorageRoot,
              ownerUserId: getRequiredAuthUserId(input.context),
              artifact: authority.artifact,
            })
        : authority.artifact.content.contentType === 'image/svg+xml'
          ? await verifyCanonicalStructuredSvgArtifact({
              localStorageRoot: input.context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : authority.artifact.actualRunEvidence.state === 'actual_run_evidence_verified_v2' &&
              [
                'offline_python_structured_execution_v1',
                'offline_media_binary_execution_v1',
                'offline_ai_capability_execution_v1',
                'offline_container_packaging_validation_execution_v1',
                'offline_vapoursynth_frame_pipeline_execution_v1',
                'offline_audioflux_analysis_execution_v1',
              ].includes(authority.artifact.actualRunEvidence.runnerClass) &&
              authority.artifact.content.contentType === 'application/json'
            ? await verifyCanonicalStructuredJsonArtifact({
                localStorageRoot: input.context.env.localStorageRoot,
                artifact: authority.artifact,
              })
            : authority.artifact.actualRunEvidence.state === 'actual_run_evidence_verified_v2' &&
                authority.artifact.actualRunEvidence.runnerClass === 'offline_media_binary_execution_v1' &&
                ['video/x-nut', 'video/x-matroska'].includes(
                  authority.artifact.content.contentType,
                )
              ? await verifyCanonicalPrivateMediaArtifact({
                  localStorageRoot: input.context.env.localStorageRoot,
                  artifact: authority.artifact,
                })
            : authority.artifact.actualRunEvidence.state === 'actual_run_evidence_verified_v2' &&
                [
                  'offline_sharp_structured_execution_v1',
                  'offline_libass_caption_execution_v1',
                  'offline_browser_graphics_execution_v1',
                  'offline_ai_capability_execution_v1',
                  'offline_native_image_pipeline_execution_v1',
                  'offline_rembg_background_removal_execution_v1',
                ].includes(authority.artifact.actualRunEvidence.runnerClass) &&
                ['image/png', 'image/jpeg', 'image/webp'].includes(authority.artifact.content.contentType)
              ? await verifyCanonicalPrivateImageArtifact({
                  localStorageRoot: input.context.env.localStorageRoot,
                  artifact: authority.artifact,
                })
            : authority.artifact.actualRunEvidence.state === 'actual_run_evidence_verified_v2' &&
                ['offline_python_structured_execution_v1', 'offline_native_audio_processing_execution_v1', 'offline_deepfilternet_voice_cleanup_execution_v1', 'offline_media_binary_execution_v1'].includes(authority.artifact.actualRunEvidence.runnerClass) &&
                authority.artifact.content.contentType === 'audio/wav'
              ? await verifyCanonicalPrivateAudioArtifact({
                  localStorageRoot: input.context.env.localStorageRoot,
                  artifact: authority.artifact,
                })
            : authority.artifact.lineage.assetRole === 'final' &&
                authority.artifact.content.contentType === 'video/mp4'
              ? await verifyCanonicalPrivateFinalCompositionArtifact({
                  localStorageRoot: input.context.env.localStorageRoot,
                  artifact: authority.artifact,
                })
            : authority.artifact.actualRunEvidence.state === 'actual_run_evidence_verified_v2' &&
                authority.artifact.actualRunEvidence.runnerClass === 'offline_remotion_render_execution_v1' &&
                authority.artifact.content.contentType === 'video/mp4'
              ? await verifyCanonicalPrivateRemotionArtifact({
                  localStorageRoot: input.context.env.localStorageRoot,
                  artifact: authority.artifact,
                })
            : undefined
      if (!verifiedArtifact) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'This dependency artifact class has no lease-time private object verifier yet.',
          503,
          {
            requiredGate: 'artifact_class_specific_private_object_verifier',
            artifactType: authority.artifact.lineage.artifactType,
          },
        )
      }
      const sourceExecution = await verifyCompletedArtifactExecutionFence({
        context: input.context,
        artifact: authority.artifact,
        verifiedArtifact,
      })
      selectedArtifacts.push({
        dependencyJobId: dependency.dependencyJobId,
        expectedAssetId: expected.expectedAssetId,
        artifactId: authority.artifact.artifactId,
        artifactVersion: authority.artifact.artifactVersion,
        contentSha256: authority.artifact.content.sha256,
        qaEvaluationId: authority.qaEvaluation.qaEvaluationId,
        reconciliationId: authority.reconciliation.reconciliationId,
        executionAttemptId: verifiedArtifact.executionAttemptId,
        sourceLeaseImmutableHash: sourceExecution.immutableLeaseHash,
      })
    }
  }
  return selectedArtifacts
}

async function verifyCompletedArtifactExecutionFence(input: {
  context: ServiceContext
  artifact: Awaited<ReturnType<
    ReturnType<typeof createPrivateArtifactQaAuthorityService>['readArtifactAuthority']
  >>['artifact']
  verifiedArtifact: {
    executionAttemptId: string
    runnerClass: string
    leaseId?: string
    immutableLeaseHash?: string
    leaseAttemptNumber?: number
    providerQueueClaimId?: string
    providerQueueClaimHash?: string
    providerQueueDeliveryAttempt?: number
  }
}): Promise<{ immutableLeaseHash: string; attemptNumber: number }> {
  if (
    input.artifact.actualRunEvidence.state ===
      'actual_provider_attempt_receipt_verified_v1'
  ) {
    if (
      input.verifiedArtifact.runnerClass !==
        'canonical_private_provider_attempt_receipt_v2' ||
      input.verifiedArtifact.providerQueueClaimId !==
        input.artifact.actualRunEvidence.providerQueueClaimId ||
      input.verifiedArtifact.providerQueueClaimHash !==
        input.artifact.actualRunEvidence.providerQueueClaimHash ||
      !Number.isSafeInteger(
        input.verifiedArtifact.providerQueueDeliveryAttempt,
      ) ||
      Number(input.verifiedArtifact.providerQueueDeliveryAttempt) < 1
    ) throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Private provider dependency is not bound to its exact completed queue claim.',
      409,
      { requiredGate: 'completed_source_provider_queue_fence' },
    )
    return {
      immutableLeaseHash: input.verifiedArtifact.providerQueueClaimHash,
      attemptNumber: input.verifiedArtifact.providerQueueDeliveryAttempt!,
    }
  }
  const ownerUserId = getRequiredAuthUserId(input.context)
  const aggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId,
    workspaceId: input.artifact.identity.workspaceId,
  })
  const sourceLeases = aggregate?.leases.filter((lease) =>
    (input.verifiedArtifact.leaseId === undefined || lease.id === input.verifiedArtifact.leaseId) &&
    lease.workspaceId === input.artifact.identity.workspaceId &&
    lease.projectId === input.artifact.identity.projectId &&
    lease.editSessionId === input.artifact.identity.editSessionId &&
    lease.jobId === input.artifact.identity.jobId &&
    lease.executionFence.executionAttemptId === input.verifiedArtifact.executionAttemptId &&
    lease.executionFence.runnerClass === input.verifiedArtifact.runnerClass) ?? []
  const sourceLease = sourceLeases.length === 1 ? sourceLeases[0] : undefined
  if (
    !sourceLease ||
    (input.verifiedArtifact.immutableLeaseHash !== undefined &&
      sourceLease.immutableLeaseHash !== input.verifiedArtifact.immutableLeaseHash) ||
    (input.verifiedArtifact.leaseAttemptNumber !== undefined &&
      sourceLease.attemptNumber !== input.verifiedArtifact.leaseAttemptNumber) ||
    sourceLease.executionFence.state !== 'completed' ||
    sourceLease.executionFence.executionAttemptId !== input.verifiedArtifact.executionAttemptId ||
    sourceLease.executionFence.runnerClass !== input.verifiedArtifact.runnerClass ||
    !sourceLease.executionFence.commitAuthorizedAt ||
    !sourceLease.executionFence.completedAt
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Private dependency artifact is not bound to a completed source worker execution fence.',
      409,
      { requiredGate: 'completed_source_worker_execution_fence' },
    )
  }
  return {
    immutableLeaseHash: sourceLease.immutableLeaseHash,
    attemptNumber: sourceLease.attemptNumber,
  }
}

function buildRootDependencyAuthority(
  readiness: CanonicalExecutionReadinessEnvelope,
): CanonicalWorkerLeaseDependencyAuthority {
  const withoutHash = {
    state: 'not_required_for_root_job' as const,
    readinessHash: sha256AuthorityValue({
      domain: 'canonical_root_job_dependency_authority_v1',
      identity: readiness.identity,
      snapshotHash: readiness.authorityHashes.snapshotHash,
      jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
      dependencyEvidenceState: readiness.dependencyEvidenceState,
    }),
    selectedArtifacts: [],
    liveRuntimeEligible: false as const,
  }
  return { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
}

function hashesFromReadiness(readiness: CanonicalExecutionReadinessEnvelope): CanonicalWorkerLeaseHashes {
  return {
    snapshotHash: readiness.authorityHashes.snapshotHash,
    planHash: readiness.authorityHashes.planHash,
    estimateHash: readiness.authorityHashes.estimateHash,
    workGraphHash: readiness.authorityHashes.workGraphHash,
    sourceSequenceHash: readiness.authorityHashes.sourceSequenceHash,
    timingHash: readiness.authorityHashes.timingHash,
    planningInputBindingHash: readiness.authorityHashes.planningInputBindingHash,
    approvedSourceAssetManifestHash: readiness.authorityHashes.approvedSourceAssetManifestHash,
    approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
    executionPackageHash: readiness.authorityHashes.executionPackageHash,
    toolExecutionAuthorityHash: readiness.authorityHashes.toolExecutionAuthorityHash,
    resourcePlacementAuthorityHash:
      readiness.authorityHashes.resourcePlacementAuthorityHash,
    resourcePlacementHash: readiness.authorityHashes.resourcePlacementHash,
    jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
  }
}

function assertLiveCanonicalLeaseHashes(
  lease: CanonicalWorkerLeaseRecord,
  currentHashes: CanonicalWorkerLeaseHashes,
  readiness: CanonicalExecutionReadinessEnvelope,
  dependencyAuthority: CanonicalWorkerLeaseDependencyAuthority,
): void {
  if (
    stableAuthorityStringify(lease.canonicalHashes) !== stableAuthorityStringify(currentHashes) ||
    stableAuthorityStringify(lease.dependencyAuthority) !== stableAuthorityStringify(dependencyAuthority) ||
    lease.approvedPlanSnapshotId !== readiness.job.approvedPlanSnapshotId ||
    lease.reservationId !== readiness.reservation.reservationId ||
    lease.jobId !== readiness.identity.jobId ||
    lease.projectId !== readiness.identity.projectId ||
    lease.editSessionId !== readiness.identity.editSessionId ||
    lease.workspaceId !== readiness.identity.workspaceId
  ) {
    throw invalidLeaseAuthority('Canonical authority changed after this worker lease was issued.')
  }
}

function findScopedLease(
  aggregate: CanonicalWorkerLeaseAggregate,
  input: LeaseIdentity & { leaseId: string },
): CanonicalWorkerLeaseRecord | undefined {
  return aggregate.leases.find((lease) =>
    lease.id === input.leaseId &&
    lease.workspaceId === input.workspaceId &&
    lease.projectId === input.projectId &&
    lease.editSessionId === input.editSessionId &&
    lease.jobId === input.jobId)
}

async function preflightVerifyLeaseCredential(
  scope: CanonicalWorkerLeaseStoreScope,
  secret: string,
  input: LeaseIdentity & { leaseId: string; leaseCredential: string },
): Promise<void> {
  const aggregate = await readPrivateCanonicalWorkerLeaseAggregate(scope)
  const lease = aggregate ? findScopedLease(aggregate, input) : undefined
  if (!lease) throw workerLeaseUnavailable()
  verifyLeaseCredential(secret, lease, input.leaseCredential)
}

async function verifyStoredActiveLease(input: {
  scope: CanonicalWorkerLeaseStoreScope
  secret: string
  body: VerifyCanonicalWorkerLeaseInput
  timestamp: string
  canonicalHashes?: CanonicalWorkerLeaseHashes
  readiness?: CanonicalExecutionReadinessEnvelope
  dependencyAuthority?: CanonicalWorkerLeaseDependencyAuthority
}): Promise<LeaseMutationOutcome<{ lease: CanonicalWorkerLeaseRecord }>> {
  return mutatePrivateCanonicalWorkerLeaseAggregate<LeaseMutationOutcome<{
    lease: CanonicalWorkerLeaseRecord
  }>>({
    scope: input.scope,
    now: input.timestamp,
    mutation: (aggregate) => {
      const lease = findScopedLease(aggregate, input.body)
      if (!lease) return mutationError(workerLeaseUnavailable(), false)
      verifyLeaseCredential(input.secret, lease, input.body.leaseCredential)
      const expirationChanged = expireTargetLeaseIfNeeded(aggregate, lease, input.timestamp)
      if (
        lease.status !== 'active' ||
        Date.parse(lease.expiresAt) <= Date.parse(input.timestamp) ||
        Date.parse(lease.attemptDeadlineAt) <= Date.parse(input.timestamp)
      ) {
        return mutationError(workerLeaseUnavailable(), expirationChanged)
      }
      if (input.canonicalHashes && input.readiness && input.dependencyAuthority) {
        assertLiveCanonicalLeaseHashes(
          lease,
          input.canonicalHashes,
          input.readiness,
          input.dependencyAuthority,
        )
      }
      return mutationSuccess({ lease: structuredClone(lease) }, expirationChanged)
    },
  })
}

function expireTargetLeaseIfNeeded(
  aggregate: CanonicalWorkerLeaseAggregate,
  lease: CanonicalWorkerLeaseRecord,
  now: string,
): boolean {
  if (lease.status !== 'active' || Date.parse(lease.expiresAt) > Date.parse(now)) return false
  const executionWasStarted = lease.executionFence.state === 'started'
  ensureLeaseCapacity(aggregate, { leases: 0, idempotency: 0, audit: executionWasStarted ? 2 : 1 })
  if (executionWasStarted) {
    terminalizeExpiredStartedExecution(lease, now)
    aggregate.auditEvents.push(auditEvent('execution_failed', lease, now))
  }
  lease.status = 'expired'
  lease.expiredAt = now
  aggregate.auditEvents.push(auditEvent('expired', lease, now))
  return true
}

function expireActiveLeases(aggregate: CanonicalWorkerLeaseAggregate, now: string): boolean {
  const nowMs = Date.parse(now)
  const expired = aggregate.leases.filter((lease) =>
    lease.status === 'active' && Date.parse(lease.expiresAt) <= nowMs)
  if (expired.length === 0) return false
  const startedCount = expired.filter((lease) => lease.executionFence.state === 'started').length
  ensureLeaseCapacity(aggregate, {
    leases: 0,
    idempotency: 0,
    audit: expired.length + startedCount,
  })
  for (const lease of expired) {
    if (lease.executionFence.state === 'started') {
      terminalizeExpiredStartedExecution(lease, now)
      aggregate.auditEvents.push(auditEvent('execution_failed', lease, now))
    }
    lease.status = 'expired'
    lease.expiredAt = now
    aggregate.auditEvents.push(auditEvent('expired', lease, now))
  }
  return true
}

function terminalizeExpiredStartedExecution(
  lease: CanonicalWorkerLeaseRecord,
  failedAt: string,
): void {
  const fence = lease.executionFence
  if (fence.state !== 'started') return
  const failedFenceWithoutHash = {
    state: 'failed' as const,
    executionAttemptId: fence.executionAttemptId!,
    runnerClass: fence.runnerClass!,
    startedAt: fence.startedAt!,
    failureCategory: 'execution_timeout' as const,
    failureCode: 'WORKER_LEASE_EXPIRED' as const,
    recoveryPolicy: 'same_operation_retry_within_approved_max_attempts' as const,
    failedAt,
  }
  lease.executionFence = {
    ...failedFenceWithoutHash,
    failureEvidenceHash: canonicalWorkerLeaseFailureEvidenceHash({
      lease,
      fence: failedFenceWithoutHash,
    }),
  }
}

function ensureLeaseCapacity(
  aggregate: CanonicalWorkerLeaseAggregate,
  additions: { leases: number; idempotency: number; audit: number },
): void {
  if (
    aggregate.leases.length + additions.leases > MAX_CANONICAL_WORKER_LEASE_RECORDS ||
    aggregate.idempotencyRecords.length + additions.idempotency > MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS ||
    aggregate.auditEvents.length + additions.audit > MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Private canonical worker-lease authority reached a bounded record capacity.',
      503,
    )
  }
}

function auditEvent(
  eventType:
    | 'claimed'
    | 'heartbeat'
    | 'released'
    | 'expired'
    | 'execution_started'
    | 'execution_failed'
    | 'execution_completed',
  lease: CanonicalWorkerLeaseRecord,
  createdAt: string,
) {
  return {
    id: `canonical_lease_audit_${randomUUID()}`,
    eventType,
    leaseId: lease.id,
    workspaceId: lease.workspaceId,
    projectId: lease.projectId,
    editSessionId: lease.editSessionId,
    jobId: lease.jobId,
    attemptNumber: lease.attemptNumber,
    createdAt,
  }
}

function findIdempotency(
  aggregate: CanonicalWorkerLeaseAggregate,
  operation: 'claim' | 'heartbeat' | 'release',
  keyHash: string,
): CanonicalWorkerLeaseIdempotencyRecord | undefined {
  return aggregate.idempotencyRecords.find((record) =>
    record.operation === operation && record.keyHash === keyHash)
}

function leaseRequestHash(operation: string, actorUserId: string, value: unknown): string {
  return sha256AuthorityValue({ operation, actorUserId, value })
}

function leaseIdempotencyKeyHash(
  operation: string,
  actorUserId: string,
  workspaceId: string,
  idempotencyKey: string,
): string {
  return sha256AuthorityValue({ operation, actorUserId, workspaceId, idempotencyKey })
}

function fixedLeaseExpiry(timestamp: string, attemptDeadlineAt: string): string {
  const timestampMs = Date.parse(timestamp)
  const attemptDeadlineMs = Date.parse(attemptDeadlineAt)
  if (attemptDeadlineMs <= timestampMs) throw workerLeaseUnavailable()
  return new Date(Math.min(
    timestampMs + CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS * 1_000,
    attemptDeadlineMs,
  )).toISOString()
}

function deriveLeaseCredential(
  secret: string,
  input: {
    leaseId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    jobId: string
    approvedPlanSnapshotId: string
    reservationId: string
    workerIdentity: typeof CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY
    attemptNumber: number
    issuedAt: string
    attemptDeadlineAt: string
    authorityRevisionAtClaim: number
    canonicalHashes: CanonicalWorkerLeaseHashes
    dependencyAuthority: CanonicalWorkerLeaseDependencyAuthority
    claimRequestHash: string
  },
): string {
  const digest = createHmac('sha256', secret)
    .update(stableAuthorityStringify({ domain: LEASE_CREDENTIAL_DOMAIN, ...input }))
    .digest('base64url')
  return `rpwl_v1_${digest}`
}

function deriveAndVerifyStoredLeaseCredential(secret: string, lease: CanonicalWorkerLeaseRecord): string {
  const credential = deriveLeaseCredential(secret, credentialDerivationInput(lease))
  if (!timingSafeHashMatches(sha256Text(credential), lease.credentialHashSha256)) {
    throw invalidLeaseAuthority('Worker lease credential derivation evidence is invalid.')
  }
  return credential
}

function assertCredentialDerivationConsistent(secret: string, lease: CanonicalWorkerLeaseRecord): void {
  void deriveAndVerifyStoredLeaseCredential(secret, lease)
}

function verifyLeaseCredential(
  secret: string,
  lease: CanonicalWorkerLeaseRecord,
  presentedCredential: string,
): void {
  const expectedCredential = deriveLeaseCredential(secret, credentialDerivationInput(lease))
  const derivedHashMatches = timingSafeHashMatches(sha256Text(expectedCredential), lease.credentialHashSha256)
  const presentedHashMatches = timingSafeHashMatches(sha256Text(presentedCredential), lease.credentialHashSha256)
  if (!derivedHashMatches || !presentedHashMatches) throw workerLeaseUnavailable()
}

function credentialDerivationInput(lease: CanonicalWorkerLeaseRecord) {
  return {
    leaseId: lease.id,
    workspaceId: lease.workspaceId,
    projectId: lease.projectId,
    editSessionId: lease.editSessionId,
    jobId: lease.jobId,
    approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
    reservationId: lease.reservationId,
    workerIdentity: lease.workerIdentity,
    attemptNumber: lease.attemptNumber,
    issuedAt: lease.issuedAt,
    attemptDeadlineAt: lease.attemptDeadlineAt,
    authorityRevisionAtClaim: lease.authorityRevisionAtClaim,
    canonicalHashes: lease.canonicalHashes,
    dependencyAuthority: lease.dependencyAuthority,
    claimRequestHash: lease.claimRequestHash,
  }
}

function timingSafeHashMatches(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex')
  const right = Buffer.from(rightHex, 'hex')
  return left.length === right.length && timingSafeEqual(left, right)
}

function buildClaimResponse(
  lease: CanonicalWorkerLeaseRecord,
  idempotency: CanonicalWorkerLeaseIdempotencyRecord,
  leaseCredential: string,
): CanonicalWorkerLeaseClaimResponse {
  return canonicalWorkerLeaseClaimResponseSchema.parse({
    schemaVersion: CANONICAL_WORKER_LEASE_RESPONSE_VERSION,
    source: 'canonical_worker_lease_authority',
    purpose: 'private_internal_canonical_lease_claim',
    lease: safeLeaseView(lease, idempotency),
    leaseCredential,
    credentialPolicy: {
      serverDerivedCredential: true,
      routeMustRequireDualAuthenticationBeforeMount: true,
      plaintextPersisted: false,
      plaintextLogged: false,
      timingSafeVerificationRequired: true,
    },
    executionAuthority: noExecutionAuthority(),
    persistenceEvidence: persistenceEvidence(),
    testOnly: true,
  })
}

function buildHeartbeatResponse(
  lease: CanonicalWorkerLeaseRecord,
  idempotency: CanonicalWorkerLeaseIdempotencyRecord,
): CanonicalWorkerLeaseHeartbeatResponse {
  return canonicalWorkerLeaseHeartbeatResponseSchema.parse({
    schemaVersion: CANONICAL_WORKER_LEASE_RESPONSE_VERSION,
    source: 'canonical_worker_lease_authority',
    purpose: 'private_internal_canonical_lease_heartbeat',
    lease: safeLeaseView(lease, idempotency),
    executionAuthority: noExecutionAuthority(),
    persistenceEvidence: persistenceEvidence(),
    testOnly: true,
  })
}

function buildReleaseResponse(
  lease: CanonicalWorkerLeaseRecord,
  idempotency: CanonicalWorkerLeaseIdempotencyRecord,
): CanonicalWorkerLeaseReleaseResponse {
  return canonicalWorkerLeaseReleaseResponseSchema.parse({
    schemaVersion: CANONICAL_WORKER_LEASE_RESPONSE_VERSION,
    source: 'canonical_worker_lease_authority',
    purpose: 'private_internal_canonical_lease_release',
    lease: safeLeaseView(lease, idempotency),
    executionAuthority: noExecutionAuthority(),
    persistenceEvidence: persistenceEvidence(),
    testOnly: true,
  })
}

function buildVerificationResponse(
  lease: CanonicalWorkerLeaseRecord,
  verifiedAt: string,
): CanonicalWorkerLeaseVerificationResponse {
  const responseWithoutHash = {
    schemaVersion: CANONICAL_WORKER_LEASE_VERIFICATION_VERSION,
    source: 'canonical_worker_lease_authority' as const,
    purpose: 'private_internal_canonical_lease_verification' as const,
    verified: true as const,
    verifiedAt,
    lease: {
      leaseId: lease.id,
      workspaceId: lease.workspaceId,
      projectId: lease.projectId,
      editSessionId: lease.editSessionId,
      jobId: lease.jobId,
      approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
      reservationId: lease.reservationId,
      workerIdentity: lease.workerIdentity,
      attemptNumber: lease.attemptNumber,
      status: 'active' as const,
      issuedAt: lease.issuedAt,
      heartbeatAt: lease.heartbeatAt,
      attemptDeadlineAt: lease.attemptDeadlineAt,
      expiresAt: lease.expiresAt,
      canonicalHashes: { ...lease.canonicalHashes },
      dependencyAuthority: structuredClone(lease.dependencyAuthority),
      executionFence: { ...lease.executionFence },
      immutableLeaseHash: lease.immutableLeaseHash,
    },
    verificationEvidence: {
      tenantAuthorization: 'passed' as const,
      checksumProtectedStore: 'passed' as const,
      timingSafeCredentialMatch: 'passed' as const,
      activeAndUnexpired: 'passed' as const,
      currentCanonicalReadiness: 'passed' as const,
      currentReservation: 'passed' as const,
      currentSourcePackageJobHashes: 'passed' as const,
      currentDependencyAuthority: 'passed' as const,
      executionFenceStateVerified: 'passed' as const,
      leaseRenewed: false as const,
      credentialReturned: false as const,
      credentialHashReturned: false as const,
    },
    executionAuthority: noExecutionAuthority(),
    persistenceEvidence: persistenceEvidence(),
    testOnly: true as const,
  }
  return canonicalWorkerLeaseVerificationResponseSchema.parse({
    ...responseWithoutHash,
    verificationHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function safeLeaseView(
  lease: CanonicalWorkerLeaseRecord,
  idempotency: CanonicalWorkerLeaseIdempotencyRecord,
) {
  return {
    leaseId: lease.id,
    workspaceId: lease.workspaceId,
    projectId: lease.projectId,
    editSessionId: lease.editSessionId,
    jobId: lease.jobId,
    approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
    reservationId: lease.reservationId,
    workerIdentity: lease.workerIdentity,
    attemptNumber: lease.attemptNumber,
    status: idempotency.responseStatus,
    issuedAt: lease.issuedAt,
    attemptDeadlineAt: lease.attemptDeadlineAt,
    responseAt: idempotency.responseAt,
    expiresAt: idempotency.responseExpiresAt,
    canonicalHashes: { ...lease.canonicalHashes },
    dependencyAuthority: structuredClone(lease.dependencyAuthority),
    executionFence: { ...lease.executionFence },
    immutableLeaseHash: lease.immutableLeaseHash,
  }
}

function noExecutionAuthority() {
  return {
    workerClaimRecorded: true as const,
    dispatchAuthorized: false as const,
    toolExecutionAuthorized: false as const,
    providerCallAuthorized: false as const,
    sourceObjectReadAuthorized: false as const,
    artifactWriteAuthorized: false as const,
    renderAuthorized: false as const,
    creditSpendAuthorized: false as const,
    noExecutionSideEffects: true as const,
  }
}

function persistenceEvidence() {
  return {
    singleHostPrivateLocalOnly: true as const,
    singleProcessSerializationOnly: true as const,
    restartSafeChecksumProtected: true as const,
    credentialStoredAsSha256Only: true as const,
    distributedAuthority: false as const,
    productionAuthority: false as const,
  }
}

function authorizeLeaseMutationRuntime(context: ServiceContext): string {
  getRequiredAuthUserId(context)
  if (!isExplicitLocalInternalTestRuntime(context.env)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical worker leases are blocked outside explicit private local/internal testing.',
      503,
      { requiredGate: 'canonical_distributed_worker_lease_rpc_and_service_identity' },
    )
  }
  const secret = context.env.internalServiceToken
  if (
    !secret ||
    Buffer.byteLength(secret, 'utf8') < MINIMUM_LEASE_SECRET_BYTES ||
    new Set(Array.from(secret)).size < MINIMUM_LEASE_SECRET_UNIQUE_CHARACTERS
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'A strong server-only internal secret is required for deterministic opaque lease credentials.',
      503,
      { requiredGate: 'canonical_worker_lease_credential_secret' },
    )
  }
  return secret
}

function leaseStoreScope(
  context: ServiceContext,
  ownerUserId: string,
  workspaceId: string,
): CanonicalWorkerLeaseStoreScope {
  return { localStorageRoot: context.env.localStorageRoot, ownerUserId, workspaceId }
}

function parseClaim(input: ClaimCanonicalWorkerLeaseInput): ClaimCanonicalWorkerLeaseInput {
  const parsed = claimCanonicalWorkerLeaseSchema.safeParse(input)
  if (!parsed.success) throw validationError(parsed.error.flatten())
  return parsed.data
}

function parseHeartbeat(input: HeartbeatCanonicalWorkerLeaseInput): HeartbeatCanonicalWorkerLeaseInput {
  const parsed = heartbeatCanonicalWorkerLeaseSchema.safeParse(input)
  if (!parsed.success) throw validationError(parsed.error.flatten())
  return parsed.data
}

function parseRelease(input: ReleaseCanonicalWorkerLeaseInput): ReleaseCanonicalWorkerLeaseInput {
  const parsed = releaseCanonicalWorkerLeaseSchema.safeParse(input)
  if (!parsed.success) throw validationError(parsed.error.flatten())
  return parsed.data
}

function parseVerification(input: VerifyCanonicalWorkerLeaseInput): VerifyCanonicalWorkerLeaseInput {
  const parsed = verifyCanonicalWorkerLeaseSchema.safeParse(input)
  if (!parsed.success) throw validationError(parsed.error.flatten())
  return parsed.data
}

function validationError(details: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', 'Canonical worker-lease request validation failed.', 400, details)
}

function mutationSuccess<T>(value: T, changed: boolean) {
  return { result: { ok: true as const, value }, changed }
}

function mutationError<T>(error: ApiError, changed: boolean) {
  return { result: { ok: false as const, error } as LeaseMutationOutcome<T>, changed }
}

function unwrapMutation<T>(outcome: LeaseMutationOutcome<T>): T {
  if (!outcome.ok) throw outcome.error
  return outcome.value
}

function idempotencyConflict(): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with another canonical lease request.', 409)
}

function workerLeaseUnavailable(): ApiError {
  return new ApiError('WORKER_LEASE_EXPIRED', 'Canonical worker lease is unavailable, expired, released, or invalid.', 409)
}

function invalidLeaseAuthority(message: string): ApiError {
  return new ApiError('APPROVED_SNAPSHOT_REQUIRED', message, 409)
}

function leaseWarnings(): string[] {
  return [
    'This opaque lease is private single-host internal-test evidence, not distributed or production worker authority.',
    'Process-local serialization is restart-safe on one private store but does not coordinate multiple API processes.',
    'An exact claim replay returns the original credential response and never reactivates a released or expired lease.',
    'Required dependency artifact, QA, reconciliation, content, and source-execution identities are frozen into the lease credential and revalidated while active.',
    'A server-owned execution fence prevents release after an internal attempt starts and records the exact completed attempt before artifact reconciliation.',
    'The lease does not authorize dispatch, tools, providers, source-byte reads, artifact writes, rendering, or credit spend.',
    'The shared internal secret is a transitional local credential source; production requires verified per-service identity and a transactional lease RPC.',
  ]
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
