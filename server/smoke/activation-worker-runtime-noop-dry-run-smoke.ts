import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS,
  WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR,
  buildWorkerRuntimeNoopDryRunReports,
  scanWorkerRuntimeNoopDryRunArtifactsForUnsafePatterns,
} from '../activation/worker-runtime-noop-dry-run'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:worker-runtime-noop-dry-run:plan',
  'activation:worker-runtime-noop-dry-run',
  'activation:worker-runtime-noop-dry-run:report',
  'activation:worker-runtime-noop-dry-run:summary',
  'smoke:activation-worker-runtime-noop-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/worker-runtime-noop-dry-run/index.ts'), 'Worker no-op dry-run module missing.')
assert(existsSync('server/activation/worker-runtime-noop-dry-run/noop-dry-run-types.ts'), 'Worker no-op dry-run types missing.')
assert(!existsSync('server/workers/worker-runtime-noop-dry-run'), 'No-op dry-run must not add a worker implementation.')
assert(!existsSync('server/routes/worker-runtime-noop-dry-run.ts'), 'No-op dry-run must not add a route.')
assert(existsSync(WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR), 'Worker no-op dry-run report dir missing.')
for (const report of WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/worker-runtime-noop-dry-run.md',
  'docs/worker-runtime-noop-dry-run-decision.md',
  'docs/worker-runtime-noop-dry-run-artifact-scope.md',
  'docs/worker-runtime-noop-dry-run-fail-closed.md',
  'docs/implementation-prompts/prompt-tool-route-dry-run-approval-after-worker-noop.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildWorkerRuntimeNoopDryRunReports()
const decision = reports.decision as Record<string, unknown>
const readiness = reports.readinessReport as Record<string, unknown>
const fixtureValidation = reports.fixtureValidationReport as Record<string, unknown>
const intake = reports.workerIntakeValidationReport as Record<string, unknown>
const lifecycle = reports.workerLifecycleSimulationReport as Record<string, unknown>
const artifact = reports.artifactScopeValidationReport as Record<string, unknown>
const route = reports.routeMetadataResolutionReport as Record<string, unknown>
const observability = reports.observabilityCostFailureReport as Record<string, unknown>
const failClosed = reports.failClosedReport as Record<string, unknown>

assert(
  decision.decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval',
  'Worker no-op dry-run decision should pass for tool-route dry-run approval.',
)
assert(readiness.noopDryRunPassed === true, 'No-op dry-run should be marked passed.')
assert(readiness.readyForToolRouteDryRunApproval === true, 'Tool-route dry-run approval handoff should be ready.')
assert(fixtureValidation.status === 'passed', 'Fixture validation must pass.')
assert(fixtureValidation.validPassedCount === 4, 'Expected 4 valid fixtures.')
assert(fixtureValidation.invalidFailClosedCount === 4, 'Expected 4 invalid fail-closed fixtures.')
assert(intake.status === 'passed', 'Worker intake validation must pass.')
assert(intake.acceptedValidCount === 4, 'Expected 4 accepted valid fixtures.')
assert(intake.failedClosedInvalidCount === 4, 'Expected 4 failed-closed invalid fixtures.')
assert(lifecycle.status === 'passed', 'Lifecycle simulation must pass.')
assert(lifecycle.validCompletedCount === 4, 'Expected 4 no-op completed fixtures.')
assert(lifecycle.invalidFailedClosedCount === 4, 'Expected 4 failed-closed fixtures.')
assert(artifact.status === 'passed', 'Artifact scope validation must pass.')
assert(route.status === 'passed', 'Route metadata resolution must pass.')
assert(observability.status === 'passed', 'Observability/cost/failure validation must pass.')
assert(failClosed.status === 'passed', 'Fail-closed validation must pass.')

for (const [key, expected] of Object.entries({
  runtimeExecutionAllowed: false,
  workerExecution: false,
  workerExecutionAllowed: false,
  toolExecution: false,
  toolExecutionAllowed: false,
  routeExecution: false,
  routeExecutionAllowed: false,
  providerCalls: false,
  providerExecutionAllowed: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  supabaseWrites: false,
  artifactUpload: false,
  publicArtifacts: false,
  signedUrls: false,
  rawPromptExecution: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const scan = scanWorkerRuntimeNoopDryRunArtifactsForUnsafePatterns()
assert(scan.status === 'passed', `Unsafe no-op dry-run artifact patterns found: ${JSON.stringify(scan.findings)}`)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'worker-runtime-noop-dry-run-execution',
  decision: decision.decision,
  noopDryRunPassed: readiness.noopDryRunPassed,
  readyForToolRouteDryRunApproval: readiness.readyForToolRouteDryRunApproval,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
