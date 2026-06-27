#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/owner-member-smoke-readback-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/smoke-readback.md`,
  `${packetDir}/membership-readback.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/owner-member-smoke-readback-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-owner-member-smoke-readback-1-results.md',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'package.json',
]

const requiredText = [
  packet,
  'completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending',
  'completed_readonly_group_membership_readback_and_owner_member_authenticated_smoke',
  'ready_for_actual_external_tester_account_addition_and_smoke',
  'external-beta-testers@reeditpro.com',
  'groups/0279ka651g62ifo',
  'aiediting@reeditpro.com',
  'external tester member count `0`',
  'Unauthenticated `/health`',
  '`403`',
  'Authenticated owner-member `/health`',
  '`200`',
  'Authenticated owner-member `/ready`',
  'Authenticated owner-member `/api/runtime/status`',
  'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedPrefixes = [
  'docs/external-beta/owner-member-smoke-readback-1/',
  'docs/external-beta/current-readiness-rollup-1/',
]
const allowedExact = new Set([
  'docs/activation-phase-rp-external-beta-owner-member-smoke-readback-1-results.md',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'package.json',
  'scripts/validation/rp-external-beta-tester-account-membership-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-owner-member-smoke-readback-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1r-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
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
  'requirements',
  '.env',
]

const falseSafetyKeys = [
  'groupMembershipMutation',
  'cloudRunIamPolicyMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'allUsersGrant',
  'allAuthenticatedUsersGrant',
  'domainWideGrant',
  'productionServiceIamMutation',
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

const record = JSON.parse(read(`${packetDir}/owner-member-smoke-readback-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending') fail('decision mismatch')
if (record.execution !== 'completed_readonly_group_membership_readback_and_owner_member_authenticated_smoke') fail('execution mismatch')
if (record.integrationBase !== '998cfd1367dade30800eb46988fe8aa5cdcce511') fail('integration base mismatch')
if (record.cloudRun?.service !== 'reeditpro-staging-api') fail('Cloud Run service mismatch')
if (record.cloudRun?.region !== 'us-central1') fail('Cloud Run region mismatch')
if (record.cloudRun?.iamMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member mismatch')
if (record.cloudRun?.serviceLevelBindingCount !== 1) fail('Cloud Run binding count mismatch')
if (record.cloudRun?.allUsersGrant !== false) fail('Cloud Run allUsers grant mismatch')
if (record.cloudRun?.allAuthenticatedUsersGrant !== false) fail('Cloud Run allAuthenticatedUsers grant mismatch')
if (record.groupMembership?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.groupMembership?.groupResource !== 'groups/0279ka651g62ifo') fail('group resource mismatch')
if (record.groupMembership?.memberCount !== 1) fail('group member count mismatch')
if (record.groupMembership?.ownerMemberCount !== 1) fail('owner member count mismatch')
if (record.groupMembership?.externalTesterMemberCount !== 0) fail('external tester member count mismatch')
if (record.groupMembership?.membershipMutation !== false) fail('membership mutation mismatch')
if (record.smoke?.activeAccount !== 'aiediting@reeditpro.com') fail('active account mismatch')
if (record.smoke?.unauthenticatedHealth !== 'blocked_403') fail('unauthenticated health mismatch')
if (record.smoke?.authenticatedOwnerMemberHealth !== 'passed_200') fail('authenticated health mismatch')
if (record.smoke?.authenticatedOwnerMemberReady !== 'passed_200') fail('authenticated ready mismatch')
if (record.smoke?.authenticatedOwnerMemberRuntimeStatus !== 'passed_200') fail('authenticated runtime mismatch')
if (record.smoke?.tokenRecorded !== false || record.smoke?.tokenPersisted !== false) fail('token safety mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_actual_external_tester_account_addition_and_smoke') fail('readiness mismatch')
if (record.readiness?.externalTesterPath !== 'blocked_pending_actual_external_tester_account_membership') fail('external tester path mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1') fail('next milestone mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'completed_owner_approved_tester_account_membership_smoke_external_beta_controlled_testing_ready') fail('rollup decision mismatch')
if (rollup.integrationHead !== '8295b650cb4f207c372e8724d76d7554b95702a6') fail('rollup integration head mismatch')
if (rollup.statuses?.externalProductBeta !== 'ready_for_owner_approved_controlled_external_beta_testing') fail('rollup external beta status mismatch')
if (rollup.sourceClosure?.ownerMemberSmokeReadback !== 'rp_external_beta_owner_member_smoke_readback_1') fail('rollup source closure missing')
if (rollup.sourceClosure?.testerAccountMembershipSmoke !== 'rp_external_beta_tester_account_membership_smoke_1') fail('rollup tester source closure missing')
if (rollup.mainSupabaseTarget?.ownerMemberSmokeExternalTesterMemberCount !== 0) fail('rollup external tester count mismatch')
if (rollup.mainSupabaseTarget?.ownerMemberSmokeAuthenticatedRuntimeStatus !== 'passed_200') fail('rollup owner-member runtime smoke mismatch')
if (rollup.mainSupabaseTarget?.actualExternalTesterAccountMembership !== 'completed_owner_approved_primary_tester_account_membership') fail('rollup tester status mismatch')
if (rollup.mainSupabaseTarget?.testerAccountMembershipSmoke !== 'completed_owner_approved_tester_account_membership_smoke') fail('rollup tester smoke mismatch')
if (rollup.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1') fail('rollup next milestone mismatch')
if (rollup.safety?.ownerMemberSmokeReadback !== 'completed_readonly_group_membership_readback_and_owner_member_authenticated_smoke_carried_forward') fail('rollup owner-member safety mismatch')
if (rollup.safety?.testerAccountMembershipSmoke !== 'completed_guarded_cloud_run_auth_readback_no_mutation') fail('rollup tester safety mismatch')
if (rollup.safety?.groupMembershipMutation !== false) fail('rollup group membership mutation mismatch')
if (rollup.packageLock !== 'unchanged') fail('rollup package-lock mismatch')
if (rollup.generatedArtifactsCommitted !== 'none') fail('rollup generated artifact mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-owner-member-smoke-readback-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-owner-member-smoke-readback-1-diagnostics.mjs'
) {
  fail('missing package script')
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
console.log('Decision: completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending')
console.log('External beta readiness: ready_for_actual_external_tester_account_addition_and_smoke')
