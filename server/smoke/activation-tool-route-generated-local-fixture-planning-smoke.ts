import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_FIXTURE_FAMILY_IDS,
  TOOL_ROUTE_FIXTURE_OWNER_IDS,
  TOOL_ROUTE_FIXTURE_REPORT_DIR,
  TOOL_ROUTE_FIXTURE_REPORT_PATHS,
  TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
  buildToolRouteFixturePlanningBundle,
  getToolRouteFixtureRunId,
} from '../activation/tool-route-generated-local-fixture-planning'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

const bundle = buildToolRouteFixturePlanningBundle({ runId: getToolRouteFixtureRunId() })

assert(bundle.summary.phase === 'TOOL_ROUTE_2', 'phase mismatch')
assert(bundle.summary.status === 'passed', `unexpected status: ${String(bundle.summary.status)}`)
assert(
  bundle.summary.decision ===
    'tool_route_generated_local_fixture_planning_passed_ready_for_tool_route_3_generated_local_fixture_contract_tests',
  `unexpected decision: ${String(bundle.summary.decision)}`,
)
assert(bundle.toolRoute1Evidence.runId === 'toolroute1-20260613T141131', 'TOOL-ROUTE-1 evidence mismatch')
assert(bundle.toolStudyEvidence.completedStudyCount === 6, 'expected six completed owner studies')
assert(bundle.fixtureCatalog.fixtureCount === TOOL_ROUTE_FIXTURE_FAMILY_IDS.length, 'fixture count mismatch')
assert(bundle.inputOutputContractMap.contractCount === TOOL_ROUTE_FIXTURE_FAMILY_IDS.length, 'fixture contract count mismatch')
assert(bundle.ownerFixtureHandoffMap.ownerCount === TOOL_ROUTE_FIXTURE_OWNER_IDS.length, 'owner handoff count mismatch')
assert(bundle.qaGateMap.allRequiredGatesPassed, 'QA gates must pass')
assert(bundle.blockedExecutionValidation.allExecutionBlocked, 'all execution must be blocked')
assert(
  bundle.nextPhasePlan.readiness === 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests',
  'TOOL-ROUTE-3 readiness mismatch',
)
assert(Object.values(TOOL_ROUTE_FIXTURE_SAFETY_FLAGS).every((value) => value === false), 'safety flags must all be false')

for (const path of [
  'server/activation/tool-route-generated-local-fixture-planning/index.ts',
  'server/cli/activation-tool-route-generated-local-fixture-planning.ts',
  'server/cli/activation-tool-route-generated-local-fixture-planning-report.ts',
  'server/cli/activation-tool-route-generated-local-fixture-planning-summary.ts',
  'scripts/validation/tool-route-generated-local-fixture-planning-diagnostics.mjs',
]) {
  assert(existsSync(path), `missing expected path: ${path}`)
}

const reportPath = `${TOOL_ROUTE_FIXTURE_REPORT_DIR}/${TOOL_ROUTE_FIXTURE_REPORT_PATHS.report}`
if (existsSync(reportPath)) {
  const report = readJson(reportPath)
  assert(report.status === 'passed', 'stored report must be passed')
  assert(
    report.toolRoute3Readiness === 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests',
    'stored report readiness mismatch',
  )
}

console.log(JSON.stringify({
  status: 'passed',
  phase: bundle.summary.phase,
  runId: bundle.summary.runId,
  decision: bundle.summary.decision,
  completedOwnerStudies: bundle.toolStudyEvidence.completedStudyCount,
  fixtureCount: bundle.fixtureCatalog.fixtureCount,
  contractCount: bundle.inputOutputContractMap.contractCount,
  ownerHandoffCount: bundle.ownerFixtureHandoffMap.ownerCount,
  qaGateCount: bundle.qaGateMap.gateCount,
  toolRoute3Readiness: bundle.nextPhasePlan.readiness,
  toolExecution: false,
  workerExecution: false,
  routeExecution: false,
  providerModelCalls: false,
  supabaseMutation: false,
  googleCloudApiCalls: false,
  gcsStorageTransfer: false,
  production: false,
}, null, 2))
