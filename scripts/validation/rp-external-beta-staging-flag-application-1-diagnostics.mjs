#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/staging-flag-application-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/flag-application-attempt.md`,
  `${packetDir}/staging-flag-application-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-staging-flag-application-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1r-after-gcloud-reauth.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_gcloud_reauthentication_required_before_staging_flag_application',
  'completed_local_gcloud_auth_probe_no_environment_mutation',
  'blocked_pending_gcloud_reauthentication_before_staging_flag_application',
  'gcloud_reauthentication_required_before_staging_flag_application',
  'REEDITPRO_EXTERNAL_BETA_READY',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  'REEDITPRO_EXTERNAL_BETA_SCOPE',
  'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE',
  'wmyyttnynmteqgcdishd',
  'fajinbvwhcjnutkaumkm',
  'historical_sandbox_evidence_only_not_active',
  'External beta enabled in this phase: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta enabled in this phase:\s*`?true`?/i,
  /externalBetaUnlockAppliedToEnvironment"?\s*:\s*true/i,
  /environmentMutationPerformed"?\s*:\s*true/i,
  /deploymentPerformed"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /remotionExecution"?\s*:\s*true/i,
  /ffmpegExecution"?\s*:\s*true/i,
  /ffprobeExecution"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const allowedPrefixes = [
  'docs/',
  'scripts/validation/',
]
const allowedExact = new Set([
  'package.json',
])
const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  '.github/',
  '.dockerignore',
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
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
const blockerPacketSafetyCorpus = requiredFiles
  .filter(
    (file) =>
      !file.startsWith('docs/external-beta/current-readiness-rollup-1/') &&
      file !== 'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  )
  .map((file) => read(file))
  .join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(blockerPacketSafetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/staging-flag-application-record.json`))
if (record.decision !== 'blocked_gcloud_reauthentication_required_before_staging_flag_application') fail('record decision mismatch')
if (record.execution !== 'completed_local_gcloud_auth_probe_no_environment_mutation') fail('record execution mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.isolatedSandboxStatus !== 'historical_sandbox_evidence_only_not_active') fail('isolated sandbox status mismatch')
if (record.applicationAttempt?.accessTokenRefresh !== 'failed_reauthentication_required') fail('auth blocker mismatch')
if (record.applicationAttempt?.environmentMutation !== 'not_run') fail('environment mutation must be not_run')
if (record.readiness?.externalProductBeta !== 'blocked_pending_gcloud_reauthentication_before_staging_flag_application') fail('readiness mismatch')
if (record.readiness?.externalBetaEnabledInThisPhase !== false) fail('external beta enabled flag must remain false')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH') fail('next milestone mismatch')

for (const key of [
  'environmentMutationPerformed',
  'deploymentPerformed',
  'cloudRunServiceUpdated',
  'routeExecution',
  'workerExecution',
  'workerDispatch',
  'providerCall',
  'modelCall',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'mediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'internalBetaUnlock',
  'externalBetaUnlockAppliedToEnvironment',
  'productionUnlock',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
const rollupIsCompleted = rollup.decision === 'completed_controlled_external_beta_staging_flag_application'
if (
  rollup.decision !== 'blocked_gcloud_reauthentication_required_before_staging_flag_application' &&
  !rollupIsCompleted
) {
  fail('rollup decision mismatch')
}
if (rollup.sourceClosure?.stagingFlagApplication !== 'rp_external_beta_staging_flag_application_1') fail('rollup staging source missing')
if (
  rollup.statuses?.externalProductBeta !== 'blocked_pending_gcloud_reauthentication_before_staging_flag_application' &&
  rollup.statuses?.externalProductBeta !== 'controlled_external_beta_enabled_on_staging_api'
) {
  fail('rollup external beta status mismatch')
}
if (rollup.mainSupabaseTarget?.externalBetaEnabledInThisPhase !== rollupIsCompleted) fail('rollup enabled phase mismatch')
if (rollupIsCompleted) {
  if (rollup.sourceClosure?.stagingFlagApplication1r !== 'rp_external_beta_staging_flag_application_1r_after_gcloud_reauth') fail('rollup 1R source missing')
  if (rollup.mainSupabaseTarget?.stagingFlagApplication !== 'completed_controlled_external_beta_staging_flag_application') fail('rollup completed status mismatch')
  if (rollup.mainSupabaseTarget?.stagingFlagApplicationBlocker !== 'closed') fail('rollup blocker closure mismatch')
  if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1') fail('rollup next milestone mismatch')
} else {
  if (rollup.mainSupabaseTarget?.stagingFlagApplicationBlocker !== 'gcloud_reauthentication_required_before_staging_flag_application') fail('rollup blocker mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-staging-flag-application-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-staging-flag-application-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedExact.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix))) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  if (!file.startsWith('scripts/validation/') && /\bpostgres(?:ql)?:\/\/\S+/i.test(text)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_gcloud_reauthentication_required_before_staging_flag_application')
console.log('External beta enabled in this phase: false')
