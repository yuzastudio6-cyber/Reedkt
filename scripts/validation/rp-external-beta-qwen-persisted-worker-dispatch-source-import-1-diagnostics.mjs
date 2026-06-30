#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-SOURCE-IMPORT-1'
const dir = 'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1'
const recordPath = `${dir}/qwen-persisted-worker-dispatch-source-import-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/transport-evidence-review.md`,
  `${dir}/runtime-gates.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-source-import-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/active-lane-current-state-after-qwen-auth-bridge-record.json',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json',
  'docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_persisted_worker_dispatch_transport_evidence_current_base_source_import_review',
  'completed_docs_only_qwen_persisted_worker_dispatch_source_import_no_runtime_execution',
  'f0b253996e4d0d0e5cd558584d883ea5d3582844',
  '#1794',
  '#1797',
  '#1798',
  '#577',
  'PR_1794_and_PR_1797_draft_stack_evidence_only',
  'reeditpro-qwen2-5-vl-private-caller-fwrgv',
  'qwen_inference_disabled_after_contract_check',
  'draftStackMergeApproved": false',
  'blindCherryPickApproved": false',
  'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_plan',
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN-1',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of [
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/inference-plan.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/approval-gates.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1/qwen-persisted-worker-dispatch-approved-fixture-inference-plan-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

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
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|QWEN inference|Worker execution|Worker dispatch|Route execution|Cloud Run invocation in this phase|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation|Deployment|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg\/FFprobe execution|Docker execution|Dependency mutation|Package-lock mutation|Draft stack merge|Blind cherry-pick)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"qwenInference"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
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
if (record.decision !== 'completed_qwen_persisted_worker_dispatch_transport_evidence_current_base_source_import_review') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_persisted_worker_dispatch_source_import_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'f0b253996e4d0d0e5cd558584d883ea5d3582844') fail('integration base mismatch')
if (record.sourceClosure?.transportAttemptResultDraftPr !== 1794) fail('missing #1794 source')
if (record.sourceClosure?.transportAttemptResultReviewDraftPr !== 1797) fail('missing #1797 source')
if (record.sourceClosure?.activeLaneAuthBridgeReconciliationPr !== 1798) fail('missing #1798 source')
if (record.sourceClosure?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target mismatch')
if (record.draftEvidence?.sourceClass !== 'PR_1794_and_PR_1797_draft_stack_evidence_only') fail('draft evidence class mismatch')
if (record.draftEvidence?.acceptedHttpStatus !== 403) fail('accepted HTTP status mismatch')
if (record.draftEvidence?.acceptedReason !== 'qwen_inference_disabled_after_contract_check') fail('accepted reason mismatch')
if (record.draftEvidence?.draftStackMergeApproved !== false) fail('draft stack merge must be false')
if (record.draftEvidence?.blindCherryPickApproved !== false) fail('blind cherry-pick must be false')
if (record.requiredFutureRuntimeGate?.confirmationGate !== 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true') fail('confirmation gate mismatch')
if (record.readiness?.qwenPersistedWorkerDispatchSourceImport !== 'ready_for_qwen_persisted_worker_dispatch_approved_fixture_inference_plan') fail('readiness mismatch')
if (record.readiness?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester blocker mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlySourceImportReview') {
    if (value !== true) fail('docsOnlySourceImportReview must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const activeLane = JSON.parse(read('docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/active-lane-current-state-after-qwen-auth-bridge-record.json'))
if (activeLane.decision !== 'completed_external_beta_active_single_tester_lane_current_state_after_qwen_auth_bridge_reconciliation') fail('active lane auth bridge source mismatch')
const qwenQa = JSON.parse(read('docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json'))
if (qwenQa.qa?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') fail('QWEN QA source mismatch')
const freshImport = JSON.parse(read('docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json'))
if (freshImport.diffReadback?.directStackMergeApproved !== false) fail('fresh import source unexpectedly approves direct merge')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-source-import-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen_persisted_worker_dispatch_transport_evidence_current_base_source_import_review')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN-1')
