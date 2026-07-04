import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS,
  MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION,
  MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE,
  evaluateProjectSessionBackendAccess,
  getMockSafeDurableProjectSessionBackendSkeleton,
} from '../../src/lib/project-edit-session-backend-skeleton'
import { DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES } from '../../src/lib/project-edit-session-backend-persistence-plan'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

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

function assertNoLiveBackendCalls(path: string) {
  const text = read(path)
  assert.doesNotMatch(text, /createClient|runAuthBootstrapFlow|ensureCurrentUserProfile|ensureDefaultWorkspace/)
  assert.doesNotMatch(text, /\.(from|insert|update|delete|upsert|rpc)\s*\(/)
  assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|upload\s*\(/)
}

const requiredFiles = [
  'src/lib/project-edit-session-backend-skeleton.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.md',
  'docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.json',
  'server/smoke/internal-testing-mock-safe-durable-project-session-backend-skeleton-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton'],
  'tsx server/smoke/internal-testing-mock-safe-durable-project-session-backend-skeleton-smoke.ts',
)

const skeleton = getMockSafeDurableProjectSessionBackendSkeleton()
assert.equal(skeleton.decision, MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION)
assert.equal(skeleton.currentMode, 'mock_safe_backend_skeleton')
assert.equal(skeleton.routeIntegrationReady, true)
assert.equal(skeleton.durableSupabaseReady, false)
assert.deepEqual([...skeleton.requiredEvidence], [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES])
assert.equal(skeleton.nextGate, MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE)

const allowed = evaluateProjectSessionBackendAccess({
  mode: 'mock_internal',
  authUserId: 'mock-auth-user-internal-tester',
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  requestId: 'req-internal-testing-access-1',
  idempotencyKey: 'idem-internal-testing-access-1',
})
assert.equal(allowed.status, 'mock_internal_access_allowed')
assert.equal(allowed.routeAccessAllowed, true)
assert.equal(allowed.mockInternalAccessAllowed, true)
assert.equal(allowed.durableSupabaseAccessAllowed, false)
assert.equal(allowed.supabaseLiveEnabled, false)
assert.equal(allowed.serviceRoleInBrowserAllowed, false)
assert.equal(allowed.matchedRole, 'owner')
assert.equal(allowed.auditEnvelope.idempotent, true)
assert.ok(allowed.missingDurableEvidence.includes('rls_policies_verified_for_authenticated_role'))
assert.ok(allowed.missingDurableEvidence.includes('explicit_data_api_grants_verified_for_authenticated_role'))

const missingRequest = evaluateProjectSessionBackendAccess({
  authUserId: 'mock-auth-user-internal-tester',
  workspaceId: 'workspace-internal-testing',
})
assert.equal(missingRequest.status, 'blocked_missing_request_context')
assert.equal(missingRequest.routeAccessAllowed, false)
assert.ok(missingRequest.missingRequestFields.includes('projectId'))
assert.ok(missingRequest.missingRequestFields.includes('idempotencyKey'))

const nonMember = evaluateProjectSessionBackendAccess({
  mode: 'mock_internal',
  authUserId: 'mock-auth-user-internal-tester',
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-not-owned',
  requestId: 'req-internal-testing-access-2',
  idempotencyKey: 'idem-internal-testing-access-2',
})
assert.equal(nonMember.status, 'blocked_mock_membership')
assert.equal(nonMember.routeAccessAllowed, false)

const durableMissingEvidence = evaluateProjectSessionBackendAccess({
  mode: 'durable_supabase_disabled',
  authUserId: 'mock-auth-user-internal-tester',
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  requestId: 'req-durable-access-1',
  idempotencyKey: 'idem-durable-access-1',
  evidence: {
    signed_in_auth_user_verified_server_side: true,
  },
})
assert.equal(durableMissingEvidence.status, 'blocked_durable_supabase_missing_evidence')
assert.equal(durableMissingEvidence.routeAccessAllowed, false)
assert.ok(durableMissingEvidence.missingDurableEvidence.includes('workspace_membership_verified_by_workspace_members'))

const fullEvidence = Object.fromEntries(DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES.map((gate) => [gate, true]))
const durableStillDisabled = evaluateProjectSessionBackendAccess({
  mode: 'durable_supabase_disabled',
  authUserId: 'mock-auth-user-internal-tester',
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  requestId: 'req-durable-access-2',
  idempotencyKey: 'idem-durable-access-2',
  evidence: fullEvidence,
})
assert.equal(durableStillDisabled.status, 'blocked_durable_supabase_runtime_not_implemented')
assert.equal(durableStillDisabled.missingDurableEvidence.length, 0)
assert.equal(durableStillDisabled.durableSupabaseAccessAllowed, false)

const customRecord = evaluateProjectSessionBackendAccess({
  mode: 'mock_internal',
  authUserId: 'user-custom',
  workspaceId: 'workspace-custom',
  projectId: 'project-custom',
  editSessionId: 'session-custom',
  requestId: 'req-custom-access',
  idempotencyKey: 'idem-custom-access',
  membershipRecords: [
    {
      userId: 'user-custom',
      workspaceId: 'workspace-custom',
      role: 'editor',
      projectIds: ['project-custom'],
      editSessionIdsByProjectId: {
        'project-custom': ['session-custom'],
      },
    },
  ],
})
assert.equal(customRecord.status, 'mock_internal_access_allowed')
assert.equal(customRecord.matchedRole, 'editor')
assert.equal(DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS.length, 1)

assertNoLiveBackendCalls('src/lib/project-edit-session-backend-skeleton.ts')
assertNoLiveBackendCalls('src/pages/InternalTestingPage.tsx')

const docJson = JSON.parse(read('docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.json')) as {
  decision?: string
  scenarioId?: string
  currentMode?: string
  routeIntegrationReady?: boolean
  durableSupabaseReady?: boolean
  requiredEvidence?: string[]
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION)
assert.equal(docJson.scenarioId, 'mock-safe-durable-project-session-backend-skeleton')
assert.equal(docJson.currentMode, 'mock_safe_backend_skeleton')
assert.equal(docJson.routeIntegrationReady, true)
assert.equal(docJson.durableSupabaseReady, false)
assert.deepEqual(docJson.requiredEvidence, [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES])
assert.equal(docJson.blockedScope?.supabaseWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton'))

assertText('docs/internal-testing-mock-safe-durable-project-session-backend-skeleton.md', [
  MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION,
  'mock internal route access can pass',
  'durable Supabase access still fails closed',
  'explicit Data API grants',
  'RLS',
  'No Supabase migration',
  MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE,
])

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'mock-safe-durable-project-session-backend-skeleton' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-mock-safe-durable-project-session-backend-skeleton',
  decision: MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION,
  routeIntegrationReady: skeleton.routeIntegrationReady,
  durableSupabaseReady: skeleton.durableSupabaseReady,
  defaultMembershipRecords: DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS.length,
  nextGate: MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE,
}, null, 2))
