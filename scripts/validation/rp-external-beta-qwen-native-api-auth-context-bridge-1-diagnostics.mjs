#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1'
const packetDir = 'docs/external-beta/qwen-native-api-auth-context-bridge-1'
const decision = 'completed_qwen_native_api_auth_context_bridge_ready_for_confirmed_route_handoff_runtime_fixture'
const execution = 'completed_verified_native_api_auth_context_source_bridge_no_provider_execution'
const sourceBase = 'c334097c061b05b9413b131883871f5c4f5fd649'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1-CONFIRMED-RUN'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/auth-context-bridge.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-native-api-auth-context-bridge-1-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-native-api-auth-context-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-provider-runtime-fixture-current-1-confirmed-after-auth-bridge.md',
  'src/server/server-router.ts',
  'server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-provider-runtime-fixture-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-native-api-auth-context-bridge-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-provider-runtime-fixture-current-1/qwen-provider-runtime-fixture-current-1-record.json',
  'docs/external-beta/qwen-staging-api-route-deployment-alignment-1/qwen-staging-api-route-deployment-alignment-1-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-native-api-auth-context-bridge-1.md',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
])

const requiredText = [
  packet,
  decision,
  execution,
  sourceBase,
  '#1787',
  '#577 remains open/draft/blocked/conflicting and excluded',
  'Authorization: Bearer <Supabase user JWT>',
  'createSupabasePublicClient(env).auth.getUser(token)',
  'publicClient.auth.getUser(token)',
  'REEDITPRO_CONFIRM_QWEN_NATIVE_API_AUTH_CONTEXT_LOCAL_VALIDATION=true',
  'blocked_missing_authorization_bearer_token',
  'blocked_supabase_public_auth_client_unavailable',
  'blocked_authorization_bearer_token_verification_failed',
  'The bridge does not accept arbitrary user headers as auth.',
  'Service-role secret usage: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPatterns = [
  /\bQWEN provider\/model execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run job execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bexternal beta unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"cloudRunServiceUpdate"\s*:\s*true/i,
  /"cloudRunJobExecution"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"privateUserMediaProcessing"\s*:\s*true/i,
  /"rawPromptExecution"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaUnlockAppliedToEnvironment"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^server\/routes\//,
  /^server\/workers\//,
  /^server\/services\/(?!qwen2-5-vl-external-beta-product-route-handler-source\.ts$)/,
  /(?:^|\/)(?:dist|node_modules)\//,
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

for (const file of [...requiredFiles, ...requiredExistingFiles]) read(file)

const corpus = [...requiredFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
const currentPacketCorpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(currentPacketCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-native-api-auth-context-bridge-1-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceBase !== sourceBase) fail('source base mismatch')
if (record.sourceEvidence?.nativeRouteHandoffBridgePr !== 1787) fail('missing #1787 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.route?.nativeServerRouterBridge !== 'src/server/server-router.ts') fail('native router bridge mismatch')
if (record.route?.failClosedByDefault !== true) fail('route must remain fail-closed by default')
if (record.route?.verifiedAuthContext !== 'implemented_source_verified_bearer_token_path') fail('auth context status mismatch')
if (record.route?.localValidationAuthContext !== 'explicit_test_only_env_gate') fail('local validation auth gate mismatch')
if (record.auth?.runtimeBearerTokenRequired !== true) fail('runtime bearer token must be required')
if (record.auth?.runtimeVerification !== 'supabase_public_auth_get_user') fail('auth runtime verification mismatch')
if (record.auth?.serviceRoleSecretAccess !== false) fail('service-role auth access must be false')
if (record.auth?.arbitraryUserHeaderAccepted !== false) fail('arbitrary user headers must be rejected')
if (record.auth?.cloudRunIamOuterGateOnly !== true) fail('Cloud Run IAM must remain outer gate only')
if (!Array.isArray(record.auth?.requiredPublicAuthEnv)) fail('missing public auth env list')
if (!record.auth.requiredPublicAuthEnv.includes('SUPABASE_URL')) fail('missing SUPABASE_URL public auth env')
if (!record.auth.requiredPublicAuthEnv.includes('SUPABASE_ANON_KEY')) fail('missing SUPABASE_ANON_KEY public auth env')
if (record.runtime?.qwenProviderModelExecution !== false) fail('provider runtime must be false')
if (record.runtime?.workerDispatch !== false) fail('worker dispatch must be false')
if (record.runtime?.cloudRunJobExecution !== false) fail('Cloud Run job execution must be false')
if (record.runtime?.supabaseMutation !== false) fail('Supabase mutation must be false')
if (record.runtime?.sqlExecution !== false) fail('SQL execution must be false')
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const safety = record.safety ?? {}
for (const [key, value] of Object.entries(safety)) {
  if (key === 'nativeApiAuthContextBridge') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const routeSource = read('src/server/server-router.ts')
for (const text of [
  'createSupabasePublicClient',
  "parseBearerToken(getHeaderValue(request, 'authorization'))",
  'publicClient.auth.getUser(token)',
  'REEDITPRO_CONFIRM_QWEN_NATIVE_API_AUTH_CONTEXT_LOCAL_VALIDATION',
  'blocked_missing_authorization_bearer_token',
  'blocked_supabase_public_auth_client_unavailable',
  'blocked_authorization_bearer_token_verification_failed',
  'handlerSource.buildBackendJobHandoff(routeInput)',
  'handlerSource.buildBlockedResult(routeInput)',
]) {
  if (!routeSource.includes(text)) fail(`native server router missing ${text}`)
}
if (/x-reeditpro-authenticated-user-ref|x-authenticated-user|x-goog-authenticated-user/i.test(routeSource)) {
  fail('native server router must not accept arbitrary user headers')
}
if (/execFileSync|spawnSync|gcloud|run jobs execute|identity token/i.test(routeSource)) {
  fail('native server router must not shell out or execute Cloud Run')
}

const smoke = read('server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts')
for (const text of [
  'blocked_missing_authorization_bearer_token',
  'REEDITPRO_CONFIRM_QWEN_NATIVE_API_AUTH_CONTEXT_LOCAL_VALIDATION',
  'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture',
  'assert.equal(readyWithValidationAuth.body.backendHandoff.handoffPrepared, true)',
  'assert.equal(readyWithValidationAuth.body.backendHandoff.providerRuntimeExecutedNow, false)',
  'assert.equal(readyWithValidationAuth.body.safety.providerCall, false)',
  'assert.equal(readyWithValidationAuth.body.safety.modelCall, false)',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-qwen-native-api-auth-context-bridge-1'] !==
  'tsx server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts'
) {
  fail('missing auth bridge smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-native-api-auth-context-bridge-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-native-api-auth-context-bridge-1-diagnostics.mjs'
) {
  fail('missing auth bridge diagnostics package script')
}

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (!fs.existsSync(file)) continue
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')

console.log(`${packet} diagnostics passed.`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
