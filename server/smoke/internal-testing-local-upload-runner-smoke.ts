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
  'scripts/dev/internal-testing-local-upload-e2e.mjs',
  'server/smoke/internal-testing-local-upload-runner-smoke.ts',
  'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
  'src/lib/project-source-video-local-edit-preview-smoke.ts',
  'src/components/projects/brief/ProjectEditBriefLocalPreviewSmokeCard.tsx',
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
  packageJson.scripts?.['test:internal-testing:local-upload-e2e'],
  'node scripts/dev/internal-testing-local-upload-e2e.mjs',
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
  'VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  'VITE_REEDITPRO_API_BASE_URL',
  '/sign-in',
  'Edit Brief source-video test',
  'browser-local mock sign-in',
  'gated preview review, QA, and private export smoke',
  'No Supabase writes, GCS writes, provider calls, live Qwen calls, public delivery, external beta, or production.',
]) {
  assert.match(runner, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `runner should mention ${phrase}`)
}

assert.doesNotMatch(runner, /gcloud|supabase db|supabase migration|docker build|worker:run|tools:check|smoke:prod-real|STRIPE_SECRET/i)

const e2eRunner = read('scripts/dev/internal-testing-local-upload-e2e.mjs')
for (const phrase of [
  'PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API',
  'PLAYWRIGHT_INTERNAL_TEST_AUTH',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  'VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE',
  'project-source-video-backend-upload-local-api.spec.ts',
  'ffmpeg',
  'browser-local mock sign-in + backend-local upload + gated preview review, QA, and private export smoke',
  'Qwen 3.7 Max identity checks succeeded',
]) {
  assert.match(e2eRunner, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `E2E verifier should mention ${phrase}`)
}
assert.doesNotMatch(e2eRunner, /gcloud|supabase db|supabase migration|docker build|worker:run|tools:check|smoke:prod-real|STRIPE_SECRET/i)

const realApiSpec = read('tests/e2e/project-source-video-backend-upload-local-api.spec.ts')
assert.match(realApiSpec, /PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API/)
assert.match(realApiSpec, /project-source-video-backend-upload-status/)
assert.match(realApiSpec, /project-source-video-local-preview-smoke-status/)
assert.match(realApiSpec, /Source video uploaded to backend-local storage metadata/)
assert.match(realApiSpec, /Approve local test plan/)
assert.match(realApiSpec, /Run local edit preview/)
assert.match(realApiSpec, /Approve preview/)
assert.match(realApiSpec, /Run QA check/)
assert.match(realApiSpec, /Create private export/)
assert.match(realApiSpec, /project-edit-private-export-review-player/)
assert.match(realApiSpec, /provider call made:\\s\*true/)
assert.match(realApiSpec, /live qwen call:\\s\*true/)
assert.match(realApiSpec, /final export started/)
assert.match(realApiSpec, /production ready:\\s\*true/)
assert.doesNotMatch(realApiSpec, /page\.route\(/, 'Real local API spec must not intercept upload routes.')

const previewClient = read('src/lib/project-source-video-local-edit-preview-smoke.ts')
for (const phrase of [
  '/approve',
  '/reserve',
  '/approved-snapshots',
  '/render-jobs',
  '/basic-smoke-preview',
  'REEDITPRO_QWEN_MAIN_BRAIN_LABEL',
  'providerCallMade: false',
  'qwenCallMade: false',
  'productReady: false',
]) {
  assert.match(previewClient, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `preview client should mention ${phrase}`)
}

const previewCard = read('src/components/projects/brief/ProjectEditBriefLocalPreviewSmokeCard.tsx')
assert.match(previewCard, /project-source-video-local-preview-smoke-status/)
assert.match(previewCard, /project-source-video-local-preview-smoke-button/)
assert.match(previewCard, /planApproved/)
assert.match(previewCard, /Approve plan first/)
assert.match(previewCard, /Run local edit preview/)
assert.match(previewCard, /Qwen/)
assert.match(previewCard, /no live call/i)
assert.doesNotMatch(previewCard, /product-ready/i)

const runbook = read('docs/internal-testing-local-upload-runner.md')
for (const phrase of [
  'npm run dev:internal-testing:local-upload',
  'npm run test:internal-testing:local-upload-e2e',
  'http://127.0.0.1:5179/sign-in',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH=true',
  'browser-local mock auth session',
  'http://127.0.0.1:5179/projects',
  'Upload for testing',
  'Approve local test plan',
  'Run local edit preview',
  'Approve preview',
  'Run QA check',
  'Create private export',
  'backend-local storage metadata',
  'private export smoke',
  'does not start provider calls, live Qwen calls, external beta, production, public delivery',
]) {
  assert.match(runbook, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `runbook should mention ${phrase}`)
}

const briefRunbook = read('docs/project-edit-brief-internal-testing-runbook.md')
assert.match(briefRunbook, /backend-local source upload/i)
assert.match(briefRunbook, /browser-local internal-testing session/i)
assert.match(briefRunbook, /Run local edit preview/i)
assert.match(briefRunbook, /Qwen 3\.7 Max/i)
assert.doesNotMatch(briefRunbook, /No full-video upload/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'local_upload_runner_script_present',
    'one_command_local_upload_e2e_verifier_registered',
    'local_upload_runner_scripts_registered',
    'browser_local_mock_sign_in_enabled_for_runner',
    'real_local_api_playwright_spec_present_without_route_interception',
    'local_edit_preview_smoke_gate_documented',
    'runbook_documents_local_upload_flow',
    'brief_runbook_updates_stale_no_upload_copy',
    'production_scope_not_enabled',
  ],
}))
