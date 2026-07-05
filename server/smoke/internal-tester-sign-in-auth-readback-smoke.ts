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
  'server/cli/verify-internal-tester-auth-readback.ts',
  '.github/workflows/internal-tester-sign-in-auth-readback.yml',
  'docs/internal-tester-sign-in-auth-readback.md',
  'docs/internal-tester-sign-in-auth-readback.json',
  'server/smoke/internal-tester-sign-in-auth-readback-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:verify-auth-readback'],
  'tsx server/cli/verify-internal-tester-auth-readback.ts',
)
assert.equal(
  packageJson.scripts?.['internal-testing:verify-browser-sign-in'],
  'tsx server/cli/verify-internal-tester-browser-sign-in.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-sign-in-auth-readback'],
  'tsx server/smoke/internal-tester-sign-in-auth-readback-smoke.ts',
)

assertMentions('server/cli/verify-internal-tester-auth-readback.ts', [
  'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
  'REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_TESTER_EMAIL',
  'auth.admin.listUsers',
  "type ProfileIdentityColumn = 'user_id' | 'id'",
  "['user_id', 'id'] satisfies ProfileIdentityColumn[]",
  'profiles',
  'workspaces',
  'workspace_members',
  'authEmailConfirmed',
  'sanitizeForOutput',
  'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test',
  'internal_tester_sign_in_auth_readback_blocked_workspace_membership_missing',
])

const cli = read('server/cli/verify-internal-tester-auth-readback.ts')
assert.doesNotMatch(cli, /\n\s*\.(insert|upsert|update|delete|rpc)\s*\(/)
assert.doesNotMatch(cli, /inviteUserByEmail|createUser|INTERNAL_TESTER_PASSWORD|PASSWORD_INPUT|console\.log/i)
assert.doesNotMatch(cli, /VITE_SUPABASE|import\.meta\.env|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport/i)
assert.ok(cli.includes('process.stdout.write(`${JSON.stringify(result, null, 2)}\\n`)'))
assert.match(cli, /redacted-jwt/)
assert.match(cli, /redacted/)

assertMentions('.github/workflows/internal-tester-sign-in-auth-readback.yml', [
  'workflow_dispatch',
  'confirm_internal_tester_auth_readback',
  'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
  'tester_email',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_SERVICE_ROLE_KEY',
  'npm run internal-testing:verify-auth-readback',
])

const workflow = read('.github/workflows/internal-tester-sign-in-auth-readback.yml')
assert.doesNotMatch(workflow, /password:|allow_staging_writes|REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES/i)
assert.doesNotMatch(workflow, /\bVITE_|deploy-pages|docker build|apt-get|gcloud|worker:run|tools:check|smoke:prod-real|supabase db|supabase migration|createSignedUrl/i)
assert.doesNotMatch(workflow, /STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/i)
assert.match(workflow, /test "\$\{REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK\}" = "VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK"/)
assert.match(workflow, /node-version: 24/)

const doc = JSON.parse(read('docs/internal-tester-sign-in-auth-readback.json')) as {
  decision?: string
  workflow?: string
  cli?: string
  packageScripts?: Record<string, string>
  requiredConfirmation?: Record<string, string>
  readbackTargets?: string[]
  supportedProfileIdentityColumns?: string[]
  authReadinessOutput?: string[]
  blockedScope?: Record<string, boolean>
  nextGate?: string
}

assert.equal(
  doc.decision,
  'internal_tester_sign_in_auth_readback_gate_passed_ready_for_manual_readback_workflow',
)
assert.equal(doc.workflow, '.github/workflows/internal-tester-sign-in-auth-readback.yml')
assert.equal(doc.cli, 'server/cli/verify-internal-tester-auth-readback.ts')
assert.equal(
  doc.requiredConfirmation?.REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK,
  'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK',
)
assert.deepEqual(doc.readbackTargets, ['auth.users', 'profiles', 'workspaces', 'workspace_members'])
assert.deepEqual(doc.supportedProfileIdentityColumns, ['user_id', 'id'])
assert.ok(doc.authReadinessOutput?.includes('authEmailConfirmed'))
assert.equal(doc.packageScripts?.browserSignIn, 'internal-testing:verify-browser-sign-in')
assert.equal(doc.nextGate, 'INTERNAL_TESTER_BROWSER_SIGN_IN_VERIFICATION')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combinedDocs = [
  read('docs/internal-tester-sign-in-auth-readback.md'),
  read('docs/internal-tester-sign-in-auth-readback.json'),
].join('\n')
assert.doesNotMatch(combinedDocs, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]/i)
assert.doesNotMatch(combinedDocs, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combinedDocs, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-sign-in-auth-readback',
  decision: doc.decision,
  workflow: doc.workflow,
  cli: doc.cli,
  readbackTargets: doc.readbackTargets,
  supportedProfileIdentityColumns: doc.supportedProfileIdentityColumns,
  nextGate: doc.nextGate,
}, null, 2))
