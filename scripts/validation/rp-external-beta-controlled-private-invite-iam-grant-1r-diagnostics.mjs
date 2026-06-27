#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/iam-grant-result.md`,
  `${packetDir}/smoke-readback.md`,
  `${packetDir}/rollback-and-membership-plan.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/controlled-private-invite-iam-grant-1r-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-grant-1r-results.md',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1r-after-identity-list.md',
  'package.json',
]

const requiredText = [
  packet,
  'completed_controlled_private_invite_iam_grant_for_owner_managed_group',
  'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant',
  'ready_for_owner_managed_external_beta_tester_membership_addition',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'groups/0279ka651g62ifo',
  'cloudidentity.googleapis.com',
  'roles/run.invoker',
  'reeditpro-staging-api',
  'us-central1',
  'wmyyttnynmteqgcdishd',
  'Unauthenticated `/health`',
  '`403`',
  'Authenticated `/health`',
  '`200`',
  'Authenticated `/ready`',
  'Authenticated `/api/runtime/status`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
]

const forbiddenClaimPatterns = [
  /allUsers"?\s*:\s*true/i,
  /allAuthenticatedUsers"?\s*:\s*true/i,
  /domainWideGrant"?\s*:\s*true/i,
  /productionServiceIamMutation"?\s*:\s*true/i,
  /cloudRunServiceUpdate"?\s*:\s*true/i,
  /deployment"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /stripePaymentProcessing"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /privateMediaProcessing"?\s*:\s*true/i,
  /userMediaProcessing"?\s*:\s*true/i,
  /remotionExecution"?\s*:\s*true/i,
  /ffmpegExecution"?\s*:\s*true/i,
  /ffprobeExecution"?\s*:\s*true/i,
  /dockerExecution"?\s*:\s*true/i,
  /packageInstallation"?\s*:\s*true/i,
  /dependencyMutation"?\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/controlled-private-invite-iam-grant-1r-record.json`))
if (record.packet !== packet) fail('packet name mismatch')
if (record.decision !== 'completed_controlled_private_invite_iam_grant_for_owner_managed_group') fail('decision mismatch')
if (record.execution !== 'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant') fail('execution mismatch')
if (record.integrationBase !== '4ff3b917b9544ba04af0a73dfec3ec0c961b0b98') fail('integration base mismatch')
if (record.cloudIdentity?.apiEnablement !== 'completed') fail('Cloud Identity API enablement mismatch')
if (record.cloudIdentity?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.cloudIdentity?.groupResource !== 'groups/0279ka651g62ifo') fail('group resource mismatch')
if (!record.cloudIdentity?.groupLabels?.includes('cloudidentity.googleapis.com/groups.security')) fail('security group label missing')
if (record.iamGrant?.role !== 'roles/run.invoker') fail('IAM role mismatch')
if (record.iamGrant?.member !== 'group:external-beta-testers@reeditpro.com') fail('IAM member mismatch')
if (record.iamGrant?.scope !== 'staging_cloud_run_service_only') fail('IAM scope mismatch')
if (record.iamGrant?.serviceLevelBindingCount !== 1) fail('service-level binding count mismatch')
if (record.iamGrant?.serviceLevelAllUsersInvoker !== false) fail('allUsers invoker mismatch')
if (record.iamGrant?.serviceLevelAllAuthenticatedUsersInvoker !== false) fail('allAuthenticatedUsers invoker mismatch')
if (record.iamGrant?.productionServiceIamMutation !== false) fail('production service IAM mutation mismatch')
if (record.smoke?.unauthenticatedHealth !== 'blocked_403') fail('unauthenticated smoke mismatch')
if (record.smoke?.authenticatedHealth !== 'passed_200') fail('authenticated health mismatch')
if (record.smoke?.authenticatedReady !== 'passed_200') fail('authenticated ready mismatch')
if (record.smoke?.authenticatedRuntimeStatus !== 'passed_200') fail('authenticated runtime status mismatch')
if (record.smoke?.providerRealCallsEnabled !== false) fail('provider real calls flag mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_owner_managed_external_beta_tester_membership_addition') fail('external beta readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.safety?.cloudIdentityApiEnablement !== true) fail('Cloud Identity API safety flag mismatch')
if (record.safety?.cloudIdentityGroupCreation !== true) fail('group creation safety flag mismatch')
if (record.safety?.cloudRunIamPolicyMutation !== true) fail('IAM mutation safety flag mismatch')
if (record.safety?.cloudRunIamMutationScope !== 'roles/run.invoker_on_reeditpro-staging-api_for_group_external-beta-testers_only') fail('IAM mutation scope mismatch')
for (const key of [
  'allUsersGrant',
  'allAuthenticatedUsersGrant',
  'domainWideGrant',
  'productionServiceIamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'completed_owner_approved_tester_account_membership_smoke_external_beta_controlled_testing_ready') fail('rollup decision mismatch')
if (rollup.integrationHead !== '8295b650cb4f207c372e8724d76d7554b95702a6') fail('rollup integration head mismatch')
if (rollup.statuses?.externalProductBeta !== 'ready_for_owner_approved_controlled_external_beta_testing') fail('rollup external beta status mismatch')
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count mismatch')
if (rollup.sourceClosure?.controlledPrivateInviteIamGrant1r !== 'rp_external_beta_controlled_private_invite_iam_grant_1r_after_identity_list') fail('rollup source closure mismatch')
if (rollup.sourceClosure?.ownerMemberSmokeReadback !== 'rp_external_beta_owner_member_smoke_readback_1') fail('rollup owner-member source closure mismatch')
if (rollup.sourceClosure?.testerAccountMembershipSmoke !== 'rp_external_beta_tester_account_membership_smoke_1') fail('rollup tester-account source closure mismatch')
if (rollup.mainSupabaseTarget?.approvedGoogleGroup !== 'external-beta-testers@reeditpro.com') fail('rollup approved group mismatch')
if (rollup.mainSupabaseTarget?.cloudRunIamMutation !== true) fail('rollup IAM mutation mismatch')
if (rollup.mainSupabaseTarget?.cloudRunIamMutationScope !== 'roles/run.invoker_on_reeditpro-staging-api_for_group_external-beta-testers_only') fail('rollup IAM mutation scope mismatch')
if (rollup.mainSupabaseTarget?.cloudRunInviteGrantAllUsers !== false) fail('rollup allUsers grant mismatch')
if (rollup.mainSupabaseTarget?.cloudRunInviteGrantAllAuthenticatedUsers !== false) fail('rollup allAuthenticatedUsers grant mismatch')
if (rollup.mainSupabaseTarget?.ownerMemberSmokeReadback !== 'completed_owner_member_group_access_smoke_readback_carried_forward') fail('rollup owner-member smoke status mismatch')
if (rollup.mainSupabaseTarget?.ownerMemberSmokeExternalTesterMemberCount !== 0) fail('rollup external tester member count mismatch')
if (rollup.mainSupabaseTarget?.testerAccountMembershipSmoke !== 'completed_owner_approved_tester_account_membership_smoke') fail('rollup tester-account smoke status mismatch')
if (rollup.safety?.controlledPrivateInviteIamGrant1r !== 'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant') fail('rollup 1R safety mismatch')
if (rollup.safety?.cloudRunIamPolicyMutation !== true) fail('rollup IAM policy mutation safety mismatch')
if (rollup.safety?.ownerMemberSmokeReadback !== 'completed_readonly_group_membership_readback_and_owner_member_authenticated_smoke_carried_forward') fail('rollup owner-member smoke safety mismatch')
if (rollup.safety?.testerAccountMembershipSmoke !== 'completed_guarded_cloud_run_auth_readback_no_mutation') fail('rollup tester-account smoke safety mismatch')
if (rollup.safety?.groupMembershipMutation !== false) fail('rollup group membership mutation safety mismatch')
if (rollup.safety?.allUsersGrant !== false) fail('rollup allUsers safety mismatch')
if (rollup.safety?.allAuthenticatedUsersGrant !== false) fail('rollup allAuthenticatedUsers safety mismatch')
if (rollup.packageLock !== 'unchanged') fail('rollup package-lock mismatch')
if (rollup.generatedArtifactsCommitted !== 'none') fail('rollup generated artifact mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-grant-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1r-diagnostics.mjs'
) {
  fail('missing diagnostics script entry')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const safetyCorpus = requiredFiles.map((file) => read(file)).join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(safetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

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
console.log('Decision: completed_controlled_private_invite_iam_grant_for_owner_managed_group')
console.log('External beta readiness: ready_for_owner_managed_external_beta_tester_membership_addition')
