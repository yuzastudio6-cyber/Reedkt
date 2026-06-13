import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_DRY_RUN_FAMILY_IDS,
  TOOL_ROUTE_DRY_RUN_OWNER_IDS,
  TOOL_ROUTE_DRY_RUN_REPORT_DIR,
  TOOL_ROUTE_DRY_RUN_REPORT_PATHS,
  TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
  buildToolRouteDryRunBundle,
  getToolRouteDryRunRunId,
} from '../activation/tool-route-dry-run-planning'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

const bundle = buildToolRouteDryRunBundle({ runId: getToolRouteDryRunRunId() })

assert(bundle.summary.phase === 'TOOL_ROUTE_1', 'phase mismatch')
assert(bundle.summary.status === 'passed', `unexpected status: ${String(bundle.summary.status)}`)
assert(
  bundle.summary.decision === 'tool_route_dry_run_planning_passed_ready_for_tool_route_2_generated_local_fixture_planning',
  `unexpected decision: ${String(bundle.summary.decision)}`,
)
assert(bundle.sourceAudit.sourceEvidence.worker1.runId === 'worker1-20260612T193823', 'worker1 evidence mismatch')
assert(bundle.sourceAudit.sourceEvidence.toolRoute0.runId === 'toolroute0-20260612T201155', 'tool-route-0 evidence mismatch')
assert(bundle.ownerStudyContext.completedStudyCount === 6, 'expected six completed owner studies')
assert(bundle.workerDryRunContext.jobCount === 7, 'expected seven worker dry-run jobs')
assert(bundle.routeFamilyPlan.routeFamilyCount === TOOL_ROUTE_DRY_RUN_FAMILY_IDS.length, 'route family count mismatch')
assert(bundle.ownerRoutePlan.ownerRouteCount === TOOL_ROUTE_DRY_RUN_OWNER_IDS.length, 'owner route count mismatch')
assert(bundle.artifactContractMap.artifactContractCount === 15, 'artifact contract count mismatch')
assert(bundle.qaGateMap.allRequiredGatesPassed, 'QA gates must pass')
assert(bundle.blockedExecutionValidation.allExecutionBlocked, 'all execution must be blocked')
assert(
  bundle.nextPhasePlan.readiness === 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning',
  'TOOL-ROUTE-2 readiness mismatch',
)
assert(Object.values(TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS).every((value) => value === false), 'safety flags must all be false')

for (const path of [
  'server/activation/tool-route-dry-run-planning/index.ts',
  'server/cli/activation-tool-route-dry-run-planning.ts',
  'server/cli/activation-tool-route-dry-run-planning-report.ts',
  'server/cli/activation-tool-route-dry-run-planning-summary.ts',
  'scripts/validation/tool-route-dry-run-planning-diagnostics.mjs',
]) {
  assert(existsSync(path), `missing expected path: ${path}`)
}

const reportPath = `${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/${TOOL_ROUTE_DRY_RUN_REPORT_PATHS.report}`
if (existsSync(reportPath)) {
  const report = readJson(reportPath)
  assert(report.status === 'passed', 'stored report must be passed')
  assert(
    report.toolRoute2Readiness === 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning',
    'stored report readiness mismatch',
  )
}

console.log(JSON.stringify({
  status: 'passed',
  phase: bundle.summary.phase,
  runId: bundle.summary.runId,
  decision: bundle.summary.decision,
  completedOwnerStudies: bundle.ownerStudyContext.completedStudyCount,
  routeFamilyCount: bundle.routeFamilyPlan.routeFamilyCount,
  ownerRouteCount: bundle.ownerRoutePlan.ownerRouteCount,
  artifactContractCount: bundle.artifactContractMap.artifactContractCount,
  qaGateCount: bundle.qaGateMap.gateCount,
  toolRoute2Readiness: bundle.nextPhasePlan.readiness,
  toolExecution: false,
  workerExecution: false,
  routeExecution: false,
  providerModelCalls: false,
  supabaseMutation: false,
  googleCloudApiCalls: false,
  gcsStorageTransfer: false,
  production: false,
}, null, 2))
