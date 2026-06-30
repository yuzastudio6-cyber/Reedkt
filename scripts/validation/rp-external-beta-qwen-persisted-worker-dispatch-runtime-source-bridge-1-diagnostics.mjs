#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1'
const dir = 'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1'
const recordPath = `${dir}/qwen-persisted-worker-dispatch-runtime-source-bridge-record.json`
const decision = 'completed_qwen_persisted_worker_dispatch_runtime_source_bridge'
const execution = 'completed_backend_only_persisted_dispatch_source_bridge_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1R'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/bridge-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.md',
  'server/services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge.ts',
  'server/smoke/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-record.json',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
]

const requiredText = [
  packet,
  decision,
  execution,
  '3fb9ee8890aab91bfd8a5ac13007131f2a939442',
  '#1815',
  '#1810',
  '#577',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'reeditpro',
  'us-central1',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true',
  'credit_no_spend_no_persistent_credit_mutation',
  'directAdapterShortcutAllowed: false',
  'existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1-diagnostics.mjs',
])

const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge\.ts$|smoke\/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-smoke\.ts$)/,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|mp3|wav|png|jpg|jpeg)$/i,
]

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|QWEN inference|Model import|Model load|vLLM engine initialization|Worker execution|Worker dispatch|Route execution|Cloud Run job execution|Cloud Run service update|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation|Deployment|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg\/FFprobe execution|Docker execution|Dependency mutation|Package-lock mutation|Direct adapter shortcut)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"runtimeExecutedInThisPacket"\s*:\s*true/i,
  /"routeInvocation"\s*:\s*true/i,
  /"qwenInference"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"cloudRunJobExecution"\s*:\s*true/i,
  /"cloudRunServiceUpdate"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const record = parseJson(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '3fb9ee8890aab91bfd8a5ac13007131f2a939442') fail('integration base mismatch')
if (record.sourceChain?.confirmedRuntimeClosurePr !== 1815) fail('missing #1815 source')
if (record.sourceChain?.approvedFixtureInferenceApprovalPr !== 1810) fail('missing #1810 source')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.target?.tester !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.target?.googleCloudProject !== 'reeditpro') fail('Google Cloud project mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target mismatch')
if (record.bridge?.status !== 'ready_for_confirmed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime_retry') fail('bridge status mismatch')
if (record.bridge?.confirmationGate !== 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true') fail('confirmation gate mismatch')
if (record.bridge?.approvedSnapshotRequired !== true) fail('approved snapshot requirement missing')
if (record.bridge?.creditReservationRequired !== true) fail('credit reservation requirement missing')
if (record.bridge?.jobBatchRequired !== true) fail('job batch requirement missing')
if (record.bridge?.jobReferenceRequired !== true) fail('job reference requirement missing')
if (record.bridge?.workerLeaseRequired !== true) fail('worker lease requirement missing')
if (record.bridge?.idempotencyKeyRequired !== true) fail('idempotency requirement missing')
if (record.bridge?.privateInputManifestRequired !== true) fail('private input manifest requirement missing')
if (record.bridge?.privateOutputManifestChecksumRequired !== true) fail('private output manifest requirement missing')
if (record.bridge?.timeoutCostCeilingRequired !== true) fail('timeout/cost ceiling requirement missing')
if (record.bridge?.failClosedRestoreRequired !== true) fail('fail-closed restore requirement missing')
if (record.bridge?.creditPolicy !== 'credit_no_spend_no_persistent_credit_mutation') fail('credit policy mismatch')
if (record.bridge?.directAdapterShortcutAllowed !== false) fail('direct adapter shortcut must be false')
if (record.bridge?.existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge !== true) fail('persisted bridge delegation policy missing')
if (record.runtimeResult?.runtimeExecutedInThisPacket !== false) fail('runtime must not execute in this packet')
if (record.runtimeResult?.workerDispatch !== false) fail('worker dispatch must be false')
if (record.runtimeResult?.cloudRunJobExecution !== false) fail('Cloud Run job execution must be false')
if (record.runtimeResult?.qwenInference !== false) fail('QWEN inference must be false')
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'backendOnlySourceBridge' || key === 'sourceContractOnly') {
    if (value !== true) fail(`${key} must be true`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const confirmedClosure = parseJson(
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-record.json',
)
if (confirmedClosure.decision !== 'blocked_missing_persisted_job_or_queue_lease_reference') fail('confirmed closure predecessor mismatch')
const approval = parseJson(
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json',
)
if (approval.decision !== 'approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate') fail('approval predecessor mismatch')
const runtimeFixture = parseJson(
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-record.json',
)
if (runtimeFixture.decision !== 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture') fail('runtime fixture source mismatch')

const service = read('server/services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge.ts')
for (const text of [
  'directAdapterShortcutAllowed: false',
  'existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true',
  'workerDispatchSourceBridgePrepared',
  'credit_no_spend_no_persistent_credit_mutation',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE',
]) {
  if (!service.includes(text)) fail(`bridge service missing required text: ${text}`)
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1'] !==
  'tsx server/smoke/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
execFileSync('git', ['diff', '--cached', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside packet scope: ${file}`)
  for (const pattern of blockedChangedPatterns) {
    if (pattern.test(file)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
