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
  '.github/workflows/internal-tester-browser-sign-in-verification.yml',
  'server/cli/verify-internal-tester-browser-sign-in.ts',
  'server/smoke/internal-tester-browser-sign-in-verification-smoke.ts',
  'docs/internal-tester-browser-sign-in-verification.md',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:verify-browser-sign-in'],
  'tsx server/cli/verify-internal-tester-browser-sign-in.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-browser-sign-in-verification'],
  'tsx server/smoke/internal-tester-browser-sign-in-verification-smoke.ts',
)

const cli = read('server/cli/verify-internal-tester-browser-sign-in.ts')
for (const phrase of [
  'VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'INTERNAL_TESTER_EMAIL',
  'INTERNAL_TESTER_PASSWORD',
  'signInWithPassword',
  'supabase_anon_browser_equivalent',
  'passwordPrinted: false',
  'tokenPrinted: false',
  'serviceRoleUsed: false',
  'internal_tester_browser_sign_in_verification_passed_ready_for_internal_testing_route',
  'internal_tester_browser_sign_in_verification_blocked_email_not_confirmed',
]) {
  assert.match(cli, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `CLI should include ${phrase}`)
}
assert.doesNotMatch(cli, /SERVICE_ROLE|service_role|auth\.admin|listUsers|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport|gcloud|supabase db/i)
assert.doesNotMatch(cli, /console\.log\((?:password|data\.session|.*access_token|.*refresh_token)/i)

const docs = read('docs/internal-tester-browser-sign-in-verification.md')
for (const phrase of [
  'internal-testing:verify-browser-sign-in',
  '.github/workflows/internal-tester-browser-sign-in-verification.yml',
  'STAGING_INTERNAL_TESTER_PASSWORD',
  'REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_SIGN_IN',
  'VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN',
  'INTERNAL_TESTER_EMAIL',
  'INTERNAL_TESTER_PASSWORD',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'browser-safe Supabase session',
  'does not print tokens',
  'does not use service-role',
  'does not upload media',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `docs should mention ${phrase}`)
}

const appSignInDocs = read('docs/app-sign-in-entrypoint.md')
assert.match(appSignInDocs, /internal-testing:verify-browser-sign-in/)
assert.match(appSignInDocs, /browser-safe Supabase sign-in verifier/)

const workflow = read('.github/workflows/internal-tester-browser-sign-in-verification.yml')
for (const phrase of [
  'workflow_dispatch',
  'VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN',
  'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_ANON_KEY',
  'STAGING_INTERNAL_TESTER_PASSWORD',
  'internal-testing:verify-hosted-sign-in-route',
  'internal-testing:verify-browser-sign-in',
]) {
  assert.match(workflow, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `workflow should include ${phrase}`)
}
assert.doesNotMatch(workflow, /STAGING_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|service_role|auth\.admin|createSignedUrl|supabase db|gcloud|docker build|worker:run|smoke:prod-real/i)
assert.doesNotMatch(workflow, /echo\s+["']?\$\{?INTERNAL_TESTER_PASSWORD|console\.log|cat\s+.*PASSWORD/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'browser_sign_in_verifier_registered',
    'github_actions_secret_backed_verifier_registered',
    'anon_only_auth_path',
    'confirmation_required',
    'password_and_tokens_not_printed',
    'service_role_not_used',
    'docs_updated',
  ],
}))
