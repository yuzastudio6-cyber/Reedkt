#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/tester-account-membership-smoke-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/tester-account-membership-smoke-record.json`,
  'docs/activation-phase-rp-external-beta-tester-account-membership-smoke-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_external_beta_tester_account_membership_and_authenticated_smoke',
  'completed_guarded_external_beta_tester_account_membership_and_authenticated_smoke',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE',
  'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL',
  'blocked_pending_external_beta_tester_account_smoke_confirmation',
  'blocked_missing_valid_external_tester_email',
  'blocked_pending_actual_external_tester_account_membership',
  'blocked_tester_auth_context_not_active',
  'completed_external_beta_tester_account_membership_and_authenticated_smoke',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'reeditpro-staging-api',
  'us-central1',
  'aiediting@reeditpro.com',
  'owner_approved_primary_real_tester_account',
  '2026-06-27T15-05-37-588Z-5b451f5c',
  'f6611d7c0ed9fb4693e44fa3ebade02d107ed539319cc7aebf63555bd12446ca',
  '35cb90ef7935109a9b1d90d9bd7bf2308e8f87a8b314e7ac21cdcfbe21dd2b40',
  'blocked_403',
  'passed_200',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedPrefixes = [
  'docs/external-beta/tester-account-membership-smoke-1/',
]

const allowedExact = new Set([
  'docs/activation-phase-rp-external-beta-tester-account-membership-smoke-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-tester-account-membership-smoke-1.md',
  'package.json',
  'scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs',
  'scripts/validation/rp-external-beta-tester-account-membership-smoke-1-diagnostics.mjs',
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
  /\bactual external tester member count:\s*`?[1-9]\d*/i,
  /\bgroup membership mutation:\s*`?(true|enabled|completed|performed)\b/i,
  /\bCloud Run IAM mutation:\s*`?(true|enabled|completed|performed)\b/i,
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/tester-account-membership-smoke-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.currentDecision !== 'completed_external_beta_tester_account_membership_and_authenticated_smoke') fail('current decision mismatch')
if (record.execution !== 'completed_guarded_external_beta_tester_account_membership_and_authenticated_smoke') fail('execution mismatch')
if (record.integrationBase !== '27308ae7d628028f3ce743c81e1e26d7450fb748') fail('integration base mismatch')
if (record.sourceClosure?.testerAccountMembershipGateReadback !== 'rp_external_beta_tester_account_membership_gate_readback_1') fail('gate readback source mismatch')
if (record.runner?.script !== 'scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs') fail('runner script mismatch')
if (record.runner?.packageScript !== 'rp-external-beta-tester-account-membership-smoke-1') fail('runner package script mismatch')
if (record.runner?.confirmationEnv !== 'REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE') fail('confirmation env mismatch')
if (record.runner?.testerEmailEnv !== 'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL') fail('tester email env mismatch')
if (record.runner?.futureSuccessDecision !== 'completed_external_beta_tester_account_membership_and_authenticated_smoke') fail('future success decision mismatch')
if (record.target?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.target?.groupResource !== 'groups/0279ka651g62ifo') fail('group resource mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('Cloud Run service mismatch')
if (record.target?.cloudRunRegion !== 'us-central1') fail('Cloud Run region mismatch')
if (record.target?.cloudRunIamMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member mismatch')
if (record.target?.approvedCurrentTesterEmail !== 'aiediting@reeditpro.com') fail('approved tester email mismatch')
if (record.target?.testerClassification !== 'owner_approved_primary_real_tester_account') fail('tester classification mismatch')
if (record.currentState?.confirmedSmokeExecution !== 'completed') fail('confirmed smoke current state mismatch')
if (record.currentState?.actualExternalTesterMemberPresent !== true) fail('tester member current state mismatch')
if (record.currentState?.testerAuthenticationContextPresent !== true) fail('tester auth current state mismatch')
if (record.currentState?.ownerMemberSmokeIsAcceptedByOwnerDecision !== true) fail('owner decision acceptance mismatch')
if (record.currentState?.unauthenticatedHealth !== 'blocked_403') fail('unauthenticated health mismatch')
if (record.currentState?.authenticatedHealth !== 'passed_200') fail('authenticated health mismatch')
if (record.currentState?.authenticatedReady !== 'passed_200') fail('authenticated ready mismatch')
if (record.currentState?.authenticatedRuntimeStatus !== 'passed_200') fail('authenticated runtime mismatch')
if (record.currentState?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.runEvidence?.runId !== '2026-06-27T15-05-37-588Z-5b451f5c') fail('run id mismatch')
if (record.runEvidence?.report?.bytes !== 2398) fail('report byte count mismatch')
if (record.runEvidence?.report?.sha256 !== 'f6611d7c0ed9fb4693e44fa3ebade02d107ed539319cc7aebf63555bd12446ca') fail('report checksum mismatch')
if (record.runEvidence?.manifest?.bytes !== 438) fail('manifest byte count mismatch')
if (record.runEvidence?.manifest?.sha256 !== '35cb90ef7935109a9b1d90d9bd7bf2308e8f87a8b314e7ac21cdcfbe21dd2b40') fail('manifest checksum mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_tester_account_smoke_confirmation',
  'blocked_missing_valid_external_tester_email',
  'blocked_pending_actual_external_tester_account_membership',
  'blocked_tester_auth_context_not_active',
  'allUsers',
  'allAuthenticatedUsers',
  'gcloud',
  'identity',
  'groups',
  'memberships',
  'run',
  'services',
  'get-iam-policy',
  'print-identity-token',
]) {
  if (!runnerSource.includes(text)) fail(`runner missing required guard/source: ${text}`)
}
for (const forbidden of [
  'memberships add',
  'add-iam-policy-binding',
  'remove-iam-policy-binding',
  'run deploy',
  'psql',
  'ffmpeg',
  'ffprobe',
  'docker',
]) {
  if (runnerSource.includes(forbidden)) fail(`runner contains forbidden command/source: ${forbidden}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-tester-account-membership-smoke-1'] !==
  'node scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-tester-account-membership-smoke-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-tester-account-membership-smoke-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
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
console.log('Current decision: completed_external_beta_tester_account_membership_and_authenticated_smoke')
console.log('Execution: completed_guarded_external_beta_tester_account_membership_and_authenticated_smoke')
