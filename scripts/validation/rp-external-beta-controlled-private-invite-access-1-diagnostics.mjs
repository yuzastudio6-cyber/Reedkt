#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-private-invite-access-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/invite-access-policy.md`,
  `${packetDir}/iam-readback.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/controlled-private-invite-access-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-private-invite-access-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const requiredText = [
  packet,
  'completed_controlled_private_invite_access_policy_no_access_mutation',
  'completed_docs_only_invite_access_policy_and_iam_readback_no_access_grants',
  'controlled_external_beta_private_invite_access_policy_ready',
  'ready_for_explicit_invite_iam_grant_planning',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1',
  'reeditpro-staging-api',
  'us-central1',
  'reeditpro-staging-api-00005-7gs',
  '100_percent_latest_revision',
  'wmyyttnynmteqgcdishd',
  'controlled_private_preview',
  'completed_controlled_external_beta_authenticated_staging_smoke_validation',
  'blocked_403',
  'authenticated `/health`: `200`',
  'authenticated `/ready`: `200`',
  'authenticated `/api/runtime/status`: `200`',
  'service-level binding count: `0`',
  'service-level `allUsers` invoker binding: `false`',
  'service-level `allAuthenticatedUsers` invoker binding: `false`',
  'Access grant mutation: `not_run`',
  'Cloud Run service update: `not_run`',
  'Deployment: `not_run`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /allUsers"?\s*:\s*true/i,
  /allAuthenticatedUsers"?\s*:\s*true/i,
  /publicInvokerGrant"?\s*:\s*true/i,
  /cloudRunIamMutation"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /deploymentPerformed"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
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
const packetSafetyCorpus = requiredFiles
  .filter(
    (file) =>
      file.startsWith(packetDir) ||
      file === 'docs/activation-phase-rp-external-beta-controlled-private-invite-access-1-results.md' ||
      file === 'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1.md',
  )
  .map((file) => read(file))
  .join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetSafetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-private-invite-access-record.json`))
if (record.decision !== 'completed_controlled_private_invite_access_policy_no_access_mutation') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_invite_access_policy_and_iam_readback_no_access_grants') fail('record execution mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('service mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.project !== 'reeditpro') fail('project mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.latestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('revision mismatch')
if (record.sourceEvidence?.unauthenticatedAccess !== 'blocked_403') fail('unauthenticated access mismatch')
if (record.sourceEvidence?.providerRealCallsEnabled !== false) fail('provider real call flag mismatch')
if (record.iamReadback?.serviceLevelBindingCount !== 0) fail('IAM binding count mismatch')
if (record.iamReadback?.serviceLevelAllUsersInvoker !== false) fail('allUsers invoker mismatch')
if (record.iamReadback?.serviceLevelAllAuthenticatedUsersInvoker !== false) fail('allAuthenticatedUsers invoker mismatch')
if (record.iamReadback?.iamPolicyMutation !== 'not_run') fail('IAM mutation mismatch')
if (record.iamReadback?.accessGrantMutation !== 'not_run') fail('access grant mutation mismatch')
if (record.invitePolicy?.accessModel !== 'authenticated_private_invite_only') fail('invite access model mismatch')
if (record.invitePolicy?.inviteIdentityList !== 'required_before_access_grant') fail('invite identity list mismatch')
if (!record.invitePolicy?.blockedPrincipalClasses?.includes('allUsers')) fail('allUsers block missing')
if (!record.invitePolicy?.blockedPrincipalClasses?.includes('allAuthenticatedUsers')) fail('allAuthenticatedUsers block missing')
if (record.readiness?.externalProductBeta !== 'controlled_external_beta_private_invite_access_policy_ready') fail('readiness mismatch')
if (record.readiness?.privateInviteAccess !== 'ready_for_explicit_invite_iam_grant_planning') fail('private invite readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')

for (const key of [
  'cloudRunIamMutation',
  'cloudRunServiceUpdated',
  'deploymentPerformed',
  'publicInvokerGrant',
  'allUsersGrant',
  'allAuthenticatedUsersGrant',
  'secretPayloadAccess',
  'supabaseMutation',
  'sqlExecution',
  'serviceRoleRouteExecution',
  'workerExecution',
  'workerDispatch',
  'providerCall',
  'modelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
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
if (record.safety?.cloudRunIamPolicyReadback !== true) fail('IAM readback safety mismatch')
if (record.safety?.cloudRunServiceStatusReadback !== true) fail('service status readback safety mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
const rollupInviteIamGrantBlocked =
  rollup.decision === 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant' ||
  rollup.decision === 'completed_readonly_project_iam_inheritance_audit_no_access_mutation'
if (
  rollup.decision !== 'completed_controlled_private_invite_access_policy_no_access_mutation' &&
  !rollupInviteIamGrantBlocked
) {
  fail('rollup decision mismatch')
}
if (
  rollup.statuses?.externalProductBeta !== 'controlled_external_beta_private_invite_access_policy_ready' &&
  rollup.statuses?.externalProductBeta !== 'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant'
) {
  fail('rollup external beta status mismatch')
}
if (rollup.sourceClosure?.controlledPrivateInviteAccess !== 'rp_external_beta_controlled_private_invite_access_1') fail('rollup invite source missing')
if (rollup.mainSupabaseTarget?.controlledPrivateInviteAccess !== 'completed_controlled_private_invite_access_policy_no_access_mutation') fail('rollup invite status mismatch')
if (rollup.mainSupabaseTarget?.cloudRunIamServiceLevelBindingCount !== 0) fail('rollup IAM binding count mismatch')
if (rollup.mainSupabaseTarget?.cloudRunAllUsersInvoker !== false) fail('rollup allUsers mismatch')
if (rollup.mainSupabaseTarget?.cloudRunAllAuthenticatedUsersInvoker !== false) fail('rollup allAuthenticatedUsers mismatch')
if (rollup.mainSupabaseTarget?.inviteAccessGrantMutation !== false) fail('rollup invite grant mutation mismatch')
if (
  rollup.mainSupabaseTarget?.privateInviteAccessReadiness !== 'ready_for_explicit_invite_iam_grant_planning' &&
  rollup.mainSupabaseTarget?.privateInviteAccessReadiness !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant'
) {
  fail('rollup invite readiness mismatch')
}
if (rollupInviteIamGrantBlocked) {
  if (rollup.sourceClosure?.controlledPrivateInviteIamGrant !== 'rp_external_beta_controlled_private_invite_iam_grant_1') fail('rollup invite IAM source missing')
  if (rollup.mainSupabaseTarget?.controlledPrivateInviteIamGrant !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant') fail('rollup invite IAM status mismatch')
  if (rollup.mainSupabaseTarget?.privateInviteIamGrant !== 'not_run_missing_explicit_identity_list') fail('rollup invite IAM grant mismatch')
  if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('rollup next milestone mismatch')
  if (rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('rollup required next decision mismatch')
} else {
  if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1') fail('rollup next milestone mismatch')
  if (rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1') fail('rollup required next decision mismatch')
}
if (rollup.safety?.controlledPrivateInviteAccess !== 'completed_docs_only_invite_access_policy_and_readonly_iam_readback') fail('rollup invite safety mismatch')
if (rollup.safety?.cloudRunIamPolicyReadback !== true) fail('rollup IAM readback safety mismatch')
if (rollup.safety?.cloudRunIamPolicyMutation !== false) fail('rollup IAM mutation safety mismatch')
if (rollup.safety?.inviteGrantMutation !== false) fail('rollup invite grant safety mismatch')
if (rollup.safety?.broadPublicInvokerGrant !== false) fail('rollup broad invoker safety mismatch')
if (rollup.safety?.productionUnlock !== false) fail('rollup production unlock must remain false')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-access-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-access-1-diagnostics.mjs'
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
console.log('Decision: completed_controlled_private_invite_access_policy_no_access_mutation')
console.log('External beta readiness: controlled_external_beta_private_invite_access_policy_ready')
