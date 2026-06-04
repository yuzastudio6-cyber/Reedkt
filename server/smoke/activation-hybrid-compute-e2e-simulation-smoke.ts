import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  HYBRID_COMPUTE_E2E_EXPECTED_REPORTS,
  HYBRID_COMPUTE_E2E_REPORT_DIR,
  buildHybridComputeE2EReports,
} from '../activation/hybrid-compute-e2e-simulation'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:hybrid-compute-e2e-simulation:plan',
  'activation:hybrid-compute-e2e-simulation',
  'activation:hybrid-compute-e2e-simulation:report',
  'activation:hybrid-compute-e2e-simulation:summary',
  'activation:hybrid-compute-e2e-simulation:iam-plan',
  'activation:hybrid-compute-e2e-simulation:cost-summary',
  'smoke:activation-hybrid-compute-e2e-simulation',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const sharedDir = 'src/lib/track-b/hybrid-compute-e2e-simulation'
const moduleDir = 'server/activation/hybrid-compute-e2e-simulation'
assert(existsSync(sharedDir), 'Shared hybrid compute E2E simulation library missing.')
assert(existsSync(moduleDir), 'Hybrid compute E2E activation module missing.')
assert(!existsSync('server/workers/hybrid-compute-e2e-simulation'), 'Phase 44J must not add real workers.')
assert(HYBRID_COMPUTE_E2E_REPORT_DIR === 'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports', 'Unexpected Phase 44J report directory.')
assert(HYBRID_COMPUTE_E2E_EXPECTED_REPORTS.length === 14, 'Phase 44J expected report list must include all required safe reports.')

for (const { file, text } of readAllFiles(sharedDir)) {
  assert(!text.includes('node:child_process'), `Shared simulation library must not import child_process: ${file}`)
  assert(!text.includes('node:fs'), `Shared simulation library must not import fs: ${file}`)
  assert(!text.includes('process.env'), `Shared simulation library must not read env vars: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Shared simulation library must not reference service-role secrets: ${file}`)
  assert(!text.includes('providerKey'), `Shared simulation library must not reference provider keys: ${file}`)
  assert(!/from ['"].*server\//.test(text), `Shared simulation library must not import server modules: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Shared simulation library must not import Track A: ${file}`)
}

for (const { file, text } of readAllFiles(moduleDir)) {
  assert(!text.includes("from 'node:child_process'"), `Phase 44J activation must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Phase 44J activation must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Phase 44J activation must not spawn processes: ${file}`)
  assert(!text.includes('execFileAsync('), `Phase 44J activation must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Phase 44J activation must not make network calls: ${file}`)
  assert(!text.includes('providerKey'), `Phase 44J activation must not reference provider keys: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Phase 44J activation must not import Track A: ${file}`)
}

const reports = buildHybridComputeE2EReports()

const inputManifest = reports.inputManifest as {
  requiredInputs?: Array<{ inputId?: string; loaded?: boolean; privatePayloadsRead?: boolean }>
}
for (const inputId of [
  'pr161_capability_manifests',
  'pr164_route_manifest',
  'pr167_web_capability_profiler',
  'pr176_desktop_capability_profiler',
  'pr177_desktop_benchmark_runner',
  'pr180_cost_estimator',
  'pr181_local_worker_sidecar',
]) {
  const input = inputManifest.requiredInputs?.find((entry) => entry.inputId === inputId)
  assert(input?.loaded === true, `Missing required Phase 44J input: ${inputId}`)
  assert(input?.privatePayloadsRead === false, `Phase 44J must not read private payloads: ${inputId}`)
}

const schema = reports.simulationSchema as {
  simulationMode?: string
  noExecutionPerformed?: boolean
  blockedInputs?: string[]
}
assert(schema.simulationMode === 'synthetic_metadata_only', 'Phase 44J schema must be synthetic metadata only.')
assert(schema.noExecutionPerformed === true, 'Phase 44J schema must assert no execution.')
for (const blocked of ['route execution', 'worker execution', 'provider calls', 'public output', 'Track A runtime/visual/render stack']) {
  assert(schema.blockedInputs?.includes(blocked), `Missing global blocked scope: ${blocked}`)
}

const planManifest = reports.planSnapshotFixtureManifest as {
  fixtureCount?: number
  fixtures?: Array<{ fixtureId?: string; expectedRouteRecommendation?: string; expectedBlockedReasons?: string[] }>
}
assert(planManifest.fixtureCount === 15, 'Phase 44J must define exactly 15 plan fixtures.')

const artifactManifest = reports.artifactScopeFixtureManifest as {
  fixtureCount?: number
  results?: Array<{ fixtureId?: string; status?: string; accepted?: boolean; blockedReasons?: string[] }>
}
assert(artifactManifest.fixtureCount === 7, 'Phase 44J must define exactly 7 artifact scope fixtures.')
for (const fixtureId of ['artifact-block-public-output', 'artifact-block-arbitrary-path', 'artifact-block-signed-url-source', 'artifact-block-missing-output-scope']) {
  const fixture = artifactManifest.results?.find((entry) => entry.fixtureId === fixtureId)
  assert(fixture?.status === 'passed' && fixture.accepted === false, `Blocked artifact fixture must fail closed: ${fixtureId}`)
}

const routeReport = reports.routeSimulationReport as {
  status?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  noExecutionPerformed?: boolean
  results?: Array<{ fixtureId?: string; recommendation?: string; routeExecutionAllowed?: boolean; runtimeExecutionAllowed?: boolean; workerExecutionAllowed?: boolean; blockedReasons?: string[] }>
}
assert(routeReport.status === 'passed', 'Route simulation must pass.')
assert(routeReport.routeExecutionAllowed === false, 'Route execution must remain false.')
assert(routeReport.runtimeExecutionAllowed === false, 'Runtime execution must remain false.')
assert(routeReport.workerExecutionAllowed === false, 'Worker execution must remain false.')
assert(routeReport.noExecutionPerformed === true, 'Route simulation must perform no execution.')
for (const fixtureId of [
  'plan-vlm-blocked',
  'plan-demucs-blocked',
  'plan-broad-media-blocked',
  'plan-public-output-blocked',
  'plan-provider-call-blocked',
  'plan-raw-chat-execution-blocked',
  'plan-missing-artifact-scope-blocked',
  'plan-cost-hard-block',
]) {
  const result = routeReport.results?.find((entry) => entry.fixtureId === fixtureId)
  assert(result?.recommendation === 'blocked', `Route fixture must block: ${fixtureId}`)
}
for (const fixtureId of ['plan-audio-deepfilternet-internal', 'plan-audio-signalsmith-internal', 'plan-media-data-sharp-thumbnail', 'plan-media-data-duckdb-reporting', 'plan-ocr-safe-zone']) {
  const result = routeReport.results?.find((entry) => entry.fixtureId === fixtureId)
  assert(result?.recommendation === 'eligible_metadata_only', `Eligible metadata fixture missing: ${fixtureId}`)
  assert(result?.routeExecutionAllowed === false && result.runtimeExecutionAllowed === false && result.workerExecutionAllowed === false, `Eligible fixture must still block execution: ${fixtureId}`)
}
assert(routeReport.results?.some((entry) => entry.fixtureId === 'plan-low-resource-server-preferred' && entry.recommendation === 'future_server_candidate'), 'Low-resource fixture must prefer future server candidate.')
assert(routeReport.results?.some((entry) => entry.fixtureId === 'plan-high-desktop-future-local-candidate' && entry.recommendation === 'future_local_candidate'), 'High-desktop fixture must be future local candidate only.')

const costReport = reports.costSimulationReport as {
  status?: string
  noBillingApiCalls?: boolean
  noExecutionPerformed?: boolean
  results?: Array<{ fixtureId?: string; decision?: string; blockedReasons?: string[] }>
}
assert(costReport.status === 'passed', 'Cost simulation must pass.')
assert(costReport.noBillingApiCalls === true, 'Cost simulation must not call billing APIs.')
assert(costReport.noExecutionPerformed === true, 'Cost simulation must perform no execution.')
for (const fixtureId of ['plan-vlm-blocked', 'plan-demucs-blocked', 'plan-provider-call-blocked', 'plan-broad-media-blocked', 'plan-cost-hard-block']) {
  assert(costReport.results?.some((entry) => entry.fixtureId === fixtureId && entry.decision === 'blocked'), `Cost fixture must block: ${fixtureId}`)
}

const sidecarReport = reports.sidecarSimulationReport as {
  status?: string
  executionBlockedForEveryFixture?: boolean
  noSidecarProcessStarted?: boolean
  noExecutionPerformed?: boolean
  results?: Array<{ executionBlocked?: boolean }>
}
assert(sidecarReport.status === 'passed', 'Sidecar simulation must pass.')
assert(sidecarReport.executionBlockedForEveryFixture === true, 'Every sidecar fixture must block execution.')
assert(sidecarReport.noSidecarProcessStarted === true, 'Phase 44J must not start a sidecar process.')
assert(sidecarReport.noExecutionPerformed === true, 'Sidecar simulation must perform no execution.')

const failureReport = reports.failureSimulationReport as {
  status?: string
  failureCount?: number
  noFallbackToRawExecution?: boolean
  results?: Array<{ fixtureId?: string; blocked?: boolean; noExecutionPerformed?: boolean }>
}
assert(failureReport.status === 'passed', 'Failure simulation must pass.')
assert((failureReport.failureCount ?? 0) >= 13, 'Failure simulation must include required fail-closed cases.')
assert(failureReport.noFallbackToRawExecution === true, 'Failure simulation must block raw execution fallback.')
for (const fixtureId of ['failure-frontend-secret-request', 'failure-vlm', 'failure-demucs', 'failure-provider-call', 'failure-public-artifact']) {
  assert(failureReport.results?.some((entry) => entry.fixtureId === fixtureId && entry.blocked === true && entry.noExecutionPerformed === true), `Missing failure fixture: ${fixtureId}`)
}

const readiness = reports.readinessDecision as {
  status?: string
  hybridComputeE2eSimulation?: string
  routeExecution?: string
  runtimeExecution?: string
  workerExecution?: string
  sidecarExecution?: string
  production?: string
  externalBeta?: string
}
assert(readiness.status === 'passed', 'Phase 44J readiness validation must pass.')
assert(readiness.hybridComputeE2eSimulation === 'phase_complete_restricted_scope', 'Phase 44J readiness must be restricted-scope complete.')
for (const field of ['routeExecution', 'runtimeExecution', 'workerExecution', 'sidecarExecution', 'production', 'externalBeta'] as const) {
  assert(readiness[field] === 'blocked', `Readiness must keep ${field} blocked.`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '44J',
  reportDir: HYBRID_COMPUTE_E2E_REPORT_DIR,
  expectedReports: HYBRID_COMPUTE_E2E_EXPECTED_REPORTS.length,
  planFixtures: planManifest.fixtureCount,
  artifactScopeFixtures: artifactManifest.fixtureCount,
  routeExecution: 'blocked',
  runtimeExecution: 'blocked',
  workerExecution: 'blocked',
  sidecarExecution: 'blocked',
  trackA: 'not_touched',
}, null, 2))
