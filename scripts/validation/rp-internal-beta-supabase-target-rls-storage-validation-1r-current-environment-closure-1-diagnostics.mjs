#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CURRENT-ENVIRONMENT-CLOSURE-1'
const packetDir =
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/current-environment-closure.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/current-environment-closure-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1-results.md',
]

const touchedStatusFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-run.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const touchedDiagnosticsFiles = [
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...touchedStatusFiles, ...touchedDiagnosticsFiles])

const requiredText = [
  packet,
  'blocked_current_environment_missing_confirmed_supabase_validation_context',
  'completed_docs_only_current_environment_closure_no_remote_execution',
  'Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'Required confirmation: `REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`',
  'Observed confirmation: `absent_or_not_true`',
  'Approved access-token alias presence: `absent`',
  'Approved read-only DB URL alias presence: `absent`',
  'Current confirmation blocker: `blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation`',
  'Current credential blocker: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`',
  'Current validation status: `not_run_current_environment_incomplete`',
  'Remote Supabase command: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'SQL mutation: `false`',
  'Migration apply: `false`',
  'Storage bucket creation: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Service-role secret payload access: `false`',
  'Frontend service-role credential exposure: `false`',
  'Service-role route execution: `false`',
  'Internal beta unlock: `false`',
  'External beta unlock: `false`',
  'Production unlock: `false`',
  'Internal beta end-to-end status: `not_ready_pending_guarded_supabase_rls_storage_validation_and_runtime_implementation`',
  'Runtime readiness status: `blocked_pending_supabase_target_validation_and_runtime_enablement`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth.',
  'Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN`',
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
  /Worker dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Observed confirmation:\s*`?present_true/i,
  /Approved access-token alias presence:\s*`?present/i,
  /Approved read-only DB URL alias presence:\s*`?present/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'src/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  '.github/workflows/',
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

const packetCorpus = packetFiles.map(read).join('\n')
const docsCorpus = [...packetFiles, ...touchedStatusFiles].map(read).join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/current-environment-closure-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'blocked_current_environment_missing_confirmed_supabase_validation_context') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_environment_closure_no_remote_execution') fail('record execution mismatch')
if (record.baseIntegrationHead !== '0853509754d7539d1e3ec528e43a34011772435e') fail('base integration head mismatch')
if (record.supabaseTargetProject !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.observedConfirmation !== 'absent_or_not_true') fail('observed confirmation mismatch')
if (record.approvedAccessTokenAliasPresence !== 'absent') fail('access-token alias presence mismatch')
if (record.approvedReadonlyDbUrlAliasPresence !== 'absent') fail('read-only DB URL alias presence mismatch')
if (
  record.currentConfirmationBlocker !==
  'blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation'
) {
  fail('confirmation blocker mismatch')
}
if (
  record.currentCredentialBlocker !==
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
) {
  fail('credential blocker mismatch')
}
if (record.currentValidationStatus !== 'not_run_current_environment_incomplete') fail('validation status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN') {
  fail('next milestone mismatch')
}

for (const name of ['SUPABASE_ACCESS_TOKEN', 'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN', 'REEDITPRO_SUPABASE_ACCESS_TOKEN']) {
  if (!record.acceptedAccessTokenEnvNames?.includes(name)) fail(`missing accepted access-token alias ${name}`)
}
for (const name of [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
]) {
  if (!record.acceptedReadonlyDbUrlEnvNames?.includes(name)) fail(`missing accepted read-only DB URL alias ${name}`)
}

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
  'signedUrlCreation',
  'publicArtifactCreation',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'modelCall',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must be false`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'server/routes', 'server/workers', 'server/providers', 'docker', 'src', 'database', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    fail(`forbidden changed file ${file}`)
  }
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
