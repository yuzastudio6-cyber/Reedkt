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
  'src/backend/auth/profile-bootstrap-service.ts',
  'docs/auth-profile-schema-compatibility.md',
  'docs/auth-profile-schema-compatibility.json',
  'server/smoke/auth-profile-schema-compatibility-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:auth-profile-schema-compatibility'],
  'tsx server/smoke/auth-profile-schema-compatibility-smoke.ts',
)

const service = read('src/backend/auth/profile-bootstrap-service.ts')

assertMentions('src/backend/auth/profile-bootstrap-service.ts', [
  "type ProfileIdentityColumn = 'user_id' | 'id'",
  "PROFILE_IDENTITY_COLUMNS: ProfileIdentityColumn[] = ['user_id', 'id']",
  'isMissingColumnError',
  'findProfileByIdentityColumn',
  'profileInsertVariants',
  'profileIdFromProfile',
  'backend_required',
])

assert.match(service, /\.eq\(column, currentUser\.id\)/, 'profile updates should use the active compatibility column')
assert.match(service, /\.eq\(column, userId\)/, 'profile lookup should use the active compatibility column')
assert.match(service, /isBackendRequiredError\(lastError\)/, 'RLS/backend-required errors should remain fail-closed')
assert.doesNotMatch(service, /SUPABASE_SERVICE_ROLE_KEY|service_role|createClient\([^)]*service/i)
assert.doesNotMatch(service, /supabase\.rpc|createSignedUrl|worker:run|tools:check/i)

const doc = JSON.parse(read('docs/auth-profile-schema-compatibility.json')) as {
  decision?: string
  supportedProfileIdentityColumns?: string[]
  rlsHandling?: string
  frontendAuthMode?: string
  blockedScope?: Record<string, boolean>
  nextGate?: string
}

assert.equal(doc.decision, 'auth_profile_schema_compatibility_passed_ready_for_internal_tester_bootstrap_readback')
assert.deepEqual(doc.supportedProfileIdentityColumns, ['user_id', 'id'])
assert.equal(doc.rlsHandling, 'backend_required_remains_fail_closed')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_only')
assert.equal(doc.nextGate, 'INTERNAL_TESTER_BACKEND_PROFILE_WORKSPACE_PROVISIONING_READBACK')

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combined = requiredFiles
  .filter((path) => path !== 'server/smoke/auth-profile-schema-compatibility-smoke.ts')
  .map((path) => read(path))
  .join('\n')

assert.doesNotMatch(combined, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combined, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'auth-profile-schema-compatibility',
  decision: doc.decision,
  supportedProfileIdentityColumns: doc.supportedProfileIdentityColumns,
  rlsHandling: doc.rlsHandling,
  nextGate: doc.nextGate,
}, null, 2))
