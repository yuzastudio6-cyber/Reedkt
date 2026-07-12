import { z } from 'zod'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const boundedCount = z.number().int().nonnegative().max(256)

export const canonicalPrivateWorkGraphProgressStatusSchema = z.enum([
  'advancing_private_test_work_graph',
  'blocked_required_jobs',
  'completed_required_jobs_with_optional_blocks',
  'completed_private_test_work_graph',
])

export const canonicalPrivateWorkGraphProgressCheckpointSchema = z.object({
  schemaVersion: z.literal('canonical-private-work-graph-progress-checkpoint-v1'),
  source: z.literal('canonical_private_work_graph_orchestrator'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  checkpointSequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  status: canonicalPrivateWorkGraphProgressStatusSchema,
  runFinished: z.boolean(),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    completedJobCount: boundedCount,
    capabilityBlockedJobCount: boundedCount,
    dependencyBlockedJobCount: boundedCount,
    pendingJobCount: boundedCount,
    requiredIncompleteJobCount: boundedCount,
    allRequiredJobsCompleted: z.boolean(),
  }).strict(),
  readiness: z.object({
    privateInternalWorkGraphCompleted: z.boolean(),
    privateReviewReady: z.literal(false),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.enum([
      'canonical_private_work_graph_advancement',
      'canonical_job_capability_blockers',
      'canonical_terminal_private_review_assembly',
    ]),
  }).strict(),
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    contentAddressedCheckpoint: z.literal(true),
    immutableCheckpoint: z.literal(true),
    atomicLatestPointer: z.literal(true),
    checksumProtected: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  updatedAt: z.string().datetime({ offset: true }),
  testOnly: z.literal(true),
  checkpointHash: sha256,
}).strict().superRefine((checkpoint, context) => {
  const summary = checkpoint.summary
  const resolvedJobCount = summary.completedJobCount +
    summary.capabilityBlockedJobCount +
    summary.dependencyBlockedJobCount
  if (resolvedJobCount + summary.pendingJobCount !== summary.totalJobCount) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['summary'],
      message: 'Work-graph progress counts must partition the exact canonical job total.',
    })
  }
  if (
    summary.requiredIncompleteJobCount > summary.totalJobCount - summary.completedJobCount ||
    summary.allRequiredJobsCompleted !== (summary.requiredIncompleteJobCount === 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['summary', 'requiredIncompleteJobCount'],
      message: 'Work-graph required-job progress is inconsistent.',
    })
  }

  if (checkpoint.status === 'advancing_private_test_work_graph') {
    if (
      checkpoint.runFinished ||
      summary.pendingJobCount === 0 ||
      checkpoint.readiness.privateInternalWorkGraphCompleted ||
      checkpoint.readiness.nextRequiredGate !== 'canonical_private_work_graph_advancement'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Advancing work-graph progress must retain pending jobs and advancement readiness.',
      })
    }
  }
  if (checkpoint.status === 'blocked_required_jobs') {
    if (
      !checkpoint.runFinished ||
      summary.pendingJobCount !== 0 ||
      summary.requiredIncompleteJobCount === 0 ||
      summary.allRequiredJobsCompleted ||
      checkpoint.readiness.privateInternalWorkGraphCompleted ||
      checkpoint.readiness.nextRequiredGate !== 'canonical_job_capability_blockers'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Blocked work-graph progress must identify unresolved required jobs.',
      })
    }
  }
  if (checkpoint.status === 'completed_required_jobs_with_optional_blocks') {
    if (
      !checkpoint.runFinished ||
      summary.pendingJobCount !== 0 ||
      summary.requiredIncompleteJobCount !== 0 ||
      !summary.allRequiredJobsCompleted ||
      summary.completedJobCount >= summary.totalJobCount ||
      checkpoint.readiness.privateInternalWorkGraphCompleted ||
      checkpoint.readiness.nextRequiredGate !== 'canonical_terminal_private_review_assembly'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Required-complete work-graph progress must contain only optional terminal blockers.',
      })
    }
  }
  if (checkpoint.status === 'completed_private_test_work_graph') {
    if (
      !checkpoint.runFinished ||
      summary.pendingJobCount !== 0 ||
      summary.completedJobCount !== summary.totalJobCount ||
      summary.capabilityBlockedJobCount !== 0 ||
      summary.dependencyBlockedJobCount !== 0 ||
      summary.requiredIncompleteJobCount !== 0 ||
      !summary.allRequiredJobsCompleted ||
      !checkpoint.readiness.privateInternalWorkGraphCompleted ||
      checkpoint.readiness.nextRequiredGate !== 'canonical_terminal_private_review_assembly'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Completed work-graph progress must prove every canonical job completed.',
      })
    }
  }
})

export type CanonicalPrivateWorkGraphProgressCheckpoint = z.infer<
  typeof canonicalPrivateWorkGraphProgressCheckpointSchema
>

export type CanonicalPrivateWorkGraphProgressCheckpointDraft = Omit<
  CanonicalPrivateWorkGraphProgressCheckpoint,
  'checkpointSequence' | 'updatedAt' | 'checkpointHash'
>
