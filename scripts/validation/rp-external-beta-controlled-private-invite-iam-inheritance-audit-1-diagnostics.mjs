#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/project-iam-inheritance-audit.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/controlled-private-invite-iam-inheritance-audit-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1r-after-identity-list.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1/controlled-private-invite-iam-grant-record.json',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'package.json',
]

const requiredText = [
  packet,
  'completed_readonly_project_iam_inheritance_audit_no_access_mutation',
  'completed_readonly_project_iam_policy_analysis_no_iam_mutation',
  'completed_readonly_project_iam_inheritance_audit_no_broad_invoker',
  'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant',
  'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant',
  'not_run_missing_explicit_identity_list',
  'Project-level `roles/run.invoker` binding count: `1`',
  'Project-level `roles/run.invoker` member count: `1`',
  'Project-level `roles/run.invoker` member classes: `serviceAccount`',
  'Project-level `roles/run.invoker` user member count: `0`',
  'Project-level `roles/run.invoker` group member count: `0`',
  'Project-level `roles/run.invoker` domain member count: `0`',
  'Project-level `roles/run.invoker` `allUsers` member count: `0`',
  'Project-level `roles/run.invoker` `allAuthenticatedUsers` member count: `0`',
  'Broad inherited Cloud Run invoker access: `false`',
  'individual user emails were not recorded',
  'service account names were not recorded',
  'wmyyttnynmteqgcdishd',
  'reeditpro-staging-api',
  'us-central1',
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
      file === 'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-results.md',
  )
  .map((file) => read(file))
  .join('\n')
for (const pattern of packetForbiddenPatterns) {
  if (pattern.test(packetSafetyCorpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-private-invite-iam-inheritance-audit-record.json`))
if (record.decision !== 'completed_readonly_project_iam_inheritance_audit_no_access_mutation') fail('record decision mismatch')
if (record.execution !== 'completed_readonly_project_iam_policy_analysis_no_iam_mutation') fail('record execution mismatch')
if (record.baseIntegrationHead !== 'c0788dd622a89b0070371bc0e5daa0bb03f62419') fail('base integration head mismatch')
if (record.target?.project !== 'reeditpro') fail('project mismatch')
if (record.target?.cloudRunService !== 'reeditpro-staging-api') fail('service mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target ref mismatch')
if (record.sourceEvidence?.controlledPrivateInviteIamGrant !== 'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant') fail('prior invite IAM grant source mismatch')
if (record.priorServiceLevelIamReadback?.serviceLevelBindingCount !== 0) fail('service-level binding count mismatch')
if (record.priorServiceLevelIamReadback?.serviceLevelAllUsersInvoker !== false) fail('service-level allUsers mismatch')
if (record.priorServiceLevelIamReadback?.serviceLevelAllAuthenticatedUsersInvoker !== false) fail('service-level allAuthenticatedUsers mismatch')
if (record.projectIamReadback?.commandClass !== 'readonly_project_iam_policy_analysis') fail('project IAM command class mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerBindingCount !== 1) fail('project run.invoker binding count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerMemberCount !== 1) fail('project run.invoker member count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerMemberClasses?.join(',') !== 'serviceAccount') fail('project run.invoker class mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerUserMemberCount !== 0) fail('project run.invoker user count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerGroupMemberCount !== 0) fail('project run.invoker group count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerDomainMemberCount !== 0) fail('project run.invoker domain count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerAllUsersMemberCount !== 0) fail('project allUsers count mismatch')
if (record.projectIamReadback?.projectLevelRunInvokerAllAuthenticatedUsersMemberCount !== 0) fail('project allAuthenticatedUsers count mismatch')
if (record.projectIamReadback?.broadInheritedCloudRunInvokerAccess !== false) fail('broad inherited invoker mismatch')
if (record.projectIamReadback?.sanitizedPrincipalNamesRecorded !== false) fail('sanitization mismatch')
if (record.readiness?.externalProductBeta !== 'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant') fail('external beta readiness mismatch')
if (record.readiness?.projectIamInheritance !== 'completed_readonly_project_iam_inheritance_audit_no_broad_invoker') fail('project IAM inheritance readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')

for (const key of [
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
if (record.safety?.projectIamPolicyReadback !== true) fail('project IAM readback safety mismatch')
if (record.safety?.sanitizedOnly !== true) fail('sanitized-only safety mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (
  rollup.decision !== 'completed_readonly_project_iam_inheritance_audit_no_access_mutation' &&
  rollup.decision !== 'completed_controlled_private_invite_iam_grant_for_owner_managed_group'
) fail('rollup decision mismatch')
if (
  rollup.integrationHead !== 'c0788dd622a89b0070371bc0e5daa0bb03f62419' &&
  rollup.integrationHead !== '4ff3b917b9544ba04af0a73dfec3ec0c961b0b98'
) fail('rollup integration head mismatch')
if (rollup.sourceClosure?.controlledPrivateInviteIamInheritanceAudit !== 'rp_external_beta_controlled_private_invite_iam_inheritance_audit_1') fail('rollup audit source missing')
if (rollup.mainSupabaseTarget?.controlledPrivateInviteIamInheritanceAudit !== 'completed_readonly_project_iam_inheritance_audit_no_broad_invoker') fail('rollup audit status mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerBindingCount !== 1) fail('rollup project invoker binding count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerMemberCount !== 1) fail('rollup project invoker member count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerMemberClasses?.join(',') !== 'serviceAccount') fail('rollup project invoker member class mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerUserMemberCount !== 0) fail('rollup project invoker user count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerGroupMemberCount !== 0) fail('rollup project invoker group count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerDomainMemberCount !== 0) fail('rollup project invoker domain count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerAllUsersMemberCount !== 0) fail('rollup project allUsers count mismatch')
if (rollup.mainSupabaseTarget?.projectLevelRunInvokerAllAuthenticatedUsersMemberCount !== 0) fail('rollup project allAuthenticatedUsers count mismatch')
if (rollup.mainSupabaseTarget?.broadInheritedCloudRunInvokerAccess !== false) fail('rollup broad inherited invoker mismatch')
if (rollup.mainSupabaseTarget?.sanitizedProjectIamPrincipalNamesRecorded !== false) fail('rollup sanitization mismatch')
if (rollup.safety?.controlledPrivateInviteIamInheritanceAudit !== 'completed_readonly_project_iam_policy_analysis_no_iam_mutation') fail('rollup audit safety mismatch')
if (rollup.safety?.projectIamPolicyReadback !== true) fail('rollup project IAM readback safety mismatch')
if (rollup.safety?.projectIamPolicyMutation !== false) fail('rollup project IAM mutation mismatch')
if (rollup.safety?.projectLevelRunInvokerAllUsers !== false) fail('rollup project allUsers safety mismatch')
if (rollup.safety?.projectLevelRunInvokerAllAuthenticatedUsers !== false) fail('rollup project allAuthenticatedUsers safety mismatch')
if (rollup.safety?.broadInheritedCloudRunInvokerGrant !== false) fail('rollup broad inherited grant safety mismatch')
if (rollup.safety?.sanitizedProjectIamPrincipalNamesRecorded !== false) fail('rollup principal sanitization safety mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-inheritance-audit-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-diagnostics.mjs'
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
  const approvedGroupRedacted = text.replaceAll('group:external-beta-testers@reeditpro.com', '')
  if (/\b(?:user|group):[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i.test(approvedGroupRedacted)) fail(`principal email leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (!file.startsWith('scripts/validation/') && /\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_readonly_project_iam_inheritance_audit_no_access_mutation')
console.log('Broad inherited Cloud Run invoker access: false')
