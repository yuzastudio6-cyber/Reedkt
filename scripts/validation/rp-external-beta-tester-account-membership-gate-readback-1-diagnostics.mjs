#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-GATE-READBACK-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/tester-account-membership-gate-readback-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/membership-readback.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/tester-account-membership-gate-readback-record.json`,
  'docs/activation-phase-rp-external-beta-tester-account-membership-gate-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke',
  'completed_readonly_tester_membership_gate_readback_no_access_mutation',
  'external-beta-testers@reeditpro.com',
  'groups/0279ka651g62ifo',
  'aiediting@reeditpro.com',
  'External tester member count: `0`',
  'Tester authentication context: `not_present`',
  'not_run_no_actual_external_tester_member',
  'ready_for_actual_external_tester_account_addition_and_smoke',
  'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1',
  'reeditpro-staging-api',
  'reeditpro-staging-api-00005-7gs',
  'group:external-beta-testers@reeditpro.com',
  'allUsers` grant: `false`',
  'allAuthenticatedUsers` grant: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No tester was added.',
  'No group membership was mutated.',
  'No Cloud Run IAM policy was changed.',
]

const allowedPrefixes = [
  'docs/external-beta/tester-account-membership-gate-readback-1/',
]

const allowedExact = new Set([
  'docs/activation-phase-rp-external-beta-tester-account-membership-gate-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'package.json',
  'scripts/validation/rp-external-beta-tester-account-membership-gate-readback-1-diagnostics.mjs',
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
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'packageInstallationBeyondDependencyValidation',
  'dependencyMutation',
  'packageLockMutation',
  'groupMembershipMutation',
  'cloudRunIamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'broadServiceRoleHandler',
]

const forbiddenClaims = [
  /\btester-authenticated smoke:\s*`?(passed|completed|true)\b/i,
  /\bactual external tester member count:\s*`?[1-9]\d*/i,
  /\bexternal tester member count:\s*`?[1-9]\d*/i,
  /\bgroup membership mutation:\s*`?(true|enabled|completed|performed)\b/i,
  /\bCloud Run IAM mutation:\s*`?(true|enabled|completed|performed)\b/i,
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bpackage installation beyond dependency validation:\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/tester-account-membership-gate-readback-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke') fail('decision mismatch')
if (record.execution !== 'completed_readonly_tester_membership_gate_readback_no_access_mutation') fail('execution mismatch')
if (record.integrationBase !== '4c7ad626f5c9385d44e09dbdeaa45e111a72bad0') fail('integration base mismatch')
if (record.sourceClosure?.ownerMemberSmokeReadback !== 'rp_external_beta_owner_member_smoke_readback_1') fail('owner member source mismatch')
if (record.sourceClosure?.privateInviteIamGrant1r !== 'rp_external_beta_controlled_private_invite_iam_grant_1r_after_identity_list') fail('IAM grant source mismatch')
if (record.groupMembership?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.groupMembership?.groupResource !== 'groups/0279ka651g62ifo') fail('group resource mismatch')
if (record.groupMembership?.memberCount !== 1) fail('group member count mismatch')
if (record.groupMembership?.ownerMemberCount !== 1) fail('owner-member count mismatch')
if (record.groupMembership?.externalTesterMemberCount !== 0) fail('external tester member count mismatch')
if (record.groupMembership?.membershipMutation !== false) fail('membership mutation mismatch')
if (record.cloudRun?.service !== 'reeditpro-staging-api') fail('Cloud Run service mismatch')
if (record.cloudRun?.region !== 'us-central1') fail('Cloud Run region mismatch')
if (record.cloudRun?.latestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('Cloud Run revision mismatch')
if (record.cloudRun?.iamMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member mismatch')
if (record.cloudRun?.serviceLevelBindingCount !== 1) fail('Cloud Run service binding count mismatch')
if (record.cloudRun?.allUsersGrant !== false) fail('Cloud Run allUsers grant mismatch')
if (record.cloudRun?.allAuthenticatedUsersGrant !== false) fail('Cloud Run allAuthenticatedUsers grant mismatch')
if (record.cloudRun?.directTesterUserGrant !== false) fail('direct tester user grant mismatch')
if (record.cloudRun?.iamMutation !== false) fail('Cloud Run IAM mutation mismatch')
if (record.cloudRun?.serviceUpdate !== false) fail('Cloud Run service update mismatch')
if (record.cloudRun?.deployment !== false) fail('deployment mismatch')
if (record.testerSmoke?.actualExternalTesterAccountMembership !== 'blocked_pending_actual_external_tester_account_membership') fail('tester membership blocker mismatch')
if (record.testerSmoke?.testerAuthenticationContext !== 'not_present') fail('tester auth context mismatch')
if (record.testerSmoke?.testerAuthenticatedSmoke !== 'not_run_no_actual_external_tester_member') fail('tester smoke mismatch')
if (record.testerSmoke?.ownerMemberSmokeIsNotTesterEvidence !== true) fail('owner-member non-inference mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_actual_external_tester_account_addition_and_smoke') fail('external beta readiness mismatch')
if (record.readiness?.testerAccountPath !== 'blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke') fail('tester account path mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1') fail('next milestone mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-tester-account-membership-gate-readback-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-tester-account-membership-gate-readback-1-diagnostics.mjs'
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
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke')
console.log('Execution: completed_readonly_tester_membership_gate_readback_no_access_mutation')
