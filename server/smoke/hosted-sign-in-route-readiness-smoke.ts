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

const requiredFiles = [
  'server/cli/verify-hosted-sign-in-route-readiness.ts',
  'server/smoke/hosted-sign-in-route-readiness-smoke.ts',
  'docs/hosted-sign-in-route-readiness.md',
  'docs/hosted-sign-in-route-readiness.json',
  'docs/app-internal-testing-pages-deploy-readiness.md',
  'docs/app-sign-in-entrypoint.md',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:verify-hosted-sign-in-route'],
  'tsx server/cli/verify-hosted-sign-in-route-readiness.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:hosted-sign-in-route-readiness'],
  'tsx server/smoke/hosted-sign-in-route-readiness-smoke.ts',
)

const cli = read('server/cli/verify-hosted-sign-in-route-readiness.ts')
for (const phrase of [
  'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE',
  'REEDITPRO_HOSTED_APP_URL',
  'PLAYWRIGHT_HOSTED_APP_BASE_URL',
  'sign-in?redirect=/internal-testing',
  'sign in to test the reeditpro app',
  'frontend anon auth only',
  'no service-role secrets',
  'no tool execution on sign-in',
  'Open testing',
  'credentialsSubmitted: false',
  'serviceRoleUsed: false',
  'tokenPrinted: false',
  'passwordPrinted: false',
  'hosted_sign_in_route_readiness_passed_ready_for_browser_sign_in_verification',
  'hosted_sign_in_route_readiness_blocked_unreachable',
  'hosted_sign_in_route_readiness_blocked_supabase_public_env_missing',
]) {
  assert.match(cli, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `CLI should include ${phrase}`)
}

assert.doesNotMatch(cli, /\.fill\(|signInWithPassword|INTERNAL_TESTER_PASSWORD|SERVICE_ROLE|service_role|auth\.admin|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport|gcloud|supabase db/i)
assert.doesNotMatch(cli, /console\.log\((?:password|.*access_token|.*refresh_token)/i)

const docs = read('docs/hosted-sign-in-route-readiness.md')
for (const phrase of [
  'internal-testing:verify-hosted-sign-in-route',
  'REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS',
  'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE',
  'REEDITPRO_HOSTED_APP_URL',
  'REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED',
  'does not submit credentials',
  'does not use service-role',
  'does not upload media',
  'app.reeditpro.com',
  'GitHub Pages',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `docs should mention ${phrase}`)
}

const docJson = JSON.parse(read('docs/hosted-sign-in-route-readiness.json')) as {
  decision?: string
  command?: string
  requiredEnv?: string[]
  optionalEnv?: string[]
  blockedScope?: Record<string, boolean>
  nextGate?: string
}
assert.equal(docJson.decision, 'hosted_sign_in_route_readiness_passed_ready_for_browser_sign_in_verification')
assert.equal(docJson.command, 'npm run internal-testing:verify-hosted-sign-in-route')
assert.ok(docJson.requiredEnv?.includes('REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS'))
assert.ok(docJson.requiredEnv?.includes('REEDITPRO_HOSTED_APP_URL'))
assert.ok(docJson.optionalEnv?.includes('REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED'))
assert.equal(docJson.nextGate, 'INTERNAL_TESTER_BROWSER_SIGN_IN_VERIFICATION')
for (const [scope, value] of Object.entries(docJson.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const deployDocs = read('docs/app-internal-testing-pages-deploy-readiness.md')
assert.match(deployDocs, /internal-testing:verify-hosted-sign-in-route/)
assert.match(deployDocs, /Until `app\.reeditpro\.com` DNS is configured/)

const signInDocs = read('docs/app-sign-in-entrypoint.md')
assert.match(signInDocs, /internal-testing:verify-hosted-sign-in-route/)
assert.match(signInDocs, /hosted sign-in route verifier/)

console.log(JSON.stringify({
  ok: true,
  smoke: 'hosted-sign-in-route-readiness',
  decision: docJson.decision,
  command: docJson.command,
  nextGate: docJson.nextGate,
}, null, 2))
