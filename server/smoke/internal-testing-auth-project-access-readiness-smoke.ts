import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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

const requiredFiles = [
  'src/lib/internal-testing-auth-project-access-readiness.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'docs/internal-testing-auth-project-access-readiness.md',
  'docs/internal-testing-auth-project-access-readiness.json',
  'server/smoke/internal-testing-auth-project-access-readiness-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-auth-project-access-readiness'],
  'tsx server/smoke/internal-testing-auth-project-access-readiness-smoke.ts',
)

assertText('src/lib/internal-testing-auth-project-access-readiness.ts', [
  'getAuthClientStatus',
  'getCurrentSupabaseSession',
  'getCurrentSupabaseUser',
  'frontend_anon_auth_readonly_and_mock_project_session',
  'profileWorkspaceBootstrapWrites',
  'supabaseDataReadWrite',
  'storageSignedUrls',
])

const helper = read('src/lib/internal-testing-auth-project-access-readiness.ts')
assert.doesNotMatch(helper, /runAuthBootstrapFlow|bootstrapUserProfileWorkspace|createWorkspace|upsert|insert|update|delete/i)
assert.doesNotMatch(helper, /SUPABASE_SERVICE_ROLE_KEY|service_role|createSignedUrl/i)

assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-auth-project-access-readiness',
  'Auth and project access',
  'read-only Auth readiness check',
  'No service-role',
  'No provider/model calls',
  'Durable project membership',
])
assert.doesNotMatch(read('src/pages/InternalTestingPage.tsx'), /runAuthBootstrapFlow|SUPABASE_SERVICE_ROLE_KEY|service_role/i)

assertText('src/lib/internal-testing-scenarios.ts', [
  'auth-project-access-readiness',
  'public Supabase Auth session state',
  'profile/workspace bootstrap writes',
  'Supabase Data API',
])

assertText('docs/internal-testing-auth-project-access-readiness.md', [
  'internal_testing_auth_project_access_readiness_passed_ready_for_authenticated_internal_testing_entrypoint',
  'read-only Auth',
  'does not run the existing profile/workspace bootstrap path',
  'No Supabase Data API table reads or writes',
  'Durable authenticated project/session testing',
])

const docJson = JSON.parse(read('docs/internal-testing-auth-project-access-readiness.json')) as {
  decision?: string
  scenarioId?: string
  source?: string
  authReadiness?: Record<string, string>
  mockProjectSession?: Record<string, string>
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}

assert.equal(
  docJson.decision,
  'internal_testing_auth_project_access_readiness_passed_ready_for_authenticated_internal_testing_entrypoint',
)
assert.equal(docJson.scenarioId, 'auth-project-access-readiness')
assert.equal(docJson.source, 'frontend_anon_auth_readonly_and_mock_project_session')
assert.equal(docJson.authReadiness?.profileWorkspaceBootstrap, 'not_run')
assert.equal(docJson.authReadiness?.durableProjectMembership, 'not_proven')
assert.equal(docJson.mockProjectSession?.projectId, 'mock-project-edit-chat-foundation')
assert.equal(docJson.mockProjectSession?.editSessionId, 'edit-session-youtube-wide')
assert.equal(docJson.blockedScope?.serviceRole, false)
assert.equal(docJson.blockedScope?.profileWorkspaceBootstrapWrites, false)
assert.equal(docJson.blockedScope?.supabaseDataReadWrite, false)
assert.equal(docJson.blockedScope?.storageSignedUrls, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)
assert.equal(docJson.blockedScope?.creditSpend, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-auth-project-access-readiness'))
assert.ok(docJson.validation?.required?.includes('qa:internal-testing'))

const scenario = internalTestingScenarios.find((item) => item.id === 'auth-project-access-readiness')
assert.ok(scenario, 'Auth project access readiness scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const allText = [
  helper,
  read('src/pages/InternalTestingPage.tsx'),
  read('docs/internal-testing-auth-project-access-readiness.md'),
  read('docs/internal-testing-auth-project-access-readiness.json'),
].join('\n')
assert.doesNotMatch(allText, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(allText, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-auth-project-access-readiness',
  decision: docJson.decision,
  scenario: scenario.id,
  source: docJson.source,
  blockedScope: docJson.blockedScope,
}, null, 2))
