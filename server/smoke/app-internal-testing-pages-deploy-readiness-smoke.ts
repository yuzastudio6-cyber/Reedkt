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
  '.github/workflows/app-internal-testing-pages-deploy.yml',
  'src/main.tsx',
  'src/backend/supabase/supabase-config.ts',
  'docs/app-internal-testing-pages-deploy-readiness.md',
  'docs/app-internal-testing-pages-deploy-readiness.json',
  'server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:app-internal-testing-pages-deploy-readiness'],
  'tsx server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts',
)

assertMentions('src/main.tsx', ['createBrowserRouter', 'appRouterBasename', 'import.meta.env.BASE_URL'])
assertMentions('src/backend/supabase/supabase-config.ts', [
  'import.meta.env?.VITE_SUPABASE_URL',
  'import.meta.env?.VITE_SUPABASE_ANON_KEY',
])
assert.doesNotMatch(
  read('src/backend/supabase/supabase-config.ts'),
  /import\.meta\.env\s*\[[^\]]+\]/,
  'Supabase public env values must use static Vite env access so Pages builds inline them.',
)

const workflow = read('.github/workflows/app-internal-testing-pages-deploy.yml')
assertMentions('.github/workflows/app-internal-testing-pages-deploy.yml', [
  'workflow_dispatch',
  'DEPLOY_REEDITPRO_INTERNAL_TESTING_APP',
  'source_sha',
  '/Reedkt/',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_ANON_KEY',
  'VITE_REEDITPRO_AUTH_MODE: supabase',
  'VITE_REEDITPRO_API_MODE: mock',
  'npm run build -- --base=',
  'cp dist/index.html dist/404.html',
  'actions/deploy-pages',
])

assert.doesNotMatch(workflow, /STAGING_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|STRIPE_SECRET|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/)
assert.doesNotMatch(workflow, /gcloud|docker build|supabase db|supabase migration|apt-get|worker:run|tools:check|smoke:prod-real/i)
assert.doesNotMatch(workflow, /npm run build:server|npm run dev:api|npm run start:server/i)

const doc = JSON.parse(read('docs/app-internal-testing-pages-deploy-readiness.json')) as {
  decision?: string
  sourceRef?: string
  defaultBasePath?: string
  githubPagesSignInUrl?: string
  frontendAuthMode?: string
  currentImplementationBranch?: string
  currentSliceIntegratedIntoSourceRef?: boolean
  routerBasePathAware?: boolean
  spaFallbackIncluded?: boolean
  compiledSubpathPreviewVerified?: boolean
  compiledSubpathProviderHandoffVerified?: boolean
  googleOAuthCodeReady?: boolean
  googleOAuthProviderConfiguredRemotely?: boolean
  hostedCallbackVerified?: boolean
  hostedDeploymentVerified?: boolean
  existingLiveHostStatus?: string
  hostedApiMode?: string
  blockedScope?: Record<string, boolean>
  blockedSecrets?: string[]
  nextGate?: string
}

assert.equal(doc.decision, 'app_internal_testing_pages_workflow_locally_ready_google_oauth_hosted_configuration_pending')
assert.equal(doc.sourceRef, 'codex/reeditpro-web-ui-shell')
assert.equal(doc.currentImplementationBranch, 'codex/backend-workflow-pipeline-continuation')
assert.equal(doc.currentSliceIntegratedIntoSourceRef, false)
assert.equal(doc.defaultBasePath, '/Reedkt/')
assert.equal(doc.githubPagesSignInUrl, 'https://yuzastudio6-cyber.github.io/Reedkt/sign-in')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_google_oauth_with_email_password_fallback')
assert.equal(doc.routerBasePathAware, true)
assert.equal(doc.spaFallbackIncluded, true)
assert.equal(doc.compiledSubpathPreviewVerified, true)
assert.equal(doc.compiledSubpathProviderHandoffVerified, true)
assert.equal(doc.googleOAuthCodeReady, true)
assert.equal(doc.googleOAuthProviderConfiguredRemotely, false)
assert.equal(doc.hostedCallbackVerified, false)
assert.equal(doc.hostedDeploymentVerified, false)
assert.equal(doc.existingLiveHostStatus, 'blocked_sign_in_surface_missing')
assert.equal(doc.hostedApiMode, 'mock')
assert.ok(doc.blockedSecrets?.includes('STAGING_SUPABASE_SERVICE_ROLE_KEY'))
assert.ok(doc.blockedSecrets?.includes('GOOGLE_CLIENT_SECRET'))
assert.equal(doc.nextGate, 'REVIEWED_SOURCE_INTEGRATION_SUPABASE_GOOGLE_PROVIDER_AND_HOSTED_CALLBACK_VERIFICATION')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combined = requiredFiles
  .filter((path) => path !== 'server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts')
  .map((path) => read(path))
  .join('\n')

assert.doesNotMatch(combined, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combined, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'app-internal-testing-pages-deploy-readiness',
  decision: doc.decision,
  sourceRef: doc.sourceRef,
  defaultBasePath: doc.defaultBasePath,
  githubPagesSignInUrl: doc.githubPagesSignInUrl,
  frontendAuthMode: doc.frontendAuthMode,
  googleOAuthCodeReady: doc.googleOAuthCodeReady,
  hostedDeploymentVerified: doc.hostedDeploymentVerified,
  nextGate: doc.nextGate,
  blockedScope: doc.blockedScope,
}, null, 2))
