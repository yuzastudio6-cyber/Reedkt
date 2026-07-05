import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'scripts/dev/internal-testing-local-upload-runner.mjs',
  'server/smoke/internal-testing-local-upload-runner-smoke.ts',
  'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
  'docs/internal-testing-local-upload-runner.md',
  'docs/project-edit-brief-internal-testing-runbook.md',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['dev:internal-testing:local-upload'],
  'node scripts/dev/internal-testing-local-upload-runner.mjs',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-local-upload-runner'],
  'tsx server/smoke/internal-testing-local-upload-runner-smoke.ts',
)

const runner = read('scripts/dev/internal-testing-local-upload-runner.mjs')
for (const phrase of [
  'API_ALLOW_MOCK_WITHOUT_SUPABASE',
  "STORAGE_MODE: 'local'",
  'LOCAL_STORAGE_ROOT',
  'VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD',
  'VITE_REEDITPRO_API_BASE_URL',
  'Edit Brief source-video test',
  'No Supabase writes, GCS writes, media workers, render, credits, beta, or production.',
]) {
  assert.match(runner, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `runner should mention ${phrase}`)
}

assert.doesNotMatch(runner, /gcloud|supabase db|supabase migration|docker build|worker:run|tools:check|smoke:prod-real|STRIPE_SECRET/i)

const realApiSpec = read('tests/e2e/project-source-video-backend-upload-local-api.spec.ts')
assert.match(realApiSpec, /PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API/)
assert.match(realApiSpec, /project-source-video-backend-upload-status/)
assert.match(realApiSpec, /Source video uploaded to backend-local storage metadata/)
assert.match(realApiSpec, /media processing started\|worker job created\|render job created\|export job created\|credit reserved/)
assert.doesNotMatch(realApiSpec, /page\.route\(/, 'Real local API spec must not intercept upload routes.')

const runbook = read('docs/internal-testing-local-upload-runner.md')
for (const phrase of [
  'npm run dev:internal-testing:local-upload',
  'http://127.0.0.1:5179/projects',
  'Upload for testing',
  'backend-local storage metadata',
  'does not start media processing, workers, rendering, credits, external beta, or production',
]) {
  assert.match(runbook, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `runbook should mention ${phrase}`)
}

const briefRunbook = read('docs/project-edit-brief-internal-testing-runbook.md')
assert.match(briefRunbook, /backend-local source upload/i)
assert.match(briefRunbook, /Qwen 3\.7 Max/i)
assert.doesNotMatch(briefRunbook, /No full-video upload/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'local_upload_runner_script_present',
    'local_upload_runner_scripts_registered',
    'real_local_api_playwright_spec_present_without_route_interception',
    'runbook_documents_local_upload_flow',
    'brief_runbook_updates_stale_no_upload_copy',
    'production_scope_not_enabled',
  ],
}))
