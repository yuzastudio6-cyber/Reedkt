import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-4-offline-dry-run-execution.md',
  'docs/worker-runtime/worker-4-offline-dry-run-results.md',
  'docs/worker-runtime/worker-4-job-payload-evidence.md',
  'docs/worker-runtime/worker-4-claim-lease-simulation-evidence.md',
  'docs/worker-runtime/worker-4-qa-evidence.md',
  'docs/worker-runtime/worker-4-observability-evidence.md',
  'docs/worker-runtime/worker-4-cleanup-evidence.md',
  'docs/worker-runtime/worker-4-readiness-decision.md',
  'docs/worker-runtime/worker-5-allowed-blocked-scope.md',
  'docs/prompt-worker-4-validation-results.md',
  'docs/implementation-prompts/prompt-worker-4-offline-dry-run-execution.md',
]

const requiredMarkers = [
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'worker-4-local-static',
  '.local-artifacts/worker-runtime/worker-4/worker-4-local-static/',
  'fixtures processed: `7`',
  'fixtures passed with warnings: `7`',
  'approved_with_warnings_for_worker_4',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; worker runtime offline dry-run execution only',
  'WORKER-5 - Worker Runtime Offline Dry-Run QA / Review',
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

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function fail(message) {
  console.error(`WORKER-4 diagnostic failed: ${message}`)
  process.exit(1)
}

for (const relativePath of requiredDocs) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing required doc ${relativePath}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['worker:runtime-offline-dry-run:execute'] !== 'node scripts/validation/worker-runtime-offline-dry-run-execution.mjs') {
  fail('missing worker:runtime-offline-dry-run:execute script')
}
if (packageJson.scripts?.['worker:runtime-offline-dry-run:diagnostics'] !== 'node scripts/validation/worker-runtime-offline-dry-run-execution-diagnostics.mjs') {
  fail('missing worker:runtime-offline-dry-run:diagnostics script')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}
if (!docsText.includes(exactNoScope)) fail('missing exact no-scope statement')

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const allowedDecisionStates = [
  'worker_runtime_offline_dry_run_passed',
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'worker_runtime_offline_dry_run_blocked',
]
const readinessDecision = read('docs/worker-runtime/worker-4-readiness-decision.md')
if (!allowedDecisionStates.some((decision) => readinessDecision.includes(`decisionState: \`${decision}\``))) {
  fail('readiness decision does not use an allowed WORKER-4 decision state')
}

const unsafeClaims = [
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
]

for (const [pattern, label] of unsafeClaims) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const runnerSources = [
  'scripts/validation/worker-runtime-offline-dry-run-execution.mjs',
  'scripts/validation/worker-runtime-offline-dry-run-execution-diagnostics.mjs',
]
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

for (const relativePath of runnerSources) {
  const text = read(relativePath)
  for (const pattern of forbiddenRunnerImports) {
    if (pattern.test(text)) fail(`${relativePath} imports a forbidden runtime module`)
  }
}

if (existsSync(path.join(root, '.local-artifacts'))) {
  // Presence is allowed locally after execution; committed docs must reference it only as ignored relative evidence.
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-4',
  decisionState: 'worker_runtime_offline_dry_run_passed_with_warnings',
  runId: 'worker-4-local-static',
  requiredDocsChecked: requiredDocs.length,
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
  productionCapabilityEnabled: 'none; worker runtime offline dry-run execution only',
  nextRecommendedPrompt: 'WORKER-5 - Worker Runtime Offline Dry-Run QA / Review',
}, null, 2))
