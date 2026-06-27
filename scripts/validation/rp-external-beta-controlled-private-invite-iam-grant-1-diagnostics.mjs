#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-private-invite-iam-grant-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/iam-grant-blocker.md`,
  `${packetDir}/rollback-and-smoke-plan.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/controlled-private-invite-iam-grant-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-grant-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1r-after-identity-list.md',
  'docs/external-beta/controlled-private-invite-access-1/controlled-private-invite-access-record.json',
  'docs/external-beta/controlled-private-invite-access-1/invite-access-policy.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant',
  'completed_docs_only_iam_grant_blocker_review_no_access_mutation',
  'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant',
  'not_run_missing_explicit_identity_list',
  'not_present_in_source',
  'explicit_invited_identity_or_google_group_required',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST',
  'reeditpro-staging-api',
  'us-central1',
  'reeditpro',
  'wmyyttnynmteqgcdishd',
  'reeditpro-staging-api-00005-7gs',
  'controlled_private_preview',
  'completed_controlled_private_invite_access_policy_no_access_mutation',
  'completed_controlled_external_beta_authenticated_staging_smoke_validation',
  'blocked_403',
  'authenticated `/health`: `200`',
  'authenticated `/ready`: `200`',
  'authenticated `/api/runtime/status`: `200`',
  'service-level `allUsers` invoker binding: `false`',
  'service-level `allAuthenticatedUsers` invoker binding: `false`',
  'service-level Cloud Run IAM binding count: `0`',
  '`allUsers` grant: `false`',
  '`allAuthenticatedUsers` grant: `false`',
  'Cloud Run IAM mutation: `not_run`',
  'Cloud Run service update: `not_run`',
  'Deployment: `not_run`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
  'No Cloud Run IAM mutation, Cloud Run service update, deployment, invite grant',
]

const packetForbiddenPatterns = [
  /allUsers"?\s*:\s*true/i,
  /allAuthenticatedUsers"?\s*:\s*true/i,
  /publicInvokerGrant"?\s*:\s*true/i,
  /cloudRunIamMutation"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /deploymentPerformed"?\s*:\s*true/i,
  /inviteGrantMutation"?\s*:\s*true/i,
  /inviteEmailSending"?\s*:\s*true/i,
  /appUserCreation"?\s*:\s*true/i,
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
      file === 'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-grant-1-results.md' ||
      file === 'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1r-after-identity-list.md',
  )
  .map((file) => read(file))
  .join('\n')
for (const pattern of packetForbiddenPatterns) {
  if (pattern.test(packetSafetyCorpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-private-invite-iam-grant-record.json`))
if (record.decision !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_iam_grant_blocker_review_no_access_mutation') fail('record execution mismatch')
if (record.baseIntegrationHead !== 'ba739fa799e4f9fd57b64d94f2fbcf647acbeb85') fail('base integration head mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('service mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.project !== 'reeditpro') fail('project mismatch')
if (record.target?.supabaseProjectName !== 'Reeditpro') fail('Supabase project name mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target ref mismatch')
if (record.target?.supabaseTargetClass !== 'staging') fail('Supabase target class mismatch')
if (record.target?.latestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('revision mismatch')
if (record.sourceEvidence?.controlledPrivateInviteAccess !== 'completed_controlled_private_invite_access_policy_no_access_mutation') fail('prior invite source mismatch')
if (record.sourceEvidence?.unauthenticatedAccess !== 'blocked_403') fail('unauthenticated access mismatch')
if (record.sourceEvidence?.mockOnly !== true) fail('mock-only flag mismatch')
if (record.sourceEvidence?.providerRealCallsEnabled !== false) fail('provider real calls flag mismatch')
if (record.priorIamReadback?.serviceLevelBindingCount !== 0) fail('prior IAM binding count mismatch')
if (record.priorIamReadback?.serviceLevelAllUsersInvoker !== false) fail('prior allUsers invoker mismatch')
if (record.priorIamReadback?.serviceLevelAllAuthenticatedUsersInvoker !== false) fail('prior allAuthenticatedUsers invoker mismatch')
if (record.inviteGrantReview?.explicitInvitedIdentityList !== 'not_present_in_source') fail('explicit identity list mismatch')
if (record.inviteGrantReview?.approvedGoogleGroup !== 'not_present_in_source') fail('approved Google Group mismatch')
if (record.inviteGrantReview?.requiredInput !== 'explicit_invited_identity_or_google_group_required') fail('required input mismatch')
if (record.inviteGrantReview?.privateInviteIamGrant !== 'not_run_missing_explicit_identity_list') fail('private invite IAM grant mismatch')
if (record.inviteGrantReview?.cloudRunIamMutation !== 'not_run') fail('Cloud Run IAM mutation mismatch')
if (record.inviteGrantReview?.cloudRunServiceUpdate !== 'not_run') fail('Cloud Run service update mismatch')
if (record.inviteGrantReview?.deployment !== 'not_run') fail('deployment mismatch')
if (!record.inviteGrantReview?.blockedPrincipalClasses?.includes('allUsers')) fail('allUsers block missing')
if (!record.inviteGrantReview?.blockedPrincipalClasses?.includes('allAuthenticatedUsers')) fail('allAuthenticatedUsers block missing')
if (record.readiness?.externalProductBeta !== 'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant') fail('external beta readiness mismatch')
if (record.readiness?.privateInviteAccess !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant') fail('private invite readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')

for (const key of [
  'cloudRunIamPolicyReadback',
  'cloudRunServiceStatusReadback',
  'cloudRunIamMutation',
  'cloudRunServiceUpdated',
  'deploymentPerformed',
  'inviteGrantMutation',
  'inviteEmailSending',
  'appUserCreation',
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
  'externalBetaBroadAudienceUnlock',
  'productionUnlock',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (
  rollup.decision !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant' &&
  rollup.decision !== 'completed_readonly_project_iam_inheritance_audit_no_access_mutation'
) {
  fail('rollup decision mismatch')
}
if (
  rollup.integrationHead !== 'ba739fa799e4f9fd57b64d94f2fbcf647acbeb85' &&
  rollup.integrationHead !== 'c0788dd622a89b0070371bc0e5daa0bb03f62419'
) {
  fail('rollup integration head mismatch')
}
if (rollup.statuses?.externalProductBeta !== 'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant') fail('rollup external beta status mismatch')
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')
if (rollup.sourceClosure?.controlledPrivateInviteIamGrant !== 'rp_external_beta_controlled_private_invite_iam_grant_1') fail('rollup invite IAM source missing')
if (rollup.mainSupabaseTarget?.controlledPrivateInviteIamGrant !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant') fail('rollup invite IAM status mismatch')
if (rollup.mainSupabaseTarget?.privateInviteIamGrantExecution !== 'completed_docs_only_iam_grant_blocker_review_no_access_mutation') fail('rollup invite IAM execution mismatch')
if (rollup.mainSupabaseTarget?.privateInviteIamGrant !== 'not_run_missing_explicit_identity_list') fail('rollup invite IAM grant mismatch')
if (rollup.mainSupabaseTarget?.explicitInvitedIdentityList !== 'not_present_in_source') fail('rollup explicit identity mismatch')
if (rollup.mainSupabaseTarget?.approvedGoogleGroup !== 'not_present_in_source') fail('rollup approved group mismatch')
if (rollup.mainSupabaseTarget?.cloudRunIamMutation !== false) fail('rollup IAM mutation mismatch')
if (rollup.mainSupabaseTarget?.cloudRunServiceUpdate !== false) fail('rollup service update mismatch')
if (rollup.mainSupabaseTarget?.cloudRunInviteGrantAllUsers !== false) fail('rollup allUsers grant mismatch')
if (rollup.mainSupabaseTarget?.cloudRunInviteGrantAllAuthenticatedUsers !== false) fail('rollup allAuthenticatedUsers grant mismatch')
if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('rollup next milestone mismatch')
if (rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('rollup next owner decision mismatch')
if (rollup.safety?.controlledPrivateInviteIamGrant !== 'completed_docs_only_iam_grant_blocker_review_no_access_mutation') fail('rollup invite IAM safety mismatch')
if (rollup.safety?.cloudRunIamPolicyMutation !== false) fail('rollup IAM mutation safety mismatch')
if (rollup.safety?.inviteGrantMutation !== false) fail('rollup invite grant safety mismatch')
if (rollup.safety?.broadPublicInvokerGrant !== false) fail('rollup broad invoker safety mismatch')
if (rollup.safety?.allUsersGrant !== false) fail('rollup allUsers safety mismatch')
if (rollup.safety?.allAuthenticatedUsersGrant !== false) fail('rollup allAuthenticatedUsers safety mismatch')
if (rollup.safety?.explicitInviteIdentityListPresent !== false) fail('rollup explicit identity present safety mismatch')
if (rollup.packageLock !== 'unchanged') fail('rollup package-lock status mismatch')
if (rollup.generatedArtifactsCommitted !== 'none') fail('rollup generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-grant-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1-diagnostics.mjs'
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
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (!file.startsWith('scripts/validation/') && /\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant')
console.log('External beta readiness: blocked_pending_explicit_invite_identity_for_controlled_private_access_grant')
console.log('Private invite IAM grant: not_run_missing_explicit_identity_list')
