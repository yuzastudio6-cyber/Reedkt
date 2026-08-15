import { z } from 'zod'

import { canonicalPrivateJobExecutionAdapterResponseSchema } from './canonical-private-job-execution-adapter-schemas'

const identitySchema = z.string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })

export const canonicalPrivateJobCompletionRecoveryRecordSchema = z.object({
  schemaVersion: z.literal('canonical-private-job-completion-recovery-v1'),
  source: z.literal('canonical_private_job_completion_recovery'),
  purpose: z.literal('recover_completed_canonical_private_job'),
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
    leaseId: identitySchema,
    leaseAttemptNumber: z.number().int().positive().max(10),
    executionAttemptId: identitySchema,
  }).strict(),
  evidence: z.object({
    leaseImmutableHash: sha256Schema,
    leaseDependencyAuthorityHash: sha256Schema,
    actualRunEvidenceHash: sha256Schema,
    artifactResultEvidenceHash: sha256Schema,
    qaEvaluationId: identitySchema,
    qaEvidenceHash: sha256Schema,
    reconciliationId: identitySchema,
    consumedDispatchGrantId: identitySchema.nullable(),
    consumedDispatchGrantHash: sha256Schema.nullable(),
    internalAttemptCostProfileId: identitySchema.nullable(),
    internalAttemptCostEvidenceHash: sha256Schema.nullable(),
    responseHash: sha256Schema,
    executionCompletedAt: timestampSchema,
  }).strict(),
  recovery: z.object({
    priorCompletedFenceReused: z.literal(true),
    runnerReexecuted: z.literal(false),
    newLeaseClaimed: z.literal(false),
    newDispatchAuthorized: z.literal(false),
    newDispatchConsumed: z.literal(false),
    artifactWritten: z.literal(false),
    qaWritten: z.literal(false),
    reconciliationWritten: z.literal(false),
    costEvidenceWritten: z.literal(false),
    adapterCompletionRecovered: z.literal(true),
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
  response: canonicalPrivateJobExecutionAdapterResponseSchema,
  recoveredAt: timestampSchema,
  recoveryRecordHash: sha256Schema,
  testOnly: z.literal(true),
}).strict().superRefine((record, context) => {
  const response = record.response
  const sameResponseIdentity =
    response.identity.workspaceId === record.identity.workspaceId &&
    response.identity.projectId === record.identity.projectId &&
    response.identity.editSessionId === record.identity.editSessionId &&
    response.identity.approvedPlanSnapshotId === record.identity.approvedPlanSnapshotId &&
    response.identity.jobId === record.identity.jobId &&
    response.identity.approvedWorkItemId === record.identity.approvedWorkItemId &&
    response.identity.expectedAssetId === record.identity.expectedAssetId &&
    response.identity.canonicalToolId === record.identity.canonicalToolId &&
    response.identity.operationId === record.identity.operationId &&
    response.identity.runnerClass === record.identity.runnerClass
  if (!sameResponseIdentity) {
    context.addIssue({ code: 'custom', message: 'Recovered adapter response identity is inconsistent.' })
  }
  if (
    record.evidence.responseHash !== response.responseHash ||
    record.evidence.executionCompletedAt !== response.completedAt
  ) {
    context.addIssue({ code: 'custom', message: 'Recovered adapter response evidence is inconsistent.' })
  }
  if (Date.parse(record.recoveredAt) < Date.parse(record.evidence.executionCompletedAt)) {
    context.addIssue({ code: 'custom', message: 'Adapter recovery cannot predate execution completion.' })
  }
  const toolExecution = record.identity.canonicalToolId !== null
  if (
    toolExecution !== (record.evidence.consumedDispatchGrantId !== null) ||
    toolExecution !== (record.evidence.consumedDispatchGrantHash !== null) ||
    response.evidence.singleUseDispatchConsumed !== toolExecution
  ) {
    context.addIssue({ code: 'custom', message: 'Recovered dispatch evidence is inconsistent.' })
  }
  const meteredExecution = record.evidence.internalAttemptCostProfileId !== null
  if (
    meteredExecution !==
      (record.evidence.internalAttemptCostEvidenceHash !== null) ||
    response.evidence.attemptCostEvidenceRecorded !== meteredExecution ||
    (record.identity.canonicalToolId === null && meteredExecution)
  ) {
    context.addIssue({ code: 'custom', message: 'Recovered internal-cost evidence is inconsistent.' })
  }
})

export type CanonicalPrivateJobCompletionRecoveryRecord = z.infer<
  typeof canonicalPrivateJobCompletionRecoveryRecordSchema
>
