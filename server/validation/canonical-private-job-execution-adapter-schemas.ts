import { z } from 'zod'

const identitySchema = z.string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const executeCanonicalPrivateJobAdapterSchema = z.object({
  workspaceId: identitySchema,
  projectId: identitySchema,
  editSessionId: identitySchema,
  purpose: z.literal('execute_canonical_private_job'),
}).strict()

export const canonicalPrivateJobExecutionAdapterResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-job-execution-adapter-response-v1'),
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
    nextRequiredGate: z.literal('canonical_multi_job_work_graph_orchestration_and_private_review'),
  }).strict(),
  completedAt: z.string().datetime({ offset: true }),
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict()

export type ExecuteCanonicalPrivateJobAdapterBody = z.infer<
  typeof executeCanonicalPrivateJobAdapterSchema
>

export type CanonicalPrivateJobExecutionAdapterResponse = z.infer<
  typeof canonicalPrivateJobExecutionAdapterResponseSchema
>
