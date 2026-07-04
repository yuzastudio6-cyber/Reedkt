import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID,
  getDurableProjectSessionSupabaseMigrationSqlDraft,
} from '../../src/lib/project-session-supabase-migration-sql-draft'
import { DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION } from '../../src/lib/project-session-supabase-schema-rls-draft'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'src/lib/project-session-supabase-migration-sql-draft.ts',
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.md',
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.json',
  'server/smoke/internal-testing-durable-project-session-supabase-migration-sql-draft-smoke.ts',
  'src/lib/project-session-supabase-migration-review.ts',
  'docs/internal-testing-durable-project-session-supabase-migration-review.md',
  'docs/internal-testing-durable-project-session-supabase-migration-review.json',
  'server/smoke/internal-testing-durable-project-session-supabase-migration-review-smoke.ts',
  'src/lib/project-session-supabase-schema-rls-draft.ts',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.md',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.json',
  'server/smoke/internal-testing-durable-project-session-supabase-schema-rls-draft-smoke.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'scripts/validation/internal-testing-qa-runner.mjs',
  'docs/internal-testing-qa-wrapper.md',
  'docs/internal-testing-qa-wrapper.json',
  'server/smoke/internal-testing-qa-wrapper-smoke.ts',
  'server/smoke/project-edit-brief-internal-testing-entrypoint-smoke.ts',
  'docs/project-edit-brief-internal-testing-entrypoint.md',
  'docs/project-edit-brief-internal-testing-entrypoint.json',
  'docs/project-edit-brief-source-truth-reconciliation.md',
  'docs/project-edit-brief-source-truth-reconciliation.json',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'],
  'tsx server/smoke/internal-testing-durable-project-session-supabase-migration-sql-draft-smoke.ts',
)

const draft = getDurableProjectSessionSupabaseMigrationSqlDraft()
assert.equal(draft.decision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION)
assert.equal(draft.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID)
assert.equal(draft.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION)
assert.equal(draft.currentMode, 'migration_sql_draft_only')
assert.equal(draft.nextMode, 'migration_review')
assert.equal(draft.draftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.ok(draft.coreTables.some((table) => table.table === 'workspace_members'))
assert.ok(draft.coreTables.some((table) => table.table === 'edit_sessions'))
assert.ok(draft.routeDataTables.some((table) => table.table === 'edit_briefs'))
assert.ok(draft.draftStatements.some((statement) => statement.kind === 'rls_policy' && statement.draftSql.includes('create policy')))
assert.ok(draft.draftStatements.some((statement) => statement.kind === 'grant' && statement.draftSql.includes('grant select')))
assert.ok(draft.reviewChecks.includes('migration_review_required_before_real_supabase_cli_migration'))
assert.equal(draft.blockedScope.migrationSqlDraftWritten, true)
assert.equal(draft.blockedScope.executableMigrationCreated, false)
assert.equal(draft.blockedScope.migrationApplied, false)
assert.equal(draft.blockedScope.remoteSupabaseValidation, false)
assert.equal(draft.blockedScope.localSupabaseReset, false)
assert.equal(draft.blockedScope.generatedTypes, false)
assert.equal(draft.blockedScope.tableBackedRouteImplementation, false)
assert.equal(draft.durableSupabaseAccessAllowed, false)
assert.equal(draft.productReady, false)
assert.equal(draft.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE)

const source = read('src/lib/project-session-supabase-migration-sql-draft.ts')
assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|supabase\.rpc/i)
assert.match(source, /draft_only_not_applied/)
assert.match(source, /INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW/)

const draftSql = read(DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
for (const phrase of [
  'Review artifact only',
  'create table if not exists public.workspace_members',
  'create table if not exists public.projects',
  'create table if not exists public.edit_sessions',
  'create index if not exists workspace_members_user_workspace_lookup',
  'grant usage on schema public to authenticated',
  'grant select on public.edit_sessions to authenticated',
  'grant select on public.edit_briefs to authenticated',
  'grant select on public.edit_cues to authenticated',
  'grant select on public.edit_session_export_settings to authenticated',
  'create policy projects_select_workspace_member',
  'create policy edit_sessions_select_project_member',
  'create policy edit_briefs_select_project_member',
  'create policy edit_cues_select_project_member',
  'create policy edit_session_export_settings_select_project_member',
  'Route data select policies are now reviewed as draft-only SQL',
]) {
  assert.match(draftSql, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}
assert.doesNotMatch(draftSql, /drop\s+table|drop\s+schema|grant\s+(insert|update|delete)|alter\s+role|service_role/i)

const migrationFiles = readdirSync(file('supabase/migrations'))
assert.equal(
  migrationFiles.some((name) => name.includes('internal_testing_durable_project_session_access')),
  false,
  'draft must not be copied into supabase/migrations',
)

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-supabase-migration-sql-draft.json')) as {
  decision?: string
  priorDecision?: string
  currentMode?: string
  nextMode?: string
  draftSqlFile?: string
  coreTables?: string[]
  routeDataTables?: string[]
  grantPolicy?: { mutationGrants?: string; routeDataSelectGrants?: string }
  reviewChecks?: string[]
  blockedScope?: Record<string, boolean>
  migrationApplied?: boolean
  durableSupabaseAccessAllowed?: boolean
  productReady?: boolean
  validation?: { required?: string[] }
  nextGate?: string
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION)
assert.equal(docJson.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION)
assert.equal(docJson.currentMode, 'migration_sql_draft_only')
assert.equal(docJson.nextMode, 'migration_review')
assert.equal(docJson.draftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.ok(docJson.coreTables?.includes('workspace_members'))
assert.ok(docJson.routeDataTables?.includes('edit_session_export_settings'))
assert.equal(docJson.grantPolicy?.mutationGrants, 'absent')
assert.equal(docJson.grantPolicy?.routeDataSelectGrants, 'reviewed_draft_select_after_migration_review')
assert.ok(docJson.reviewChecks?.includes('draft_file_lives_under_database_migration_drafts_not_supabase_migrations'))
assert.equal(docJson.blockedScope?.migrationSqlDraftWritten, true)
assert.equal(docJson.blockedScope?.executableMigrationCreated, false)
assert.equal(docJson.blockedScope?.migrationApplied, false)
assert.equal(docJson.blockedScope?.tableBackedRouteImplementation, false)
assert.equal(docJson.migrationApplied, false)
assert.equal(docJson.durableSupabaseAccessAllowed, false)
assert.equal(docJson.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'))
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE)

const docMd = read('docs/internal-testing-durable-project-session-supabase-migration-sql-draft.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
  'not under `supabase/migrations`',
  'workspace_members',
  'edit_sessions',
  'route data table select grants and policies are now reviewed as draft-only SQL',
  'No executable migration is created',
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
assert.match(runner, /smoke:internal-testing-durable-project-session-supabase-migration-sql-draft/)

const wrapperJson = JSON.parse(read('docs/internal-testing-qa-wrapper.json')) as { smokes?: string[] }
assert.ok(wrapperJson.smokes?.includes('smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'))

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internal-testing-durable-project-session-supabase-migration-sql-draft/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION/)
assert.match(page, /migration review/i)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const entrypointJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  validation?: { required?: string[] }
}
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_migration_sql_draft'))
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-migration-sql-draft'], 'mock_local')
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'))

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_review'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-migration-review'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'))
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_review'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'), false)

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-supabase-migration-sql-draft',
  decision: draft.decision,
  scenarioId: draft.scenarioId,
  draftSqlFile: draft.draftSqlFile,
  statements: draft.draftStatements.length,
  migrationApplied: draft.migrationApplied,
  durableSupabaseAccessAllowed: draft.durableSupabaseAccessAllowed,
  productReady: draft.productReady,
  nextGate: draft.nextGate,
}, null, 2))
