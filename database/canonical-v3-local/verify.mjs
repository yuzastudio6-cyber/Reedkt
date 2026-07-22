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
  'docs/canonical-edit-reference-mounted-domain-repository-runtime-port-verification-2026-07-21.md',
  'docs/canonical-edit-reference-mounted-long-form-runtime-port-verification-2026-07-21.md',
  'docs/canonical-exact-edit-planning-authority-verification-2026-07-21.md',
  'docs/canonical-v3-local-distributed-media-ingest-verification-2026-07-22.md',
  'docs/canonical-v3-local-distributed-pre-plan-study-runtime-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-domain-library-study-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-evidence-dna-approval-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-long-form-runtime-bridge-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-recovery-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-request-scoped-long-form-verification-2026-07-21.md',
  'docs/canonical-v3-local-edit-reference-target-application-e2e-verification-2026-07-21.md',
  'docs/canonical-v3-local-exact-edit-apply-authority-read-verification-2026-07-21.md',
  'docs/canonical-v3-local-exact-edit-atomic-apply-verification-2026-07-21.md',
  'docs/canonical-v3-local-exact-edit-brief-target-source-verification-2026-07-21.md',
  'docs/canonical-v3-local-target-understanding-package-persistence-verification-2026-07-21.md',
  'docs/edit-preferences-mounted-atomic-apply-recovery-2026-07-21.md',
  'package.json',
  'server/app.ts',
  'server/distributed-media-ingest/canonical-distributed-media-ingest-local-supabase-http-rpc-client.ts',
  'server/distributed-media-ingest/canonical-distributed-media-ingest-source-registration.ts',
  'server/distributed-media-ingest/canonical-distributed-media-ingest-state-port.ts',
  'server/distributed-media-ingest/canonical-distributed-media-ingest-state-rpc-adapter.ts',
  'server/distributed-media-ingest/index.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-read-projection.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-source-registration.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-conformance.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port.ts',
  'server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter.ts',
  'server/distributed-pre-plan-study/in-memory-canonical-distributed-pre-plan-study-fixture.ts',
  'server/distributed-pre-plan-study/index.ts',
  'server/edit-references/canonical-exact-edit-planning-authority-boundary.ts',
  'server/edit-references/controlled-local-edit-reference-application-preparation-fixture.ts',
  'server/edit-references/edit-reference-domain-command-contract.ts',
  'server/edit-references/edit-reference-local-supabase-application-preparation-port.ts',
  'server/edit-references/edit-reference-local-supabase-domain-http-rpc-client.ts',
  'server/edit-references/edit-reference-local-supabase-domain-repository.ts',
  'server/edit-references/edit-reference-local-supabase-http-rpc-client.ts',
  'server/edit-references/edit-reference-local-supabase-rpc-adapter.ts',
  'server/edit-references/edit-reference-long-form-source-inspector.ts',
  'server/edit-references/edit-reference-long-form-study-contract.ts',
  'server/edit-references/edit-reference-long-form-study-scheduler.ts',
  'server/edit-references/edit-reference-production-application-preparation-boundary.ts',
  'server/edit-references/edit-reference-production-exact-edit-apply-boundary.ts',
  'server/edit-references/edit-reference-production-readiness.ts',
  'server/edit-references/edit-reference-repository.ts',
  'server/edit-references/edit-reference-target-adaptation.ts',
  'server/edit-references/edit-reference-target-video-understanding-contract.ts',
  'server/edit-references/private-edit-reference-long-form-study-repository.ts',
  'server/edit-references/private-edit-reference-repository.ts',
  'server/middleware/idempotency.ts',
  'server/routes/edit-reference-target-video-understanding-routes.ts',
  'server/routes/exact-edit-preference-routes.ts',
  'server/routes/route-helpers.ts',
  'server/services/canonical-planning-handoff-service.ts',
  'server/services/edit-reference-application-preparation-runtime-port.ts',
  'server/services/edit-reference-application-preparation-service.ts',
  'server/services/edit-reference-canonical-v3-local-exact-edit-brief-runtime-port-factory.ts',
  'server/services/edit-reference-canonical-v3-local-long-form-runtime-port-factory.ts',
  'server/services/edit-reference-canonical-v3-local-long-form-runtime-port.ts',
  'server/services/edit-reference-canonical-v3-local-target-understanding-package-runtime-port-factory.ts',
  'server/services/edit-reference-domain-repository-runtime-port.ts',
  'server/services/edit-reference-exact-edit-apply-runtime-port.ts',
  'server/services/edit-reference-exact-edit-brief-runtime-port.ts',
  'server/services/edit-reference-production-long-form-runtime-port.ts',
  'server/services/edit-reference-service.ts',
  'server/services/edit-reference-signed-in-private-media-runtime-port.ts',
  'server/services/edit-reference-target-understanding-package-runtime-port.ts',
  'server/services/edit-reference-target-video-understanding-service.ts',
  'server/services/idempotency-service.ts',
  'server/services/planning-exact-edit-preference-authority-port.ts',
  'server/services/planning-exact-edit-preference-authority-service.ts',
  'server/services/planning-input-authority-binding-service.ts',
  'server/services/project-edit-brief-local-service.ts',
  'server/services/upload-service.ts',
  'server/services/workspace-access-service.ts',
  'server/smoke/canonical-distributed-media-ingest-local-postgres-smoke.ts',
  'server/smoke/canonical-distributed-pre-plan-study-local-postgres-smoke.ts',
  'server/smoke/canonical-distributed-pre-plan-study-state-rpc-adapter-smoke.ts',
  'server/smoke/canonical-planning-publication-frontend-client-smoke.ts',
  'server/smoke/canonical-private-tool-dispatch-authority-smoke.ts',
  'server/smoke/canonical-professional-long-form-cross-chunk-color-smoke.ts',
  'server/smoke/canonical-professional-long-form-post-approval-smoke.ts',
  'server/smoke/edit-planning-authority-smoke.ts',
  'server/smoke/edit-reference-canonical-v3-application-preparation-and-apply-smoke.ts',
  'server/smoke/edit-reference-canonical-v3-exact-edit-target-source-smoke.ts',
  'server/smoke/edit-reference-canonical-v3-local-long-form-runtime-port-smoke.ts',
  'server/smoke/edit-reference-local-supabase-application-preparation-smoke.ts',
  'server/smoke/edit-reference-local-supabase-domain-repository-smoke.ts',
  'server/smoke/edit-reference-local-supabase-http-rpc-smoke.ts',
  'server/smoke/edit-reference-local-supabase-rpc-adapter-smoke.ts',
  'server/smoke/edit-reference-long-form-runtime-port-factory-smoke.ts',
  'server/smoke/edit-reference-mounted-domain-repository-runtime-port-smoke.ts',
  'server/smoke/edit-reference-mounted-long-form-runtime-port-smoke.ts',
  'server/smoke/edit-reference-production-long-form-runtime-port-smoke.ts',
  'server/smoke/edit-reference-production-readiness-smoke.ts',
  'server/smoke/fixtures/complete-canonical-v3-pre-plan-study-fixture.ts',
  'server/smoke/fixtures/ready-target-video-understanding-fixture.ts',
  'server/smoke/planning-exact-edit-preference-authority-port-smoke.ts',
  'server/smoke/upload-boundary-security-smoke.ts',
  'server/types.ts',
  'server/validation/canonical-exact-edit-planning-authority-schemas.ts',
  'server/validation/edit-planning-authority-schemas.ts',
  'server/validation/edit-reference-application-preparation-schemas.ts',
  'server/validation/planning-input-authority-binding-schemas.ts',
  'src/backend/api/routes/edit-planning-api-routes.ts',
  'src/backend/auth/workspace-bootstrap-service.ts',
  'src/components/editor/ChatNativeEditor.tsx',
  'src/components/editor/CurrentEditPreferencesWorkspace.tsx',
  'src/components/editor/edit-reference/ProjectEditReferenceTargetStudy.tsx',
  'src/lib/canonical-planning-draft.ts',
  'src/lib/canonical-planning-publication-client.ts',
  'src/lib/current-edit-reference-application-ui.ts',
  'src/lib/current-edit-reference-draft-decision.ts',
  'src/lib/edit-reference-application-preparation-client.ts',
  'src/lib/project-edit-brief-backend-local.ts',
  'src/lib/project-edit-session-edit-reference-integration.ts',
  'src/types/canonical-exact-edit-planning-authority.ts',
  'src/types/edit-reference-production-application-preparation-api.ts',
  'src/types/edit-reference-production-exact-edit-apply-api.ts',
  'src/types/edit-reference-target-video-understanding.ts',
  'src/types/edit-reference.ts',
  'src/types/reeditpro.ts',
  'tests/e2e/edit-preferences-atomic-api-server.ts',
  'tests/e2e/edit-preferences-current-edit.spec.ts',
  'tests/e2e/edit-reference-canonical-real-file-flow.spec.ts',
  'tests/e2e/edit-reference-canonical-v3-local-browser.spec.ts',
  'tests/e2e/helpers/canonical-v3-edit-reference-apply-fixture.ts',
  'tests/e2e/playwright.current-edit-preferences-atomic.config.ts',
  'tests/e2e/playwright.edit-reference-canonical-real-file.config.ts',
  'tests/e2e/playwright.edit-reference-canonical-v3-local.config.ts',
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
  '202607210008_edit_reference_domain_library_study_rpcs.sql',
  '202607210009_edit_reference_domain_evidence_dna_approval_rpcs.sql',
  '202607210010_canonical_distributed_pre_plan_study_rpc.sql',
  '202607210011_canonical_pre_plan_study_read_projection.sql',
  '202607210012_canonical_pre_plan_source_registration.sql',
  '202607210013_exact_edit_brief_and_target_source.sql',
  '202607210014_target_understanding_package_persistence.sql',
  '202607210015_server_prepared_target_application.sql',
  '202607210016_reviewed_qa_lifecycle_compatibility.sql',
  '202607210017_canonical_application_lifecycle_projection.sql',
  '202607210018_pre_plan_enqueue_study_concurrency_fence.sql',
  '202607210019_edit_reference_idempotency_concurrency_fence.sql',
  '202607210020_canonical_distributed_media_ingest_rpc.sql',
]
const actualMigrations = readdirSync(join(directory, 'supabase', 'migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort()
assert(equalArrays(actualMigrations, expectedMigrations), 'migration_chain_changed')

const expectedRecoveryDataTables = readFileSync(
  join(directory, 'expected-recovery-data-tables.txt'),
  'utf8',
).trim().split('\n')
assert(expectedRecoveryDataTables.length === 56, 'recovery_table_count_invalid')
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
  'canonical-distributed-pre-plan-study-local-postgres-smoke.ts',
  'canonical-distributed-media-ingest-local-postgres-smoke.ts',
  '127.0.0.1:57431',
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
  'prepare_edit_reference_application_v2',
  'mutate_edit_reference_domain_command_v1',
  'read_edit_reference_domain_aggregate_v1',
  'mutate_edit_reference_domain_command_v2',
  'read_edit_reference_domain_aggregate_v2',
  'read_edit_reference_domain_idempotency_v1',
  'mutate_edit_reference_long_form_domain_command_v1',
  'preference_dna_lifecycle_events',
  'edit_reference_domain_states',
  'edit_reference_domain_audit_events',
  'edit_reference_domain_idempotency_receipts',
  'preference_evidence_assets',
  'preference_evidence_asset_long_form_events',
  'read_exact_edit_reference_application_state_v2',
  'assert_preference_application_plan_current_v1',
  'reserve_edit_reference_study_chat_run_v1',
  'canonical_pre_plan_study_enqueue:',
  'canonical_edit_reference_idempotency:',
  'authorize_edit_reference_study_chat_route_attempt_v1',
  'enqueue_edit_reference_long_form_study_v1',
  'recover_expired_edit_reference_long_form_lease_v1',
  'preference_long_form_study_idempotency_receipts',
  'preference_long_form_study_lease_escrow',
  'preference_long_form_study_audit_events',
  'reeditpro_pre_plan_assert_local_internal_authority',
  'reeditpro_pre_plan_escrow_secret',
  'reeditpro_enqueue_pre_plan_study_v1',
  'reeditpro_claim_and_start_pre_plan_study_v1',
  'reeditpro_heartbeat_pre_plan_study_v1',
  'reeditpro_complete_pre_plan_study_v1',
  'reeditpro_fail_pre_plan_study_v1',
  'reeditpro_control_pre_plan_study_v1',
  'reeditpro_recover_expired_pre_plan_study_lease_v1',
  'reeditpro_read_pre_plan_study_projection_v1',
  'reeditpro_register_media_ingest_source_v1',
  'reeditpro_enqueue_media_ingest_v1',
  'reeditpro_claim_and_start_media_ingest_v1',
  'reeditpro_record_media_ingest_progress_v1',
  'reeditpro_reconcile_media_ingest_completion_v1',
  'reeditpro_reconcile_media_ingest_failure_v1',
  'reeditpro_request_media_ingest_cancellation_v1',
  'reeditpro_finalize_expired_media_ingest_attempt_v1',
  'canonical_media_ingest_idempotency_receipts',
  'canonical_media_ingest_audit_events',
  'reeditpro_register_pre_plan_source_v1',
  'exact_edit_brief_versions',
  'reeditpro_save_exact_edit_brief_v1',
  'reeditpro_read_exact_edit_brief_v1',
  'reeditpro_register_target_pre_plan_source_v1',
  'reeditpro_save_target_understanding_package_v1',
  'reeditpro_read_latest_target_understanding_package_v1',
  'canonical-v3-local-target-understanding-package-persistence-v1',
  'canonicalLifecycleAuthority',
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
