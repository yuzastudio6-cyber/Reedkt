#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CREDENTIAL-CONTEXT-HARDENING-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-record.json',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-safety-boundary.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-diagnostics.mjs',
  'package.json',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_rpc_4r_credential_context_hardening_fail_closed',
  'completed_local_runner_hardening_no_sql_execution',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_no_sql_execution_missing_safe_credential_context',
  'Run ID: `2026-06-26T00-31-22-194Z-015d2ec7`',
  'rpc-4r-confirmed-report.json',
  'e36bad819f1176287993aa69a685a6df899e71524a182ff766bdb16394737528',
  'rpc-4r-confirmed-manifest.json',
  '03b61b6d750c6050cb98b6e7627711989d31d10710527589dee5f83b86243a4a',
  'Required credential context before target validation and SQL: `true`',
  'Commands executed by current run: `none`',
  'Credential payloads printed: `false`',
  'Credential payloads persisted: `false`',
  'Remote Supabase command: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'SQL mutation: `false`',
  'Migration apply: `false`',
  'Storage object read: `false`',
  'Service-role secret payload access: `false`',
  'Frontend service-role credential exposure: `false`',
  'Service-role route execution: `false`',
  'Worker execution: `false`',
  'Worker dispatch: `false`',
  'Worker lease claim: `false`',
  'Internal beta unlock: `false`',
  'External beta unlock: `false`',
  'Production unlock: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta unlock:\s*`?true/i,
  /External beta unlock:\s*`?true/i,
  /Production unlock:\s*`?true/i,
  /Remote Supabase command:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL mutation:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Worker lease claim:\s*`?true/i,
  /Provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /completed_guarded_staging_sql_execution_readback_passed/i,
  /SQL execution passed/i,
  /migration deployment passed/i,
  /readback verification passed/i,
]

const secretLike = [
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /\bbearer\s+[A-Za-z0-9._-]{16,}/i,
  /\b(?:SUPABASE|SERVICE_ROLE|ANON|JWT|SECRET|TOKEN)[A-Z0-9_]*\s*=\s*['"]?[A-Za-z0-9._/-]{12,}/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/migrations/',
  'supabase/functions/',
  'server/routes/',
  'server/workers/',
  'server/config/',
  'docker/',
  'src/',
  'database/',
  '.github/workflows/',
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
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of requiredFiles) read(file)

const docsCorpus = [
  ...packetFiles,
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const packetCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-record.json'))
if (record.decision !== 'completed_rpc_4r_credential_context_hardening_fail_closed') fail('record decision mismatch')
if (record.execution !== 'completed_local_runner_hardening_no_sql_execution') fail('record execution mismatch')
if (record.requiredCredentialContextBeforeTargetValidationAndSql !== true) fail('credential context gate flag mismatch')
if (record.currentRunStatus !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('record current run status mismatch')
}
if (record.currentRunExecution !== 'blocked_no_sql_execution_missing_safe_credential_context') fail('record execution status mismatch')
if (record.currentRunId !== '2026-06-26T00-31-22-194Z-015d2ec7') fail('record run id mismatch')
if (
  record.currentRunOutputDir !==
  '/tmp/reeditpro-supabase-worker-runtime-transactional-rpc-4r-confirmed/2026-06-26T00-31-22-194Z-015d2ec7'
) {
  fail('record output dir mismatch')
}
if (!Array.isArray(record.currentRunArtifacts) || record.currentRunArtifacts.length !== 2) {
  fail('record current run artifact summary missing')
}
for (const artifact of record.currentRunArtifacts) {
  if (!['rpc-4r-confirmed-report.json', 'rpc-4r-confirmed-manifest.json'].includes(artifact.file)) {
    fail(`unexpected current run artifact: ${artifact.file}`)
  }
  if (artifact.file === 'rpc-4r-confirmed-report.json') {
    if (artifact.bytes !== 3488) fail('report byte count mismatch')
    if (artifact.sha256 !== 'e36bad819f1176287993aa69a685a6df899e71524a182ff766bdb16394737528') {
      fail('report checksum mismatch')
    }
  }
  if (artifact.file === 'rpc-4r-confirmed-manifest.json') {
    if (artifact.bytes !== 946) fail('manifest byte count mismatch')
    if (artifact.sha256 !== '03b61b6d750c6050cb98b6e7627711989d31d10710527589dee5f83b86243a4a') {
      fail('manifest checksum mismatch')
    }
  }
}
if (record.commandsExecutedByCurrentRun !== 0) fail('commands executed count must be 0')
if (record.credentialPresence?.supabaseAccessToken !== false) fail('access token presence must be false')
if (record.credentialPresence?.readonlyDatabaseUrl !== false) fail('read-only DB URL presence must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

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
  'workerDispatch',
  'workerLeaseClaim',
  'providerModelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const runner = read('scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs')
for (const required of [
  'credentialContextPacket',
  'approvedAccessTokenAliases',
  'approvedReadonlyDbUrlAliases',
  'credentialContextDecision',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_missing_approved_supabase_access_token_alias',
  'blocked_missing_approved_supabase_readonly_db_url_alias',
  'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access',
  'blocked_no_sql_execution_missing_safe_credential_context',
]) {
  if (!runner.includes(required)) fail(`runner missing credential hardening text: ${required}`)
}

const credentialGateIndex = runner.indexOf('const credentialDecision = credentialContextDecision()')
const targetValidationIndex = runner.indexOf('const targetValidation = readTargetValidationReport()')
if (credentialGateIndex === -1 || targetValidationIndex === -1 || credentialGateIndex > targetValidationIndex) {
  fail('credential context gate must occur before target validation readback')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r-credential-context-hardening-1:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-diagnostics.mjs'
) {
  fail('missing credential hardening diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of [
  'supabase/migrations',
  'supabase/functions',
  'server/routes',
  'server/workers',
  'server/config',
  'docker',
  'src',
  'database',
  '.github/workflows',
  '.dockerignore',
]) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    fail(`forbidden changed file: ${file}`)
  }
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.zip')) {
    fail(`generated/media artifact changed: ${file}`)
  }

  const text = read(file)
  for (const pattern of secretLike) {
    if (pattern.test(text)) fail(`secret-like value matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
