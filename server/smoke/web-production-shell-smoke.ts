import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { computeRouteExamples, privateArtifacts, recentJobs, sampleProject } from '../../src/web-shell/web-shell-fixtures'
import { disabledExecutionControls, webShellSafetyPolicy } from '../../src/web-shell/web-shell-policy'
import { webShellRoutes } from '../../src/web-shell/web-shell-routes'
import { webShellReadinessItems } from '../../src/web-shell/web-shell-status'
import type { WebShellRouteId } from '../../src/web-shell/web-shell-types'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const webShellRoot = path.join(repoRoot, 'src/web-shell')

function fileExists(relativePath: string): void {
  assert.equal(existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} must exist`)
}

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry)
    if (statSync(entryPath).isDirectory()) return listFiles(entryPath)
    return [entryPath]
  })
}

const requiredFiles = [
  'src/web-shell/web-shell-types.ts',
  'src/web-shell/web-shell-routes.ts',
  'src/web-shell/web-shell-navigation.ts',
  'src/web-shell/web-shell-fixtures.ts',
  'src/web-shell/web-shell-policy.ts',
  'src/web-shell/web-shell-status.ts',
  'src/web-shell/index.ts',
  'src/web-shell/components/AppShell.tsx',
  'src/web-shell/editor/EditorWorkspaceShell.tsx',
  'src/web-shell/pages/ProjectDashboardPage.tsx',
  'src/web-shell/pages/ProjectIntakePage.tsx',
  'src/web-shell/pages/JobQueuePage.tsx',
  'src/web-shell/pages/ArtifactLibraryPage.tsx',
  'src/web-shell/pages/SystemReadinessPage.tsx',
  'src/web-shell/pages/ComputeRoutesPage.tsx',
  'server/cli/web-production-shell-summary.ts',
]

requiredFiles.forEach(fileExists)

const requiredRouteIds: WebShellRouteId[] = [
  'home',
  'projects',
  'project_intake',
  'project_overview',
  'editor_workspace',
  'job_queue',
  'artifact_library',
  'system_readiness',
  'compute_routes',
  'settings',
  'not_found',
]

assert.deepEqual(
  webShellRoutes.map((route) => route.id),
  requiredRouteIds,
  'all required web shell route IDs must exist in order',
)

const uploadControl = disabledExecutionControls.find((control) => control.controlId === 'upload_intake')
assert.equal(uploadControl?.enabled, false, 'upload/intake UI must be disabled')
assert.equal(uploadControl?.mockSafe, true, 'upload/intake UI must be mock-safe')

for (const controlId of ['run_ai', 'render', 'public_export']) {
  const control = disabledExecutionControls.find((candidate) => candidate.controlId === controlId)
  assert.equal(control?.enabled, false, `${controlId} must be disabled`)
  assert.equal(control?.mockSafe, true, `${controlId} must be mock-safe`)
}

for (const routeCategory of ['browser_preview', 'cloud_cpu', 'cloud_gpu_l4', 'cloud_render']) {
  assert.ok(
    computeRouteExamples.some((route) => route.category === routeCategory),
    `${routeCategory} route example must exist`,
  )
}

const revideoRoute = computeRouteExamples.find((route) => route.label === 'Revideo')
assert.equal(revideoRoute?.status, 'blocked')
assert.equal(revideoRoute?.category, 'blocked_by_policy')
assert.match(revideoRoute?.summary ?? '', /blocked\/evaluation-only/i)

assert.equal(webShellSafetyPolicy.productionReadyAllowed, false)
assert.equal(webShellSafetyPolicy.externalBetaAllowed, false)
assert.equal(webShellSafetyPolicy.broadRealMediaAllowed, false)
assert.equal(webShellSafetyPolicy.heavyLocalExecutionAllowed, false)
assert.equal(webShellSafetyPolicy.providerCallsFromBrowserAllowed, false)
assert.equal(webShellSafetyPolicy.serviceRoleEnvExposureAllowed, false)
assert.equal(webShellSafetyPolicy.desktopLocalWorkerStatus, 'deferred')

assert.ok(webShellReadinessItems.some((item) => item.label === 'Production readiness' && item.tone === 'blocked'))
assert.ok(webShellReadinessItems.some((item) => item.label === 'External beta' && item.tone === 'blocked'))
assert.ok(webShellReadinessItems.some((item) => item.label === 'Broad real media' && item.tone === 'blocked'))
assert.ok(recentJobs.some((job) => job.status === 'blocked' && /SAM2/i.test(job.label)))
assert.ok(privateArtifacts.every((artifact) => artifact.privacy === 'private'))
assert.ok(sampleProject.chainSummary.some((item) => /SAM2 runtime remains blocked/i.test(item)))

const fixtureJson = JSON.stringify({
  sampleProject,
  recentJobs,
  privateArtifacts,
  computeRouteExamples,
})
for (const forbiddenFixtureToken of ['signedUrl', 'serviceRoleKey', 'providerApiKey', 'secretValue']) {
  assert.doesNotMatch(fixtureJson, new RegExp(forbiddenFixtureToken, 'i'), `${forbiddenFixtureToken} must not appear`)
}

const webShellFiles = listFiles(webShellRoot).filter((sourcePath) => /\.(ts|tsx)$/.test(sourcePath))
for (const sourcePath of webShellFiles) {
  const relativePath = path.relative(repoRoot, sourcePath)
  const source = readFileSync(sourcePath, 'utf8')
  assert.doesNotMatch(source, /from\s+['"][^'"]*server\/workers/i, `${relativePath} must not import server workers`)
  assert.doesNotMatch(source, /from\s+['"][^'"]*server\/activation/i, `${relativePath} must not import activation modules`)
  assert.doesNotMatch(source, /from\s+['"](node:)?(fs|path|child_process)['"]/, `${relativePath} must not import Node-only modules`)
  assert.doesNotMatch(source, /spawn\(|exec\(|execFile\(|fetch\(/, `${relativePath} must not introduce execution paths`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as {
  scripts: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

assert.equal(packageJson.scripts['web:shell:summary'], 'tsx server/cli/web-production-shell-summary.ts')
assert.equal(packageJson.scripts['smoke:web-production-shell'], 'tsx server/smoke/web-production-shell-smoke.ts')

const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}
for (const dependencyName of ['@tauri-apps/api', 'tauri', 'electron', 'electron-forge', '@electron-forge/cli']) {
  assert.equal(Object.hasOwn(allDependencies, dependencyName), false, `${dependencyName} must not be added`)
}

for (const scriptName of ['web:shell:summary', 'smoke:web-production-shell']) {
  assert.doesNotMatch(packageJson.scripts[scriptName], /docker|gcloud|provider|download|probe-media|worker:run/i)
}

const cliSource = readRepoFile('server/cli/web-production-shell-summary.ts')
assert.doesNotMatch(cliSource, /node:child_process|from 'child_process'|spawn\(|exec\(|execFile\(/)
assert.doesNotMatch(cliSource, /docker\s+(build|push|run)\s+(--|-|\.|\/)/i)
assert.doesNotMatch(cliSource, /gcloud\s+(run|deploy|jobs|storage|auth)\s+(--|-|\.|\/)/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'web_shell_routes',
    'required_pages_and_components',
    'disabled_upload_intake',
    'disabled_run_render_export_controls',
    'compute_route_visibility',
    'revideo_blocked_evaluation_only',
    'launch_gates_false',
    'fixture_secret_and_url_absence',
    'no_server_worker_or_node_imports',
    'no_execution_paths',
    'package_scripts',
    'desktop_runtime_dependencies_absent',
  ],
}))
