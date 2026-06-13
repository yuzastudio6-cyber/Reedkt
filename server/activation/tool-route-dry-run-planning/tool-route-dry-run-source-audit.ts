import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_DRY_RUN_BASE_BRANCH,
  TOOL_ROUTE_DRY_RUN_BRANCH,
  TOOL_ROUTE_DRY_RUN_OPTIONAL_ABSENT_PATHS,
  TOOL_ROUTE_DRY_RUN_PR_STACK,
  TOOL_ROUTE_DRY_RUN_SOURCE,
  TOOL_ROUTE_DRY_RUN_SOURCE_PATHS,
  buildToolRouteDryRunSupabaseClassification,
  pathRecord,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteDryRunEvidenceSummary,
  ToolRouteDryRunSourceAudit,
} from './tool-route-dry-run-planning-types'

function readJson(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

function nestedString(value: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  let current: unknown = value
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

function evidence(
  fallback: ToolRouteDryRunEvidenceSummary,
  reportPath: string,
  runKeys: string[],
  decisionKeys: string[],
  readinessKeys: string[] = [],
): ToolRouteDryRunEvidenceSummary {
  const report = readJson(reportPath)
  return {
    ...fallback,
    runId: nestedString(report, runKeys) ?? fallback.runId,
    decision: nestedString(report, decisionKeys) ?? fallback.decision,
    status: nestedString(report, ['status']) ?? fallback.status,
    readiness: nestedString(report, readinessKeys) ?? fallback.readiness,
  }
}

export function buildToolRouteDryRunSourceAudit(): ToolRouteDryRunSourceAudit {
  const sourceFiles = [
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.modelDryRunReport,
      true,
      'MODEL-DRYRUN-1 sanitized provider dry-run readiness report.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.planSnapshotReport,
      true,
      'PLAN-SNAPSHOT-1 report confirming candidate-only snapshot contract.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.planSnapshotCandidate,
      true,
      'PLAN-SNAPSHOT-1 candidate approved-plan snapshot JSON.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker0Report,
      true,
      'WORKER-0 repo audit report.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Report,
      true,
      'WORKER-1 approved-plan dry-run report.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Batch,
      true,
      'WORKER-1 deterministic dry-run job batch plan.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1BlockedRoutes,
      true,
      'WORKER-1 blocked-route validation evidence.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.toolRoute0Report,
      true,
      'TOOL-ROUTE-0 execution unlock audit report.',
    ),
    pathRecord(
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.toolRoute0FamilyMap,
      true,
      'TOOL-ROUTE-0 route family map used as compatibility input.',
    ),
  ]

  const missing = sourceFiles
    .filter((file) => file.required && !file.exists)
    .map((file) => `missing_source_evidence:${file.path}`)

  const planSnapshotReport = readJson(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.planSnapshotReport)
  const worker1Report = readJson(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Report)
  const toolRoute0Report = readJson(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.toolRoute0Report)

  const activeBlockers = [
    ...missing,
    ...(planSnapshotReport?.approvedForRuntime === false ? [] : ['unexpected_plan_snapshot_runtime_approval_state']),
    ...(worker1Report?.decision === TOOL_ROUTE_DRY_RUN_SOURCE.worker1Decision ? [] : ['unexpected_worker1_decision']),
    ...(toolRoute0Report?.decision === TOOL_ROUTE_DRY_RUN_SOURCE.toolRoute0Decision ? [] : ['unexpected_tool_route0_decision']),
  ]

  const sourceEvidence = {
    modelDryRun1: evidence(
      {
        runId: TOOL_ROUTE_DRY_RUN_SOURCE.modelDryRunId,
        status: 'passed',
        decision: TOOL_ROUTE_DRY_RUN_SOURCE.modelDryRunDecision,
        readiness: 'ready_for_plan_snapshot_contract',
      },
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.modelDryRunReport,
      ['runId'],
      ['decision'],
      ['planSnapshotContractReady'],
    ),
    planSnapshot1: {
      ...evidence(
        {
          runId: TOOL_ROUTE_DRY_RUN_SOURCE.planSnapshotRunId,
          status: 'passed',
          decision: TOOL_ROUTE_DRY_RUN_SOURCE.planSnapshotDecision,
          readiness: 'candidate_only_not_runtime_approved',
          candidatePlanId: TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId,
        },
        TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.planSnapshotReport,
        ['runId'],
        ['decision'],
        ['workerRuntimeAuditReadiness'],
      ),
      candidatePlanId: nestedString(planSnapshotReport, ['candidatePlanId']) ?? TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId,
    },
    worker0: evidence(
      {
        runId: TOOL_ROUTE_DRY_RUN_SOURCE.worker0RunId,
        status: 'passed',
        decision: TOOL_ROUTE_DRY_RUN_SOURCE.worker0Decision,
        readiness: 'ready for approved-plan snapshot dry-run',
        candidatePlanId: TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId,
      },
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker0Report,
      ['runId'],
      ['decision'],
      ['worker1Readiness'],
    ),
    worker1: evidence(
      {
        runId: TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId,
        status: 'passed',
        decision: TOOL_ROUTE_DRY_RUN_SOURCE.worker1Decision,
        readiness: 'ready for tool-route execution unlock audit',
      },
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Report,
      ['runId'],
      ['decision'],
      ['toolRoute0Readiness'],
    ),
    toolRoute0: evidence(
      {
        runId: TOOL_ROUTE_DRY_RUN_SOURCE.toolRoute0RunId,
        status: 'passed',
        decision: TOOL_ROUTE_DRY_RUN_SOURCE.toolRoute0Decision,
        readiness: 'ready for route dry-run planning',
      },
      TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.toolRoute0Report,
      ['runId'],
      ['decision'],
      ['toolRoute1Readiness'],
    ),
    toolStudies: TOOL_ROUTE_DRY_RUN_PR_STACK
      .filter((entry) => entry.title.includes('TOOL-STUDY-0'))
      .map((entry) => ({
        runId: `pr-${entry.pr}`,
        status: 'merged',
        decision: 'completed_owner_tool_study_0_contract',
        mergeSha: entry.mergeSha,
        readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
      })),
  }

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    baseBranch: TOOL_ROUTE_DRY_RUN_BASE_BRANCH,
    currentBranch: TOOL_ROUTE_DRY_RUN_BRANCH,
    sourceEvidence,
    sourceFiles,
    absentOptionalTrees: TOOL_ROUTE_DRY_RUN_OPTIONAL_ABSENT_PATHS.map((path) =>
      pathRecord(path, false, 'Optional documentation tree recorded if absent on base; not created by TOOL-ROUTE-1.'),
    ),
    prStack: [...TOOL_ROUTE_DRY_RUN_PR_STACK],
    supabaseUpdateClassification: buildToolRouteDryRunSupabaseClassification(activeBlockers),
    activeBlockers,
  }
}
