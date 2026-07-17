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
  'src/main.tsx',
  'src/styles/auth.css',
  'src/auth/auth-navigation.ts',
  'src/auth/app-base-path.ts',
  'src/auth/google-oauth.ts',
  'src/backend/auth/auth-client-service.ts',
  'src/backend/provider-config/provider-secret-registry.ts',
  'src/server/server-env.ts',
  'src/components/auth/GoogleMark.tsx',
  '.github/workflows/app-internal-testing-pages-deploy.yml',
  'docs/app-sign-in-entrypoint.md',
  'docs/app-sign-in-entrypoint.json',
  'server/smoke/app-sign-in-entrypoint-smoke.ts',
  'server/smoke/google-oauth-sign-in-smoke.ts',
  'tests/e2e/google-oauth-sign-in.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:app-sign-in-entrypoint'],
  'tsx server/smoke/app-sign-in-entrypoint-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:google-oauth-sign-in'],
  'tsx server/smoke/google-oauth-sign-in-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['qa:google-oauth-sign-in'],
  'playwright test --config=playwright.google-oauth.config.ts',
)

assertMentions('src/App.tsx', ['SignInPage', 'path="/sign-in"', 'Navigate to="/dashboard"'])
assert.doesNotMatch(read('src/App.tsx'), /path=["']\/auth["']/)
assertMentions('src/main.tsx', ['createBrowserRouter', 'appRouterBasename', 'import.meta.env.BASE_URL'])

const signInPage = read('src/pages/SignInPage.tsx')
assertMentions('src/pages/SignInPage.tsx', [
  'signInWithGoogle',
  'Continue with Google',
  'google-sign-in',
  'auth-password-toggle',
  'Use email and password',
  'readGoogleOAuthCallbackError',
  'Private preview',
  'No production billing or public delivery',
])
assert.doesNotMatch(
  signInPage,
  /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|service_role|createSignedUrl|stripe|worker:run/i,
)
assert.doesNotMatch(signInPage, /\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|fetch\s*\(/i)
assert.doesNotMatch(signInPage, /runWorker|dispatchWorker|reserveCredits|spendCredits|renderExport|startRender/i)

assertMentions('src/auth/google-oauth.ts', [
  'sanitizeInternalReturnTo',
  'normalizeAppBasePath',
  'validateGoogleProviderHandoffUrl',
  'providerUrl.origin !== supabaseUrl.origin',
  "providerUrl.searchParams.get('provider') !== 'google'",
  "providerUrl.searchParams.get('redirect_to') !== input.callback.toString()",
  'Google sign-in was cancelled',
  'Google sign-in could not be completed',
])
assertMentions('src/auth/auth-navigation.ts', ['DEFAULT_AUTH_RETURN_TO', '/dashboard', 'sanitizeInternalReturnTo'])
assertMentions('src/backend/provider-config/provider-secret-registry.ts', ['VITE_REEDITPRO_AUTH_MODE', 'requiredForProduction: true'])
assertMentions('src/server/server-env.ts', ['VITE_REEDITPRO_AUTH_MODE'])
assertMentions('src/backend/auth/auth-client-service.ts', [
  'signInWithGoogleOAuth',
  "provider: 'google'",
  'skipBrowserRedirect: true',
  'expectedOrigin',
  'callback.origin !== trustedOrigin.origin',
  'return address is not trusted',
  'window.location.assign',
  'Google sign-in could not start. Try again, or use email and password.',
])
assert.doesNotMatch(
  read('src/backend/auth/auth-client-service.ts'),
  /message:\s*error\?\.message\s*\|\|\s*['"]Google sign-in/,
  'Google OAuth startup errors must not expose raw provider details to the sign-in UI.',
)

const workflow = read('.github/workflows/app-internal-testing-pages-deploy.yml')
assertMentions('.github/workflows/app-internal-testing-pages-deploy.yml', [
  'VITE_REEDITPRO_AUTH_MODE: supabase',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_ANON_KEY',
  'cp dist/index.html dist/404.html',
])
assert.doesNotMatch(workflow, /STAGING_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/)

const doc = JSON.parse(read('docs/app-sign-in-entrypoint.json')) as {
  decision?: string
  route?: string
  defaultRedirect?: string
  frontendAuthMode?: string
  hostedBasePathAware?: boolean
  compiledBasePathProviderHandoffVerified?: boolean
  googleOAuthCodeReady?: boolean
  googleOAuthProviderConfiguredRemotely?: boolean
  hostedCallbackVerified?: boolean
  hostedDeploymentVerified?: boolean
  allowedPublicEnv?: string[]
  blockedScope?: Record<string, boolean>
  nextGate?: string
}

assert.equal(doc.decision, 'app_sign_in_google_oauth_handoff_passed_local_ready_for_private_staging_configuration')
assert.equal(doc.route, '/sign-in')
assert.equal(doc.defaultRedirect, '/dashboard')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_google_oauth_with_email_password_fallback')
assert.equal(doc.hostedBasePathAware, true)
assert.equal(doc.compiledBasePathProviderHandoffVerified, true)
assert.equal(doc.googleOAuthCodeReady, true)
assert.equal(doc.googleOAuthProviderConfiguredRemotely, false)
assert.equal(doc.hostedCallbackVerified, false)
assert.equal(doc.hostedDeploymentVerified, false)
assert.deepEqual(doc.allowedPublicEnv, [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_REEDITPRO_AUTH_MODE',
])
assert.equal(doc.nextGate, 'SUPABASE_GOOGLE_PROVIDER_HOSTED_CALLBACK_AND_REAL_BROWSER_READBACK')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combined = requiredFiles
  .filter((path) => (
    !path.startsWith('server/smoke/')
    && path !== 'src/backend/provider-config/provider-secret-registry.ts'
    && path !== 'src/server/server-env.ts'
  ))
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
  googleOAuthCodeReady: doc.googleOAuthCodeReady,
  hostedCallbackVerified: doc.hostedCallbackVerified,
  nextGate: doc.nextGate,
}, null, 2))
