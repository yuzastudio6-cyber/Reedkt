import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { calculateToolActualCostMicros } from '../tool-cost-metering/cost-math'
import {
  assertCanonicalDistributedMediaIngestMutationIntegrity,
  assertCanonicalDistributedMediaIngestTimeoutIntegrity,
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_RESPONSE_VERSION,
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_TIMEOUT_RESPONSE_VERSION,
  canonicalDistributedMediaIngestCancellationRequestSchema,
  canonicalDistributedMediaIngestAttemptViewSchema,
  canonicalDistributedMediaIngestClaimRequestSchema,
  canonicalDistributedMediaIngestCompletionRequestSchema,
  canonicalDistributedMediaIngestEnqueueRequestSchema,
  canonicalDistributedMediaIngestFailureRequestSchema,
  canonicalDistributedMediaIngestIdempotencyKeyHash,
  canonicalDistributedMediaIngestMutationResponseSchema,
  canonicalDistributedMediaIngestPersistenceBoundaries,
  canonicalDistributedMediaIngestProgressRequestSchema,
  canonicalDistributedMediaIngestJobViewSchema,
  canonicalDistributedMediaIngestSeedSchema,
  canonicalDistributedMediaIngestTimeoutRequestSchema,
  canonicalDistributedMediaIngestTimeoutResponseSchema,
  createCanonicalDistributedMediaIngestFixtureDescriptor,
  type CanonicalDistributedMediaIngestMutationResponse,
  type CanonicalDistributedMediaIngestPortResult,
  type CanonicalDistributedMediaIngestSeed,
  type CanonicalDistributedMediaIngestTimeoutResponse,
  type CanonicalDistributedMediaIngestTransactionAdapter,
} from './canonical-distributed-media-ingest-state-port'

type JobView = CanonicalDistributedMediaIngestMutationResponse['job']
type AttemptView = NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
type Checkpoint = NonNullable<JobView['latestDurableCheckpoint']>
type MutationOperation = CanonicalDistributedMediaIngestMutationResponse['operation']
type FaultOperation = MutationOperation | 'finalize_expired_attempt'

interface StoredIdempotency {
  operation: FaultOperation
  requestHash: string
  response: CanonicalDistributedMediaIngestMutationResponse | CanonicalDistributedMediaIngestTimeoutResponse
}

interface FixtureState {
  revision: number
  job: JobView | null
  activeAttemptId: string | null
  attempts: AttemptView[]
  controllerIdentityEvidenceHash: string | null
  idempotency: Record<string, StoredIdempotency>
  auditChainHeadHash: string
}

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const idempotencyRecordSchema = z.object({
  operation: z.enum([
    'enqueue',
    'claim_and_start',
    'record_progress',
    'reconcile_completion',
    'reconcile_failure',
    'request_cancellation',
    'finalize_expired_attempt',
  ]),
  requestHash: sha256,
  response: z.union([
    canonicalDistributedMediaIngestMutationResponseSchema,
    canonicalDistributedMediaIngestTimeoutResponseSchema,
  ]),
}).strict()
const persistedIdempotencySchema = z.record(
  z.string().regex(/^(enqueue|claim_and_start|record_progress|reconcile_completion|reconcile_failure|request_cancellation|finalize_expired_attempt):[a-f0-9]{64}$/u),
  idempotencyRecordSchema,
).refine((records) => Object.keys(records).length <= 10_000)
const fixtureStateSchema = z.object({
  revision: z.number().int().nonnegative().max(1_000_000),
  job: canonicalDistributedMediaIngestJobViewSchema.nullable(),
  activeAttemptId: z.string().trim().min(1).max(240).nullable(),
  attempts: z.array(canonicalDistributedMediaIngestAttemptViewSchema).max(3),
  controllerIdentityEvidenceHash: sha256.nullable(),
  idempotency: persistedIdempotencySchema,
  auditChainHeadHash: sha256,
}).strict().superRefine((state, context) => {
  const activeAttempt = state.activeAttemptId === null
    ? null
    : state.attempts.find((attempt) => attempt.attemptId === state.activeAttemptId)
  if (
    (state.job === null) !== (state.revision === 0) ||
    (state.activeAttemptId !== null && !activeAttempt) ||
    (state.activeAttemptId !== null &&
      !['running', 'cancellation_requested'].includes(activeAttempt?.state ?? '')) ||
    state.attempts.length !== (state.job?.attemptCount ?? 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest recovery state is inconsistent.' })
  }
})

export const canonicalDistributedMediaIngestFixtureRecoverySnapshotSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-fixture-recovery-v1'),
  seedHash: sha256,
  state: fixtureStateSchema,
  snapshotHash: sha256,
}).strict()

export type CanonicalDistributedMediaIngestFixtureRecoverySnapshot = z.infer<
  typeof canonicalDistributedMediaIngestFixtureRecoverySnapshotSchema
>

export interface CanonicalDistributedMediaIngestFixtureInspection {
  revision: number
  job: JobView | null
  attempts: AttemptView[]
  activeAttemptId: string | null
  idempotencyRecordCount: number
  idempotencyKeyHashes: string[]
  persistedPlaintextIdempotencyKeyCount: 0
  persistedPlaintextLeaseCredentialCount: 0
  persistedRawPathSignedUrlProviderUrlOrCredentialCount: 0
  approvedSnapshotOrCreditReservationRecordCount: 0
  customerCommercialAuthorityRecordCount: 0
}

export interface CanonicalDistributedMediaIngestFixture {
  adapter: CanonicalDistributedMediaIngestTransactionAdapter
  controls: {
    inspect(): CanonicalDistributedMediaIngestFixtureInspection
    captureRecoverySnapshot(): CanonicalDistributedMediaIngestFixtureRecoverySnapshot
    failNextBeforeCommit(operation: FaultOperation): void
  }
}

export function createInMemoryCanonicalDistributedMediaIngestFixture(
  rawSeed: CanonicalDistributedMediaIngestSeed,
  rawRecoverySnapshot?: CanonicalDistributedMediaIngestFixtureRecoverySnapshot,
): CanonicalDistributedMediaIngestFixture {
  const seed = assertSeedIntegrity(rawSeed)
  let state: FixtureState = rawRecoverySnapshot
    ? restoreRecoverySnapshot(seed, rawRecoverySnapshot)
    : {
        revision: 0,
        job: null,
        activeAttemptId: null,
        attempts: [],
        controllerIdentityEvidenceHash: null,
        idempotency: {},
        auditChainHeadHash: emptyHash(),
      }
  let tail = Promise.resolve()
  const faults = new Set<FaultOperation>()

  const serialize = async <T>(operation: (draft: FixtureState) => T | Promise<T>): Promise<T> => {
    const previous = tail
    let release!: () => void
    tail = new Promise<void>((resolve) => { release = resolve })
    await previous
    try {
      const draft = structuredClone(state)
      const result = await operation(draft)
      state = draft
      return result
    } finally {
      release()
    }
  }

  const maybeFailBeforeCommit = (operation: FaultOperation): void => {
    if (!faults.delete(operation)) return
    throw new ApiError(
      'INTERNAL_ERROR',
      'Injected media-ingest transaction failure before commit.',
      500,
    )
  }

  const adapter: CanonicalDistributedMediaIngestTransactionAdapter = {
    descriptor: createCanonicalDistributedMediaIngestFixtureDescriptor(),

    async enqueue(rawInput) {
      const request = canonicalDistributedMediaIngestEnqueueRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'enqueue',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requireExactJobId(seed, request.jobId)
          if (draft.job) {
            throw conflict('Media-ingest authority was already enqueued with a different request.')
          }
          draft.controllerIdentityEvidenceHash = request.controllerIdentityEvidenceHash
          draft.job = {
            jobId: seed.jobId,
            state: 'queued',
            attemptCount: 0,
            maximumAttempts: seed.policy.maximumAttempts,
            remainingAttempts: seed.policy.maximumAttempts,
            sourceObjectIdentityEvidenceHash: null,
            latestDurableCheckpoint: null,
            cancellationRequestedAt: null,
            automaticRetryStarted: false,
          }
          return createMutationResponse({
            draft,
            seed,
            operation: 'enqueue',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.requestedAt,
            attempt: null,
          })
        },
      })
    },

    async claimAndStart(rawInput) {
      const request = canonicalDistributedMediaIngestClaimRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'claim_and_start',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          const job = requireJob(seed, draft, request.jobId)
          requireController(draft, request.controllerIdentityEvidenceHash)
          if (draft.activeAttemptId || !['queued', 'retry_available'].includes(job.state)) {
            throw conflict('Media-ingest job is not available for a new worker attempt.')
          }
          if (job.attemptCount >= job.maximumAttempts) {
            throw conflict('Media-ingest job exhausted its bounded attempts.')
          }
          assertCapacityAdmission(seed, request.capacityAdmission)
          if (
            job.sourceObjectIdentityEvidenceHash !== null &&
            job.sourceObjectIdentityEvidenceHash !== request.sourceObjectIdentityEvidenceHash
          ) {
            throw new ApiError(
              'UPLOAD_SOURCE_MISMATCH',
              'Media-ingest retry changed the generation-bound source object identity.',
              409,
            )
          }
          const attemptNumber = job.attemptCount + 1
          const attemptId = identifier('mediaingestattempt', {
            identityHash: seed.identity.identityHash,
            attemptNumber,
          })
          const leaseId = identifier('mediaingestlease', {
            attemptId,
            workerIdentityEvidenceHash: request.workerIdentityEvidenceHash,
          })
          const startedAtMs = requireTimestamp(request.acceptedAt)
          const deadlineAtMs = startedAtMs + seed.policy.attemptDeadlineDurationMs
          const expiresAtMs = Math.min(
            startedAtMs + seed.policy.leaseDurationMs,
            deadlineAtMs,
          )
          const resumeCheckpoint = job.latestDurableCheckpoint
          const startPayload = {
            schemaVersion: 'canonical-distributed-media-ingest-attempt-start-v1' as const,
            workerIdentityEvidenceHash: request.workerIdentityEvidenceHash,
            workerReceiptHash: request.workerReceiptHash,
            capacityAdmissionEvidenceHash: request.capacityAdmission.evidenceHash,
            capacityReservationIdentityHash: request.capacityAdmission.reservationIdentityHash,
            requiredAvailableBytes: request.capacityAdmission.requiredAvailableBytes,
            sourceObjectIdentityEvidenceHash: request.sourceObjectIdentityEvidenceHash,
            workloadProfileId: seed.policy.workloadProfileId,
            rateCardVersion: seed.policy.rateCardVersion,
            rateCardHash: seed.policy.rateCardHash,
            resourceEnvelope: seed.policy.resourceEnvelope,
            resumeOffsetBytes: resumeCheckpoint?.verifiedByteOffset ?? 0,
            resumeCheckpointHash: resumeCheckpoint?.checkpointHash ?? null,
            startedAt: request.acceptedAt,
            approvedPlanSnapshotOrCreditReservationRequired: false as const,
            customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
          }
          const attempt: AttemptView = {
            attemptId,
            jobId: job.jobId,
            attemptNumber,
            leaseId,
            leaseHash: sha256AuthorityValue({
              domain: 'canonical_distributed_media_ingest_lease_v1',
              leaseId,
              attemptId,
            }),
            state: 'running',
            heartbeatAt: request.acceptedAt,
            heartbeatCount: 0,
            leaseExpiresAt: new Date(expiresAtMs).toISOString(),
            attemptDeadlineAt: new Date(deadlineAtMs).toISOString(),
            attemptStart: {
              ...startPayload,
              evidenceHash: sha256AuthorityValue(startPayload),
            },
            latestCheckpoint: resumeCheckpoint,
            terminal: null,
          }
          job.state = 'running'
          job.attemptCount = attemptNumber
          job.remainingAttempts = job.maximumAttempts - attemptNumber
          job.sourceObjectIdentityEvidenceHash = request.sourceObjectIdentityEvidenceHash
          job.cancellationRequestedAt = null
          draft.activeAttemptId = attemptId
          draft.attempts.push(attempt)
          return createMutationResponse({
            draft,
            seed,
            operation: 'claim_and_start',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.acceptedAt,
            attempt,
          })
        },
      })
    },

    async recordProgress(rawInput) {
      const request = canonicalDistributedMediaIngestProgressRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'record_progress',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          const job = requireJob(seed, draft, request.jobId)
          if (job.state !== 'running') {
            throw conflict('Media-ingest progress requires one active non-cancelled job.')
          }
          const attempt = requireActiveAttempt(draft, request.attemptId)
          requireWorker(attempt, request)
          const heartbeatAtMs = requireActiveTime(attempt, request.heartbeatAt)
          const previous = attempt.latestCheckpoint
          assertProgressTransition({
            expectedSizeBytes: seed.identity.expectedSizeBytes,
            previous,
            phase: request.phase,
            verifiedByteOffset: request.verifiedByteOffset,
          })
          const checkpointPayload = {
            schemaVersion: 'canonical-distributed-media-ingest-checkpoint-v1' as const,
            checkpointSequence: (previous?.checkpointSequence ?? 0) + 1,
            phase: request.phase,
            verifiedByteOffset: request.verifiedByteOffset,
            continuationStateObjectIdentityHash: request.continuationStateObjectIdentityHash,
            checkpointEvidenceHash: request.checkpointEvidenceHash,
            sourceObjectIdentityEvidenceHash: attempt.attemptStart.sourceObjectIdentityEvidenceHash,
            recordedAt: request.heartbeatAt,
          }
          const checkpoint: Checkpoint = {
            ...checkpointPayload,
            checkpointHash: sha256AuthorityValue(checkpointPayload),
          }
          attempt.latestCheckpoint = checkpoint
          attempt.heartbeatAt = request.heartbeatAt
          attempt.heartbeatCount += 1
          attempt.leaseExpiresAt = new Date(Math.min(
            heartbeatAtMs + seed.policy.leaseDurationMs,
            Date.parse(attempt.attemptDeadlineAt),
          )).toISOString()
          job.latestDurableCheckpoint = checkpoint
          return createMutationResponse({
            draft,
            seed,
            operation: 'record_progress',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.heartbeatAt,
            attempt,
          })
        },
      })
    },

    async reconcileCompletion(rawInput) {
      const request = canonicalDistributedMediaIngestCompletionRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'reconcile_completion',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          const job = requireJob(seed, draft, request.jobId)
          if (job.state !== 'running') {
            throw conflict('Cancelled or terminal media ingest cannot commit completion.')
          }
          const attempt = requireActiveAttempt(draft, request.attemptId)
          requireWorker(attempt, request)
          requireActiveTime(attempt, request.completedAt, true)
          const checkpoint = attempt.latestCheckpoint
          if (
            !checkpoint || checkpoint.phase !== 'canonical_commit_ready' ||
            checkpoint.verifiedByteOffset !== seed.identity.expectedSizeBytes ||
            request.sizeBytes !== seed.identity.expectedSizeBytes ||
            request.generationIdentityHash !==
              attempt.attemptStart.sourceObjectIdentityEvidenceHash
          ) {
            throw new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'Media-ingest completion requires an exact full-byte canonical-commit checkpoint.',
              409,
            )
          }
          const resultPayload = {
            schemaVersion: 'canonical-distributed-media-ingest-completion-v1' as const,
            uploadIntentId: seed.identity.uploadIntentId,
            mediaAssetId: request.mediaAssetId,
            storageObjectRecordId: request.storageObjectRecordId,
            sizeBytes: request.sizeBytes,
            checksumSha256: request.checksumSha256,
            sourceMetadataHash: request.sourceMetadataHash,
            generationIdentityHash: request.generationIdentityHash,
            canonicalOutcomeHash: request.canonicalOutcomeHash,
            privateCreateOnlyReadbackVerified: true as const,
            rawPathSignedUrlOrProviderUrlPersisted: false as const,
          }
          const completionResult = {
            ...resultPayload,
            resultHash: sha256AuthorityValue(resultPayload),
          }
          const terminal = createTerminal({
            seed,
            attempt,
            terminalKind: 'completion',
            terminalEvidenceHash: request.canonicalOutcomeHash,
            failureCategory: null,
            sanitizedFailureCode: null,
            completionResult,
            terminalAt: request.completedAt,
            queueDisposition: 'completed',
          })
          attempt.state = 'completed'
          attempt.terminal = terminal
          job.state = 'completed'
          draft.activeAttemptId = null
          return createMutationResponse({
            draft,
            seed,
            operation: 'reconcile_completion',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.completedAt,
            attempt,
          })
        },
      })
    },

    async reconcileFailure(rawInput) {
      const request = canonicalDistributedMediaIngestFailureRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'reconcile_failure',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          const job = requireJob(seed, draft, request.jobId)
          const attempt = requireActiveAttempt(draft, request.attemptId)
          requireWorker(attempt, request)
          requireActiveTime(attempt, request.failedAt, true)
          if (
            (request.failureCategory === 'cancelled') !==
              (job.state === 'cancellation_requested')
          ) {
            throw conflict('Cancellation outcome does not match controller cancellation authority.')
          }
          const retryableCategory = ['reeditpro_error_absorbed', 'unknown']
            .includes(request.failureCategory)
          const queueDisposition = request.failureCategory === 'cancelled'
            ? 'cancelled' as const
            : retryableCategory && job.remainingAttempts > 0
              ? 'retry_available' as const
              : retryableCategory
                ? 'attempts_exhausted' as const
                : 'terminal_source_or_validation_failure' as const
          const terminal = createTerminal({
            seed,
            attempt,
            terminalKind: 'failure',
            terminalEvidenceHash: request.failureEvidenceHash,
            failureCategory: request.failureCategory,
            sanitizedFailureCode: request.sanitizedFailureCode,
            completionResult: null,
            terminalAt: request.failedAt,
            queueDisposition,
          })
          attempt.state = 'failed'
          attempt.terminal = terminal
          job.state = queueDisposition === 'retry_available'
            ? 'retry_available'
            : queueDisposition === 'cancelled'
              ? 'cancelled'
              : 'failed_terminal'
          job.cancellationRequestedAt = null
          draft.activeAttemptId = null
          return createMutationResponse({
            draft,
            seed,
            operation: 'reconcile_failure',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.failedAt,
            attempt,
          })
        },
      })
    },

    async requestCancellation(rawInput) {
      const request = canonicalDistributedMediaIngestCancellationRequestSchema.parse(rawInput)
      return runMutation({
        operation: 'request_cancellation',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          const job = requireJob(seed, draft, request.jobId)
          requireController(draft, request.controllerIdentityEvidenceHash)
          let attempt: AttemptView | null = null
          if (['queued', 'retry_available'].includes(job.state)) {
            job.state = 'cancelled'
            job.cancellationRequestedAt = null
          } else if (job.state === 'running') {
            attempt = requireActiveAttempt(draft, draft.activeAttemptId ?? '')
            requireActiveTime(attempt, request.requestedAt, true)
            job.state = 'cancellation_requested'
            job.cancellationRequestedAt = request.requestedAt
            attempt.state = 'cancellation_requested'
          } else {
            throw conflict('Media-ingest job cannot accept cancellation in its current state.')
          }
          return createMutationResponse({
            draft,
            seed,
            operation: 'request_cancellation',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.requestedAt,
            attempt,
          })
        },
      })
    },

    async finalizeExpiredAttempt(rawInput) {
      const request = canonicalDistributedMediaIngestTimeoutRequestSchema.parse(rawInput)
      return serialize((draft) => {
        const idempotencyKeyHash = canonicalDistributedMediaIngestIdempotencyKeyHash(
          request.idempotencyKey,
        )
        const storageKey = `finalize_expired_attempt:${idempotencyKeyHash}`
        const existing = draft.idempotency[storageKey]
        if (existing) {
          if (
            existing.operation !== 'finalize_expired_attempt' ||
            existing.requestHash !== request.requestHash
          ) {
            throw conflict('Media-ingest timeout idempotency key changed request identity.')
          }
          return {
            idempotencyStatus: 'exact_replay' as const,
            response: structuredClone(existing.response as CanonicalDistributedMediaIngestTimeoutResponse),
          }
        }
        const job = requireJob(seed, draft, request.jobId)
        requireController(draft, request.controllerIdentityEvidenceHash)
        const observedAtMs = requireTimestamp(request.observedAt)
        const attempt = draft.activeAttemptId
          ? requireActiveAttempt(draft, draft.activeAttemptId)
          : null
        const expired = attempt !== null &&
          ['running', 'cancellation_requested'].includes(attempt.state) &&
          Date.parse(attempt.leaseExpiresAt) <= observedAtMs
        let response: CanonicalDistributedMediaIngestTimeoutResponse
        if (!expired || !attempt) {
          response = createTimeoutResponse({
            draft,
            seed,
            requestHash: request.requestHash,
            idempotencyKeyHash,
            observedAt: request.observedAt,
            attempt: null,
            transaction: null,
          })
        } else {
          const cancelled = job.state === 'cancellation_requested'
          const queueDisposition = cancelled
            ? 'cancelled' as const
            : job.remainingAttempts > 0
              ? 'retry_available' as const
              : 'attempts_exhausted' as const
          const terminal = createTerminal({
            seed,
            attempt,
            terminalKind: 'timeout',
            terminalEvidenceHash: sha256AuthorityValue({
              domain: 'canonical_distributed_media_ingest_timeout_v1',
              attemptId: attempt.attemptId,
              leaseHash: attempt.leaseHash,
              heartbeatAt: attempt.heartbeatAt,
              leaseExpiresAt: attempt.leaseExpiresAt,
              checkpointHash: attempt.latestCheckpoint?.checkpointHash ?? null,
            }),
            failureCategory: null,
            sanitizedFailureCode: null,
            completionResult: null,
            terminalAt: attempt.leaseExpiresAt,
            queueDisposition,
          })
          attempt.state = 'timed_out'
          attempt.terminal = terminal
          job.state = queueDisposition === 'retry_available'
            ? 'retry_available'
            : queueDisposition === 'cancelled'
              ? 'cancelled'
              : 'failed_terminal'
          job.cancellationRequestedAt = null
          draft.activeAttemptId = null
          const revisionBefore = draft.revision
          draft.revision += 1
          const transactionId = identifier('mediaingesttimeouttx', {
            identityHash: seed.identity.identityHash,
            revisionAfter: draft.revision,
            requestHash: request.requestHash,
          })
          const auditEventHash = appendAuditEvent({
            draft,
            seed,
            operation: 'finalize_expired_attempt',
            transactionId,
            attemptId: attempt.attemptId,
          })
          const transactionPayload = {
            transactionId,
            revisionBefore,
            revisionAfter: draft.revision,
            auditEventHash,
            committedAt: attempt.leaseExpiresAt,
          }
          response = createTimeoutResponse({
            draft,
            seed,
            requestHash: request.requestHash,
            idempotencyKeyHash,
            observedAt: request.observedAt,
            attempt,
            transaction: {
              ...transactionPayload,
              transactionHash: sha256AuthorityValue(transactionPayload),
            },
          })
        }
        draft.idempotency[storageKey] = {
          operation: 'finalize_expired_attempt',
          requestHash: request.requestHash,
          response: structuredClone(response),
        }
        maybeFailBeforeCommit('finalize_expired_attempt')
        return { idempotencyStatus: 'inserted' as const, response }
      })
    },
  }

  return {
    adapter,
    controls: {
      inspect: () => inspectState(state),
      captureRecoverySnapshot: () => createRecoverySnapshot(seed, state),
      failNextBeforeCommit(operation) {
        faults.add(operation)
      },
    },
  }
}

function createRecoverySnapshot(
  seed: CanonicalDistributedMediaIngestSeed,
  state: FixtureState,
): CanonicalDistributedMediaIngestFixtureRecoverySnapshot {
  const parsedState = fixtureStateSchema.parse(structuredClone(state))
  const payload = {
    schemaVersion: 'canonical-distributed-media-ingest-fixture-recovery-v1' as const,
    seedHash: seed.seedHash,
    state: parsedState,
  }
  return canonicalDistributedMediaIngestFixtureRecoverySnapshotSchema.parse({
    ...payload,
    snapshotHash: sha256AuthorityValue(payload),
  })
}

function restoreRecoverySnapshot(
  seed: CanonicalDistributedMediaIngestSeed,
  input: CanonicalDistributedMediaIngestFixtureRecoverySnapshot,
): FixtureState {
  const snapshot = canonicalDistributedMediaIngestFixtureRecoverySnapshotSchema.parse(input)
  const { snapshotHash, ...payload } = snapshot
  if (snapshot.seedHash !== seed.seedHash || snapshotHash !== sha256AuthorityValue(payload)) {
    throw atomicity('Media-ingest fixture recovery snapshot checksum or seed is invalid.')
  }
  for (const record of Object.values(snapshot.state.idempotency)) {
    if (record.operation === 'finalize_expired_attempt') {
      assertCanonicalDistributedMediaIngestTimeoutIntegrity(record.response)
    } else {
      assertCanonicalDistributedMediaIngestMutationIntegrity(record.response)
    }
  }
  return structuredClone(snapshot.state) as FixtureState
}

async function runMutation<TRequest extends { idempotencyKey: string; requestHash: string }>(input: {
  operation: MutationOperation
  request: TRequest
  serialize: <T>(operation: (draft: FixtureState) => T | Promise<T>) => Promise<T>
  maybeFailBeforeCommit: (operation: FaultOperation) => void
  mutate: (draft: FixtureState, idempotencyKeyHash: string) => CanonicalDistributedMediaIngestMutationResponse
}): Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>> {
  return input.serialize((draft) => {
    const idempotencyKeyHash = canonicalDistributedMediaIngestIdempotencyKeyHash(
      input.request.idempotencyKey,
    )
    const storageKey = `${input.operation}:${idempotencyKeyHash}`
    const existing = draft.idempotency[storageKey]
    if (existing) {
      if (
        existing.operation !== input.operation ||
        existing.requestHash !== input.request.requestHash
      ) {
        throw conflict('Media-ingest idempotency key changed request identity.')
      }
      return {
        idempotencyStatus: 'exact_replay' as const,
        response: structuredClone(existing.response as CanonicalDistributedMediaIngestMutationResponse),
      }
    }
    const response = input.mutate(draft, idempotencyKeyHash)
    draft.idempotency[storageKey] = {
      operation: input.operation,
      requestHash: input.request.requestHash,
      response: structuredClone(response),
    }
    input.maybeFailBeforeCommit(input.operation)
    return { idempotencyStatus: 'inserted' as const, response }
  })
}

function createMutationResponse(input: {
  draft: FixtureState
  seed: CanonicalDistributedMediaIngestSeed
  operation: MutationOperation
  requestHash: string
  idempotencyKeyHash: string
  committedAt: string
  attempt: AttemptView | null
}): CanonicalDistributedMediaIngestMutationResponse {
  const job = input.draft.job
  if (!job) throw atomicity('Media-ingest response cannot commit without a job.')
  const revisionBefore = input.draft.revision
  input.draft.revision += 1
  const transactionId = identifier('mediaingesttx', {
    identityHash: input.seed.identity.identityHash,
    operation: input.operation,
    revisionAfter: input.draft.revision,
    requestHash: input.requestHash,
  })
  const auditEventHash = appendAuditEvent({
    draft: input.draft,
    seed: input.seed,
    operation: input.operation,
    transactionId,
    attemptId: input.attempt?.attemptId ?? null,
  })
  const transactionPayload = {
    schemaVersion: 'canonical-distributed-media-ingest-transaction-v1' as const,
    transactionId,
    operation: input.operation,
    ingestIdentityHash: input.seed.identity.identityHash,
    revisionBefore,
    revisionAfter: input.draft.revision,
    requestHash: input.requestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    auditEventHash,
    committedAt: input.committedAt,
  }
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_RESPONSE_VERSION,
    operation: input.operation,
    transaction: {
      ...transactionPayload,
      transactionHash: sha256AuthorityValue(transactionPayload),
    },
    job: structuredClone(job),
    attempt: input.attempt ? structuredClone(input.attempt) : null,
    boundaries: canonicalDistributedMediaIngestPersistenceBoundaries(),
  }
  return canonicalDistributedMediaIngestMutationResponseSchema.parse({
    ...payload,
    responseHash: sha256AuthorityValue(payload),
  })
}

function createTimeoutResponse(input: {
  draft: FixtureState
  seed: CanonicalDistributedMediaIngestSeed
  requestHash: string
  idempotencyKeyHash: string
  observedAt: string
  attempt: AttemptView | null
  transaction: CanonicalDistributedMediaIngestTimeoutResponse['transaction']
}): CanonicalDistributedMediaIngestTimeoutResponse {
  const job = input.draft.job
  if (!job) throw atomicity('Media-ingest timeout response cannot exist without a job.')
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_TIMEOUT_RESPONSE_VERSION,
    operation: 'finalize_expired_attempt' as const,
    jobId: input.seed.jobId,
    ingestIdentityHash: input.seed.identity.identityHash,
    requestHash: input.requestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    observedAt: input.observedAt,
    expiredAttemptReconciled: input.transaction !== null,
    job: structuredClone(job),
    attempt: input.attempt ? structuredClone(input.attempt) : null,
    transaction: input.transaction,
    boundaries: {
      ...canonicalDistributedMediaIngestPersistenceBoundaries(),
      activeAttemptSelectedByTransaction: true as const,
      callerSelectedAttemptOrExpiryAllowed: false as const,
      terminalCostBoundedAtImmutableLeaseExpiry: true as const,
    },
  }
  return canonicalDistributedMediaIngestTimeoutResponseSchema.parse({
    ...payload,
    responseHash: sha256AuthorityValue(payload),
  })
}

function createTerminal(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: AttemptView
  terminalKind: 'completion' | 'failure' | 'timeout'
  terminalEvidenceHash: string
  failureCategory: NonNullable<AttemptView['terminal']>['failureCategory']
  sanitizedFailureCode: string | null
  completionResult: NonNullable<AttemptView['terminal']>['completionResult']
  terminalAt: string
  queueDisposition: NonNullable<AttemptView['terminal']>['queueDisposition']
}): NonNullable<AttemptView['terminal']> {
  if (input.attempt.terminal) {
    throw conflict('Media-ingest attempt already has a terminal outcome.')
  }
  const startedAtMs = Date.parse(input.attempt.attemptStart.startedAt)
  const terminalAtMs = Date.parse(input.terminalAt)
  const wallTimeMilliseconds = terminalAtMs - startedAtMs
  if (
    !Number.isSafeInteger(wallTimeMilliseconds) || wallTimeMilliseconds <= 0 ||
    wallTimeMilliseconds > input.seed.policy.attemptDeadlineDurationMs
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Media-ingest terminal time is outside the immutable attempt window.',
      409,
    )
  }
  const tempStorageGibHours = (
    input.seed.identity.expectedSizeBytes / (1024 ** 3)
  ) * (wallTimeMilliseconds / (60 * 60 * 1_000))
  const calculated = calculateToolActualCostMicros({
    sourceKind: 'infrastructure_runtime',
    runtime: {
      wallTimeMilliseconds,
      renderSeconds: 0,
      vcpuCount: input.seed.policy.resourceEnvelope.vcpuCount,
      memoryGib: input.seed.policy.resourceEnvelope.memoryGib,
      gpuCount: input.seed.policy.resourceEnvelope.gpuCount,
      tempStorageGibHours,
      outputStorageGibHours: 0,
      networkEgressMib: 0,
      computeLevel: 'standard',
    },
  })
  if (!calculated.ok || calculated.data.billableMilliseconds === undefined) {
    throw atomicity('Media-ingest internal infrastructure cost could not be calculated.')
  }
  const usageEvidenceHash = sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_usage_v1',
    attemptId: input.attempt.attemptId,
    attemptStartEvidenceHash: input.attempt.attemptStart.evidenceHash,
    startedAt: input.attempt.attemptStart.startedAt,
    finishedAt: input.terminalAt,
    wallTimeMilliseconds,
    tempStorageGibHours,
    resourceEnvelope: input.seed.policy.resourceEnvelope,
    checkpointHash: input.attempt.latestCheckpoint?.checkpointHash ?? null,
  })
  const costPayload = {
    schemaVersion: 'canonical-distributed-media-ingest-terminal-cost-v1' as const,
    attemptStartEvidenceHash: input.attempt.attemptStart.evidenceHash,
    usageEvidenceHash,
    rateCardVersion: input.seed.policy.rateCardVersion,
    rateCardHash: input.seed.policy.rateCardHash,
    workloadProfileId: input.seed.policy.workloadProfileId,
    billableMilliseconds: calculated.data.billableMilliseconds,
    vcpuCount: input.seed.policy.resourceEnvelope.vcpuCount,
    memoryGib: input.seed.policy.resourceEnvelope.memoryGib,
    gpuCount: input.seed.policy.resourceEnvelope.gpuCount,
    tempStorageGibHours,
    actualInternalCostMicros: calculated.data.actualInternalCostMicros,
    breakdownHash: sha256AuthorityValue(calculated.data.breakdownMicros),
    outcome: input.terminalKind === 'completion'
      ? 'completed' as const
      : input.terminalKind === 'failure'
        ? 'failed' as const
        : 'timeout' as const,
    finishedAt: input.terminalAt,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    invoiceReconciled: false as const,
  }
  const retryDisposition = input.queueDisposition === 'retry_available'
    ? 'explicit_same_source_retry_available' as const
    : input.queueDisposition === 'attempts_exhausted' ||
        input.queueDisposition === 'terminal_source_or_validation_failure'
      ? 'fresh_upload_or_manual_review_required' as const
      : 'not_applicable' as const
  const terminalPayload = {
    schemaVersion: 'canonical-distributed-media-ingest-terminal-v1' as const,
    terminalKind: input.terminalKind,
    terminalEvidenceHash: input.terminalEvidenceHash,
    terminalCost: {
      ...costPayload,
      evidenceHash: sha256AuthorityValue(costPayload),
    },
    queueDisposition: input.queueDisposition,
    retryDisposition,
    automaticRetryStarted: false as const,
    failureCategory: input.failureCategory,
    sanitizedFailureCode: input.sanitizedFailureCode,
    completionResult: input.completionResult,
    terminalAt: input.terminalAt,
  }
  return {
    ...terminalPayload,
    terminalHash: sha256AuthorityValue(terminalPayload),
  }
}

function assertCapacityAdmission(
  seed: CanonicalDistributedMediaIngestSeed,
  admission: {
    policyId: 'large_media_worker_capacity_v1'
    expectedSourceBytes: number
    sourceStagingBytes: number
    safetyReserveBytes: number
    requiredAvailableBytes: number
    observedAvailableBytes: number
    reservationIdentityHash: string
    byteTraversalAuthorized: true
    evidenceHash: string
  },
): void {
  const expectedSafetyReserveBytes = Math.max(
    seed.policy.minimumHeadroomBytes,
    Math.ceil(seed.identity.expectedSizeBytes * 0.1),
  )
  const expectedRequiredAvailableBytes =
    seed.identity.expectedSizeBytes + expectedSafetyReserveBytes
  const { evidenceHash, ...evidencePayload } = admission
  if (
    admission.expectedSourceBytes !== seed.identity.expectedSizeBytes ||
    admission.sourceStagingBytes !== seed.identity.expectedSizeBytes ||
    admission.safetyReserveBytes !== expectedSafetyReserveBytes ||
    admission.requiredAvailableBytes !== expectedRequiredAvailableBytes ||
    admission.observedAvailableBytes < expectedRequiredAvailableBytes ||
    evidenceHash !== sha256AuthorityValue({
      domain: 'canonical_distributed_media_ingest_capacity_admission_v1',
      ingestIdentityHash: seed.identity.identityHash,
      ...evidencePayload,
    })
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Media-ingest capacity admission does not bind the exact source and headroom policy.',
      409,
    )
  }
}

function assertProgressTransition(input: {
  expectedSizeBytes: number
  previous: Checkpoint | null
  phase: Checkpoint['phase']
  verifiedByteOffset: number
}): void {
  const rank: Record<Checkpoint['phase'], number> = {
    hashing: 1,
    hash_complete: 2,
    probe_complete: 3,
    canonical_commit_ready: 4,
  }
  const previousOffset = input.previous?.verifiedByteOffset ?? 0
  const previousRank = input.previous ? rank[input.previous.phase] : 0
  const phaseRank = rank[input.phase]
  const hashingValid = input.phase !== 'hashing' || (
    input.verifiedByteOffset > previousOffset &&
    input.verifiedByteOffset < input.expectedSizeBytes
  )
  const completePhaseValid = input.phase === 'hashing' ||
    input.verifiedByteOffset === input.expectedSizeBytes
  const phaseStepValid = input.phase === 'hashing'
    ? phaseRank === previousRank || phaseRank === previousRank + 1
    : phaseRank === previousRank + 1
  if (
    phaseRank < previousRank ||
    input.verifiedByteOffset < previousOffset ||
    !hashingValid ||
    !completePhaseValid ||
    !phaseStepValid
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Media-ingest progress must advance monotonically through exact byte and phase authority.',
      409,
    )
  }
}

function requireJob(
  seed: CanonicalDistributedMediaIngestSeed,
  state: FixtureState,
  jobId: string,
): JobView {
  requireExactJobId(seed, jobId)
  if (!state.job) throw new ApiError('JOB_NOT_FOUND', 'Media-ingest job was not enqueued.', 404)
  return state.job
}

function requireExactJobId(seed: CanonicalDistributedMediaIngestSeed, jobId: string): void {
  if (jobId !== seed.jobId) {
    throw new ApiError('JOB_NOT_FOUND', 'Media-ingest job identity is invalid.', 404)
  }
}

function requireController(state: FixtureState, evidenceHash: string): void {
  if (state.controllerIdentityEvidenceHash !== evidenceHash) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Media-ingest controller identity does not own this authority.',
      403,
    )
  }
}

function requireActiveAttempt(state: FixtureState, attemptId: string): AttemptView {
  if (state.activeAttemptId !== attemptId) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'Media-ingest attempt is not active.', 409)
  }
  const attempt = state.attempts.find((item) => item.attemptId === attemptId)
  if (!attempt || !['running', 'cancellation_requested'].includes(attempt.state)) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'Media-ingest attempt is not active.', 409)
  }
  return attempt
}

function requireWorker(
  attempt: AttemptView,
  request: { workerIdentityEvidenceHash: string; workerReceiptHash: string },
): void {
  if (
    attempt.attemptStart.workerIdentityEvidenceHash !== request.workerIdentityEvidenceHash ||
    attempt.attemptStart.workerReceiptHash !== request.workerReceiptHash
  ) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Media-ingest worker identity does not own this attempt.',
      403,
    )
  }
}

function requireActiveTime(
  attempt: AttemptView,
  value: string,
  allowEqualHeartbeat = false,
): number {
  const time = requireTimestamp(value)
  if (
    (allowEqualHeartbeat
      ? time < Date.parse(attempt.heartbeatAt)
      : time <= Date.parse(attempt.heartbeatAt)) ||
    time >= Date.parse(attempt.leaseExpiresAt) ||
    time >= Date.parse(attempt.attemptDeadlineAt)
  ) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'Media-ingest mutation is outside the active lease.', 409)
  }
  return time
}

function appendAuditEvent(input: {
  draft: FixtureState
  seed: CanonicalDistributedMediaIngestSeed
  operation: FaultOperation
  transactionId: string
  attemptId: string | null
}): string {
  const eventHash = sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_audit_v1',
    previousEventHash: input.draft.auditChainHeadHash,
    identityHash: input.seed.identity.identityHash,
    operation: input.operation,
    transactionId: input.transactionId,
    attemptId: input.attemptId,
    revision: input.draft.revision,
  })
  input.draft.auditChainHeadHash = eventHash
  return eventHash
}

function inspectState(state: FixtureState): CanonicalDistributedMediaIngestFixtureInspection {
  return {
    revision: state.revision,
    job: state.job ? structuredClone(state.job) : null,
    attempts: structuredClone(state.attempts),
    activeAttemptId: state.activeAttemptId,
    idempotencyRecordCount: Object.keys(state.idempotency).length,
    idempotencyKeyHashes: Object.keys(state.idempotency)
      .map((key) => key.slice(key.indexOf(':') + 1))
      .sort(),
    persistedPlaintextIdempotencyKeyCount: 0,
    persistedPlaintextLeaseCredentialCount: 0,
    persistedRawPathSignedUrlProviderUrlOrCredentialCount: 0,
    approvedSnapshotOrCreditReservationRecordCount: 0,
    customerCommercialAuthorityRecordCount: 0,
  }
}

function assertSeedIntegrity(rawSeed: CanonicalDistributedMediaIngestSeed): CanonicalDistributedMediaIngestSeed {
  const seed = canonicalDistributedMediaIngestSeedSchema.parse(rawSeed)
  const { identityHash, ...identityPayload } = seed.identity
  const { policyHash, ...policyPayload } = seed.policy
  const { seedHash, ...seedPayload } = seed
  if (
    identityHash !== sha256AuthorityValue(identityPayload) ||
    policyHash !== sha256AuthorityValue(policyPayload) ||
    seedHash !== sha256AuthorityValue(seedPayload)
  ) {
    throw atomicity('Media-ingest seed checksum is invalid.')
  }
  return structuredClone(seed)
}

function identifier(prefix: string, value: unknown): string {
  return `${prefix}-${sha256AuthorityValue(value).slice(0, 48)}`
}

function emptyHash(): string {
  return sha256AuthorityValue({ domain: 'canonical_distributed_media_ingest_empty_audit_v1' })
}

function requireTimestamp(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) {
    throw new ApiError('VALIDATION_FAILED', 'Media-ingest timestamp is invalid.', 400)
  }
  return parsed
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function atomicity(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503)
}
