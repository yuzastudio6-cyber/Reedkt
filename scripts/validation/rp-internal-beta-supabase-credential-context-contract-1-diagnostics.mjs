#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-supabase-credential-context-contract-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/credential-context-contract.md`,
  `${packetDir}/alias-matrix.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/credential-context-contract-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-credential-context-contract-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/config/internal-beta-supabase-credential-context-contract.ts',
  'server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts',
  'scripts/validation/rp-internal-beta-supabase-credential-context-contract-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-1-results.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/runtime-readiness-credential-context-integration.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/component-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/runtime-readiness-credential-context-integration-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-readiness-credential-context-integration-1-results.md',
  'scripts/validation/rp-internal-beta-runtime-readiness-credential-context-integration-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_backend_safe_supabase_credential_context_contract_no_payload_access',
  'completed_server_config_contract_no_remote_execution',
  'Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'Contract module: `server/config/internal-beta-supabase-credential-context-contract.ts`',
  'Smoke: `npm run smoke:internal-beta-supabase-credential-context-contract`',
  'Approved access-token aliases: `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`, `REEDITPRO_SUPABASE_ACCESS_TOKEN`.',
  'Approved read-only DB URL aliases: `REEDITPRO_SUPABASE_READONLY_DB_URL`, `REEDITPRO_STAGING_SUPABASE_DB_URL`, `SUPABASE_STAGING_DB_URL`, `STAGING_SUPABASE_DB_URL`.',
  'Payload access: `forbidden`',
  'Credential payloads printed: `false`',
  'Credential payloads persisted: `false`',
  'Remote Supabase command: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'Migration apply: `false`',
  'Storage object read: `false`',
  'Service-role secret payload access: `false`',
  'Frontend service-role credential exposure: `false`',
  'Internal beta unlock: `false`',
  'External beta unlock: `false`',
  'Production unlock: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded as source-of-truth.',
  'Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN`',
  'No remote Supabase command, remote Supabase mutation, SQL execution, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, frontend service-role credential exposure, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Remote Supabase command:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL mutation:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /Credential payloads printed:\s*`?true/i,
  /Credential payloads persisted:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none|not_run)`?)/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Internal beta unlock:\s*`?true/i,
  /External beta unlock:\s*`?true/i,
  /Production unlock:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'src/',
  'server/routes/',
  'server/workers/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = requiredFiles
  .filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')
  .map(read)
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden docs claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/credential-context-contract-record.json`))
if (record.decision !== 'completed_backend_safe_supabase_credential_context_contract_no_payload_access') fail('record decision mismatch')
if (record.execution !== 'completed_server_config_contract_no_remote_execution') fail('record execution mismatch')
if (record.supabaseTargetProject !== 'wmyyttnynmteqgcdishd') fail('record target mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const name of ['SUPABASE_ACCESS_TOKEN', 'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN', 'REEDITPRO_SUPABASE_ACCESS_TOKEN']) {
  if (!record.acceptedAccessTokenEnvNames?.includes(name)) fail(`missing access-token alias ${name}`)
}
for (const name of [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
]) {
  if (!record.acceptedReadonlyDbUrlEnvNames?.includes(name)) fail(`missing read-only DB URL alias ${name}`)
}
if (record.acceptedReadonlyDbUrlEnvNames?.includes('REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL')) {
  fail('clean-staging DB URL alias must not be accepted by the active beta credential contract')
}
for (const key of [
  'remoteSupabaseCommand',
  'remoteSupabaseMutation',
  'sqlExecution',
  'sqlMutation',
  'migrationApply',
  'storageObjectRead',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'serviceRoleRouteExecution',
  'workerExecution',
  'providerModelCall',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const contract = read('server/config/internal-beta-supabase-credential-context-contract.ts')
for (const required of [
  'createInternalBetaSupabaseCredentialContextContract',
  'assertInternalBetaSupabaseCredentialContextFailClosed',
  'INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES',
  'INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES',
  'credentialValuesPersisted: false',
  'remoteSupabaseCommand: false',
]) {
  if (!contract.includes(required)) fail(`contract missing ${required}`)
}
for (const forbidden of ['createClient', '@supabase/', 'execFileSync', 'fetch(', 'SUPABASE_SERVICE_ROLE_KEY: string']) {
  if (contract.includes(forbidden)) fail(`contract includes forbidden runtime/client marker ${forbidden}`)
}

const smoke = read('server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts')
for (const required of [
  'secret_token_must_not_appear',
  'service_role_payload_must_not_appear',
  'JSON.stringify(complete).includes',
  'internal-beta-supabase-credential-context-contract-smoke passed',
]) {
  if (!smoke.includes(required)) fail(`smoke missing payload leak check ${required}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:internal-beta-supabase-credential-context-contract'] !== 'tsx server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts') fail('missing smoke package script')
if (packageJson.scripts?.['rp-internal-beta-supabase-credential-context-contract-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-supabase-credential-context-contract-1-diagnostics.mjs') fail('missing diagnostics package script')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'server/routes', 'server/workers', 'docker', 'src', 'database', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) fail(`forbidden changed file ${file}`)
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
