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

function assertMentions(source: string, phrase: string, label: string): void {
  assert.match(
    source,
    new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${label} should mention ${phrase}`,
  )
}

const requiredFiles = [
  'scripts/dev/internal-testing-local-upload-runner.mjs',
  'scripts/dev/internal-testing-local-upload-e2e.mjs',
  'server/smoke/internal-testing-local-upload-runner-smoke.ts',
  'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
  'tests/e2e/project-create-edit-upload-local-api.spec.ts',
  'tests/e2e/helpers/real-local-api-journey.ts',
  'docs/internal-testing-local-upload-runner.md',
  'docs/project-edit-brief-internal-testing-runbook.md',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['dev:private-workspace:api'],
  'tsx server/private-workspace-index.ts',
)
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
  'dev:private-workspace:api',
  'API_ALLOW_MOCK_WITHOUT_SUPABASE',
  "STORAGE_MODE: 'local'",
  'LOCAL_STORAGE_ROOT',
  'VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  'VITE_REEDITPRO_API_BASE_URL',
  '/sign-in',
  'Create a project',
  'browser-local test sign-in',
  'active named-edit route',
  'reviewed frontend-safe API transport',
  'backend-local source storage',
  'No Supabase writes, GCS writes, provider calls, live Qwen calls, public delivery, external beta, or production.',
]) {
  assertMentions(runner, phrase, 'local upload runner')
}
assert.doesNotMatch(
  runner,
  /gcloud|supabase db|supabase migration|docker build|worker:run|tools:check|smoke:prod-real|STRIPE_SECRET/i,
)

const e2eRunner = read('scripts/dev/internal-testing-local-upload-e2e.mjs')
for (const phrase of [
  'PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API',
  'PLAYWRIGHT_INTERNAL_TEST_AUTH',
  "PLAYWRIGHT_REUSE_SERVER: 'true'",
  'sharedSyntheticFixturePath',
  'preparePlaywrightFixture',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  "VITE_REEDITPRO_AUTH_MODE: 'local_test'",
  'dev:private-workspace:api',
  'project-source-video-backend-upload-local-api.spec.ts',
  'project-create-edit-upload-local-api.spec.ts',
  'ffmpeg',
  'active named-edit route',
  'reviewed frontend-safe API transport',
  'canonical plan/approval gates',
  'sign-in, project creation, named-edit creation, backend-local source finalization, private source readback, inline Edit Brief, plan creation, approval, and reload checks succeeded',
]) {
  assertMentions(e2eRunner, phrase, 'local upload E2E verifier')
}
assert.doesNotMatch(
  e2eRunner,
  /gcloud|supabase db|supabase migration|docker build|worker:run|tools:check|smoke:prod-real|STRIPE_SECRET/i,
)

const uploadSpec = read('tests/e2e/project-source-video-backend-upload-local-api.spec.ts')
for (const phrase of [
  'PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API',
  'signInAndCreateActiveProjectEdit',
  'uploadActiveEditorSource',
  'Backend-local source proof',
  'storageBucket',
  'storagePath',
]) {
  assertMentions(uploadSpec, phrase, 'real local API upload spec')
}
assert.match(uploadSpec, /provider call made:\\s\*true/)
assert.match(uploadSpec, /live qwen call:\\s\*true/)
assert.match(uploadSpec, /final export started/)
assert.match(uploadSpec, /production ready:\\s\*true/)
assert.doesNotMatch(uploadSpec, /page\.route\(/, 'Real local API upload spec must not intercept routes.')

const activeJourneySpec = read('tests/e2e/project-create-edit-upload-local-api.spec.ts')
for (const phrase of [
  'uploads real source, plans from chat direction, and records approval safely',
  'uses the inline Edit Brief on the canonical named-edit route before approval',
  'restores exact uploaded-source authority after reloading the named edit',
  'edit-brief-authority-status',
  'approvedSnapshotId',
  'editBriefState?.editBrief.goal',
  'checksumSha256',
  'privateArtifact',
  'signedUrl',
]) {
  assertMentions(activeJourneySpec, phrase, 'active named-edit journey')
}
assert.doesNotMatch(activeJourneySpec, /page\.route\(/, 'Active named-edit journey must not intercept routes.')

const journeyHelper = read('tests/e2e/helpers/real-local-api-journey.ts')
for (const phrase of [
  'edit-upload-gate',
  'chat-composer-textarea',
  'source-summary',
  'Ready to create the plan',
  'canonical-planning-save-plan-published-waiting-for-approval',
  'plan-review-approve',
  'approved_snapshot_available',
  'Approval is safely recorded',
]) {
  assertMentions(journeyHelper, phrase, 'real local API journey helper')
}

const runbook = read('docs/internal-testing-local-upload-runner.md')
for (const phrase of [
  'npm run dev:internal-testing:local-upload',
  'npm run test:internal-testing:local-upload-e2e',
  'http://127.0.0.1:5179/sign-in',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH=true',
  'browser-local mock auth session',
  'http://127.0.0.1:5179/projects',
  'New video edit',
  'active named-edit route',
  'canonical plan publication',
  'approved snapshot',
  'durable Edit Brief',
  'reload',
  'backend-local storage metadata',
  'npm run smoke:editor-full-stack-private-review',
  'does not start provider calls, live Qwen calls, external beta, production, public delivery',
]) {
  assertMentions(runbook.toLowerCase(), phrase.toLowerCase(), 'local upload runbook')
}

const briefRunbook = read('docs/project-edit-brief-internal-testing-runbook.md')
assert.match(briefRunbook, /backend-local source upload/i)
assert.match(briefRunbook, /browser-local internal-testing session/i)
assert.match(briefRunbook, /active named-edit route/i)
assert.match(briefRunbook, /durable Edit Brief/i)
assert.match(briefRunbook, /canonical plan publication/i)
assert.match(briefRunbook, /approved snapshot/i)
assert.match(briefRunbook, /smoke:editor-full-stack-private-review/i)
assert.match(briefRunbook, /Qwen 3\.7 Max/i)
assert.doesNotMatch(briefRunbook, /No full-video upload/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'private_workspace_api_runner_registered',
    'local_upload_runner_scripts_registered',
    'browser_local_mock_sign_in_enabled_for_runner',
    'real_local_api_specs_present_without_route_interception',
    'active_named_edit_upload_publication_and_approval_covered',
    'durable_inline_edit_brief_covered',
    'approved_source_authority_reload_covered',
    'private_review_coverage_kept_separate',
    'runbooks_document_current_local_upload_flow',
    'production_scope_not_enabled',
  ],
}))
