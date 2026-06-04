import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS,
  DESKTOP_CAPABILITY_PROFILER_REPORT_DIR,
  buildDesktopCapabilityProfilerReports,
} from '../activation/desktop-capability-profiler'
import {
  DESKTOP_CAPABILITY_FIXTURES,
  DESKTOP_CAPABILITY_PRIVACY_POLICY,
  runDesktopCapabilityFixtures,
} from '../../src/lib/track-b/desktop-capability-profiler'

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
  'activation:desktop-capability-profiler:plan',
  'activation:desktop-capability-profiler',
  'activation:desktop-capability-profiler:report',
  'activation:desktop-capability-profiler:summary',
  'activation:desktop-capability-profiler:iam-plan',
  'activation:desktop-capability-profiler:cost-summary',
  'smoke:activation-desktop-capability-profiler',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const desktopSafeDir = 'src/lib/track-b/desktop-capability-profiler'
assert(existsSync(desktopSafeDir), 'Desktop-safe capability profiler module missing.')

const desktopFiles = readAllFiles(desktopSafeDir)
for (const { file, text } of desktopFiles) {
  assert(!/from ['"].*server\//.test(text), `Desktop-safe module imports server code: ${file}`)
  assert(!/from ['"].*server['"]/.test(text), `Desktop-safe module imports server code: ${file}`)
  assert(!text.includes('service-role'), `Desktop-safe module mentions service-role secrets: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Desktop-safe module mentions service role env: ${file}`)
  assert(!text.includes('providerKey'), `Desktop-safe module mentions provider key: ${file}`)
  assert(!text.includes('process.env'), `Desktop-safe module references process.env: ${file}`)
  assert(!text.includes('fetch('), `Desktop-safe module performs network fetch: ${file}`)
  assert(!text.includes('readdir'), `Desktop-safe module scans directories: ${file}`)
  assert(!/networkInterfaces\s*\(/.test(text), `Desktop-safe module reads network interfaces: ${file}`)
  assert(!/hostname\s*\(/.test(text), `Desktop-safe module reads hostname: ${file}`)
  assert(!/userInfo\s*\(/.test(text), `Desktop-safe module reads username/user info: ${file}`)
  assert(!text.includes('cpus()'), `Desktop-safe module reads exact CPU model data: ${file}`)
  assert(!text.includes('localStorage.') && !text.includes('sessionStorage.'), `Desktop-safe module persists profile: ${file}`)
}

assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked', 'Persistent device id must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.hostname === 'blocked', 'Hostname collection must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.username === 'blocked', 'Username collection must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.macAddresses === 'blocked', 'MAC address collection must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.exactCpuModelString === 'blocked_or_redacted', 'Exact CPU model must be blocked or redacted.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.exactGpuAdapterIds === 'blocked', 'Exact GPU identity must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.directoryScanning === 'blocked', 'Directory scanning must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.environmentVariableDump === 'blocked', 'Environment dump must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.networkSpeedTest === 'blocked', 'Network speed test must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.heavyBenchmarks === 'blocked', 'Heavy benchmarks must be blocked.')
assert(DESKTOP_CAPABILITY_PRIVACY_POLICY.liveProfileUpload === 'blocked_until_future_explicit_phase', 'Live upload must be future-gated.')

const fixtureResults = runDesktopCapabilityFixtures(DESKTOP_CAPABILITY_FIXTURES)
assert(DESKTOP_CAPABILITY_FIXTURES.length === 5, 'Phase 44E must include exactly five generated/mock fixtures.')
for (const fixtureId of [
  'fixture-desktop-high-local',
  'fixture-desktop-mid-no-ffmpeg',
  'fixture-desktop-low-resource',
  'fixture-electron-sandboxed-renderer',
  'fixture-unknown-desktop',
]) {
  assert(DESKTOP_CAPABILITY_FIXTURES.some((fixture) => fixture.fixtureId === fixtureId), `Missing fixture ${fixtureId}`)
}
assert(fixtureResults.every((result) => result.status === 'passed'), 'All desktop capability fixtures must pass.')

const reports = buildDesktopCapabilityProfilerReports()
const validation = reports.validationReport as {
  status?: string
  noProviderCalls?: boolean
  noMediaProcessing?: boolean
  noRouteExecution?: boolean
  noWorkerExecution?: boolean
  noElectronOrTauriAdded?: boolean
  trackA?: string
}
assert(validation.status === 'passed', 'Validation report must pass.')
assert(validation.noProviderCalls === true, 'Provider calls must be blocked.')
assert(validation.noMediaProcessing === true, 'Media processing must be blocked.')
assert(validation.noRouteExecution === true, 'Route execution must be blocked.')
assert(validation.noWorkerExecution === true, 'Worker execution must be blocked.')
assert(validation.noElectronOrTauriAdded === true, 'Electron/Tauri must not be added.')
assert(validation.trackA === 'not_touched', 'Track A must remain untouched.')

const localProfile = reports.localProfileReport as { status?: string; liveProfileUpload?: string; localPersistence?: string }
assert(localProfile.status === 'skipped_by_policy', 'Local profile must be skipped by default.')
assert(localProfile.liveProfileUpload === 'blocked', 'Live profile upload must be blocked.')
assert(localProfile.localPersistence === 'blocked', 'Local profile persistence must be blocked.')

const readiness = reports.readinessReport as {
  desktopCapabilityProfilerStatus?: string
  desktopBenchmarkRunner?: string
  costEstimator?: string
  localWorkerSidecar?: string
  production?: string
  externalBeta?: string
  broadMedia?: string
  publicArtifacts?: string
  vlm?: string
  demucs?: string
}
assert(readiness.desktopCapabilityProfilerStatus === 'phase_complete_restricted_scope', 'Desktop capability profiler status mismatch.')
assert(readiness.desktopBenchmarkRunner === 'pending', 'Desktop benchmark runner must remain pending.')
assert(readiness.costEstimator === 'pending', 'Cost estimator must remain pending.')
assert(readiness.localWorkerSidecar === 'pending', 'Local worker sidecar must remain pending.')
assert(readiness.production === 'blocked', 'Production must remain blocked.')
assert(readiness.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readiness.broadMedia === 'blocked', 'Broad media must remain blocked.')
assert(readiness.publicArtifacts === 'blocked', 'Public artifacts must remain blocked.')
assert(readiness.vlm === 'excluded', 'VLM must remain excluded.')
assert(readiness.demucs === 'blocked', 'Demucs must remain blocked.')

const routeHandoff = reports.routeHandoff as {
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  desktopProfilingCannotOverrideBlockedRoutes?: boolean
  costEstimatorRequired?: string
  desktopBenchmarkRunnerRequired?: string
  localWorkerSidecarRequired?: string
  hybridE2eSimulationRequired?: string
}
assert(routeHandoff.routeExecutionAllowed === false, 'Route execution must remain blocked.')
assert(routeHandoff.workerExecutionAllowed === false, 'Worker execution must remain blocked.')
assert(routeHandoff.desktopProfilingCannotOverrideBlockedRoutes === true, 'Desktop profiling must not override blocked routes.')
assert(routeHandoff.costEstimatorRequired === 'Phase 44H', 'Phase 44H cost estimator must remain required.')
assert(routeHandoff.desktopBenchmarkRunnerRequired === 'Phase 44F', 'Phase 44F desktop benchmark runner must remain required.')
assert(routeHandoff.localWorkerSidecarRequired === 'Phase 44G', 'Phase 44G local sidecar must remain required.')
assert(routeHandoff.hybridE2eSimulationRequired === 'Phase 44J', 'Phase 44J hybrid E2E must remain required.')

for (const reportFile of DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('phase_44e_'), `Unexpected Phase 44E report name: ${reportFile}`)
}
assert(DESKTOP_CAPABILITY_PROFILER_REPORT_DIR.includes('activation-phase-44e-desktop-capability-profiler-reports'), 'Report directory mismatch.')
assert(!existsSync('server/workers/desktop-capability-profiler'), 'Phase 44E must not add a worker.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44E',
  fixtures: fixtureResults.map((result) => result.fixtureId),
  desktopCapabilityProfilerStatus: readiness.desktopCapabilityProfilerStatus,
  localProfile: localProfile.status,
  liveProfileUpload: 'blocked',
  routeExecution: 'blocked',
  workerExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
