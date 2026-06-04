import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS,
  WEB_CAPABILITY_PROFILER_REPORT_DIR,
  buildWebCapabilityProfilerReports,
} from '../activation/web-capability-profiler'
import {
  WEB_CAPABILITY_FIXTURES,
  WEB_CAPABILITY_PRIVACY_POLICY,
  runWebCapabilityFixtures,
} from '../../src/lib/track-b/web-capability-profiler'

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
  'activation:web-capability-profiler:plan',
  'activation:web-capability-profiler',
  'activation:web-capability-profiler:report',
  'activation:web-capability-profiler:summary',
  'activation:web-capability-profiler:iam-plan',
  'activation:web-capability-profiler:cost-summary',
  'smoke:activation-web-capability-profiler',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const browserSafeDir = 'src/lib/track-b/web-capability-profiler'
assert(existsSync(browserSafeDir), 'Browser-safe web capability profiler module missing.')

const browserFiles = readAllFiles(browserSafeDir)
for (const { file, text } of browserFiles) {
  assert(!/from ['"].*server\//.test(text), `Browser-safe module imports server code: ${file}`)
  assert(!/from ['"].*server['"]/.test(text), `Browser-safe module imports server code: ${file}`)
  assert(!text.includes('service-role'), `Browser-safe module mentions service-role secrets: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Browser-safe module mentions service role env: ${file}`)
  assert(!text.includes('providerKey'), `Browser-safe module mentions provider key: ${file}`)
  assert(!text.includes('process.env'), `Browser-safe module references process.env: ${file}`)
  assert(!text.includes('fetch('), `Browser-safe module performs network fetch: ${file}`)
  assert(!text.includes('XMLHttpRequest'), `Browser-safe module references XMLHttpRequest: ${file}`)
  assert(!text.includes('navigator.userAgent'), `Browser-safe module reads raw user agent: ${file}`)
  assert(!text.includes('screen.width') && !text.includes('screen.height'), `Browser-safe module reads exact screen resolution: ${file}`)
  assert(!text.includes('requestAdapter('), `Browser-safe module requests detailed GPU adapter: ${file}`)
  assert(!text.includes('localStorage.') && !text.includes('sessionStorage.'), `Browser-safe module persists browser profile: ${file}`)
}

assert(WEB_CAPABILITY_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked', 'Persistent device id must be blocked.')
assert(WEB_CAPABILITY_PRIVACY_POLICY.rawFullUserAgent === 'blocked', 'Raw full user agent must be blocked.')
assert(WEB_CAPABILITY_PRIVACY_POLICY.exactScreenResolution === 'blocked', 'Exact screen resolution must be blocked.')
assert(WEB_CAPABILITY_PRIVACY_POLICY.detailedGpuAdapterVendorDevice === 'blocked', 'Detailed GPU identity must be blocked.')
assert(WEB_CAPABILITY_PRIVACY_POLICY.networkSpeedTest === 'blocked', 'Network speed test must be blocked.')
assert(WEB_CAPABILITY_PRIVACY_POLICY.liveProfileUpload === 'blocked_until_future_explicit_phase_with_consent', 'Live upload must be future-gated.')

const fixtureResults = runWebCapabilityFixtures(WEB_CAPABILITY_FIXTURES)
assert(WEB_CAPABILITY_FIXTURES.length === 5, 'Phase 44D must include exactly five generated/mock fixtures.')
for (const fixtureId of [
  'fixture-modern-web-high',
  'fixture-mid-web-no-webgpu',
  'fixture-low-capability-mobile',
  'fixture-cross-origin-not-isolated',
  'fixture-insecure-context',
]) {
  assert(WEB_CAPABILITY_FIXTURES.some((fixture) => fixture.fixtureId === fixtureId), `Missing fixture ${fixtureId}`)
}
assert(fixtureResults.every((result) => result.status === 'passed'), 'All web capability fixtures must pass.')

const reports = buildWebCapabilityProfilerReports()
const validation = reports.validationReport as { status?: string; noProviderCalls?: boolean; noMediaProcessing?: boolean; noRouteExecution?: boolean; noWorkerExecution?: boolean; trackA?: string }
assert(validation.status === 'passed', 'Validation report must pass.')
assert(validation.noProviderCalls === true, 'Provider calls must be blocked.')
assert(validation.noMediaProcessing === true, 'Media processing must be blocked.')
assert(validation.noRouteExecution === true, 'Route execution must be blocked.')
assert(validation.noWorkerExecution === true, 'Worker execution must be blocked.')
assert(validation.trackA === 'not_touched', 'Track A must remain untouched.')

const readiness = reports.readinessReport as {
  webCapabilityProfilerStatus?: string
  desktopCapabilityProfiler?: string
  costEstimator?: string
  localWorkerSidecar?: string
  production?: string
  externalBeta?: string
  broadMedia?: string
  publicArtifacts?: string
  vlm?: string
  demucs?: string
}
assert(readiness.webCapabilityProfilerStatus === 'phase_complete_restricted_scope', 'Web capability profiler status mismatch.')
assert(readiness.desktopCapabilityProfiler === 'pending', 'Desktop profiler must remain pending.')
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
  browserProfilingCannotOverrideBlockedRoutes?: boolean
  costEstimatorRequired?: string
  hybridE2eSimulationRequired?: string
}
assert(routeHandoff.routeExecutionAllowed === false, 'Route execution must remain blocked.')
assert(routeHandoff.workerExecutionAllowed === false, 'Worker execution must remain blocked.')
assert(routeHandoff.browserProfilingCannotOverrideBlockedRoutes === true, 'Browser profiling must not override blocked routes.')
assert(routeHandoff.costEstimatorRequired === 'Phase 44H', 'Phase 44H cost estimator must remain required.')
assert(routeHandoff.hybridE2eSimulationRequired === 'Phase 44J', 'Phase 44J hybrid E2E must remain required.')

for (const reportFile of WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('phase_44d_'), `Unexpected Phase 44D report name: ${reportFile}`)
}
assert(WEB_CAPABILITY_PROFILER_REPORT_DIR.includes('activation-phase-44d-web-capability-profiler-reports'), 'Report directory mismatch.')
assert(!existsSync('server/workers/web-capability-profiler'), 'Phase 44D must not add a worker.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44D',
  fixtures: fixtureResults.map((result) => result.fixtureId),
  webCapabilityProfilerStatus: readiness.webCapabilityProfilerStatus,
  liveBrowserUpload: 'blocked',
  routeExecution: 'blocked',
  workerExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
