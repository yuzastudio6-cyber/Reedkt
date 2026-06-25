#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUNNER'
const dir = 'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/confirmed-runner.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/confirmed-runner-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.md',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-runtime-config-contract-1-diagnostics.mjs',
  'package.json',
]

const allowedChanged = new Set([
  ...requiredFiles,
])

const requiredText = [
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED',
  'completed_guarded_confirmed_validation_runner_fail_closed_without_remote_execution',
  'completed_runner_scaffold_no_remote_execution',
  'Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'Required confirmation: `REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`',
  'Observed confirmation: `absent_or_not_true`',
  'Current run status: `not_run_confirmation_absent`',
  'Remote Supabase mutation: `false`',
  'SQL mutation: `false`',
  'Migration apply: `false`',
  'Storage bucket creation: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Service-role secret payload access: `false`',
  'Frontend service-role credential exposure: `false`',
  'Internal beta unlock: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED',
  'No remote Supabase mutation, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, frontend service-role credential exposure, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbidden = [
  /Internal beta unlock:\s*`?true/i,
  /External beta unlock:\s*`?true/i,
  /Production unlock:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL mutation:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Storage bucket creation:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none|not_run)`?)/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function extractSection(text, heading) {
  const marker = `## ${heading}`
  const start = text.indexOf(marker)
  if (start === -1) return ''
  const rest = text.slice(start + marker.length)
  const next = rest.search(/\n## |\n# /)
  return marker + (next === -1 ? rest : rest.slice(0, next))
}

for (const file of requiredFiles) read(file)

const corpus = [
  read(`${dir}/source-audit.md`),
  read(`${dir}/confirmed-runner.md`),
  read(`${dir}/readiness-gate.md`),
  read(`${dir}/safety-boundary.md`),
  read('docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md'),
  extractSection(read('implementation-status-and-next-phase.md'), 'RP-INTERNAL-BETA Supabase Target RLS Storage Validation 1R Confirmed Runner'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'RP-INTERNAL-BETA Supabase Target RLS Storage Validation 1R Confirmed Runner'),
].join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${dir}/confirmed-runner-record.json`))
if (record.decision !== 'completed_guarded_confirmed_validation_runner_fail_closed_without_remote_execution') fail('record decision mismatch')
if (record.execution !== 'completed_runner_scaffold_no_remote_execution') fail('record execution mismatch')
if (record.requiredConfirmation !== 'REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true') fail('record confirmation mismatch')
if (record.currentRunStatus !== 'not_run_confirmation_absent') fail('record run status mismatch')
if (record.supabaseTargetProject !== 'wmyyttnynmteqgcdishd') fail('record target mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of [
  'remoteSupabaseMutation',
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
  'providerModelCall',
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
if (packageJson.scripts?.['rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed'] !== 'node scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs') fail('missing runner package script')
if (packageJson.scripts?.['rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed:diagnostics'] !== 'node scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs') fail('missing diagnostics package script')

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
for (const blocked of ['supabase/migrations', 'supabase/functions', 'server/routes', 'server/workers', 'server/config', 'docker', 'src', 'database', '.dockerignore']) {
  execFileSync('git', ['diff', '--quiet', '--', blocked], { env: gitEnv, stdio: 'pipe' })
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file ${file}`)
  if (file === 'package-lock.json' || file.endsWith('.sql') || file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.zip')) {
    fail(`forbidden changed file ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
