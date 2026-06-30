#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-GATE-1'
const dir = 'docs/external-beta/active-lane-current-state-after-qwen-gate-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/current-state.md`,
  `${dir}/side-stack-policy.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  `${dir}/active-lane-current-state-record.json`,
  'docs/activation-phase-rp-external-beta-active-lane-current-state-after-qwen-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-feedback-driven-fix-loop-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-diagnostics.mjs',
  'package.json',
]

const authBridgeReconciliationFiles = [
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/source-audit.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/current-state.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/qwen-auth-bridge-closure.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/side-stack-policy.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/safety-boundary.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/validation-results.md',
  'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1/active-lane-current-state-after-qwen-auth-bridge-record.json',
  'docs/activation-phase-rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-source-import-1.md',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1-diagnostics.mjs',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/qwen-route-gate-1r-reconciliation-record.json',
  'docs/external-beta/single-tester-feedback-driven-fix-loop-1/single-tester-feedback-driven-fix-loop-record.json',
  'docs/external-beta/single-tester-safe-gate-burndown-1/single-tester-safe-gate-burndown-record.json',
  'docs/external-beta/named-invited-tester-walkthrough-1/named-invited-tester-walkthrough-record.json',
  'docs/external-beta/controlled-owner-go-no-go-1/controlled-owner-go-no-go-record.json',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/deployed-browser-ui-surface-1r-staging-deploy-record.json',
  'docs/external-beta/controlled-tester-product-flow-smoke-1/controlled-tester-product-flow-smoke-record.json',
]

const requiredText = [
  packet,
  'completed_external_beta_active_single_tester_lane_current_state_after_qwen_gate_reconciliation',
  'completed_docs_only_active_lane_current_state_reconciliation_no_runtime_execution',
  '7ea19bbc90f384dc01a65567b62e1bdddbf9efd2',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'controlled_private_preview',
  'satisfied_by_existing_qwen_route_readback_runtime_and_controlled_single_tester_qwen_product_flow_evidence',
  'ready_for_safe_runtime_issue_intake',
  'blocked_no_additional_named_tester_list',
  'fresh_source_import_required_no_blind_stack_merge',
  'none_without_actionable_single_tester_feedback_issue',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of authBridgeReconciliationFiles) allowedChangedFiles.add(file)
for (const file of [
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/source-audit.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/current-state.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/side-stack-policy.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/safety-boundary.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/validation-results.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json',
  'docs/activation-phase-rp-external-beta-active-lane-current-state-after-qwen-gate-1-results.md',
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

const forbiddenCorpusPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Migration execution|Secret Manager payload access|Provider call|Model call|QWEN runtime execution in this phase|Service-role route execution in this phase|Route handler execution in this phase|Worker execution|Worker dispatch|Cloud Run invocation in this phase|Cloud Run deployment|Cloud Run IAM mutation|Google Group membership mutation|Browser capture|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation creation|Stripe checkout\/webhook\/payment processing|External beta broad audience unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg execution|FFprobe execution|Docker execution|Package installation|Dependency mutation|Package-lock mutation|Side-stack merge)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"migrationExecution"\s*:\s*true/i,
  /"secretManagerPayloadAccess"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"qwenRuntimeExecutionInThisPhase"\s*:\s*true/i,
  /"serviceRoleRouteExecutionInThisPhase"\s*:\s*true/i,
  /"routeHandlerExecutionInThisPhase"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"cloudRunInvocationInThisPhase"\s*:\s*true/i,
  /"cloudRunDeployment"\s*:\s*true/i,
  /"cloudRunIamMutation"\s*:\s*true/i,
  /"googleGroupMembershipMutation"\s*:\s*true/i,
  /"externalBetaBroadAudienceUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"sideStackMerge"\s*:\s*true/i,
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

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
const packetCorpus = requiredFiles
  .filter((file) => file !== 'docs/production-beta-blocker-inventory.md')
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenCorpusPatterns) {
  if (pattern.test(packetCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${dir}/active-lane-current-state-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_active_single_tester_lane_current_state_after_qwen_gate_reconciliation') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_active_lane_current_state_reconciliation_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '7ea19bbc90f384dc01a65567b62e1bdddbf9efd2') fail('integration base mismatch')
if (record.sourceClosure?.qwenRouteGateReconciliationPr !== 1508) fail('missing #1508 source')
if (record.sourceClosure?.qwenRouteGateReconciliationMergeSha !== '7ea19bbc90f384dc01a65567b62e1bdddbf9efd2') fail('#1508 merge SHA mismatch')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.activeLane?.targetName !== 'Reeditpro') fail('target name mismatch')
if (record.activeLane?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.activeLane?.approvedTesterEmail !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.activeLane?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('active lane mismatch')
if (record.activeLane?.qwenRouteGateStatus !== 'satisfied_by_existing_qwen_route_readback_runtime_and_controlled_single_tester_qwen_product_flow_evidence') fail('qwen gate status mismatch')
if (record.activeLane?.feedbackLoop !== 'ready_for_safe_runtime_issue_intake') fail('feedback loop mismatch')
if (record.sideStackPolicy?.qwenPersistenceOpenPrStack !== 'fresh_source_import_required_no_blind_stack_merge') fail('side-stack policy mismatch')
if (record.sideStackPolicy?.blindMergeApproved !== false) fail('blind merge must be false')
if (record.sideStackPolicy?.activeLaneBlockerFromSideStack !== 'none_without_actionable_single_tester_feedback_issue') fail('side-stack active lane blocker mismatch')
if (record.stillLocked?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester blocker mismatch')
if (record.readiness?.externalProductBeta !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('readiness mismatch')
if (!record.readiness?.nextMilestones?.includes('RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1')) fail('missing feedback issue next milestone')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyReconciliation') {
    if (value !== true) fail('docsOnlyReconciliation must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const qwenGate = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/qwen-route-gate-1r-reconciliation-record.json'))
if (qwenGate.decision !== 'completed_post_1505_qwen_staging_service_role_route_gate_reconciliation') fail('qwen route gate reconciliation source mismatch')
if (qwenGate.reconciledStatus !== 'satisfied_by_existing_qwen_route_readback_runtime_and_controlled_single_tester_qwen_product_flow_evidence') fail('qwen route gate reconciled status mismatch')

const feedback = JSON.parse(read('docs/external-beta/single-tester-feedback-driven-fix-loop-1/single-tester-feedback-driven-fix-loop-record.json'))
if (feedback.feedbackLoop?.status !== 'ready_for_safe_runtime_issue_intake') fail('feedback loop source mismatch')
if (feedback.runtimeStackRouting?.qwenStackRoute !== 'fresh_source_import_required_no_blind_stack_merge') fail('feedback side-stack route mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-active-lane-current-state-after-qwen-gate-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-gate-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
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
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_active_single_tester_lane_current_state_after_qwen_gate_reconciliation')
console.log('Current lane: active_single_tester_external_beta_for_aiediting_reeditpro_com')
