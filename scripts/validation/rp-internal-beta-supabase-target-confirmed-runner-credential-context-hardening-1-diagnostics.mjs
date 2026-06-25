#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-CONFIRMED-RUNNER-CREDENTIAL-CONTEXT-HARDENING-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1'
const confirmedDir = 'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/confirmed-runner-hardening.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/confirmed-runner-credential-context-hardening-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-results.md',
  `${confirmedDir}/source-audit.md`,
  `${confirmedDir}/confirmed-runner.md`,
  `${confirmedDir}/readiness-gate.md`,
  `${confirmedDir}/safety-boundary.md`,
  `${confirmedDir}/confirmed-runner-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-credential-context-integration-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_confirmed_runner_credential_context_hardening_fail_closed',
  'completed_local_runner_hardening_no_remote_execution',
  'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_no_remote_execution_missing_safe_credential_context',
  'Required credential context before remote command: `true`',
  'Commands executed by current run: `none`',
  'Credential presence: `supabaseAccessToken=false`, `readonlyDatabaseUrl=false`, `serviceRoleKey=false`, `databasePassword=false`',
  'Credential payloads printed: `false`',
  'Remote Supabase command: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'SQL mutation: `false`',
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
  'validation-report.json`, `2501` bytes, SHA-256 `eeb543b9d1e9fb8ac2aea4dd477305ee31815b296b0b7032ae4d7a2fe0670808',
  'artifact-manifest.json`, `974` bytes, SHA-256 `fc626af2fff4f52c0c50f126eafd485e56fffd8e1db1801c1a2f543e05897ec1',
  'No remote Supabase command, remote Supabase mutation, SQL execution, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, frontend service-role credential exposure, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
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
  /Storage bucket creation:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none|not_run)`?)/i,
  /Provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
  /Signed URLs created:\s*`?(true|completed|enabled|passed)/i,
  /Public artifacts created:\s*`?(true|completed|enabled|passed)/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'src/',
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

const packetCorpus = requiredFiles
  .filter((file) => file.startsWith(packetDir) || file === 'docs/activation-phase-rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-results.md')
  .map(read)
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (packetCorpus.match(pattern)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/confirmed-runner-credential-context-hardening-record.json`))
if (record.decision !== 'completed_confirmed_runner_credential_context_hardening_fail_closed') fail('record decision mismatch')
if (record.execution !== 'completed_local_runner_hardening_no_remote_execution') fail('record execution mismatch')
if (record.currentRunStatus !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('record current run status mismatch')
}
if (record.currentRunExecution !== 'blocked_no_remote_execution_missing_safe_credential_context') fail('record current run execution mismatch')
if (record.requiredCredentialContextBeforeRemoteCommand !== true) fail('credential context gate flag mismatch')
if (record.commandsExecutedByCurrentRun !== 0) fail('current run command count must be zero')
if (record.credentialPresence?.supabaseAccessToken !== false) fail('access token presence must be false')
if (record.credentialPresence?.readonlyDatabaseUrl !== false) fail('read-only DB URL presence must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of [
  'remoteSupabaseCommand',
  'remoteSupabaseMutation',
  'sqlExecution',
  'sqlMutation',
  'migrationApply',
  'storageBucketCreation',
  'storageObjectCreation',
  'storageObjectRead',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'serviceRoleRouteExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.packageLock !== 'unchanged') fail('package lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const confirmedRecord = JSON.parse(read(`${confirmedDir}/confirmed-runner-record.json`))
if (confirmedRecord.currentRunStatus !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('confirmed runner record status not hardened')
}
if (confirmedRecord.credentialContextRequiredBeforeRemoteCommand !== true) fail('confirmed runner record missing credential-context gate')

const runner = read('scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs')
for (const required of [
  'getCredentialContextDecision',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_missing_approved_supabase_access_token_alias',
  'blocked_missing_approved_supabase_readonly_db_url_alias',
  'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access',
  'credentialContextContractPacket',
]) {
  if (!runner.includes(required)) fail(`runner missing ${required}`)
}

const beforeCredentialGate = runner.slice(runner.indexOf('const credentialContextDecision'), runner.indexOf('let projects'))
if (!beforeCredentialGate.includes('finish(')) fail('runner must finish before remote command when credential context is incomplete')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-diagnostics.mjs') {
  fail('missing hardening diagnostics script')
}

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
