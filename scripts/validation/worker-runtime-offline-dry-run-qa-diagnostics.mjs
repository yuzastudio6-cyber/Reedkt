import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-5-offline-dry-run-qa-review.md',
  'docs/worker-runtime/worker-5-fixture-acceptance-matrix.md',
  'docs/worker-runtime/worker-5-warning-blocker-register.md',
  'docs/worker-runtime/worker-5-controlled-noop-worker-gate-readiness.md',
  'docs/worker-runtime/worker-5-to-tool-route-handoff-review.md',
  'docs/worker-runtime/worker-5-cleanup-review.md',
  'docs/worker-runtime/worker-6-allowed-blocked-scope.md',
  'docs/prompt-worker-5-validation-results.md',
  'docs/implementation-prompts/prompt-worker-5-offline-dry-run-qa-review.md',
]

const trackerDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const requiredMarkers = [
  'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  'ready_with_warnings_for_controlled_noop_worker_gate_plan',
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'approved_with_warnings_for_worker_4',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'accepted_with_warnings',
  'PR #397',
  'PR #395',
  'PR #391',
  'PR #389',
  'worker-4-local-static',
  '.local-artifacts/worker-runtime/worker-4/worker-4-local-static/',
  'fixtures reviewed: `7`',
  'fixtures accepted with warnings: `7`',
  'offline dry-run rerun: `false`',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; worker runtime offline dry-run QA review only',
  'WORKER-6 - Controlled No-Op Worker Gate Approval Packet',
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
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, offline dry-run rerun, or broad service-role handler was enabled.'

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function fail(message) {
  console.error(`WORKER-5 QA diagnostic failed: ${message}`)
  process.exit(1)
}

for (const relativePath of requiredDocs) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing required doc ${relativePath}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-offline-dry-run:qa-review:diagnostics'] !==
  'node scripts/validation/worker-runtime-offline-dry-run-qa-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-offline-dry-run:qa-review:diagnostics')
}

const workerFixtures = readJson('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')
if (!Array.isArray(workerFixtures.fixtures) || workerFixtures.fixtures.length !== 7) {
  fail('expected seven worker fixture rows')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}
if (!docsText.includes(exactNoScope)) fail('missing exact no-scope statement')

for (const fixture of workerFixtures.fixtures) {
  if (!docsText.includes(fixture.fixtureId)) fail(`missing fixture review ${fixture.fixtureId}`)
  if (!docsText.includes(fixture.sourceScopedToolCallFixture)) fail(`missing source fixture ${fixture.sourceScopedToolCallFixture}`)
  if (!docsText.includes(fixture.approvedPlanSnapshotRef)) fail(`missing plan snapshot ref ${fixture.fixtureId}`)
  if (!docsText.includes(fixture.scopedToolCallManifestRef)) fail(`missing scoped manifest ref ${fixture.fixtureId}`)
}

const qaDecisionDoc = read('docs/worker-runtime/worker-5-offline-dry-run-qa-review.md')
const allowedQaStates = [
  'worker_runtime_offline_dry_run_qa_passed',
  'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  'worker_runtime_offline_dry_run_qa_blocked',
]
if (!allowedQaStates.some((state) => qaDecisionDoc.includes(`QA result: \`${state}\``))) {
  fail('QA review does not use an allowed QA state')
}

const readinessDoc = read('docs/worker-runtime/worker-5-controlled-noop-worker-gate-readiness.md')
const allowedReadinessStates = [
  'ready_for_controlled_noop_worker_gate_plan',
  'ready_with_warnings_for_controlled_noop_worker_gate_plan',
  'blocked_pending_worker_offline_qa_fixes',
]
if (!allowedReadinessStates.some((state) => readinessDoc.includes(`controlledNoopWorkerGateReadiness: \`${state}\``))) {
  fail('controlled no-op readiness does not use an allowed state')
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const forbiddenDocPatterns = [
  [/offline dry-run rerun:\s*`?(yes|true|performed|enabled)/i, 'offline dry-run rerun claim'],
  [/live worker execution approved:\s*`?(true|yes|enabled)/i, 'live worker execution approval'],
  [/worker job claim approved:\s*`?(true|yes|enabled)/i, 'worker job claim approval'],
  [/worker lease mutation approved:\s*`?(true|yes|enabled)/i, 'worker lease mutation approval'],
  [/queue execution approved:\s*`?(true|yes|enabled)/i, 'queue execution approval'],
  [/route execution approved:\s*`?(true|yes|enabled)/i, 'route execution approval'],
  [/tool execution approved:\s*`?(true|yes|enabled)/i, 'tool execution approval'],
  [/provider runtime approved:\s*`?(true|yes|enabled)/i, 'provider runtime approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployment claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touch claim'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/file:\/\//i, 'file URL'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
]

for (const [pattern, label] of forbiddenDocPatterns) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const forbiddenRunnerImports = [
  /from\s+['"][^'"]*server\/cli\/run-worker-job/i,
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/tool-registry/i,
  /from\s+['"][^'"]*provider/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"][^'"]*ffmpeg/i,
  /from\s+['"][^'"]*remotion/i,
  /import\(['"][^'"]*server\/cli\/run-worker-job/i,
  /import\(['"][^'"]*server\/routes/i,
  /import\(['"][^'"]*server\/workers/i,
  /import\(['"][^'"]*server\/tool-registry/i,
  /import\(['"][^'"]*provider/i,
  /import\(['"][^'"]*supabase/i,
  /import\(['"][^'"]*ffmpeg/i,
  /import\(['"][^'"]*remotion/i,
]

const runnerText = read('scripts/validation/worker-runtime-offline-dry-run-qa-diagnostics.mjs')
for (const pattern of forbiddenRunnerImports) {
  if (pattern.test(runnerText)) fail('WORKER-5 QA diagnostic imports a forbidden runtime module')
}

const trackerText = trackerDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
if (!trackerText.includes('WORKER-5')) fail('present tracker docs must reference WORKER-5')
if (!trackerText.includes('worker_runtime_offline_dry_run_qa_passed_with_warnings')) {
  fail('present tracker docs must reference WORKER-5 QA result')
}
if (!trackerText.includes('ready_with_warnings_for_controlled_noop_worker_gate_plan')) {
  fail('present tracker docs must reference controlled no-op readiness')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-5',
  qaResult: 'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  controlledNoopWorkerGateReadiness: 'ready_with_warnings_for_controlled_noop_worker_gate_plan',
  docsChecked: requiredDocs.length,
  fixturesReviewed: workerFixtures.fixtures.length,
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
  productionCapabilityEnabled: 'none; worker runtime offline dry-run QA review only',
  nextRecommendedPrompt: 'WORKER-6 - Controlled No-Op Worker Gate Approval Packet',
}, null, 2))
