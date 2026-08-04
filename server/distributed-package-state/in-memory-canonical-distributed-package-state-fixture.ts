import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { calculateToolActualCostMicros } from '../tool-cost-metering/cost-math'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import {
  canonicalDistributedAcceptControllerRequestSchema,
  canonicalDistributedAcceptWorkerAndStartRequestSchema,
  canonicalDistributedClaimAndEnqueueRequestSchema,
  canonicalDistributedCompletionRequestSchema,
  canonicalDistributedFailureRequestSchema,
  canonicalDistributedHeartbeatRequestSchema,
  canonicalDistributedPackageFixtureSeedSchema,
  canonicalDistributedPackageMutationResponseSchema,
  canonicalDistributedPackageStateIdempotencyKeyHash,
  canonicalDistributedPackageStateRequestHash,
  canonicalDistributedPackageTimeoutBatchResponseSchema,
  canonicalDistributedPersistenceBoundaries,
  canonicalDistributedTimeoutSweepRequestSchema,
  createCanonicalDistributedPackageStateFixtureDescriptor,
  CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH,
  CANONICAL_DISTRIBUTED_PACKAGE_STATE_RESPONSE_VERSION,
  CANONICAL_DISTRIBUTED_PACKAGE_TIMEOUT_BATCH_VERSION,
  type CanonicalDistributedPackageFixtureSeed,
  type CanonicalDistributedPackageMutationResponse,
  type CanonicalDistributedPackageStateTransactionPort,
  type CanonicalDistributedPackageTimeoutBatchResponse,
  type CanonicalDistributedPortResult,
} from './canonical-distributed-package-state-port'

type MutationOperation = CanonicalDistributedPackageMutationResponse['operation']
type StateOperation = MutationOperation | 'finalize_expired_timeouts'
type AttemptView = CanonicalDistributedPackageMutationResponse['attempt']
type JobView = CanonicalDistributedPackageMutationResponse['job']
type TimeoutRequest = z.infer<typeof canonicalDistributedTimeoutSweepRequestSchema>

interface StoredJob {
  seed: CanonicalDistributedPackageFixtureSeed['jobs'][number]
  state: 'queued' | 'leased' | 'completed' | 'blocked'
  deliveryAttemptCount: number
  activeDispatchIntentId: string | null
}

interface StoredAttempt {
  view: AttemptView
  claimedAt: string
  controllerAcceptedAt: string | null
}

type StoredIdempotencyRecord = {
  operation: MutationOperation
  idempotencyKeyHash: string
  requestHash: string
  response: CanonicalDistributedPackageMutationResponse
} | {
  operation: 'finalize_expired_timeouts'
  idempotencyKeyHash: string
  requestHash: string
  response: CanonicalDistributedPackageTimeoutBatchResponse
}

interface StoredAuditEvent {
  sequence: number
  operation: MutationOperation | 'finalize_expired_timeouts'
  transactionId: string
  dispatchIntentId: string | null
  previousEventHash: string | null
  eventHash: string
}

interface FixtureState {
  seed: CanonicalDistributedPackageFixtureSeed
  revision: number
  jobs: Record<string, StoredJob>
  attempts: Record<string, StoredAttempt>
  idempotency: Record<string, StoredIdempotencyRecord>
  auditEvents: StoredAuditEvent[]
}

type FaultOperation = MutationOperation | 'finalize_expired_timeouts'

export interface CanonicalDistributedPackageStateFixtureInspection {
  revision: number
  packageIdentityHash: string
  jobs: JobView[]
  attempts: AttemptView[]
  idempotencyRecordCount: number
  idempotencyKeyHashes: string[]
  auditEventCount: number
  auditChainHeadHash: string | null
  persistedPlaintextClaimCredentialCount: 0
  persistedPlaintextIdempotencyKeyCount: 0
  customerCommercialAuthorityRecordCount: 0
}

export interface CanonicalDistributedPackageStateFixtureControls {
  inspect(): CanonicalDistributedPackageStateFixtureInspection
  failNextBeforeCommit(operation: FaultOperation): void
}

export interface CanonicalDistributedPackageStateFixture {
  adapter: CanonicalDistributedPackageStateTransactionPort
  controls: CanonicalDistributedPackageStateFixtureControls
}

export function createInMemoryCanonicalDistributedPackageStateFixture(
  rawSeed: CanonicalDistributedPackageFixtureSeed,
): CanonicalDistributedPackageStateFixture {
  const seed = canonicalDistributedPackageFixtureSeedSchema.parse(rawSeed)
  assertSeedIdentity(seed)
  let state = initialState(seed)
  let transactionTail: Promise<void> = Promise.resolve()
  const faults = new Set<FaultOperation>()

  const serialize = async <T>(operation: (draft: FixtureState) => Promise<T> | T): Promise<T> => {
    const run = transactionTail.then(async () => {
      const draft = structuredClone(state)
      const result = await operation(draft)
      state = draft
      return result
    })
    transactionTail = run.then(() => undefined, () => undefined)
    return run
  }

  const maybeFailBeforeCommit = (operation: FaultOperation): void => {
    if (!faults.delete(operation)) return
    throw new ApiError(
      'INTERNAL_ERROR',
      'Injected distributed package-state fixture rollback.',
      500,
      { operation },
      { internal: true },
    )
  }

  const adapter: CanonicalDistributedPackageStateTransactionPort = {
    descriptor: createCanonicalDistributedPackageStateFixtureDescriptor(
      'canonical-in-memory-package-state-contract-fixture-v1',
    ),

    async claimAndEnqueue(rawInput) {
      const request = canonicalDistributedClaimAndEnqueueRequestSchema.parse(rawInput)
      assertRequestHash('claim_and_enqueue', request)
      return runIdempotent({
        operation: 'claim_and_enqueue',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const job = requireJob(draft, request.jobId)
          if (job.state === 'completed') {
            throw conflict('A completed package job cannot allocate another attempt.')
          }
          if (job.activeDispatchIntentId) {
            throw conflict('A package job already owns an active dispatch attempt.')
          }
          if (job.deliveryAttemptCount >= job.seed.maxAttempts) {
            throw new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'The approved package attempt allowance is exhausted.',
              409,
              { requiredGate: 'approved_fallback_or_user_review' },
            )
          }
          const incompleteDependencies = job.seed.dependencyJobIds.filter((jobId) =>
            requireJob(draft, jobId).state !== 'completed')
          if (incompleteDependencies.length > 0) {
            throw new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'The package job still has incomplete dependencies.',
              409,
              { incompleteDependencyCount: incompleteDependencies.length },
            )
          }

          const packageDeliveryAttempt = job.deliveryAttemptCount + 1
          const claimExpiresAt = addMilliseconds(
            request.requestedAt,
            job.seed.leaseDurationMs,
          )
          const attemptDeadlineAt = addMilliseconds(
            request.requestedAt,
            job.seed.attemptDeadlineDurationMs,
          )
          const attemptIdentity = {
            packageIdentityHash: draft.seed.identity.identityHash,
            jobId: job.seed.jobId,
            packageDeliveryAttempt,
            requestHash: request.requestHash,
          }
          const dispatchIntentId = identifier('dispatch', attemptIdentity)
          const queueClaimId = identifier('claim', attemptIdentity)
          const queueClaimHash = sha256AuthorityValue({
            domain: 'canonical_distributed_queue_claim_v1',
            ...attemptIdentity,
            queueClaimId,
            claimExpiresAt,
            attemptDeadlineAt,
          })
          const view: AttemptView = {
            dispatchIntentId,
            jobId: job.seed.jobId,
            packageDeliveryAttempt,
            queueClaimId,
            queueClaimHash,
            outboxEntryHash: emptyHash(),
            state: 'pending_controller_delivery',
            controllerIdentityEvidenceHash: request.controllerIdentityEvidenceHash,
            controllerRequestBindingHash: null,
            controllerReceiptHash: null,
            workerIdentityEvidenceHash: null,
            workerRequestBindingHash: null,
            workerReceiptHash: null,
            heartbeatAt: request.requestedAt,
            heartbeatCount: 0,
            claimExpiresAt,
            attemptDeadlineAt,
            attemptStart: null,
            terminal: null,
          }
          refreshOutboxEntryHash(view)
          draft.attempts[dispatchIntentId] = {
            view,
            claimedAt: request.requestedAt,
            controllerAcceptedAt: null,
          }
          job.state = 'leased'
          job.deliveryAttemptCount = packageDeliveryAttempt
          job.activeDispatchIntentId = dispatchIntentId
          return createMutationResponse({
            draft,
            operation: 'claim_and_enqueue',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.requestedAt,
            job,
            attempt: draft.attempts[dispatchIntentId]!,
          })
        },
      })
    },

    async acceptController(rawInput) {
      const request = canonicalDistributedAcceptControllerRequestSchema.parse(rawInput)
      assertRequestHash('accept_controller', request)
      return runIdempotent({
        operation: 'accept_controller',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const attempt = requireAttempt(draft, request.dispatchIntentId)
          const job = requireActiveAttemptJob(draft, attempt)
          if (attempt.view.state !== 'pending_controller_delivery') {
            throw conflict('Controller acceptance requires the pending exact outbox attempt.')
          }
          if (
            request.controllerIdentityEvidenceHash !==
              attempt.view.controllerIdentityEvidenceHash ||
            Date.parse(request.acceptedAt) < Date.parse(attempt.claimedAt) ||
            Date.parse(request.acceptedAt) >= Date.parse(attempt.view.claimExpiresAt)
          ) {
            throw conflict('Controller acceptance does not match the active package attempt.')
          }
          attempt.view.state = 'controller_identity_accepted'
          attempt.view.controllerRequestBindingHash = request.controllerRequestBindingHash
          attempt.view.controllerReceiptHash = request.controllerReceiptHash
          attempt.controllerAcceptedAt = request.acceptedAt
          refreshOutboxEntryHash(attempt.view)
          return createMutationResponse({
            draft,
            operation: 'accept_controller',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.acceptedAt,
            job,
            attempt,
          })
        },
      })
    },

    async acceptWorkerAndStart(rawInput) {
      const request = canonicalDistributedAcceptWorkerAndStartRequestSchema.parse(rawInput)
      assertRequestHash('accept_worker_and_start', request)
      return runIdempotent({
        operation: 'accept_worker_and_start',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const attempt = requireAttempt(draft, request.dispatchIntentId)
          const job = requireActiveAttemptJob(draft, attempt)
          if (
            attempt.view.state !== 'controller_identity_accepted' ||
            !attempt.view.controllerReceiptHash ||
            request.controllerReceiptHash !== attempt.view.controllerReceiptHash ||
            !attempt.controllerAcceptedAt ||
            Date.parse(request.acceptedAt) < Date.parse(attempt.controllerAcceptedAt) ||
            Date.parse(request.acceptedAt) >= Date.parse(attempt.view.claimExpiresAt)
          ) {
            throw conflict('Worker start requires the exact accepted controller attempt.')
          }
          const startPayload = {
            schemaVersion: 'canonical-distributed-attempt-start-v1' as const,
            workerIdentityEvidenceHash: request.workerIdentityEvidenceHash,
            workerReceiptHash: request.workerReceiptHash,
            rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
            meteringProfile: job.seed.meteringProfile,
            startedAt: request.acceptedAt,
            customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
          }
          attempt.view.workerIdentityEvidenceHash = request.workerIdentityEvidenceHash
          attempt.view.workerRequestBindingHash = request.workerRequestBindingHash
          attempt.view.workerReceiptHash = request.workerReceiptHash
          attempt.view.attemptStart = {
            ...startPayload,
            evidenceHash: sha256AuthorityValue({
              domain: 'canonical_distributed_attempt_start_v1',
              packageIdentityHash: draft.seed.identity.identityHash,
              dispatchIntentId: attempt.view.dispatchIntentId,
              ...startPayload,
            }),
          }
          attempt.view.state = 'worker_execution_started'
          refreshOutboxEntryHash(attempt.view)
          return createMutationResponse({
            draft,
            operation: 'accept_worker_and_start',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.acceptedAt,
            job,
            attempt,
          })
        },
      })
    },

    async heartbeatWorker(rawInput) {
      const request = canonicalDistributedHeartbeatRequestSchema.parse(rawInput)
      assertRequestHash('heartbeat_worker', request)
      return runIdempotent({
        operation: 'heartbeat_worker',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const attempt = requireAttempt(draft, request.dispatchIntentId)
          const job = requireActiveAttemptJob(draft, attempt)
          assertExactWorker(attempt, request)
          if (
            attempt.view.state !== 'worker_execution_started' ||
            Date.parse(request.heartbeatAt) <= Date.parse(attempt.view.heartbeatAt) ||
            Date.parse(request.heartbeatAt) >= Date.parse(attempt.view.claimExpiresAt) ||
            Date.parse(request.heartbeatAt) >= Date.parse(attempt.view.attemptDeadlineAt)
          ) {
            throw new ApiError(
              'WORKER_LEASE_EXPIRED',
              'Worker heartbeat is outside the exact active lease window.',
              409,
            )
          }
          const proposedExpiry = Math.min(
            Date.parse(attempt.view.attemptDeadlineAt),
            Date.parse(request.heartbeatAt) + job.seed.leaseDurationMs,
          )
          if (proposedExpiry <= Date.parse(request.heartbeatAt)) {
            throw new ApiError('WORKER_LEASE_EXPIRED', 'Worker attempt deadline is exhausted.', 409)
          }
          attempt.view.heartbeatAt = request.heartbeatAt
          attempt.view.heartbeatCount += 1
          attempt.view.claimExpiresAt = new Date(proposedExpiry).toISOString()
          refreshOutboxEntryHash(attempt.view)
          return createMutationResponse({
            draft,
            operation: 'heartbeat_worker',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.heartbeatAt,
            job,
            attempt,
          })
        },
      })
    },

    async reconcileCompletion(rawInput) {
      const request = canonicalDistributedCompletionRequestSchema.parse(rawInput)
      assertRequestHash('reconcile_completion', request)
      return runIdempotent({
        operation: 'reconcile_completion',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const attempt = requireAttempt(draft, request.dispatchIntentId)
          const job = requireActiveAttemptJob(draft, attempt)
          assertExactWorker(attempt, request)
          assertActiveTerminalWindow(attempt, request.completedAt)
          const terminal = createTerminal({
            attempt,
            terminalKind: 'completion',
            terminalEvidenceHash: request.completionEvidenceHash,
            linkedCanonicalOutcomeHash: request.linkedCanonicalOutcomeHash,
            outputByteLength: request.outputByteLength,
            failureCategory: null,
            terminalAt: request.completedAt,
            queueDisposition: 'completed',
          })
          attempt.view.terminal = terminal
          attempt.view.state = 'worker_completion_reconciled'
          job.state = 'completed'
          job.activeDispatchIntentId = null
          refreshOutboxEntryHash(attempt.view)
          return createMutationResponse({
            draft,
            operation: 'reconcile_completion',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.completedAt,
            job,
            attempt,
          })
        },
      })
    },

    async reconcileFailure(rawInput) {
      const request = canonicalDistributedFailureRequestSchema.parse(rawInput)
      assertRequestHash('reconcile_failure', request)
      return runIdempotent({
        operation: 'reconcile_failure',
        request,
        serialize,
        maybeFailBeforeCommit,
        mutate: (draft, idempotencyKeyHash) => {
          requirePackage(draft, request.packageRecordId)
          const attempt = requireAttempt(draft, request.dispatchIntentId)
          const job = requireActiveAttemptJob(draft, attempt)
          assertExactWorker(attempt, request)
          assertActiveTerminalWindow(attempt, request.failedAt)
          const queueDisposition = job.deliveryAttemptCount < job.seed.maxAttempts
            ? 'retry_available' as const
            : 'attempts_exhausted' as const
          const terminal = createTerminal({
            attempt,
            terminalKind: 'failure',
            terminalEvidenceHash: request.failureEvidenceHash,
            linkedCanonicalOutcomeHash: null,
            outputByteLength: null,
            failureCategory: request.failureCategory,
            terminalAt: request.failedAt,
            queueDisposition,
          })
          attempt.view.terminal = terminal
          attempt.view.state = 'worker_failure_reconciled'
          job.state = queueDisposition === 'retry_available' ? 'queued' : 'blocked'
          job.activeDispatchIntentId = null
          refreshOutboxEntryHash(attempt.view)
          return createMutationResponse({
            draft,
            operation: 'reconcile_failure',
            requestHash: request.requestHash,
            idempotencyKeyHash,
            committedAt: request.failedAt,
            job,
            attempt,
          })
        },
      })
    },

    async finalizeExpiredTimeouts(rawInput) {
      const request = canonicalDistributedTimeoutSweepRequestSchema.parse(rawInput)
      assertRequestHash('finalize_expired_timeouts', request)
      return serialize((draft) => {
        requirePackage(draft, request.packageRecordId)
        const idempotencyKeyHash = canonicalDistributedPackageStateIdempotencyKeyHash(
          request.idempotencyKey,
        )
        const storageKey = `finalize_expired_timeouts:${idempotencyKeyHash}`
        const existing = draft.idempotency[storageKey]
        if (existing) {
          if (
            existing.operation !== 'finalize_expired_timeouts' ||
            existing.requestHash !== request.requestHash
          ) {
            throw conflict('Distributed timeout idempotency key changed request identity.')
          }
          return {
            idempotencyStatus: 'exact_replay' as const,
            response: structuredClone(existing.response),
          }
        }
        const commitResponse = (
          response: CanonicalDistributedPackageTimeoutBatchResponse,
        ): CanonicalDistributedPortResult<CanonicalDistributedPackageTimeoutBatchResponse> => {
          draft.idempotency[storageKey] = {
            operation: 'finalize_expired_timeouts',
            idempotencyKeyHash,
            requestHash: request.requestHash,
            response: structuredClone(response),
          }
          maybeFailBeforeCommit('finalize_expired_timeouts')
          return { idempotencyStatus: 'inserted', response }
        }
        const observedAtMs = Date.parse(request.observedAt)
        const candidates = Object.values(draft.attempts)
          .filter((attempt) =>
            attempt.view.state === 'worker_execution_started' &&
            Date.parse(attempt.view.claimExpiresAt) <= observedAtMs)
          .sort((left, right) =>
            Date.parse(left.view.claimExpiresAt) - Date.parse(right.view.claimExpiresAt) ||
            left.view.dispatchIntentId.localeCompare(right.view.dispatchIntentId))
        const selected = candidates.slice(
          0,
          CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH,
        )
        if (selected.length === 0) {
          return commitResponse(createTimeoutBatchResponse({
            draft,
            request,
            idempotencyKeyHash,
            expiredCandidateCount: candidates.length,
            outcomes: [],
            transaction: null,
          }))
        }
        const revisionBefore = draft.revision
        const outcomes: CanonicalDistributedPackageTimeoutBatchResponse['outcomes'] = []
        let auditChainHeadHash = draft.auditEvents.at(-1)?.eventHash ?? emptyHash()
        for (const attempt of selected) {
          if (
            attempt.view.controllerIdentityEvidenceHash !==
              request.controllerIdentityEvidenceHash
          ) {
            throw new ApiError(
              'INTERNAL_SERVICE_AUTH_INVALID',
              'Timeout sweep controller identity does not own the selected package attempt.',
              403,
            )
          }
          const job = requireActiveAttemptJob(draft, attempt)
          const queueDisposition = job.deliveryAttemptCount < job.seed.maxAttempts
            ? 'retry_available' as const
            : 'attempts_exhausted' as const
          const terminal = createTerminal({
            attempt,
            terminalKind: 'timeout',
            terminalEvidenceHash: sha256AuthorityValue({
              domain: 'canonical_distributed_timeout_evidence_v1',
              packageIdentityHash: draft.seed.identity.identityHash,
              dispatchIntentId: attempt.view.dispatchIntentId,
              queueClaimHash: attempt.view.queueClaimHash,
              claimExpiresAt: attempt.view.claimExpiresAt,
              heartbeatAt: attempt.view.heartbeatAt,
              heartbeatCount: attempt.view.heartbeatCount,
            }),
            linkedCanonicalOutcomeHash: null,
            outputByteLength: null,
            failureCategory: null,
            terminalAt: attempt.view.claimExpiresAt,
            queueDisposition,
          })
          attempt.view.terminal = terminal
          attempt.view.state = 'worker_timeout_reconciled'
          job.state = queueDisposition === 'retry_available' ? 'queued' : 'blocked'
          job.activeDispatchIntentId = null
          refreshOutboxEntryHash(attempt.view)
          const timeoutAudit = appendAuditEvent({
            draft,
            operation: 'finalize_expired_timeouts',
            transactionId: identifier('timeouttx', {
              packageIdentityHash: draft.seed.identity.identityHash,
              dispatchIntentId: attempt.view.dispatchIntentId,
              terminalHash: terminal.terminalHash,
            }),
            dispatchIntentId: attempt.view.dispatchIntentId,
          })
          auditChainHeadHash = timeoutAudit.eventHash
          outcomes.push({
            dispatchIntentId: attempt.view.dispatchIntentId,
            jobId: attempt.view.jobId,
            packageDeliveryAttempt: attempt.view.packageDeliveryAttempt,
            terminalHash: terminal.terminalHash,
            terminalCostEvidenceHash: terminal.terminalCost.evidenceHash,
            queueDisposition,
            automaticRetryStarted: false,
          })
        }
        draft.revision += 1
        const transactionPayload = {
          transactionId: identifier('timeoutbatchtx', {
            packageIdentityHash: draft.seed.identity.identityHash,
            revisionBefore,
            observedAt: request.observedAt,
            outcomeHashes: outcomes.map((outcome) => outcome.terminalHash),
          }),
          revisionBefore,
          revisionAfter: draft.revision,
          controllerIdentityEvidenceHash: request.controllerIdentityEvidenceHash,
          auditChainHeadHash,
          requestHash: request.requestHash,
          idempotencyKeyHash,
          committedAt: request.observedAt,
        }
        const transaction = {
          ...transactionPayload,
          transactionHash: sha256AuthorityValue(transactionPayload),
        }
        const response = createTimeoutBatchResponse({
          draft,
          request,
          idempotencyKeyHash,
          expiredCandidateCount: candidates.length,
          outcomes,
          transaction,
        })
        return commitResponse(response)
      })
    },
  }

  return {
    adapter,
    controls: {
      inspect() {
        return inspectState(state)
      },
      failNextBeforeCommit(operation) {
        faults.add(operation)
      },
    },
  }
}

async function runIdempotent<TRequest extends {
  idempotencyKey: string
  requestHash: string
}>(input: {
  operation: MutationOperation
  request: TRequest
  serialize: <T>(operation: (draft: FixtureState) => Promise<T> | T) => Promise<T>
  maybeFailBeforeCommit: (operation: FaultOperation) => void
  mutate: (
    draft: FixtureState,
    idempotencyKeyHash: string,
  ) => CanonicalDistributedPackageMutationResponse
}): Promise<CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>> {
  return input.serialize((draft) => {
    const idempotencyKeyHash = canonicalDistributedPackageStateIdempotencyKeyHash(
      input.request.idempotencyKey,
    )
    const storageKey = `${input.operation}:${idempotencyKeyHash}`
    const existing = draft.idempotency[storageKey]
    if (existing) {
      if (
        existing.operation === 'finalize_expired_timeouts' ||
        existing.requestHash !== input.request.requestHash
      ) {
        throw conflict('Distributed package-state idempotency key changed request identity.')
      }
      return {
        idempotencyStatus: 'exact_replay' as const,
        response: structuredClone(existing.response),
      }
    }
    const response = input.mutate(draft, idempotencyKeyHash)
    draft.idempotency[storageKey] = {
      operation: input.operation,
      idempotencyKeyHash,
      requestHash: input.request.requestHash,
      response: structuredClone(response),
    }
    input.maybeFailBeforeCommit(input.operation)
    return { idempotencyStatus: 'inserted' as const, response }
  })
}

function createMutationResponse(input: {
  draft: FixtureState
  operation: MutationOperation
  requestHash: string
  idempotencyKeyHash: string
  committedAt: string
  job: StoredJob
  attempt: StoredAttempt
}): CanonicalDistributedPackageMutationResponse {
  const revisionBefore = input.draft.revision
  input.draft.revision += 1
  const transactionId = identifier('packagetx', {
    packageIdentityHash: input.draft.seed.identity.identityHash,
    operation: input.operation,
    revisionAfter: input.draft.revision,
    requestHash: input.requestHash,
  })
  const audit = appendAuditEvent({
    draft: input.draft,
    operation: input.operation,
    transactionId,
    dispatchIntentId: input.attempt.view.dispatchIntentId,
  })
  const transactionPayload = {
    schemaVersion: 'canonical-distributed-package-state-transaction-v1' as const,
    transactionId,
    operation: input.operation,
    packageIdentityHash: input.draft.seed.identity.identityHash,
    revisionBefore,
    revisionAfter: input.draft.revision,
    requestHash: input.requestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    auditEventHash: audit.eventHash,
    committedAt: input.committedAt,
  }
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_PACKAGE_STATE_RESPONSE_VERSION,
    operation: input.operation,
    transaction: {
      ...transactionPayload,
      transactionHash: sha256AuthorityValue(transactionPayload),
    },
    job: jobView(input.job),
    attempt: structuredClone(input.attempt.view),
    boundaries: canonicalDistributedPersistenceBoundaries(),
  }
  return canonicalDistributedPackageMutationResponseSchema.parse({
    ...payload,
    responseHash: sha256AuthorityValue(payload),
  })
}

function createTimeoutBatchResponse(input: {
  draft: FixtureState
  request: TimeoutRequest
  idempotencyKeyHash: string
  expiredCandidateCount: number
  outcomes: CanonicalDistributedPackageTimeoutBatchResponse['outcomes']
  transaction: CanonicalDistributedPackageTimeoutBatchResponse['transaction']
}): CanonicalDistributedPackageTimeoutBatchResponse {
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_PACKAGE_TIMEOUT_BATCH_VERSION,
    operation: 'finalize_expired_timeouts' as const,
    packageIdentityHash: input.draft.seed.identity.identityHash,
    requestHash: input.request.requestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    observedAt: input.request.observedAt,
    expiredCandidateCount: input.expiredCandidateCount,
    selectedCandidateCount: input.outcomes.length,
    reconciledCount: input.outcomes.length,
    outcomes: input.outcomes,
    transaction: input.transaction,
    boundaries: {
      ...canonicalDistributedPersistenceBoundaries(),
      expiredAttemptsSelectedByTransaction: true as const,
      callerSelectedJobDispatchAttemptOrLimitAllowed: false as const,
      terminalCostBoundedAtImmutableLeaseExpiry: true as const,
    },
  }
  return canonicalDistributedPackageTimeoutBatchResponseSchema.parse({
    ...payload,
    responseHash: sha256AuthorityValue(payload),
  })
}

function createTerminal(input: {
  attempt: StoredAttempt
  terminalKind: 'completion' | 'failure' | 'timeout'
  terminalEvidenceHash: string
  linkedCanonicalOutcomeHash: string | null
  outputByteLength: number | null
  failureCategory:
    | 'provider_error'
    | 'provider_variance_absorbed'
    | 'reeditpro_error_absorbed'
    | 'user_requested_retry'
    | 'validation_error'
    | 'cancelled'
    | 'unknown'
    | null
  terminalAt: string
  queueDisposition: 'completed' | 'retry_available' | 'attempts_exhausted'
}): NonNullable<AttemptView['terminal']> {
  if (!input.attempt.view.attemptStart || input.attempt.view.terminal) {
    throw conflict('Distributed terminal reconciliation requires one unterminated attempt start.')
  }
  const start = input.attempt.view.attemptStart
  const wallTimeMilliseconds = Date.parse(input.terminalAt) - Date.parse(start.startedAt)
  if (
    !Number.isSafeInteger(wallTimeMilliseconds) ||
    wallTimeMilliseconds <= 0 ||
    wallTimeMilliseconds > 604_800_000
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Distributed attempt cost duration is outside the approved worker window.',
      409,
    )
  }
  const calculated = calculateToolActualCostMicros({
    sourceKind: 'infrastructure_runtime',
    runtime: {
      wallTimeMilliseconds,
      renderSeconds: 0,
      vcpuCount: start.meteringProfile.vcpuCount,
      memoryGib: start.meteringProfile.memoryGib,
      gpuCount: start.meteringProfile.gpuCount,
      tempStorageGibHours: 0,
      outputStorageGibHours: 0,
      networkEgressMib: 0,
      computeLevel: 'standard',
    },
  })
  if (
    !calculated.ok ||
    !Number.isSafeInteger(calculated.data.actualInternalCostMicros) ||
    !Number.isSafeInteger(calculated.data.billableMilliseconds) ||
    !calculated.data.billableMilliseconds
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Distributed attempt cost calculation did not produce bounded integer evidence.',
      409,
    )
  }
  const costPayload = {
    schemaVersion: 'canonical-distributed-attempt-terminal-cost-v1' as const,
    attemptStartEvidenceHash: start.evidenceHash,
    rateCardVersion: start.rateCardVersion,
    billableMilliseconds: calculated.data.billableMilliseconds,
    actualInternalCostMicros: calculated.data.actualInternalCostMicros,
    breakdownHash: sha256AuthorityValue(calculated.data.breakdownMicros),
    outcome: input.terminalKind === 'completion'
      ? 'completed' as const
      : input.terminalKind === 'timeout'
        ? 'timeout' as const
        : 'failed' as const,
    finishedAt: input.terminalAt,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    invoiceReconciled: false as const,
  }
  const terminalCost = {
    ...costPayload,
    evidenceHash: sha256AuthorityValue({
      domain: 'canonical_distributed_attempt_terminal_cost_v1',
      dispatchIntentId: input.attempt.view.dispatchIntentId,
      linkedCanonicalOutcomeHash: input.linkedCanonicalOutcomeHash,
      outputByteLength: input.outputByteLength,
      ...costPayload,
    }),
  }
  const terminalPayload = {
    schemaVersion: 'canonical-distributed-attempt-terminal-v1' as const,
    terminalKind: input.terminalKind,
    terminalEvidenceHash: input.terminalEvidenceHash,
    terminalCost,
    queueDisposition: input.queueDisposition,
    retryDisposition: input.queueDisposition === 'completed'
      ? 'not_applicable' as const
      : input.queueDisposition === 'retry_available'
        ? 'retry_same_approved_operation' as const
        : 'fallback_or_user_review_required' as const,
    automaticRetryStarted: false as const,
    linkedCanonicalOutcomeHash: input.linkedCanonicalOutcomeHash,
    outputByteLength: input.outputByteLength,
    failureCategory: input.failureCategory,
    terminalAt: input.terminalAt,
  }
  return {
    ...terminalPayload,
    terminalHash: sha256AuthorityValue({
      domain: 'canonical_distributed_attempt_terminal_v1',
      dispatchIntentId: input.attempt.view.dispatchIntentId,
      ...terminalPayload,
    }),
  }
}

function initialState(seed: CanonicalDistributedPackageFixtureSeed): FixtureState {
  return {
    seed: structuredClone(seed),
    revision: 0,
    jobs: Object.fromEntries(seed.jobs.map((job) => [job.jobId, {
      seed: structuredClone(job),
      state: 'queued' as const,
      deliveryAttemptCount: 0,
      activeDispatchIntentId: null,
    }])),
    attempts: {},
    idempotency: {},
    auditEvents: [],
  }
}

function inspectState(state: FixtureState): CanonicalDistributedPackageStateFixtureInspection {
  return {
    revision: state.revision,
    packageIdentityHash: state.seed.identity.identityHash,
    jobs: Object.values(state.jobs).map(jobView).sort((left, right) =>
      left.jobId.localeCompare(right.jobId)),
    attempts: Object.values(state.attempts).map((attempt) =>
      structuredClone(attempt.view)).sort((left, right) =>
      left.dispatchIntentId.localeCompare(right.dispatchIntentId)),
    idempotencyRecordCount: Object.keys(state.idempotency).length,
    idempotencyKeyHashes: Object.values(state.idempotency).map((record) =>
      record.idempotencyKeyHash).sort(),
    auditEventCount: state.auditEvents.length,
    auditChainHeadHash: state.auditEvents.at(-1)?.eventHash ?? null,
    persistedPlaintextClaimCredentialCount: 0,
    persistedPlaintextIdempotencyKeyCount: 0,
    customerCommercialAuthorityRecordCount: 0,
  }
}

function assertSeedIdentity(seed: CanonicalDistributedPackageFixtureSeed): void {
  const { identityHash, ...payload } = seed.identity
  if (identityHash !== sha256AuthorityValue({
    domain: 'canonical_distributed_package_identity_v1',
    ...payload,
  })) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Distributed package fixture identity checksum is invalid.',
      400,
    )
  }
}

function assertRequestHash(
  operation: StateOperation,
  request: { idempotencyKey: string; requestHash: string } & Record<string, unknown>,
): void {
  const { idempotencyKey: _idempotencyKey, requestHash, ...payload } = request
  void _idempotencyKey
  const expected = canonicalDistributedPackageStateRequestHash({
    operation,
    request: payload,
  })
  if (requestHash !== expected) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_MISMATCH',
      'Distributed package-state request hash is invalid.',
      409,
    )
  }
}

function requirePackage(state: FixtureState, packageRecordId: string): void {
  if (packageRecordId !== state.seed.identity.packageRecordId) {
    throw new ApiError('JOB_NOT_FOUND', 'Distributed package record was not found.', 404)
  }
}

function requireJob(state: FixtureState, jobId: string): StoredJob {
  const job = state.jobs[jobId]
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Distributed package job was not found.', 404)
  return job
}

function requireAttempt(state: FixtureState, dispatchIntentId: string): StoredAttempt {
  const attempt = state.attempts[dispatchIntentId]
  if (!attempt) {
    throw new ApiError('JOB_NOT_FOUND', 'Distributed package attempt was not found.', 404)
  }
  return attempt
}

function requireActiveAttemptJob(state: FixtureState, attempt: StoredAttempt): StoredJob {
  const job = requireJob(state, attempt.view.jobId)
  if (
    job.state !== 'leased' ||
    job.activeDispatchIntentId !== attempt.view.dispatchIntentId ||
    job.deliveryAttemptCount !== attempt.view.packageDeliveryAttempt
  ) {
    throw conflict('Distributed package attempt no longer owns the exact leased job.')
  }
  return job
}

function assertExactWorker(
  attempt: StoredAttempt,
  request: { workerIdentityEvidenceHash: string; workerReceiptHash: string },
): void {
  if (
    request.workerIdentityEvidenceHash !== attempt.view.workerIdentityEvidenceHash ||
    request.workerReceiptHash !== attempt.view.workerReceiptHash
  ) throw conflict('Distributed worker identity does not match the exact accepted attempt.')
}

function assertActiveTerminalWindow(attempt: StoredAttempt, terminalAt: string): void {
  if (
    attempt.view.state !== 'worker_execution_started' ||
    !attempt.view.attemptStart ||
    Date.parse(terminalAt) <= Date.parse(attempt.view.attemptStart.startedAt) ||
    Date.parse(terminalAt) >= Date.parse(attempt.view.claimExpiresAt) ||
    Date.parse(terminalAt) > Date.parse(attempt.view.attemptDeadlineAt)
  ) {
    throw new ApiError(
      'WORKER_LEASE_EXPIRED',
      'Distributed terminal callback is outside the exact active worker window.',
      409,
    )
  }
}

function jobView(job: StoredJob): JobView {
  const remainingAttempts = Math.max(0, job.seed.maxAttempts - job.deliveryAttemptCount)
  return {
    jobId: job.seed.jobId,
    state: job.state,
    deliveryAttemptCount: job.deliveryAttemptCount,
    maxAttempts: job.seed.maxAttempts,
    remainingAttempts,
    attemptsExhausted: job.state !== 'completed' && remainingAttempts === 0,
    automaticRetryStarted: false,
  }
}

function refreshOutboxEntryHash(view: AttemptView): void {
  const { outboxEntryHash: _outboxEntryHash, ...payload } = view
  void _outboxEntryHash
  view.outboxEntryHash = sha256AuthorityValue({
    domain: 'canonical_distributed_outbox_entry_v1',
    ...payload,
  })
}

function appendAuditEvent(input: {
  draft: FixtureState
  operation: StoredAuditEvent['operation']
  transactionId: string
  dispatchIntentId: string | null
}): StoredAuditEvent {
  const payload = {
    sequence: input.draft.auditEvents.length + 1,
    operation: input.operation,
    transactionId: input.transactionId,
    dispatchIntentId: input.dispatchIntentId,
    previousEventHash: input.draft.auditEvents.at(-1)?.eventHash ?? null,
  }
  const event = { ...payload, eventHash: sha256AuthorityValue(payload) }
  input.draft.auditEvents.push(event)
  return event
}

function addMilliseconds(timestampValue: string, durationMs: number): string {
  const result = Date.parse(timestampValue) + durationMs
  if (!Number.isFinite(result)) {
    throw new ApiError('VALIDATION_FAILED', 'Distributed package timestamp overflowed.', 400)
  }
  return new Date(result).toISOString()
}

function identifier(prefix: string, value: unknown): string {
  return `${prefix}_${sha256AuthorityValue(value).slice(0, 40)}`
}

function emptyHash(): string {
  return '0'.repeat(64)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
