import { z } from 'zod'
import { API_ERROR_CODES } from '../errors/error-codes'

const identitySchema = z.string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })

export const canonicalPrivateJobExecutionFailureCategorySchema = z.enum([
  'runtime_unavailable',
  'execution_timeout',
  'output_validation_failed',
  'authority_changed',
  'unknown_internal',
  'post_commit_reconciliation',
])

export const canonicalPrivateJobExecutionRetryDispositionSchema = z.enum([
  'retry_same_approved_operation',
  'fallback_or_user_review_required',
  'manual_reconciliation_required',
  'server_reconciliation_required',
])

export const executeCanonicalPrivateJobAdapterSchema = z.object({
  workspaceId: identitySchema,
  projectId: identitySchema,
  editSessionId: identitySchema,
  purpose: z.literal('execute_canonical_private_job'),
}).strict()

export const canonicalPrivateJobExecutionAdapterResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-job-execution-adapter-response-v2'),
  source: z.literal('canonical_private_job_execution_adapter'),
  purpose: z.literal('execute_canonical_private_job'),
  identity: z.object({
    workspaceId: identitySchema,
    projectId: identitySchema,
    editSessionId: identitySchema,
    approvedPlanSnapshotId: identitySchema,
    jobId: identitySchema,
    approvedWorkItemId: identitySchema,
    expectedAssetId: identitySchema,
    canonicalToolId: identitySchema.nullable(),
    operationId: identitySchema,
    runnerClass: identitySchema,
  }).strict(),
  result: z.object({
    artifactId: identitySchema,
    contentType: z.string().trim().min(1).max(160),
    sha256: sha256Schema,
    byteLength: z.number().int().positive(),
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  evidence: z.object({
    serverDerivedCanonicalJob: z.literal(true),
    serverDerivedToolAndOperation: z.literal(true),
    fundedReservationVerified: z.literal(true),
    opaqueLeaseClaimed: z.literal(true),
    singleUseDispatchConsumed: z.boolean(),
    privateArtifactPersisted: z.literal(true),
    actualQaPassed: z.literal(true),
    reconciliationPassed: z.literal(true),
    idempotentAdapterReplay: z.boolean(),
    attemptCostEvidenceRecorded: z.boolean(),
    dependencyArtifactInput: z.boolean(),
    finalArtifactQaPassed: z.boolean(),
  }).strict(),
  permissions: z.object({
    providerCall: z.literal(false),
    publicArtifact: z.literal(false),
    publicDelivery: z.literal(false),
    productionRender: z.literal(false),
    customerPriceMutation: z.literal(false),
    customerCreditMutation: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
    billing: z.literal(false),
    deployment: z.literal(false),
  }).strict(),
  readiness: z.object({
    privateInternalJobExecutionReady: z.literal(true),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.literal('canonical_required_job_capabilities_and_terminal_private_review'),
  }).strict(),
  completedAt: z.string().datetime({ offset: true }),
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict()

export const canonicalPrivateJobExecutionAdapterFailureSchema = z.object({
  schemaVersion: z.literal('canonical-private-job-execution-adapter-failure-v1'),
  source: z.literal('canonical_private_job_execution_adapter'),
  purpose: z.literal('execute_canonical_private_job'),
  identity: z.object({
    workspaceId: identitySchema,
    projectId: identitySchema,
    editSessionId: identitySchema,
    approvedPlanSnapshotId: identitySchema,
    jobId: identitySchema,
    approvedWorkItemId: identitySchema,
    expectedAssetId: identitySchema,
    canonicalToolId: identitySchema.nullable(),
    operationId: identitySchema,
    runnerClass: identitySchema,
  }).strict(),
  failure: z.object({
    category: canonicalPrivateJobExecutionFailureCategorySchema,
    originalCode: z.enum(API_ERROR_CODES),
    executionState: z.enum([
      'released_before_execution',
      'failed_before_commit',
      'completed_requires_reconciliation',
    ]),
    retryDisposition: canonicalPrivateJobExecutionRetryDispositionSchema,
    attemptNumber: z.number().int().positive().max(10),
    approvedMaxAttempts: z.number().int().positive().max(10),
    remainingAttempts: z.number().int().nonnegative().max(10),
    executionAttemptId: identitySchema.optional(),
    fenceFailureEvidenceHash: sha256Schema.optional(),
    requiredGate: identitySchema,
  }).strict(),
  permissions: z.object({
    providerCall: z.literal(false),
    publicArtifact: z.literal(false),
    publicDelivery: z.literal(false),
    productionRender: z.literal(false),
    customerPriceMutation: z.literal(false),
    customerCreditMutation: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
    billing: z.literal(false),
    deployment: z.literal(false),
  }).strict(),
  failedAt: timestampSchema,
  failureRecordHash: sha256Schema,
  testOnly: z.literal(true),
}).strict().superRefine((record, context) => {
  const failedBeforeCommit = record.failure.executionState === 'failed_before_commit'
  const completedRequiresReconciliation =
    record.failure.executionState === 'completed_requires_reconciliation'
  if (
    (failedBeforeCommit || completedRequiresReconciliation) !==
      (record.failure.executionAttemptId !== undefined) ||
    failedBeforeCommit !== (record.failure.fenceFailureEvidenceHash !== undefined)
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical adapter failure execution evidence is inconsistent.' })
  }
  if (
    record.failure.remainingAttempts !==
      Math.max(0, record.failure.approvedMaxAttempts - record.failure.attemptNumber)
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical adapter failure attempt allowance is inconsistent.' })
  }
  if (
    record.failure.retryDisposition === 'retry_same_approved_operation' &&
    (record.failure.remainingAttempts === 0 || completedRequiresReconciliation || [
      'authority_changed',
      'unknown_internal',
      'post_commit_reconciliation',
    ].includes(record.failure.category))
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical adapter failure cannot authorize this retry.' })
  }
  if (
    completedRequiresReconciliation !==
      [
        'manual_reconciliation_required',
        'server_reconciliation_required',
      ].includes(record.failure.retryDisposition) ||
    completedRequiresReconciliation !==
      (record.failure.category === 'post_commit_reconciliation')
  ) {
    context.addIssue({ code: 'custom', message: 'Post-commit failure recovery is inconsistent.' })
  }
  const expectedGate = record.failure.retryDisposition === 'retry_same_approved_operation'
    ? 'canonical_retry_same_approved_operation'
    : [
        'manual_reconciliation_required',
        'server_reconciliation_required',
      ].includes(record.failure.retryDisposition)
      ? 'canonical_completed_execution_reconciliation_recovery'
      : 'canonical_failure_fallback_user_review_or_new_approval'
  if (record.failure.requiredGate !== expectedGate) {
    context.addIssue({ code: 'custom', message: 'Canonical adapter failure gate is inconsistent.' })
  }
})

export type ExecuteCanonicalPrivateJobAdapterBody = z.infer<
  typeof executeCanonicalPrivateJobAdapterSchema
>

export type CanonicalPrivateJobExecutionAdapterResponse = z.infer<
  typeof canonicalPrivateJobExecutionAdapterResponseSchema
>
export type CanonicalPrivateJobExecutionAdapterFailure = z.infer<
  typeof canonicalPrivateJobExecutionAdapterFailureSchema
>
export type CanonicalPrivateJobExecutionFailureCategory = z.infer<
  typeof canonicalPrivateJobExecutionFailureCategorySchema
>
export type CanonicalPrivateJobExecutionRetryDisposition = z.infer<
  typeof canonicalPrivateJobExecutionRetryDispositionSchema
>
