#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-smoke-validation-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/smoke-evidence.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/controlled-smoke-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-smoke-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-access-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const followOnControlledPrivateInviteAccess1Files = [
  'docs/external-beta/controlled-private-invite-access-1/source-audit.md',
  'docs/external-beta/controlled-private-invite-access-1/invite-access-policy.md',
  'docs/external-beta/controlled-private-invite-access-1/iam-readback.md',
  'docs/external-beta/controlled-private-invite-access-1/safety-boundary.md',
  'docs/external-beta/controlled-private-invite-access-1/controlled-private-invite-access-record.json',
  'docs/external-beta/controlled-private-invite-access-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-private-invite-access-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1.md',
  'scripts/validation/rp-external-beta-controlled-private-invite-access-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_controlled_external_beta_authenticated_staging_smoke_validation',
  'completed_authenticated_health_readiness_source_status_smoke_only',
  'controlled_external_beta_smoke_validated_authenticated_staging_api',
  'reeditpro-staging-api',
  'us-central1',
  'reeditpro-staging-api-00005-7gs',
  '100_percent_latest_revision',
  'REEDITPRO_EXTERNAL_BETA_READY',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  'REEDITPRO_EXTERNAL_BETA_SCOPE',
  'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE',
  'wmyyttnynmteqgcdishd',
  'controlled_private_preview',
  'disable_REEDITPRO_EXTERNAL_BETA_READY',
  'unauthenticatedAccess',
  'blocked_403',
  'authenticated `/health`: `200`',
  'authenticated `/ready`: `200`',
  'authenticated `/api/runtime/status`: `200`',
  'runtime stayed `mock` / `mockOnly: true`',
  'providerRealCallsEnabled: false',
  'frontendSecretLeakCheck.ok: true',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
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
  /publicArtifactCreation:\s*`?true`?/i,
  /signedUrlCreation:\s*`?true`?/i,
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
  'requirements',
  '.env',
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

const record = JSON.parse(read(`${packetDir}/controlled-smoke-record.json`))
if (record.decision !== 'completed_controlled_external_beta_authenticated_staging_smoke_validation') fail('record decision mismatch')
if (record.execution !== 'completed_authenticated_health_readiness_source_status_smoke_only') fail('record execution mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('service mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.latestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('revision mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.requiredFlags?.REEDITPRO_EXTERNAL_BETA_READY !== 'true') fail('ready flag mismatch')
if (record.requiredFlags?.REEDITPRO_EXTERNAL_BETA_TARGET_REF !== 'wmyyttnynmteqgcdishd') fail('target flag mismatch')
if (record.requiredFlags?.REEDITPRO_EXTERNAL_BETA_SCOPE !== 'controlled_private_preview') fail('scope flag mismatch')
if (record.requiredFlags?.REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE !== 'disable_REEDITPRO_EXTERNAL_BETA_READY') fail('rollback flag mismatch')
if (record.cloudRunReadback?.readyCondition !== 'True') fail('Ready condition mismatch')
if (record.cloudRunReadback?.configurationsReadyCondition !== 'True') fail('ConfigurationsReady condition mismatch')
if (record.cloudRunReadback?.routesReadyCondition !== 'True') fail('RoutesReady condition mismatch')
if (record.httpSmoke?.unauthenticatedAccess !== 'blocked_403') fail('unauthenticated access mismatch')
if (record.httpSmoke?.health?.status !== 200 || record.httpSmoke?.health?.ok !== true) fail('health smoke mismatch')
if (record.httpSmoke?.readiness?.path !== '/ready' || record.httpSmoke?.readiness?.status !== 200) fail('readiness smoke mismatch')
if (record.httpSmoke?.runtimeStatus?.status !== 200 || record.httpSmoke?.runtimeStatus?.frontendSecretLeakCheckOk !== true) fail('runtime status smoke mismatch')
if (record.httpSmoke?.healthReadinessPath?.status !== 404) fail('/health/readiness compatibility readback mismatch')
if (record.readiness?.externalProductBeta !== 'controlled_external_beta_smoke_validated_authenticated_staging_api') fail('readiness mismatch')
if (record.readiness?.externalBetaEnabledInThisPhase !== true) fail('external beta enabled flag mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1') fail('next milestone mismatch')

for (const key of [
  'environmentMutationPerformed',
  'deploymentPerformed',
  'cloudRunServiceUpdated',
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
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaUnlock',
  'productionUnlock',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.safety?.cloudRunSourceStatusReadback !== true) fail('Cloud Run readback safety mismatch')
if (record.safety?.authenticatedHealthReadinessRouteExecution !== 'safe_get_health_ready_runtime_status_only') fail('route execution safety scope mismatch')
if (record.safety?.unauthenticatedAccessPublicOpen !== false) fail('unauthenticated public open flag mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
const rollupIsInviteAccessCompleted =
  rollup.decision === 'completed_controlled_private_invite_access_policy_no_access_mutation'
if (
  rollup.decision !== 'completed_controlled_external_beta_authenticated_staging_smoke_validation' &&
  !rollupIsInviteAccessCompleted
) {
  fail('rollup decision mismatch')
}
if (
  rollup.statuses?.externalProductBeta !== 'controlled_external_beta_smoke_validated_authenticated_staging_api' &&
  rollup.statuses?.externalProductBeta !== 'controlled_external_beta_private_invite_access_policy_ready'
) {
  fail('rollup external beta status mismatch')
}
if (rollup.sourceClosure?.controlledSmokeValidation !== 'rp_external_beta_controlled_smoke_validation_1') fail('rollup smoke source missing')
if (rollup.mainSupabaseTarget?.controlledSmokeValidation !== 'completed_controlled_external_beta_authenticated_staging_smoke_validation') fail('rollup smoke status mismatch')
if (rollup.mainSupabaseTarget?.unauthenticatedAccess !== 'blocked_403') fail('rollup unauthenticated access mismatch')
if (rollup.mainSupabaseTarget?.authenticatedHealth !== 'passed_200') fail('rollup health mismatch')
if (rollup.mainSupabaseTarget?.authenticatedReadiness !== 'passed_200_ready_endpoint') fail('rollup readiness mismatch')
if (rollup.mainSupabaseTarget?.providerRealCallsEnabled !== false) fail('rollup provider real call flag mismatch')
if (rollupIsInviteAccessCompleted) {
  if (rollup.sourceClosure?.controlledPrivateInviteAccess !== 'rp_external_beta_controlled_private_invite_access_1') fail('rollup invite source missing')
  if (rollup.mainSupabaseTarget?.controlledPrivateInviteAccess !== 'completed_controlled_private_invite_access_policy_no_access_mutation') fail('rollup invite status mismatch')
  if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1') fail('rollup next milestone mismatch')
} else if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1') {
  fail('rollup next milestone mismatch')
}
if (rollup.safety?.controlledSmokeValidation !== 'completed_authenticated_health_readiness_source_status_smoke_only') fail('rollup smoke safety mismatch')
if (rollup.safety?.unauthenticatedAccessPublicOpen !== false) fail('rollup unauthenticated public flag mismatch')
if (rollup.safety?.productionUnlock !== false) fail('rollup production unlock must remain false')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-smoke-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-smoke-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (
    !allowedExact.has(file) &&
    !allowedPrefixes.some((prefix) => file.startsWith(prefix)) &&
    !followOnControlledPrivateInviteAccess1Files.includes(file)
  ) {
    fail(`unexpected changed file: ${file}`)
  }
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
console.log('Decision: completed_controlled_external_beta_authenticated_staging_smoke_validation')
console.log('External beta readiness: controlled_external_beta_smoke_validated_authenticated_staging_api')
