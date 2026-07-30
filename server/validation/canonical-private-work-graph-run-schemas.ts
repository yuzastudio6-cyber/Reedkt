import { z } from 'zod'
import {
  canonicalPrivateJobExecutionFailureCategorySchema,
  canonicalPrivateJobExecutionRetryDispositionSchema,
} from './canonical-private-job-execution-adapter-schemas'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const workerConcurrencyEvidence = z.object({
  api_service: z.literal(20).optional(),
  cpu_analysis_worker: z.literal(4).optional(),
  gpu_ai_worker: z.literal(1).optional(),
  render_worker: z.literal(2).optional(),
  qa_worker: z.literal(4).optional(),
  tool_readiness_worker: z.literal(1).optional(),
}).strict()
const observedWorkerConcurrencyEvidence = z.object({
  api_service: z.number().int().nonnegative().max(20).optional(),
  cpu_analysis_worker: z.number().int().nonnegative().max(4).optional(),
  gpu_ai_worker: z.number().int().nonnegative().max(1).optional(),
  render_worker: z.number().int().nonnegative().max(2).optional(),
  qa_worker: z.number().int().nonnegative().max(4).optional(),
  tool_readiness_worker: z.number().int().nonnegative().max(1).optional(),
}).strict()

const resourceSchedulingCommonShape = {
  placementPolicyVersion: z.literal('canonical-private-resource-placement-policy-v1'),
  placementManifestHash: sha256,
  toolExecutionAuthorityHash: sha256,
  approvedResourcePlacementAuthorityHash: sha256,
  provenToolPlacementCatalogHash: sha256,
  configuredGlobalMaxConcurrency: z.literal(4),
  configuredWorkerConcurrencyLimits: workerConcurrencyEvidence,
  waveCount: z.number().int().nonnegative().max(256),
  parallelWaveCount: z.number().int().nonnegative().max(256),
  maximumWaveWidth: z.number().int().nonnegative().max(4),
  actualExecutionCount: z.number().int().nonnegative().max(256),
  parallelJobCount: z.number().int().nonnegative().max(256),
  observedPeakConcurrency: z.number().int().nonnegative().max(4),
  observedPeakConcurrencyByWorkerType: observedWorkerConcurrencyEvidence,
  resourceWaveHashes: z.array(sha256).max(256),
  concurrencyMeasurementScope: z.literal('in_process_orchestrator_execution_tasks'),
  allStartsResourcePlacementAuthorized: z.literal(true),
  deterministicDependencyWaves: z.literal(true),
  callerSelectedConcurrency: z.literal(false),
  localSingleHostOnly: z.literal(true),
  cloudDispatchAuthorized: z.literal(false),
  distributedExecutionProven: z.literal(false),
  physicalWorkerProcessConcurrencyProven: z.literal(false),
  cloudWorkerConcurrencyProven: z.literal(false),
  performanceSlaProven: z.literal(false),
  immutableSnapshotPlacementBindingProven: z.literal(true),
}

const resourceSchedulingEvidenceV2 = z.object({
  schedulerVersion: z.literal('canonical-private-resource-wave-scheduler-v2'),
  ...resourceSchedulingCommonShape,
}).strict()

const resourceSchedulingEvidenceV3 = z.object({
  schedulerVersion: z.literal('canonical-private-resource-wave-scheduler-v3'),
  ...resourceSchedulingCommonShape,
  configuredLocalResourceLaneConcurrencyLimits: z.record(
    identity,
    z.number().int().positive().max(4),
  ),
  observedPeakConcurrencyByResourceLane: z.record(
    identity,
    z.number().int().nonnegative().max(4),
  ),
  localResourceLaneConcurrencyEnforced: z.literal(true),
}).strict()

export const canonicalPrivateResourceSchedulingEvidenceSchema = z.discriminatedUnion('schedulerVersion', [
  resourceSchedulingEvidenceV2,
  resourceSchedulingEvidenceV3,
]).superRefine((evidence, context) => {
  if (
    evidence.parallelWaveCount > evidence.waveCount ||
    evidence.parallelJobCount > evidence.actualExecutionCount ||
    evidence.resourceWaveHashes.length !== evidence.waveCount ||
    (evidence.actualExecutionCount === 0) !== (evidence.observedPeakConcurrency === 0) ||
    (evidence.parallelWaveCount > 0) !== (evidence.observedPeakConcurrency > 1)
  ) {
    context.addIssue({ code: 'custom', message: 'Resource scheduling evidence is inconsistent.' })
  }
  for (const [workerType, observedPeak] of Object.entries(
    evidence.observedPeakConcurrencyByWorkerType,
  )) {
    const configured = evidence.configuredWorkerConcurrencyLimits[
      workerType as keyof typeof evidence.configuredWorkerConcurrencyLimits
    ]
    if (configured === undefined || observedPeak > configured) {
      context.addIssue({ code: 'custom', message: 'Observed worker concurrency exceeds authority.' })
    }
  }
  if (evidence.schedulerVersion === 'canonical-private-resource-wave-scheduler-v3') {
    for (const [laneKey, observedPeak] of Object.entries(
      evidence.observedPeakConcurrencyByResourceLane,
    )) {
      const configured = evidence.configuredLocalResourceLaneConcurrencyLimits[laneKey]
      if (configured === undefined || observedPeak > configured) {
        context.addIssue({
          code: 'custom',
          message: 'Observed local resource-lane concurrency exceeds authority.',
        })
      }
    }
    const highMemoryRenderLane =
      evidence.configuredLocalResourceLaneConcurrencyLimits[
        'render_worker:render_cpu_high_memory_v1:none'
      ]
    if (highMemoryRenderLane !== undefined && highMemoryRenderLane !== 1) {
      context.addIssue({
        code: 'custom',
        message: 'Local high-memory render concurrency must remain serialized.',
      })
    }
  }
})

const durablePackageWorkQueueEvidence = z.object({
  definitionVersion: z.literal('canonical-private-package-work-queue-definition-v1'),
  definitionHash: sha256,
  aggregateVersion: z.literal('canonical-private-package-work-queue-aggregate-v1'),
  aggregateHash: sha256,
  totalJobCount: z.number().int().positive().max(256),
  completedJobCount: z.number().int().nonnegative().max(256),
  queuedJobCount: z.number().int().nonnegative().max(256),
  leasedJobCount: z.number().int().nonnegative().max(256),
  recoveredCompletedJobCount: z.number().int().nonnegative().max(256),
  completedReplayCount: z.number().int().nonnegative().max(256),
  claimedJobCount: z.number().int().nonnegative().max(256),
  claimCompletionCount: z.number().int().nonnegative().max(256),
  claimReleaseCount: z.number().int().nonnegative().max(256),
  expiredClaimRecoveryCount: z.number().int().nonnegative().max(100_000),
  hostRestartRecoveryAvailable: z.literal(true),
  completedJobReplayWithoutExecution: z.literal(true),
  immutableSnapshotAndPlacementBinding: z.literal(true),
  plaintextClaimCredentialsPersisted: z.literal(false),
  claimCredentialDigestsPersisted: z.literal(true),
  browserClaimAllowed: z.literal(false),
  crossProcessAtomicClaimProven: z.boolean(),
  distributedTransactionProven: z.literal(false),
  cloudServiceIdentityVerified: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  productionAuthority: z.literal(false),
}).strict().superRefine((queue, context) => {
  if (
    queue.completedJobCount + queue.queuedJobCount + queue.leasedJobCount !== queue.totalJobCount ||
    queue.recoveredCompletedJobCount > queue.completedJobCount ||
    queue.completedReplayCount > queue.completedJobCount ||
    queue.claimCompletionCount + queue.claimReleaseCount !== queue.claimedJobCount ||
    queue.completedJobCount !== queue.recoveredCompletedJobCount +
      queue.completedReplayCount + queue.claimCompletionCount
  ) {
    context.addIssue({ code: 'custom', message: 'Durable package work-queue evidence is inconsistent.' })
  }
})

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
    'failed_retry_available',
    'failed_user_review_required',
    'completed_recovery_required',
  ]),
  artifactId: identity.optional(),
  contentType: z.string().trim().min(1).max(160).optional(),
  sha256: sha256.optional(),
  adapterReplayed: z.boolean(),
  blockerCode: identity.optional(),
  requiredGate: identity.optional(),
  failureCategory: canonicalPrivateJobExecutionFailureCategorySchema.optional(),
  retryDisposition: canonicalPrivateJobExecutionRetryDispositionSchema.optional(),
  attemptNumber: z.number().int().positive().max(10).optional(),
  approvedMaxAttempts: z.number().int().positive().max(10).optional(),
  remainingAttempts: z.number().int().nonnegative().max(10).optional(),
  failureRecordHash: sha256.optional(),
  fenceFailureEvidenceHash: sha256.optional(),
  blockedDependencyJobIds: z.array(identity).max(128).default([]),
}).strict().superRefine((outcome, context) => {
  const failureStatus = [
    'failed_retry_available',
    'failed_user_review_required',
    'completed_recovery_required',
  ].includes(outcome.status)
  const failureFieldsPresent =
    outcome.failureCategory !== undefined &&
    outcome.retryDisposition !== undefined &&
    outcome.attemptNumber !== undefined &&
    outcome.approvedMaxAttempts !== undefined &&
    outcome.remainingAttempts !== undefined &&
    outcome.failureRecordHash !== undefined
  if (failureStatus !== failureFieldsPresent) {
    context.addIssue({ code: 'custom', message: 'Work-graph failure outcome evidence is inconsistent.' })
  }
  if (
    outcome.status === 'failed_retry_available' &&
    (outcome.retryDisposition !== 'retry_same_approved_operation' ||
      outcome.remainingAttempts === 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Retry-available work requires remaining approved attempts.' })
  }
  if (
    outcome.status === 'completed_recovery_required' &&
    ![
      'manual_reconciliation_required',
      'server_reconciliation_required',
    ].includes(outcome.retryDisposition ?? '')
  ) {
    context.addIssue({ code: 'custom', message: 'Committed work must require reconciliation recovery.' })
  }
  if (
    outcome.status === 'failed_user_review_required' &&
    outcome.retryDisposition !== 'fallback_or_user_review_required'
  ) {
    context.addIssue({ code: 'custom', message: 'User-review work must require fallback or review.' })
  }
  if (
    failureStatus &&
    outcome.remainingAttempts !==
      Math.max(0, outcome.approvedMaxAttempts! - outcome.attemptNumber!)
  ) {
    context.addIssue({ code: 'custom', message: 'Work-graph failure attempt allowance is inconsistent.' })
  }
  if (
    (outcome.status === 'completed_recovery_required') !==
      (outcome.failureCategory === 'post_commit_reconciliation')
  ) {
    context.addIssue({ code: 'custom', message: 'Work-graph post-commit recovery evidence is inconsistent.' })
  }
})

export const canonicalPrivateWorkGraphRunResponseSchema = z.object({
  schemaVersion: z.enum([
    'canonical-private-work-graph-run-response-v2',
    'canonical-private-work-graph-run-response-v3',
  ]),
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
  // Optional only so persisted pre-scheduler private-test responses remain replayable.
  // Every newly produced response includes this server-derived evidence.
  scheduling: canonicalPrivateResourceSchedulingEvidenceSchema.optional(),
  // Optional only so persisted v2 private/local responses remain replayable.
  // Every newly produced v3 response carries durable queue evidence.
  queue: durablePackageWorkQueueEvidence.optional(),
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
}).strict().superRefine((response, context) => {
  if (response.schemaVersion === 'canonical-private-work-graph-run-response-v3' && !response.queue) {
    context.addIssue({ code: 'custom', message: 'Work-graph v3 requires durable queue evidence.' })
  }
  if (
    response.queue &&
    (response.queue.completedJobCount !== response.summary.completedJobCount ||
      response.queue.totalJobCount !== response.summary.totalJobCount ||
      response.queue.recoveredCompletedJobCount > response.summary.replayedJobCount)
  ) {
    context.addIssue({ code: 'custom', message: 'Work-graph completion and durable queue evidence disagree.' })
  }
})

export type RunCanonicalPrivateWorkGraphBody = z.infer<typeof runCanonicalPrivateWorkGraphSchema>
export type CanonicalPrivateWorkGraphRunResponse = z.infer<
  typeof canonicalPrivateWorkGraphRunResponseSchema
>
export type CanonicalPrivateWorkGraphJobOutcome = z.infer<typeof jobOutcome>
