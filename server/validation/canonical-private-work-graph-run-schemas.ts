import { z } from 'zod'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const runCanonicalPrivateWorkGraphSchema = z.object({
  workspaceId: identity,
  purpose: z.literal('run_canonical_private_work_graph'),
}).strict()

const jobOutcome = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  workItemKey: identity,
  required: z.boolean(),
  dependencyJobIds: z.array(identity).max(128),
  status: z.enum([
    'completed_private_test',
    'blocked_by_job_capability',
    'blocked_by_dependency',
  ]),
  artifactId: identity.optional(),
  contentType: z.string().trim().min(1).max(160).optional(),
  sha256: sha256.optional(),
  adapterReplayed: z.boolean(),
  blockerCode: identity.optional(),
  requiredGate: identity.optional(),
  blockedDependencyJobIds: z.array(identity).max(128).default([]),
}).strict()

export const canonicalPrivateWorkGraphRunResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-work-graph-run-response-v1'),
  source: z.literal('canonical_private_work_graph_orchestrator'),
  purpose: z.literal('run_canonical_private_work_graph'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  status: z.enum([
    'completed_private_test_work_graph',
    'completed_required_jobs_with_optional_blocks',
    'blocked_required_jobs',
  ]),
  jobs: z.array(jobOutcome).min(1).max(256),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    completedJobCount: z.number().int().nonnegative().max(256),
    replayedJobCount: z.number().int().nonnegative().max(256),
    capabilityBlockedJobCount: z.number().int().nonnegative().max(256),
    dependencyBlockedJobCount: z.number().int().nonnegative().max(256),
    requiredBlockedJobCount: z.number().int().nonnegative().max(256),
    allRequiredJobsCompleted: z.boolean(),
  }).strict(),
  evidence: z.object({
    canonicalPackageReloaded: z.literal(true),
    serverDerivedTopologicalOrder: z.literal(true),
    onlyDependencyReadyJobsAttempted: z.literal(true),
    stablePerJobIdempotency: z.literal(true),
    privateArtifactsQaAndReconciliationRequired: z.literal(true),
    idempotentRunReplay: z.boolean(),
  }).strict(),
  readiness: z.object({
    privateInternalWorkGraphCompleted: z.boolean(),
    privateReviewReady: z.literal(false),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.enum([
      'canonical_job_capability_blockers',
      'canonical_terminal_private_review_assembly',
    ]),
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
  completedAt: z.string().datetime({ offset: true }),
  responseHash: sha256,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateWorkGraphBody = z.infer<typeof runCanonicalPrivateWorkGraphSchema>
export type CanonicalPrivateWorkGraphRunResponse = z.infer<
  typeof canonicalPrivateWorkGraphRunResponseSchema
>
export type CanonicalPrivateWorkGraphJobOutcome = z.infer<typeof jobOutcome>
