import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
  WEB_APP_COMPAT_SCRIPTS,
  WEB_APP_MUST_NOT_OWN,
  WEB_APP_REQUIRED_ROOT_SCRIPTS,
  WEB_APP_STRUCTURE_FORBIDDEN_DEPENDENCIES,
  WEB_APP_STRUCTURE_SCRIPTS,
  buildWebAppStructureReport,
  findPlatformBoundary,
  summarizeWebAppStructureReport,
} from '../platform'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function fileExists(relativePath: string): void {
  assert.equal(existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} must exist`)
}

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'apps/web',
  'apps/web/README.md',
  'apps/web/web-app-boundary.md',
  'apps/web/web-build-notes.md',
  'apps/web/source-migration-status.md',
  'apps/web/src/README.md',
  'apps/web/public/README.md',
  'server/platform/web-app-structure-policy.ts',
  'server/platform/web-app-structure-report.ts',
  'server/cli/web-app-structure-summary.ts',
  'docs/web-app-structure-migration.md',
  'docs/web-app-build-policy.md',
  'docs/web-app-source-boundary.md',
  'docs/activation-phase-44b-web-app-structure-migration.md',
]

requiredFiles.forEach(fileExists)

const desktopBoundary = findPlatformBoundary('apps/desktop')
assert.ok(desktopBoundary)
assert.ok(['future', 'planned'].includes(desktopBoundary.status))
assert.ok(desktopBoundary.mustNotOwn.includes('active Mac/Windows runtime'))
assert.ok(desktopBoundary.mustNotOwn.includes('Tauri/Electron packages'))
assert.ok(desktopBoundary.mustNotOwn.includes('local AI execution'))

const boundaryDoc = readRepoFile('apps/web/web-app-boundary.md')
for (const forbiddenOwner of WEB_APP_MUST_NOT_OWN) {
  assert.match(boundaryDoc, new RegExp(forbiddenOwner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}
assert.match(boundaryDoc, /server workers/i)
assert.match(boundaryDoc, /model weights/i)
assert.match(boundaryDoc, /provider calls/i)
assert.match(boundaryDoc, /service role secrets/i)

const packageJson = JSON.parse(readRepoFile('package.json')) as {
  scripts: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

for (const scriptName of WEB_APP_REQUIRED_ROOT_SCRIPTS) {
  assert.ok(packageJson.scripts[scriptName], `${scriptName} script must exist`)
}
assert.ok(packageJson.scripts['build:server'], 'build:server script must still exist')
assert.equal(packageJson.scripts['smoke:web-app-structure'], 'tsx server/smoke/web-app-structure-smoke.ts')
assert.equal(packageJson.scripts['web:structure:summary'], 'tsx server/cli/web-app-structure-summary.ts')
assert.equal(packageJson.scripts['web:dev'], packageJson.scripts.dev)
assert.equal(packageJson.scripts['web:build'], packageJson.scripts.build)
assert.equal(packageJson.scripts['web:lint'], packageJson.scripts.lint)

const newScriptCommands = [
  ...WEB_APP_STRUCTURE_SCRIPTS,
  ...WEB_APP_COMPAT_SCRIPTS,
].map((scriptName) => packageJson.scripts[scriptName])
for (const scriptCommand of newScriptCommands) {
  assert.ok(scriptCommand)
  assert.doesNotMatch(scriptCommand, /docker|gcloud|provider|download|probe-media|worker:run/i)
}

const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}
for (const dependencyName of [
  ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
  ...WEB_APP_STRUCTURE_FORBIDDEN_DEPENDENCIES,
]) {
  assert.equal(
    Object.hasOwn(allDependencies, dependencyName),
    false,
    `${dependencyName} must not be added in Phase 44B`,
  )
}

const report = buildWebAppStructureReport({ createdAt: '2026-05-29T00:00:00.000Z' })
const summary = summarizeWebAppStructureReport(report)
assert.equal(report.reportId, 'activation-phase-44b-web-app-structure-migration')
assert.equal(report.structureMode, 'transitional')
assert.equal(report.webAppPath, 'apps/web')
assert.equal(report.currentSourcePath, 'src')
assert.equal(report.viteEntryPath, 'index.html')
assert.equal(report.publicAssetsPath, 'public')
assert.deepEqual(report.forbiddenFindings, [])
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)
assert.equal(report.revideoReadiness.status, 'blocked')
assert.equal(report.revideoReadiness.policy, 'evaluation_only')
assert.equal(report.revideoReadiness.coreDependencyAllowed, false)
assert.match(summary, /structure mode: transitional/)
assert.match(summary, /apps\/web path: apps\/web/)
assert.match(summary, /current source path: src/)
assert.match(summary, /root scripts preserved:/)
assert.match(summary, /web scripts available:/)
assert.match(summary, /desktop: deferred/)
assert.match(summary, /next phase: Phase 44C web production shell/)
assert.match(summary, /production\/external beta\/broad real media: blocked/)

const staticOnlyFiles = [
  'server/platform/web-app-structure-policy.ts',
  'server/platform/web-app-structure-report.ts',
  'server/cli/web-app-structure-summary.ts',
]

for (const relativePath of staticOnlyFiles) {
  const source = readRepoFile(relativePath)
  assert.doesNotMatch(source, /node:child_process|from 'child_process'|spawn\(|exec\(|execFile\(/)
  assert.doesNotMatch(source, /docker\s+(build|push|run)\s+(--|-|\.|\/)/i)
  assert.doesNotMatch(source, /gcloud\s+(run|deploy|jobs|storage|auth)\s+(--|-|\.|\/)/i)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'apps_web_boundary_docs',
    'transitional_source_status',
    'desktop_deferred',
    'desktop_runtime_dependencies_absent',
    'web_forbidden_ownership',
    'root_scripts_preserved',
    'web_structure_summary',
    'launch_gates_false',
    'revideo_evaluation_only',
    'static_report_only_no_execution',
    'package_scripts',
  ],
}))
