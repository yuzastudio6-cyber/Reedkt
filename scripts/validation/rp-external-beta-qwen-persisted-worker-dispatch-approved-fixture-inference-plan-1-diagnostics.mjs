#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN-1'
const dir = 'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1'
const recordPath = `${dir}/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/inference-plan.md`,
  `${dir}/approval-gates.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/approval-decision.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/runtime-envelope.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/qwen-persisted-worker-dispatch-source-import-record.json',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/active-lane-current-state-after-qwen-auth-bridge-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_persisted_worker_dispatch_approved_fixture_inference_plan_current_base_source_review',
  'completed_docs_only_qwen_approved_fixture_inference_plan_no_runtime_execution',
  'f407bfe332ea7be8889ba2c29e4bb36a630cab83',
  '#1802',
  '#1803',
  '#577',
  'google_cloud_run_gpu',
  'nvidia_l4',
  'scale_to_zero_required',
  'one_request_approved_fixture_inference_only',
  'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_packet',
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)

const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^server\/(?!smoke\/)/,
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
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|QWEN inference|Model import|Model load|vLLM engine initialization|Worker execution|Worker dispatch|Route execution|Cloud Run invocation in this phase|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation|Deployment|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg\/FFprobe execution|Docker execution|Dependency mutation|Package-lock mutation|Draft stack merge|Blind cherry-pick)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"qwenInference"\s*:\s*true/i,
  /"modelImport"\s*:\s*true/i,
  /"modelLoad"\s*:\s*true/i,
  /"vllmEngineInitialization"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"cloudRunInvocationInThisPhase"\s*:\s*true/i,
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
if (record.decision !== 'completed_qwen_persisted_worker_dispatch_approved_fixture_inference_plan_current_base_source_review') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_approved_fixture_inference_plan_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'f407bfe332ea7be8889ba2c29e4bb36a630cab83') fail('integration base mismatch')
if (record.sourceClosure?.qwenPersistedDispatchSourceImportPr !== 1803) fail('missing #1803 source')
if (record.sourceClosure?.approvedFixtureInferencePlanDraftPr !== 1802) fail('missing #1802 source')
if (record.sourceClosure?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target mismatch')
if (record.plannedRuntimeShape?.runtime !== 'google_cloud_run_gpu') fail('runtime mismatch')
if (record.plannedRuntimeShape?.gpu !== 'nvidia_l4') fail('GPU mismatch')
if (record.plannedRuntimeShape?.minInstances !== 0) fail('min instances mismatch')
if (record.plannedRuntimeShape?.initialMaxInstances !== 1) fail('max instances mismatch')
if (record.plannedRuntimeShape?.cpuFallback !== false) fail('CPU fallback must be false')
if (record.requiredFutureApprovalGate?.confirmationGate !== 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true') fail('confirmation gate mismatch')
if (record.readiness?.qwenPersistedWorkerDispatchApprovedFixtureInferencePlan !== 'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_packet') fail('readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyPlanReview') {
    if (value !== true) fail('docsOnlyPlanReview must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const sourceImport = JSON.parse(read('docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/qwen-persisted-worker-dispatch-source-import-record.json'))
if (sourceImport.readiness?.qwenPersistedWorkerDispatchSourceImport !== 'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_plan') fail('source-import predecessor mismatch')
const qwenQa = JSON.parse(read('docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json'))
if (qwenQa.qa?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') fail('QWEN QA source mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen_persisted_worker_dispatch_approved_fixture_inference_plan_current_base_source_review')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1')
