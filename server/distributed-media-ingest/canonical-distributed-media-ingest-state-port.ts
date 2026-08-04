import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { TOOL_COST_RATE_CARD, TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'

export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION =
  'canonical-distributed-media-ingest-state-port-v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_RESPONSE_VERSION =
  'canonical-distributed-media-ingest-state-response-v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_TIMEOUT_RESPONSE_VERSION =
  'canonical-distributed-media-ingest-timeout-response-v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_OPERATION_ID =
  'internal.media.finalize_large_upload.v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_PROCESSING_POLICY_ID =
  'generation_bound_checkpointed_hash_probe_finalize_v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID =
  'large_media_ingest_cpu_4vcpu_8gib_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const idempotencyKey = identity.min(16)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const oneTiB = 1024 ** 4

export const canonicalDistributedMediaIngestIdentitySchema = z.object({
  authorityClass: z.literal('pre_plan_technical_media_ingest'),
  operationId: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_OPERATION_ID),
  processingPolicyId: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_PROCESSING_POLICY_ID),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  uploadIntentId: identity,
  uploadPurpose: z.enum(['source_media', 'reference_media']),
  expectedSizeBytes: positiveSafeInteger.max(oneTiB),
  storageMode: z.literal('gcs'),
  uploadAuthorityFingerprint: sha256,
  identityHash: sha256,
}).strict()

export const canonicalDistributedMediaIngestPolicySchema = z.object({
  workerClass: z.literal('media_ingest_worker'),
  region: z.literal('us-east1'),
  maximumAttempts: z.literal(3),
  leaseDurationMs: z.number().int().min(30_000).max(15 * 60_000),
  attemptDeadlineDurationMs: z.number().int().min(60_000).max(24 * 60 * 60_000),
  minimumHeadroomBytes: positiveSafeInteger,
  resourceEnvelope: z.object({
    vcpuCount: z.literal(4),
    memoryGib: z.literal(8),
    gpuCount: z.literal(0),
  }).strict(),
  workloadProfileId: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID),
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  rateCardHash: sha256,
  policyHash: sha256,
}).strict().superRefine((policy, context) => {
  if (policy.attemptDeadlineDurationMs < policy.leaseDurationMs) {
    context.addIssue({
      code: 'custom',
      message: 'Media-ingest attempt deadline cannot precede lease expiry.',
    })
  }
})

export const canonicalDistributedMediaIngestSeedSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-seed-v1'),
  jobId: identity,
  identity: canonicalDistributedMediaIngestIdentitySchema,
  policy: canonicalDistributedMediaIngestPolicySchema,
  seedHash: sha256,
}).strict()

const requestBase = {
  jobId: identity,
  idempotencyKey,
  requestHash: sha256,
}

export const canonicalDistributedMediaIngestEnqueueRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  requestedAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestClaimRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  capacityAdmission: z.object({
    policyId: z.literal('large_media_worker_capacity_v1'),
    expectedSourceBytes: positiveSafeInteger.max(oneTiB),
    sourceStagingBytes: positiveSafeInteger.max(oneTiB),
    safetyReserveBytes: positiveSafeInteger,
    requiredAvailableBytes: positiveSafeInteger,
    observedAvailableBytes: positiveSafeInteger,
    reservationIdentityHash: sha256,
    byteTraversalAuthorized: z.literal(true),
    evidenceHash: sha256,
  }).strict(),
  sourceObjectIdentityEvidenceHash: sha256,
  acceptedAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestProgressPhaseSchema = z.enum([
  'hashing',
  'hash_complete',
  'probe_complete',
  'canonical_commit_ready',
])

export const canonicalDistributedMediaIngestProgressRequestSchema = z.object({
  ...requestBase,
  attemptId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  phase: canonicalDistributedMediaIngestProgressPhaseSchema,
  verifiedByteOffset: safeInteger.max(oneTiB),
  continuationStateObjectIdentityHash: sha256,
  checkpointEvidenceHash: sha256,
  heartbeatAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestCompletionRequestSchema = z.object({
  ...requestBase,
  attemptId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  mediaAssetId: identity,
  storageObjectRecordId: identity,
  sizeBytes: positiveSafeInteger.max(oneTiB),
  checksumSha256: sha256,
  sourceMetadataHash: sha256,
  generationIdentityHash: sha256,
  canonicalOutcomeHash: sha256,
  completedAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestFailureCategorySchema = z.enum([
  'source_changed',
  'validation_error',
  'reeditpro_error_absorbed',
  'cancelled',
  'unknown',
])

export const canonicalDistributedMediaIngestFailureRequestSchema = z.object({
  ...requestBase,
  attemptId: identity,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  failureCategory: canonicalDistributedMediaIngestFailureCategorySchema,
  sanitizedFailureCode: z.string().trim().min(1).max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/u),
  failureEvidenceHash: sha256,
  failedAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestCancellationRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  cancellationEvidenceHash: sha256,
  requestedAt: timestamp,
}).strict()

export const canonicalDistributedMediaIngestTimeoutRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  observedAt: timestamp,
}).strict()

const attemptStartSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-attempt-start-v1'),
  evidenceHash: sha256,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  capacityAdmissionEvidenceHash: sha256,
  capacityReservationIdentityHash: sha256,
  requiredAvailableBytes: positiveSafeInteger,
  sourceObjectIdentityEvidenceHash: sha256,
  workloadProfileId: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID),
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  rateCardHash: sha256,
  resourceEnvelope: canonicalDistributedMediaIngestPolicySchema.shape.resourceEnvelope,
  resumeOffsetBytes: safeInteger.max(oneTiB),
  resumeCheckpointHash: sha256.nullable(),
  startedAt: timestamp,
  approvedPlanSnapshotOrCreditReservationRequired: z.literal(false),
  customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
}).strict()

const checkpointSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-checkpoint-v1'),
  checkpointSequence: positiveSafeInteger,
  phase: canonicalDistributedMediaIngestProgressPhaseSchema,
  verifiedByteOffset: safeInteger.max(oneTiB),
  continuationStateObjectIdentityHash: sha256,
  checkpointEvidenceHash: sha256,
  sourceObjectIdentityEvidenceHash: sha256,
  recordedAt: timestamp,
  checkpointHash: sha256,
}).strict()

const terminalCostSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-terminal-cost-v1'),
  evidenceHash: sha256,
  attemptStartEvidenceHash: sha256,
  usageEvidenceHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  rateCardHash: sha256,
  workloadProfileId: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID),
  billableMilliseconds: positiveSafeInteger,
  vcpuCount: z.literal(4),
  memoryGib: z.literal(8),
  gpuCount: z.literal(0),
  tempStorageGibHours: z.number().nonnegative().finite(),
  actualInternalCostMicros: safeInteger,
  breakdownHash: sha256,
  outcome: z.enum(['completed', 'failed', 'timeout']),
  finishedAt: timestamp,
  customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
  invoiceReconciled: z.literal(false),
}).strict()

const completionResultSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-completion-v1'),
  uploadIntentId: identity,
  mediaAssetId: identity,
  storageObjectRecordId: identity,
  sizeBytes: positiveSafeInteger.max(oneTiB),
  checksumSha256: sha256,
  sourceMetadataHash: sha256,
  generationIdentityHash: sha256,
  canonicalOutcomeHash: sha256,
  privateCreateOnlyReadbackVerified: z.literal(true),
  rawPathSignedUrlOrProviderUrlPersisted: z.literal(false),
  resultHash: sha256,
}).strict()

const terminalSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-terminal-v1'),
  terminalKind: z.enum(['completion', 'failure', 'timeout']),
  terminalEvidenceHash: sha256,
  terminalCost: terminalCostSchema,
  queueDisposition: z.enum([
    'completed',
    'retry_available',
    'attempts_exhausted',
    'terminal_source_or_validation_failure',
    'cancelled',
  ]),
  retryDisposition: z.enum([
    'not_applicable',
    'explicit_same_source_retry_available',
    'fresh_upload_or_manual_review_required',
  ]),
  automaticRetryStarted: z.literal(false),
  failureCategory: canonicalDistributedMediaIngestFailureCategorySchema.nullable(),
  sanitizedFailureCode: z.string().trim().min(1).max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/u).nullable(),
  completionResult: completionResultSchema.nullable(),
  terminalAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((terminal, context) => {
  const completed = terminal.terminalKind === 'completion'
  const failed = terminal.terminalKind === 'failure'
  if (
    (completed && (
      terminal.queueDisposition !== 'completed' ||
      terminal.retryDisposition !== 'not_applicable' ||
      terminal.failureCategory !== null ||
      terminal.sanitizedFailureCode !== null ||
      terminal.completionResult === null ||
      terminal.terminalCost.outcome !== 'completed'
    )) ||
    (!completed && terminal.completionResult !== null) ||
    (failed && (
      terminal.failureCategory === null ||
      terminal.sanitizedFailureCode === null ||
      terminal.terminalCost.outcome !== 'failed'
    )) ||
    (terminal.terminalKind === 'timeout' && (
      terminal.failureCategory !== null ||
      terminal.sanitizedFailureCode !== null ||
      terminal.terminalCost.outcome !== 'timeout'
    )) ||
    (terminal.queueDisposition === 'retry_available' &&
      terminal.retryDisposition !== 'explicit_same_source_retry_available') ||
    (terminal.queueDisposition === 'attempts_exhausted' &&
      terminal.retryDisposition !== 'fresh_upload_or_manual_review_required') ||
    (terminal.queueDisposition === 'terminal_source_or_validation_failure' &&
      terminal.retryDisposition !== 'fresh_upload_or_manual_review_required') ||
    terminal.terminalAt !== terminal.terminalCost.finishedAt
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest terminal disposition is invalid.' })
  }
})

const jobViewSchema = z.object({
  jobId: identity,
  state: z.enum([
    'queued',
    'running',
    'cancellation_requested',
    'completed',
    'retry_available',
    'failed_terminal',
    'cancelled',
  ]),
  attemptCount: z.number().int().nonnegative().max(3),
  maximumAttempts: z.literal(3),
  remainingAttempts: z.number().int().nonnegative().max(3),
  sourceObjectIdentityEvidenceHash: sha256.nullable(),
  latestDurableCheckpoint: checkpointSchema.nullable(),
  cancellationRequestedAt: timestamp.nullable(),
  automaticRetryStarted: z.literal(false),
}).strict().superRefine((job, context) => {
  if (
    job.remainingAttempts !== Math.max(0, job.maximumAttempts - job.attemptCount) ||
    (job.state === 'running' && job.attemptCount === 0) ||
    (job.state === 'retry_available' && job.remainingAttempts === 0) ||
    (job.state === 'cancellation_requested') !== (job.cancellationRequestedAt !== null)
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest job summary is invalid.' })
  }
})

const attemptViewSchema = z.object({
  attemptId: identity,
  jobId: identity,
  attemptNumber: z.number().int().positive().max(3),
  leaseId: identity,
  leaseHash: sha256,
  state: z.enum(['running', 'cancellation_requested', 'completed', 'failed', 'timed_out']),
  heartbeatAt: timestamp,
  heartbeatCount: safeInteger,
  leaseExpiresAt: timestamp,
  attemptDeadlineAt: timestamp,
  attemptStart: attemptStartSchema,
  latestCheckpoint: checkpointSchema.nullable(),
  terminal: terminalSchema.nullable(),
}).strict().superRefine((attempt, context) => {
  const terminal = attempt.terminal !== null
  const latestIsResumeCheckpoint = attempt.latestCheckpoint !== null &&
    attempt.latestCheckpoint.checkpointHash === attempt.attemptStart.resumeCheckpointHash
  if (
    Date.parse(attempt.heartbeatAt) >= Date.parse(attempt.leaseExpiresAt) ||
    Date.parse(attempt.leaseExpiresAt) > Date.parse(attempt.attemptDeadlineAt) ||
    (terminal !== ['completed', 'failed', 'timed_out'].includes(attempt.state)) ||
    (terminal && attempt.terminal?.terminalCost.attemptStartEvidenceHash !==
      attempt.attemptStart.evidenceHash) ||
    (attempt.latestCheckpoint !== null &&
      Date.parse(attempt.latestCheckpoint.recordedAt) <
        Date.parse(attempt.attemptStart.startedAt) &&
      !latestIsResumeCheckpoint) ||
    (latestIsResumeCheckpoint && attempt.latestCheckpoint?.verifiedByteOffset !==
      attempt.attemptStart.resumeOffsetBytes)
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest attempt lifecycle is invalid.' })
  }
})

const operationSchema = z.enum([
  'enqueue',
  'claim_and_start',
  'record_progress',
  'reconcile_completion',
  'reconcile_failure',
  'request_cancellation',
])

const transactionSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-transaction-v1'),
  transactionId: identity,
  operation: operationSchema,
  ingestIdentityHash: sha256,
  revisionBefore: safeInteger,
  revisionAfter: positiveSafeInteger,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  auditEventHash: sha256,
  committedAt: timestamp,
  transactionHash: sha256,
}).strict().superRefine((transaction, context) => {
  if (transaction.revisionAfter !== transaction.revisionBefore + 1) {
    context.addIssue({ code: 'custom', message: 'Media-ingest transaction revision is invalid.' })
  }
})

const persistenceBoundariesSchema = z.object({
  serviceOnly: z.literal(true),
  authorityClass: z.literal('pre_plan_technical_media_ingest'),
  uploadAuthorityDerivedServerSide: z.literal(true),
  approvedPlanSnapshotRequired: z.literal(false),
  approvedCreditReservationRequired: z.literal(false),
  approvedSnapshotOrCreditReservationFabricated: z.literal(false),
  executionLimitedToHashProbeAndCanonicalSourceFinalization: z.literal(true),
  editingGenerationRenderingOrProviderExecutionAllowed: z.literal(false),
  capacityAdmissionRequiredBeforeAttemptStart: z.literal(true),
  attemptLeaseAndProgressShareTransactionalAuthority: z.literal(true),
  callerSelectedAttemptLeaseExpiryCostOrRetryAllowed: z.literal(false),
  exactDurableResponseAssociationRequired: z.literal(true),
  plaintextLeaseCredentialBearerTokenOrIdempotencyKeyPersisted: z.literal(false),
  rawMediaPromptPathSignedUrlProviderUrlOrCredentialPersisted: z.literal(false),
  customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded: z.literal(false),
  automaticRetryStarted: z.literal(false),
  cloudCallPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalDistributedMediaIngestMutationResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_RESPONSE_VERSION),
  operation: operationSchema,
  transaction: transactionSchema,
  job: jobViewSchema,
  attempt: attemptViewSchema.nullable(),
  boundaries: persistenceBoundariesSchema,
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.operation !== response.transaction.operation ||
    (response.attempt !== null && response.job.jobId !== response.attempt.jobId)
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest response lineage is invalid.' })
  }
})

export const canonicalDistributedMediaIngestTimeoutResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_TIMEOUT_RESPONSE_VERSION),
  operation: z.literal('finalize_expired_attempt'),
  jobId: identity,
  ingestIdentityHash: sha256,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  observedAt: timestamp,
  expiredAttemptReconciled: z.boolean(),
  job: jobViewSchema,
  attempt: attemptViewSchema.nullable(),
  transaction: z.object({
    transactionId: identity,
    revisionBefore: safeInteger,
    revisionAfter: positiveSafeInteger,
    auditEventHash: sha256,
    committedAt: timestamp,
    transactionHash: sha256,
  }).strict().nullable(),
  boundaries: persistenceBoundariesSchema.extend({
    activeAttemptSelectedByTransaction: z.literal(true),
    callerSelectedAttemptOrExpiryAllowed: z.literal(false),
    terminalCostBoundedAtImmutableLeaseExpiry: z.literal(true),
  }).strict(),
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.expiredAttemptReconciled !== (response.transaction !== null) ||
    response.expiredAttemptReconciled !== (response.attempt !== null) ||
    (response.transaction !== null &&
      response.transaction.revisionAfter !== response.transaction.revisionBefore + 1)
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest timeout response is invalid.' })
  }
})

export const canonicalDistributedMediaIngestPortDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION),
  adapterId: identity,
  implementationClass: z.enum(['in_memory_contract_fixture', 'database_transaction_adapter']),
  serviceOnly: z.literal(true),
  exactInputAndOutputSchemasEnforced: z.literal(true),
  prePlanTechnicalIngestAuthority: z.literal(true),
  approvedPackageAuthorityReusedOrFabricated: z.literal(false),
  serializableTransactionSemanticsExercised: z.boolean(),
  durableResponseReplaySemanticsExercised: z.boolean(),
  progressCheckpointResumeSemanticsExercised: z.boolean(),
  terminalExclusivitySemanticsExercised: z.boolean(),
  databaseBackend: z.enum(['none', 'postgres']),
  distributedDatabaseTransactionVerified: z.boolean(),
  multiReplicaDurabilityVerified: z.boolean(),
  liveSupabaseOrPostgresCallPerformed: z.boolean(),
  cloudDispatchVerified: z.boolean(),
  liveGcsObjectBytesRead: z.boolean(),
  productionAuthority: z.literal(false),
  descriptorHash: sha256,
}).strict().superRefine((descriptor, context) => {
  if (
    (descriptor.implementationClass === 'in_memory_contract_fixture' &&
      (descriptor.databaseBackend !== 'none' ||
        descriptor.distributedDatabaseTransactionVerified ||
        descriptor.multiReplicaDurabilityVerified ||
        descriptor.liveSupabaseOrPostgresCallPerformed ||
        descriptor.cloudDispatchVerified ||
        descriptor.liveGcsObjectBytesRead)) ||
    (descriptor.databaseBackend === 'none' &&
      (descriptor.distributedDatabaseTransactionVerified ||
        descriptor.multiReplicaDurabilityVerified ||
        descriptor.liveSupabaseOrPostgresCallPerformed))
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest adapter readiness is inconsistent.' })
  }
})

export type CanonicalDistributedMediaIngestSeed = z.infer<
  typeof canonicalDistributedMediaIngestSeedSchema
>
export type CanonicalDistributedMediaIngestMutationResponse = z.infer<
  typeof canonicalDistributedMediaIngestMutationResponseSchema
>
export type CanonicalDistributedMediaIngestTimeoutResponse = z.infer<
  typeof canonicalDistributedMediaIngestTimeoutResponseSchema
>
export type CanonicalDistributedMediaIngestPortDescriptor = z.infer<
  typeof canonicalDistributedMediaIngestPortDescriptorSchema
>

export type CanonicalDistributedMediaIngestPortResult<T> = {
  idempotencyStatus: 'inserted' | 'exact_replay'
  response: T
}

export interface CanonicalDistributedMediaIngestTransactionAdapter {
  readonly descriptor: CanonicalDistributedMediaIngestPortDescriptor
  enqueue(input: z.infer<typeof canonicalDistributedMediaIngestEnqueueRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  claimAndStart(input: z.infer<typeof canonicalDistributedMediaIngestClaimRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  recordProgress(input: z.infer<typeof canonicalDistributedMediaIngestProgressRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  reconcileCompletion(input: z.infer<typeof canonicalDistributedMediaIngestCompletionRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  reconcileFailure(input: z.infer<typeof canonicalDistributedMediaIngestFailureRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  requestCancellation(input: z.infer<typeof canonicalDistributedMediaIngestCancellationRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestMutationResponse>>
  finalizeExpiredAttempt(input: z.infer<typeof canonicalDistributedMediaIngestTimeoutRequestSchema>):
    Promise<CanonicalDistributedMediaIngestPortResult<CanonicalDistributedMediaIngestTimeoutResponse>>
}

const boundaryBrands = new WeakSet<object>()

export function createCanonicalDistributedMediaIngestStatePort(
  adapter: CanonicalDistributedMediaIngestTransactionAdapter,
): CanonicalDistributedMediaIngestTransactionAdapter {
  const descriptor = assertDescriptor(adapter.descriptor)
  const boundary: CanonicalDistributedMediaIngestTransactionAdapter = {
    descriptor,
    enqueue: (input) => invoke(
      'enqueue',
      canonicalDistributedMediaIngestEnqueueRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.enqueue.bind(adapter),
      input,
    ),
    claimAndStart: (input) => invoke(
      'claim_and_start',
      canonicalDistributedMediaIngestClaimRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.claimAndStart.bind(adapter),
      input,
    ),
    recordProgress: (input) => invoke(
      'record_progress',
      canonicalDistributedMediaIngestProgressRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.recordProgress.bind(adapter),
      input,
    ),
    reconcileCompletion: (input) => invoke(
      'reconcile_completion',
      canonicalDistributedMediaIngestCompletionRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.reconcileCompletion.bind(adapter),
      input,
    ),
    reconcileFailure: (input) => invoke(
      'reconcile_failure',
      canonicalDistributedMediaIngestFailureRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.reconcileFailure.bind(adapter),
      input,
    ),
    requestCancellation: (input) => invoke(
      'request_cancellation',
      canonicalDistributedMediaIngestCancellationRequestSchema,
      canonicalDistributedMediaIngestMutationResponseSchema,
      adapter.requestCancellation.bind(adapter),
      input,
    ),
    finalizeExpiredAttempt: (input) => invoke(
      'finalize_expired_attempt',
      canonicalDistributedMediaIngestTimeoutRequestSchema,
      canonicalDistributedMediaIngestTimeoutResponseSchema,
      adapter.finalizeExpiredAttempt.bind(adapter),
      input,
    ),
  }
  Object.freeze(boundary)
  boundaryBrands.add(boundary)
  return boundary
}

export function assertCanonicalDistributedMediaIngestStatePort(
  input: unknown,
): asserts input is CanonicalDistributedMediaIngestTransactionAdapter {
  if (!input || typeof input !== 'object' || !boundaryBrands.has(input)) {
    throw atomicityError('Canonical distributed media-ingest port authority is not process-branded.')
  }
}

export function assertCanonicalDistributedMediaIngestProductionAuthority(
  input: unknown,
): asserts input is CanonicalDistributedMediaIngestTransactionAdapter {
  assertCanonicalDistributedMediaIngestStatePort(input)
  const descriptor = (input as CanonicalDistributedMediaIngestTransactionAdapter).descriptor
  if (
    descriptor.implementationClass !== 'database_transaction_adapter' ||
    descriptor.databaseBackend !== 'postgres' ||
    !descriptor.distributedDatabaseTransactionVerified ||
    !descriptor.multiReplicaDurabilityVerified ||
    !descriptor.liveSupabaseOrPostgresCallPerformed ||
    !descriptor.cloudDispatchVerified ||
    !descriptor.liveGcsObjectBytesRead
  ) {
    throw atomicityError(
      'Distributed media-ingest production authority requires live database, multi-replica, dispatch, and GCS evidence.',
    )
  }

  throw atomicityError(
    'Canonical distributed media-ingest state port v1 is source-contract-only and cannot authorize production. A forward contract version must add reviewed production authority.',
  )
}

export function createCanonicalDistributedMediaIngestFixtureDescriptor(
  adapterId = 'canonical_media_ingest_in_memory_fixture_v1',
): CanonicalDistributedMediaIngestPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
    adapterId,
    implementationClass: 'in_memory_contract_fixture',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanTechnicalIngestAuthority: true,
    approvedPackageAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: true,
    durableResponseReplaySemanticsExercised: true,
    progressCheckpointResumeSemanticsExercised: true,
    terminalExclusivitySemanticsExercised: true,
    databaseBackend: 'none',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    liveSupabaseOrPostgresCallPerformed: false,
    cloudDispatchVerified: false,
    liveGcsObjectBytesRead: false,
    productionAuthority: false,
  })
}

export function createCanonicalDistributedMediaIngestUnverifiedDatabaseAdapterDescriptor(
  adapterId = 'canonical_media_ingest_database_adapter_contract_v1',
): CanonicalDistributedMediaIngestPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
    adapterId,
    implementationClass: 'database_transaction_adapter',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanTechnicalIngestAuthority: true,
    approvedPackageAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: false,
    durableResponseReplaySemanticsExercised: false,
    progressCheckpointResumeSemanticsExercised: false,
    terminalExclusivitySemanticsExercised: false,
    databaseBackend: 'none',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    liveSupabaseOrPostgresCallPerformed: false,
    cloudDispatchVerified: false,
    liveGcsObjectBytesRead: false,
    productionAuthority: false,
  })
}

/**
 * Describes the disposable canonical-V3 loopback Postgres proof. The local
 * database exercises serializable mutation, exact response replay, monotonic
 * checkpoints, terminal exclusivity, and expired-lease recovery. It does not
 * prove multi-replica durability, authenticated cloud-worker dispatch, or a
 * live generation-bound GCS read, so V1 remains deliberately non-promotable.
 */
export function createCanonicalDistributedMediaIngestLocalPostgresDescriptor(
  adapterId = 'canonical_media_ingest_local_postgres_v1',
): CanonicalDistributedMediaIngestPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
    adapterId,
    implementationClass: 'database_transaction_adapter',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanTechnicalIngestAuthority: true,
    approvedPackageAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: true,
    durableResponseReplaySemanticsExercised: true,
    progressCheckpointResumeSemanticsExercised: true,
    terminalExclusivitySemanticsExercised: true,
    databaseBackend: 'postgres',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    liveSupabaseOrPostgresCallPerformed: true,
    cloudDispatchVerified: false,
    liveGcsObjectBytesRead: false,
    productionAuthority: false,
  })
}

export function canonicalDistributedMediaIngestPersistenceBoundaries() {
  return {
    serviceOnly: true as const,
    authorityClass: 'pre_plan_technical_media_ingest' as const,
    uploadAuthorityDerivedServerSide: true as const,
    approvedPlanSnapshotRequired: false as const,
    approvedCreditReservationRequired: false as const,
    approvedSnapshotOrCreditReservationFabricated: false as const,
    executionLimitedToHashProbeAndCanonicalSourceFinalization: true as const,
    editingGenerationRenderingOrProviderExecutionAllowed: false as const,
    capacityAdmissionRequiredBeforeAttemptStart: true as const,
    attemptLeaseAndProgressShareTransactionalAuthority: true as const,
    callerSelectedAttemptLeaseExpiryCostOrRetryAllowed: false as const,
    exactDurableResponseAssociationRequired: true as const,
    plaintextLeaseCredentialBearerTokenOrIdempotencyKeyPersisted: false as const,
    rawMediaPromptPathSignedUrlProviderUrlOrCredentialPersisted: false as const,
    customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded: false as const,
    automaticRetryStarted: false as const,
    cloudCallPerformed: false as const,
    providerCallPerformed: false as const,
    productionAuthority: false as const,
  }
}

export function canonicalDistributedMediaIngestRequestHash(
  operation: string,
  request: Record<string, unknown>,
): string {
  const { idempotencyKey: _idempotencyKey, requestHash: _requestHash, ...payload } = request
  void _idempotencyKey
  void _requestHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_request_v1',
    operation,
    payload,
  })
}

export function canonicalDistributedMediaIngestIdempotencyKeyHash(value: string): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_idempotency_key_v1',
    value,
  })
}

export function canonicalDistributedMediaIngestRateCardHash(): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_rate_card_v1',
    rateCard: TOOL_COST_RATE_CARD,
  })
}

export function assertCanonicalDistributedMediaIngestMutationIntegrity(
  input: unknown,
): CanonicalDistributedMediaIngestMutationResponse {
  const response = canonicalDistributedMediaIngestMutationResponseSchema.parse(input)
  assertTransactionHash(response.transaction)
  if (response.attempt) assertAttemptIntegrity(response.attempt)
  if (response.job.latestDurableCheckpoint) {
    assertCheckpointHash(response.job.latestDurableCheckpoint)
  }
  const { responseHash, ...payload } = response
  if (responseHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Distributed media-ingest response checksum is invalid.')
  }
  return response
}

export function assertCanonicalDistributedMediaIngestTimeoutIntegrity(
  input: unknown,
): CanonicalDistributedMediaIngestTimeoutResponse {
  const response = canonicalDistributedMediaIngestTimeoutResponseSchema.parse(input)
  if (response.transaction) {
    const { transactionHash, ...payload } = response.transaction
    if (transactionHash !== sha256AuthorityValue(payload)) {
      throw atomicityError('Distributed media-ingest timeout transaction checksum is invalid.')
    }
  }
  if (response.attempt) assertAttemptIntegrity(response.attempt)
  if (response.job.latestDurableCheckpoint) {
    assertCheckpointHash(response.job.latestDurableCheckpoint)
  }
  const { responseHash, ...payload } = response
  if (responseHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Distributed media-ingest timeout response checksum is invalid.')
  }
  return response
}

function assertAttemptIntegrity(attempt: z.infer<typeof attemptViewSchema>): void {
  const { evidenceHash, ...startPayload } = attempt.attemptStart
  if (evidenceHash !== sha256AuthorityValue(startPayload)) {
    throw atomicityError('Distributed media-ingest attempt-start checksum is invalid.')
  }
  if (attempt.latestCheckpoint) assertCheckpointHash(attempt.latestCheckpoint)
  if (attempt.terminal) {
    const terminal = attempt.terminal
    const { evidenceHash: costEvidenceHash, ...costPayload } = terminal.terminalCost
    if (costEvidenceHash !== sha256AuthorityValue(costPayload)) {
      throw atomicityError('Distributed media-ingest terminal-cost checksum is invalid.')
    }
    if (terminal.completionResult) {
      const { resultHash, ...resultPayload } = terminal.completionResult
      if (resultHash !== sha256AuthorityValue(resultPayload)) {
        throw atomicityError('Distributed media-ingest completion checksum is invalid.')
      }
    }
    const { terminalHash, ...terminalPayload } = terminal
    if (terminalHash !== sha256AuthorityValue(terminalPayload)) {
      throw atomicityError('Distributed media-ingest terminal checksum is invalid.')
    }
  }
}

function assertCheckpointHash(checkpoint: z.infer<typeof checkpointSchema>): void {
  const { checkpointHash, ...payload } = checkpoint
  if (checkpointHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Distributed media-ingest checkpoint checksum is invalid.')
  }
}

function assertTransactionHash(transaction: z.infer<typeof transactionSchema>): void {
  const { transactionHash, ...payload } = transaction
  if (transactionHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Distributed media-ingest transaction checksum is invalid.')
  }
}

async function invoke<TRequest extends z.ZodType, TResponse extends z.ZodType>(
  operation: string,
  requestSchema: TRequest,
  responseSchema: TResponse,
  adapterMethod: (input: z.infer<TRequest>) => Promise<CanonicalDistributedMediaIngestPortResult<z.infer<TResponse>>>,
  rawInput: unknown,
): Promise<CanonicalDistributedMediaIngestPortResult<z.infer<TResponse>>> {
  const parsed = requestSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Distributed media-ingest request is invalid.', 400, parsed.error.flatten())
  }
  const request = parsed.data
  const requestIdentity = request as {
    jobId: string
    idempotencyKey: string
    requestHash: string
  }
  const expectedHash = canonicalDistributedMediaIngestRequestHash(
    operation,
    request as Record<string, unknown>,
  )
  if (requestIdentity.requestHash !== expectedHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Distributed media-ingest request hash is invalid.', 409)
  }
  const expectedIdempotencyKeyHash = canonicalDistributedMediaIngestIdempotencyKeyHash(
    requestIdentity.idempotencyKey,
  )
  const result = await adapterMethod(request)
  const parsedResult = z.object({
    idempotencyStatus: z.enum(['inserted', 'exact_replay']),
    response: z.unknown(),
  }).strict().safeParse(result)
  if (!parsedResult.success) {
    throw atomicityError('Distributed media-ingest adapter returned an invalid response.')
  }
  const parsedResponse = responseSchema.safeParse(parsedResult.data.response)
  if (!parsedResponse.success) {
    throw atomicityError('Distributed media-ingest adapter returned an invalid response payload.')
  }
  if (operation === 'finalize_expired_attempt') {
    const response = assertCanonicalDistributedMediaIngestTimeoutIntegrity(parsedResponse.data)
    if (
      response.jobId !== requestIdentity.jobId ||
      response.requestHash !== requestIdentity.requestHash ||
      response.idempotencyKeyHash !== expectedIdempotencyKeyHash
    ) {
      throw atomicityError('Distributed media-ingest timeout response changed request lineage.')
    }
  } else {
    const response = assertCanonicalDistributedMediaIngestMutationIntegrity(parsedResponse.data)
    if (
      response.operation !== operation ||
      response.job.jobId !== requestIdentity.jobId ||
      response.transaction.requestHash !== requestIdentity.requestHash ||
      response.transaction.idempotencyKeyHash !== expectedIdempotencyKeyHash
    ) {
      throw atomicityError('Distributed media-ingest adapter changed request lineage.')
    }
  }
  return {
    idempotencyStatus: parsedResult.data.idempotencyStatus,
    response: parsedResponse.data,
  }
}

function descriptorWithHash(
  input: Omit<CanonicalDistributedMediaIngestPortDescriptor, 'descriptorHash'>,
): CanonicalDistributedMediaIngestPortDescriptor {
  return canonicalDistributedMediaIngestPortDescriptorSchema.parse({
    ...input,
    descriptorHash: sha256AuthorityValue(input),
  })
}

function assertDescriptor(input: unknown): CanonicalDistributedMediaIngestPortDescriptor {
  const descriptor = canonicalDistributedMediaIngestPortDescriptorSchema.parse(input)
  const { descriptorHash, ...payload } = descriptor
  if (descriptorHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Distributed media-ingest adapter descriptor checksum is invalid.')
  }
  return Object.freeze(descriptor)
}

function atomicityError(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503)
}

export {
  attemptViewSchema as canonicalDistributedMediaIngestAttemptViewSchema,
  checkpointSchema as canonicalDistributedMediaIngestCheckpointSchema,
  jobViewSchema as canonicalDistributedMediaIngestJobViewSchema,
}
