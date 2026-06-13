import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-7-controlled-noop-worker-gate-execution.md',
  'docs/worker-runtime/worker-7-controlled-noop-results.md',
  'docs/worker-runtime/worker-7-job-payload-noop-evidence.md',
  'docs/worker-runtime/worker-7-claim-lease-noop-evidence.md',
  'docs/worker-runtime/worker-7-queue-noop-evidence.md',
  'docs/worker-runtime/worker-7-qa-evidence.md',
  'docs/worker-runtime/worker-7-observability-evidence.md',
  'docs/worker-runtime/worker-7-cleanup-evidence.md',
  'docs/worker-runtime/worker-7-readiness-decision.md',
  'docs/worker-runtime/worker-8-allowed-blocked-scope.md',
  'docs/prompt-worker-7-validation-results.md',
  'docs/implementation-prompts/prompt-worker-7-controlled-noop-worker-gate-execution.md',
]

const trackerDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const expectedFixtureIds = [
  'worker_route_ai_tools_creative_graphics',
  'worker_route_track_a_render_export',
  'worker_route_track_b_media_processing',
  'worker_route_sound_music_audio',
  'worker_route_web_search_capture',
  'worker_route_map_geospatial',
  'worker_route_multi_tool_plan',
]

const expectedEvidenceFiles = [
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/controlled-noop-report.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/job-payload-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/claim-lease-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/queue-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/qa-evidence.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/observability-evidence.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/cleanup-evidence.json',
  '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/checksum-summary.json',
]

const falseBooleanNames = [
  'liveWorkerExecutionApprovedNow',
  'workerJobClaimApprovedNow',
  'workerLeaseMutationApprovedNow',
  'queueExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'mediaRuntimeApprovedNow',
  'audioRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const exactNoScope =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, or broad service-role handler was enabled.'

function fail(message) {
  console.error(`WORKER-7 controlled no-op execution diagnostic failed: ${message}`)
  process.exit(1)
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function ensureExists(relativePath) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing ${relativePath}`)
}

for (const requiredDoc of requiredDocs) ensureExists(requiredDoc)
ensureExists('scripts/validation/worker-runtime-controlled-noop-execution.mjs')
ensureExists('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-controlled-noop:execute'] !==
  'node scripts/validation/worker-runtime-controlled-noop-execution.mjs'
) {
  fail('missing package script worker:runtime-controlled-noop:execute')
}
if (
  packageJson.scripts?.['worker:runtime-controlled-noop:diagnostics'] !==
  'node scripts/validation/worker-runtime-controlled-noop-execution-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-controlled-noop:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
const validationText = read('docs/prompt-worker-7-validation-results.md')
const implementationText = read('docs/implementation-prompts/prompt-worker-7-controlled-noop-worker-gate-execution.md')

const requiredMarkers = [
  'worker_runtime_controlled_noop_passed_with_warnings',
  'worker-7-local-noop',
  'approved_with_warnings_for_worker_7',
  'futureControlledNoopWorkerExecutionApproved: true',
  'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'TOOL-ROUTE-0',
  'TOOL-ROUTE-1',
  'TOOL-ROUTE-1A',
  'TOOL-ROUTE-2',
  'TOOL-ROUTE-2A',
  'TOOL-ROUTE-3',
  'TOOL-ROUTE-4',
  'TOOL-ROUTE-5',
  'PR #360',
  'PR #371',
  'PLAN-SNAPSHOT',
  'ready_with_warnings_for_worker_8_controlled_noop_worker_gate_qa_review',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; controlled no-op worker gate execution only',
  'WORKER-8 - Controlled No-Op Worker Gate QA / Review',
]

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}

if (!validationText.includes(exactNoScope)) fail('validation results missing exact no-scope statement')
if (!implementationText.includes(exactNoScope)) fail('implementation prompt missing exact no-scope statement')

for (const fixtureId of expectedFixtureIds) {
  if (!docsText.includes(fixtureId)) fail(`missing fixture ${fixtureId}`)
}

for (const evidenceFile of expectedEvidenceFiles) {
  if (!docsText.includes(evidenceFile)) fail(`missing local evidence reference ${evidenceFile}`)
}

const absoluteLocalArtifactPattern = /\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i
if (absoluteLocalArtifactPattern.test(docsText)) fail('docs include absolute local artifact path')

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const unsafePatterns = [
  [/liveWorkerExecutionApprovedNow:\s+`?true`?/i, 'live worker execution approval'],
  [/workerJobClaimApprovedNow:\s+`?true`?/i, 'job claim approval'],
  [/workerLeaseMutationApprovedNow:\s+`?true`?/i, 'lease mutation approval'],
  [/queueExecutionApprovedNow:\s+`?true`?/i, 'queue execution approval'],
  [/routeExecutionApprovedNow:\s+`?true`?/i, 'route execution approval'],
  [/toolExecutionApprovedNow:\s+`?true`?/i, 'tool execution approval'],
  [/providerRuntimeApprovedNow:\s+`?true`?/i, 'provider runtime approval'],
  [/supabaseMutationApprovedNow:\s+`?true`?/i, 'Supabase mutation approval'],
  [/SQL executed:\s+`?(yes|true|executed|applied)`?/i, 'SQL execution claim'],
  [/Migration deployed:\s+`?(yes|true|deployed|applied)`?/i, 'migration deployment claim'],
  [/Supabase environment touched:\s+`?(staging|production|remote|local)`?/i, 'Supabase environment touch claim'],
  [/gs:\/\//i, 'GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [new RegExp(['x-goog-' + 'signature', 'x-amz-' + 'signature', 'x-amz-' + 'credential'].join('|'), 'i'), 'signed URL marker'],
  [new RegExp('BEGIN ' + 'PRIVATE KEY', 'i'), 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-looking token'],
]

for (const [pattern, label] of unsafePatterns) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const runnerText = read('scripts/validation/worker-runtime-controlled-noop-execution.mjs')
const staticImports = [...runnerText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
const allowedImports = new Set(['node:fs', 'node:crypto', 'node:path', 'node:url'])
for (const importPath of staticImports) {
  if (!allowedImports.has(importPath)) fail(`runner imports forbidden module ${importPath}`)
}
const dynamicImports = [...runnerText.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1])
if (dynamicImports.length > 0) fail('runner uses dynamic imports')

const forbiddenRuntimeImportPatterns = [
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/cli\/run-worker-job/i,
  /from\s+['"][^'"]*tool-registry/i,
  /from\s+['"][^'"]*provider/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"][^'"]*ffmpeg/i,
  /from\s+['"][^'"]*remotion/i,
]
for (const pattern of forbiddenRuntimeImportPatterns) {
  if (pattern.test(runnerText)) fail('runner imports a forbidden runtime module')
}

const fixtureData = readJson('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')
if (fixtureData.fixtures?.length !== expectedFixtureIds.length) fail('expected seven worker fixtures')
for (const expectedFixtureId of expectedFixtureIds) {
  if (!fixtureData.fixtures.some((fixture) => fixture.fixtureId === expectedFixtureId)) {
    fail(`fixture JSON missing ${expectedFixtureId}`)
  }
}

const trackerText = trackerDocs
  .filter((relativePath) => existsSync(path.join(root, relativePath)))
  .map((relativePath) => `${relativePath}\n${read(relativePath)}`)
  .join('\n\n')
if (!trackerText.includes('WORKER-7')) fail('present trackers must reference WORKER-7')
if (!trackerText.includes('worker_runtime_controlled_noop_passed_with_warnings')) {
  fail('present trackers must reference WORKER-7 decision state')
}
if (!trackerText.includes('worker-7-local-noop')) fail('present trackers must reference WORKER-7 run id')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-7',
  decisionState: 'worker_runtime_controlled_noop_passed_with_warnings',
  runId: 'worker-7-local-noop',
  fixturesReviewed: expectedFixtureIds.length,
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
}, null, 2))
