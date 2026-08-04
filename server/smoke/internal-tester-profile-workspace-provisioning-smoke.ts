import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { User } from '@supabase/supabase-js'
import {
  inspectInternalTesterGoogleIdentity,
  internalTesterEmailHash,
  normalizeExpectedEmailHash,
  normalizeStagingSupabaseUrl,
} from '../auth/internal-tester-google-identity'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertMentions(path: string, phrases: string[]): void {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

const requiredFiles = [
  'server/auth/internal-tester-google-identity.ts',
  'server/cli/provision-internal-tester.ts',
  '.github/workflows/internal-tester-profile-workspace-provisioning.yml',
  'docs/internal-tester-profile-workspace-provisioning.md',
  'docs/internal-tester-profile-workspace-provisioning.json',
  'docs/auth-profile-workspace-bootstrap.md',
  'server/smoke/internal-tester-profile-workspace-provisioning-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:provision-tester'],
  'tsx server/cli/provision-internal-tester.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-profile-workspace-provisioning'],
  'tsx server/smoke/internal-tester-profile-workspace-provisioning-smoke.ts',
)

const now = Date.parse('2026-07-17T12:00:00.000Z')
const googleUser = {
  id: 'fixture-google-user',
  email: 'owner@example.com',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { provider: 'password' },
  identities: [{ provider: 'google' }],
  email_confirmed_at: '2026-07-17T11:00:00.000Z',
  last_sign_in_at: '2026-07-17T11:30:00.000Z',
} as unknown as User
assert.deepEqual(inspectInternalTesterGoogleIdentity(googleUser, now), {
  googleIdentityObserved: true,
  authEmailConfirmed: true,
  priorAuthSignInObserved: true,
  readyForProfileWorkspaceProvisioning: true,
})

const passwordOnlyUser = {
  ...googleUser,
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { provider: 'google' },
  identities: [{ provider: 'email' }],
} as unknown as User
assert.equal(inspectInternalTesterGoogleIdentity(passwordOnlyUser, now).readyForProfileWorkspaceProvisioning, false)
assert.equal(inspectInternalTesterGoogleIdentity({
  ...googleUser,
  email_confirmed_at: null,
} as unknown as User, now).readyForProfileWorkspaceProvisioning, false)
assert.equal(inspectInternalTesterGoogleIdentity({
  ...googleUser,
  last_sign_in_at: '2026-07-18T12:00:00.000Z',
} as unknown as User, now).readyForProfileWorkspaceProvisioning, false)
assert.equal(normalizeStagingSupabaseUrl('https://fixtureproject.supabase.co'), 'https://fixtureproject.supabase.co')
assert.equal(normalizeStagingSupabaseUrl('https://attacker.example'), undefined)
assert.equal(normalizeExpectedEmailHash(internalTesterEmailHash('owner@example.com')), internalTesterEmailHash('owner@example.com'))

assertMentions('server/cli/provision-internal-tester.ts', [
  'PROVISION_REEDITPRO_INTERNAL_TESTER',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES',
  'INTERNAL_TESTER_EXPECTED_EMAIL_HASH',
  'inspectInternalTesterGoogleIdentity',
  'resolveWorkspaceIdentityContract',
  'workspaceIdentityContract',
  'internal_tester_backend_profile_workspace_provisioning_blocked_google_session_not_observed',
  'googleIdentityObserved',
  'priorAuthSignInObserved',
  'profileIdHash',
  'workspaceIdHash',
  'membershipIdHash',
  "type ProfileIdentityColumn = 'user_id' | 'id'",
  'profiles',
  'workspaces',
  'workspace_members',
  'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback',
])

const cli = read('server/cli/provision-internal-tester.ts')
const legacyWorkspaceProbe = cli.indexOf("{ contract: 'legacy_user_profile' as const, select: 'id, owner_user_id' }")
const directWorkspaceProbe = cli.indexOf("{ contract: 'direct_auth_user' as const, select: 'id, owner_id' }")
assert.ok(legacyWorkspaceProbe >= 0 && legacyWorkspaceProbe < directWorkspaceProbe)
assert.match(cli, /async function findOwnedWorkspace\(/)
assert.match(cli, /\.eq\('workspace_id', workspace\.id\)[\s\S]*\.eq\('user_id', userId\)/)
assert.match(cli, /existing\.membership\?\.role === 'owner'/)
assert.doesNotMatch(cli, /inviteUserByEmail|INTERNAL_TESTER_INVITE_IF_MISSING|INTERNAL_TESTER_REDIRECT_TO/)
assert.doesNotMatch(cli, /INTERNAL_TESTER_PASSWORD|PASSWORD_INPUT|createUser\s*\([^)]*password|console\.log/i)
assert.doesNotMatch(cli, /VITE_SUPABASE|import\.meta\.env|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport/i)
assert.doesNotMatch(cli, /\buserId\?:|\bprofileId\?:|\bworkspaceId\?:|\bmembershipId\?:/)
assert.doesNotMatch(cli, /\.select\(['"]\*['"]\)/)
assert.ok(cli.includes('process.stdout.write(`${JSON.stringify(result, null, 2)}\\n`)'))
assert.match(cli, /redacted-jwt/)

const workflow = read('.github/workflows/internal-tester-profile-workspace-provisioning.yml')
for (const phrase of [
  'Internal Tester Google Profile Workspace Provisioning',
  'workflow_dispatch',
  'source_ref',
  'source_sha',
  'expected_email_hash',
  'codex/backend-workflow-pipeline-continuation',
  'environment: staging',
  'STAGING_INTERNAL_TESTER_EMAIL',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_SERVICE_ROLE_KEY',
  'npm run internal-testing:provision-tester',
] as const) assert.equal(workflow.includes(phrase), true, `Provisioning workflow should include ${phrase}`)
assert.match(workflow, /test "\$\{GITHUB_REF\}" = "refs\/heads\/\$\{SOURCE_REF\}"/)
assert.match(workflow, /test "\$\{GITHUB_SHA\}" = "\$\{SOURCE_SHA\}"/)
assert.doesNotMatch(workflow, /^\s+tester_email:/m)
assert.doesNotMatch(workflow, /invite_if_missing|redirect_to|INTERNAL_TESTER_PASSWORD|inviteUserByEmail/i)
assert.doesNotMatch(workflow, /\bVITE_|deploy-pages|docker build|apt-get|gcloud|worker:run|tools:check|smoke:prod-real|supabase db|supabase migration|createSignedUrl/i)
assert.doesNotMatch(workflow, /STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/i)

const tsxExecutable = join(root, 'node_modules', '.bin', 'tsx')
const cliPath = 'server/cli/provision-internal-tester.ts'
const cleanEnv = { ...process.env }
for (const key of [
  'REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_TESTER_EMAIL',
  'INTERNAL_TESTER_EXPECTED_EMAIL_HASH',
  'INTERNAL_TESTER_DISPLAY_NAME',
  'INTERNAL_TESTER_WORKSPACE_NAME',
]) delete cleanEnv[key]

const missingConfirmation = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: cleanEnv,
  encoding: 'utf8',
})
assert.equal(missingConfirmation.status, 1)
assert.equal(
  (JSON.parse(missingConfirmation.stdout) as Record<string, unknown>).decision,
  'internal_tester_backend_profile_workspace_provisioning_blocked_missing_confirmation',
)

const invalidOrigin = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...cleanEnv,
    REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING: 'PROVISION_REEDITPRO_INTERNAL_TESTER',
    REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES: 'true',
    SUPABASE_URL: 'https://attacker.example',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-secret-never-sent',
    INTERNAL_TESTER_EMAIL: 'owner@example.com',
    INTERNAL_TESTER_EXPECTED_EMAIL_HASH: internalTesterEmailHash('owner@example.com'),
  },
  encoding: 'utf8',
})
assert.equal(invalidOrigin.status, 1)
assert.equal(
  (JSON.parse(invalidOrigin.stdout) as Record<string, unknown>).decision,
  'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input',
)

const mismatchedEmailHash = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...cleanEnv,
    REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING: 'PROVISION_REEDITPRO_INTERNAL_TESTER',
    REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES: 'true',
    SUPABASE_URL: 'https://fixtureproject.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-secret-never-sent',
    INTERNAL_TESTER_EMAIL: 'owner@example.com',
    INTERNAL_TESTER_EXPECTED_EMAIL_HASH: '0'.repeat(16),
  },
  encoding: 'utf8',
})
assert.equal(mismatchedEmailHash.status, 1)
assert.equal(
  (JSON.parse(mismatchedEmailHash.stdout) as Record<string, unknown>).decision,
  'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input',
)

const doc = JSON.parse(read('docs/internal-tester-profile-workspace-provisioning.json')) as {
  decision?: string
  sourceRef?: string
  sourceShaRequiredAtDispatch?: boolean
  googleSessionRequiredBeforeWrites?: boolean
  authUserCreationOrInvitationAllowed?: boolean
  workspaceIdentityContractDetectedBeforeWrite?: boolean
  profileContractMustMatchWorkspaceOwnership?: boolean
  workspaceIdentityContractSelectionOrder?: string[]
  ownedWorkspaceRequired?: boolean
  ownerMembershipRequired?: boolean
  rawEmailAcceptedAsWorkflowInput?: boolean
  outputIdentifiersHashed?: boolean
  blockedScope?: Record<string, boolean>
  nextGate?: string
}
assert.equal(doc.decision, 'google_first_same_sha_profile_workspace_provisioning_source_ready_remote_staging_write_not_run')
assert.equal(doc.sourceRef, 'codex/backend-workflow-pipeline-continuation')
assert.equal(doc.sourceShaRequiredAtDispatch, true)
assert.equal(doc.googleSessionRequiredBeforeWrites, true)
assert.equal(doc.authUserCreationOrInvitationAllowed, false)
assert.equal(doc.workspaceIdentityContractDetectedBeforeWrite, true)
assert.equal(doc.profileContractMustMatchWorkspaceOwnership, true)
assert.deepEqual(doc.workspaceIdentityContractSelectionOrder, [
  'legacy_user_profile_when_owner_user_id_exists',
  'direct_auth_user_when_only_owner_id_exists',
])
assert.equal(doc.ownedWorkspaceRequired, true)
assert.equal(doc.ownerMembershipRequired, true)
assert.equal(doc.rawEmailAcceptedAsWorkflowInput, false)
assert.equal(doc.outputIdentifiersHashed, true)
assert.equal(doc.nextGate, 'SAME_SHA_GOOGLE_TESTER_AUTH_READBACK_THEN_OWNER_INTERACTIVE_GATEWAY_RETRY')
for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combinedDocs = [
  read('docs/internal-tester-profile-workspace-provisioning.md'),
  read('docs/internal-tester-profile-workspace-provisioning.json'),
  read('docs/auth-profile-workspace-bootstrap.md'),
].join('\n')
assert.doesNotMatch(combinedDocs, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]/i)
assert.doesNotMatch(combinedDocs, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-google-profile-workspace-provisioning',
  decision: doc.decision,
  checks: [
    'same_sha_protected_environment_workflow',
    'google_identity_confirmed_email_and_prior_auth_sign_in_required_before_writes',
    'auth_user_creation_invitation_and_password_absent',
    'email_and_persisted_identifiers_not_logged_raw',
    'profile_reads_use_minimal_projection',
    'profile_identity_contract_matches_deployed_workspace_ownership',
    'legacy_required_owner_column_takes_precedence_over_backfilled_owner_id',
    'tester_owned_workspace_and_owner_membership_required',
    'untrusted_supabase_origin_rejected_before_network',
    'mismatched_interactive_email_hash_rejected_before_network',
    'owned_workspace_reused_on_bounded_retry',
  ],
  nextGate: doc.nextGate,
}, null, 2))
