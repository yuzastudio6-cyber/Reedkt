import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_APPROVED_PLAN_DRY_RUN_ABSENT_OPTIONAL_TREES,
  WORKER_APPROVED_PLAN_DRY_RUN_PATHS,
  WORKER_APPROVED_PLAN_DRY_RUN_SOURCE,
  buildWorkerDryRunSupabaseStatus,
} from './worker-approved-plan-dry-run-policy'
import type { WorkerDryRunPathCheck, WorkerDryRunSourceAudit } from './worker-approved-plan-dry-run-types'

function readJsonRecord(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathCheck(path: string, purpose: string, required = true): WorkerDryRunPathCheck {
  return { path, exists: existsSync(path), required, purpose }
}

export function buildWorkerDryRunSourceAudit(): WorkerDryRunSourceAudit {
  const worker0Summary = readJsonRecord(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.worker0Summary)
  const planSummary = readJsonRecord(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotSummary)
  const modelReadiness = readJsonRecord(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.modelDryRunReadiness)
  const sourceFiles = [
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.worker0Summary, 'WORKER-0 summary evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.worker0Report, 'WORKER-0 report evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.worker0ResultsDoc, 'WORKER-0 results document.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotSummary, 'PLAN-SNAPSHOT-1 summary evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotCandidate, 'PLAN-SNAPSHOT-1 candidate snapshot JSON.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotReport, 'PLAN-SNAPSHOT-1 report evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotWorkerHandoff, 'PLAN-SNAPSHOT-1 Worker Runtime handoff evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.modelDryRunDecision, 'MODEL-DRYRUN-1 decision evidence.'),
    pathCheck(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.modelDryRunReadiness, 'MODEL-DRYRUN-1 readiness evidence.'),
  ]
  const absentOptionalTrees = WORKER_APPROVED_PLAN_DRY_RUN_ABSENT_OPTIONAL_TREES.map((path) =>
    pathCheck(path, 'Optional upstream compatibility/source tree checked for presence.', false),
  )

  const worker0 = {
    runId: String(worker0Summary.runId ?? 'missing'),
    decision: String(worker0Summary.decision ?? 'missing'),
    status: String(worker0Summary.status ?? 'missing'),
    worker1Readiness: String(worker0Summary.worker1Readiness ?? 'missing'),
    privateArtifactUploadStatus: String(worker0Summary.privateArtifactUploadStatus ?? 'missing'),
  }
  const planSnapshot1 = {
    runId: String(planSummary.runId ?? 'missing'),
    decision: String(planSummary.decision ?? 'missing'),
    status: String(planSummary.status ?? 'missing'),
    candidatePlanId: String(planSummary.candidatePlanId ?? 'missing'),
    executionStatus: String(planSummary.executionStatus ?? 'missing'),
    approvedForRuntime: planSummary.approvedForRuntime === true,
  }
  const modelDryRun1 = {
    runId: String(modelReadiness.runId ?? 'missing'),
    decision: String(modelReadiness.decision ?? 'missing'),
    status: String(modelReadiness.status ?? 'missing'),
    planSnapshotContractReady: modelReadiness.planSnapshotContractReady === true,
  }
  const activeBlockers = [
    ...sourceFiles.filter((item) => item.required && !item.exists).map((item) => `missing_source_file:${item.path}`),
  ]

  if (worker0.runId !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.worker0RunId) {
    activeBlockers.push(`unexpected_worker0_run:${worker0.runId}`)
  }
  if (worker0.decision !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.worker0Decision) {
    activeBlockers.push(`unexpected_worker0_decision:${worker0.decision}`)
  }
  if (worker0.worker1Readiness !== 'ready for approved-plan snapshot dry-run') {
    activeBlockers.push(`worker0_not_ready_for_worker1:${worker0.worker1Readiness}`)
  }
  if (planSnapshot1.runId !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.planSnapshotRunId) {
    activeBlockers.push(`unexpected_plan_snapshot_run:${planSnapshot1.runId}`)
  }
  if (planSnapshot1.decision !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.planSnapshotDecision) {
    activeBlockers.push(`unexpected_plan_snapshot_decision:${planSnapshot1.decision}`)
  }
  if (planSnapshot1.candidatePlanId !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.candidatePlanId) {
    activeBlockers.push(`unexpected_candidate_plan:${planSnapshot1.candidatePlanId}`)
  }
  if (planSnapshot1.executionStatus !== 'candidate_only') {
    activeBlockers.push(`plan_snapshot_not_candidate_only:${planSnapshot1.executionStatus}`)
  }
  if (planSnapshot1.approvedForRuntime) activeBlockers.push('plan_snapshot_claims_runtime_approval')
  if (modelDryRun1.runId !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.modelDryRunId) {
    activeBlockers.push(`unexpected_model_dry_run:${modelDryRun1.runId}`)
  }
  if (modelDryRun1.decision !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.modelDryRunDecision) {
    activeBlockers.push(`unexpected_model_dry_run_decision:${modelDryRun1.decision}`)
  }
  if (!modelDryRun1.planSnapshotContractReady) activeBlockers.push('model_dry_run_not_ready_for_plan_snapshot_contract')

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    worker0,
    planSnapshot1,
    modelDryRun1,
    sourceFiles,
    absentOptionalTrees,
    supabaseMilestoneSync: buildWorkerDryRunSupabaseStatus(true),
    activeBlockers,
  }
}
