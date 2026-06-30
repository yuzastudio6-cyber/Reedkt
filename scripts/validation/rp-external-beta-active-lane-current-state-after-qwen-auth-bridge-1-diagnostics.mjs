#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-AUTH-BRIDGE-1'
const dir = 'docs/external-beta/active-lane-current-state-after-qwen-auth-bridge-1'
const recordPath = `${dir}/active-lane-current-state-after-qwen-auth-bridge-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/current-state.md`,
  `${dir}/qwen-auth-bridge-closure.md`,
  `${dir}/side-stack-policy.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-source-import-1.md',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-native-api-auth-context-bridge-1/qwen-native-api-auth-context-bridge-1-record.json',
  'docs/external-beta/qwen-native-auth-bridge-staging-handoff-preflight-1/qwen-native-auth-bridge-staging-handoff-preflight-1-record.json',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json',
  'docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/controlled-single-tester-qwen-product-flow-runtime-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-record.json',
]

const requiredText = [
  packet,
  'completed_external_beta_active_single_tester_lane_current_state_after_qwen_auth_bridge_reconciliation',
  'completed_docs_only_active_lane_auth_bridge_reconciliation_no_runtime_execution',
  'd2a1baab07dd5d1b4e021e7e720210952f7480fc',
  '3618372ee2c16955d9d3b0d90df260488b2fd6e6',
  '#1795',
  'reeditpro-staging-api-00011-79q',
  '2026-06-30T08-14-05-042Z-ced056a2',
  'passed_202_backend_handoff_prepared',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'reeditpro-qwen2-5-vl-l4-worker-00037-658',
  'fail_closed',
  'QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false',
  'QWEN_INFERENCE_ENABLED=false',
  'fresh_source_import_required_no_blind_stack_merge',
  'none_without_actionable_single_tester_feedback_issue',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1',
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-SOURCE-IMPORT-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of [
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/transport-evidence-review.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/runtime-gates.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/safety-boundary.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-source-import-1/qwen-persisted-worker-dispatch-source-import-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs',
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

const forbiddenPacketPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Migration execution|Secret Manager payload access|Provider call|Model call|QWEN runtime execution in this phase|Service-role route execution in this phase|Route handler execution in this phase|Worker execution|Worker dispatch|Cloud Run invocation in this phase|Cloud Run deployment|Cloud Run service update|Cloud Run IAM mutation|Google Group membership mutation|Browser capture|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation creation|Stripe checkout\/webhook\/payment processing|External beta broad audience unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg execution|FFprobe execution|Docker execution|Package installation|Dependency mutation|Package-lock mutation|Side-stack merge)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
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
  /"cloudRunServiceUpdate"\s*:\s*true/i,
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

const packetCorpus = requiredFiles.map((file) => read(file)).join('\n')
const fullCorpus = [...requiredFiles, ...sourceFiles].map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!fullCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPacketPatterns) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const record = JSON.parse(read(recordPath))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_active_single_tester_lane_current_state_after_qwen_auth_bridge_reconciliation') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_active_lane_auth_bridge_reconciliation_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'd2a1baab07dd5d1b4e021e7e720210952f7480fc') fail('integration base mismatch')
if (record.sourceClosure?.qwenNativeApiAuthContextBridgePr !== 1791) fail('missing #1791 source')
if (record.sourceClosure?.qwenNativeAuthBridgeStagingHandoffPreflightPr !== 1795) fail('missing #1795 source')
if (record.sourceClosure?.qwenNativeAuthBridgeStagingHandoffPreflightMergeSha !== 'd2a1baab07dd5d1b4e021e7e720210952f7480fc') fail('#1795 merge SHA mismatch')
if (record.sourceClosure?.excludedRemotionPr !== '#577 open_draft_conflicting_dirty_excluded') fail('#577 exclusion mismatch')
if (record.activeLane?.targetName !== 'Reeditpro') fail('target name mismatch')
if (record.activeLane?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.activeLane?.approvedTesterEmail !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.activeLane?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('active lane mismatch')
if (record.activeLane?.qwenRouteAuthBlocker !== 'closed_by_native_auth_bridge_staging_handoff_preflight') fail('qwen auth blocker mismatch')
if (record.activeLane?.qwenRouteBackendHandoff !== 'passed_202_backend_handoff_prepared') fail('handoff status mismatch')
if (record.activeLane?.feedbackLoop !== 'ready_for_safe_runtime_issue_intake_after_auth_bridge') fail('feedback loop mismatch')
if (record.qwenWorker?.defaultInferencePosture !== 'fail_closed') fail('QWEN worker posture mismatch')
if (record.qwenWorker?.approvedFixtureInferenceEnabled !== false) fail('approved fixture inference gate must be false')
if (record.qwenWorker?.qwenInferenceEnabled !== false) fail('QWEN inference gate must be false')
if (record.sideStackPolicy?.qwenPersistenceOpenPrStack !== 'fresh_source_import_required_no_blind_stack_merge') fail('side-stack policy mismatch')
if (record.sideStackPolicy?.blindMergeApproved !== false) fail('blind merge must be false')
if (record.sideStackPolicy?.activeLaneBlockerFromSideStack !== 'none_without_actionable_single_tester_feedback_issue') fail('side-stack active lane blocker mismatch')
if (record.stillLocked?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester blocker mismatch')
if (record.readiness?.externalProductBeta !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('readiness mismatch')
if (!record.readiness?.nextMilestones?.includes('RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1')) fail('missing feedback issue next milestone')
if (!record.readiness?.nextMilestones?.includes('RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-SOURCE-IMPORT-1')) fail('missing QWEN source import next milestone')
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

const authBridge = JSON.parse(read('docs/external-beta/qwen-native-auth-bridge-staging-handoff-preflight-1/qwen-native-auth-bridge-staging-handoff-preflight-1-record.json'))
if (authBridge.decision !== 'completed_qwen_native_auth_bridge_staging_backend_handoff_preflight') fail('auth bridge source mismatch')
if (authBridge.preflight?.routeHttpStatus !== 202) fail('auth bridge route preflight did not pass')
if (authBridge.preflight?.backendHandoffPrepared !== true) fail('auth bridge handoff was not prepared')

const activeLane = JSON.parse(read('docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json'))
if (activeLane.activeLane?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('prior active lane source mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1-diagnostics.mjs'
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
console.log('Decision: completed_external_beta_active_single_tester_lane_current_state_after_qwen_auth_bridge_reconciliation')
console.log('Current lane: active_single_tester_external_beta_for_aiediting_reeditpro_com')
