import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = join(directory, '..', '..')
const manifestPath = join(directory, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

assert(manifest.schemaVersion === 'reeditpro-canonical-v3-local-manifest-v1', 'manifest_schema_invalid')
assert(manifest.executionScope === 'local_only', 'manifest_scope_invalid')
assert(manifest.rawMigrationBaselineStatus === 'blocked_by_parallel_foundations', 'raw_baseline_status_invalid')
assert(manifest.remoteMutationAllowed === false, 'remote_mutation_must_be_false')
assert(manifest.productionAuthority === false, 'production_authority_must_be_false')
assert(Array.isArray(manifest.files) && manifest.files.length >= 9, 'manifest_file_set_invalid')
assert(Array.isArray(manifest.repositoryFiles), 'repository_manifest_file_set_invalid')

const expectedRepositoryFiles = [
  'docs/canonical-edit-reference-application-preparation-verification-2026-07-21.md',
  'docs/canonical-edit-reference-mounted-long-form-runtime-port-verification-2026-07-21.md',
  'docs/canonical-exact-edit-planning-authority-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-recovery-verification-2026-07-21.md',
  'docs/canonical-v3-local-exact-edit-apply-authority-read-verification-2026-07-21.md',
  'docs/canonical-v3-local-exact-edit-atomic-apply-verification-2026-07-21.md',
  'docs/edit-preferences-mounted-atomic-apply-recovery-2026-07-21.md',
  'package.json',
  'server/app.ts',
  'server/edit-references/canonical-exact-edit-planning-authority-boundary.ts',
  'server/edit-references/controlled-local-edit-reference-application-preparation-fixture.ts',
  'server/edit-references/edit-reference-local-supabase-application-preparation-port.ts',
  'server/edit-references/edit-reference-local-supabase-http-rpc-client.ts',
  'server/edit-references/edit-reference-local-supabase-rpc-adapter.ts',
  'server/edit-references/edit-reference-production-application-preparation-boundary.ts',
  'server/edit-references/edit-reference-production-exact-edit-apply-boundary.ts',
  'server/edit-references/edit-reference-production-readiness.ts',
  'server/routes/exact-edit-preference-routes.ts',
  'server/routes/route-helpers.ts',
  'server/services/canonical-planning-handoff-service.ts',
  'server/services/edit-reference-application-preparation-runtime-port.ts',
  'server/services/edit-reference-application-preparation-service.ts',
  'server/services/edit-reference-production-long-form-runtime-port.ts',
  'server/services/edit-reference-service.ts',
  'server/services/edit-reference-target-video-understanding-service.ts',
  'server/services/planning-exact-edit-preference-authority-port.ts',
  'server/services/planning-exact-edit-preference-authority-service.ts',
  'server/services/planning-input-authority-binding-service.ts',
  'server/smoke/canonical-planning-publication-frontend-client-smoke.ts',
  'server/smoke/canonical-private-tool-dispatch-authority-smoke.ts',
  'server/smoke/canonical-professional-long-form-cross-chunk-color-smoke.ts',
  'server/smoke/canonical-professional-long-form-post-approval-smoke.ts',
  'server/smoke/edit-planning-authority-smoke.ts',
  'server/smoke/edit-reference-local-supabase-application-preparation-smoke.ts',
  'server/smoke/edit-reference-local-supabase-http-rpc-smoke.ts',
  'server/smoke/edit-reference-local-supabase-rpc-adapter-smoke.ts',
  'server/smoke/edit-reference-mounted-long-form-runtime-port-smoke.ts',
  'server/smoke/edit-reference-production-readiness-smoke.ts',
  'server/smoke/planning-exact-edit-preference-authority-port-smoke.ts',
  'server/types.ts',
  'server/validation/canonical-exact-edit-planning-authority-schemas.ts',
  'server/validation/edit-planning-authority-schemas.ts',
  'server/validation/edit-reference-application-preparation-schemas.ts',
  'server/validation/planning-input-authority-binding-schemas.ts',
  'src/backend/api/routes/edit-planning-api-routes.ts',
  'src/components/editor/ChatNativeEditor.tsx',
  'src/components/editor/CurrentEditPreferencesWorkspace.tsx',
  'src/lib/canonical-planning-draft.ts',
  'src/lib/canonical-planning-publication-client.ts',
  'src/lib/current-edit-reference-application-ui.ts',
  'src/lib/edit-reference-application-preparation-client.ts',
  'src/lib/project-edit-session-edit-reference-integration.ts',
  'src/types/canonical-exact-edit-planning-authority.ts',
  'src/types/edit-reference-production-application-preparation-api.ts',
  'src/types/edit-reference-production-exact-edit-apply-api.ts',
  'src/types/reeditpro.ts',
  'tests/e2e/edit-preferences-atomic-api-server.ts',
  'tests/e2e/edit-preferences-current-edit.spec.ts',
  'tests/e2e/edit-reference-canonical-real-file-flow.spec.ts',
  'tests/e2e/playwright.current-edit-preferences-atomic.config.ts',
  'tests/e2e/playwright.edit-reference-canonical-real-file.config.ts',
]
const actualRepositoryFiles = manifest.repositoryFiles
  .map((entry) => entry.path)
  .sort()
assert(equalArrays(actualRepositoryFiles, expectedRepositoryFiles), 'repository_manifest_file_set_invalid')

const expectedMigrations = [
  '202607210001_identity_and_exact_edit_authority.sql',
  '202607210002_edit_reference_v6_schema.sql',
  '202607210003_edit_reference_v6_security_and_rpcs.sql',
  '202607210004_exact_edit_atomic_apply.sql',
  '202607210005_exact_edit_apply_authority_read.sql',
  '202607210006_canonical_exact_edit_planning_authority.sql',
  '202607210007_edit_reference_application_preparation.sql',
]
const actualMigrations = readdirSync(join(directory, 'supabase', 'migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort()
assert(equalArrays(actualMigrations, expectedMigrations), 'migration_chain_changed')

const expectedRecoveryDataTables = readFileSync(
  join(directory, 'expected-recovery-data-tables.txt'),
  'utf8',
).trim().split('\n')
assert(expectedRecoveryDataTables.length === 41, 'recovery_table_count_invalid')
assert(
  equalArrays(expectedRecoveryDataTables, [...expectedRecoveryDataTables].sort()),
  'recovery_table_order_invalid',
)
assert(
  new Set(expectedRecoveryDataTables).size === expectedRecoveryDataTables.length,
  'recovery_table_duplicate',
)
assert(expectedRecoveryDataTables[0] === 'auth.users', 'recovery_auth_users_missing')

for (const entry of manifest.files) {
  assert(typeof entry.path === 'string' && !entry.path.startsWith('/') && !entry.path.includes('..'), 'manifest_path_invalid')
  assert(/^[a-f0-9]{64}$/.test(entry.sha256), `manifest_digest_invalid:${entry.path}`)
  const absolutePath = join(directory, entry.path)
  const digest = createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
  assert(digest === entry.sha256, `manifest_digest_mismatch:${entry.path}`)
}
for (const entry of manifest.repositoryFiles) {
  assert(typeof entry.path === 'string' && !entry.path.startsWith('/') && !entry.path.includes('..'), 'repository_manifest_path_invalid')
  assert(/^[a-f0-9]{64}$/.test(entry.sha256), `repository_manifest_digest_invalid:${entry.path}`)
  const absolutePath = join(repositoryRoot, entry.path)
  const digest = createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
  assert(digest === entry.sha256, `repository_manifest_digest_mismatch:${entry.path}`)
}

const config = readFileSync(join(directory, 'supabase', 'config.toml'), 'utf8')
assert(config.includes('project_id = "reeditpro-canonical-v3-local"'), 'local_project_id_invalid')
assert(config.includes('port = 57432'), 'local_database_port_invalid')
assert(!/supabase\.co|project_ref|access_token/i.test(config), 'remote_config_material_forbidden')

const recoveryRunner = readFileSync(
  join(directory, 'run-local-recovery-verification.sh'),
  'utf8',
)
for (const requiredToken of [
  'unset SUPABASE_ACCESS_TOKEN',
  'Refusing non-local canonical V3 recovery database URL.',
  'pg_dump',
  'pg_restore',
  'single-transaction',
  'remoteMutationAllowed',
  'productionAuthority',
]) assert(recoveryRunner.includes(requiredToken), `recovery_runner_contract_missing:${requiredToken}`)
for (const forbiddenPattern of [
  /supabase\s+link/i,
  /supabase\s+db\s+push/i,
  /https:\/\/[^\s'";]+\.supabase\.co/i,
]) assert(!forbiddenPattern.test(recoveryRunner), `recovery_runner_remote_action_forbidden:${forbiddenPattern}`)

const migrationSource = expectedMigrations
  .map((name) => readFileSync(join(directory, 'supabase', 'migrations', name), 'utf8'))
  .join('\n')
for (const requiredToken of [
  'force row level security',
  'mutate_edit_reference_application_lifecycle_v3',
  'apply_exact_edit_preferences_and_reference_v1',
  'read_exact_edit_apply_authority_v1',
  'read_exact_edit_planning_authority_v1',
  'record_exact_edit_planning_evidence_v1',
  'prepare_edit_reference_application_v1',
  'read_exact_edit_reference_application_state_v2',
  'assert_preference_application_plan_current_v1',
  'reserve_edit_reference_study_chat_run_v1',
  'authorize_edit_reference_study_chat_route_attempt_v1',
  'enqueue_edit_reference_long_form_study_v1',
  'recover_expired_edit_reference_long_form_lease_v1',
  'customerCreditsMutated',
  'serviceFeeIncluded',
]) {
  assert(migrationSource.includes(requiredToken), `required_contract_missing:${requiredToken}`)
}
for (const forbiddenPattern of [
  /supabase\s+link/i,
  /supabase\s+db\s+push/i,
  /https:\/\/[^\s'";]+\.supabase\.co/i,
  /create\s+extension\s+(http|pg_net)/i,
]) {
  assert(!forbiddenPattern.test(migrationSource), `forbidden_remote_contract:${forbiddenPattern}`)
}

const appleDouble = walk(directory).filter((path) => path.split('/').some((name) => name.startsWith('._')))
assert(appleDouble.length === 0, 'appledouble_file_present')

const rawMigrationDiff = execFileSync(
  'git',
  ['diff', '--name-only', '--', 'supabase/migrations'],
  { cwd: repositoryRoot, encoding: 'utf8' },
).trim()
assert(rawMigrationDiff.length === 0, 'historical_raw_migration_changed')

console.log(JSON.stringify({
  ok: true,
  schemaVersion: manifest.schemaVersion,
  migrationCount: actualMigrations.length,
  verifiedFileCount: manifest.files.length + manifest.repositoryFiles.length,
  remoteMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function walk(root) {
  const output = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) output.push(...walk(path))
    else output.push(relative(root, path))
  }
  return output
}

function equalArrays(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function assert(condition, code) {
  if (!condition) throw new Error(code)
}
