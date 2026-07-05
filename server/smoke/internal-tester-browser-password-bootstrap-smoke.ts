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
  'server/cli/bootstrap-internal-tester-browser-password.ts',
  '.github/workflows/internal-tester-browser-password-bootstrap.yml',
  'docs/internal-tester-browser-password-bootstrap.md',
  'docs/internal-tester-browser-password-bootstrap.json',
  'server/smoke/internal-tester-browser-password-bootstrap-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['internal-testing:bootstrap-tester-password'],
  'tsx server/cli/bootstrap-internal-tester-browser-password.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-browser-password-bootstrap'],
  'tsx server/smoke/internal-tester-browser-password-bootstrap-smoke.ts',
)

assertMentions('server/cli/bootstrap-internal-tester-browser-password.ts', [
  'BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD',
  'REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_PASSWORD_BOOTSTRAP',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_TESTER_EMAIL',
  'INTERNAL_TESTER_PASSWORD',
  'auth.admin.listUsers',
  'auth.admin.updateUserById',
  'auth.admin.createUser',
  'email_confirm: true',
  'passwordPrinted: false',
  'tokenPrinted: false',
  'sanitizeForOutput',
  'internal_tester_browser_password_bootstrap_passed_ready_for_profile_workspace_provisioning',
])

const cli = read('server/cli/bootstrap-internal-tester-browser-password.ts')
assert.doesNotMatch(cli, /console\.log|createSignedUrl|stripe|runWorker|dispatchWorker|renderExport|VITE_SUPABASE|import\.meta\.env/i)
assert.ok(cli.includes('process.stdout.write(`${JSON.stringify(result, null, 2)}\\n`)'))
assert.match(cli, /redacted-jwt/)
assert.match(cli, /\[internal-tester-password\]/)
assert.doesNotMatch(cli, /passwordFingerprint|passwordHash|passwordDigest/i)

assertMentions('.github/workflows/internal-tester-browser-password-bootstrap.yml', [
  'workflow_dispatch',
  'confirm_internal_tester_browser_password_bootstrap',
  'allow_staging_writes',
  'BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD',
  'tester_email',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_SERVICE_ROLE_KEY',
  'STAGING_INTERNAL_TESTER_PASSWORD',
  'npm run internal-testing:bootstrap-tester-password',
])

const workflow = read('.github/workflows/internal-tester-browser-password-bootstrap.yml')
assert.doesNotMatch(workflow, /\bVITE_|deploy-pages|docker build|apt-get|gcloud|worker:run|tools:check|smoke:prod-real|supabase db|supabase migration|createSignedUrl/i)
assert.doesNotMatch(workflow, /STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET/i)
assert.match(workflow, /test "\$\{REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_PASSWORD_BOOTSTRAP\}" = "BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD"/)
assert.match(workflow, /test "\$\{REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES\}" = "true"/)
assert.match(workflow, /node-version: 24/)

const doc = JSON.parse(read('docs/internal-tester-browser-password-bootstrap.json')) as {
  decision?: string
  workflow?: string
  cli?: string
  packageScripts?: Record<string, string>
  requiredConfirmations?: Record<string, string>
  requiredSecrets?: string[]
  authBehavior?: Record<string, string>
  blockedScope?: Record<string, boolean>
  nextGate?: string
}

assert.equal(
  doc.decision,
  'internal_tester_browser_password_bootstrap_gate_passed_ready_for_manual_staging_workflow',
)
assert.equal(doc.workflow, '.github/workflows/internal-tester-browser-password-bootstrap.yml')
assert.equal(doc.cli, 'server/cli/bootstrap-internal-tester-browser-password.ts')
assert.equal(doc.packageScripts?.bootstrapPassword, 'internal-testing:bootstrap-tester-password')
assert.equal(doc.requiredConfirmations?.REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_PASSWORD_BOOTSTRAP, 'BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD')
assert.equal(doc.requiredConfirmations?.REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES, 'true')
assert.deepEqual(doc.requiredSecrets, ['STAGING_SUPABASE_URL', 'STAGING_SUPABASE_SERVICE_ROLE_KEY', 'STAGING_INTERNAL_TESTER_PASSWORD'])
assert.equal(doc.authBehavior?.passwordSource, 'github_actions_repository_secret_only')
assert.equal(doc.authBehavior?.passwordOutput, 'never_printed')
assert.equal(doc.nextGate, 'INTERNAL_TESTER_PROFILE_WORKSPACE_PROVISIONING')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combinedDocs = [
  read('docs/internal-tester-browser-password-bootstrap.md'),
  read('docs/internal-tester-browser-password-bootstrap.json'),
].join('\n')
assert.doesNotMatch(combinedDocs, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]/i)
assert.doesNotMatch(combinedDocs, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combinedDocs, /STAGING_INTERNAL_TESTER_PASSWORD\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combinedDocs, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-browser-password-bootstrap',
  decision: doc.decision,
  workflow: doc.workflow,
  cli: doc.cli,
  nextGate: doc.nextGate,
}, null, 2))
