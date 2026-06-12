import { loadWorkerDryRunEvidenceContext } from './approved-plan-snapshot-loader'
import { validateApprovedPlanSnapshotForDryRun } from './approved-plan-snapshot-dry-run-validator'
import {
  WORKER_APPROVED_PLAN_DRY_RUN_BASE_BRANCH,
  WORKER_APPROVED_PLAN_DRY_RUN_BRANCH,
  WORKER_APPROVED_PLAN_DRY_RUN_GENERATED_ARTIFACTS,
  WORKER_APPROVED_PLAN_DRY_RUN_OWNER,
  WORKER_APPROVED_PLAN_DRY_RUN_PHASE,
  WORKER_APPROVED_PLAN_DRY_RUN_PR_TITLE,
  WORKER_APPROVED_PLAN_DRY_RUN_QA_ARTIFACTS,
  WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
  WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
  WORKER_APPROVED_PLAN_DRY_RUN_SOURCE,
  buildWorkerApprovedPlanDryRunNotAttemptedUploadStatus,
  buildWorkerDryRunSupabaseStatus,
  getWorkerApprovedPlanDryRunGeneratedPrefix,
  getWorkerApprovedPlanDryRunQaPrefix,
} from './worker-approved-plan-dry-run-policy'
import type {
  WorkerApprovedPlanDryRunDecision,
  WorkerApprovedPlanDryRunManifest,
  WorkerApprovedPlanDryRunQa,
  WorkerApprovedPlanDryRunReportBundle,
  WorkerApprovedPlanDryRunStatus,
  WorkerDryRunArtifactUploadStatus,
} from './worker-approved-plan-dry-run-types'
import { validateWorkerDryRunArtifactScope } from './worker-artifact-scope-validator'
import { validateWorkerDryRunBlockedRoutes } from './worker-blocked-route-validator'
import { simulateWorkerClaimLease } from './worker-claim-lease-simulator'
import { buildWorkerDryRunEventLogPlan } from './worker-event-log-plan-builder'
import { buildWorkerDryRunGapMap } from './worker-dry-run-gap-map'
import { buildWorkerDryRunNextPhasePlan } from './worker-dry-run-next-phase-plan'
import { buildWorkerDryRunDependencyPlan, buildWorkerJobBatchPlan } from './worker-job-plan-builder'
import { buildWorkerDryRunSourceAudit } from './worker-dry-run-source-audit'

function selectDecision(activeBlockers: string[]): WorkerApprovedPlanDryRunDecision {
  if (activeBlockers.some((item) => item.includes('missing_source') || item.includes('unexpected_'))) {
    return 'blocked_missing_source_evidence'
  }
  if (activeBlockers.some((item) => item.includes('candidate') || item.includes('plan_snapshot'))) {
    return 'blocked_invalid_plan_snapshot'
  }
  return activeBlockers.length > 0
    ? 'blocked_unsafe_dry_run_scope'
    : 'worker_approved_plan_dry_run_passed_ready_for_tool_route_0_unlock_audit'
}

function statusFromDecision(decision: WorkerApprovedPlanDryRunDecision): WorkerApprovedPlanDryRunStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

function normalizeUploadStatus(
  runId: string,
  uploadStatus?: WorkerDryRunArtifactUploadStatus,
): WorkerDryRunArtifactUploadStatus {
  return uploadStatus ?? buildWorkerApprovedPlanDryRunNotAttemptedUploadStatus(runId)
}

export function buildWorkerApprovedPlanDryRunBundle(input: {
  runId: string
  uploadStatus?: WorkerDryRunArtifactUploadStatus
}): WorkerApprovedPlanDryRunReportBundle {
  const sourceAudit = buildWorkerDryRunSourceAudit()
  const evidenceContext = loadWorkerDryRunEvidenceContext(sourceAudit)
  const snapshotValidation = validateApprovedPlanSnapshotForDryRun(evidenceContext)
  const jobBatchPlan = buildWorkerJobBatchPlan({ runId: input.runId, evidence: evidenceContext })
  const dependencyPlan = buildWorkerDryRunDependencyPlan(jobBatchPlan)
  const simulatedClaimLeaseResult = simulateWorkerClaimLease(jobBatchPlan)
  const artifactScopeValidation = validateWorkerDryRunArtifactScope({ evidence: evidenceContext, jobBatchPlan })
  const blockedRouteValidation = validateWorkerDryRunBlockedRoutes(jobBatchPlan)
  const eventLogPlan = buildWorkerDryRunEventLogPlan({ jobBatchPlan, claimLeaseResult: simulatedClaimLeaseResult })
  const gapMap = buildWorkerDryRunGapMap({
    sourceAudit,
    snapshotValidation,
    claimLeaseResult: simulatedClaimLeaseResult,
    artifactScopeValidation,
    blockedRouteValidation,
    eventLogPlan,
  })
  const nextPhasePlan = buildWorkerDryRunNextPhasePlan(gapMap)
  const activeBlockers = [
    ...sourceAudit.activeBlockers,
    ...evidenceContext.activeBlockers,
    ...snapshotValidation.activeBlockers,
    ...simulatedClaimLeaseResult.activeBlockers,
    ...artifactScopeValidation.activeBlockers,
    ...blockedRouteValidation.activeBlockers,
    ...eventLogPlan.activeBlockers,
  ].filter((item, index, list) => list.indexOf(item) === index)
  const decision = selectDecision(activeBlockers)
  const status = statusFromDecision(decision)
  const upload = normalizeUploadStatus(input.runId, input.uploadStatus)
  const privateArtifactUploadStatus = upload.status
  const manifest: WorkerApprovedPlanDryRunManifest = {
    phase: 'WORKER_1',
    runId: input.runId,
    reportDir: WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
    branch: WORKER_APPROVED_PLAN_DRY_RUN_BRANCH,
    baseBranch: WORKER_APPROVED_PLAN_DRY_RUN_BASE_BRANCH,
    generatedArtifactPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(input.runId),
    qaArtifactPrefix: getWorkerApprovedPlanDryRunQaPrefix(input.runId),
    expectedGeneratedArtifacts: WORKER_APPROVED_PLAN_DRY_RUN_GENERATED_ARTIFACTS,
    expectedQaArtifacts: WORKER_APPROVED_PLAN_DRY_RUN_QA_ARTIFACTS,
    privateArtifactUpload: upload,
    supabaseMilestoneSync: buildWorkerDryRunSupabaseStatus(true),
    safetyFlags: WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
  }
  const qa: WorkerApprovedPlanDryRunQa = {
    phase: 'WORKER_1',
    runId: input.runId,
    status,
    decision,
    gates: {
      source_of_truth_repo_audit: sourceAudit,
      worker0_evidence: sourceAudit.worker0,
      plan_snapshot_1_evidence: sourceAudit.planSnapshot1,
      approved_plan_snapshot_dry_run_validation: snapshotValidation,
      worker_job_plan: jobBatchPlan,
      simulated_claim_lease: simulatedClaimLeaseResult,
      artifact_scope_validation: artifactScopeValidation,
      blocked_route_validation: blockedRouteValidation,
      event_log_plan: eventLogPlan,
      worker_dry_run_gap_map: gapMap,
      tool_route_0_prompt_created: { status: 'passed', path: 'docs/implementation-prompts/prompt-tool-route-0-execution-unlock-audit.md' },
      no_runtime_execution: WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
      blocked_features: blockedRouteValidation,
      private_artifact_upload_status: privateArtifactUploadStatus,
      supabase_milestone_sync: buildWorkerDryRunSupabaseStatus(true),
    },
    safetyFlags: WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
    passed: decision === 'worker_approved_plan_dry_run_passed_ready_for_tool_route_0_unlock_audit' &&
      (privateArtifactUploadStatus === 'uploaded' || privateArtifactUploadStatus === 'not_attempted'),
  }
  const report = {
    phase: WORKER_APPROVED_PLAN_DRY_RUN_PHASE,
    owner: WORKER_APPROVED_PLAN_DRY_RUN_OWNER,
    runId: input.runId,
    status,
    decision,
    branch: WORKER_APPROVED_PLAN_DRY_RUN_BRANCH,
    baseBranch: WORKER_APPROVED_PLAN_DRY_RUN_BASE_BRANCH,
    prTitle: WORKER_APPROVED_PLAN_DRY_RUN_PR_TITLE,
    worker0Evidence: sourceAudit.worker0,
    planSnapshotEvidence: sourceAudit.planSnapshot1,
    modelDryRunEvidence: sourceAudit.modelDryRun1,
    dryRunJobBatchPlan: {
      batchId: jobBatchPlan.batchId,
      sourcePlanId: jobBatchPlan.sourcePlanId,
      jobCount: jobBatchPlan.jobs.length,
      dependencyCount: jobBatchPlan.dependencies.length,
      dryRunOnly: true,
      workerExecutionAllowed: false,
      routeExecutionAllowed: false,
      approvedForRuntime: false,
    },
    simulatedClaimLease: {
      status: simulatedClaimLeaseResult.status,
      claimAttempted: false,
      simulatedClaim: true,
      blockerForRealRuntime: simulatedClaimLeaseResult.blockerForRealRuntime,
    },
    artifactScopeValidation: {
      status: artifactScopeValidation.status,
      privateGsPrefixesOnly: artifactScopeValidation.privateGsPrefixesOnly,
      noPublicArtifacts: artifactScopeValidation.noPublicArtifacts,
      noSignedUrlSourceOfTruth: artifactScopeValidation.noSignedUrlSourceOfTruth,
    },
    blockedRouteValidation: {
      status: blockedRouteValidation.status,
      blockedRouteCount: blockedRouteValidation.blockedRoutes.length,
      allExecutionBlocked: blockedRouteValidation.allExecutionBlocked,
    },
    eventLogPlan: {
      status: eventLogPlan.status,
      eventCount: eventLogPlan.eventLogPlan.length,
      agentRunCount: eventLogPlan.agentRunPlan.length,
      persistToDatabase: false,
    },
    workerDryRunGapMap: {
      status: gapMap.status,
      gapCount: gapMap.gaps.length,
      toolRoute0Readiness: gapMap.toolRoute0Readiness,
    },
    toolRoute0Readiness: nextPhasePlan.readiness,
    privateArtifactUploadStatus,
    privateGeneratedArtifactPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(input.runId),
    privateQaArtifactPrefix: getWorkerApprovedPlanDryRunQaPrefix(input.runId),
    supabaseMilestoneSync: buildWorkerDryRunSupabaseStatus(true),
    safetyFlags: WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
    activeBlockers,
  }
  const summary = {
    phase: WORKER_APPROVED_PLAN_DRY_RUN_PHASE,
    owner: WORKER_APPROVED_PLAN_DRY_RUN_OWNER,
    runId: input.runId,
    status,
    decision,
    worker0RunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.worker0RunId,
    planSnapshotRunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.planSnapshotRunId,
    modelDryRunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.modelDryRunId,
    batchId: jobBatchPlan.batchId,
    jobCount: jobBatchPlan.jobs.length,
    dependencyCount: jobBatchPlan.dependencies.length,
    claimAttempted: false,
    simulatedClaim: true,
    toolRoute0Readiness: nextPhasePlan.readiness,
    privateArtifactUploadStatus,
    supabaseMilestoneSync: buildWorkerDryRunSupabaseStatus(true),
    safetyFlags: WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS,
    activeBlockers,
  }

  return {
    sourceAudit,
    evidenceContext,
    snapshotValidation,
    jobBatchPlan,
    dependencyPlan,
    simulatedClaimLeaseResult,
    artifactScopeValidation,
    blockedRouteValidation,
    eventLogPlan,
    gapMap,
    nextPhasePlan,
    manifest,
    qa,
    report,
    summary,
  }
}
