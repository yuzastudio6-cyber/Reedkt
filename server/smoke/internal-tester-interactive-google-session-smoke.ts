import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const cliPath = 'server/cli/verify-interactive-google-session.ts'
const cli = readFileSync(join(root, cliPath), 'utf8')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}

assert.equal(existsSync(join(root, cliPath)), true)
assert.equal(
  packageJson.scripts?.['internal-testing:verify-interactive-google-session'],
  'tsx server/cli/verify-interactive-google-session.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-interactive-google-session'],
  'tsx server/smoke/internal-tester-interactive-google-session-smoke.ts',
)

for (const phrase of [
  'VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION',
  'REEDITPRO_EXPECTED_GOOGLE_EMAIL',
  'REEDITPRO_EXPECTED_SUPABASE_ORIGIN',
  'REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN',
  'headless: false',
  "getByTestId('google-sign-in')",
  "getByTestId('app-session-identity')",
  'https://accounts.google.com',
  "navigated.pathname === '/auth/v1/authorize'",
  "responseUrl.pathname === '/v1/projects'",
  'Google session',
  'protectedDashboardSurvivedReload',
  'authenticatedGatewayResponseObserved',
  "getByRole('button', { name: 'Sign out' })",
  'protectedRouteDeniedAfterSignOut',
  'credentialsEnteredByAutomation: false',
  'googleCredentialsRead: false',
  'browserStorageExported: false',
  'storageStateWritten: false',
  'traceRecorded: false',
  'screenshotRecorded: false',
  'serviceRoleUsed: false',
  'tokenPrinted: false',
  'passwordPrinted: false',
] as const) {
  assert.equal(cli.includes(phrase), true, `Interactive verifier should include ${phrase}`)
}

assert.doesNotMatch(cli, /signInWithPassword|INTERNAL_TESTER_PASSWORD|SUPABASE_SERVICE_ROLE_KEY|auth\.admin|service_role/i)
assert.doesNotMatch(cli, /storageState\s*[:(]|tracing\.|screenshot\s*\(|recordVideo|video\s*:/i)
assert.doesNotMatch(cli, /localStorage\.getItem|response\.(?:body|text|json)\(|request\(\)\.headers|page\.on\(['"]console/i)
assert.doesNotMatch(cli, /console\.log|console\.error/)

const tsxExecutable = join(root, 'node_modules', '.bin', 'tsx')
const baseEnv = { ...process.env }
for (const key of [
  'REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION',
  'REEDITPRO_HOSTED_APP_URL',
  'REEDITPRO_EXPECTED_SUPABASE_ORIGIN',
  'REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN',
  'REEDITPRO_EXPECTED_GOOGLE_EMAIL',
  'REEDITPRO_INTERACTIVE_GOOGLE_SESSION_TIMEOUT_SECONDS',
]) delete baseEnv[key]

const missingConfirmation = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: { ...baseEnv, CI: 'false' },
  encoding: 'utf8',
})
assert.equal(missingConfirmation.status, 1)
const missingResult = JSON.parse(missingConfirmation.stdout) as Record<string, unknown>
assert.equal(missingResult.decision, 'interactive_google_session_verification_blocked_missing_confirmation')
assert.equal(missingResult.credentialsEnteredByAutomation, false)
assert.equal(missingResult.tokenPrinted, false)

const ciBlocked = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...baseEnv,
    CI: 'true',
    REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION: 'VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION',
  },
  encoding: 'utf8',
})
assert.equal(ciBlocked.status, 1)
const ciResult = JSON.parse(ciBlocked.stdout) as Record<string, unknown>
assert.equal(ciResult.decision, 'interactive_google_session_verification_blocked_noninteractive_environment')
assert.equal(ciResult.interactiveUserActionRequired, true)
assert.equal(ciResult.googleCredentialsRead, false)

const invalidConfiguration = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...baseEnv,
    CI: 'false',
    REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION: 'VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION',
    REEDITPRO_HOSTED_APP_URL: 'https://attacker.example/',
    REEDITPRO_EXPECTED_SUPABASE_ORIGIN: 'https://fixture.supabase.co',
    REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN: 'https://fixture.gateway.dev',
    REEDITPRO_EXPECTED_GOOGLE_EMAIL: 'tester@example.com',
  },
  encoding: 'utf8',
})
assert.equal(invalidConfiguration.status, 1)
const invalidResult = JSON.parse(invalidConfiguration.stdout) as Record<string, unknown>
assert.equal(invalidResult.decision, 'interactive_google_session_verification_blocked_invalid_configuration')
assert.equal(invalidResult.browserStorageExported, false)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-interactive-google-session',
  checks: [
    'owner_local_headed_browser_required',
    'ci_execution_rejected',
    'exact_host_supabase_and_gateway_origins_required',
    'reeditpro_google_handoff_only_automated',
    'google_credentials_never_read_or_entered',
    'provider_callback_identity_reload_gateway_and_signout_evidence_required',
    'tokens_storage_state_traces_screenshots_and_video_not_exported',
  ],
}))
