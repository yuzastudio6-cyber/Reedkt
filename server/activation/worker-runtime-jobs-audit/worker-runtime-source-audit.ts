import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_DECISION,
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR,
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
  buildWorkerRuntimeSupabaseSyncStatus,
} from './worker-runtime-audit-policy'
import type { WorkerRuntimePathCheck, WorkerRuntimeSourceAudit } from './worker-runtime-audit-types'

const SOURCE_SUMMARY_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/summary/provider-output-plan-snapshot-contract-summary.json'
const SOURCE_REPORT_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/reports/provider-output-plan-snapshot-contract-report.json'
const SOURCE_RESULTS_DOC = 'docs/activation-phase-provider-output-plan-snapshot-contract-results.md'
const SOURCE_CANDIDATE_PLAN_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'
const SOURCE_WORKER_HANDOFF_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/handoff/worker-runtime-handoff.json'

function readJsonRecord(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathCheck(path: string, purpose: string, required = true): WorkerRuntimePathCheck {
  return { path, exists: existsSync(path), required, purpose }
}

export function buildWorkerRuntimeSourceAudit(): WorkerRuntimeSourceAudit {
  const summary = readJsonRecord(SOURCE_SUMMARY_PATH)
  const candidate = readJsonRecord(SOURCE_CANDIDATE_PLAN_PATH)
  const activeBlockers: string[] = []
  const sourceRunId = String(summary?.runId ?? 'missing')
  const sourceDecision = String(summary?.decision ?? 'missing')
  const sourceEvidenceStatus = String(summary?.status ?? 'missing')
  const planSnapshotExecutionStatus = String(summary?.executionStatus ?? candidate?.executionStatus ?? 'missing')
  const planSnapshotApprovedForRuntime = summary?.approvedForRuntime === true || candidate?.approvedForRuntime === true
  const candidatePlanId = String(summary?.candidatePlanId ?? candidate?.planId ?? 'missing')
  const ownerRoutes = Array.isArray(candidate?.ownerRoutes) ? candidate.ownerRoutes : []

  const evidenceFiles = [
    pathCheck(SOURCE_SUMMARY_PATH, 'PLAN-SNAPSHOT-1 summary with run, decision, and candidate-only status.'),
    pathCheck(SOURCE_REPORT_PATH, 'PLAN-SNAPSHOT-1 report artifact.'),
    pathCheck(SOURCE_RESULTS_DOC, 'PLAN-SNAPSHOT-1 results document.'),
    pathCheck(SOURCE_CANDIDATE_PLAN_PATH, 'Candidate approved-plan snapshot contract artifact.'),
    pathCheck(SOURCE_WORKER_HANDOFF_PATH, 'Worker Runtime review handoff artifact.'),
  ]

  for (const file of evidenceFiles) {
    if (file.required && !file.exists) activeBlockers.push(`missing_plan_snapshot_evidence:${file.path}`)
  }
  if (sourceRunId !== WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID) {
    activeBlockers.push(`unexpected_plan_snapshot_run:${sourceRunId}`)
  }
  if (sourceDecision !== WORKER_RUNTIME_JOBS_AUDIT_SOURCE_DECISION) {
    activeBlockers.push(`unexpected_plan_snapshot_decision:${sourceDecision}`)
  }
  if (sourceEvidenceStatus !== 'passed') activeBlockers.push(`plan_snapshot_status_not_passed:${sourceEvidenceStatus}`)
  if (planSnapshotExecutionStatus !== 'candidate_only') {
    activeBlockers.push(`plan_snapshot_not_candidate_only:${planSnapshotExecutionStatus}`)
  }
  if (planSnapshotApprovedForRuntime) activeBlockers.push('plan_snapshot_claims_runtime_approval')

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourcePr: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR,
    sourceRunId,
    sourceDecision,
    sourceEvidenceStatus,
    planSnapshotExecutionStatus,
    planSnapshotApprovedForRuntime,
    candidatePlanId,
    ownerRouteCount: ownerRoutes.length,
    evidenceFiles,
    supabaseMilestoneSync: buildWorkerRuntimeSupabaseSyncStatus(true),
    activeBlockers,
  }
}
