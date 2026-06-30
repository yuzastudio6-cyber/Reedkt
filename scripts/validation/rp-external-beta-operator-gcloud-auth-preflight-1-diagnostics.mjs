#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1'
const packetDir = 'docs/external-beta/operator-gcloud-auth-preflight-1'
const decision = 'completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation'
const execution = 'completed_docs_and_guarded_local_preflight_helper_no_runtime_invocation'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/preflight-contract.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/operator-gcloud-auth-preflight-record.json`,
  'docs/activation-phase-rp-external-beta-operator-gcloud-auth-preflight-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-operator-gcloud-auth-preflight-1.md',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1.mjs',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set(packetFiles)
const allowedQwenDryRun1rFiles = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/transport-readback.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-1r.md',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
]
for (const file of allowedQwenDryRun1rFiles) allowedChangedFiles.add(file)
const allowedSingleTesterQaRepairFiles = [
  'docs/activation-phase-rp-external-beta-single-tester-real-usage-qa-1-results.md',
  'docs/external-beta/single-tester-real-usage-qa-1/readiness-gate.md',
  'docs/external-beta/single-tester-real-usage-qa-1/real-usage-qa-evidence.md',
  'docs/external-beta/single-tester-real-usage-qa-1/safety-boundary.md',
  'docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json',
  'docs/external-beta/single-tester-real-usage-qa-1/source-audit.md',
  'docs/external-beta/single-tester-real-usage-qa-1/validation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
]
for (const file of allowedSingleTesterQaRepairFiles) allowedChangedFiles.add(file)

const requiredText = [
  packet,
  decision,
  execution,
  'daff6905af21d9623b14197a4c9a2d61eed47501',
  'aiediting@reeditpro.com',
  'reeditpro',
  'reeditpro-staging-api',
  'us-central1',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT',
  'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry',
  'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r',
  'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked',
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'request sent: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'runnerExecutedInValidation',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'identityTokenFetch',
  'requestSent',
  'qwen25VlExecution',
  'workerExecution',
  'workerDispatch',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'externalBetaBroadAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'mediaProcessing',
  'dockerExecution',
  'remotionExecution',
  'dependencyMutation',
  'packageLockMutation',
  'iamMutation',
  'groupMembershipMutation',
]

const forbiddenPatterns = [
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"runnerExecutedInValidation"\s*:\s*true/i,
  /"cloudRunInvocation"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"requestSent"\s*:\s*true/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile$/,
  /^requirements/i,
  /^\.env/,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/operator-gcloud-auth-preflight-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'daff6905af21d9623b14197a4c9a2d61eed47501') fail('integration base mismatch')
if (record.expectedContext?.account !== 'aiediting@reeditpro.com') fail('expected account mismatch')
if (record.expectedContext?.project !== 'reeditpro') fail('expected project mismatch')
if (record.expectedContext?.service !== 'reeditpro-staging-api') fail('expected service mismatch')
if (record.expectedContext?.region !== 'us-central1') fail('expected region mismatch')
if (record.sourceEvidence?.qwenAuthPathReadback !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') fail('QWEN auth source mismatch')
if (record.sourceEvidence?.qwenTransportDependencyPreflightCurrent !== 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked') fail('QWEN preflight source mismatch')
if (record.runner?.confirmationVar !== 'REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT') fail('confirmation var mismatch')
if (record.runner?.successDecision !== 'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry') fail('success decision mismatch')
if (record.runner?.tokenValuesPrinted !== false) fail('token print flag must be false')
if (record.runner?.tokenValuesPersistedInRepo !== false) fail('token persistence flag must be false')
if (record.readiness?.singleTesterRealUsageQa !== 'blocked_pending_gcloud_reauth_preflight_success') fail('single tester readiness mismatch')
if (record.readiness?.qwenRealDispatchRetry !== 'blocked_pending_gcloud_reauth_preflight_success') fail('QWEN retry readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.safety?.docsAndGuardedLocalPreflightHelperOnly !== true) fail('guarded helper safety flag must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const qwenPreflight = parseJson('docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json')
if (qwenPreflight.decision !== 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked') fail('QWEN preflight decision drift')
if (qwenPreflight.preflight?.blocker !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') fail('QWEN preflight blocker drift')

const packageJson = parseJson('package.json')
if (packageJson.scripts?.['rp-external-beta-operator-gcloud-auth-preflight-1'] !== 'node scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1.mjs') fail('missing runner package script')
if (packageJson.scripts?.['rp-external-beta-operator-gcloud-auth-preflight-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs') fail('missing diagnostics package script')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/ya29\.[A-Za-z0-9_-]+/.test(text)) fail(`Google OAuth token leaked in ${file}`)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
