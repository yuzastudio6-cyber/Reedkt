#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1'
const packetDir = 'docs/external-beta/single-tester-feedback-driven-fix-loop-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/fix-loop.md`,
  `${packetDir}/runtime-stack-routing.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-feedback-driven-fix-loop-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-feedback-driven-fix-loop-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-stack-fresh-source-import-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'scripts/validation/rp-external-beta-single-tester-feedback-driven-fix-loop-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/single-tester-safe-gate-burndown-1/single-tester-safe-gate-burndown-record.json',
  'docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json',
  'docs/external-beta/single-tester-real-product-walkthrough-qa-1/single-tester-real-product-walkthrough-qa-record.json',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json',
]

const requiredText = [
  packet,
  'completed_single_tester_feedback_driven_fix_loop_ready_for_safe_runtime_issue_intake',
  'completed_docs_only_feedback_fix_loop_no_runtime_execution',
  'a7fc278d4cdbd0a1be340362681baa14dcc8640a',
  '#1417',
  '#1428',
  '#1430',
  '#1434',
  '#1445',
  '#1457',
  '#1461',
  '#1466',
  '#577',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'go_single_tester_only',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'no_new_actionable_single_tester_defect_source_in_this_packet',
  'fresh_source_import_required_no_blind_stack_merge',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-single-tester-safe-gate-burndown-1-diagnostics.mjs')
const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
]

const falseSafetyKeys = [
  'accessMutation',
  'additionalTesterAccessGrant',
  'groupMembershipMutation',
  'iamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'persistentCreditReservationCreation',
  'stripePaymentProcessing',
  'renderExecution',
  'mediaProcessing',
  'privateUserMediaProcessing',
  'qwenRuntimeExecution',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'externalBetaBroadAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalDeliveryExportUnlock',
  'packageLockMutation',
]

const forbiddenClaims = [
  /\badditional tester access approved:\s*`?true`?/i,
  /\bbroad external beta audience:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bpaid production(?: unlock)?:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bproduction unlock:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bfinal delivery\/export:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\b(public artifact creation|signed URL creation|provider call|model call|worker execution|worker dispatch|Supabase mutation|SQL execution|Secret Manager payload access|IAM mutation|Google Group membership mutation|Cloud Run service update|deployment|FFmpeg\/FFprobe execution|Docker execution):\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
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
for (const text of requiredText) if (!corpus.includes(text)) fail(`missing required text: ${text}`)

const record = JSON.parse(read(`${packetDir}/single-tester-feedback-driven-fix-loop-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_feedback_driven_fix_loop_ready_for_safe_runtime_issue_intake') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_feedback_fix_loop_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'a7fc278d4cdbd0a1be340362681baa14dcc8640a') fail('integration base mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentTester?.lane !== 'go_single_tester_only') fail('tester lane mismatch')
if (record.currentTester?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('tester status mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.sourceClosure?.singleTesterSafeGateBurndownPr !== 1466) fail('missing #1466 source')
if (record.sourceClosure?.singleTesterSafeGateBurndownMergeSha !== 'a7fc278d4cdbd0a1be340362681baa14dcc8640a') fail('missing #1466 merge SHA')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.feedbackLoop?.status !== 'ready_for_safe_runtime_issue_intake') fail('feedback loop status mismatch')
if (record.feedbackLoop?.feedbackIssueQueue !== 'no_new_actionable_single_tester_defect_source_in_this_packet') fail('feedback queue mismatch')
if (record.runtimeStackRouting?.qwenOpenStackDirectMergeApproved !== false) fail('direct QWEN stack merge must be false')
if (record.runtimeStackRouting?.qwenOpenStackBlindCherryPickApproved !== false) fail('blind QWEN cherry-pick must be false')
if (record.runtimeStackRouting?.qwenStackRoute !== 'fresh_source_import_required_no_blind_stack_merge') fail('QWEN stack route mismatch')
if (record.stillLocked?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester expansion lock mismatch')
for (const key of ['broadExternalBetaAudience', 'publicArtifacts', 'signedUrlSourceOfTruth', 'paidBilling', 'finalDeliveryExport', 'broadMedia', 'productionUnlock']) {
  if (record.stillLocked?.[key] !== 'blocked') fail(`locked gate mismatch: ${key}`)
}
if (record.readiness?.feedbackDrivenFixLoop !== 'ready_for_safe_runtime_issue_intake') fail('readiness mismatch')
if (!record.readiness?.nextMilestones?.includes('RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1')) fail('missing QWEN import milestone')
if (!record.readiness?.nextMilestones?.includes('RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1')) fail('missing feedback issue milestone')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyFixLoop !== true) fail('docsOnlyFixLoop must be true')
for (const key of falseSafetyKeys) if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const safeGate = JSON.parse(read('docs/external-beta/single-tester-safe-gate-burndown-1/single-tester-safe-gate-burndown-record.json'))
if (safeGate.readiness?.nextMilestone !== packet) fail('safe-gate source does not route to this packet')
const qwenStack = JSON.parse(read('docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json'))
if (qwenStack.integrationRisk?.freshSourceImportRequired !== true) fail('QWEN stack source does not require fresh import')
if (qwenStack.integrationRisk?.directStackMergeApproved !== false) fail('QWEN stack source unexpectedly approves direct merge')
if (qwenStack.integrationRisk?.blindCherryPickApproved !== false) fail('QWEN stack source unexpectedly approves blind cherry-pick')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-single-tester-feedback-driven-fix-loop-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-single-tester-feedback-driven-fix-loop-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]
for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_single_tester_feedback_driven_fix_loop_ready_for_safe_runtime_issue_intake')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1')
