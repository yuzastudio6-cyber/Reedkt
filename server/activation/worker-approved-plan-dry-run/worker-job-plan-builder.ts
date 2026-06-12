import {
  WORKER_APPROVED_PLAN_DRY_RUN_BLOCKED_ROUTES,
  WORKER_APPROVED_PLAN_DRY_RUN_SOURCE,
  getWorkerApprovedPlanDryRunGeneratedPrefix,
  getWorkerApprovedPlanDryRunQaPrefix,
} from './worker-approved-plan-dry-run-policy'
import type {
  WorkerDryRunAgentRunPlan,
  WorkerDryRunArtifactScope,
  WorkerDryRunDependency,
  WorkerDryRunDependencyPlan,
  WorkerDryRunEventLogEntry,
  WorkerDryRunEvidenceContext,
  WorkerDryRunJob,
  WorkerDryRunJobBatchPlan,
} from './worker-approved-plan-dry-run-types'

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item'
}

export function buildWorkerJobBatchPlan(input: {
  runId: string
  evidence: WorkerDryRunEvidenceContext
}): WorkerDryRunJobBatchPlan {
  const batchId = `worker1-batch-${input.runId}`
  const snapshotJobId = `worker1-job-${input.runId}-snapshot-intake`
  const routeJobs: WorkerDryRunJob[] = input.evidence.candidateSnapshot.selectedIntents.map((intent, index) => ({
    jobId: `worker1-job-${input.runId}-route-${index + 1}-${slug(intent.routeLabel)}`,
    jobType: 'selected_intent_route_review',
    ownerRoute: intent.ownerRoute,
    sourceRefs: [intent.intentId, intent.routeLabel],
    dependencyIds: [snapshotJobId],
    dryRunOnly: true,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallsAllowed: false,
    routeExecutionAllowed: false,
    approvedForRuntime: false,
    status: 'planned_not_executed',
  }))
  const proposalJobId = `worker1-job-${input.runId}-deepseek-proposal-review`
  const proposalJob: WorkerDryRunJob = {
    jobId: proposalJobId,
    jobType: 'implementation_proposal_review',
    ownerRoute: 'MODEL_ORCHESTRATION',
    sourceRefs: input.evidence.candidateSnapshot.implementationProposalRefs.map((item) => item.proposalId),
    dependencyIds: [snapshotJobId],
    dryRunOnly: true,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallsAllowed: false,
    routeExecutionAllowed: false,
    approvedForRuntime: false,
    status: 'planned_not_executed',
  }
  const validationJobId = `worker1-job-${input.runId}-artifact-route-event-validation`
  const jobs: WorkerDryRunJob[] = [
    {
      jobId: snapshotJobId,
      jobType: 'snapshot_intake_validation',
      ownerRoute: 'WORKER_RUNTIME_JOBS',
      sourceRefs: [WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.candidatePlanId],
      dependencyIds: [],
      dryRunOnly: true,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      providerCallsAllowed: false,
      routeExecutionAllowed: false,
      approvedForRuntime: false,
      status: 'planned_not_executed',
    },
    ...routeJobs,
    proposalJob,
    {
      jobId: validationJobId,
      jobType: 'artifact_blocked_route_event_validation',
      ownerRoute: 'COMPLIANCE_SECURITY',
      sourceRefs: ['artifact_scope_validation', 'blocked_route_validation', 'worker_event_log_plan'],
      dependencyIds: [...routeJobs.map((job) => job.jobId), proposalJobId],
      dryRunOnly: true,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      providerCallsAllowed: false,
      routeExecutionAllowed: false,
      approvedForRuntime: false,
      status: 'planned_not_executed',
    },
  ]
  const dependencies: WorkerDryRunDependency[] = [
    ...routeJobs.map((job) => ({
      dependencyId: `worker1-dependency-${input.runId}-${slug(job.jobId)}`,
      jobId: job.jobId,
      dependsOnJobId: snapshotJobId,
      reason: 'Selected-intent route review depends on candidate snapshot intake validation.',
      dryRunOnly: true as const,
    })),
    {
      dependencyId: `worker1-dependency-${input.runId}-proposal-after-intake`,
      jobId: proposalJobId,
      dependsOnJobId: snapshotJobId,
      reason: 'Implementation proposal review depends on candidate snapshot intake validation.',
      dryRunOnly: true,
    },
    ...[...routeJobs, proposalJob].map((job) => ({
      dependencyId: `worker1-dependency-${input.runId}-validation-after-${slug(job.jobId)}`,
      jobId: validationJobId,
      dependsOnJobId: job.jobId,
      reason: 'Final artifact, blocked-route, and event-log validation depends on every review job.',
      dryRunOnly: true as const,
    })),
  ]
  const artifactScopes: WorkerDryRunArtifactScope[] = [
    {
      scopeId: `worker1-generated-${input.runId}`,
      ownerRoute: 'WORKER_RUNTIME_JOBS',
      gcsPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(input.runId),
      privateOnly: true,
      checksumRequired: true,
      manifestRequired: true,
      cleanupRollbackRequired: true,
      signedUrlSourceOfTruthAllowed: false,
      publicArtifactAllowed: false,
    },
    {
      scopeId: `worker1-qa-${input.runId}`,
      ownerRoute: 'OBSERVABILITY_AUDIT_COST',
      gcsPrefix: getWorkerApprovedPlanDryRunQaPrefix(input.runId),
      privateOnly: true,
      checksumRequired: true,
      manifestRequired: true,
      cleanupRollbackRequired: true,
      signedUrlSourceOfTruthAllowed: false,
      publicArtifactAllowed: false,
    },
  ]
  const agentRunPlan: WorkerDryRunAgentRunPlan[] = jobs.map((job) => ({
    agentRunId: `worker1-agent-${slug(job.jobId)}`,
    jobId: job.jobId,
    agentType: 'worker_runtime_dry_run_validator',
    status: 'planned_not_executed',
    dryRunOnly: true,
  }))
  const eventLogPlan: WorkerDryRunEventLogEntry[] = [
    {
      eventId: `worker1-event-${input.runId}-batch-planned`,
      eventType: 'dry_run_batch_planned',
      message: 'Worker approved-plan dry-run batch planned without execution.',
      persistToDatabase: false,
      dryRunOnly: true,
    },
    ...jobs.map((job) => ({
      eventId: `worker1-event-${slug(job.jobId)}-planned`,
      jobId: job.jobId,
      eventType: 'dry_run_job_planned',
      message: `Dry-run job ${job.jobType} planned and not executed.`,
      persistToDatabase: false as const,
      dryRunOnly: true as const,
    })),
  ]

  return {
    phase: 'WORKER_1',
    batchId,
    sourcePlanId: input.evidence.candidatePlanId,
    jobs,
    dependencies,
    eventLogPlan,
    agentRunPlan,
    artifactScopes,
    ownerRoutes: input.evidence.candidateSnapshot.ownerRoutes,
    blockedRoutes: WORKER_APPROVED_PLAN_DRY_RUN_BLOCKED_ROUTES.map((route) => route.routeId),
    rollbackPlan: [
      'Discard local/private dry-run artifacts if any QA gate fails.',
      'Do not mutate approved snapshots, job rows, worker claims, or Supabase product rows.',
      'Require a new WORKER-1 run before TOOL-ROUTE-0 if source evidence changes.',
    ],
    idempotencyKey: `worker1:${input.runId}:${WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.candidatePlanId}`,
    dryRunOnly: true,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallsAllowed: false,
    routeExecutionAllowed: false,
    approvedForRuntime: false,
  }
}

export function buildWorkerDryRunDependencyPlan(jobBatchPlan: WorkerDryRunJobBatchPlan): WorkerDryRunDependencyPlan {
  return {
    phase: 'WORKER_1',
    batchId: jobBatchPlan.batchId,
    dependencies: jobBatchPlan.dependencies,
    dependencyCount: jobBatchPlan.dependencies.length,
    allDependenciesDryRunOnly: true,
  }
}
