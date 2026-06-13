import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-6-controlled-noop-worker-gate-approval-packet.md',
  'docs/worker-runtime/worker-6-source-evidence-lockfile.md',
  'docs/worker-runtime/worker-6-approval-decision-record.md',
  'docs/worker-runtime/worker-6-controlled-noop-safety-policy.md',
  'docs/worker-runtime/worker-6-future-command-template.md',
  'docs/worker-runtime/worker-6-qa-observability-requirements.md',
  'docs/worker-runtime/worker-6-cleanup-rollback-plan.md',
  'docs/worker-runtime/worker-7-allowed-blocked-scope.md',
  'docs/prompt-worker-6-validation-results.md',
  'docs/implementation-prompts/prompt-worker-6-controlled-noop-worker-gate-approval-packet.md',
]

const trackerDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const requiredMarkers = [
  'approved_with_warnings_for_worker_7',
  'futureControlledNoopWorkerExecutionApproved: `true`',
  'WORKER-0',
  'WORKER-1',
  'WORKER-2',
  'WORKER-3',
  'WORKER-4',
  'WORKER-5',
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
  'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json',
  'worker:runtime-controlled-noop-approval:diagnostics',
  'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  'ready_with_warnings_for_controlled_noop_worker_gate_plan',
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'approved_with_warnings_for_worker_4',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'ready_with_warnings_for_worker_route_fixture_integration_plan',
  'DO NOT RUN UNTIL WORKER-7 EXECUTION APPROVAL EXISTS.',
  '<WORKER_7_RUN_ID>',
  '<WORKER_FIXTURE_DIR>',
  '<OFFLINE_NOOP_OUTPUT_DIR>',
  '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
  '<WORKER_JOB_PAYLOAD_FIXTURE>',
  '<SCOPED_TOOL_CALL_MANIFEST_REF>',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; controlled no-op worker gate approval packet only',
  'WORKER-7 - Controlled No-Op Worker Gate Execution',
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
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, controlled no-op execution, offline dry-run rerun, or broad service-role handler was enabled.'

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function fail(message) {
  console.error(`WORKER-6 controlled no-op approval diagnostic failed: ${message}`)
  process.exit(1)
}

for (const relativePath of requiredDocs) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing required doc ${relativePath}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-controlled-noop-approval:diagnostics'] !==
  'node scripts/validation/worker-runtime-controlled-noop-approval-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-controlled-noop-approval:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}
if (!docsText.includes(exactNoScope)) fail('missing exact no-scope statement')

const decisionDoc = read('docs/worker-runtime/worker-6-approval-decision-record.md')
const allowedDecisionStates = [
  'approved_for_worker_7_controlled_noop_execution',
  'approved_with_warnings_for_worker_7',
  'blocked_pending_worker_noop_gate_fixes',
]
if (!allowedDecisionStates.some((state) => decisionDoc.includes(`decisionState: \`${state}\``))) {
  fail('approval decision record does not use an allowed decision state')
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const commandTemplate = read('docs/worker-runtime/worker-6-future-command-template.md')
const commandBlocks = commandTemplate.match(/```sh[\s\S]*?```/g) ?? []
if (commandBlocks.length < 1) fail('expected at least one shell command block')
for (const block of commandBlocks) {
  const count = (block.match(/DO NOT RUN UNTIL WORKER-7 EXECUTION APPROVAL EXISTS\./g) ?? []).length
  if (count !== 1) fail('each command block must include exactly one WORKER-7 warning')
}

const unsafeDocPatterns = [
  [/controlled no-op execution:\s*`?(yes|true|performed|enabled|complete)/i, 'controlled no-op execution claim'],
  [/offline dry-run rerun:\s*`?(yes|true|performed|enabled|complete)/i, 'offline dry-run rerun claim'],
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

for (const [pattern, label] of unsafeDocPatterns) {
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

const runnerText = read('scripts/validation/worker-runtime-controlled-noop-approval-diagnostics.mjs')
for (const pattern of forbiddenRunnerImports) {
  if (pattern.test(runnerText)) fail('WORKER-6 diagnostic imports a forbidden runtime module')
}

const trackerText = trackerDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
if (!trackerText.includes('WORKER-6')) fail('present tracker docs must reference WORKER-6')
if (!trackerText.includes('approved_with_warnings_for_worker_7')) {
  fail('present tracker docs must reference WORKER-6 decision state')
}
if (!trackerText.includes('futureControlledNoopWorkerExecutionApproved')) {
  fail('present tracker docs must reference the future no-op approval')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-6',
  decisionState: 'approved_with_warnings_for_worker_7',
  futureControlledNoopWorkerExecutionApproved: true,
  docsChecked: requiredDocs.length,
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
  productionCapabilityEnabled: 'none; controlled no-op worker gate approval packet only',
  nextRecommendedPrompt: 'WORKER-7 - Controlled No-Op Worker Gate Execution',
}, null, 2))
