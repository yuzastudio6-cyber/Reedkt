import {
  WORKER_RUNTIME_JOBS_AUDIT_BASE_BRANCH,
  WORKER_RUNTIME_JOBS_AUDIT_BRANCH,
  WORKER_RUNTIME_JOBS_AUDIT_GENERATED_ARTIFACTS,
  WORKER_RUNTIME_JOBS_AUDIT_OWNER,
  WORKER_RUNTIME_JOBS_AUDIT_PHASE,
  WORKER_RUNTIME_JOBS_AUDIT_PR_TITLE,
  WORKER_RUNTIME_JOBS_AUDIT_QA_ARTIFACTS,
  WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR,
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
  WORKER_RUNTIME_SAFETY_FLAGS,
  buildWorkerRuntimeNotAttemptedUploadStatus,
  buildWorkerRuntimeSupabaseSyncStatus,
  getWorkerRuntimeJobsAuditGeneratedPrefix,
  getWorkerRuntimeJobsAuditQaPrefix,
} from './worker-runtime-audit-policy'
import type {
  WorkerRuntimeArtifactUploadStatus,
  WorkerRuntimeAuditDecision,
  WorkerRuntimeAuditStatus,
  WorkerRuntimeJobsAuditManifest,
  WorkerRuntimeJobsAuditQa,
  WorkerRuntimeJobsAuditReportBundle,
} from './worker-runtime-audit-types'
import { buildApprovedPlanIntakeAudit } from './approved-plan-intake-audit'
import { buildWorkerArtifactScopeAudit } from './worker-artifact-scope-audit'
import { buildWorkerClaimLeaseAudit } from './worker-claim-lease-audit'
import { buildWorkerEventLogAudit } from './worker-event-log-audit'
import { buildWorkerRuntimeGapMap } from './worker-runtime-gap-map'
import { buildWorkerRuntimeNextPhasePlan } from './worker-runtime-next-phase-plan'
import { buildWorkerRuntimeSourceAudit } from './worker-runtime-source-audit'
import { buildWorkerSchemaAudit } from './worker-schema-audit'

function selectDecision(activeBlockers: string[]): WorkerRuntimeAuditDecision {
  if (activeBlockers.some((item) => item.includes('plan_snapshot') || item.includes('candidate_snapshot'))) {
    return 'blocked_missing_plan_snapshot_evidence'
  }
  if (activeBlockers.some((item) => item.includes('migration') || item.includes('table') || item.includes('function'))) {
    return 'blocked_missing_worker_schema_contracts'
  }
  return activeBlockers.length > 0
    ? 'blocked_unsafe_runtime_execution_flags'
    : 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run'
}

function statusFromDecision(decision: WorkerRuntimeAuditDecision): WorkerRuntimeAuditStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

function normalizeUploadStatus(
  runId: string,
  uploadStatus?: WorkerRuntimeArtifactUploadStatus,
): WorkerRuntimeArtifactUploadStatus {
  return uploadStatus ?? buildWorkerRuntimeNotAttemptedUploadStatus(runId)
}

export function buildWorkerRuntimeJobsAuditBundle(input: {
  runId: string
  uploadStatus?: WorkerRuntimeArtifactUploadStatus
}): WorkerRuntimeJobsAuditReportBundle {
  const sourceAudit = buildWorkerRuntimeSourceAudit()
  const workerSchemaAudit = buildWorkerSchemaAudit()
  const approvedPlanIntakeAudit = buildApprovedPlanIntakeAudit()
  const workerClaimLeaseAudit = buildWorkerClaimLeaseAudit()
  const workerArtifactScopeAudit = buildWorkerArtifactScopeAudit()
  const workerEventLogAudit = buildWorkerEventLogAudit()
  const gapMap = buildWorkerRuntimeGapMap({
    sourceAudit,
    workerSchemaAudit,
    approvedPlanIntakeAudit,
    workerClaimLeaseAudit,
    workerArtifactScopeAudit,
    workerEventLogAudit,
  })
  const nextPhasePlan = buildWorkerRuntimeNextPhasePlan(gapMap)
  const activeBlockers = [
    ...sourceAudit.activeBlockers,
    ...workerSchemaAudit.activeBlockers,
    ...approvedPlanIntakeAudit.activeBlockers,
    ...workerClaimLeaseAudit.activeBlockers,
    ...workerArtifactScopeAudit.activeBlockers,
    ...workerEventLogAudit.activeBlockers,
  ]
  const decision = selectDecision(activeBlockers)
  const status = statusFromDecision(decision)
  const upload = normalizeUploadStatus(input.runId, input.uploadStatus)
  const privateArtifactUploadStatus = upload.status
  const manifest: WorkerRuntimeJobsAuditManifest = {
    phase: 'WORKER_0',
    runId: input.runId,
    reportDir: WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
    branch: WORKER_RUNTIME_JOBS_AUDIT_BRANCH,
    baseBranch: WORKER_RUNTIME_JOBS_AUDIT_BASE_BRANCH,
    generatedArtifactPrefix: getWorkerRuntimeJobsAuditGeneratedPrefix(input.runId),
    qaArtifactPrefix: getWorkerRuntimeJobsAuditQaPrefix(input.runId),
    expectedGeneratedArtifacts: WORKER_RUNTIME_JOBS_AUDIT_GENERATED_ARTIFACTS,
    expectedQaArtifacts: WORKER_RUNTIME_JOBS_AUDIT_QA_ARTIFACTS,
    privateArtifactUpload: upload,
    supabaseMilestoneSync: buildWorkerRuntimeSupabaseSyncStatus(true),
    safetyFlags: WORKER_RUNTIME_SAFETY_FLAGS,
  }
  const qa: WorkerRuntimeJobsAuditQa = {
    phase: 'WORKER_0',
    runId: input.runId,
    status,
    decision,
    gates: {
      source_of_truth_pr_evidence: sourceAudit,
      worker_schema_audit: workerSchemaAudit,
      approved_plan_snapshot_intake: approvedPlanIntakeAudit,
      worker_claim_lease: workerClaimLeaseAudit,
      worker_artifact_scope: workerArtifactScopeAudit,
      worker_event_log: workerEventLogAudit,
      gap_map: gapMap,
      worker1_next_phase_plan: nextPhasePlan,
      private_artifact_upload_status: privateArtifactUploadStatus,
      supabase_milestone_sync: buildWorkerRuntimeSupabaseSyncStatus(true),
    },
    safetyFlags: WORKER_RUNTIME_SAFETY_FLAGS,
    passed: decision === 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run' &&
      (privateArtifactUploadStatus === 'uploaded' || privateArtifactUploadStatus === 'not_attempted'),
  }
  const report = {
    phase: WORKER_RUNTIME_JOBS_AUDIT_PHASE,
    owner: WORKER_RUNTIME_JOBS_AUDIT_OWNER,
    runId: input.runId,
    status,
    decision,
    branch: WORKER_RUNTIME_JOBS_AUDIT_BRANCH,
    baseBranch: WORKER_RUNTIME_JOBS_AUDIT_BASE_BRANCH,
    prTitle: WORKER_RUNTIME_JOBS_AUDIT_PR_TITLE,
    sourcePr: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR,
    sourcePlanSnapshotRunId: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
    sourcePlanSnapshotDecision: sourceAudit.sourceDecision,
    sourcePlanSnapshotStatus: sourceAudit.sourceEvidenceStatus,
    planSnapshotExecutionStatus: sourceAudit.planSnapshotExecutionStatus,
    planSnapshotApprovedForRuntime: false,
    candidatePlanId: sourceAudit.candidatePlanId,
    approvedPlanSnapshotIntake: {
      status: approvedPlanIntakeAudit.status,
      compatibleForReviewOnly: approvedPlanIntakeAudit.candidateContractCompatibleForReview,
      runtimeApproved: false,
    },
    workerSchema: {
      status: workerSchemaAudit.status,
      tablesPresent: workerSchemaAudit.requiredTables.filter((item) => item.status === 'present').length,
      functionsPresent: workerSchemaAudit.requiredFunctions.filter((item) => item.status === 'present').length,
      readiness: workerSchemaAudit.workerSchemaReadiness,
    },
    claimLease: {
      status: workerClaimLeaseAudit.status,
      executionStatus: workerClaimLeaseAudit.claimExecutionStatus,
      transactionRpcRaceWindowTodosPresent: workerClaimLeaseAudit.transactionRpcRaceWindowTodosPresent,
      futureRuntimeBlockers: workerClaimLeaseAudit.futureRuntimeBlockers,
    },
    artifactScope: {
      status: workerArtifactScopeAudit.status,
      privateGcsRefsOnly: workerArtifactScopeAudit.privateGcsRefsOnly,
      signedUrlsSourceOfTruth: false,
      publicArtifactsAllowed: false,
    },
    eventLog: {
      status: workerEventLogAudit.status,
      readiness: workerEventLogAudit.eventLogReadiness,
    },
    gapMap: {
      status: gapMap.status,
      worker1Readiness: gapMap.worker1Readiness,
      gapCount: gapMap.gaps.length,
    },
    worker1NextPhaseReadiness: nextPhasePlan.readiness,
    privateArtifactUploadStatus,
    privateGeneratedArtifactPrefix: getWorkerRuntimeJobsAuditGeneratedPrefix(input.runId),
    privateQaArtifactPrefix: getWorkerRuntimeJobsAuditQaPrefix(input.runId),
    supabaseMilestoneSync: buildWorkerRuntimeSupabaseSyncStatus(true),
    safetyFlags: WORKER_RUNTIME_SAFETY_FLAGS,
    activeBlockers,
  }
  const summary = {
    phase: WORKER_RUNTIME_JOBS_AUDIT_PHASE,
    owner: WORKER_RUNTIME_JOBS_AUDIT_OWNER,
    runId: input.runId,
    status,
    decision,
    sourcePlanSnapshotRunId: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
    sourcePr: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR,
    candidatePlanId: sourceAudit.candidatePlanId,
    planSnapshotExecutionStatus: sourceAudit.planSnapshotExecutionStatus,
    planSnapshotApprovedForRuntime: false,
    workerSchemaReadiness: workerSchemaAudit.workerSchemaReadiness,
    claimExecutionStatus: workerClaimLeaseAudit.claimExecutionStatus,
    eventLogReadiness: workerEventLogAudit.eventLogReadiness,
    worker1Readiness: nextPhasePlan.readiness,
    privateArtifactUploadStatus,
    supabaseMilestoneSync: buildWorkerRuntimeSupabaseSyncStatus(true),
    safetyFlags: WORKER_RUNTIME_SAFETY_FLAGS,
    activeBlockers,
  }

  return {
    sourceAudit,
    workerSchemaAudit,
    approvedPlanIntakeAudit,
    workerClaimLeaseAudit,
    workerArtifactScopeAudit,
    workerEventLogAudit,
    gapMap,
    nextPhasePlan,
    manifest,
    qa,
    report,
    summary,
  }
}
