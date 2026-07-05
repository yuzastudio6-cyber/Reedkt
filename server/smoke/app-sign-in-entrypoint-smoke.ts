import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  'src/pages/SignInPage.tsx',
  'src/App.tsx',
  'src/components/MarketingNav.tsx',
  'src/styles/auth.css',
  'src/index.css',
  'docs/app-sign-in-entrypoint.md',
  'docs/app-sign-in-entrypoint.json',
  'server/smoke/app-sign-in-entrypoint-smoke.ts',
  'tests/e2e/app-sign-in-internal-testing-mock.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:app-sign-in-entrypoint'],
  'tsx server/smoke/app-sign-in-entrypoint-smoke.ts',
)

assertMentions('src/App.tsx', ['SignInPage', 'path="/sign-in"', 'path="/auth"'])
assertMentions('src/components/MarketingNav.tsx', ['to="/sign-in"', 'Sign In'])
assertMentions('src/index.css', ["./styles/auth.css"])

const signInPage = read('src/pages/SignInPage.tsx')
assertMentions('src/pages/SignInPage.tsx', [
  'signInWithEmailPassword',
  'signUpWithEmailPassword',
  'isInternalTestingMockAuthEnabled',
  'useAuthBootstrap',
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  '/internal-testing',
  'browser-local testing session',
  'No service-role secrets',
  'No tool execution on sign-in',
])

assert.doesNotMatch(
  signInPage,
  /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|service_role|createSignedUrl|stripe|worker:run/i,
)
assert.doesNotMatch(signInPage, /\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|fetch\s*\(/i)
assert.doesNotMatch(signInPage, /runWorker|dispatchWorker|reserveCredits|spendCredits|renderExport|startRender/i)

assertMentions('src/backend/auth/auth-client-service.ts', [
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  'reeditpro:internal-testing-auth-session:v1',
  'No Supabase request was made.',
  'No Supabase sign-up request was made.',
  'No Supabase sign-out request was made.',
])

assertMentions('src/backend/auth/auth-bootstrap-orchestrator.ts', [
  'getInternalTestingMockAuthSession',
  'Use internal testing sign-in to create a browser-local mock session.',
])

assertMentions('scripts/dev/internal-testing-local-upload-runner.mjs', [
  'VITE_REEDITPRO_INTERNAL_TEST_AUTH',
  '/sign-in',
  'browser-local mock sign-in',
])

const doc = JSON.parse(read('docs/app-sign-in-entrypoint.json')) as {
  decision?: string
  route?: string
  defaultRedirect?: string
  frontendAuthMode?: string
  internalTestingAuthMode?: string
  allowedInternalTestingEnv?: string[]
  blockedScope?: Record<string, boolean>
}

assert.equal(doc.decision, 'app_sign_in_entrypoint_passed_ready_for_internal_testing_auth_smoke')
assert.equal(doc.route, '/sign-in')
assert.equal(doc.defaultRedirect, '/internal-testing')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_only')
assert.equal(doc.internalTestingAuthMode, 'browser_local_mock_session_when_explicitly_enabled')
assert.deepEqual(doc.allowedInternalTestingEnv, ['VITE_REEDITPRO_INTERNAL_TEST_AUTH'])

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combined = requiredFiles
  .filter((path) => path !== 'server/smoke/app-sign-in-entrypoint-smoke.ts')
  .map((path) => read(path))
  .join('\n')
assert.doesNotMatch(combined, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(combined, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'app-sign-in-entrypoint',
  decision: doc.decision,
  route: doc.route,
  defaultRedirect: doc.defaultRedirect,
  frontendAuthMode: doc.frontendAuthMode,
  blockedScope: doc.blockedScope,
}, null, 2))
