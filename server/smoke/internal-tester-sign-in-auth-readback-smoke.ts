import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTesterEmailHash } from '../auth/internal-tester-google-identity'
import {
  INTERNAL_TESTER_WORKSPACE_MEMBERSHIP_SELECTS,
  resolveInternalTesterWorkspaceMembership,
} from '../auth/internal-tester-workspace-membership'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

for (const path of [
  'server/auth/internal-tester-google-identity.ts',
  'server/auth/internal-tester-workspace-membership.ts',
  'server/cli/verify-internal-tester-auth-readback.ts',
  '.github/workflows/internal-tester-sign-in-auth-readback.yml',
  'docs/internal-tester-sign-in-auth-readback.md',
  'docs/internal-tester-sign-in-auth-readback.json',
  'server/smoke/internal-tester-sign-in-auth-readback-smoke.ts',
] as const) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:verify-auth-readback'],
  'tsx server/cli/verify-internal-tester-auth-readback.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-sign-in-auth-readback'],
  'tsx server/smoke/internal-tester-sign-in-auth-readback-smoke.ts',
)

const cli = read('server/cli/verify-internal-tester-auth-readback.ts')
const legacyWorkspaceProbe = cli.indexOf("{ contract: 'legacy_user_profile' as const, select: 'id, owner_user_id' }")
const directWorkspaceProbe = cli.indexOf("{ contract: 'direct_auth_user' as const, select: 'id, owner_id' }")
assert.ok(legacyWorkspaceProbe >= 0 && legacyWorkspaceProbe < directWorkspaceProbe)
for (const phrase of [
  'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
  'INTERNAL_TESTER_EXPECTED_EMAIL_HASH',
  'inspectInternalTesterGoogleIdentity',
  'resolveWorkspaceIdentityContract',
  'workspaceIdentityContract',
  'internal_tester_sign_in_auth_readback_blocked_google_session_not_observed',
  'googleIdentityObserved',
  'priorAuthSignInObserved',
  'profileIdHash',
  'workspaceIdHash',
  'membershipIdHash',
  'membershipIdentityHash',
  'membershipIdentityContract',
  'profiles',
  'workspaces',
  'workspace_members',
  'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test',
  'findOwnedWorkspaceMembership',
] as const) assert.equal(cli.includes(phrase), true, `Readback CLI should include ${phrase}`)
assert.match(cli, /\.eq\(ownerColumn, userId\)/)
assert.match(cli, /\.eq\('workspace_id', workspace\.id\)[\s\S]*\.eq\('user_id', userId\)[\s\S]*\.eq\('role', 'owner'\)/)
assert.doesNotMatch(cli, /!membership\?\.id/)
assert.doesNotMatch(cli, /\n\s*\.(insert|upsert|update|delete|rpc)\s*\(/)
assert.doesNotMatch(cli, /inviteUserByEmail|createUser|INTERNAL_TESTER_PASSWORD|PASSWORD_INPUT|console\.log/i)
assert.doesNotMatch(cli, /VITE_SUPABASE|import\.meta\.env|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport/i)
assert.doesNotMatch(cli, /\buserId\?:|\bprofileId\?:|\bworkspaceId\?:|\bmembershipId\?:|authLastSignInAt/)
assert.doesNotMatch(cli, /\.select\(['"]\*['"]\)/)
assert.ok(cli.includes('process.stdout.write(`${JSON.stringify(result, null, 2)}\\n`)'))
assert.match(cli, /redacted-jwt/)

assert.deepEqual(INTERNAL_TESTER_WORKSPACE_MEMBERSHIP_SELECTS, [
  'id, workspace_id, user_id, role',
  'workspace_id, user_id, role',
])
const surrogateMembership = resolveInternalTesterWorkspaceMembership({
  row: {
    id: 'membership-owner-a',
    workspace_id: 'workspace-a',
    user_id: 'user-a',
    role: 'owner',
  },
  expectedWorkspaceId: 'workspace-a',
  expectedUserId: 'user-a',
})
assert.equal(surrogateMembership?.identityContract, 'surrogate_id')
assert.equal(surrogateMembership?.identityHash, surrogateMembership?.surrogateIdHash)

const compositeMembership = resolveInternalTesterWorkspaceMembership({
  row: {
    workspace_id: 'workspace-a',
    user_id: 'user-a',
    role: 'owner',
  },
  expectedWorkspaceId: 'workspace-a',
  expectedUserId: 'user-a',
})
assert.equal(compositeMembership?.identityContract, 'workspace_user_composite')
assert.match(compositeMembership?.identityHash ?? '', /^[a-f0-9]{16}$/)
assert.equal(compositeMembership?.surrogateIdHash, undefined)
assert.equal(resolveInternalTesterWorkspaceMembership({
  row: {
    workspace_id: 'workspace-b',
    user_id: 'user-a',
    role: 'owner',
  },
  expectedWorkspaceId: 'workspace-a',
  expectedUserId: 'user-a',
}), undefined)
assert.equal(resolveInternalTesterWorkspaceMembership({
  row: {
    workspace_id: 'workspace-a',
    user_id: 'user-a',
    role: 'editor',
  },
  expectedWorkspaceId: 'workspace-a',
  expectedUserId: 'user-a',
}), undefined)

const workflow = read('.github/workflows/internal-tester-sign-in-auth-readback.yml')
for (const phrase of [
  'Internal Tester Google Auth Readback',
  'workflow_dispatch',
  'source_ref',
  'source_sha',
  'expected_email_hash',
  'codex/backend-workflow-pipeline-continuation',
  'environment: staging',
  'STAGING_INTERNAL_TESTER_EMAIL',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_SERVICE_ROLE_KEY',
  'npm run internal-testing:verify-auth-readback',
] as const) assert.equal(workflow.includes(phrase), true, `Readback workflow should include ${phrase}`)
assert.match(workflow, /test "\$\{GITHUB_REF\}" = "refs\/heads\/\$\{SOURCE_REF\}"/)
assert.match(workflow, /test "\$\{GITHUB_SHA\}" = "\$\{SOURCE_SHA\}"/)
assert.doesNotMatch(workflow, /^\s+tester_email:/m)
assert.doesNotMatch(workflow, /INTERNAL_TESTER_PASSWORD|inviteUserByEmail/i)
assert.doesNotMatch(workflow, /allow_staging_writes|REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES/i)
assert.doesNotMatch(workflow, /\bVITE_|deploy-pages|docker build|apt-get|gcloud|worker:run|tools:check|smoke:prod-real|supabase db|supabase migration|createSignedUrl/i)
assert.doesNotMatch(workflow, /STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/i)

const tsxExecutable = join(root, 'node_modules', '.bin', 'tsx')
const cliPath = 'server/cli/verify-internal-tester-auth-readback.ts'
const cleanEnv = { ...process.env }
for (const key of [
  'REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_TESTER_EMAIL',
  'INTERNAL_TESTER_EXPECTED_EMAIL_HASH',
]) delete cleanEnv[key]

const missingConfirmation = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: cleanEnv,
  encoding: 'utf8',
})
assert.equal(missingConfirmation.status, 1)
assert.equal(
  (JSON.parse(missingConfirmation.stdout) as Record<string, unknown>).decision,
  'internal_tester_sign_in_auth_readback_blocked_missing_confirmation',
)

const invalidOrigin = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...cleanEnv,
    REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK: 'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
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
  'internal_tester_sign_in_auth_readback_blocked_invalid_input',
)

const mismatchedEmailHash = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...cleanEnv,
    REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK: 'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
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
  'internal_tester_sign_in_auth_readback_blocked_invalid_input',
)

const doc = JSON.parse(read('docs/internal-tester-sign-in-auth-readback.json')) as {
  decision?: string
  sourceRef?: string
  sourceShaRequiredAtDispatch?: boolean
  googleSessionEvidenceRequired?: string[]
  dataMutationAllowed?: boolean
  workspaceIdentityContractDetectedBeforeReadback?: boolean
  profileContractMustMatchWorkspaceOwnership?: boolean
  workspaceIdentityContractSelectionOrder?: string[]
  ownedWorkspaceRequired?: boolean
  ownerMembershipRequired?: boolean
  rawEmailAcceptedAsWorkflowInput?: boolean
  outputIdentifiersHashed?: boolean
  workspaceMembershipIdentityContracts?: string[]
  compositeMembershipIdentitySupported?: boolean
  blockedScope?: Record<string, boolean>
  nextGate?: string
}
assert.equal(doc.decision, 'google_first_same_sha_auth_profile_workspace_readback_source_ready_remote_read_not_run')
assert.equal(doc.sourceRef, 'codex/backend-workflow-pipeline-continuation')
assert.equal(doc.sourceShaRequiredAtDispatch, true)
assert.deepEqual(doc.googleSessionEvidenceRequired, [
  'googleIdentityObserved',
  'authEmailConfirmed',
  'priorAuthSignInObserved',
])
assert.equal(doc.dataMutationAllowed, false)
assert.equal(doc.workspaceIdentityContractDetectedBeforeReadback, true)
assert.equal(doc.profileContractMustMatchWorkspaceOwnership, true)
assert.deepEqual(doc.workspaceIdentityContractSelectionOrder, [
  'legacy_user_profile_when_owner_user_id_exists',
  'direct_auth_user_when_only_owner_id_exists',
])
assert.equal(doc.ownedWorkspaceRequired, true)
assert.equal(doc.ownerMembershipRequired, true)
assert.equal(doc.rawEmailAcceptedAsWorkflowInput, false)
assert.equal(doc.outputIdentifiersHashed, true)
assert.deepEqual(doc.workspaceMembershipIdentityContracts, [
  'surrogate_id',
  'workspace_user_composite',
])
assert.equal(doc.compositeMembershipIdentitySupported, true)
assert.equal(doc.nextGate, 'OWNER_INTERACTIVE_GOOGLE_SESSION_WITH_PRIVATE_GATEWAY_PROJECTS_READBACK')
for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combinedDocs = [
  read('docs/internal-tester-sign-in-auth-readback.md'),
  read('docs/internal-tester-sign-in-auth-readback.json'),
].join('\n')
assert.doesNotMatch(combinedDocs, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]/i)
assert.doesNotMatch(combinedDocs, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-google-auth-readback',
  decision: doc.decision,
  checks: [
    'same_sha_protected_environment_workflow',
    'google_identity_confirmed_email_and_prior_auth_sign_in_required',
    'readback_has_no_data_or_auth_mutation',
    'email_and_persisted_identifiers_not_logged_raw',
    'profile_reads_use_minimal_projection',
    'profile_identity_contract_matches_deployed_workspace_ownership',
    'legacy_required_owner_column_takes_precedence_over_backfilled_owner_id',
    'legacy_surrogate_and_canonical_composite_membership_identity_supported',
    'tester_owned_workspace_and_owner_membership_required',
    'untrusted_supabase_origin_rejected_before_network',
    'mismatched_interactive_email_hash_rejected_before_network',
    'owner_interactive_gateway_retry_required',
  ],
  nextGate: doc.nextGate,
}, null, 2))
