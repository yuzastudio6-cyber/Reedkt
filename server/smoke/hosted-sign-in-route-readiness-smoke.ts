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
  'sign-in?returnTo=/dashboard',
  'pick up exactly where you left off',
  'continue to reeditpro',
  'google-sign-in',
  'auth-password-toggle',
  'credentialsSubmitted: false',
  'providerRedirectFollowed: false',
  'serviceRoleUsed: false',
  'tokenPrinted: false',
  'passwordPrinted: false',
  'hosted_sign_in_route_readiness_passed_ready_for_interactive_google_session_verification',
  'hosted_sign_in_route_readiness_blocked_unreachable',
  'hosted_sign_in_route_readiness_blocked_google_primary_action_missing',
  'hosted_sign_in_route_readiness_blocked_supabase_public_env_missing',
]) {
  assert.match(cli, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `CLI should include ${phrase}`)
}

assert.doesNotMatch(cli, /\.fill\(|signInWithPassword|INTERNAL_TESTER_PASSWORD|auth\.admin|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport|gcloud|supabase db/i)
assert.doesNotMatch(cli, /console\.log\((?:password|.*access_token|.*refresh_token)/i)
assert.match(cli, /finally\s*{[\s\S]*browser\.close/)

const docs = read('docs/hosted-sign-in-route-readiness.md')
for (const phrase of [
  'internal-testing:verify-hosted-sign-in-route',
  'REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS',
  'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE',
  'REEDITPRO_HOSTED_APP_URL',
  'REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED',
  'does not click Google',
  'use service-role access',
  'app.reeditpro.com',
  'GitHub Pages',
  'interactive Google sign-in',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `docs should mention ${phrase}`)
}

const docJson = JSON.parse(read('docs/hosted-sign-in-route-readiness.json')) as {
  decision?: string
  command?: string
  requiredEnv?: string[]
  optionalEnv?: string[]
  liveHostVerified?: boolean
  liveHostStatus?: string
  compiledSubpathPreviewVerified?: boolean
  googleProviderRedirectFollowed?: boolean
  googleSessionVerified?: boolean
  blockedScope?: Record<string, boolean>
  nextGate?: string
}
assert.equal(docJson.decision, 'hosted_sign_in_route_readiness_contract_ready_live_host_pending')
assert.equal(docJson.command, 'npm run internal-testing:verify-hosted-sign-in-route')
assert.ok(docJson.requiredEnv?.includes('REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS'))
assert.ok(docJson.requiredEnv?.includes('REEDITPRO_HOSTED_APP_URL'))
assert.ok(docJson.optionalEnv?.includes('REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED'))
assert.equal(docJson.liveHostVerified, false)
assert.equal(docJson.liveHostStatus, 'blocked_sign_in_surface_missing')
assert.equal(docJson.compiledSubpathPreviewVerified, true)
assert.equal(docJson.googleProviderRedirectFollowed, false)
assert.equal(docJson.googleSessionVerified, false)
assert.equal(docJson.nextGate, 'INTERACTIVE_GOOGLE_SESSION_CALLBACK_RELOAD_AND_SIGN_OUT_READBACK')
for (const [scope, value] of Object.entries(docJson.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const deployDocs = read('docs/app-internal-testing-pages-deploy-readiness.md')
assert.match(deployDocs, /internal-testing:verify-hosted-sign-in-route/)
assert.match(deployDocs, /Until `app\.reeditpro\.com` DNS is configured/)

const signInDocs = read('docs/app-sign-in-entrypoint.md')
assert.match(signInDocs, /hosted route verifier/)
assert.match(signInDocs, /real Google browser sign-in/)

console.log(JSON.stringify({
  ok: true,
  smoke: 'hosted-sign-in-route-readiness',
  decision: docJson.decision,
  command: docJson.command,
  liveHostVerified: docJson.liveHostVerified,
  nextGate: docJson.nextGate,
}, null, 2))
