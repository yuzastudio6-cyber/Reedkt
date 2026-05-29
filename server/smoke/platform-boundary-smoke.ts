import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
  NEXT_PLATFORM_PHASE,
  buildPlatformBoundaryReport,
  findPlatformBoundary,
  summarizePlatformBoundaryReport,
} from '../platform'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function fileExists(relativePath: string): void {
  assert.equal(existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} must exist`)
}

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'apps/web/README.md',
  'apps/desktop/README.md',
  'packages/shared/README.md',
  'packages/ui/README.md',
  'packages/platform/README.md',
  'packages/editor-core/README.md',
  'packages/compute-routing/README.md',
  'server/platform/platform-boundary-types.ts',
  'server/platform/platform-product-strategy.ts',
  'server/platform/platform-roadmap.ts',
  'server/platform/platform-boundary-report-builder.ts',
  'server/platform/index.ts',
  'server/cli/platform-boundary-summary.ts',
  'docs/platform-web-first-strategy.md',
  'docs/repo-app-boundary-plan.md',
  'docs/web-production-readiness-roadmap.md',
  'docs/web-app-implementation-plan.md',
  'docs/desktop-app-deferred-roadmap.md',
  'docs/desktop-local-worker-future-plan.md',
  'docs/web-vs-desktop-product-boundary.md',
  'docs/shared-packages-boundary-policy.md',
  'docs/activation-phase-44a-web-first-platform-boundaries.md',
]

requiredFiles.forEach(fileExists)

const report = buildPlatformBoundaryReport({ createdAt: '2026-05-29T00:00:00.000Z' })
const summary = summarizePlatformBoundaryReport(report)

assert.equal(report.launchTrack, 'web')
assert.equal(report.reportId, 'activation-phase-44a-web-first-platform-boundaries')
assert.ok(report.deferredTracks.includes('desktop'))
assert.ok(report.deferredTracks.includes('local_worker_future'))

const webBoundary = findPlatformBoundary('apps/web')
assert.ok(webBoundary)
assert.ok(webBoundary.mustNotOwn.includes('server workers'))
assert.ok(webBoundary.mustNotOwn.includes('model weights'))
assert.ok(webBoundary.mustNotOwn.includes('provider calls'))

const desktopBoundary = findPlatformBoundary('apps/desktop')
assert.ok(desktopBoundary)
assert.ok(['future', 'planned'].includes(desktopBoundary.status))
assert.ok(desktopBoundary.mustNotOwn.includes('active Mac/Windows runtime'))
assert.ok(desktopBoundary.mustNotOwn.includes('Tauri/Electron packages'))
assert.ok(desktopBoundary.mustNotOwn.includes('local AI execution'))
assert.ok(report.blockers.some((blocker) => blocker.includes('Desktop active runtime is blocked')))
assert.ok(report.blockers.some((blocker) => blocker.includes('Local worker and local AI execution are future-only')))

const serverBoundary = findPlatformBoundary('server')
assert.ok(serverBoundary)
assert.ok(serverBoundary.owns.includes('activation runtime'))
assert.ok(serverBoundary.owns.includes('workers'))
assert.ok(serverBoundary.owns.includes('Cloud Run job orchestration'))
assert.ok(serverBoundary.owns.includes('tool execution'))
assert.ok(serverBoundary.owns.includes('private artifacts'))
assert.ok(serverBoundary.owns.includes('model policies'))
assert.ok(serverBoundary.owns.includes('cost/security/readiness'))

assert.equal(report.revideoReadiness.status, 'blocked')
assert.equal(report.revideoReadiness.policy, 'evaluation_only')
assert.equal(report.revideoReadiness.coreDependencyAllowed, false)
assert.ok(report.blockers.some((blocker) => blocker.includes('Revideo remains evaluation-only')))

assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)
assert.equal(report.desktopReadiness.status, 'future')
assert.equal(report.sharedPackageReadiness.status, 'planned')
assert.ok(report.nextActions.includes(NEXT_PLATFORM_PHASE))

assert.match(summary, /launch track: web/)
assert.match(summary, /desktop: deferred/)
assert.match(summary, /shared packages: planned/)
assert.match(summary, /next phase: Phase 44B web app structure migration/)
assert.match(summary, /production\/external beta\/broad real media: blocked/)

const packageJson = JSON.parse(readRepoFile('package.json')) as {
  scripts: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

assert.equal(packageJson.scripts['smoke:platform-boundaries'], 'tsx server/smoke/platform-boundary-smoke.ts')
assert.equal(packageJson.scripts['platform:boundary:summary'], 'tsx server/cli/platform-boundary-summary.ts')

const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}
for (const dependencyName of DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES) {
  assert.equal(
    Object.hasOwn(allDependencies, dependencyName),
    false,
    `${dependencyName} must not be added in Phase 44A`,
  )
}

const newScriptCommands = [
  packageJson.scripts['smoke:platform-boundaries'],
  packageJson.scripts['platform:boundary:summary'],
]
for (const scriptCommand of newScriptCommands) {
  assert.doesNotMatch(scriptCommand, /docker|gcloud|provider|download|probe-media|worker:run/i)
}

const staticOnlyFiles = [
  'server/platform/platform-boundary-types.ts',
  'server/platform/platform-product-strategy.ts',
  'server/platform/platform-roadmap.ts',
  'server/platform/platform-boundary-report-builder.ts',
  'server/platform/index.ts',
  'server/cli/platform-boundary-summary.ts',
]

for (const relativePath of staticOnlyFiles) {
  const source = readRepoFile(relativePath)
  assert.doesNotMatch(source, /node:child_process|from 'child_process'|spawn\(|exec\(|execFile\(/)
  assert.doesNotMatch(source, /docker\s+(build|push|run)\s+[-\w.]/i)
  assert.doesNotMatch(source, /gcloud\s+(run|deploy|jobs|storage|auth)\s+[-\w.]/i)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'app_boundary_readmes',
    'shared_package_readmes',
    'platform_boundary_types',
    'product_strategy_report_builder',
    'web_launch_track',
    'desktop_deferred',
    'desktop_runtime_blocked',
    'desktop_framework_dependencies_absent',
    'web_forbidden_ownership',
    'server_worker_cloud_runtime_ownership',
    'revideo_evaluation_only',
    'launch_gates_false',
    'package_scripts',
    'static_report_only_no_execution',
  ],
}))
