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

assertMentions('src/main.tsx', ['import.meta.env.BASE_URL', 'BrowserRouter basename={routerBaseName}'])

const workflow = read('.github/workflows/app-internal-testing-pages-deploy.yml')
assertMentions('.github/workflows/app-internal-testing-pages-deploy.yml', [
  'workflow_dispatch',
  'DEPLOY_REEDITPRO_INTERNAL_TESTING_APP',
  'source_sha',
  '/Reedkt/',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_ANON_KEY',
  'VITE_REEDITPRO_API_MODE: mock',
  'npm run build -- --base=',
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
  blockedScope?: Record<string, boolean>
  blockedSecrets?: string[]
}

assert.equal(doc.decision, 'app_internal_testing_pages_deploy_readiness_passed_ready_for_manual_pages_workflow')
assert.equal(doc.sourceRef, 'codex/reeditpro-web-ui-shell')
assert.equal(doc.defaultBasePath, '/Reedkt/')
assert.equal(doc.githubPagesSignInUrl, 'https://yuzastudio6-cyber.github.io/Reedkt/sign-in')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_only')
assert.ok(doc.blockedSecrets?.includes('STAGING_SUPABASE_SERVICE_ROLE_KEY'))

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
  blockedScope: doc.blockedScope,
}, null, 2))
