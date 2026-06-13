import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-3-offline-dry-run-approval-packet.md',
  'docs/worker-runtime/worker-3-source-evidence-lockfile.md',
  'docs/worker-runtime/worker-3-approval-decision-record.md',
  'docs/worker-runtime/worker-3-future-command-template.md',
  'docs/worker-runtime/worker-3-qa-observability-requirements.md',
  'docs/worker-runtime/worker-3-cleanup-rollback-plan.md',
  'docs/worker-runtime/worker-4-allowed-blocked-scope.md',
  'docs/prompt-worker-3-validation-results.md',
  'docs/implementation-prompts/prompt-worker-3-offline-dry-run-approval-packet.md',
]

const requiredWorker2Evidence = [
  'docs/worker-runtime/worker-2-dry-run-fixture-plan.md',
  'docs/worker-runtime/worker-2-fixture-contract-test-report.md',
  'docs/worker-runtime/worker-2-readiness-decision.md',
  'docs/worker-runtime/worker-2-tool-route-handoff-mapping.md',
  'docs/worker-runtime/worker-2-warning-blocker-register.md',
  'docs/worker-runtime/worker-3-allowed-blocked-scope.md',
  'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json',
  'docs/prompt-worker-2-validation-results.md',
]

const requiredMarkers = [
  'approved_with_warnings_for_worker_4',
  'futureOfflineWorkerDryRunApproved: `true`',
  'ready_with_warnings_for_worker_3_offline_dry_run_approval_packet',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; worker runtime offline dry-run approval packet only',
  'WORKER-4 - Worker Runtime Offline Dry-Run Execution',
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
  console.error(`WORKER-3 diagnostic failed: ${message}`)
  process.exit(1)
}

for (const relativePath of [...requiredDocs, ...requiredWorker2Evidence]) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`missing required file ${relativePath}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['worker:runtime-offline-dry-run-approval:diagnostics'] !==
  'node scripts/validation/worker-runtime-offline-dry-run-approval-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-offline-dry-run-approval:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => read(relativePath)).join('\n')

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}

if (!docsText.includes(exactNoScope)) {
  fail('missing exact no-scope statement')
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const decisionRecord = read('docs/worker-runtime/worker-3-approval-decision-record.md')
const allowedDecisions = [
  'approved_for_worker_4_offline_dry_run_execution',
  'approved_with_warnings_for_worker_4',
  'blocked_pending_worker_approval_fixes',
]
if (!allowedDecisions.some((decision) => decisionRecord.includes(`decisionState: \`${decision}\``))) {
  fail('decision state is not an allowed WORKER-3 decision')
}

const commandTemplate = read('docs/worker-runtime/worker-3-future-command-template.md')
const commandBlocks = [...commandTemplate.matchAll(/```[\w-]*\n([\s\S]*?)```/g)].map((match) => match[1])
if (commandBlocks.length < 1) fail('future command template has no command blocks')
for (const block of commandBlocks) {
  if (!block.includes('DO NOT RUN UNTIL WORKER-4 EXECUTION APPROVAL EXISTS.')) {
    fail('command block missing WORKER-4 approval warning')
  }
}
for (const placeholder of [
  '<WORKER_4_RUN_ID>',
  '<WORKER_FIXTURE_DIR>',
  '<SCOPED_TOOL_CALL_MANIFEST_REF>',
  '<OFFLINE_OUTPUT_DIR>',
  '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
  '<WORKER_JOB_PAYLOAD_FIXTURE>',
]) {
  if (!commandTemplate.includes(placeholder)) fail(`missing placeholder ${placeholder}`)
}

const unsafeClaims = [
  [/live worker execution approved:\s*`?(true|yes|enabled)/i, 'live worker execution approval'],
  [/worker job claim approved:\s*`?(true|yes|enabled)/i, 'job claim approval'],
  [/worker lease mutation approved:\s*`?(true|yes|enabled)/i, 'lease mutation approval'],
  [/queue execution approved:\s*`?(true|yes|enabled)/i, 'queue execution approval'],
  [/route execution approved:\s*`?(true|yes|enabled)/i, 'route execution approval'],
  [/tool execution approved:\s*`?(true|yes|enabled)/i, 'tool execution approval'],
  [/provider runtime approved:\s*`?(true|yes|enabled)/i, 'provider runtime approval'],
  [/Supabase mutation approved:\s*`?(true|yes|enabled)/i, 'Supabase mutation approval'],
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

const report = {
  status: 'passed',
  phase: 'WORKER-3',
  decisionState: 'approved_with_warnings_for_worker_4',
  futureOfflineWorkerDryRunApproved: true,
  requiredDocsChecked: requiredDocs.length,
  worker2EvidenceFilesChecked: requiredWorker2Evidence.length,
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
  productionCapabilityEnabled: 'none; worker runtime offline dry-run approval packet only',
  nextRecommendedPrompt: 'WORKER-4 - Worker Runtime Offline Dry-Run Execution',
}

console.log(JSON.stringify(report, null, 2))
