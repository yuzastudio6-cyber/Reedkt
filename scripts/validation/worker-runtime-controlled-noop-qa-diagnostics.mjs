import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-8-controlled-noop-qa-review.md',
  'docs/worker-runtime/worker-8-fixture-acceptance-matrix.md',
  'docs/worker-runtime/worker-8-warning-blocker-register.md',
  'docs/worker-runtime/worker-8-job-payload-noop-review.md',
  'docs/worker-runtime/worker-8-claim-lease-noop-review.md',
  'docs/worker-runtime/worker-8-queue-noop-review.md',
  'docs/worker-runtime/worker-8-tool-route-handoff-review.md',
  'docs/worker-runtime/worker-8-cleanup-review.md',
  'docs/worker-runtime/worker-9-allowed-blocked-scope.md',
  'docs/prompt-worker-8-validation-results.md',
  'docs/implementation-prompts/prompt-worker-8-controlled-noop-worker-gate-qa-review.md',
]

const sourceDocs = [
  'docs/worker-runtime/worker-7-controlled-noop-worker-gate-execution.md',
  'docs/worker-runtime/worker-7-controlled-noop-results.md',
  'docs/worker-runtime/worker-7-job-payload-noop-evidence.md',
  'docs/worker-runtime/worker-7-claim-lease-noop-evidence.md',
  'docs/worker-runtime/worker-7-queue-noop-evidence.md',
  'docs/worker-runtime/worker-7-qa-evidence.md',
  'docs/worker-runtime/worker-7-observability-evidence.md',
  'docs/worker-runtime/worker-7-cleanup-evidence.md',
  'docs/worker-runtime/worker-7-readiness-decision.md',
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

const expectedLocalEvidencePath = '.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/'

const exactNoScope =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, controlled no-op rerun, or broad service-role handler was enabled.'

function fail(message) {
  console.error(`WORKER-8 controlled no-op QA diagnostic failed: ${message}`)
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

for (const requiredDoc of [...requiredDocs, ...sourceDocs]) ensureExists(requiredDoc)
ensureExists('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-controlled-noop:qa-review:diagnostics'] !==
  'node scripts/validation/worker-runtime-controlled-noop-qa-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-controlled-noop:qa-review:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
const sourceText = sourceDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
const validationText = read('docs/prompt-worker-8-validation-results.md')
const implementationText = read('docs/implementation-prompts/prompt-worker-8-controlled-noop-worker-gate-qa-review.md')

const requiredMarkers = [
  'worker_runtime_controlled_noop_qa_passed_with_warnings',
  'ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan',
  'worker_runtime_controlled_noop_passed_with_warnings',
  'worker-7-local-noop',
  expectedLocalEvidencePath,
  '2a2cf63678b647f9f963023386cc2bb523548e7e884855b092c188dd192d9032',
  'accepted_with_warnings',
  'controlled no-op rerun: `false`',
  'fixtures reviewed: `7`',
  'fixtures accepted with warnings: `7`',
  'PR #406',
  'PR #405',
  'PR #360',
  'PR #371',
  'TOOL-ROUTE-0',
  'TOOL-ROUTE-1',
  'TOOL-ROUTE-1A',
  'TOOL-ROUTE-2',
  'TOOL-ROUTE-2A',
  'TOOL-ROUTE-3',
  'TOOL-ROUTE-4',
  'TOOL-ROUTE-5',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; controlled no-op worker gate QA review only',
  'WORKER-9 - Controlled Job Claim/Lease Gate Approval Packet',
]

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}

if (!sourceText.includes('worker_runtime_controlled_noop_passed_with_warnings')) {
  fail('source WORKER-7 docs do not record controlled no-op pass with warnings')
}
if (!sourceText.includes(expectedLocalEvidencePath)) {
  fail('source WORKER-7 docs do not record expected relative local evidence path')
}

if (!validationText.includes(exactNoScope)) fail('validation results missing exact no-scope statement')
if (!implementationText.includes(exactNoScope)) fail('implementation prompt missing exact no-scope statement')

const fixtureData = readJson('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')
if (!Array.isArray(fixtureData.fixtures) || fixtureData.fixtures.length !== expectedFixtureIds.length) {
  fail('expected seven worker fixture rows')
}

for (const expectedFixtureId of expectedFixtureIds) {
  const fixture = fixtureData.fixtures.find((candidate) => candidate.fixtureId === expectedFixtureId)
  if (!fixture) fail(`fixture JSON missing ${expectedFixtureId}`)
  if (!docsText.includes(expectedFixtureId)) fail(`missing fixture review ${expectedFixtureId}`)
  if (!docsText.includes(fixture.sourceScopedToolCallFixture)) {
    fail(`missing source scoped fixture for ${expectedFixtureId}`)
  }
  if (!docsText.includes(fixture.approvedPlanSnapshotRef)) {
    fail(`missing approved plan snapshot ref for ${expectedFixtureId}`)
  }
  if (!docsText.includes(fixture.scopedToolCallManifestRef)) {
    fail(`missing scoped manifest ref for ${expectedFixtureId}`)
  }
  if (!Array.isArray(fixture.blockedUses) || fixture.blockedUses.length === 0) {
    fail(`fixture missing blocked uses ${expectedFixtureId}`)
  }
}

const qaDoc = read('docs/worker-runtime/worker-8-controlled-noop-qa-review.md')
if (!qaDoc.includes('QA result: `worker_runtime_controlled_noop_qa_passed_with_warnings`')) {
  fail('QA review does not record expected QA result')
}
if (!qaDoc.includes('workerReadinessState: `ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan`')) {
  fail('QA review does not record expected readiness state')
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const unsafePatterns = [
  [/controlled no-op rerun:\s*`?(yes|true|performed|enabled|rerun)/i, 'controlled no-op rerun claim'],
  [/liveWorkerExecutionApprovedNow:\s+`?true`?/i, 'live worker execution approval'],
  [/workerJobClaimApprovedNow:\s+`?true`?/i, 'job claim approval'],
  [/workerLeaseMutationApprovedNow:\s+`?true`?/i, 'lease mutation approval'],
  [/queueExecutionApprovedNow:\s+`?true`?/i, 'queue execution approval'],
  [/routeExecutionApprovedNow:\s+`?true`?/i, 'route execution approval'],
  [/toolExecutionApprovedNow:\s+`?true`?/i, 'tool execution approval'],
  [/providerRuntimeApprovedNow:\s+`?true`?/i, 'provider runtime approval'],
  [/mediaRuntimeApprovedNow:\s+`?true`?/i, 'media runtime approval'],
  [/audioRuntimeApprovedNow:\s+`?true`?/i, 'audio runtime approval'],
  [/supabaseMutationApprovedNow:\s+`?true`?/i, 'Supabase mutation approval'],
  [/SQL executed:\s+`?(yes|true|executed|applied)`?/i, 'SQL execution claim'],
  [/Migration deployed:\s+`?(yes|true|deployed|applied)`?/i, 'migration deployment claim'],
  [/Supabase environment touched:\s+`?(staging|production|remote|local)`?/i, 'Supabase environment touch claim'],
  [/gs:\/\//i, 'GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [new RegExp(['x-goog-' + 'signature', 'x-amz-' + 'signature', 'x-amz-' + 'credential'].join('|'), 'i'), 'signed URL marker'],
  [new RegExp('BEGIN ' + 'PRIVATE KEY', 'i'), 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-looking token'],
  [/\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
]

for (const [pattern, label] of unsafePatterns) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const runnerText = read('scripts/validation/worker-runtime-controlled-noop-qa-diagnostics.mjs')
const staticImports = [...runnerText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
const allowedImports = new Set(['node:fs', 'node:path', 'node:url'])
for (const importPath of staticImports) {
  if (!allowedImports.has(importPath)) fail(`diagnostic imports forbidden module ${importPath}`)
}
const dynamicImports = [...runnerText.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1])
if (dynamicImports.length > 0) fail('diagnostic uses dynamic imports')

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
  if (pattern.test(runnerText)) fail('diagnostic imports a forbidden runtime module')
}

const trackerText = trackerDocs
  .filter((relativePath) => existsSync(path.join(root, relativePath)))
  .map((relativePath) => `${relativePath}\n${read(relativePath)}`)
  .join('\n\n')
if (!trackerText.includes('WORKER-8')) fail('present trackers must reference WORKER-8')
if (!trackerText.includes('worker_runtime_controlled_noop_qa_passed_with_warnings')) {
  fail('present trackers must reference WORKER-8 QA result')
}
if (!trackerText.includes('ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan')) {
  fail('present trackers must reference WORKER-8 readiness')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-8',
  qaResult: 'worker_runtime_controlled_noop_qa_passed_with_warnings',
  workerReadinessState: 'ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan',
  sourceWorker7Decision: 'worker_runtime_controlled_noop_passed_with_warnings',
  sourceRunId: 'worker-7-local-noop',
  fixturesReviewed: expectedFixtureIds.length,
  controlledNoopRerun: false,
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  supabaseMilestoneSync: 'not_performed',
  productionCapabilityEnabled: 'none; controlled no-op worker gate QA review only',
  nextRecommendedPrompt: 'WORKER-9 - Controlled Job Claim/Lease Gate Approval Packet',
}, null, 2))
