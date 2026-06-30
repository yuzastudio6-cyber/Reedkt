#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1'
const packetDir = 'docs/external-beta/qwen-transport-dependency-preflight-current-1'
const decision = 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked'
const execution = 'completed_fail_closed_transport_dependency_preflight_no_runtime_invocation'
const blocker = 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/preflight-result.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-transport-dependency-preflight-current-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-transport-dependency-preflight-current-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1-smoke.ts',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/qwen-transport-dependency-enablement-current-import-record.json',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/source-audit.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/attempt-result-review.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/validation-results.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/qwen-transport-dependency-attempt-result-review-current-record.json',
  'docs/activation-phase-rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-transport-readiness-plan-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-diagnostics.mjs',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/source-audit.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/transport-readiness-plan.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/validation-results.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/qwen-transport-readiness-plan-current-record.json',
  'docs/activation-phase-rp-external-beta-qwen-transport-readiness-plan-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs',
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
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'docs/activation-phase-rp-external-beta-operator-gcloud-auth-preflight-1-results.md',
  'docs/external-beta/operator-gcloud-auth-preflight-1/source-audit.md',
  'docs/external-beta/operator-gcloud-auth-preflight-1/preflight-contract.md',
  'docs/external-beta/operator-gcloud-auth-preflight-1/safety-boundary.md',
  'docs/external-beta/operator-gcloud-auth-preflight-1/validation-results.md',
  'docs/external-beta/operator-gcloud-auth-preflight-1/operator-gcloud-auth-preflight-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-operator-gcloud-auth-preflight-1.md',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1.mjs',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '4875246604aecb8de69e9f44859f73981136db29',
  'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required',
  blocker,
  '#1736 open/draft/stale_stacked_on_1731_excluded',
  'Dependency contract complete: `true`',
  'Dependencies enabled now: `false`',
  'Ready for real worker dispatch: `false`',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'request sent: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH',
]

const falseSafetyKeys = [
  'fullDraftStackImport',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'qwen25VlExecution',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'serviceUrlResolvedNow',
  'audienceResolvedNow',
  'identityTokenFetch',
  'requestSent',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'generatedAssetCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'dockerExecution',
  'remotionExecution',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
]

const forbiddenPatterns = [
  /\bDependencies enabled now:\s*`?(true|enabled|completed|passed)\b/i,
  /\bReady for real worker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bbroad external beta:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /dependenciesEnabledNow"?\s*:\s*true/i,
  /readyForRealWorkerDispatch"?\s*:\s*true/i,
  /cloudRunInvocation"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
  /requestSent"?\s*:\s*true/i,
  /qwen25VlExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /dependencyMutation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild\//,
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

const record = parseJson(`${packetDir}/qwen-transport-dependency-preflight-current-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '4875246604aecb8de69e9f44859f73981136db29') fail('integration base mismatch')
if (record.preflight?.dependencyContractComplete !== true) fail('dependency contract must be complete')
if (record.preflight?.dependencySurfaceCount !== 10) fail('dependency count mismatch')
if (record.preflight?.injectedBoundaryCount !== 4) fail('injected boundary count mismatch')
if (record.preflight?.dependenciesEnabledNow !== false) fail('dependencies must not be enabled')
if (record.preflight?.readyForRealWorkerDispatch !== false) fail('dispatch must not be ready')
if (record.preflight?.blocker !== blocker) fail('blocker mismatch')
if (record.sourceEvidence?.staleDraftDuplicate !== '#1736 open/draft/stale_stacked_on_1731_excluded') {
  fail('stale duplicate exclusion mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (
  record.nextMilestone !==
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH'
) {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.safety?.preflightContractOnly !== true) fail('preflight-only safety flag must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const source = parseJson(
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/qwen-transport-dependency-enablement-current-import-record.json',
)
if (source.decision !== 'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required') {
  fail('source contract decision drift')
}
if (source.readiness?.transportDependencyFixture !== 'passed_contract_preflight_required') {
  fail('source contract fixture drift')
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1'
  ] !==
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-transport-dependency-preflight-current-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

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
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Blocker: ${blocker}`)
