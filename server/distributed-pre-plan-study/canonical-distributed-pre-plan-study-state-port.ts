import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION =
  'canonical-distributed-pre-plan-study-state-port-v1' as const
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RESPONSE_VERSION =
  'canonical-distributed-pre-plan-study-state-response-v1' as const
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RECOVERY_RESPONSE_VERSION =
  'canonical-distributed-pre-plan-study-recovery-response-v1' as const
// The high-level study plan produces 292 bounded items for a six-hour source
// when caption OCR and audio analysis are both required. Keep the durable
// state ceiling comfortably above that reviewed hours-long workload while a
// future plan version addresses multi-day graph compaction separately.
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS = 4_096

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const safeCode = z.string().trim().min(1).max(80).regex(/^[A-Z][A-Z0-9_]*$/u)
const idempotencyKey = identity.min(16)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const moneyMicros = z.string().regex(/^(?:0|[1-9][0-9]{0,23})$/u)
const positiveMoneyMicros = moneyMicros.refine((value) => BigInt(value) > 0n)

export const canonicalDistributedPrePlanStudyIdentitySchema = z.object({
  authorityClass: z.literal('pre_plan_edit_reference_long_form_study'),
  persistenceContractVersion: z.literal(
    EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
  ),
  ownerUserId: identity,
  workspaceId: identity,
  editReferenceId: identity,
  studySessionId: identity,
  sourceAssetId: identity,
  sourcePrivateMediaArtifactId: identity,
  sourceStorageObjectId: identity,
  sourceStorageObjectIdentityHash: sha256,
  sourceChecksumSha256: sha256,
  sourceSizeBytes: positiveSafeInteger.max(1024 ** 4),
  sourceDurationMilliseconds: positiveSafeInteger.max(30 * 24 * 60 * 60 * 1_000),
  sourceMimeType: z.string().trim().min(1).max(160),
  sourceHasAudio: z.boolean(),
  identityHash: sha256,
}).strict()

export const canonicalDistributedPrePlanStudyResourceEnvelopeSchema = z.object({
  vcpuCount: z.number().int().positive().max(64),
  memoryGib: z.number().positive().max(512),
  gpuCount: z.number().int().nonnegative().max(8),
  temporaryStorageGib: z.number().positive().max(16_384),
}).strict()

export const canonicalDistributedPrePlanStudyWorkerClassSchema = z.enum([
  'media_worker',
  'transcript_worker',
  'visual_worker',
  'reasoning_worker',
  'qa_worker',
])

export const canonicalDistributedPrePlanStudyExecutionKindSchema = z.enum([
  'deterministic_tool',
  'reasoning_model',
  'visual_model',
])

export const canonicalDistributedPrePlanStudyWorkItemSeedSchema = z.object({
  workItemId: identity,
  sequence: z.number().int().positive().max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  stageId: identity,
  dependencyWorkItemIds: z.array(identity).max(128),
  required: z.boolean(),
  weightBasisPoints: z.number().int().positive().max(10_000),
  executionKind: canonicalDistributedPrePlanStudyExecutionKindSchema,
  workerClass: canonicalDistributedPrePlanStudyWorkerClassSchema,
  operationId: identity,
  profileId: identity,
  modelId: identity.nullable(),
  maximumAttempts: z.number().int().positive().max(10),
  leaseDurationMs: z.number().int().min(30_000).max(15 * 60_000),
  attemptDeadlineDurationMs: z.number().int().min(60_000).max(24 * 60 * 60_000),
  resourceEnvelope: canonicalDistributedPrePlanStudyResourceEnvelopeSchema,
  providerRateCardSnapshotDigestSha256: sha256,
  infrastructureRateCardSnapshotDigestSha256: sha256,
  maximumAuthorizedInternalCostMicrosPerAttempt: positiveMoneyMicros,
  inputBindingHash: sha256,
  workItemHash: sha256,
}).strict().superRefine((workItem, context) => {
  const modelRequired = workItem.executionKind !== 'deterministic_tool'
  if (
    workItem.attemptDeadlineDurationMs < workItem.leaseDurationMs
    || modelRequired !== (workItem.modelId !== null)
    || workItem.workItemHash !== canonicalDistributedPrePlanStudyWorkItemHash(workItem)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study work-item authority is inconsistent.',
    })
  }
})

export const canonicalDistributedPrePlanStudySeedSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-seed-v1'),
  runId: identity,
  planId: identity,
  planVersion: identity,
  planDigestSha256: sha256,
  planCreatedAt: timestamp,
  captionOcrIncluded: z.boolean(),
  identity: canonicalDistributedPrePlanStudyIdentitySchema,
  studyUsageApprovalId: identity,
  studyUsageApprovalDigestSha256: sha256,
  internalCostBudgetId: identity,
  maximumAuthorizedInternalCostMicros: positiveMoneyMicros,
  currency: z.literal('USD'),
  wholeStudyTimeoutApplied: z.literal(false),
  browserSessionRequiredForCompletion: z.literal(false),
  workItems: z.array(canonicalDistributedPrePlanStudyWorkItemSeedSchema)
    .min(1)
    .max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  seedHash: sha256,
}).strict().superRefine((seed, context) => {
  const ids = seed.workItems.map((workItem) => workItem.workItemId)
  const sequences = seed.workItems.map((workItem) => workItem.sequence)
  const known = new Set(ids)
  if (
    new Set(ids).size !== ids.length
    || new Set(sequences).size !== sequences.length
    || seed.identity.identityHash !== canonicalDistributedPrePlanStudyIdentityHash(seed.identity)
    || seed.seedHash !== canonicalDistributedPrePlanStudySeedHash(seed)
    || seed.workItems.reduce((sum, workItem) => sum + workItem.weightBasisPoints, 0) !== 10_000
    || seed.workItems.some((workItem) => (
      workItem.dependencyWorkItemIds.includes(workItem.workItemId)
      || new Set(workItem.dependencyWorkItemIds).size !== workItem.dependencyWorkItemIds.length
      || workItem.dependencyWorkItemIds.some((dependencyId) => !known.has(dependencyId))
    ))
    || hasDependencyCycle(seed.workItems)
    || seed.workItems.reduce((sum, workItem) => (
      sum + BigInt(workItem.maximumAuthorizedInternalCostMicrosPerAttempt)
        * BigInt(workItem.maximumAttempts)
    ), 0n) > BigInt(seed.maximumAuthorizedInternalCostMicros)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study seed authority or work graph is inconsistent.',
    })
  }
})

const requestBase = {
  runId: identity,
  studyIdentityHash: sha256,
  idempotencyKey,
  requestHash: sha256,
}

export const canonicalDistributedPrePlanStudyEnqueueRequestSchema = z.object({
  ...requestBase,
  seed: canonicalDistributedPrePlanStudySeedSchema,
  controllerIdentityEvidenceHash: sha256,
  requestedAt: timestamp,
}).strict().superRefine((request, context) => {
  if (
    request.runId !== request.seed.runId
    || request.studyIdentityHash !== request.seed.identity.identityHash
  ) context.addIssue({ code: 'custom', message: 'Study enqueue identity is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyClaimRequestSchema = z.object({
  ...requestBase,
  workerClass: canonicalDistributedPrePlanStudyWorkerClassSchema,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  capacityAdmissionEvidenceHash: sha256,
  acceptedAt: timestamp,
}).strict()

export const canonicalDistributedPrePlanStudyLeaseCredentialSchema = z.string()
  .regex(/^rppsl_v1_[a-f0-9]{64}$/u)

const attemptRequestBase = {
  ...requestBase,
  attemptId: identity,
  leaseCredential: canonicalDistributedPrePlanStudyLeaseCredentialSchema,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
}

export const canonicalDistributedPrePlanStudyCheckpointInputSchema = z.object({
  checkpointSequence: positiveSafeInteger,
  progressBasisPoints: z.number().int().positive().max(10_000),
  progressEvidenceHash: sha256,
  privateCheckpointObjectId: identity,
  privateCheckpointObjectIdentityHash: sha256,
  checkpointPayloadDigestSha256: sha256,
}).strict()

export const canonicalDistributedPrePlanStudyHeartbeatRequestSchema = z.object({
  ...attemptRequestBase,
  checkpoint: canonicalDistributedPrePlanStudyCheckpointInputSchema,
  heartbeatAt: timestamp,
}).strict()

export const canonicalDistributedPrePlanStudyPrivateOutputSchema = z.object({
  outputId: identity,
  outputKind: identity,
  storageObjectId: identity,
  storageObjectIdentityHash: sha256,
  checksumSha256: sha256,
  byteLength: safeInteger.max(Number.MAX_SAFE_INTEGER),
  mimeType: z.string().trim().min(1).max(160),
  lineageHash: sha256,
  privateCreateOnlyReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathPersisted: z.literal(false),
  outputHash: sha256,
}).strict().superRefine((output, context) => {
  if (output.outputHash !== canonicalDistributedPrePlanStudyOutputHash(output)) {
    context.addIssue({ code: 'custom', message: 'Private study output hash is invalid.' })
  }
})

export const canonicalDistributedPrePlanStudyDomainWorkResultSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-domain-work-result-v1'),
  outputDigestSha256: sha256,
  observedWallClockMs: positiveSafeInteger.max(7 * 24 * 60 * 60 * 1_000),
  runtimeSource: z.enum(['verified_local', 'verified_live', 'verified_mock']),
  completionAuthority: z.enum(['authoritative', 'controlled_mock']),
  completionAttestation: z.object({
    schemaVersion: z.literal('edit-reference-long-form-study-completion-attestation-v2'),
    coverageQaWorkItemId: identity,
    coverageQaOutputDigestSha256: sha256,
    requiredOutputManifestDigestSha256: sha256,
    requiredWorkItemCount: positiveSafeInteger.max(
      CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS,
    ),
    verifiedOutputRecordCount: positiveSafeInteger.max(
      CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS,
    ),
    temporalCoverageRatio: z.literal(1),
    chunkStageCoverageRatio: z.literal(1),
    continuousAudioCoverageRatio: z.union([z.literal(0), z.literal(1)]),
    everyRequiredOutputVerified: z.literal(true),
    everySemanticRuntimeAuthoritative: z.literal(true),
    everyRequiredOutputCostAuthoritySatisfied: z.literal(true),
    coverageQaPassed: z.literal(true),
    finalizedAt: timestamp,
  }).strict().nullable(),
  resultHash: sha256,
}).strict().superRefine((result, context) => {
  if (
    (result.runtimeSource === 'verified_mock') !==
      (result.completionAuthority === 'controlled_mock')
    || result.resultHash !== canonicalDistributedPrePlanStudyDomainWorkResultHash(result)
  ) {
    context.addIssue({ code: 'custom', message: 'Study domain work result is invalid.' })
  }
})

export const canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-attempt-cost-v1'),
  evidenceStatus: z.enum(['final', 'provisional_provider_reconciliation_required']),
  attemptId: identity,
  attemptStartHash: sha256,
  startedAt: timestamp,
  finishedAt: timestamp,
  approvedUsageEstimateId: identity,
  internalCostBudgetId: identity,
  maximumAuthorizedInternalCostMicros: positiveMoneyMicros,
  providerUsageEvidenceDigestSha256: sha256,
  providerRateCardSnapshotDigestSha256: sha256,
  providerCostMicros: moneyMicros,
  infrastructureUsageEvidenceDigestSha256: sha256,
  infrastructureRateCardSnapshotDigestSha256: sha256,
  infrastructureCostMicros: moneyMicros,
  totalInternalCostMicros: moneyMicros,
  usageEventIds: z.array(identity).min(1).max(128),
  internalCostRecordIds: z.array(identity).min(1).max(128),
  failedOrUnknownAttemptCostRetained: z.literal(true),
  invoiceReconciled: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((evidence, context) => {
  if (
    Date.parse(evidence.startedAt) >= Date.parse(evidence.finishedAt)
    || BigInt(evidence.totalInternalCostMicros) !==
      BigInt(evidence.providerCostMicros) + BigInt(evidence.infrastructureCostMicros)
    || BigInt(evidence.totalInternalCostMicros) >
      BigInt(evidence.maximumAuthorizedInternalCostMicros)
    || new Set(evidence.usageEventIds).size !== evidence.usageEventIds.length
    || new Set(evidence.internalCostRecordIds).size !== evidence.internalCostRecordIds.length
    || evidence.evidenceHash !== canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(evidence)
  ) {
    context.addIssue({ code: 'custom', message: 'Study attempt cost evidence is invalid.' })
  }
})

export const canonicalDistributedPrePlanStudyCompletionRequestSchema = z.object({
  ...attemptRequestBase,
  outputs: z.array(canonicalDistributedPrePlanStudyPrivateOutputSchema).max(32),
  domainWorkResult: canonicalDistributedPrePlanStudyDomainWorkResultSchema.optional(),
  costEvidence: canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema,
  completionEvidenceHash: sha256,
  completedAt: timestamp,
}).strict().superRefine((request, context) => {
  if (request.outputs.length < 1 && request.domainWorkResult === undefined) {
    context.addIssue({
      code: 'custom',
      message: 'Study completion requires private output or a domain work result.',
    })
  }
})

export const canonicalDistributedPrePlanStudyFailureCategorySchema = z.enum([
  'provider_error',
  'provider_unknown_outcome',
  'source_changed',
  'validation_error',
  'storage_capacity',
  'execution_timeout',
  'cancelled',
  'unknown_internal',
])

export const canonicalDistributedPrePlanStudyFailureRequestSchema = z.object({
  ...attemptRequestBase,
  costEvidence: canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema,
  failureCategory: canonicalDistributedPrePlanStudyFailureCategorySchema,
  sanitizedFailureCode: safeCode,
  failureEvidenceHash: sha256,
  failedAt: timestamp,
}).strict()

export const canonicalDistributedPrePlanStudyControlRequestSchema = z.object({
  ...requestBase,
  action: z.enum(['pause', 'resume', 'cancel', 'recover']),
  expectedRunRevision: positiveSafeInteger,
  controllerIdentityEvidenceHash: sha256,
  requestedAt: timestamp,
}).strict()

export const canonicalDistributedPrePlanStudyRecoveryRequestSchema = z.object({
  ...requestBase,
  controllerIdentityEvidenceHash: sha256,
  observedAt: timestamp,
}).strict()

export const canonicalDistributedPrePlanStudyCheckpointSchema =
  canonicalDistributedPrePlanStudyCheckpointInputSchema.extend({
    attemptId: identity,
    recordedAt: timestamp,
    checkpointHash: sha256,
  }).strict().superRefine((checkpoint, context) => {
    if (checkpoint.checkpointHash !== canonicalDistributedPrePlanStudyCheckpointHash(checkpoint)) {
      context.addIssue({ code: 'custom', message: 'Study checkpoint hash is invalid.' })
    }
  })

export const canonicalDistributedPrePlanStudyAttemptStartSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-attempt-start-v1'),
  attemptId: identity,
  workItemId: identity,
  attemptNumber: z.number().int().positive().max(10),
  leaseId: identity,
  leaseCredentialHashSha256: sha256,
  workerClass: canonicalDistributedPrePlanStudyWorkerClassSchema,
  workerIdentityEvidenceHash: sha256,
  workerReceiptHash: sha256,
  capacityAdmissionEvidenceHash: sha256,
  workItemHash: sha256,
  inputBindingHash: sha256,
  providerRateCardSnapshotDigestSha256: sha256,
  infrastructureRateCardSnapshotDigestSha256: sha256,
  maximumAuthorizedInternalCostMicros: positiveMoneyMicros,
  startedAt: timestamp,
  initialLeaseExpiresAt: timestamp,
  attemptDeadlineAt: timestamp,
  resumeCheckpointHash: sha256.nullable(),
  approvedPlanSnapshotRequired: z.literal(false),
  approvedCreditReservationRequired: z.literal(false),
  attemptStartHash: sha256,
}).strict().superRefine((attempt, context) => {
  if (
    Date.parse(attempt.startedAt) >= Date.parse(attempt.initialLeaseExpiresAt)
    || Date.parse(attempt.initialLeaseExpiresAt) > Date.parse(attempt.attemptDeadlineAt)
    || attempt.attemptStartHash !== canonicalDistributedPrePlanStudyAttemptStartHash(attempt)
  ) context.addIssue({ code: 'custom', message: 'Study attempt start is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyTerminalSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-attempt-terminal-v1'),
  terminalKind: z.enum(['completion', 'failure', 'timeout']),
  terminalEvidenceHash: sha256,
  costEvidence: canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema,
  outputs: z.array(canonicalDistributedPrePlanStudyPrivateOutputSchema).max(32),
  domainWorkResult: canonicalDistributedPrePlanStudyDomainWorkResultSchema.optional(),
  failureCategory: canonicalDistributedPrePlanStudyFailureCategorySchema.nullable(),
  sanitizedFailureCode: safeCode.nullable(),
  queueDisposition: z.enum([
    'completed',
    'retry_available',
    'attempts_exhausted',
    'blocked_unknown_outcome',
    'cancelled',
  ]),
  automaticRetryStarted: z.literal(false),
  unknownOutcomeReconciliationRequired: z.boolean(),
  terminalAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((terminal, context) => {
  const completion = terminal.terminalKind === 'completion'
  const unknown = terminal.unknownOutcomeReconciliationRequired
  if (
    (completion && (
      (terminal.outputs.length < 1 && terminal.domainWorkResult === undefined)
      || terminal.failureCategory !== null
      || terminal.sanitizedFailureCode !== null
      || terminal.queueDisposition !== 'completed'
      || terminal.costEvidence.evidenceStatus !== 'final'
      || unknown
    ))
    || (!completion && (
      terminal.outputs.length !== 0
      || terminal.domainWorkResult !== undefined
    ))
    || (terminal.terminalKind === 'failure' && (
      terminal.failureCategory === null
      || terminal.sanitizedFailureCode === null
    ))
    || (terminal.terminalKind === 'timeout' && (
      terminal.failureCategory !== 'execution_timeout'
      || terminal.sanitizedFailureCode !== 'ATTEMPT_LEASE_EXPIRED'
    ))
    || unknown !== (
      terminal.queueDisposition === 'blocked_unknown_outcome'
      && terminal.costEvidence.evidenceStatus ===
        'provisional_provider_reconciliation_required'
    )
    || terminal.terminalHash !== canonicalDistributedPrePlanStudyTerminalHash(terminal)
  ) context.addIssue({ code: 'custom', message: 'Study terminal outcome is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyAttemptViewSchema = z.object({
  attemptStart: canonicalDistributedPrePlanStudyAttemptStartSchema,
  state: z.enum(['running', 'completed', 'failed', 'timed_out']),
  heartbeatAt: timestamp,
  heartbeatCount: safeInteger,
  leaseExpiresAt: timestamp,
  latestCheckpoint: canonicalDistributedPrePlanStudyCheckpointSchema.nullable(),
  terminal: canonicalDistributedPrePlanStudyTerminalSchema.nullable(),
  attemptHash: sha256,
}).strict().superRefine((attempt, context) => {
  const terminal = attempt.terminal !== null
  if (
    terminal !== ['completed', 'failed', 'timed_out'].includes(attempt.state)
    || Date.parse(attempt.heartbeatAt) > Date.parse(attempt.leaseExpiresAt)
    || Date.parse(attempt.leaseExpiresAt) <
      Date.parse(attempt.attemptStart.initialLeaseExpiresAt)
    || Date.parse(attempt.leaseExpiresAt) >
      Date.parse(attempt.attemptStart.attemptDeadlineAt)
    || (attempt.latestCheckpoint !== null &&
      attempt.latestCheckpoint.attemptId !== attempt.attemptStart.attemptId)
    || attempt.attemptHash !== canonicalDistributedPrePlanStudyAttemptViewHash(attempt)
  ) context.addIssue({ code: 'custom', message: 'Study attempt view is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyWorkItemViewSchema = z.object({
  workItemId: identity,
  sequence: positiveSafeInteger,
  stageId: identity,
  required: z.boolean(),
  workerClass: canonicalDistributedPrePlanStudyWorkerClassSchema,
  dependencyWorkItemIds: z.array(identity).max(128),
  state: z.enum(['queued', 'running', 'retry_wait', 'completed', 'blocked', 'cancelled']),
  attemptCount: safeInteger.max(10),
  maximumAttempts: z.number().int().positive().max(10),
  remainingAttempts: safeInteger.max(10),
  latestCheckpoint: canonicalDistributedPrePlanStudyCheckpointSchema.nullable(),
  completedOutputHashes: z.array(sha256).max(33),
  cumulativeInternalCostMicros: moneyMicros,
  activeAttemptId: identity.nullable(),
  blockerCode: safeCode.nullable(),
  workItemHash: sha256,
}).strict().superRefine((workItem, context) => {
  if (
    workItem.remainingAttempts !== Math.max(0, workItem.maximumAttempts - workItem.attemptCount)
    || (workItem.state === 'running') !== (workItem.activeAttemptId !== null)
    || (workItem.state === 'completed') !== (workItem.completedOutputHashes.length > 0)
  ) context.addIssue({ code: 'custom', message: 'Study work-item view is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyRunViewSchema = z.object({
  runId: identity,
  planId: identity,
  planDigestSha256: sha256,
  studyIdentityHash: sha256,
  state: z.enum([
    'queued',
    'running',
    'paused',
    'cancellation_requested',
    'completed',
    'cancelled',
    'needs_operator_review',
  ]),
  revision: positiveSafeInteger,
  totalWorkItemCount: positiveSafeInteger.max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  completedWorkItemCount: safeInteger.max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  runningWorkItemCount: safeInteger.max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  blockedWorkItemCount: safeInteger.max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  completedWeightBasisPoints: z.number().int().nonnegative().max(10_000),
  cumulativeInternalCostMicros: moneyMicros,
  maximumAuthorizedInternalCostMicros: positiveMoneyMicros,
  pauseRequestedAt: timestamp.nullable(),
  cancelRequestedAt: timestamp.nullable(),
  recoveryGeneration: safeInteger,
  createdAt: timestamp,
  updatedAt: timestamp,
  automaticRetryStarted: z.literal(false),
  browserSessionRequiredForCompletion: z.literal(false),
  wholeStudyTimeoutApplied: z.literal(false),
  runHash: sha256,
}).strict().superRefine((run, context) => {
  if (
    run.completedWorkItemCount + run.runningWorkItemCount + run.blockedWorkItemCount >
      run.totalWorkItemCount
    || BigInt(run.cumulativeInternalCostMicros) >
      BigInt(run.maximumAuthorizedInternalCostMicros)
    || (run.state === 'paused') !== (run.pauseRequestedAt !== null)
    || (['cancellation_requested', 'cancelled'].includes(run.state)
      && run.cancelRequestedAt === null)
    || (run.cancelRequestedAt !== null
      && !['cancellation_requested', 'cancelled', 'needs_operator_review'].includes(run.state))
    || Date.parse(run.updatedAt) < Date.parse(run.createdAt)
    || run.runHash !== canonicalDistributedPrePlanStudyRunViewHash(run)
  ) context.addIssue({ code: 'custom', message: 'Study run view is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyOperationSchema = z.enum([
  'enqueue',
  'claim_and_start',
  'heartbeat_and_checkpoint',
  'complete',
  'fail',
  'control',
])
const canonicalDistributedPrePlanStudyTransactionOperationSchema = z.union([
  canonicalDistributedPrePlanStudyOperationSchema,
  z.literal('recover_expired_lease'),
])

export const canonicalDistributedPrePlanStudyTransactionSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-transaction-v1'),
  transactionId: identity,
  operation: canonicalDistributedPrePlanStudyTransactionOperationSchema,
  runId: identity,
  studyIdentityHash: sha256,
  revisionBefore: safeInteger,
  revisionAfter: positiveSafeInteger,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  auditEventHash: sha256,
  committedAt: timestamp,
  transactionHash: sha256,
}).strict().superRefine((transaction, context) => {
  if (
    transaction.revisionAfter !== transaction.revisionBefore + 1
    || transaction.transactionHash !==
      canonicalDistributedPrePlanStudyTransactionHash(transaction)
  ) context.addIssue({ code: 'custom', message: 'Study transaction is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyPersistenceBoundariesSchema = z.object({
  serviceOnly: z.literal(true),
  authorityClass: z.literal('pre_plan_edit_reference_long_form_study'),
  authenticatedTenantDerivedServerSide: z.literal(true),
  exactReferenceStudySourceAndPlanBindingRequired: z.literal(true),
  approvedPlanSnapshotRequired: z.literal(false),
  approvedCreditReservationRequired: z.literal(false),
  approvedEditAuthorityFabricated: z.literal(false),
  workGraphServerDerived: z.literal(true),
  callerSelectedWorkItemAttemptLeaseExpiryCostOrRetryAllowed: z.literal(false),
  oneActiveDigestOnlyLeasePerWorkItem: z.literal(true),
  heartbeatAndCheckpointShareTransaction: z.literal(true),
  terminalOutputAndUsageShareTransaction: z.literal(true),
  exactDurableResponseAssociationRequired: z.literal(true),
  rawMediaSignedUrlProviderCredentialOrLocalPathPersisted: z.literal(false),
  providerAndInfrastructureInternalCostSeparated: z.literal(true),
  customerPriceCreditsServiceFeeWalletBillingOrSettlementIncluded: z.literal(false),
  automaticRetryStarted: z.literal(false),
  browserClaimAllowed: z.literal(false),
  browserSessionRequiredForCompletion: z.literal(false),
  fixedWholeStudyTimeoutApplied: z.literal(false),
  workerDispatchPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  cloudCallPerformed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalDistributedPrePlanStudyMutationResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RESPONSE_VERSION),
  operation: canonicalDistributedPrePlanStudyOperationSchema,
  transaction: canonicalDistributedPrePlanStudyTransactionSchema,
  run: canonicalDistributedPrePlanStudyRunViewSchema,
  workItem: canonicalDistributedPrePlanStudyWorkItemViewSchema.nullable(),
  attempt: canonicalDistributedPrePlanStudyAttemptViewSchema.nullable(),
  boundaries: canonicalDistributedPrePlanStudyPersistenceBoundariesSchema,
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.operation !== response.transaction.operation
    || response.run.runId !== response.transaction.runId
    || response.run.studyIdentityHash !== response.transaction.studyIdentityHash
    || (response.attempt !== null && response.workItem?.workItemId !==
      response.attempt.attemptStart.workItemId)
    || response.responseHash !== canonicalDistributedPrePlanStudyMutationResponseHash(response)
  ) context.addIssue({ code: 'custom', message: 'Study mutation response is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyRecoveryResponseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RECOVERY_RESPONSE_VERSION,
  ),
  operation: z.literal('recover_expired_lease'),
  runId: identity,
  studyIdentityHash: sha256,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  observedAt: timestamp,
  transaction: canonicalDistributedPrePlanStudyTransactionSchema.nullable(),
  run: canonicalDistributedPrePlanStudyRunViewSchema,
  workItem: canonicalDistributedPrePlanStudyWorkItemViewSchema.nullable(),
  attempt: canonicalDistributedPrePlanStudyAttemptViewSchema.nullable(),
  expiredAttemptRecovered: z.boolean(),
  boundaries: canonicalDistributedPrePlanStudyPersistenceBoundariesSchema.extend({
    expiredAttemptSelectedByTransaction: z.literal(true),
    callerSelectedAttemptOrExpiryAllowed: z.literal(false),
    unknownProviderOutcomeMustReconcileBeforeRetry: z.literal(true),
  }).strict(),
  responseHash: sha256,
}).strict().superRefine((response, context) => {
  if (
    response.expiredAttemptRecovered !== (response.transaction !== null)
    || response.expiredAttemptRecovered !== (response.attempt !== null)
    || response.expiredAttemptRecovered !== (response.workItem !== null)
    || response.run.runId !== response.runId
    || response.run.studyIdentityHash !== response.studyIdentityHash
    || (response.transaction !== null && (
      response.transaction.operation !== 'recover_expired_lease'
      || response.transaction.runId !== response.runId
      || response.transaction.studyIdentityHash !== response.studyIdentityHash
      || response.transaction.requestHash !== response.requestHash
      || response.transaction.idempotencyKeyHash !== response.idempotencyKeyHash
    ))
    || response.responseHash !== canonicalDistributedPrePlanStudyRecoveryResponseHash(response)
  ) context.addIssue({ code: 'custom', message: 'Study recovery response is inconsistent.' })
})

export const canonicalDistributedPrePlanStudyPortDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION),
  adapterId: identity,
  implementationClass: z.enum(['in_memory_contract_fixture', 'database_transaction_adapter']),
  serviceOnly: z.literal(true),
  exactInputAndOutputSchemasEnforced: z.literal(true),
  prePlanStudyAuthority: z.literal(true),
  approvedEditAuthorityReusedOrFabricated: z.literal(false),
  serializableTransactionSemanticsExercised: z.boolean(),
  durableResponseReplaySemanticsExercised: z.boolean(),
  digestOnlyLeaseSemanticsExercised: z.boolean(),
  monotonicCheckpointSemanticsExercised: z.boolean(),
  terminalUsageAtomicitySemanticsExercised: z.boolean(),
  expiredLeaseRecoverySemanticsExercised: z.boolean(),
  databaseBackend: z.enum(['none', 'postgres']),
  distributedDatabaseTransactionVerified: z.boolean(),
  multiReplicaDurabilityVerified: z.boolean(),
  authenticatedWorkerDispatchVerified: z.boolean(),
  livePrivateObjectReadVerified: z.boolean(),
  liveSupabaseOrPostgresCallPerformed: z.boolean(),
  cloudCallPerformed: z.boolean(),
  productionAuthority: z.literal(false),
  descriptorHash: sha256,
}).strict().superRefine((descriptor, context) => {
  if (
    (descriptor.implementationClass === 'in_memory_contract_fixture' && (
      descriptor.databaseBackend !== 'none'
      || descriptor.distributedDatabaseTransactionVerified
      || descriptor.multiReplicaDurabilityVerified
      || descriptor.authenticatedWorkerDispatchVerified
      || descriptor.livePrivateObjectReadVerified
      || descriptor.liveSupabaseOrPostgresCallPerformed
      || descriptor.cloudCallPerformed
    ))
    || (descriptor.databaseBackend === 'none' && (
      descriptor.distributedDatabaseTransactionVerified
      || descriptor.multiReplicaDurabilityVerified
      || descriptor.liveSupabaseOrPostgresCallPerformed
    ))
    || (descriptor.multiReplicaDurabilityVerified &&
      !descriptor.distributedDatabaseTransactionVerified)
  ) context.addIssue({ code: 'custom', message: 'Study adapter readiness is inconsistent.' })
})

export type CanonicalDistributedPrePlanStudyIdentity = z.infer<
  typeof canonicalDistributedPrePlanStudyIdentitySchema
>
export type CanonicalDistributedPrePlanStudyWorkItemSeed = z.infer<
  typeof canonicalDistributedPrePlanStudyWorkItemSeedSchema
>
export type CanonicalDistributedPrePlanStudySeed = z.infer<
  typeof canonicalDistributedPrePlanStudySeedSchema
>
export type CanonicalDistributedPrePlanStudyAttemptCostEvidence = z.infer<
  typeof canonicalDistributedPrePlanStudyAttemptCostEvidenceSchema
>
export type CanonicalDistributedPrePlanStudyCheckpoint = z.infer<
  typeof canonicalDistributedPrePlanStudyCheckpointSchema
>
export type CanonicalDistributedPrePlanStudyAttemptView = z.infer<
  typeof canonicalDistributedPrePlanStudyAttemptViewSchema
>
export type CanonicalDistributedPrePlanStudyWorkItemView = z.infer<
  typeof canonicalDistributedPrePlanStudyWorkItemViewSchema
>
export type CanonicalDistributedPrePlanStudyRunView = z.infer<
  typeof canonicalDistributedPrePlanStudyRunViewSchema
>
export type CanonicalDistributedPrePlanStudyMutationResponse = z.infer<
  typeof canonicalDistributedPrePlanStudyMutationResponseSchema
>
export type CanonicalDistributedPrePlanStudyRecoveryResponse = z.infer<
  typeof canonicalDistributedPrePlanStudyRecoveryResponseSchema
>
export type CanonicalDistributedPrePlanStudyPortDescriptor = z.infer<
  typeof canonicalDistributedPrePlanStudyPortDescriptorSchema
>

export interface CanonicalDistributedPrePlanStudyPortResult<T> {
  readonly idempotencyStatus: 'inserted' | 'exact_replay'
  readonly response: T
  readonly transientLeaseCredential: string | null
}

export interface CanonicalDistributedPrePlanStudyTransactionAdapter {
  readonly descriptor: CanonicalDistributedPrePlanStudyPortDescriptor
  enqueue(input: z.infer<typeof canonicalDistributedPrePlanStudyEnqueueRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  claimAndStart(input: z.infer<typeof canonicalDistributedPrePlanStudyClaimRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  heartbeatAndCheckpoint(input: z.infer<typeof canonicalDistributedPrePlanStudyHeartbeatRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  complete(input: z.infer<typeof canonicalDistributedPrePlanStudyCompletionRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  fail(input: z.infer<typeof canonicalDistributedPrePlanStudyFailureRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  control(input: z.infer<typeof canonicalDistributedPrePlanStudyControlRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>>
  recoverExpiredLease(input: z.infer<typeof canonicalDistributedPrePlanStudyRecoveryRequestSchema>):
    Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyRecoveryResponse>>
}

const boundaryBrands = new WeakSet<object>()
const mutationResultSchema = z.object({
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  response: canonicalDistributedPrePlanStudyMutationResponseSchema,
  transientLeaseCredential: canonicalDistributedPrePlanStudyLeaseCredentialSchema.nullable(),
}).strict()
const recoveryResultSchema = z.object({
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  response: canonicalDistributedPrePlanStudyRecoveryResponseSchema,
  transientLeaseCredential: z.null(),
}).strict()

export function createCanonicalDistributedPrePlanStudyStatePort(
  adapter: CanonicalDistributedPrePlanStudyTransactionAdapter,
): CanonicalDistributedPrePlanStudyTransactionAdapter {
  const descriptor = assertDescriptor(adapter.descriptor)
  const boundary: CanonicalDistributedPrePlanStudyTransactionAdapter = {
    descriptor,
    enqueue: (input) => invokeMutation(
      'enqueue',
      canonicalDistributedPrePlanStudyEnqueueRequestSchema,
      adapter.enqueue.bind(adapter),
      input,
    ),
    claimAndStart: (input) => invokeMutation(
      'claim_and_start',
      canonicalDistributedPrePlanStudyClaimRequestSchema,
      adapter.claimAndStart.bind(adapter),
      input,
    ),
    heartbeatAndCheckpoint: (input) => invokeMutation(
      'heartbeat_and_checkpoint',
      canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
      adapter.heartbeatAndCheckpoint.bind(adapter),
      input,
    ),
    complete: (input) => invokeMutation(
      'complete',
      canonicalDistributedPrePlanStudyCompletionRequestSchema,
      adapter.complete.bind(adapter),
      input,
    ),
    fail: (input) => invokeMutation(
      'fail',
      canonicalDistributedPrePlanStudyFailureRequestSchema,
      adapter.fail.bind(adapter),
      input,
    ),
    control: (input) => invokeMutation(
      'control',
      canonicalDistributedPrePlanStudyControlRequestSchema,
      adapter.control.bind(adapter),
      input,
    ),
    recoverExpiredLease: async (input) => {
      const request = parseRequest(canonicalDistributedPrePlanStudyRecoveryRequestSchema, input)
      assertRequestHash('recover_expired_lease', request)
      const result = recoveryResultSchema.parse(await adapter.recoverExpiredLease(request))
      const response = assertCanonicalDistributedPrePlanStudyRecoveryResponseIntegrity(
        result.response,
      )
      assertResponseBinding(request, response)
      return { ...result, response }
    },
  }
  Object.freeze(boundary)
  boundaryBrands.add(boundary)
  return boundary
}

export function assertCanonicalDistributedPrePlanStudyStatePort(
  input: unknown,
): asserts input is CanonicalDistributedPrePlanStudyTransactionAdapter {
  if (!input || typeof input !== 'object' || !boundaryBrands.has(input)) {
    throw atomicityError('Canonical pre-plan study state port is not process-branded.')
  }
}

export function assertCanonicalDistributedPrePlanStudyProductionAuthority(
  input: unknown,
): never {
  assertCanonicalDistributedPrePlanStudyStatePort(input)
  const descriptor = (input as CanonicalDistributedPrePlanStudyTransactionAdapter).descriptor
  if (
    descriptor.implementationClass !== 'database_transaction_adapter'
    || descriptor.databaseBackend !== 'postgres'
    || !descriptor.distributedDatabaseTransactionVerified
    || !descriptor.multiReplicaDurabilityVerified
    || !descriptor.authenticatedWorkerDispatchVerified
    || !descriptor.livePrivateObjectReadVerified
    || !descriptor.liveSupabaseOrPostgresCallPerformed
  ) {
    throw atomicityError(
      'Pre-plan study production authority requires live database, multi-replica, worker, and private-object evidence.',
    )
  }
  throw atomicityError(
    'Pre-plan study state port v1 is source-contract-only. A reviewed forward version must bind same-release live evidence before production activation.',
  )
}

export function createCanonicalDistributedPrePlanStudyFixtureDescriptor(
  adapterId = 'canonical_pre_plan_study_in_memory_fixture_v1',
): CanonicalDistributedPrePlanStudyPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
    adapterId,
    implementationClass: 'in_memory_contract_fixture',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanStudyAuthority: true,
    approvedEditAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: true,
    durableResponseReplaySemanticsExercised: true,
    digestOnlyLeaseSemanticsExercised: true,
    monotonicCheckpointSemanticsExercised: true,
    terminalUsageAtomicitySemanticsExercised: true,
    expiredLeaseRecoverySemanticsExercised: true,
    databaseBackend: 'none',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    liveSupabaseOrPostgresCallPerformed: false,
    cloudCallPerformed: false,
    productionAuthority: false,
  })
}

/**
 * Describes a server-only database adapter whose transport contract has been
 * validated but whose live Postgres, multi-replica, worker, and private-object
 * evidence has not been admitted. This descriptor can never authorize a
 * production runtime because every live-evidence flag remains false and the
 * V1 state port itself has no promotion path.
 */
export function createCanonicalDistributedPrePlanStudyUnverifiedDatabaseAdapterDescriptor(
  adapterId = 'canonical_pre_plan_study_database_adapter_contract_v1',
): CanonicalDistributedPrePlanStudyPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
    adapterId,
    implementationClass: 'database_transaction_adapter',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanStudyAuthority: true,
    approvedEditAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: false,
    durableResponseReplaySemanticsExercised: false,
    digestOnlyLeaseSemanticsExercised: false,
    monotonicCheckpointSemanticsExercised: false,
    terminalUsageAtomicitySemanticsExercised: false,
    expiredLeaseRecoverySemanticsExercised: false,
    databaseBackend: 'none',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    liveSupabaseOrPostgresCallPerformed: false,
    cloudCallPerformed: false,
    productionAuthority: false,
  })
}

/**
 * Describes the disposable canonical-V3 loopback Postgres proof. Unlike the
 * contract-only descriptor above, this records the local database transaction,
 * replay, lease, checkpoint, terminal-cost, and recovery evidence that was
 * actually exercised. It deliberately keeps every distributed/worker/object
 * and production flag false, so local reset evidence cannot self-promote.
 */
export function createCanonicalDistributedPrePlanStudyLocalPostgresDescriptor(
  adapterId = 'canonical_pre_plan_study_local_postgres_v1',
): CanonicalDistributedPrePlanStudyPortDescriptor {
  return descriptorWithHash({
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
    adapterId,
    implementationClass: 'database_transaction_adapter',
    serviceOnly: true,
    exactInputAndOutputSchemasEnforced: true,
    prePlanStudyAuthority: true,
    approvedEditAuthorityReusedOrFabricated: false,
    serializableTransactionSemanticsExercised: true,
    durableResponseReplaySemanticsExercised: true,
    digestOnlyLeaseSemanticsExercised: true,
    monotonicCheckpointSemanticsExercised: true,
    terminalUsageAtomicitySemanticsExercised: true,
    expiredLeaseRecoverySemanticsExercised: true,
    databaseBackend: 'postgres',
    distributedDatabaseTransactionVerified: false,
    multiReplicaDurabilityVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    liveSupabaseOrPostgresCallPerformed: true,
    cloudCallPerformed: false,
    productionAuthority: false,
  })
}

export function canonicalDistributedPrePlanStudyPersistenceBoundaries() {
  return {
    serviceOnly: true as const,
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    authenticatedTenantDerivedServerSide: true as const,
    exactReferenceStudySourceAndPlanBindingRequired: true as const,
    approvedPlanSnapshotRequired: false as const,
    approvedCreditReservationRequired: false as const,
    approvedEditAuthorityFabricated: false as const,
    workGraphServerDerived: true as const,
    callerSelectedWorkItemAttemptLeaseExpiryCostOrRetryAllowed: false as const,
    oneActiveDigestOnlyLeasePerWorkItem: true as const,
    heartbeatAndCheckpointShareTransaction: true as const,
    terminalOutputAndUsageShareTransaction: true as const,
    exactDurableResponseAssociationRequired: true as const,
    rawMediaSignedUrlProviderCredentialOrLocalPathPersisted: false as const,
    providerAndInfrastructureInternalCostSeparated: true as const,
    customerPriceCreditsServiceFeeWalletBillingOrSettlementIncluded: false as const,
    automaticRetryStarted: false as const,
    browserClaimAllowed: false as const,
    browserSessionRequiredForCompletion: false as const,
    fixedWholeStudyTimeoutApplied: false as const,
    workerDispatchPerformed: false as const,
    providerCallPerformed: false as const,
    cloudCallPerformed: false as const,
    productionAuthority: false as const,
  }
}

export function canonicalDistributedPrePlanStudyIdentityHash(
  input: Omit<CanonicalDistributedPrePlanStudyIdentity, 'identityHash'>
    | CanonicalDistributedPrePlanStudyIdentity,
): string {
  const { identityHash: _identityHash, ...payload } = input as CanonicalDistributedPrePlanStudyIdentity
  void _identityHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_identity_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyWorkItemHash(
  input: Omit<CanonicalDistributedPrePlanStudyWorkItemSeed, 'workItemHash'>
    | CanonicalDistributedPrePlanStudyWorkItemSeed,
): string {
  const { workItemHash: _workItemHash, ...payload } = input as CanonicalDistributedPrePlanStudyWorkItemSeed
  void _workItemHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_work_item_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudySeedHash(
  input: Omit<CanonicalDistributedPrePlanStudySeed, 'seedHash'>
    | CanonicalDistributedPrePlanStudySeed,
): string {
  const { seedHash: _seedHash, ...payload } = input as CanonicalDistributedPrePlanStudySeed
  void _seedHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_seed_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyOutputHash(
  input: Record<string, unknown>,
): string {
  const { outputHash: _outputHash, ...payload } = input
  void _outputHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_private_output_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyDomainWorkResultHash(
  input: Record<string, unknown>,
): string {
  const { resultHash: _resultHash, ...payload } = input
  void _resultHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_domain_work_result_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(
  input: Record<string, unknown>,
): string {
  const { evidenceHash: _evidenceHash, ...payload } = input
  void _evidenceHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_attempt_cost_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyCheckpointHash(
  input: Record<string, unknown>,
): string {
  const { checkpointHash: _checkpointHash, ...payload } = input
  void _checkpointHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_checkpoint_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyAttemptStartHash(
  input: Record<string, unknown>,
): string {
  const { attemptStartHash: _attemptStartHash, ...payload } = input
  void _attemptStartHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_attempt_start_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyTerminalHash(
  input: Record<string, unknown>,
): string {
  const { terminalHash: _terminalHash, ...payload } = input
  void _terminalHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_terminal_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyAttemptViewHash(
  input: Record<string, unknown>,
): string {
  const { attemptHash: _attemptHash, ...payload } = input
  void _attemptHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_attempt_view_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyRunViewHash(
  input: Record<string, unknown>,
): string {
  const { runHash: _runHash, ...payload } = input
  void _runHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_run_view_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyTransactionHash(
  input: Record<string, unknown>,
): string {
  const { transactionHash: _transactionHash, ...payload } = input
  void _transactionHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_transaction_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyMutationResponseHash(
  input: Record<string, unknown>,
): string {
  const { responseHash: _responseHash, ...payload } = input
  void _responseHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_mutation_response_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyRecoveryResponseHash(
  input: Record<string, unknown>,
): string {
  const { responseHash: _responseHash, ...payload } = input
  void _responseHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_recovery_response_v1',
    payload,
  })
}

export function canonicalDistributedPrePlanStudyRequestHash(
  operation: string,
  request: Record<string, unknown>,
): string {
  const {
    idempotencyKey: _idempotencyKey,
    requestHash: _requestHash,
    leaseCredential,
    ...payload
  } = request
  void _idempotencyKey
  void _requestHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_request_v1',
    operation,
    payload: {
      ...payload,
      ...(typeof leaseCredential === 'string'
        ? { leaseCredentialHashSha256: canonicalDistributedPrePlanStudyLeaseCredentialHash(leaseCredential) }
        : {}),
    },
  })
}

export function canonicalDistributedPrePlanStudyIdempotencyKeyHash(value: string): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_idempotency_key_v1',
    value,
  })
}

export function canonicalDistributedPrePlanStudyLeaseCredentialHash(value: string): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_lease_credential_v1',
    value,
  })
}

export function assertCanonicalDistributedPrePlanStudyMutationResponseIntegrity(
  input: unknown,
): CanonicalDistributedPrePlanStudyMutationResponse {
  return canonicalDistributedPrePlanStudyMutationResponseSchema.parse(input)
}

export function assertCanonicalDistributedPrePlanStudyRecoveryResponseIntegrity(
  input: unknown,
): CanonicalDistributedPrePlanStudyRecoveryResponse {
  return canonicalDistributedPrePlanStudyRecoveryResponseSchema.parse(input)
}

async function invokeMutation<TRequest extends z.ZodType>(
  operation: z.infer<typeof canonicalDistributedPrePlanStudyOperationSchema>,
  requestSchema: TRequest,
  adapterOperation: (request: z.infer<TRequest>) => Promise<unknown>,
  input: unknown,
): Promise<CanonicalDistributedPrePlanStudyPortResult<CanonicalDistributedPrePlanStudyMutationResponse>> {
  const request = parseRequest(requestSchema, input)
  const requestRecord = request as Record<string, unknown>
  assertRequestHash(operation, requestRecord)
  const result = mutationResultSchema.parse(await adapterOperation(request))
  const response = assertCanonicalDistributedPrePlanStudyMutationResponseIntegrity(result.response)
  if (response.operation !== operation) {
    throw invalidAdapterResponse('Study adapter returned the wrong operation.')
  }
  assertResponseBinding(requestRecord, response)
  if (operation === 'claim_and_start') {
    if (
      !result.transientLeaseCredential
      || !response.attempt
      || canonicalDistributedPrePlanStudyLeaseCredentialHash(
        result.transientLeaseCredential,
      ) !== response.attempt.attemptStart.leaseCredentialHashSha256
    ) throw invalidAdapterResponse('Study claim did not return its exact derived lease credential.')
  } else if (result.transientLeaseCredential !== null) {
    throw invalidAdapterResponse('Only a study claim may return a transient lease credential.')
  }
  return { ...result, response }
}

function assertRequestHash(operation: string, request: Record<string, unknown>): void {
  if (request.requestHash !== canonicalDistributedPrePlanStudyRequestHash(operation, request)) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_MISMATCH',
      'Canonical pre-plan study request hash is invalid.',
      409,
    )
  }
}

function assertResponseBinding(
  request: Record<string, unknown>,
  response: CanonicalDistributedPrePlanStudyMutationResponse
    | CanonicalDistributedPrePlanStudyRecoveryResponse,
): void {
  const transaction = response.transaction
  const responseRequestHash = 'requestHash' in response
    ? response.requestHash
    : transaction?.requestHash
  const responseIdempotencyKeyHash = 'idempotencyKeyHash' in response
    ? response.idempotencyKeyHash
    : transaction?.idempotencyKeyHash
  const expectedIdempotencyKeyHash =
    canonicalDistributedPrePlanStudyIdempotencyKeyHash(String(request.idempotencyKey))
  if (
    responseRequestHash !== request.requestHash
    || responseIdempotencyKeyHash !== expectedIdempotencyKeyHash
    || response.run.runId !== request.runId
    || response.run.studyIdentityHash !== request.studyIdentityHash
    || (transaction !== null && (
      transaction.requestHash !== request.requestHash
      || transaction.idempotencyKeyHash !== expectedIdempotencyKeyHash
    ))
  ) throw invalidAdapterResponse('Study adapter response lineage is invalid.')
}

function descriptorWithHash(
  payload: Omit<CanonicalDistributedPrePlanStudyPortDescriptor, 'descriptorHash'>,
): CanonicalDistributedPrePlanStudyPortDescriptor {
  return canonicalDistributedPrePlanStudyPortDescriptorSchema.parse({
    ...payload,
    descriptorHash: sha256AuthorityValue({
      domain: 'canonical_distributed_pre_plan_study_port_descriptor_v1',
      payload,
    }),
  })
}

function assertDescriptor(input: unknown): CanonicalDistributedPrePlanStudyPortDescriptor {
  const descriptor = canonicalDistributedPrePlanStudyPortDescriptorSchema.parse(input)
  const { descriptorHash, ...payload } = descriptor
  if (descriptorHash !== sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_port_descriptor_v1',
    payload,
  })) throw atomicityError('Canonical pre-plan study adapter descriptor hash is invalid.')
  return Object.freeze(descriptor)
}

function parseRequest<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical pre-plan study request validation failed.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function hasDependencyCycle(workItems: readonly CanonicalDistributedPrePlanStudyWorkItemSeed[]): boolean {
  const byId = new Map(workItems.map((workItem) => [workItem.workItemId, workItem]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (workItemId: string): boolean => {
    if (visiting.has(workItemId)) return true
    if (visited.has(workItemId)) return false
    visiting.add(workItemId)
    const cyclic = byId.get(workItemId)?.dependencyWorkItemIds.some(visit) ?? false
    visiting.delete(workItemId)
    visited.add(workItemId)
    return cyclic
  }
  return workItems.some((workItem) => visit(workItem.workItemId))
}

function invalidAdapterResponse(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503, {
    requiredGate: 'canonical_pre_plan_study_transaction_adapter_integrity',
  })
}

function atomicityError(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503, {
    requiredGates: [
      'reviewed_pre_plan_study_database_transaction_adapter',
      'disposable_postgres_pre_plan_study_conformance',
      'multi_replica_lease_and_recovery_evidence',
      'authenticated_worker_dispatch_and_private_object_evidence',
    ],
  })
}
