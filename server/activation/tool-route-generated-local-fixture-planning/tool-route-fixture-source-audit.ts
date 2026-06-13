import {
  TOOL_ROUTE_FIXTURE_BASE_BRANCH,
  TOOL_ROUTE_FIXTURE_BRANCH,
  TOOL_ROUTE_FIXTURE_OPTIONAL_ABSENT_PATHS,
  TOOL_ROUTE_FIXTURE_PR_STACK,
  TOOL_ROUTE_FIXTURE_SOURCE,
  TOOL_ROUTE_FIXTURE_SOURCE_PATHS,
  buildToolRouteFixtureSupabaseClassification,
  fixturePathRecord,
} from './tool-route-fixture-planning-policy'
import type { ToolRouteFixtureSourceAudit } from './tool-route-fixture-planning-types'

const REQUIRED_SOURCE_PATHS = [
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.modelDryRunReport, 'MODEL-DRYRUN-1 report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.planSnapshotReport, 'PLAN-SNAPSHOT-1 report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.planSnapshotCandidate, 'PLAN-SNAPSHOT-1 candidate approved-plan snapshot'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker0Report, 'WORKER-0 audit report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker1Report, 'WORKER-1 dry-run report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker1Batch, 'WORKER-1 dry-run batch plan'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker1BlockedRoutes, 'WORKER-1 blocked-route validation'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute0Report, 'TOOL-ROUTE-0 report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1Report, 'TOOL-ROUTE-1 report'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1RouteFamilyPlan, 'TOOL-ROUTE-1 route family plan'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1OwnerRoutePlan, 'TOOL-ROUTE-1 owner route plan'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1ArtifactContractMap, 'TOOL-ROUTE-1 artifact contract map'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1QaGateMap, 'TOOL-ROUTE-1 QA gate map'],
  [TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1BlockedExecution, 'TOOL-ROUTE-1 blocked execution validation'],
] as const

const TOOL_STUDY_MERGES = [
  {
    runId: 'pr-354',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: '51ba1d44965d758935241af7712779bb15d713c6',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
  {
    runId: 'pr-356',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: 'c0c96030358d52852b712b9f239a3237490d25ec',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
  {
    runId: 'pr-361',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: '05d429f6029136f0f55fe01375809071b588791c',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
  {
    runId: 'pr-364',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: '0ac258f939f403dbef438d3184408f28f874f26c',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
  {
    runId: 'pr-365',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: '454d06caaf3b3349efa541f3ce50aac0bc0044aa',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
  {
    runId: 'pr-371',
    status: 'merged',
    decision: 'completed_owner_tool_study_0_contract',
    mergeSha: 'f6283e63742d6999910d3887482dc3112da1e570',
    readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning',
  },
] as const

export function buildToolRouteFixtureSourceAudit(): ToolRouteFixtureSourceAudit {
  const sourceFiles = REQUIRED_SOURCE_PATHS.map(([sourcePath, purpose]) =>
    fixturePathRecord(sourcePath, true, purpose),
  )
  const optionalMissingPaths = TOOL_ROUTE_FIXTURE_OPTIONAL_ABSENT_PATHS.map((sourcePath) =>
    fixturePathRecord(sourcePath, false, 'optional status/readiness integration path not present on this base'),
  )
  const activeBlockers = sourceFiles
    .filter((file) => !file.exists)
    .map((file) => `missing_source_file:${file.path}`)

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    baseBranch: TOOL_ROUTE_FIXTURE_BASE_BRANCH,
    currentBranch: TOOL_ROUTE_FIXTURE_BRANCH,
    sourceEvidence: {
      modelDryRun1: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.modelDryRunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.modelDryRunDecision,
        readiness: 'ready_for_plan_snapshot_contract',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.modelDryRunReport,
      },
      planSnapshot1: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.planSnapshotRunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.planSnapshotDecision,
        readiness: 'ready_for_worker_runtime_repo_audit',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.planSnapshotReport,
      },
      worker0: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.worker0RunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.worker0Decision,
        readiness: 'ready for approved-plan snapshot dry-run',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker0Report,
      },
      worker1: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.worker1RunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.worker1Decision,
        readiness: 'ready for tool-route execution unlock audit',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.worker1Report,
      },
      toolRoute0: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute0RunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute0Decision,
        readiness: 'ready for route dry-run planning',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute0Report,
      },
      toolRoute1: {
        runId: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1RunId,
        status: 'passed',
        decision: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1Decision,
        readiness: 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning',
        mergeSha: 'b1fc1d40c5a41c6e3874331d2ed84dc7072d7364',
        path: TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1Report,
      },
      toolStudies: [...TOOL_STUDY_MERGES],
    },
    sourceFiles,
    optionalMissingPaths,
    prStack: [...TOOL_ROUTE_FIXTURE_PR_STACK],
    supabaseUpdateClassification: buildToolRouteFixtureSupabaseClassification(activeBlockers),
    activeBlockers,
  }
}
