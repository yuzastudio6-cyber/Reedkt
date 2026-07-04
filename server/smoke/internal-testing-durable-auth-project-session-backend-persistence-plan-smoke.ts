import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'
import {
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
  getDurableAuthProjectSessionBackendPersistencePlan,
} from '../../src/lib/project-edit-session-backend-persistence-plan'

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

function assertNoLiveSupabaseRuntime(path: string) {
  const text = read(path)
  assert.doesNotMatch(text, /createClient|runAuthBootstrapFlow|ensureCurrentUserProfile|ensureDefaultWorkspace/)
  assert.doesNotMatch(text, /\.(from|insert|update|delete|upsert|rpc)\s*\(/)
  assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|upload\s*\(/)
}

const requiredFiles = [
  'src/lib/project-edit-session-backend-persistence-plan.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.md',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.json',
  'server/smoke/internal-testing-durable-auth-project-session-backend-persistence-plan-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-durable-auth-project-session-backend-persistence-plan'],
  'tsx server/smoke/internal-testing-durable-auth-project-session-backend-persistence-plan-smoke.ts',
)

const plan = getDurableAuthProjectSessionBackendPersistencePlan()
assert.equal(plan.decision, DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION)
assert.equal(plan.currentMode, 'mock_internal_plan_only')
assert.equal(plan.nextMode, 'mock_safe_backend_skeleton')
assert.deepEqual([...plan.requiredGates], [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES])
assert.deepEqual([...plan.plannedTables], [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES])
assert.equal(DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS.length, 3)
assert.equal(plan.blockedScope.supabaseMigration, false)
assert.equal(plan.blockedScope.supabaseWrite, false)
assert.equal(plan.blockedScope.serviceRoleInBrowser, false)
assert.equal(plan.blockedScope.productReady, false)

for (const gate of [
  'signed_in_auth_user_verified_server_side',
  'workspace_membership_verified_by_workspace_members',
  'explicit_data_api_grants_verified_for_authenticated_role',
  'audit_idempotency_and_rate_limit_envelope_defined',
]) {
  assert.ok(plan.requiredGates.includes(gate), `required gate should include ${gate}`)
}

assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-durable-auth-project-session-backend-persistence-plan',
  'Backend persistence plan',
  'DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES',
  'No migration, SQL, Storage',
])

assertNoLiveSupabaseRuntime('src/lib/project-edit-session-backend-persistence-plan.ts')
assertNoLiveSupabaseRuntime('src/pages/InternalTestingPage.tsx')

const docJson = JSON.parse(read('docs/internal-testing-durable-auth-project-session-backend-persistence-plan.json')) as {
  decision?: string
  scenarioId?: string
  requiredGates?: string[]
  plannedTables?: string[]
  supabaseEvidence?: Record<string, boolean | string>
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION)
assert.equal(docJson.scenarioId, 'durable-auth-project-session-backend-persistence-plan')
assert.deepEqual(docJson.requiredGates, [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES])
assert.deepEqual(docJson.plannedTables, [...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES])
assert.equal(docJson.supabaseEvidence?.explicitDataApiGrantsRequired, true)
assert.equal(docJson.supabaseEvidence?.rlsRequired, true)
assert.equal(docJson.supabaseEvidence?.serviceRoleBrowserUseAllowed, false)
assert.equal(docJson.blockedScope?.supabaseMigration, false)
assert.equal(docJson.blockedScope?.supabaseWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-auth-project-session-backend-persistence-plan'))

assertText('docs/internal-testing-durable-auth-project-session-backend-persistence-plan.md', [
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  'mock-safe backend skeleton',
  'workspace_members',
  'explicit Data API grants',
  'RLS',
  'never raw `user_metadata`',
  'No Supabase migration',
])

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-auth-project-session-backend-persistence-plan' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-auth-project-session-backend-persistence-plan',
  decision: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  requiredGates: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES.length,
  plannedTables: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES.length,
  nextMode: plan.nextMode,
  productReady: false,
}, null, 2))
