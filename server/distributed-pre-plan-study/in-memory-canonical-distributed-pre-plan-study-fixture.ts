import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RECOVERY_RESPONSE_VERSION,
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RESPONSE_VERSION,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema,
  canonicalDistributedPrePlanStudyAttemptStartHash,
  canonicalDistributedPrePlanStudyAttemptViewHash,
  canonicalDistributedPrePlanStudyCheckpointHash,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyFailureRequestSchema,
  canonicalDistributedPrePlanStudyIdempotencyKeyHash,
  canonicalDistributedPrePlanStudyLeaseCredentialHash,
  canonicalDistributedPrePlanStudyMutationResponseHash,
  canonicalDistributedPrePlanStudyMutationResponseSchema,
  canonicalDistributedPrePlanStudyOutputHash,
  canonicalDistributedPrePlanStudyPersistenceBoundaries,
  canonicalDistributedPrePlanStudyRequestHash,
  canonicalDistributedPrePlanStudyRecoveryRequestSchema,
  canonicalDistributedPrePlanStudyRecoveryResponseHash,
  canonicalDistributedPrePlanStudyRecoveryResponseSchema,
  canonicalDistributedPrePlanStudyRunViewHash,
  canonicalDistributedPrePlanStudyRunViewSchema,
  canonicalDistributedPrePlanStudySeedSchema,
  canonicalDistributedPrePlanStudyTerminalHash,
  canonicalDistributedPrePlanStudyTransactionHash,
  canonicalDistributedPrePlanStudyAttemptViewSchema,
  canonicalDistributedPrePlanStudyWorkItemViewSchema,
  createCanonicalDistributedPrePlanStudyFixtureDescriptor,
  type CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  type CanonicalDistributedPrePlanStudyAttemptView,
  type CanonicalDistributedPrePlanStudyCheckpoint,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudyPortResult,
  type CanonicalDistributedPrePlanStudyRecoveryResponse,
  type CanonicalDistributedPrePlanStudyRunView,
  type CanonicalDistributedPrePlanStudySeed,
  type CanonicalDistributedPrePlanStudyTransactionAdapter,
  type CanonicalDistributedPrePlanStudyWorkItemSeed,
  type CanonicalDistributedPrePlanStudyWorkItemView,
} from './canonical-distributed-pre-plan-study-state-port'

type EnqueueRequest = ReturnType<typeof canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse>
type ClaimRequest = Parameters<CanonicalDistributedPrePlanStudyTransactionAdapter['claimAndStart']>[0]
type HeartbeatRequest = Parameters<CanonicalDistributedPrePlanStudyTransactionAdapter['heartbeatAndCheckpoint']>[0]
type CompletionRequest = Parameters<CanonicalDistributedPrePlanStudyTransactionAdapter['complete']>[0]
type FailureRequest = ReturnType<typeof canonicalDistributedPrePlanStudyFailureRequestSchema.parse>
type ControlRequest = ReturnType<typeof canonicalDistributedPrePlanStudyControlRequestSchema.parse>
type RecoveryRequest = ReturnType<typeof canonicalDistributedPrePlanStudyRecoveryRequestSchema.parse>
type MutationRequest = EnqueueRequest | ClaimRequest | HeartbeatRequest |
  CompletionRequest | FailureRequest | ControlRequest
type AttemptMutationRequest = HeartbeatRequest | CompletionRequest | FailureRequest
type MutationOperation = CanonicalDistributedPrePlanStudyMutationResponse['operation']

type MutableWorkState = CanonicalDistributedPrePlanStudyWorkItemView['state']
type MutableAttemptState = CanonicalDistributedPrePlanStudyAttemptView['state']
type MutableRunState = CanonicalDistributedPrePlanStudyRunView['state']

interface MutableWorkItem {
  readonly seed: CanonicalDistributedPrePlanStudyWorkItemSeed
  state: MutableWorkState
  attemptCount: number
  latestCheckpoint: CanonicalDistributedPrePlanStudyCheckpoint | null
  completedOutputHashes: string[]
  cumulativeInternalCostMicros: bigint
  activeAttemptId: string | null
  blockerCode: string | null
}

interface MutableAttempt {
  attemptStart: CanonicalDistributedPrePlanStudyAttemptView['attemptStart']
  state: MutableAttemptState
  heartbeatAt: string
  heartbeatCount: number
  leaseExpiresAt: string
  latestCheckpoint: CanonicalDistributedPrePlanStudyCheckpoint | null
  terminal: CanonicalDistributedPrePlanStudyAttemptView['terminal']
}

interface StoredMutation {
  readonly requestHash: string
  readonly response:
    | CanonicalDistributedPrePlanStudyMutationResponse
    | CanonicalDistributedPrePlanStudyRecoveryResponse
}

interface MutableStudyAggregate {
  readonly seed: CanonicalDistributedPrePlanStudySeed
  readonly controllerIdentityEvidenceHash: string
  revision: number
  state: MutableRunState
  pauseRequestedAt: string | null
  cancelRequestedAt: string | null
  recoveryGeneration: number
  readonly workItems: Map<string, MutableWorkItem>
  readonly attempts: Map<string, MutableAttempt>
  readonly idempotency: Map<string, StoredMutation>
  auditChainHeadHash: string
}

export interface CanonicalDistributedPrePlanStudyFixtureInspection {
  readonly run: CanonicalDistributedPrePlanStudyRunView
  readonly workItems: readonly CanonicalDistributedPrePlanStudyWorkItemView[]
  readonly attempts: readonly CanonicalDistributedPrePlanStudyAttemptView[]
  readonly persistedRepresentation: string
  readonly plaintextLeaseCredentialPersisted: false
  readonly rawMediaPersisted: false
  readonly signedUrlPersisted: false
  readonly providerCredentialPersisted: false
  readonly localPathPersisted: false
  readonly productionAuthority: false
}

export interface InMemoryCanonicalDistributedPrePlanStudyFixture {
  readonly adapter: CanonicalDistributedPrePlanStudyTransactionAdapter
  inspect(runId: string): CanonicalDistributedPrePlanStudyFixtureInspection
}

export function createInMemoryCanonicalDistributedPrePlanStudyFixture(
  adapterId = 'canonical_pre_plan_study_in_memory_fixture_v1',
): InMemoryCanonicalDistributedPrePlanStudyFixture {
  const runs = new Map<string, MutableStudyAggregate>()

  const adapter: CanonicalDistributedPrePlanStudyTransactionAdapter = {
    descriptor: createCanonicalDistributedPrePlanStudyFixtureDescriptor(adapterId),

    async enqueue(rawInput) {
      const input = canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse(rawInput)
      const existing = runs.get(input.runId)
      if (existing) {
        if (
          existing.seed.identity.identityHash !== input.studyIdentityHash
          || existing.controllerIdentityEvidenceHash !== input.controllerIdentityEvidenceHash
        ) {
          throw new ApiError(
            'INTERNAL_SERVICE_AUTH_INVALID',
            'Pre-plan study controller does not own this existing run.',
            403,
          )
        }
        return replayMutation(existing, input, false)
      }
      const seed = canonicalDistributedPrePlanStudySeedSchema.parse(input.seed)
      const aggregate: MutableStudyAggregate = {
        seed,
        controllerIdentityEvidenceHash: input.controllerIdentityEvidenceHash,
        revision: 0,
        state: 'queued',
        pauseRequestedAt: null,
        cancelRequestedAt: null,
        recoveryGeneration: 0,
        workItems: new Map(seed.workItems.map((workItem) => [workItem.workItemId, {
          seed: workItem,
          state: 'queued' as const,
          attemptCount: 0,
          latestCheckpoint: null,
          completedOutputHashes: [],
          cumulativeInternalCostMicros: 0n,
          activeAttemptId: null,
          blockerCode: null,
        }])),
        attempts: new Map(),
        idempotency: new Map(),
        auditChainHeadHash: sha256AuthorityValue({
          domain: 'canonical_distributed_pre_plan_study_audit_genesis_v1',
          runId: seed.runId,
          seedHash: seed.seedHash,
        }),
      }
      runs.set(seed.runId, aggregate)
      return commitMutation(aggregate, 'enqueue', input, null, null, input.requestedAt)
    },

    async claimAndStart(input) {
      const aggregate = requireAggregate(runs, input)
      const replay = replayMutationIfPresent(aggregate, input, true)
      if (replay) return replay
      assertRunCanClaim(aggregate)
      const workItem = selectReadyWorkItem(aggregate, input.workerClass)
      if (!workItem) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'No server-derived study work is ready for this worker class.',
          409,
          { automaticRetryStarted: false },
        )
      }
      if (workItem.attemptCount >= workItem.seed.maximumAttempts) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Study work exhausted its immutable attempt allowance.',
          409,
          { requiredFlow: 'operator_review_or_new_study_approval' },
        )
      }
      const attemptNumber = workItem.attemptCount + 1
      const startedAt = input.acceptedAt
      const attemptDeadlineAt = addMilliseconds(
        startedAt,
        workItem.seed.attemptDeadlineDurationMs,
      )
      const initialLeaseExpiresAt = addMilliseconds(
        startedAt,
        workItem.seed.leaseDurationMs,
      )
      const attemptId = prefixedIdentity('pre_plan_study_attempt', {
        runId: aggregate.seed.runId,
        workItemId: workItem.seed.workItemId,
        attemptNumber,
      })
      const leaseId = prefixedIdentity('pre_plan_study_lease', { attemptId })
      const transientLeaseCredential = deriveFixtureLeaseCredential({
        runId: aggregate.seed.runId,
        workItemId: workItem.seed.workItemId,
        attemptId,
        leaseId,
        attemptNumber,
      })
      const attemptStartWithoutHash = {
        schemaVersion: 'canonical-distributed-pre-plan-study-attempt-start-v1' as const,
        attemptId,
        workItemId: workItem.seed.workItemId,
        attemptNumber,
        leaseId,
        leaseCredentialHashSha256:
          canonicalDistributedPrePlanStudyLeaseCredentialHash(transientLeaseCredential),
        workerClass: input.workerClass,
        workerIdentityEvidenceHash: input.workerIdentityEvidenceHash,
        workerReceiptHash: input.workerReceiptHash,
        capacityAdmissionEvidenceHash: input.capacityAdmissionEvidenceHash,
        workItemHash: workItem.seed.workItemHash,
        inputBindingHash: workItem.seed.inputBindingHash,
        providerRateCardSnapshotDigestSha256:
          workItem.seed.providerRateCardSnapshotDigestSha256,
        infrastructureRateCardSnapshotDigestSha256:
          workItem.seed.infrastructureRateCardSnapshotDigestSha256,
        maximumAuthorizedInternalCostMicros:
          workItem.seed.maximumAuthorizedInternalCostMicrosPerAttempt,
        startedAt,
        initialLeaseExpiresAt,
        attemptDeadlineAt,
        resumeCheckpointHash: workItem.latestCheckpoint?.checkpointHash ?? null,
        approvedPlanSnapshotRequired: false as const,
        approvedCreditReservationRequired: false as const,
      }
      const attemptStart = {
        ...attemptStartWithoutHash,
        attemptStartHash:
          canonicalDistributedPrePlanStudyAttemptStartHash(attemptStartWithoutHash),
      }
      const attempt: MutableAttempt = {
        attemptStart,
        state: 'running',
        heartbeatAt: startedAt,
        heartbeatCount: 0,
        leaseExpiresAt: initialLeaseExpiresAt,
        latestCheckpoint: null,
        terminal: null,
      }
      aggregate.attempts.set(attemptId, attempt)
      workItem.state = 'running'
      workItem.attemptCount = attemptNumber
      workItem.activeAttemptId = attemptId
      workItem.blockerCode = null
      aggregate.state = 'running'
      return commitMutation(
        aggregate,
        'claim_and_start',
        input,
        workItem,
        attempt,
        startedAt,
        transientLeaseCredential,
      )
    },

    async heartbeatAndCheckpoint(input) {
      const aggregate = requireAggregate(runs, input)
      const replay = replayMutationIfPresent(aggregate, input, false)
      if (replay) return replay
      const { workItem, attempt } = requireActiveAttempt(aggregate, input)
      verifyAttemptAuthority(attempt, input)
      assertLiveLease(attempt, input.heartbeatAt)
      const previous = workItem.latestCheckpoint
      if (
        input.checkpoint.checkpointSequence !== (previous?.checkpointSequence ?? 0) + 1
        || input.checkpoint.progressBasisPoints <= (previous?.progressBasisPoints ?? 0)
      ) {
        throw new ApiError(
          'VERSION_CONFLICT',
          'Study checkpoint sequence or progress did not advance monotonically.',
          409,
        )
      }
      const leaseExpiresAt = minTimestamp(
        addMilliseconds(input.heartbeatAt, workItem.seed.leaseDurationMs),
        attempt.attemptStart.attemptDeadlineAt,
      )
      if (Date.parse(leaseExpiresAt) <= Date.parse(input.heartbeatAt)) {
        throw leaseExpired()
      }
      const checkpointWithoutHash = {
        ...input.checkpoint,
        attemptId: attempt.attemptStart.attemptId,
        recordedAt: input.heartbeatAt,
      }
      const checkpoint: CanonicalDistributedPrePlanStudyCheckpoint = {
        ...checkpointWithoutHash,
        checkpointHash:
          canonicalDistributedPrePlanStudyCheckpointHash(checkpointWithoutHash),
      }
      attempt.heartbeatAt = input.heartbeatAt
      attempt.heartbeatCount += 1
      attempt.leaseExpiresAt = leaseExpiresAt
      attempt.latestCheckpoint = checkpoint
      workItem.latestCheckpoint = checkpoint
      return commitMutation(
        aggregate,
        'heartbeat_and_checkpoint',
        input,
        workItem,
        attempt,
        input.heartbeatAt,
      )
    },

    async complete(input) {
      const aggregate = requireAggregate(runs, input)
      const replay = replayMutationIfPresent(aggregate, input, false)
      if (replay) return replay
      const { workItem, attempt } = requireActiveAttempt(aggregate, input)
      verifyAttemptAuthority(attempt, input)
      assertLiveLease(attempt, input.completedAt)
      const costEvidence = verifyTerminalCostEvidence(
        aggregate,
        workItem,
        attempt,
        input.costEvidence,
        true,
        input.completedAt,
      )
      const outputs = input.outputs.map((output) => {
        if (output.outputHash !== canonicalDistributedPrePlanStudyOutputHash(output)) {
          throw invalidTransition('Study completion output hash is invalid.')
        }
        return structuredClone(output)
      })
      if (new Set(outputs.map((output) => output.outputId)).size !== outputs.length) {
        throw invalidTransition('Study completion output identities are duplicated.')
      }
      const terminalWithoutHash = {
        schemaVersion: 'canonical-distributed-pre-plan-study-attempt-terminal-v1' as const,
        terminalKind: 'completion' as const,
        terminalEvidenceHash: input.completionEvidenceHash,
        costEvidence,
        outputs,
        failureCategory: null,
        sanitizedFailureCode: null,
        queueDisposition: 'completed' as const,
        automaticRetryStarted: false as const,
        unknownOutcomeReconciliationRequired: false,
        terminalAt: input.completedAt,
      }
      attempt.terminal = {
        ...terminalWithoutHash,
        terminalHash: canonicalDistributedPrePlanStudyTerminalHash(terminalWithoutHash),
      }
      attempt.state = 'completed'
      attempt.heartbeatAt = input.completedAt
      workItem.state = 'completed'
      workItem.activeAttemptId = null
      workItem.completedOutputHashes = outputs.map((output) => output.outputHash)
      workItem.cumulativeInternalCostMicros += BigInt(costEvidence.totalInternalCostMicros)
      if (aggregate.state === 'cancellation_requested') {
        cancelRemainingWork(aggregate)
        aggregate.state = hasActiveAttempts(aggregate)
          ? 'cancellation_requested'
          : 'cancelled'
      } else if ([...aggregate.workItems.values()].filter((item) => item.seed.required)
        .every((item) => item.state === 'completed')) {
        aggregate.state = 'completed'
        aggregate.pauseRequestedAt = null
      } else if (aggregate.state !== 'paused') {
        aggregate.state = 'running'
      }
      return commitMutation(
        aggregate,
        'complete',
        input,
        workItem,
        attempt,
        input.completedAt,
      )
    },

    async fail(rawInput) {
      const input = canonicalDistributedPrePlanStudyFailureRequestSchema.parse(rawInput)
      const aggregate = requireAggregate(runs, input)
      const replay = replayMutationIfPresent(aggregate, input, false)
      if (replay) return replay
      const { workItem, attempt } = requireActiveAttempt(aggregate, input)
      verifyAttemptAuthority(attempt, input)
      assertLiveLease(attempt, input.failedAt)
      const finalCostRequired = input.failureCategory !== 'provider_unknown_outcome'
      const costEvidence = verifyTerminalCostEvidence(
        aggregate,
        workItem,
        attempt,
        input.costEvidence,
        finalCostRequired,
        input.failedAt,
      )
      const unknownOutcome = input.failureCategory === 'provider_unknown_outcome'
      const cancelled = input.failureCategory === 'cancelled'
      const controllerCancellationRequested =
        aggregate.state === 'cancellation_requested'
      if (
        (cancelled && !controllerCancellationRequested)
        || (controllerCancellationRequested && !cancelled && !unknownOutcome)
      ) {
        throw invalidTransition(
          'Study cancellation terminal does not match controller cancellation authority.',
        )
      }
      const attemptsExhausted = workItem.attemptCount >= workItem.seed.maximumAttempts
      const queueDisposition = unknownOutcome
        ? 'blocked_unknown_outcome' as const
        : cancelled
          ? 'cancelled' as const
          : attemptsExhausted
            ? 'attempts_exhausted' as const
            : 'retry_available' as const
      const terminalWithoutHash = {
        schemaVersion: 'canonical-distributed-pre-plan-study-attempt-terminal-v1' as const,
        terminalKind: 'failure' as const,
        terminalEvidenceHash: input.failureEvidenceHash,
        costEvidence,
        outputs: [],
        failureCategory: input.failureCategory,
        sanitizedFailureCode: input.sanitizedFailureCode,
        queueDisposition,
        automaticRetryStarted: false as const,
        unknownOutcomeReconciliationRequired: unknownOutcome,
        terminalAt: input.failedAt,
      }
      attempt.terminal = {
        ...terminalWithoutHash,
        terminalHash: canonicalDistributedPrePlanStudyTerminalHash(terminalWithoutHash),
      }
      attempt.state = 'failed'
      attempt.heartbeatAt = input.failedAt
      workItem.activeAttemptId = null
      workItem.cumulativeInternalCostMicros += BigInt(costEvidence.totalInternalCostMicros)
      workItem.state = cancelled
        ? 'cancelled'
        : unknownOutcome || attemptsExhausted
          ? 'blocked'
          : 'retry_wait'
      workItem.blockerCode = unknownOutcome
        ? 'PROVIDER_UNKNOWN_OUTCOME_RECONCILIATION_REQUIRED'
        : attemptsExhausted
          ? 'STUDY_ATTEMPTS_EXHAUSTED'
          : null
      aggregate.state = cancelled
        ? hasActiveAttempts(aggregate)
          ? 'cancellation_requested'
          : 'cancelled'
        : unknownOutcome || attemptsExhausted
          ? 'needs_operator_review'
          : aggregate.state === 'cancellation_requested'
            ? 'cancellation_requested'
            : aggregate.state === 'paused'
              ? 'paused'
              : 'running'
      if (aggregate.state !== 'paused') aggregate.pauseRequestedAt = null
      return commitMutation(
        aggregate,
        'fail',
        input,
        workItem,
        attempt,
        input.failedAt,
      )
    },

    async control(rawInput) {
      const input = canonicalDistributedPrePlanStudyControlRequestSchema.parse(rawInput)
      const aggregate = requireAggregate(runs, input)
      verifyControllerAuthority(aggregate, input.controllerIdentityEvidenceHash)
      const replay = replayMutationIfPresent(aggregate, input, false)
      if (replay) return replay
      if (input.expectedRunRevision !== aggregate.revision) {
        throw new ApiError('VERSION_CONFLICT', 'Study run revision changed before control.', 409)
      }
      if (input.action === 'pause') {
        if (!['queued', 'running'].includes(aggregate.state)) {
          throw invalidTransition('Study cannot pause from its current state.')
        }
        aggregate.state = 'paused'
        aggregate.pauseRequestedAt = input.requestedAt
      } else if (input.action === 'resume') {
        if (aggregate.state !== 'paused') {
          throw invalidTransition('Study cannot resume from its current state.')
        }
        aggregate.state = hasActiveAttempts(aggregate) ? 'running' : 'queued'
        aggregate.pauseRequestedAt = null
      } else {
        if (['completed', 'cancelled', 'needs_operator_review'].includes(aggregate.state)) {
          throw invalidTransition('Study cannot cancel from its current state.')
        }
        aggregate.cancelRequestedAt = input.requestedAt
        aggregate.pauseRequestedAt = null
        cancelRemainingWork(aggregate)
        aggregate.state = hasActiveAttempts(aggregate)
          ? 'cancellation_requested'
          : 'cancelled'
      }
      return commitMutation(
        aggregate,
        'control',
        input,
        null,
        null,
        input.requestedAt,
      )
    },

    async recoverExpiredLease(rawInput) {
      const input = canonicalDistributedPrePlanStudyRecoveryRequestSchema.parse(rawInput)
      const aggregate = requireAggregate(runs, input)
      verifyControllerAuthority(aggregate, input.controllerIdentityEvidenceHash)
      const replay = replayRecoveryIfPresent(aggregate, input)
      if (replay) return replay
      const selected = selectExpiredAttempt(aggregate, input.observedAt)
      if (!selected) {
        return recordNoopRecovery(aggregate, input)
      }
      const { workItem, attempt } = selected
      const providerExecution = workItem.seed.executionKind !== 'deterministic_tool'
      const cancellationRequested = aggregate.state === 'cancellation_requested'
      const terminalAt = attempt.leaseExpiresAt
      const costEvidence = createFixtureAttemptCostEvidence({
        aggregate,
        workItem,
        attempt,
        finishedAt: terminalAt,
        evidenceStatus: providerExecution
          ? 'provisional_provider_reconciliation_required'
          : 'final',
      })
      const attemptsExhausted = workItem.attemptCount >= workItem.seed.maximumAttempts
      const queueDisposition = providerExecution
        ? 'blocked_unknown_outcome' as const
        : cancellationRequested
          ? 'cancelled' as const
          : attemptsExhausted
            ? 'attempts_exhausted' as const
            : 'retry_available' as const
      const terminalWithoutHash = {
        schemaVersion: 'canonical-distributed-pre-plan-study-attempt-terminal-v1' as const,
        terminalKind: 'timeout' as const,
        terminalEvidenceHash: sha256AuthorityValue({
          domain: 'canonical_distributed_pre_plan_study_timeout_evidence_v1',
          attemptStartHash: attempt.attemptStart.attemptStartHash,
          immutableLeaseExpiry: attempt.leaseExpiresAt,
          observedAt: input.observedAt,
        }),
        costEvidence,
        outputs: [],
        failureCategory: 'execution_timeout' as const,
        sanitizedFailureCode: 'ATTEMPT_LEASE_EXPIRED' as const,
        queueDisposition,
        automaticRetryStarted: false as const,
        unknownOutcomeReconciliationRequired: providerExecution,
        terminalAt,
      }
      attempt.terminal = {
        ...terminalWithoutHash,
        terminalHash: canonicalDistributedPrePlanStudyTerminalHash(terminalWithoutHash),
      }
      attempt.state = 'timed_out'
      attempt.heartbeatAt = attempt.leaseExpiresAt
      workItem.activeAttemptId = null
      workItem.cumulativeInternalCostMicros += BigInt(costEvidence.totalInternalCostMicros)
      workItem.state = providerExecution
        ? 'blocked'
        : cancellationRequested
          ? 'cancelled'
          : attemptsExhausted
            ? 'blocked'
            : 'retry_wait'
      workItem.blockerCode = providerExecution
        ? 'PROVIDER_UNKNOWN_OUTCOME_RECONCILIATION_REQUIRED'
        : cancellationRequested
          ? null
          : attemptsExhausted
            ? 'STUDY_ATTEMPTS_EXHAUSTED'
            : null
      aggregate.recoveryGeneration += 1
      if (providerExecution) {
        aggregate.state = 'needs_operator_review'
      } else if (cancellationRequested) {
        cancelRemainingWork(aggregate)
        aggregate.state = hasActiveAttempts(aggregate)
          ? 'cancellation_requested'
          : 'cancelled'
      } else if (attemptsExhausted) {
        aggregate.state = 'needs_operator_review'
      } else if (aggregate.state !== 'paused') {
        aggregate.state = 'running'
      }
      if (aggregate.state !== 'paused') aggregate.pauseRequestedAt = null
      return commitRecovery(
        aggregate,
        input,
        workItem,
        attempt,
        terminalAt,
      )
    },
  }

  return {
    adapter,
    inspect(runId) {
      const aggregate = runs.get(runId)
      if (!aggregate) throw notFound()
      const persisted = persistedProjection(aggregate)
      const persistedRepresentation = JSON.stringify(persisted)
      if (persistedRepresentation.includes('rppsl_v1_')) {
        throw new Error('Fixture persisted a plaintext lease credential.')
      }
      return {
        run: buildRunView(aggregate),
        workItems: sortedWorkItems(aggregate).map(buildWorkItemView),
        attempts: [...aggregate.attempts.values()].map(buildAttemptView),
        persistedRepresentation,
        plaintextLeaseCredentialPersisted: false,
        rawMediaPersisted: false,
        signedUrlPersisted: false,
        providerCredentialPersisted: false,
        localPathPersisted: false,
        productionAuthority: false,
      }
    },
  }
}

function replayMutation(
  aggregate: MutableStudyAggregate,
  request: MutationRequest,
  includeTransientCredential: boolean,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse> {
  const replay = replayMutationIfPresent(
    aggregate,
    request,
    includeTransientCredential,
  )
  if (replay) return replay
  throw idempotencyConflict(
    'Pre-plan study run already exists under a different enqueue authority.',
  )
}

function replayMutationIfPresent(
  aggregate: MutableStudyAggregate,
  request: MutationRequest,
  includeTransientCredential: boolean,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse> | null {
  const keyHash = canonicalDistributedPrePlanStudyIdempotencyKeyHash(request.idempotencyKey)
  const stored = aggregate.idempotency.get(keyHash)
  if (!stored) return null
  if (
    stored.requestHash !== request.requestHash
    || stored.response.schemaVersion !== CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RESPONSE_VERSION
    || canonicalDistributedPrePlanStudyRequestHash(
      stored.response.operation,
      request as unknown as Record<string, unknown>,
    ) !== request.requestHash
  ) {
    throw idempotencyConflict('Pre-plan study idempotency key changed request identity.')
  }
  const response = structuredClone(stored.response)
  const transientLeaseCredential = includeTransientCredential
    ? deriveCredentialFromResponse(response)
    : null
  return {
    idempotencyStatus: 'exact_replay',
    response,
    transientLeaseCredential,
  }
}

function replayRecoveryIfPresent(
  aggregate: MutableStudyAggregate,
  request: RecoveryRequest,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyRecoveryResponse> | null {
  const keyHash = canonicalDistributedPrePlanStudyIdempotencyKeyHash(request.idempotencyKey)
  const stored = aggregate.idempotency.get(keyHash)
  if (!stored) return null
  if (
    stored.requestHash !== request.requestHash
    || stored.response.schemaVersion !==
      CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RECOVERY_RESPONSE_VERSION
    || canonicalDistributedPrePlanStudyRequestHash(
      'recover_expired_lease',
      request as unknown as Record<string, unknown>,
    ) !== request.requestHash
  ) {
    throw idempotencyConflict('Pre-plan study recovery key changed request identity.')
  }
  return {
    idempotencyStatus: 'exact_replay',
    response: structuredClone(stored.response),
    transientLeaseCredential: null,
  }
}

function commitMutation(
  aggregate: MutableStudyAggregate,
  operation: MutationOperation,
  request: MutationRequest,
  workItem: MutableWorkItem | null,
  attempt: MutableAttempt | null,
  committedAt: string,
  transientLeaseCredential: string | null = null,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse> {
  const revisionBefore = aggregate.revision
  aggregate.revision += 1
  const idempotencyKeyHash = canonicalDistributedPrePlanStudyIdempotencyKeyHash(
    request.idempotencyKey,
  )
  const transactionId = prefixedIdentity('pre_plan_study_tx', {
    runId: aggregate.seed.runId,
    operation,
    revisionAfter: aggregate.revision,
    requestHash: request.requestHash,
  })
  const auditEventHash = appendAuditEvent({
    aggregate,
    operation,
    transactionId,
    workItemId: workItem?.seed.workItemId ?? null,
    attemptId: attempt?.attemptStart.attemptId ?? null,
  })
  const transactionWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-transaction-v1' as const,
    transactionId,
    operation,
    runId: aggregate.seed.runId,
    studyIdentityHash: aggregate.seed.identity.identityHash,
    revisionBefore,
    revisionAfter: aggregate.revision,
    requestHash: request.requestHash,
    idempotencyKeyHash,
    auditEventHash,
    committedAt,
  }
  const transaction = {
    ...transactionWithoutHash,
    transactionHash:
      canonicalDistributedPrePlanStudyTransactionHash(transactionWithoutHash),
  }
  const responseWithoutHash = {
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RESPONSE_VERSION,
    operation,
    transaction,
    run: buildRunView(aggregate),
    workItem: workItem ? buildWorkItemView(workItem) : null,
    attempt: attempt ? buildAttemptView(attempt) : null,
    boundaries: canonicalDistributedPrePlanStudyPersistenceBoundaries(),
  }
  const response = canonicalDistributedPrePlanStudyMutationResponseSchema.parse({
    ...responseWithoutHash,
    responseHash:
      canonicalDistributedPrePlanStudyMutationResponseHash(responseWithoutHash),
  })
  aggregate.idempotency.set(idempotencyKeyHash, {
    requestHash: request.requestHash,
    response: structuredClone(response),
  })
  return {
    idempotencyStatus: 'inserted',
    response,
    transientLeaseCredential,
  }
}

function commitRecovery(
  aggregate: MutableStudyAggregate,
  request: RecoveryRequest,
  workItem: MutableWorkItem,
  attempt: MutableAttempt,
  committedAt: string,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyRecoveryResponse> {
  const revisionBefore = aggregate.revision
  aggregate.revision += 1
  const idempotencyKeyHash = canonicalDistributedPrePlanStudyIdempotencyKeyHash(
    request.idempotencyKey,
  )
  const transactionId = prefixedIdentity('pre_plan_study_recovery_tx', {
    runId: aggregate.seed.runId,
    revisionAfter: aggregate.revision,
    requestHash: request.requestHash,
  })
  const auditEventHash = appendAuditEvent({
    aggregate,
    operation: 'recover_expired_lease',
    transactionId,
    workItemId: workItem.seed.workItemId,
    attemptId: attempt.attemptStart.attemptId,
  })
  const transactionWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-transaction-v1' as const,
    transactionId,
    operation: 'recover_expired_lease' as const,
    runId: aggregate.seed.runId,
    studyIdentityHash: aggregate.seed.identity.identityHash,
    revisionBefore,
    revisionAfter: aggregate.revision,
    requestHash: request.requestHash,
    idempotencyKeyHash,
    auditEventHash,
    committedAt,
  }
  const transaction = {
    ...transactionWithoutHash,
    transactionHash:
      canonicalDistributedPrePlanStudyTransactionHash(transactionWithoutHash),
  }
  const response = createRecoveryResponse({
    aggregate,
    request,
    idempotencyKeyHash,
    transaction,
    workItem,
    attempt,
    expiredAttemptRecovered: true,
  })
  aggregate.idempotency.set(idempotencyKeyHash, {
    requestHash: request.requestHash,
    response: structuredClone(response),
  })
  return {
    idempotencyStatus: 'inserted',
    response,
    transientLeaseCredential: null,
  }
}

function recordNoopRecovery(
  aggregate: MutableStudyAggregate,
  request: RecoveryRequest,
): CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyRecoveryResponse> {
  const idempotencyKeyHash = canonicalDistributedPrePlanStudyIdempotencyKeyHash(
    request.idempotencyKey,
  )
  const response = createRecoveryResponse({
    aggregate,
    request,
    idempotencyKeyHash,
    transaction: null,
    workItem: null,
    attempt: null,
    expiredAttemptRecovered: false,
  })
  aggregate.idempotency.set(idempotencyKeyHash, {
    requestHash: request.requestHash,
    response: structuredClone(response),
  })
  return {
    idempotencyStatus: 'inserted',
    response,
    transientLeaseCredential: null,
  }
}

function createRecoveryResponse(input: {
  aggregate: MutableStudyAggregate
  request: RecoveryRequest
  idempotencyKeyHash: string
  transaction: CanonicalDistributedPrePlanStudyRecoveryResponse['transaction']
  workItem: MutableWorkItem | null
  attempt: MutableAttempt | null
  expiredAttemptRecovered: boolean
}): CanonicalDistributedPrePlanStudyRecoveryResponse {
  const responseWithoutHash = {
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RECOVERY_RESPONSE_VERSION,
    operation: 'recover_expired_lease' as const,
    runId: input.aggregate.seed.runId,
    studyIdentityHash: input.aggregate.seed.identity.identityHash,
    requestHash: input.request.requestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    observedAt: input.request.observedAt,
    transaction: input.transaction,
    run: buildRunView(input.aggregate),
    workItem: input.workItem ? buildWorkItemView(input.workItem) : null,
    attempt: input.attempt ? buildAttemptView(input.attempt) : null,
    expiredAttemptRecovered: input.expiredAttemptRecovered,
    boundaries: {
      ...canonicalDistributedPrePlanStudyPersistenceBoundaries(),
      expiredAttemptSelectedByTransaction: true as const,
      callerSelectedAttemptOrExpiryAllowed: false as const,
      unknownProviderOutcomeMustReconcileBeforeRetry: true as const,
    },
  }
  return canonicalDistributedPrePlanStudyRecoveryResponseSchema.parse({
    ...responseWithoutHash,
    responseHash:
      canonicalDistributedPrePlanStudyRecoveryResponseHash(responseWithoutHash),
  })
}

function buildRunView(
  aggregate: MutableStudyAggregate,
): CanonicalDistributedPrePlanStudyRunView {
  const workItems = [...aggregate.workItems.values()]
  const completed = workItems.filter((workItem) => workItem.state === 'completed')
  const runWithoutHash = {
    runId: aggregate.seed.runId,
    planId: aggregate.seed.planId,
    planDigestSha256: aggregate.seed.planDigestSha256,
    studyIdentityHash: aggregate.seed.identity.identityHash,
    state: aggregate.state,
    revision: aggregate.revision,
    totalWorkItemCount: workItems.length,
    completedWorkItemCount: completed.length,
    runningWorkItemCount: workItems.filter((workItem) => workItem.state === 'running').length,
    blockedWorkItemCount: workItems.filter((workItem) => workItem.state === 'blocked').length,
    completedWeightBasisPoints: completed.reduce(
      (sum, workItem) => sum + workItem.seed.weightBasisPoints,
      0,
    ),
    cumulativeInternalCostMicros: workItems.reduce(
      (sum, workItem) => sum + workItem.cumulativeInternalCostMicros,
      0n,
    ).toString(),
    maximumAuthorizedInternalCostMicros:
      aggregate.seed.maximumAuthorizedInternalCostMicros,
    pauseRequestedAt: aggregate.pauseRequestedAt,
    cancelRequestedAt: aggregate.cancelRequestedAt,
    recoveryGeneration: aggregate.recoveryGeneration,
    automaticRetryStarted: false as const,
    browserSessionRequiredForCompletion: false as const,
    wholeStudyTimeoutApplied: false as const,
  }
  return canonicalDistributedPrePlanStudyRunViewSchema.parse({
    ...runWithoutHash,
    runHash: canonicalDistributedPrePlanStudyRunViewHash(runWithoutHash),
  })
}

function buildWorkItemView(
  workItem: MutableWorkItem,
): CanonicalDistributedPrePlanStudyWorkItemView {
  return canonicalDistributedPrePlanStudyWorkItemViewSchema.parse({
    workItemId: workItem.seed.workItemId,
    sequence: workItem.seed.sequence,
    stageId: workItem.seed.stageId,
    required: workItem.seed.required,
    workerClass: workItem.seed.workerClass,
    dependencyWorkItemIds: [...workItem.seed.dependencyWorkItemIds],
    state: workItem.state,
    attemptCount: workItem.attemptCount,
    maximumAttempts: workItem.seed.maximumAttempts,
    remainingAttempts: Math.max(0, workItem.seed.maximumAttempts - workItem.attemptCount),
    latestCheckpoint: workItem.latestCheckpoint
      ? structuredClone(workItem.latestCheckpoint)
      : null,
    completedOutputHashes: [...workItem.completedOutputHashes],
    cumulativeInternalCostMicros: workItem.cumulativeInternalCostMicros.toString(),
    activeAttemptId: workItem.activeAttemptId,
    blockerCode: workItem.blockerCode,
    workItemHash: workItem.seed.workItemHash,
  })
}

function buildAttemptView(
  attempt: MutableAttempt,
): CanonicalDistributedPrePlanStudyAttemptView {
  const attemptWithoutHash = {
    attemptStart: structuredClone(attempt.attemptStart),
    state: attempt.state,
    heartbeatAt: attempt.heartbeatAt,
    heartbeatCount: attempt.heartbeatCount,
    leaseExpiresAt: attempt.leaseExpiresAt,
    latestCheckpoint: attempt.latestCheckpoint
      ? structuredClone(attempt.latestCheckpoint)
      : null,
    terminal: attempt.terminal ? structuredClone(attempt.terminal) : null,
  }
  return canonicalDistributedPrePlanStudyAttemptViewSchema.parse({
    ...attemptWithoutHash,
    attemptHash:
      canonicalDistributedPrePlanStudyAttemptViewHash(attemptWithoutHash),
  })
}

function requireAggregate(
  runs: Map<string, MutableStudyAggregate>,
  request: { runId: string; studyIdentityHash: string },
): MutableStudyAggregate {
  const aggregate = runs.get(request.runId)
  if (!aggregate) throw notFound()
  if (aggregate.seed.identity.identityHash !== request.studyIdentityHash) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Pre-plan study identity does not own this run.',
      403,
    )
  }
  return aggregate
}

function requireActiveAttempt(
  aggregate: MutableStudyAggregate,
  request: AttemptMutationRequest,
): { workItem: MutableWorkItem; attempt: MutableAttempt } {
  const attempt = aggregate.attempts.get(request.attemptId)
  if (!attempt || attempt.state !== 'running') throw leaseExpired()
  const workItem = aggregate.workItems.get(attempt.attemptStart.workItemId)
  if (!workItem || workItem.activeAttemptId !== request.attemptId) throw leaseExpired()
  return { workItem, attempt }
}

function verifyControllerAuthority(
  aggregate: MutableStudyAggregate,
  controllerIdentityEvidenceHash: string,
): void {
  if (aggregate.controllerIdentityEvidenceHash !== controllerIdentityEvidenceHash) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Pre-plan study controller identity does not own this authority.',
      403,
    )
  }
}

function verifyAttemptAuthority(
  attempt: MutableAttempt,
  request: AttemptMutationRequest,
): void {
  if (
    attempt.attemptStart.workerIdentityEvidenceHash !== request.workerIdentityEvidenceHash
    || attempt.attemptStart.workerReceiptHash !== request.workerReceiptHash
    || attempt.attemptStart.leaseCredentialHashSha256 !==
      canonicalDistributedPrePlanStudyLeaseCredentialHash(request.leaseCredential)
  ) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Pre-plan study worker or lease authority is invalid.',
      403,
    )
  }
}

function assertLiveLease(attempt: MutableAttempt, timestamp: string): void {
  const value = requireTimestamp(timestamp)
  if (
    value <= requireTimestamp(attempt.heartbeatAt)
    || value >= requireTimestamp(attempt.leaseExpiresAt)
    || value > requireTimestamp(attempt.attemptStart.attemptDeadlineAt)
  ) throw leaseExpired()
}

function assertRunCanClaim(aggregate: MutableStudyAggregate): void {
  if (!['queued', 'running'].includes(aggregate.state)) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Pre-plan study run is not accepting new work claims.',
      409,
      { state: aggregate.state, automaticRetryStarted: false },
    )
  }
}

function selectReadyWorkItem(
  aggregate: MutableStudyAggregate,
  workerClass: CanonicalDistributedPrePlanStudyWorkItemSeed['workerClass'],
): MutableWorkItem | null {
  return sortedWorkItems(aggregate).find((workItem) => (
    ['queued', 'retry_wait'].includes(workItem.state)
    && workItem.seed.workerClass === workerClass
    && workItem.activeAttemptId === null
    && workItem.seed.dependencyWorkItemIds.every(
      (dependencyId) => aggregate.workItems.get(dependencyId)?.state === 'completed',
    )
  )) ?? null
}

function selectExpiredAttempt(
  aggregate: MutableStudyAggregate,
  observedAt: string,
): { workItem: MutableWorkItem; attempt: MutableAttempt } | null {
  const observedAtMs = requireTimestamp(observedAt)
  const candidates = [...aggregate.attempts.values()]
    .filter((attempt) => (
      attempt.state === 'running'
      && requireTimestamp(attempt.leaseExpiresAt) <= observedAtMs
    ))
    .sort((left, right) => (
      requireTimestamp(left.leaseExpiresAt) - requireTimestamp(right.leaseExpiresAt)
      || left.attemptStart.attemptId.localeCompare(right.attemptStart.attemptId)
    ))
  const attempt = candidates[0]
  if (!attempt) return null
  const workItem = aggregate.workItems.get(attempt.attemptStart.workItemId)
  if (!workItem || workItem.activeAttemptId !== attempt.attemptStart.attemptId) {
    throw invalidTransition('Expired study attempt lost its active work-item binding.')
  }
  return { workItem, attempt }
}

function verifyTerminalCostEvidence(
  aggregate: MutableStudyAggregate,
  workItem: MutableWorkItem,
  attempt: MutableAttempt,
  rawEvidence: CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  finalRequired: boolean,
  finishedAt: string,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const evidence = canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema.parse(rawEvidence)
  const expectedStatus = finalRequired
    ? 'final'
    : 'provisional_provider_reconciliation_required'
  const previouslyUsedEventIds = new Set<string>()
  const previouslyUsedCostRecordIds = new Set<string>()
  for (const previousAttempt of aggregate.attempts.values()) {
    for (const value of previousAttempt.terminal?.costEvidence.usageEventIds ?? []) {
      previouslyUsedEventIds.add(value)
    }
    for (const value of previousAttempt.terminal?.costEvidence.internalCostRecordIds ?? []) {
      previouslyUsedCostRecordIds.add(value)
    }
  }
  const aggregateCost = [...aggregate.workItems.values()].reduce(
    (sum, item) => sum + item.cumulativeInternalCostMicros,
    0n,
  )
  if (
    evidence.evidenceStatus !== expectedStatus
    || evidence.attemptId !== attempt.attemptStart.attemptId
    || evidence.attemptStartHash !== attempt.attemptStart.attemptStartHash
    || evidence.startedAt !== attempt.attemptStart.startedAt
    || evidence.finishedAt !== finishedAt
    || evidence.approvedUsageEstimateId !== aggregate.seed.studyUsageApprovalId
    || evidence.internalCostBudgetId !== aggregate.seed.internalCostBudgetId
    || evidence.maximumAuthorizedInternalCostMicros !==
      workItem.seed.maximumAuthorizedInternalCostMicrosPerAttempt
    || evidence.providerRateCardSnapshotDigestSha256 !==
      workItem.seed.providerRateCardSnapshotDigestSha256
    || evidence.infrastructureRateCardSnapshotDigestSha256 !==
      workItem.seed.infrastructureRateCardSnapshotDigestSha256
    || evidence.usageEventIds.some((value) => previouslyUsedEventIds.has(value))
    || evidence.internalCostRecordIds.some((value) => previouslyUsedCostRecordIds.has(value))
    || aggregateCost + BigInt(evidence.totalInternalCostMicros) >
      BigInt(aggregate.seed.maximumAuthorizedInternalCostMicros)
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Pre-plan study terminal cost evidence is stale, duplicated, or outside authority.',
      409,
      { automaticRetryStarted: false },
    )
  }
  return structuredClone(evidence)
}

function createFixtureAttemptCostEvidence(input: {
  aggregate: MutableStudyAggregate
  workItem: MutableWorkItem
  attempt: MutableAttempt
  finishedAt: string
  evidenceStatus: CanonicalDistributedPrePlanStudyAttemptCostEvidence['evidenceStatus']
}): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const attemptId = input.attempt.attemptStart.attemptId
  const payload = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: input.evidenceStatus,
    attemptId,
    attemptStartHash: input.attempt.attemptStart.attemptStartHash,
    startedAt: input.attempt.attemptStart.startedAt,
    finishedAt: input.finishedAt,
    approvedUsageEstimateId: input.aggregate.seed.studyUsageApprovalId,
    internalCostBudgetId: input.aggregate.seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros:
      input.workItem.seed.maximumAuthorizedInternalCostMicrosPerAttempt,
    providerUsageEvidenceDigestSha256: sha256AuthorityValue({
      domain: 'canonical_pre_plan_study_fixture_provider_usage_v1',
      attemptId,
      finishedAt: input.finishedAt,
      providerRequestPerformed: false,
    }),
    providerRateCardSnapshotDigestSha256:
      input.workItem.seed.providerRateCardSnapshotDigestSha256,
    providerCostMicros: '0',
    infrastructureUsageEvidenceDigestSha256: sha256AuthorityValue({
      domain: 'canonical_pre_plan_study_fixture_infrastructure_usage_v1',
      attemptId,
      startedAt: input.attempt.attemptStart.startedAt,
      finishedAt: input.finishedAt,
      liveResourceMeterPerformed: false,
    }),
    infrastructureRateCardSnapshotDigestSha256:
      input.workItem.seed.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '0',
    totalInternalCostMicros: '0',
    usageEventIds: [prefixedIdentity('pre_plan_study_usage', { attemptId })],
    internalCostRecordIds: [prefixedIdentity('pre_plan_study_cost', { attemptId })],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema.parse({
    ...payload,
    evidenceHash:
      canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(payload),
  })
}

function appendAuditEvent(input: {
  aggregate: MutableStudyAggregate
  operation: MutationOperation | 'recover_expired_lease'
  transactionId: string
  workItemId: string | null
  attemptId: string | null
}): string {
  const auditEventHash = sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_audit_event_v1',
    previousAuditEventHash: input.aggregate.auditChainHeadHash,
    runId: input.aggregate.seed.runId,
    studyIdentityHash: input.aggregate.seed.identity.identityHash,
    operation: input.operation,
    transactionId: input.transactionId,
    workItemId: input.workItemId,
    attemptId: input.attemptId,
    revisionAfter: input.aggregate.revision,
  })
  input.aggregate.auditChainHeadHash = auditEventHash
  return auditEventHash
}

function deriveCredentialFromResponse(
  response: CanonicalDistributedPrePlanStudyMutationResponse,
): string {
  const attemptStart = response.attempt?.attemptStart
  if (response.operation !== 'claim_and_start' || !attemptStart) {
    throw invalidTransition('Stored study claim response has no exact attempt authority.')
  }
  return deriveFixtureLeaseCredential({
    runId: response.run.runId,
    workItemId: attemptStart.workItemId,
    attemptId: attemptStart.attemptId,
    leaseId: attemptStart.leaseId,
    attemptNumber: attemptStart.attemptNumber,
  })
}

function deriveFixtureLeaseCredential(input: {
  runId: string
  workItemId: string
  attemptId: string
  leaseId: string
  attemptNumber: number
}): string {
  return `rppsl_v1_${sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_fixture_lease_credential_v1',
    ...input,
  })}`
}

function persistedProjection(aggregate: MutableStudyAggregate): unknown {
  return {
    seed: structuredClone(aggregate.seed),
    controllerIdentityEvidenceHash: aggregate.controllerIdentityEvidenceHash,
    run: buildRunView(aggregate),
    workItems: sortedWorkItems(aggregate).map(buildWorkItemView),
    attempts: [...aggregate.attempts.values()]
      .map(buildAttemptView)
      .sort((left, right) => left.attemptStart.attemptId.localeCompare(
        right.attemptStart.attemptId,
      )),
    idempotency: [...aggregate.idempotency.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([idempotencyKeyHash, stored]) => ({
        idempotencyKeyHash,
        requestHash: stored.requestHash,
        response: structuredClone(stored.response),
      })),
    auditChainHeadHash: aggregate.auditChainHeadHash,
  }
}

function sortedWorkItems(aggregate: MutableStudyAggregate): MutableWorkItem[] {
  return [...aggregate.workItems.values()].sort((left, right) => (
    left.seed.sequence - right.seed.sequence
    || left.seed.workItemId.localeCompare(right.seed.workItemId)
  ))
}

function cancelRemainingWork(aggregate: MutableStudyAggregate): void {
  for (const workItem of aggregate.workItems.values()) {
    if (['queued', 'retry_wait'].includes(workItem.state)) {
      workItem.state = 'cancelled'
      workItem.blockerCode = null
    }
  }
}

function hasActiveAttempts(aggregate: MutableStudyAggregate): boolean {
  return [...aggregate.attempts.values()].some((attempt) => attempt.state === 'running')
}

function prefixedIdentity(prefix: string, payload: unknown): string {
  return `${prefix}-${sha256AuthorityValue(payload).slice(0, 48)}`
}

function addMilliseconds(timestamp: string, milliseconds: number): string {
  return new Date(requireTimestamp(timestamp) + milliseconds).toISOString()
}

function minTimestamp(left: string, right: string): string {
  return new Date(Math.min(requireTimestamp(left), requireTimestamp(right))).toISOString()
}

function requireTimestamp(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) {
    throw new ApiError('VALIDATION_FAILED', 'Pre-plan study timestamp is invalid.', 400)
  }
  return parsed
}

function notFound(): ApiError {
  return new ApiError('JOB_NOT_FOUND', 'Pre-plan study run was not found.', 404)
}

function leaseExpired(): ApiError {
  return new ApiError(
    'WORKER_LEASE_EXPIRED',
    'Pre-plan study worker lease is not active.',
    409,
  )
}

function invalidTransition(message: string): ApiError {
  return new ApiError('VERSION_CONFLICT', message, 409)
}

function idempotencyConflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
