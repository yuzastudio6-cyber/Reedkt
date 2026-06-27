#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-enablement-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/flag-boundary.md`,
  `${packetDir}/rollback-boundary.md`,
  `${packetDir}/controlled-enablement-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-enablement-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/external-beta/staging-flag-application-1/source-audit.md',
  'docs/external-beta/staging-flag-application-1/flag-application-attempt.md',
  'docs/external-beta/staging-flag-application-1/staging-flag-application-record.json',
  'docs/external-beta/staging-flag-application-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-staging-flag-application-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-staging-flag-application-1-diagnostics.mjs',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
  'scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_controlled_external_beta_enablement_source_contract_default_off',
  'completed_source_contract_no_environment_mutation_or_deployment',
  'approved_external_beta_release_go_no_go_source_chain_accepted',
  'ready_for_explicit_staging_flag_application',
  'External beta enabled in this phase: `false`',
  'REEDITPRO_EXTERNAL_BETA_READY',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  'REEDITPRO_EXTERNAL_BETA_SCOPE',
  'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE',
  'wmyyttnynmteqgcdishd',
  'controlled_private_preview',
  'disable_REEDITPRO_EXTERNAL_BETA_READY',
  'enabled_controlled_external_beta_private_preview_only',
  'disabled_pending_explicit_external_beta_ready_flag',
  'blocked_target_ref_mismatch',
  'blocked_rollback_mode_missing',
  'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta enabled in this phase:\s*`?true`?/i,
  /externalBetaUnlockAppliedToEnvironment"?\s*:\s*true/i,
  /environmentMutationPerformed"?\s*:\s*true/i,
  /deploymentPerformed"?\s*:\s*true/i,
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

const allowedChanged = new Set(requiredFiles)
const allowedServerFiles = new Set([
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
])
const blockedPathPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
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

const record = JSON.parse(read(`${packetDir}/controlled-enablement-record.json`))
if (record.decision !== 'completed_controlled_external_beta_enablement_source_contract_default_off') fail('record decision mismatch')
if (record.execution !== 'completed_source_contract_no_environment_mutation_or_deployment') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target mismatch')
if (record.flagBoundary?.readyEnvName !== 'REEDITPRO_EXTERNAL_BETA_READY') fail('ready env mismatch')
if (record.flagBoundary?.requiredReadyValue !== 'true') fail('ready value mismatch')
if (record.flagBoundary?.targetRefEnvName !== 'REEDITPRO_EXTERNAL_BETA_TARGET_REF') fail('target env mismatch')
if (record.flagBoundary?.requiredTargetRef !== 'wmyyttnynmteqgcdishd') fail('target value mismatch')
if (record.flagBoundary?.scopeEnvName !== 'REEDITPRO_EXTERNAL_BETA_SCOPE') fail('scope env mismatch')
if (record.flagBoundary?.requiredScope !== 'controlled_private_preview') fail('scope value mismatch')
if (record.flagBoundary?.rollbackModeEnvName !== 'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE') fail('rollback env mismatch')
if (record.flagBoundary?.requiredRollbackMode !== 'disable_REEDITPRO_EXTERNAL_BETA_READY') fail('rollback value mismatch')
if (record.readiness?.externalBetaSourceContract !== 'ready_for_explicit_staging_flag_application') fail('source contract readiness mismatch')
if (record.readiness?.externalBetaEnabledInThisPhase !== false) fail('external beta enabled flag must remain false')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1') fail('next milestone mismatch')

for (const key of [
  'publicArtifactsAllowed',
  'signedUrlSourceOfTruthAllowed',
  'paidBillingAllowed',
  'finalDeliveryExportAllowed',
  'productionAllowed',
  'broadMediaAllowed',
]) {
  if (record.runtimeBoundary?.[key] !== false) fail(`runtime boundary must remain false: ${key}`)
}
for (const key of [
  'environmentMutationPerformed',
  'deploymentPerformed',
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
const rollupIsStagingBlocked =
  rollup.decision === 'blocked_gcloud_reauthentication_required_before_staging_flag_application'
if (
  rollup.decision !== 'completed_controlled_external_beta_enablement_source_contract_default_off' &&
  !rollupIsStagingBlocked
) {
  fail('rollup decision mismatch')
}
if (rollup.sourceClosure?.controlledEnablement !== 'rp_external_beta_controlled_enablement_1') fail('rollup controlled enablement source missing')
if (
  rollup.statuses?.externalProductBeta !== 'ready_for_explicit_staging_flag_application' &&
  rollup.statuses?.externalProductBeta !== 'blocked_pending_gcloud_reauthentication_before_staging_flag_application'
) {
  fail('rollup external beta readiness mismatch')
}
if (rollup.mainSupabaseTarget?.controlledEnablement !== 'completed_controlled_external_beta_enablement_source_contract_default_off') fail('rollup controlled enablement status mismatch')
if (rollup.mainSupabaseTarget?.externalBetaEnabledInThisPhase !== false) fail('rollup enabled phase flag mismatch')
if (rollup.mainSupabaseTarget?.stagingFlagApplicationRequired !== true) fail('staging flag application required flag mismatch')
if (
  rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1' &&
  rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH'
) {
  fail('rollup next decision mismatch')
}
if (rollupIsStagingBlocked) {
  if (rollup.sourceClosure?.stagingFlagApplication !== 'rp_external_beta_staging_flag_application_1') fail('staging flag source missing')
  if (rollup.mainSupabaseTarget?.stagingFlagApplicationBlocker !== 'gcloud_reauthentication_required_before_staging_flag_application') fail('staging flag blocker mismatch')
}
if (rollup.safety?.controlledExternalBetaEnablementSourceContract !== true) fail('rollup source contract flag mismatch')
if (rollup.safety?.externalBetaEnvironmentUnlock !== false) fail('rollup external beta environment unlock mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:external-beta-controlled-enablement-contract'] !==
  'tsx server/smoke/external-beta-controlled-enablement-contract-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-enablement-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPathPrefixes) {
    if ((file === blockedPath || file.startsWith(blockedPath)) && !allowedServerFiles.has(file)) {
      fail(`blocked path changed: ${file}`)
    }
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_controlled_external_beta_enablement_source_contract_default_off')
console.log('External beta source contract: ready_for_explicit_staging_flag_application')
console.log('External beta enabled in this phase: false')
