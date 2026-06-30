#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1'
const dir = 'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1'
const recordPath = `${dir}/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/approval-decision.md`,
  `${dir}/runtime-envelope.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/qwen-persisted-worker-dispatch-source-import-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json',
  'docs/external-beta/operator-gcloud-auth-preflight-1/operator-gcloud-auth-preflight-record.json',
  'docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json',
]

const requiredText = [
  packet,
  'approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate',
  'completed_docs_only_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_no_runtime_execution',
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'reeditpro',
  'us-central1',
  'google_cloud_run_gpu',
  'nvidia_l4',
  'scale_to_zero_required',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  '2026-06-30T02-01-10-237Z-03964b88',
  '#1808',
  'open_draft_branch_to_branch_evidence_only_excluded_as_current_base_source',
  'credit_no_spend_no_persistent_credit_mutation',
  'blocked_missing_persisted_job_or_queue_lease_reference',
  '#577',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of [
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/runtime-result.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/runtime-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/bridge-contract.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/qwen-persisted-worker-dispatch-runtime-source-bridge-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.md',
  'server/services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge.ts',
  'server/smoke/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1-diagnostics.mjs',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/runtime-result.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/validation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-single-tester-product-flow-qa-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.mjs',
]) {
  allowedChangedFiles.add(file)
}

const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^server\/(?!smoke\/|services\/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge\.ts$)/,
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
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|QWEN inference|Model import|Model load|vLLM engine initialization|Worker execution|Worker dispatch|Route execution|Cloud Run invocation in this phase|Identity token fetch|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation|Deployment|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg\/FFprobe execution|Docker execution|Dependency mutation|Package-lock mutation|Draft stack merge|Blind cherry-pick)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"runtimeExecutedInThisPacket"\s*:\s*true/i,
  /"qwenInference"\s*:\s*true/i,
  /"modelImport"\s*:\s*true/i,
  /"modelLoad"\s*:\s*true/i,
  /"vllmEngineInitialization"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"cloudRunInvocationInThisPhase"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"draftStackMerge"\s*:\s*true/i,
  /"blindCherryPick"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
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

const record = JSON.parse(read(recordPath))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'b72fc9f62ab2fec5902e005caeb73783f38b8c08') fail('integration base mismatch')
if (record.sourceClosure?.qwenPersistedDispatchApprovedFixtureInferencePlanPr !== 1805) fail('missing #1805 source')
if (record.sourceClosure?.approvedFixtureInferenceApprovalDraftPr !== '#1808 open_draft_branch_to_branch_evidence_only_excluded_as_current_base_source') fail('missing #1808 draft-stack duplicate exclusion')
if (record.sourceClosure?.qwenPersistedDispatchSourceImportPr !== 1803) fail('missing #1803 source')
if (record.sourceClosure?.operatorGcloudAuthPreflightRunId !== '2026-06-30T02-01-10-237Z-03964b88') fail('missing operator gcloud auth preflight run')
if (record.sourceClosure?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target mismatch')
if (record.target?.googleCloudProject !== 'reeditpro') fail('Google Cloud project mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.approvedRuntimeShape?.runtime !== 'google_cloud_run_gpu') fail('runtime mismatch')
if (record.approvedRuntimeShape?.gpu !== 'nvidia_l4') fail('GPU mismatch')
if (record.approvedRuntimeShape?.minInstances !== 0) fail('min instances mismatch')
if (record.approvedRuntimeShape?.initialMaxInstances !== 1) fail('max instances mismatch')
if (record.approvedRuntimeShape?.cpuFallback !== false) fail('CPU fallback must be false')
if (record.approvalGate?.confirmationGate !== 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true') fail('confirmation gate mismatch')
if (record.approvalGate?.approvedForSingleFutureRuntimeAttempt !== true) fail('single future runtime approval missing')
if (record.approvalGate?.runtimeExecutedInThisPacket !== false) fail('runtime must not execute in this packet')
if (record.approvedFixtureEnvelope?.approvedSnapshotFixtureReference !== 'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404') fail('fixture reference mismatch')
if (record.approvedFixtureEnvelope?.creditPolicy !== 'credit_no_spend_no_persistent_credit_mutation') fail('credit policy mismatch')
if (record.readiness?.qwenPersistedWorkerDispatchApprovedFixtureInferenceApproval !== 'ready_for_confirmed_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime_attempt') fail('readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyApprovalReview' || key === 'approvedForSingleFutureRuntimeAttempt') {
    if (value !== true) fail(`${key} must be true`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const plan = JSON.parse(read('docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-record.json'))
if (plan.readiness?.qwenPersistedWorkerDispatchApprovedFixtureInferencePlan !== 'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_packet') fail('plan predecessor mismatch')
const operator = JSON.parse(read('docs/external-beta/operator-gcloud-auth-preflight-1/operator-gcloud-auth-preflight-record.json'))
if (operator.runner?.successDecision !== 'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry') fail('operator preflight success decision missing')
const qwenQa = JSON.parse(read('docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json'))
if (qwenQa.qa?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') fail('QWEN QA source mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

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
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1')
