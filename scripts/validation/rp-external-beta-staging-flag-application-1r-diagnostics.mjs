#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/flag-application-evidence.md`,
  `${packetDir}/rollback-boundary.md`,
  `${packetDir}/staging-flag-application-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-staging-flag-application-1r-after-gcloud-reauth-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-smoke-validation-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const requiredText = [
  packet,
  'completed_controlled_external_beta_staging_flag_application',
  'completed_gcloud_run_staging_api_env_flag_update',
  'controlled_external_beta_enabled_on_staging_api',
  'External beta enabled in this phase: `true`',
  'reeditpro-staging-api',
  'us-central1',
  'reeditpro-staging-api-00004-4lh',
  'reeditpro-staging-api-00005-7gs',
  '100_percent_latest_revision',
  'REEDITPRO_EXTERNAL_BETA_READY=true',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd',
  'REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview',
  'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY',
  'disable_REEDITPRO_EXTERNAL_BETA_READY',
  'RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /productionUnlock"?\s*:\s*true/i,
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
  /packageLockMutation"?\s*:\s*true/i,
]

const allowedPrefixes = ['docs/', 'scripts/validation/']
const allowedExact = new Set(['package.json'])
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
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/staging-flag-application-record.json`))
if (record.decision !== 'completed_controlled_external_beta_staging_flag_application') fail('record decision mismatch')
if (record.execution !== 'completed_gcloud_run_staging_api_env_flag_update') fail('record execution mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('service mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.latestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('revision mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.appliedFlags?.REEDITPRO_EXTERNAL_BETA_READY !== 'true') fail('ready flag mismatch')
if (record.appliedFlags?.REEDITPRO_EXTERNAL_BETA_TARGET_REF !== 'wmyyttnynmteqgcdishd') fail('target flag mismatch')
if (record.appliedFlags?.REEDITPRO_EXTERNAL_BETA_SCOPE !== 'controlled_private_preview') fail('scope flag mismatch')
if (record.appliedFlags?.REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE !== 'disable_REEDITPRO_EXTERNAL_BETA_READY') fail('rollback flag mismatch')
if (record.readback?.flagValuesVerified !== true) fail('flag readback mismatch')
if (record.readiness?.externalProductBeta !== 'controlled_external_beta_enabled_on_staging_api') fail('readiness mismatch')
if (record.readiness?.externalBetaEnabledInThisPhase !== true) fail('external beta enabled flag mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1') fail('next milestone mismatch')

for (const key of [
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
  'productionUnlock',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.safety?.environmentMutationPerformed !== true) fail('environment mutation must be recorded true')
if (record.safety?.deploymentPerformed !== true) fail('deployment must be recorded true')
if (record.safety?.cloudRunServiceUpdated !== true) fail('Cloud Run update must be recorded true')
if (record.safety?.externalBetaUnlockAppliedToEnvironment !== true) fail('controlled external beta unlock must be recorded true')
if (record.safety?.externalBetaUnlockScope !== 'controlled_staging_api_private_preview_only') fail('external beta unlock scope mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'completed_controlled_external_beta_staging_flag_application') fail('rollup decision mismatch')
if (rollup.statuses?.externalProductBeta !== 'controlled_external_beta_enabled_on_staging_api') fail('rollup external beta status mismatch')
if (rollup.sourceClosure?.stagingFlagApplication1r !== 'rp_external_beta_staging_flag_application_1r_after_gcloud_reauth') fail('rollup 1R source missing')
if (rollup.mainSupabaseTarget?.stagingFlagApplication !== 'completed_controlled_external_beta_staging_flag_application') fail('rollup staging status mismatch')
if (rollup.mainSupabaseTarget?.cloudRunLatestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('rollup revision mismatch')
if (rollup.mainSupabaseTarget?.externalBetaEnabledInThisPhase !== true) fail('rollup enabled phase flag mismatch')
if (rollup.safety?.externalBetaEnvironmentUnlock !== true) fail('rollup external beta environment unlock mismatch')
if (rollup.safety?.productionUnlock !== false) fail('rollup production unlock must remain false')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-staging-flag-application-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-staging-flag-application-1r-diagnostics.mjs'
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
console.log('Decision: completed_controlled_external_beta_staging_flag_application')
console.log('External beta readiness: controlled_external_beta_enabled_on_staging_api')
