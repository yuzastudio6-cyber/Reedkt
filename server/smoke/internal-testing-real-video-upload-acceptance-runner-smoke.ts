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
  'scripts/dev/internal-testing-real-video-upload-acceptance.mjs',
  'scripts/dev/internal-testing-local-upload-e2e.mjs',
  'server/smoke/internal-testing-real-video-upload-acceptance-runner-smoke.ts',
  'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-real-video-upload-acceptance-runner'],
  'tsx server/smoke/internal-testing-real-video-upload-acceptance-runner-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['test:internal-testing:real-video-upload-acceptance'],
  'node scripts/dev/internal-testing-real-video-upload-acceptance.mjs',
)

const wrapper = read('scripts/dev/internal-testing-real-video-upload-acceptance.mjs')
for (const phrase of [
  'Documents/test video/internal testing.MP4',
  'REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH',
  '.reeditpro-local-upload-storage-real-video',
  'internal-testing-local-upload-e2e.mjs',
  'backend-local upload',
  'local preview smoke',
  'No provider calls, live Qwen calls, Supabase writes, GCS writes, public delivery, beta, or production.',
]) {
  assertMentions(wrapper, phrase, 'real-video upload acceptance wrapper')
}
assert.doesNotMatch(wrapper, /supabase db|docker build|gcloud|STRIPE_SECRET|worker:run|tools:check|smoke:prod-real|apt-get|ffmpeg|ffprobe|MP4Box/i)

const e2eRunner = read('scripts/dev/internal-testing-local-upload-e2e.mjs')
for (const phrase of [
  'realVideoFixturePath',
  'REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH',
  'PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH',
  "assertExecutable('ffmpeg', 'FFmpeg')",
  'Real video fixture:',
  'backend-local upload',
  'preview-only local edit smoke',
]) {
  assertMentions(e2eRunner, phrase, 'local upload E2E runner')
}
assert.match(e2eRunner, /if\s*\(realVideoFixturePath\)\s*\{[\s\S]*existsSync\(realVideoFixturePath\)[\s\S]*\}\s*else\s*\{[\s\S]*assertExecutable\('ffmpeg', 'FFmpeg'\)/)
assert.doesNotMatch(e2eRunner, /supabase db|supabase migration|docker build|gcloud|STRIPE_SECRET|worker:run|tools:check|smoke:prod-real|apt-get/i)

const realApiSpec = read('tests/e2e/project-source-video-backend-upload-local-api.spec.ts')
for (const phrase of [
  'externalFixturePath',
  'fixtureFileName',
  'uploadedFixtureFileName',
  'PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH',
  'External real-video fixture must be a non-empty MP4 file.',
  'test.setTimeout(externalFixturePath ? 180_000 : 90_000)',
  "toContainText('uploaded', { timeout: externalFixturePath ? 120_000 : 30_000 })",
  'toContainText(uploadedFixtureFileName)',
  'Source video uploaded to backend-local storage metadata',
  'Run local edit preview',
  'Qwen 3.7 Max identity recorded, no live call',
]) {
  assertMentions(realApiSpec, phrase, 'backend upload Playwright spec')
}
assert.doesNotMatch(realApiSpec, /page\.route\(/, 'Real local API spec must not intercept upload routes.')
assert.doesNotMatch(realApiSpec, /createSignedUrl|SUPABASE_SERVICE_ROLE_KEY|GCS_SOURCE_MEDIA_BUCKET|providerCallMade:\s*true|qwenCallMade:\s*true|productReady:\s*true/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-upload-acceptance-runner',
  command: 'npm run test:internal-testing:real-video-upload-acceptance',
  checks: [
    'real_video_wrapper_registered',
    'real_video_fixture_path_env_forwarded',
    'synthetic_ffmpeg_fallback_preserved',
    'backend_local_upload_spec_accepts_external_fixture',
    'local_preview_smoke_gate_preserved',
    'runtime_provider_public_delivery_scope_not_enabled',
  ],
}, null, 2))
