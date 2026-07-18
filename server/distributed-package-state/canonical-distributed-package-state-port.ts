import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'

export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION =
  'canonical-distributed-package-state-port-v1' as const
export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_RESPONSE_VERSION =
  'canonical-distributed-package-state-response-v1' as const
export const CANONICAL_DISTRIBUTED_PACKAGE_TIMEOUT_BATCH_VERSION =
  'canonical-distributed-package-timeout-batch-v1' as const
export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH = 32

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeCount = z.number().int().nonnegative().max(100_000)
const positiveSafeCount = z.number().int().positive().max(100_000)
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const idempotencyKey = z.string().trim().min(16).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))

export const canonicalDistributedPackageIdentitySchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  packageRecordId: identity,
  approvedPlanSnapshotId: identity,
  approvedCreditReservationId: identity,
  packageHash: sha256,
  snapshotHash: sha256,
  queueDefinitionHash: sha256,
  handoffManifestHash: sha256,
  identityHash: sha256,
}).strict()

const deepFilterNetMeteringProfileSchema = z.object({
  toolId: z.literal('deepfilternet'),
  operationId: z.literal('tool.deepfilternet.enhance_voice.v1'),
  workloadProfileId: z.literal(
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.deepFilterNetVoiceCleanup,
  ),
  vcpuCount: z.literal(4),
  memoryGib: z.literal(4),
  gpuCount: z.literal(0),
}).strict()

const remotionMeteringProfileSchema = z.object({
  toolId: z.literal('remotion'),
  operationId: z.literal('tool.remotion.render_approved_composition.v1'),
  workloadProfileId: z.literal(
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
  ),
  vcpuCount: z.literal(2),
  memoryGib: z.literal(4),
  gpuCount: z.literal(0),
}).strict()

const ffmpegMeteringProfileSchema = z.object({
  toolId: z.literal('ffmpeg'),
  operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
  workloadProfileId: z.literal(
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
  ),
  vcpuCount: z.literal(2),
  memoryGib: z.literal(4),
  gpuCount: z.literal(0),
}).strict()

export const canonicalDistributedAttemptMeteringProfileSchema = z.discriminatedUnion(
  'toolId',
  [
    deepFilterNetMeteringProfileSchema,
    remotionMeteringProfileSchema,
    ffmpegMeteringProfileSchema,
  ],
)

export const canonicalDistributedPackageJobSeedSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  workItemKey: identity,
  required: z.boolean(),
  dependencyJobIds: z.array(identity).max(128),
  maxAttempts: z.number().int().positive().max(10),
  leaseDurationMs: z.number().int().min(1_000).max(604_800_000),
  attemptDeadlineDurationMs: z.number().int().min(1_000).max(604_800_000),
  queueJobDefinitionHash: sha256,
  manifestEntryHash: sha256,
  dispatchBindingHash: sha256,
  meteringProfile: canonicalDistributedAttemptMeteringProfileSchema,
}).strict().superRefine((job, context) => {
  if (job.attemptDeadlineDurationMs < job.leaseDurationMs) {
    context.addIssue({
      code: 'custom',
      message: 'Distributed package attempt deadline cannot precede its lease expiry.',
    })
  }
})

export const canonicalDistributedPackageFixtureSeedSchema = z.object({
  identity: canonicalDistributedPackageIdentitySchema,
  jobs: z.array(canonicalDistributedPackageJobSeedSchema).min(1).max(256),
}).strict().superRefine((seed, context) => {
  const jobIds = seed.jobs.map((job) => job.jobId)
  if (new Set(jobIds).size !== jobIds.length) {
    context.addIssue({ code: 'custom', message: 'Distributed package job IDs are duplicated.' })
  }
  const knownJobs = new Set(jobIds)
  for (const job of seed.jobs) {
    if (
      job.dependencyJobIds.includes(job.jobId) ||
      new Set(job.dependencyJobIds).size !== job.dependencyJobIds.length ||
      job.dependencyJobIds.some((dependencyJobId) => !knownJobs.has(dependencyJobId))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Distributed package job dependencies are invalid.',
      })
      break
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const jobsById = new Map(seed.jobs.map((job) => [job.jobId, job]))
  const hasCycle = (jobId: string): boolean => {
    if (visiting.has(jobId)) return true
    if (visited.has(jobId)) return false
    visiting.add(jobId)
    const cyclic = jobsById.get(jobId)?.dependencyJobIds.some(hasCycle) ?? false
    visiting.delete(jobId)
    visited.add(jobId)
    return cyclic
  }
  if (jobIds.some(hasCycle)) {
    context.addIssue({
      code: 'custom',
      message: 'Distributed package job dependencies contain a cycle.',
    })
  }
})

const requestBase = {
  packageRecordId: identity,
  idempotencyKey,
  requestHash: sha256,
}

export const canonicalDistributedClaimAndEnqueueRequestSchema = z.object({
  ...requestBase,
  jobId: identity,
  controllerIdentityEvidenceHash: sha256,
  requestedAt: timestamp,
}).strict()

export const canonicalDistributedAcceptControllerRequestSchema = z.object({
  ...requestBase,
  dispatchIntentId: identity,
  controllerIdentityEvidenceHash: sha256,
  controllerRequestBindingHash: sha256,
  controllerReceiptHash: sha256,
  acceptedAt: timestamp,
}).strict()

export const canonicalDistributedAcceptWorkerAndStartRequestSchema = z.object({
  ...requestBase,
  dispatchIntentId: identity,
  controllerReceiptHash: sha256,
  workerIdentityEvidenceHash: sha256,
  workerRequestBindingHash: sha256,
  workerReceiptHash: sha256,
  acceptedAt: timestamp,
}).strict()

export const canonicalDistributedHeartbeatRequestSchema = z.object({
  ...requestBase,
  dispatchIntentId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  heartbeatAt: timestamp,
}).strict()

export const canonicalDistributedCompletionRequestSchema = z.object({
  ...requestBase,
  dispatchIntentId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  completionEvidenceHash: sha256,
  linkedCanonicalOutcomeHash: sha256,
  outputByteLength: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  completedAt: timestamp,
}).strict()

const canonicalDistributedFailureCategorySchema = z.enum([
  'provider_error',
  'provider_variance_absorbed',
  'reeditpro_error_absorbed',
  'user_requested_retry',
  'validation_error',
  'cancelled',
  'unknown',
])

export const canonicalDistributedFailureRequestSchema = z.object({
  ...requestBase,
  dispatchIntentId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  failureEvidenceHash: sha256,
  failureCategory: canonicalDistributedFailureCategorySchema,
  failedAt: timestamp,
}).strict()

export const canonicalDistributedTimeoutSweepRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  observedAt: timestamp,
}).strict()

const attemptStartSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-attempt-start-v1'),
  evidenceHash: sha256,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  meteringProfile: canonicalDistributedAttemptMeteringProfileSchema,
  startedAt: timestamp,
  customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
}).strict()

const terminalCostSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-attempt-terminal-cost-v1'),
  evidenceHash: sha256,
  attemptStartEvidenceHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  billableMilliseconds: positiveSafeInteger,
  actualInternalCostMicros: safeInteger,
  breakdownHash: sha256,
  outcome: z.enum(['completed', 'failed', 'timeout']),
  finishedAt: timestamp,
  customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
  invoiceReconciled: z.literal(false),
}).strict()

const terminalSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-attempt-terminal-v1'),
  terminalKind: z.enum(['completion', 'failure', 'timeout']),
  terminalEvidenceHash: sha256,
  terminalCost: terminalCostSchema,
  queueDisposition: z.enum(['completed', 'retry_available', 'attempts_exhausted']),
  retryDisposition: z.enum([
    'not_applicable',
    'retry_same_approved_operation',
    'fallback_or_user_review_required',
  ]),
  automaticRetryStarted: z.literal(false),
  linkedCanonicalOutcomeHash: sha256.nullable(),
  outputByteLength: safeInteger.nullable(),
  failureCategory: canonicalDistributedFailureCategorySchema.nullable(),
  terminalAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((terminal, context) => {
  if (
    (terminal.terminalKind === 'completion' &&
      (terminal.queueDisposition !== 'completed' ||
        terminal.retryDisposition !== 'not_applicable' ||
        terminal.terminalCost.outcome !== 'completed')) ||
    (terminal.terminalKind === 'failure' && terminal.terminalCost.outcome !== 'failed') ||
    (terminal.terminalKind === 'timeout' && terminal.terminalCost.outcome !== 'timeout') ||
    (terminal.queueDisposition === 'retry_available' &&
      terminal.retryDisposition !== 'retry_same_approved_operation') ||
    (terminal.queueDisposition === 'attempts_exhausted' &&
      terminal.retryDisposition !== 'fallback_or_user_review_required') ||
    terminal.terminalAt !== terminal.terminalCost.finishedAt ||
    (terminal.terminalKind === 'completion' &&
      (terminal.linkedCanonicalOutcomeHash === null ||
        terminal.outputByteLength === null ||
        terminal.failureCategory !== null)) ||
    (terminal.terminalKind === 'failure' &&
      (terminal.linkedCanonicalOutcomeHash !== null ||
        terminal.outputByteLength !== null ||
        terminal.failureCategory === null)) ||
    (terminal.terminalKind === 'timeout' &&
      (terminal.linkedCanonicalOutcomeHash !== null ||
        terminal.outputByteLength !== null ||
        terminal.failureCategory !== null))
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed terminal disposition is invalid.' })
  }
})

const jobViewSchema = z.object({
  jobId: identity,
  state: z.enum(['queued', 'leased', 'completed', 'blocked']),
  deliveryAttemptCount: safeCount,
  maxAttempts: z.number().int().positive().max(10),
  remainingAttempts: z.number().int().nonnegative().max(10),
  attemptsExhausted: z.boolean(),
  automaticRetryStarted: z.literal(false),
}).strict().superRefine((job, context) => {
  if (
    job.remainingAttempts !== Math.max(0, job.maxAttempts - job.deliveryAttemptCount) ||
    job.attemptsExhausted !==
      (job.deliveryAttemptCount >= job.maxAttempts && job.state !== 'completed') ||
    (job.state === 'blocked' && !job.attemptsExhausted)
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed job attempt summary is invalid.' })
  }
})

const attemptViewSchema = z.object({
  dispatchIntentId: identity,
  jobId: identity,
  packageDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimId: identity,
  queueClaimHash: sha256,
  outboxEntryHash: sha256,
  state: z.enum([
    'pending_controller_delivery',
    'controller_identity_accepted',
    'worker_execution_started',
    'worker_completion_reconciled',
    'worker_failure_reconciled',
    'worker_timeout_reconciled',
  ]),
  controllerIdentityEvidenceHash: sha256,
  controllerRequestBindingHash: sha256.nullable(),
  controllerReceiptHash: sha256.nullable(),
  workerIdentityEvidenceHash: sha256.nullable(),
  workerRequestBindingHash: sha256.nullable(),
  workerReceiptHash: sha256.nullable(),
  heartbeatAt: timestamp,
  heartbeatCount: safeCount,
  claimExpiresAt: timestamp,
  attemptDeadlineAt: timestamp,
  attemptStart: attemptStartSchema.nullable(),
  terminal: terminalSchema.nullable(),
}).strict().superRefine((attempt, context) => {
  const controllerAccepted = attempt.controllerReceiptHash !== null &&
    attempt.controllerRequestBindingHash !== null
  const workerStarted = attempt.attemptStart !== null && attempt.workerReceiptHash !== null &&
    attempt.workerIdentityEvidenceHash !== null && attempt.workerRequestBindingHash !== null
  const terminal = attempt.terminal !== null
  if (
    Date.parse(attempt.heartbeatAt) >= Date.parse(attempt.claimExpiresAt) ||
    Date.parse(attempt.claimExpiresAt) > Date.parse(attempt.attemptDeadlineAt) ||
    (attempt.terminal !== null && attempt.attemptStart !== null &&
      attempt.terminal.terminalCost.attemptStartEvidenceHash !==
        attempt.attemptStart.evidenceHash) ||
    (attempt.state === 'pending_controller_delivery' &&
      (controllerAccepted || workerStarted || terminal)) ||
    (attempt.state === 'controller_identity_accepted' &&
      (!controllerAccepted || workerStarted || terminal)) ||
    (attempt.state === 'worker_execution_started' &&
      (!controllerAccepted || !workerStarted || terminal)) ||
    (attempt.state.startsWith('worker_') && attempt.state.endsWith('_reconciled') &&
      (!controllerAccepted || !workerStarted || !terminal))
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed attempt lifecycle is invalid.' })
  }
})

const transactionSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-package-state-transaction-v1'),
  transactionId: identity,
  operation: z.enum([
    'claim_and_enqueue',
    'accept_controller',
    'accept_worker_and_start',
    'heartbeat_worker',
    'reconcile_completion',
    'reconcile_failure',
  ]),
  packageIdentityHash: sha256,
  revisionBefore: safeCount,
  revisionAfter: positiveSafeCount,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  auditEventHash: sha256,
  committedAt: timestamp,
  transactionHash: sha256,
}).strict().superRefine((transaction, context) => {
  if (transaction.revisionAfter !== transaction.revisionBefore + 1) {
    context.addIssue({ code: 'custom', message: 'Distributed transaction revision is invalid.' })
  }
})

const persistenceBoundariesSchema = z.object({
  serviceOnly: z.literal(true),
  authenticatedTenantDerivedFromPackage: z.literal(true),
  packageAttemptAllocatedByTransaction: z.literal(true),
  callerSelectedTenantProjectionRevisionAttemptOrCostAllowed: z.literal(false),
  queueOutboxAttemptStartTerminalCostAndAuditShareCommit: z.literal(true),
  exactDurableResponseAssociationRequired: z.literal(true),
  plaintextClaimCredentialBearerTokenOrIdempotencyKeyPersisted: z.literal(false),
  rawMediaPromptPathSignedUrlOrCredentialPersisted: z.literal(false),
  customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded:
    z.literal(false),
  automaticRetryStarted: z.literal(false),
  cloudCallPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalDistributedPackageMutationResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_STATE_RESPONSE_VERSION),
  operation: transactionSchema.shape.operation,
  transaction: transactionSchema,
  job: jobViewSchema,
  attempt: attemptViewSchema,
  boundaries: persistenceBoundariesSchema,
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.operation !== response.transaction.operation ||
    response.job.jobId !== response.attempt.jobId
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed mutation response lineage is invalid.' })
  }
})

const timeoutOutcomeSchema = z.object({
  dispatchIntentId: identity,
  jobId: identity,
  packageDeliveryAttempt: z.number().int().positive().max(10),
  terminalHash: sha256,
  terminalCostEvidenceHash: sha256,
  queueDisposition: z.enum(['retry_available', 'attempts_exhausted']),
  automaticRetryStarted: z.literal(false),
}).strict()

export const canonicalDistributedPackageTimeoutBatchResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_TIMEOUT_BATCH_VERSION),
  operation: z.literal('finalize_expired_timeouts'),
  packageIdentityHash: sha256,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  observedAt: timestamp,
  expiredCandidateCount: safeCount,
  selectedCandidateCount: z.number().int().nonnegative()
    .max(CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH),
  reconciledCount: z.number().int().nonnegative()
    .max(CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH),
  outcomes: z.array(timeoutOutcomeSchema)
    .max(CANONICAL_DISTRIBUTED_PACKAGE_STATE_MAX_TIMEOUT_BATCH),
  transaction: z.object({
    transactionId: identity,
    revisionBefore: safeCount,
    revisionAfter: positiveSafeCount,
    controllerIdentityEvidenceHash: sha256,
    auditChainHeadHash: sha256,
    requestHash: sha256,
    idempotencyKeyHash: sha256,
    committedAt: timestamp,
    transactionHash: sha256,
  }).strict().nullable(),
  boundaries: persistenceBoundariesSchema.extend({
    expiredAttemptsSelectedByTransaction: z.literal(true),
    callerSelectedJobDispatchAttemptOrLimitAllowed: z.literal(false),
    terminalCostBoundedAtImmutableLeaseExpiry: z.literal(true),
  }).strict(),
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.selectedCandidateCount !== response.outcomes.length ||
    response.reconciledCount !== response.outcomes.length ||
    response.selectedCandidateCount > response.expiredCandidateCount ||
    (response.outcomes.length === 0) !== (response.transaction === null) ||
    (response.transaction !== null &&
      (response.transaction.revisionAfter !== response.transaction.revisionBefore + 1 ||
        response.transaction.requestHash !== response.requestHash ||
        response.transaction.idempotencyKeyHash !== response.idempotencyKeyHash))
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed timeout batch summary is invalid.' })
  }
})

export const canonicalDistributedPackageStatePortDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION),
  adapterId: identity,
  implementationClass: z.enum([
    'in_memory_contract_fixture',
    'database_transaction_adapter',
  ]),
  serviceOnly: z.literal(true),
  exactInputAndOutputSchemasEnforced: z.literal(true),
  serializableTransactionSemanticsExercised: z.boolean(),
  durableResponseReplaySemanticsExercised: z.boolean(),
  terminalExclusivitySemanticsExercised: z.boolean(),
  databaseBackend: z.enum(['none', 'postgres']),
  distributedDatabaseTransactionVerified: z.boolean(),
  multiReplicaDurabilityVerified: z.boolean(),
  liveSupabaseOrPostgresCallPerformed: z.boolean(),
  cloudCallPerformed: z.boolean(),
  productionAuthority: z.literal(false),
  descriptorHash: sha256,
}).strict().superRefine((descriptor, context) => {
  const fixtureClaimsDatabaseEvidence =
    descriptor.implementationClass === 'in_memory_contract_fixture' &&
    (descriptor.databaseBackend !== 'none' ||
      descriptor.distributedDatabaseTransactionVerified ||
      descriptor.multiReplicaDurabilityVerified ||
      descriptor.liveSupabaseOrPostgresCallPerformed ||
      descriptor.cloudCallPerformed)
  if (
    fixtureClaimsDatabaseEvidence ||
    (descriptor.databaseBackend === 'none' &&
      (descriptor.distributedDatabaseTransactionVerified ||
        descriptor.multiReplicaDurabilityVerified ||
        descriptor.liveSupabaseOrPostgresCallPerformed)) ||
    (descriptor.multiReplicaDurabilityVerified &&
      !descriptor.distributedDatabaseTransactionVerified)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Distributed package-state adapter evidence claims are inconsistent.',
    })
  }
})

export const canonicalDistributedPortResultSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    idempotencyStatus: z.enum(['inserted', 'exact_replay']),
    response: schema,
  }).strict()

export type CanonicalDistributedPackageIdentity = z.infer<
  typeof canonicalDistributedPackageIdentitySchema
>
export type CanonicalDistributedPackageFixtureSeed = z.infer<
  typeof canonicalDistributedPackageFixtureSeedSchema
>
export type CanonicalDistributedPackageMutationResponse = z.infer<
  typeof canonicalDistributedPackageMutationResponseSchema
>
export type CanonicalDistributedPackageTimeoutBatchResponse = z.infer<
  typeof canonicalDistributedPackageTimeoutBatchResponseSchema
>
export type CanonicalDistributedPackageStatePortDescriptor = z.infer<
  typeof canonicalDistributedPackageStatePortDescriptorSchema
>
export type CanonicalDistributedPortResult<T> = {
  idempotencyStatus: 'inserted' | 'exact_replay'
  response: T
}

export interface CanonicalDistributedPackageStateTransactionPort {
  readonly descriptor: CanonicalDistributedPackageStatePortDescriptor
  claimAndEnqueue(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  acceptController(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  acceptWorkerAndStart(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  heartbeatWorker(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  reconcileCompletion(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  reconcileFailure(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >
  finalizeExpiredTimeouts(input: unknown): Promise<
    CanonicalDistributedPortResult<CanonicalDistributedPackageTimeoutBatchResponse>
  >
}

const boundedPortBrands = new WeakSet<object>()

/**
 * Validates every request and response around an injected adapter. Registration
 * proves only the process-local contract boundary; it cannot authorize a
 * database, Cloud Tasks, workers, providers, production execution, or commerce.
 */
export function createCanonicalDistributedPackageStateContractBoundary(
  adapter: CanonicalDistributedPackageStateTransactionPort,
): CanonicalDistributedPackageStateTransactionPort {
  const descriptor = Object.freeze(assertDescriptor(adapter.descriptor))
  const boundary = Object.freeze({
    descriptor,
    claimAndEnqueue: (input: unknown) => invoke(
      'claim_and_enqueue',
      canonicalDistributedClaimAndEnqueueRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.claimAndEnqueue.bind(adapter),
      input,
    ),
    acceptController: (input: unknown) => invoke(
      'accept_controller',
      canonicalDistributedAcceptControllerRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.acceptController.bind(adapter),
      input,
    ),
    acceptWorkerAndStart: (input: unknown) => invoke(
      'accept_worker_and_start',
      canonicalDistributedAcceptWorkerAndStartRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.acceptWorkerAndStart.bind(adapter),
      input,
    ),
    heartbeatWorker: (input: unknown) => invoke(
      'heartbeat_worker',
      canonicalDistributedHeartbeatRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.heartbeatWorker.bind(adapter),
      input,
    ),
    reconcileCompletion: (input: unknown) => invoke(
      'reconcile_completion',
      canonicalDistributedCompletionRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.reconcileCompletion.bind(adapter),
      input,
    ),
    reconcileFailure: (input: unknown) => invoke(
      'reconcile_failure',
      canonicalDistributedFailureRequestSchema,
      canonicalDistributedPackageMutationResponseSchema,
      adapter.reconcileFailure.bind(adapter),
      input,
    ),
    finalizeExpiredTimeouts: async (input: unknown) => {
      const request = parseRequest(canonicalDistributedTimeoutSweepRequestSchema, input)
      const {
        idempotencyKey,
        requestHash,
        ...requestPayload
      } = request
      if (requestHash !== canonicalDistributedPackageStateRequestHash({
        operation: 'finalize_expired_timeouts',
        request: requestPayload,
      })) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'Distributed package-state timeout request hash is invalid.',
          409,
        )
      }
      const result = canonicalDistributedPortResultSchema(
        canonicalDistributedPackageTimeoutBatchResponseSchema,
      ).parse(
        await adapter.finalizeExpiredTimeouts(request),
      )
      assertTimeoutResponseIntegrity(result.response, request)
      const idempotencyKeyHash = canonicalDistributedPackageStateIdempotencyKeyHash(
        idempotencyKey,
      )
      if (
        result.response.requestHash !== requestHash ||
        result.response.idempotencyKeyHash !== idempotencyKeyHash ||
        (result.response.transaction !== null &&
          (result.response.transaction.requestHash !== requestHash ||
            result.response.transaction.idempotencyKeyHash !== idempotencyKeyHash))
      ) {
        throw invalidAdapterResponse('Distributed timeout response lineage is invalid.')
      }
      return result
    },
  }) satisfies CanonicalDistributedPackageStateTransactionPort
  boundedPortBrands.add(boundary)
  return boundary
}

export function assertCanonicalDistributedPackageStateContractBoundary(
  port: CanonicalDistributedPackageStateTransactionPort,
): void {
  if (!boundedPortBrands.has(port)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Distributed package-state persistence requires the process-local validated port boundary.',
      503,
      { requiredGate: 'canonical_distributed_package_state_port_registration' },
    )
  }
}

export function assertCanonicalDistributedPackageStateProductionAuthority(
  port: CanonicalDistributedPackageStateTransactionPort,
): never {
  assertCanonicalDistributedPackageStateContractBoundary(port)
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The distributed package-state contract fixture is not a reviewed database transaction or production authority.',
    503,
    {
      requiredGates: [
        'reviewed_canonical_database_transaction_adapter',
        'disposable_postgres_transaction_conformance',
        'two_replica_race_and_rollback_evidence',
        'live_service_identity_and_iam_evidence',
      ],
    },
  )
}

export function createCanonicalDistributedPackageStateFixtureDescriptor(
  adapterId: string,
): CanonicalDistributedPackageStatePortDescriptor {
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION,
    adapterId,
    implementationClass: 'in_memory_contract_fixture' as const,
    serviceOnly: true as const,
    exactInputAndOutputSchemasEnforced: true as const,
    serializableTransactionSemanticsExercised: true as const,
    durableResponseReplaySemanticsExercised: true as const,
    terminalExclusivitySemanticsExercised: true as const,
    databaseBackend: 'none' as const,
    distributedDatabaseTransactionVerified: false as const,
    multiReplicaDurabilityVerified: false as const,
    liveSupabaseOrPostgresCallPerformed: false as const,
    cloudCallPerformed: false as const,
    productionAuthority: false as const,
  }
  return canonicalDistributedPackageStatePortDescriptorSchema.parse({
    ...payload,
    descriptorHash: sha256AuthorityValue(payload),
  })
}

export function canonicalDistributedPersistenceBoundaries() {
  return {
    serviceOnly: true as const,
    authenticatedTenantDerivedFromPackage: true as const,
    packageAttemptAllocatedByTransaction: true as const,
    callerSelectedTenantProjectionRevisionAttemptOrCostAllowed: false as const,
    queueOutboxAttemptStartTerminalCostAndAuditShareCommit: true as const,
    exactDurableResponseAssociationRequired: true as const,
    plaintextClaimCredentialBearerTokenOrIdempotencyKeyPersisted: false as const,
    rawMediaPromptPathSignedUrlOrCredentialPersisted: false as const,
    customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded: false as const,
    automaticRetryStarted: false as const,
    cloudCallPerformed: false as const,
    providerCallPerformed: false as const,
    productionAuthority: false as const,
  }
}

export function canonicalDistributedPackageStateRequestHash(input: {
  operation:
    | 'claim_and_enqueue'
    | 'accept_controller'
    | 'accept_worker_and_start'
    | 'heartbeat_worker'
    | 'reconcile_completion'
    | 'reconcile_failure'
    | 'finalize_expired_timeouts'
  request: Record<string, unknown>
}): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_package_state_request_v1',
    operation: input.operation,
    request: input.request,
  })
}

export function canonicalDistributedPackageStateIdempotencyKeyHash(key: string): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_idempotency_key_v1',
    key: idempotencyKey.parse(key),
  })
}

export function assertCanonicalDistributedMutationResponseIntegrity(
  input: unknown,
): CanonicalDistributedPackageMutationResponse {
  const response = canonicalDistributedPackageMutationResponseSchema.parse(input)
  const { responseHash, ...payload } = response
  if (responseHash !== sha256AuthorityValue(payload)) {
    throw invalidAdapterResponse('Distributed package-state response checksum is invalid.')
  }
  const { transactionHash, ...transactionPayload } = response.transaction
  if (transactionHash !== sha256AuthorityValue(transactionPayload)) {
    throw invalidAdapterResponse('Distributed package-state transaction checksum is invalid.')
  }
  const { outboxEntryHash, ...attemptPayload } = response.attempt
  if (outboxEntryHash !== sha256AuthorityValue({
    domain: 'canonical_distributed_outbox_entry_v1',
    ...attemptPayload,
  })) {
    throw invalidAdapterResponse('Distributed package-state outbox checksum is invalid.')
  }
  const start = response.attempt.attemptStart
  if (start) {
    const { evidenceHash, ...startPayload } = start
    if (evidenceHash !== sha256AuthorityValue({
      domain: 'canonical_distributed_attempt_start_v1',
      packageIdentityHash: response.transaction.packageIdentityHash,
      dispatchIntentId: response.attempt.dispatchIntentId,
      ...startPayload,
    })) {
      throw invalidAdapterResponse('Distributed package-state attempt-start checksum is invalid.')
    }
  }
  const terminal = response.attempt.terminal
  if (terminal) {
    const { evidenceHash, ...costPayload } = terminal.terminalCost
    if (evidenceHash !== sha256AuthorityValue({
      domain: 'canonical_distributed_attempt_terminal_cost_v1',
      dispatchIntentId: response.attempt.dispatchIntentId,
      linkedCanonicalOutcomeHash: terminal.linkedCanonicalOutcomeHash,
      outputByteLength: terminal.outputByteLength,
      ...costPayload,
    })) {
      throw invalidAdapterResponse('Distributed package-state terminal cost checksum is invalid.')
    }
    const { terminalHash, ...terminalPayload } = terminal
    if (terminalHash !== sha256AuthorityValue({
      domain: 'canonical_distributed_attempt_terminal_v1',
      dispatchIntentId: response.attempt.dispatchIntentId,
      ...terminalPayload,
    })) {
      throw invalidAdapterResponse('Distributed package-state terminal checksum is invalid.')
    }
  }
  return response
}

function assertTimeoutResponseIntegrity(
  response: CanonicalDistributedPackageTimeoutBatchResponse,
  request: z.infer<typeof canonicalDistributedTimeoutSweepRequestSchema>,
): void {
  const { responseHash, ...payload } = response
  if (responseHash !== sha256AuthorityValue(payload)) {
    throw invalidAdapterResponse('Distributed timeout batch checksum is invalid.')
  }
  if (response.transaction) {
    const { transactionHash, ...transactionPayload } = response.transaction
    if (transactionHash !== sha256AuthorityValue(transactionPayload)) {
      throw invalidAdapterResponse('Distributed timeout transaction checksum is invalid.')
    }
  }
  if (response.observedAt !== request.observedAt) {
    throw invalidAdapterResponse('Distributed timeout observation lineage is invalid.')
  }
}

async function invoke<TRequest extends z.ZodType, TResponse extends z.ZodType>(
  operation: CanonicalDistributedPackageMutationResponse['operation'],
  requestSchema: TRequest,
  responseSchema: TResponse,
  adapterOperation: (request: z.infer<TRequest>) => Promise<unknown>,
  input: unknown,
): Promise<CanonicalDistributedPortResult<z.infer<TResponse>>> {
  const request = parseRequest(requestSchema, input)
  if (
    !request || typeof request !== 'object' ||
    !('idempotencyKey' in request) || !('requestHash' in request)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_REQUIRED',
      'Distributed package-state mutation requires exact idempotency evidence.',
      400,
    )
  }
  const {
    idempotencyKey,
    requestHash,
    ...requestPayload
  } = request as Record<string, unknown>
  if (
    typeof idempotencyKey !== 'string' ||
    typeof requestHash !== 'string' ||
    requestHash !== canonicalDistributedPackageStateRequestHash({
      operation,
      request: requestPayload,
    })
  ) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_MISMATCH',
      'Distributed package-state request hash is invalid.',
      409,
    )
  }
  const result = canonicalDistributedPortResultSchema(responseSchema).parse(
    await adapterOperation(request),
  ) as CanonicalDistributedPortResult<z.infer<TResponse>>
  const response = assertCanonicalDistributedMutationResponseIntegrity(result.response)
  const requestRecord = request as Record<string, unknown>
  if (
    response.operation !== operation ||
    response.transaction.requestHash !== requestHash ||
    response.transaction.idempotencyKeyHash !==
      canonicalDistributedPackageStateIdempotencyKeyHash(idempotencyKey) ||
    (operation === 'claim_and_enqueue' &&
      response.job.jobId !== requestRecord.jobId) ||
    (operation !== 'claim_and_enqueue' &&
      response.attempt.dispatchIntentId !== requestRecord.dispatchIntentId)
  ) {
    throw invalidAdapterResponse('Distributed package-state adapter response lineage is invalid.')
  }
  return result
}

function parseRequest<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Distributed package-state transaction request is invalid.',
      400,
      {
        callerSelectedStateFieldsAllowed: false,
        issueCount: parsed.error.issues.length,
      },
    )
  }
  return parsed.data
}

function assertDescriptor(
  input: CanonicalDistributedPackageStatePortDescriptor,
): CanonicalDistributedPackageStatePortDescriptor {
  const descriptor = canonicalDistributedPackageStatePortDescriptorSchema.parse(input)
  const { descriptorHash, ...payload } = descriptor
  if (descriptorHash !== sha256AuthorityValue(payload)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Distributed package-state adapter descriptor integrity is invalid.',
      503,
    )
  }
  return descriptor
}

function invalidAdapterResponse(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    message,
    503,
    { requiredGate: 'canonical_distributed_package_state_adapter_conformance' },
  )
}
