import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_AUDIT_BASE_BRANCH,
  TOOL_ROUTE_AUDIT_BRANCH,
  TOOL_ROUTE_AUDIT_OPTIONAL_ABSENT_PATHS,
  TOOL_ROUTE_AUDIT_SOURCE,
  TOOL_ROUTE_AUDIT_SOURCE_PATHS,
  buildToolRouteSupabaseClassification,
  optionalPathRecord,
} from './tool-route-audit-policy'
import type {
  ToolRouteEvidenceSummary,
  ToolRouteSourceAudit,
  ToolRouteSourceFile,
} from './tool-route-audit-types'

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

function stringValue(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function booleanValue(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key]
  return typeof value === 'boolean' ? value : undefined
}

function sourceFile(path: string, purpose: string): ToolRouteSourceFile {
  return { path, exists: existsSync(path), required: true, purpose }
}

function summarizeWorker1(): ToolRouteEvidenceSummary {
  const summary = readJson(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1Summary)
  return {
    runId: stringValue(summary, 'runId'),
    status: stringValue(summary, 'status'),
    decision: stringValue(summary, 'decision'),
    readiness: stringValue(summary, 'toolRoute0Readiness'),
  }
}

function summarizeWorker0(): ToolRouteEvidenceSummary {
  const summary = readJson(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker0Summary)
  return {
    runId: stringValue(summary, 'runId'),
    status: stringValue(summary, 'status'),
    decision: stringValue(summary, 'decision'),
    readiness: stringValue(summary, 'worker1Readiness'),
    candidatePlanId: stringValue(summary, 'candidatePlanId'),
  }
}

function summarizePlanSnapshot1(): ToolRouteEvidenceSummary {
  const summary = readJson(TOOL_ROUTE_AUDIT_SOURCE_PATHS.planSnapshotSummary)
  const approvedForRuntime = booleanValue(summary, 'approvedForRuntime')
  return {
    runId: stringValue(summary, 'runId'),
    status: stringValue(summary, 'status'),
    decision: stringValue(summary, 'decision'),
    readiness: approvedForRuntime === false ? 'candidate_only_not_runtime_approved' : 'unexpected_runtime_approval_state',
    candidatePlanId: stringValue(summary, 'candidatePlanId'),
  }
}

function summarizeModelDryRun1(): ToolRouteEvidenceSummary {
  const summary = readJson(TOOL_ROUTE_AUDIT_SOURCE_PATHS.modelDryRunReadiness)
  return {
    runId: stringValue(summary, 'runId'),
    status: stringValue(summary, 'status'),
    decision: stringValue(summary, 'decision'),
    readiness: booleanValue(summary, 'planSnapshotContractReady') === true
      ? 'ready_for_plan_snapshot_contract'
      : 'not_ready_for_plan_snapshot_contract',
  }
}

export function buildToolRouteSourceAudit(): ToolRouteSourceAudit {
  const sourceFiles: ToolRouteSourceFile[] = [
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1Summary, 'WORKER-1 summary evidence.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1Report, 'WORKER-1 report evidence.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1Batch, 'WORKER-1 deterministic job batch plan.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1BlockedRoutes, 'WORKER-1 blocked route validation.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1ResultsDoc, 'WORKER-1 results document.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker0Summary, 'WORKER-0 source readiness evidence.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.planSnapshotSummary, 'PLAN-SNAPSHOT-1 source readiness evidence.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.planSnapshotCandidate, 'PLAN-SNAPSHOT-1 candidate snapshot.'),
    sourceFile(TOOL_ROUTE_AUDIT_SOURCE_PATHS.modelDryRunReadiness, 'MODEL-DRYRUN-1 source readiness evidence.'),
  ]
  const activeBlockers = sourceFiles
    .filter((file) => file.required && !file.exists)
    .map((file) => `missing_source_file:${file.path}`)

  let worker1: ToolRouteEvidenceSummary = { runId: '', status: 'blocked', decision: 'missing', readiness: 'missing' }
  let worker0: ToolRouteEvidenceSummary = { runId: '', status: 'blocked', decision: 'missing', readiness: 'missing' }
  let planSnapshot1: ToolRouteEvidenceSummary = { runId: '', status: 'blocked', decision: 'missing', readiness: 'missing' }
  let modelDryRun1: ToolRouteEvidenceSummary = { runId: '', status: 'blocked', decision: 'missing', readiness: 'missing' }

  if (activeBlockers.length === 0) {
    worker1 = summarizeWorker1()
    worker0 = summarizeWorker0()
    planSnapshot1 = summarizePlanSnapshot1()
    modelDryRun1 = summarizeModelDryRun1()
    if (worker1.runId !== TOOL_ROUTE_AUDIT_SOURCE.worker1RunId) activeBlockers.push(`unexpected_worker1_run:${worker1.runId}`)
    if (worker1.decision !== TOOL_ROUTE_AUDIT_SOURCE.worker1Decision) activeBlockers.push(`unexpected_worker1_decision:${worker1.decision}`)
    if (worker0.runId !== TOOL_ROUTE_AUDIT_SOURCE.worker0RunId) activeBlockers.push(`unexpected_worker0_run:${worker0.runId}`)
    if (worker0.decision !== TOOL_ROUTE_AUDIT_SOURCE.worker0Decision) activeBlockers.push(`unexpected_worker0_decision:${worker0.decision}`)
    if (planSnapshot1.runId !== TOOL_ROUTE_AUDIT_SOURCE.planSnapshotRunId) activeBlockers.push(`unexpected_plan_snapshot_run:${planSnapshot1.runId}`)
    if (planSnapshot1.decision !== TOOL_ROUTE_AUDIT_SOURCE.planSnapshotDecision) activeBlockers.push(`unexpected_plan_snapshot_decision:${planSnapshot1.decision}`)
    if (planSnapshot1.candidatePlanId !== TOOL_ROUTE_AUDIT_SOURCE.candidatePlanId) activeBlockers.push(`unexpected_candidate_plan:${planSnapshot1.candidatePlanId}`)
    if (modelDryRun1.runId !== TOOL_ROUTE_AUDIT_SOURCE.modelDryRunId) activeBlockers.push(`unexpected_model_dry_run:${modelDryRun1.runId}`)
    if (modelDryRun1.decision !== TOOL_ROUTE_AUDIT_SOURCE.modelDryRunDecision) activeBlockers.push(`unexpected_model_dry_run_decision:${modelDryRun1.decision}`)
  }

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourceEvidence: { worker1, worker0, planSnapshot1, modelDryRun1 },
    sourceFiles,
    absentOptionalTrees: TOOL_ROUTE_AUDIT_OPTIONAL_ABSENT_PATHS.map((path) =>
      optionalPathRecord(path, 'Optional compatibility/source path checked and not created by TOOL-ROUTE-0.'),
    ),
    currentBranch: TOOL_ROUTE_AUDIT_BRANCH,
    baseBranch: TOOL_ROUTE_AUDIT_BASE_BRANCH,
    prStack: [
      { pr: 343, title: '[worker] Approved plan snapshot dry run', expectedRunId: TOOL_ROUTE_AUDIT_SOURCE.worker1RunId },
      { pr: 340, title: '[worker] Worker Runtime Jobs repo audit', expectedRunId: TOOL_ROUTE_AUDIT_SOURCE.worker0RunId },
      { pr: 334, title: '[plan] Provider output approved-plan snapshot contract', expectedRunId: TOOL_ROUTE_AUDIT_SOURCE.planSnapshotRunId },
      { pr: 331, title: '[model] Qwen DeepSeek full synthetic provider dry run', expectedRunId: TOOL_ROUTE_AUDIT_SOURCE.modelDryRunId },
    ],
    supabaseUpdateClassification: buildToolRouteSupabaseClassification(),
    activeBlockers,
  }
}
