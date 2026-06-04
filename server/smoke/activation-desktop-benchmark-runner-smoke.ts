import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS,
  DESKTOP_BENCHMARK_RUNNER_REPORT_DIR,
  buildDesktopBenchmarkRunnerReports,
} from '../activation/desktop-benchmark-runner'
import {
  DESKTOP_BENCHMARK_CAPS,
  DESKTOP_BENCHMARK_FIXTURES,
  DESKTOP_BENCHMARK_PRIVACY_POLICY,
  runDesktopBenchmarkFixtures,
} from '../../src/lib/track-b/desktop-benchmark-runner'

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
  'activation:desktop-benchmark-runner:plan',
  'activation:desktop-benchmark-runner',
  'activation:desktop-benchmark-runner:report',
  'activation:desktop-benchmark-runner:summary',
  'activation:desktop-benchmark-runner:iam-plan',
  'activation:desktop-benchmark-runner:cost-summary',
  'smoke:activation-desktop-benchmark-runner',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const desktopSafeDir = 'src/lib/track-b/desktop-benchmark-runner'
assert(existsSync(desktopSafeDir), 'Desktop-safe benchmark runner module missing.')

const desktopFiles = readAllFiles(desktopSafeDir)
for (const { file, text } of desktopFiles) {
  assert(!/from ['"].*server\//.test(text), `Desktop benchmark module imports server code: ${file}`)
  assert(!/from ['"].*server['"]/.test(text), `Desktop benchmark module imports server code: ${file}`)
  assert(!text.includes('service-role'), `Desktop benchmark module mentions service-role secrets: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Desktop benchmark module mentions service role env: ${file}`)
  assert(!text.includes('providerKey'), `Desktop benchmark module mentions provider key: ${file}`)
  assert(!text.includes('process.env'), `Desktop benchmark module references process.env: ${file}`)
  assert(!text.includes('fetch('), `Desktop benchmark module performs network fetch: ${file}`)
  assert(!/networkInterfaces\s*\(/.test(text), `Desktop benchmark module reads network interfaces: ${file}`)
  assert(!/hostname\s*\(/.test(text), `Desktop benchmark module reads hostname: ${file}`)
  assert(!/userInfo\s*\(/.test(text), `Desktop benchmark module reads username/user info: ${file}`)
  assert(!/cpus\s*\(/.test(text), `Desktop benchmark module reads exact CPU model data: ${file}`)
  assert(!text.includes('localStorage.') && !text.includes('sessionStorage.'), `Desktop benchmark module persists profile: ${file}`)
}

assert(DESKTOP_BENCHMARK_CAPS.singleThreadHardCapMs <= 1000, 'Single-thread hard cap must be <= 1000ms.')
assert(DESKTOP_BENCHMARK_CAPS.parallelHardCapMs <= 1500, 'Parallel hard cap must be <= 1500ms.')
assert(DESKTOP_BENCHMARK_CAPS.maxParallelWorkers <= 2, 'Parallel worker cap must be <= 2.')
assert(DESKTOP_BENCHMARK_CAPS.memoryHardCapBytes <= 67108864, 'Memory hard cap must be <= 64MB.')
assert(DESKTOP_BENCHMARK_CAPS.tempFileHardCapBytes <= 4194304, 'Temp file hard cap must be <= 4MB.')
assert(DESKTOP_BENCHMARK_CAPS.networkBenchmarkAllowed === false, 'Network benchmarks must be blocked.')
assert(DESKTOP_BENCHMARK_CAPS.gpuBenchmarkAllowed === false, 'GPU benchmarks must be blocked.')
assert(DESKTOP_BENCHMARK_CAPS.sustainedStressAllowed === false, 'Sustained stress must be blocked.')

assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked', 'Persistent device id must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.hostname === 'blocked', 'Hostname collection must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.username === 'blocked', 'Username collection must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.macAddresses === 'blocked', 'MAC address collection must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.exactCpuGpuIdentifiers === 'blocked', 'Exact CPU/GPU identity must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.environmentVariableDump === 'blocked', 'Environment dump must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.networkBenchmark === 'blocked', 'Network benchmark must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.gpuBenchmark === 'blocked', 'GPU benchmark must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.sustainedStressTest === 'blocked', 'Sustained stress must be blocked.')
assert(DESKTOP_BENCHMARK_PRIVACY_POLICY.liveBenchmarkUpload === 'blocked_until_future_explicit_phase', 'Live upload must be future-gated.')

const fixtureResults = runDesktopBenchmarkFixtures(DESKTOP_BENCHMARK_FIXTURES)
assert(DESKTOP_BENCHMARK_FIXTURES.length === 5, 'Phase 44F must include exactly five generated/mock fixtures.')
for (const fixtureId of [
  'fixture-benchmark-high-desktop',
  'fixture-benchmark-mid-desktop',
  'fixture-benchmark-low-desktop',
  'fixture-benchmark-parallel-unavailable',
  'fixture-benchmark-policy-blocked',
]) {
  assert(DESKTOP_BENCHMARK_FIXTURES.some((fixture) => fixture.fixtureId === fixtureId), `Missing fixture ${fixtureId}`)
}
assert(fixtureResults.every((result) => result.status === 'passed'), 'All desktop benchmark fixtures must pass.')

const reports = await buildDesktopBenchmarkRunnerReports()
const validation = reports.validationReport as {
  status?: string
  noProviderCalls?: boolean
  noMediaProcessing?: boolean
  noRouteExecution?: boolean
  noWorkerExecution?: boolean
  noTrackA?: boolean
  trackA?: string
}
assert(validation.status === 'passed', 'Validation report must pass.')
assert(validation.noProviderCalls === true, 'Provider calls must be blocked.')
assert(validation.noMediaProcessing === true, 'Media processing must be blocked.')
assert(validation.noRouteExecution === true, 'Route execution must be blocked.')
assert(validation.noWorkerExecution === true, 'Worker execution must be blocked.')
assert(validation.noTrackA === true, 'Track A must remain untouched.')
assert(validation.trackA === 'not_touched', 'Track A must remain untouched.')

const localRun = reports.localRunReport as { status?: string; liveBenchmarkUpload?: string; localPersistence?: string }
assert(localRun.status === 'skipped_by_policy', 'Local benchmark must be skipped by default.')
assert(localRun.liveBenchmarkUpload === 'blocked', 'Live benchmark upload must be blocked.')
assert(localRun.localPersistence === 'blocked', 'Local benchmark persistence must be blocked.')

const readiness = reports.readinessReport as {
  desktopBenchmarkRunnerStatus?: string
  localWorkerSidecar?: string
  costEstimator?: string
  hybridE2eSimulation?: string
  production?: string
  externalBeta?: string
  broadMedia?: string
  publicArtifacts?: string
  vlm?: string
  demucs?: string
}
assert(readiness.desktopBenchmarkRunnerStatus === 'phase_complete_restricted_scope', 'Desktop benchmark runner status mismatch.')
assert(readiness.costEstimator === 'pending', 'Cost estimator must remain pending.')
assert(readiness.localWorkerSidecar === 'pending', 'Local worker sidecar must remain pending.')
assert(readiness.hybridE2eSimulation === 'pending', 'Hybrid E2E must remain pending.')
assert(readiness.production === 'blocked', 'Production must remain blocked.')
assert(readiness.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readiness.broadMedia === 'blocked', 'Broad media must remain blocked.')
assert(readiness.publicArtifacts === 'blocked', 'Public artifacts must remain blocked.')
assert(readiness.vlm === 'excluded', 'VLM must remain excluded.')
assert(readiness.demucs === 'blocked', 'Demucs must remain blocked.')

const routeHandoff = reports.routeHandoff as {
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  benchmarksCannotOverrideBlockedRoutes?: boolean
  costEstimatorRequired?: string
  localWorkerSidecarRequired?: string
  hybridE2eSimulationRequired?: string
}
assert(routeHandoff.routeExecutionAllowed === false, 'Route execution must remain blocked.')
assert(routeHandoff.workerExecutionAllowed === false, 'Worker execution must remain blocked.')
assert(routeHandoff.sidecarExecutionAllowed === false, 'Sidecar execution must remain blocked.')
assert(routeHandoff.benchmarksCannotOverrideBlockedRoutes === true, 'Benchmarks must not override blocked routes.')
assert(routeHandoff.costEstimatorRequired === 'Phase 44H', 'Phase 44H cost estimator must remain required.')
assert(routeHandoff.localWorkerSidecarRequired === 'Phase 44G', 'Phase 44G local sidecar must remain required.')
assert(routeHandoff.hybridE2eSimulationRequired === 'Phase 44J', 'Phase 44J hybrid E2E must remain required.')

for (const reportFile of DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('phase_44f_'), `Unexpected Phase 44F report name: ${reportFile}`)
}
assert(DESKTOP_BENCHMARK_RUNNER_REPORT_DIR.includes('activation-phase-44f-desktop-benchmark-runner-reports'), 'Report directory mismatch.')
assert(!existsSync('server/workers/desktop-benchmark-runner'), 'Phase 44F must not add a worker.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44F',
  fixtures: fixtureResults.map((result) => result.fixtureId),
  desktopBenchmarkRunnerStatus: readiness.desktopBenchmarkRunnerStatus,
  localBenchmark: localRun.status,
  liveBenchmarkUpload: 'blocked',
  routeExecution: 'blocked',
  workerExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
