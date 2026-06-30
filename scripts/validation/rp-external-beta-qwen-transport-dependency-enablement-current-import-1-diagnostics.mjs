#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1'
const packetDir = 'docs/external-beta/qwen-transport-dependency-enablement-current-import-1'
const decision = 'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required'
const execution = 'completed_fail_closed_transport_dependency_contract_no_runtime_invocation'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/transport-dependency-contract.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-transport-dependency-enablement-current-import-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-transport-dependency-enablement-current-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-transport-dependency-preflight-current-1.md',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1-smoke.ts',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json',
  'docs/external-beta/qwen-real-dispatch-preflight-1/qwen-real-dispatch-preflight-record.json',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '2a4fc2846f81feb099bde9c736b1e0bbd0460e69',
  'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import',
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_passed_runtime_invocation_still_blocked',
  'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt',
  'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r',
  'aiediting@reeditpro.com',
  'reeditpro',
  'reeditpro-staging-api',
  'us-central1',
  'service-role lease and claim dependency',
  'idempotency/runtime message dependency',
  'approved snapshot handoff dependency',
  'QWEN dispatch adapter dependency',
  'private invoke envelope dependency',
  'private invoke transport dependency',
  'response classification dependency',
  'QA/audit/cost/credit dependency',
  'cleanup/rollback dependency',
  'beta/production lock dependency',
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
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
  'PR #577 remains open/draft/blocked and excluded',
  'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1',
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
  'cloudRunServiceDiscoveryAfterTokenProbe',
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
  /\bservice URL resolved now:\s*`?(true|enabled|completed|passed)\b/i,
  /\baudience resolved now:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
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
  /serviceUrlResolvedNow"?\s*:\s*true/i,
  /audienceResolvedNow"?\s*:\s*true/i,
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

const record = parseJson(`${packetDir}/qwen-transport-dependency-enablement-current-import-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationHead !== '2a4fc2846f81feb099bde9c736b1e0bbd0460e69') fail('integration head mismatch')
if (record.targetRuntime?.account !== 'aiediting@reeditpro.com') fail('account mismatch')
if (record.targetRuntime?.project !== 'reeditpro') fail('project mismatch')
if (record.targetRuntime?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.targetRuntime?.region !== 'us-central1') fail('region mismatch')
if (record.readiness?.dependenciesEnabledNow !== false) fail('dependencies must not be enabled')
if (record.readiness?.readyForRealWorkerDispatch !== false) fail('real worker dispatch must not be ready')
if (record.readiness?.transportDependencyFixture !== 'passed_contract_preflight_required') {
  fail('transport dependency fixture status mismatch')
}
if (record.readiness?.qwenRealDispatchAuthPath !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') {
  fail('auth path blocker mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.safety?.transportDependencyContractOnly !== true) fail('contract-only safety flag must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

for (const dependency of [
  'serviceRoleLeaseAndClaimDependency',
  'idempotencyRuntimeMessageDependency',
  'approvedSnapshotHandoffDependency',
  'qwenDispatchAdapterDependency',
  'privateInvokeEnvelopeDependency',
  'privateInvokeTransportDependency',
  'responseClassificationDependency',
  'qaAuditCostCreditDependency',
  'cleanupRollbackDependency',
  'betaProductionLockDependency',
]) {
  if (record.transportDependencyContract?.[dependency] !== 'contract_recorded_enabled_false') {
    fail(`dependency contract mismatch: ${dependency}`)
  }
}

for (const boundary of ['resolveServiceUrl', 'resolveAudience', 'fetchIdentityToken', 'sendRequest']) {
  if (!record.futureInjectedBoundaries?.includes(boundary)) fail(`missing future boundary: ${boundary}`)
}

const freshImport = parseJson('docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json')
if (freshImport.decision !== 'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import') {
  fail('fresh import decision drift')
}
const preflight = parseJson('docs/external-beta/qwen-real-dispatch-preflight-1/qwen-real-dispatch-preflight-record.json')
if (
  preflight.nextMilestone !==
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_CONFIRMED_PREFLIGHT_1'
) {
  fail('preflight source drift')
}
const dryRun = parseJson('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json')
if (dryRun.decision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('dry-run decision drift')
}
const authReadback = parseJson('docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json')
if (authReadback.decision !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') {
  fail('auth readback decision drift')
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1'
  ] !==
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-transport-dependency-enablement-current-import-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs'
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
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1')
