#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-NATIVE-AUTH-BRIDGE-STAGING-HANDOFF-PREFLIGHT-1'
const packetDir = 'docs/external-beta/qwen-native-auth-bridge-staging-handoff-preflight-1'
const decision = 'completed_qwen_native_auth_bridge_staging_backend_handoff_preflight'
const execution = 'completed_staging_api_deploy_and_verified_auth_handoff_preflight_no_provider_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/deployment-readback.md`,
  `${packetDir}/runtime-preflight.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-native-auth-bridge-staging-handoff-preflight-1-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-provider-runtime-fixture-current-1-confirmed-after-staging-auth-handoff.md',
  'scripts/validation/rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-native-api-auth-context-bridge-1/qwen-native-api-auth-context-bridge-1-record.json',
  'docs/external-beta/qwen-provider-runtime-fixture-current-1/qwen-provider-runtime-fixture-current-1-record.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  decision,
  execution,
  '3618372ee2c16955d9d3b0d90df260488b2fd6e6',
  '#1791',
  '#577 remains open/draft/blocked/conflicting and excluded',
  '816bde52-c35f-481d-b31f-3ec0545d4938',
  'sha256:0085e10c6cfadaebeb390bc1738ffba0d35477aa38f8da130158ec9e964e1eb7',
  'reeditpro-staging-api-00011-79q',
  'X-Serverless-Authorization',
  'Authorization',
  '2026-06-30T08-14-05-042Z-ced056a2',
  '17ef496b7f5e67de6fed059e4b59675fc4741687795c8103bcca1139f2981c1e',
  'dbcb2055874587093d11499bd22191f6ec64d315ce0fa41536c864b6888e094e',
  'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /\bQWEN provider\/model execution in this phase:\s*`?true\b/i,
  /\bWorker dispatch in this phase:\s*`?true\b/i,
  /\bCloud Run job execution in this phase:\s*`?true\b/i,
  /\bSupabase mutation in this phase:\s*`?true\b/i,
  /\bSQL execution in this phase:\s*`?true\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"qwenProviderCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"cloudRunJobExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"tokenValuePrinted"\s*:\s*true/i,
  /"tokenValuePersistedInRepo"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const allowedTrueSafetyFlags = new Set([
  'cloudBuild',
  'cloudRunServiceUpdate',
  'secretIamMutation',
  'secretPayloadAccess',
  'supabaseAuthTokenRequest',
  'cloudRunIdentityTokenFetch',
  'cloudRunRouteInvocation',
])

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

const record = parseJson(`${packetDir}/qwen-native-auth-bridge-staging-handoff-preflight-1-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceEvidence?.authBridgePr !== 1791) fail('missing #1791 evidence')
if (record.sourceEvidence?.authBridgeMergeSha !== '3618372ee2c16955d9d3b0d90df260488b2fd6e6') fail('merge sha mismatch')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.cloudBuild?.id !== '816bde52-c35f-481d-b31f-3ec0545d4938') fail('Cloud Build id mismatch')
if (record.cloudBuild?.status !== 'SUCCESS') fail('Cloud Build status mismatch')
if (record.cloudBuild?.digest !== 'sha256:0085e10c6cfadaebeb390bc1738ffba0d35477aa38f8da130158ec9e964e1eb7') {
  fail('image digest mismatch')
}
if (record.cloudRun?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.cloudRun?.region !== 'us-central1') fail('region mismatch')
if (record.cloudRun?.latestReadyRevision !== 'reeditpro-staging-api-00011-79q') fail('revision mismatch')
if (record.cloudRun?.traffic !== '100_percent_reeditpro-staging-api-00011-79q') fail('traffic mismatch')
if (record.cloudRun?.supabasePublicAuthEnvConfigured !== true) fail('Supabase public env mismatch')
if (record.cloudRun?.qwenRouteGatesConfigured !== true) fail('QWEN gate config mismatch')
if (record.secretIam?.narrowGrantAdded !== true) fail('secret IAM grant status mismatch')
if (record.secretIam?.secret !== 'SUPABASE_ANON_KEY') fail('secret IAM secret mismatch')
if (record.preflight?.runId !== '2026-06-30T08-14-05-042Z-ced056a2') fail('preflight run id mismatch')
if (record.preflight?.supabaseAuthHttpStatus !== 200) fail('Supabase auth status mismatch')
if (record.preflight?.routeHttpStatus !== 202) fail('route HTTP status mismatch')
if (record.preflight?.backendHandoffPrepared !== true) fail('handoff prepared mismatch')
if (record.preflight?.providerRuntimeExecutedNow !== false) fail('provider runtime must remain false')
if (record.preflight?.providerModelCallAllowedNow !== false) fail('provider/model allowed flag must remain false')
if (record.preflight?.workerDispatchAllowedNow !== false) fail('worker dispatch allowed flag must remain false')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (allowedTrueSafetyFlags.has(key)) {
    if (value !== true) fail(`expected true safety flag: ${key}`)
    continue
  }
  if (value !== false) fail(`expected false safety flag: ${key}`)
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (/^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\//i.test(file)) {
    fail(`forbidden file changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (!fs.existsSync(file) || file.startsWith('scripts/validation/')) continue
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
console.log(`Revision: reeditpro-staging-api-00011-79q`)
