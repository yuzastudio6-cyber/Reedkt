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

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertText(path: string, phrases: string[]): void {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

const requiredFiles = [
  'src/hooks/useAuthBootstrap.ts',
  'src/backend/auth/auth-bootstrap-orchestrator.ts',
  'src/backend/auth/profile-bootstrap-service.ts',
  'src/backend/auth/workspace-bootstrap-service.ts',
  'src/pages/SignInPage.tsx',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'server/cli/provision-internal-tester.ts',
  'server/cli/verify-internal-tester-auth-readback.ts',
  'docs/internal-testing-browser-auth-bootstrap-readiness.md',
  'docs/internal-testing-browser-auth-bootstrap-readiness.json',
  'server/smoke/internal-testing-browser-auth-bootstrap-readiness-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-browser-auth-bootstrap-readiness'],
  'tsx server/smoke/internal-testing-browser-auth-bootstrap-readiness-smoke.ts',
)

assertText('src/pages/InternalTestingPage.tsx', [
  'useAuthBootstrap',
  'internal-testing-auth-bootstrap-readiness',
  'Profile and workspace readiness is visible after sign-in',
  'browser-safe auth bootstrap',
  'Supabase anon client',
  'backend-required',
  'internal-testing-auth-bootstrap-status',
  'internal-testing-auth-bootstrap-readback',
  'No service-role key',
  'No project/session writes',
  'manual provisioning and readback workflows',
])

const page = read('src/pages/InternalTestingPage.tsx')
assert.doesNotMatch(page, /\.\.\/backend|src\/backend|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /runAuthBootstrapFlow|ensureCurrentUserProfile|ensureDefaultWorkspace/)
assert.doesNotMatch(page, /\.(from|insert|update|delete)\s*\(/)
assert.doesNotMatch(page, /SUPABASE_SERVICE_ROLE_KEY|service_role|createSignedUrl|createSignedUploadUrl/i)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"/i)
assert.doesNotMatch(page, /(runWorker|dispatchWorker|reserveCredits|spendCredits|startRender|renderExport)\s*\(/i)

assertText('src/hooks/useAuthBootstrap.ts', [
  'runAuthBootstrapFlow',
  'onSupabaseAuthStateChange',
  'refresh',
])
assert.doesNotMatch(read('src/hooks/useAuthBootstrap.ts'), /SUPABASE_SERVICE_ROLE_KEY|service_role|createSignedUrl/i)

assertText('src/backend/auth/auth-bootstrap-orchestrator.ts', [
  'runSupabaseAuthBootstrapFlow',
  'ensureCurrentUserProfile',
  'ensureDefaultWorkspace',
  'backend_profile_creation_required',
  'workspace_ready',
])
assert.doesNotMatch(read('src/backend/auth/auth-bootstrap-orchestrator.ts'), /SUPABASE_SERVICE_ROLE_KEY|service_role|createSignedUrl/i)

assertText('src/backend/auth/profile-bootstrap-service.ts', [
  'PROFILE_TABLES',
  'legacyUserProfiles',
  'metadata_json',
  'metadata',
])
assertText('src/backend/auth/workspace-bootstrap-service.ts', [
  'owner_id',
  'owner_user_id',
  'plan_type',
  'workspace_type',
])
assertText('server/cli/provision-internal-tester.ts', [
  'user_profiles',
  'const ownerId = userId',
  'owner_user_id',
  'workspace_type',
  'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback',
])
assertText('server/cli/verify-internal-tester-auth-readback.ts', [
  'user_profiles',
  'owner_user_id',
  'workspace_type',
  'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test',
])

assertText('src/pages/SignInPage.tsx', [
  'useAuthBootstrap',
  '/internal-testing',
  'No service-role secrets',
  'No tool execution on sign-in',
  'buildSignUpEmailRedirectTo',
  'Tester provisioning required',
  'backend tester provisioning workflow',
])
assert.doesNotMatch(read('src/pages/SignInPage.tsx'), /Check your email/)

assertText('src/lib/internal-testing-scenarios.ts', [
  'browser-auth-bootstrap-readiness',
  'Signed-in browser auth bootstrap readiness',
  'manual provisioning and readback workflows',
  'No service-role key',
])

const scenario = internalTestingScenarios.find((item) => item.id === 'browser-auth-bootstrap-readiness')
assert.ok(scenario, 'Browser auth bootstrap readiness scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

assertText('docs/internal-testing-browser-auth-bootstrap-readiness.md', [
  'internal_testing_browser_auth_bootstrap_readiness_passed_ready_for_manual_signed_in_browser_readback',
  'signed-in bootstrap readiness panel',
  'Supabase anon client',
  'backend_required',
  'No service-role key',
  'No project/session writes',
  'MANUAL_TESTER_EMAIL_PROVISIONING_AND_BROWSER_SIGN_IN',
])

const docJson = JSON.parse(read('docs/internal-testing-browser-auth-bootstrap-readiness.json')) as {
  decision?: string
  scenarioId?: string
  source?: string
  allowedScope?: Record<string, boolean>
  blockedScope?: Record<string, boolean>
  manualNextStep?: string
  validation?: { required?: string[] }
}

assert.equal(
  docJson.decision,
  'internal_testing_browser_auth_bootstrap_readiness_passed_ready_for_manual_signed_in_browser_readback',
)
assert.equal(docJson.scenarioId, 'browser-auth-bootstrap-readiness')
assert.equal(docJson.source, 'frontend_anon_auth_bootstrap_readiness')
assert.equal(docJson.allowedScope?.publicSupabaseAuth, true)
assert.equal(docJson.allowedScope?.signedInProfileWorkspaceBootstrapThroughRls, true)
assert.equal(docJson.allowedScope?.manualBackendProvisioningFallback, true)
assert.equal(docJson.blockedScope?.serviceRole, false)
assert.equal(docJson.blockedScope?.adminClient, false)
assert.equal(docJson.blockedScope?.projectSessionWrites, false)
assert.equal(docJson.blockedScope?.storageSignedUrls, false)
assert.equal(docJson.blockedScope?.providerOrModelCalls, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)
assert.equal(docJson.blockedScope?.creditSpend, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.manualNextStep, 'MANUAL_TESTER_EMAIL_PROVISIONING_AND_BROWSER_SIGN_IN')
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-browser-auth-bootstrap-readiness'))
assert.ok(docJson.validation?.required?.includes('smoke:app-sign-in-entrypoint'))

const combinedSafeText = [
  page,
  read('docs/internal-testing-browser-auth-bootstrap-readiness.md'),
  read('docs/internal-testing-browser-auth-bootstrap-readiness.json'),
].join('\n')
assert.doesNotMatch(combinedSafeText, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(combinedSafeText, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-browser-auth-bootstrap-readiness',
  decision: docJson.decision,
  scenario: scenario.id,
  source: docJson.source,
  manualNextStep: docJson.manualNextStep,
  productReady: false,
}, null, 2))
