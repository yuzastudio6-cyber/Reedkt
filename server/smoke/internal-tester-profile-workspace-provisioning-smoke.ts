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
  'server/cli/provision-internal-tester.ts',
  '.github/workflows/internal-tester-profile-workspace-provisioning.yml',
  'docs/internal-tester-profile-workspace-provisioning.md',
  'docs/internal-tester-profile-workspace-provisioning.json',
  'docs/auth-profile-workspace-bootstrap.md',
  'server/smoke/internal-tester-profile-workspace-provisioning-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:provision-tester'],
  'tsx server/cli/provision-internal-tester.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-profile-workspace-provisioning'],
  'tsx server/smoke/internal-tester-profile-workspace-provisioning-smoke.ts',
)

assertMentions('server/cli/provision-internal-tester.ts', [
  'PROVISION_REEDITPRO_INTERNAL_TESTER',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_TESTER_EMAIL',
  'inviteUserByEmail',
  'auth.admin.listUsers',
  "type ProfileIdentityColumn = 'user_id' | 'id'",
  "['user_id', 'id'] satisfies ProfileIdentityColumn[]",
  'profiles',
  'workspaces',
  'workspace_members',
  'sanitizeForOutput',
  'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback',
  'internal_tester_backend_profile_workspace_provisioning_blocked_auth_user_missing',
])

const cli = read('server/cli/provision-internal-tester.ts')
assert.doesNotMatch(cli, /INTERNAL_TESTER_PASSWORD|PASSWORD_INPUT|createUser\s*\([^)]*password|console\.log/i)
assert.doesNotMatch(cli, /VITE_SUPABASE|import\.meta\.env|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport/i)
assert.ok(cli.includes('process.stdout.write(`${JSON.stringify(result, null, 2)}\\n`)'))
assert.match(cli, /redacted-jwt/)
assert.match(cli, /redacted/)

assertMentions('.github/workflows/internal-tester-profile-workspace-provisioning.yml', [
  'workflow_dispatch',
  'confirm_internal_tester_provisioning',
  'allow_staging_writes',
  'PROVISION_REEDITPRO_INTERNAL_TESTER',
  'tester_email',
  'invite_if_missing',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_SERVICE_ROLE_KEY',
  'npm run internal-testing:provision-tester',
])

const workflow = read('.github/workflows/internal-tester-profile-workspace-provisioning.yml')
assert.doesNotMatch(workflow, /password:/i)
assert.doesNotMatch(workflow, /\bVITE_|deploy-pages|docker build|apt-get|gcloud|worker:run|tools:check|smoke:prod-real|supabase db|supabase migration|createSignedUrl/i)
assert.doesNotMatch(workflow, /STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/i)
assert.match(workflow, /test "\$\{REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING\}" = "PROVISION_REEDITPRO_INTERNAL_TESTER"/)
assert.match(workflow, /test "\$\{REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES\}" = "true"/)
assert.match(workflow, /node-version: 24/)

const doc = JSON.parse(read('docs/internal-tester-profile-workspace-provisioning.json')) as {
  decision?: string
  workflow?: string
  cli?: string
  requiredConfirmations?: Record<string, string>
  provisionedTables?: string[]
  supportedProfileIdentityColumns?: string[]
  authBehavior?: Record<string, string>
  blockedScope?: Record<string, boolean>
  nextGate?: string
}

assert.equal(
  doc.decision,
  'internal_tester_profile_workspace_provisioning_gate_passed_ready_for_manual_staging_workflow',
)
assert.equal(doc.workflow, '.github/workflows/internal-tester-profile-workspace-provisioning.yml')
assert.equal(doc.cli, 'server/cli/provision-internal-tester.ts')
assert.equal(
  doc.requiredConfirmations?.REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING,
  'PROVISION_REEDITPRO_INTERNAL_TESTER',
)
assert.equal(doc.requiredConfirmations?.REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES, 'true')
assert.deepEqual(doc.provisionedTables, ['profiles', 'workspaces', 'workspace_members'])
assert.deepEqual(doc.supportedProfileIdentityColumns, ['user_id', 'id'])
assert.equal(doc.authBehavior?.passwordHandling, 'no_password_input_or_output')
assert.equal(doc.nextGate, 'INTERNAL_TESTER_SIGN_IN_AUTH_READBACK')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

assertMentions('docs/auth-profile-workspace-bootstrap.md', [
  'guarded backend-only GitHub Actions workflow',
  'No always-on backend service-role API',
])

const combinedDocs = [
  read('docs/internal-tester-profile-workspace-provisioning.md'),
  read('docs/internal-tester-profile-workspace-provisioning.json'),
  read('docs/auth-profile-workspace-bootstrap.md'),
].join('\n')
assert.doesNotMatch(combinedDocs, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]/i)
assert.doesNotMatch(combinedDocs, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combinedDocs, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-profile-workspace-provisioning',
  decision: doc.decision,
  workflow: doc.workflow,
  cli: doc.cli,
  provisionedTables: doc.provisionedTables,
  supportedProfileIdentityColumns: doc.supportedProfileIdentityColumns,
  nextGate: doc.nextGate,
}, null, 2))
