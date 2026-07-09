import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'
import {
  PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION,
  PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE,
  evaluateProjectEditSessionAccessPolicy,
  type ProjectEditSessionAccessPolicy,
} from '../../src/lib/project-edit-session-access-policy-core'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertText(path: string, phrases: string[]) {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

function assertNoForbiddenRuntimePatterns(path: string) {
  const text = read(path)
  assert.doesNotMatch(text, /runAuthBootstrapFlow|ensureCurrentUserProfile|ensureDefaultWorkspace/)
  assert.doesNotMatch(text, /\.(from|insert|update|delete)\s*\(/)
  assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY|service_role|createSignedUrl/)
}

function evaluate(status: ProjectEditSessionAccessPolicy['authStatus'], durable = false) {
  return evaluateProjectEditSessionAccessPolicy({
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: 'edit-session-youtube-wide',
    authReadiness: {
      status,
      configured: status !== 'not_configured',
      userEmail: status === 'signed_in_auth_only' ? 'tester@example.com' : undefined,
      warnings: [],
    },
    durableEvidence: durable
      ? {
          workspaceMembershipVerified: true,
          projectMembershipVerified: true,
          editSessionAccessVerified: true,
          rlsPolicyVerified: true,
          dataApiGrantVerified: true,
          backendPersistenceMode: 'supabase_durable_verified',
        }
      : undefined,
  })
}

const requiredFiles = [
  'src/lib/project-edit-session-access-policy-core.ts',
  'src/lib/project-edit-session-access-policy.ts',
  'src/components/projects/ProjectEditSessionAccessPolicyNotice.tsx',
  'src/pages/ProjectHomePage.tsx',
  'src/pages/EditorPage.tsx',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'docs/internal-testing-auth-project-session-membership-policy.md',
  'docs/internal-testing-auth-project-session-membership-policy.json',
  'server/smoke/internal-testing-auth-project-session-membership-policy-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-auth-project-session-membership-policy'],
  'tsx server/smoke/internal-testing-auth-project-session-membership-policy-smoke.ts',
)

const defaultPolicy = evaluate('not_configured')
assert.equal(defaultPolicy.decision, PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION)
assert.equal(defaultPolicy.status, 'mock_internal_route_allowed')
assert.equal(defaultPolicy.mockInternalRouteAllowed, true)
assert.equal(defaultPolicy.durableAuthenticatedAccessAllowed, false)
assert.ok(defaultPolicy.missingEvidence.includes('signed_in_auth_user'))
assert.ok(defaultPolicy.missingEvidence.includes('backend_persistence_mode_verified'))

const signedOutPolicy = evaluate('signed_out')
assert.equal(signedOutPolicy.status, 'signed_out_durable_access_blocked')
assert.equal(signedOutPolicy.durableAuthenticatedAccessAllowed, false)

const authOnlyPolicy = evaluate('signed_in_auth_only')
assert.equal(authOnlyPolicy.status, 'auth_only_durable_membership_pending')
assert.equal(authOnlyPolicy.userEmail, 'tester@example.com')
assert.ok(authOnlyPolicy.missingEvidence.includes('workspace_membership_verified'))
assert.ok(authOnlyPolicy.missingEvidence.includes('rls_policy_verified'))
assert.equal(authOnlyPolicy.durableAuthenticatedAccessAllowed, false)

const readyPolicy = evaluate('signed_in_auth_only', true)
assert.equal(readyPolicy.status, 'durable_membership_ready')
assert.equal(readyPolicy.missingEvidence.length, 0)
assert.equal(readyPolicy.persistenceMode, 'supabase_durable_verified')
assert.equal(readyPolicy.durableAuthenticatedAccessAllowed, true)

assert.deepEqual([...PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE], [
  'signed_in_auth_user',
  'workspace_membership_verified',
  'project_membership_verified',
  'edit_session_access_verified',
  'rls_policy_verified',
  'explicit_data_api_grants_verified',
  'backend_persistence_mode_verified',
])

assertText('src/components/projects/ProjectEditSessionAccessPolicyNotice.tsx', [
  'project-edit-session-access-policy',
  'Project/session access policy',
  'Mock route access',
  'Durable access',
  'pending evidence',
])
assertText('src/pages/ProjectHomePage.tsx', ['ProjectHomePage'])
assertText('src/pages/EditorPage.tsx', ['EditorPage'])
assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-auth-project-session-membership-policy',
  'Membership policy',
  'PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE',
  'No Supabase Data API table access',
])

for (const path of [
  'src/lib/project-edit-session-access-policy-core.ts',
  'src/lib/project-edit-session-access-policy.ts',
  'src/components/projects/ProjectEditSessionAccessPolicyNotice.tsx',
  'src/pages/ProjectHomePage.tsx',
  'src/pages/EditorPage.tsx',
  'src/pages/InternalTestingPage.tsx',
]) {
  assertNoForbiddenRuntimePatterns(path)
}

const docJson = JSON.parse(read('docs/internal-testing-auth-project-session-membership-policy.json')) as {
  decision?: string
  scenarioId?: string
  requiredEvidence?: string[]
  acceptedEvidence?: string[]
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION)
assert.equal(docJson.scenarioId, 'auth-project-session-membership-policy')
assert.deepEqual(docJson.requiredEvidence, [...PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE])
assert.ok(docJson.acceptedEvidence?.includes('src/lib/project-edit-session-access-policy-core.ts'))
assert.equal(docJson.blockedScope?.serviceRole, false)
assert.equal(docJson.blockedScope?.supabaseDataReadWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-auth-project-session-membership-policy'))

assertText('docs/internal-testing-auth-project-session-membership-policy.md', [
  PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION,
  'Mock route access remains allowed',
  'Durable authenticated project/session access remains blocked',
  'Data API exposure change',
  'No service-role',
  'No Supabase Data API table reads or writes',
])

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'auth-project-session-membership-policy' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-auth-project-session-membership-policy',
  decision: PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION,
  requiredEvidence: PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE.length,
  mockInternalRouteAllowed: true,
  durableAuthenticatedAccessAllowedByDefault: false,
  productReady: false,
}, null, 2))
