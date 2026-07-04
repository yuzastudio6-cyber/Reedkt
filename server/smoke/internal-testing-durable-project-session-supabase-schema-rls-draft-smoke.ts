import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID,
  getDurableProjectSessionSupabaseSchemaRlsDraft,
} from '../../src/lib/project-session-supabase-schema-rls-draft'
import { DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION } from '../../src/lib/project-session-supabase-route-contract-plan'
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
  'src/lib/project-session-supabase-schema-rls-draft.ts',
  'src/lib/project-session-supabase-route-contract-plan.ts',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.md',
  'docs/internal-testing-durable-project-session-supabase-schema-rls-draft.json',
  'server/smoke/internal-testing-durable-project-session-supabase-schema-rls-draft-smoke.ts',
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.md',
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.json',
  'server/smoke/internal-testing-durable-project-session-supabase-migration-sql-draft-smoke.ts',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.md',
  'docs/internal-testing-durable-project-session-supabase-route-contract-plan.json',
  'server/smoke/internal-testing-durable-project-session-supabase-route-contract-plan-smoke.ts',
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
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'],
  'tsx server/smoke/internal-testing-durable-project-session-supabase-schema-rls-draft-smoke.ts',
)

const draft = getDurableProjectSessionSupabaseSchemaRlsDraft()
assert.equal(draft.decision, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION)
assert.equal(draft.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID)
assert.equal(draft.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION)
assert.equal(draft.currentMode, 'schema_rls_draft_only')
assert.equal(draft.nextMode, 'migration_sql_draft')
assert.equal(draft.coreTables.length, 5)
assert.ok(draft.coreTables.some((table) => table.table === 'workspace_members' && table.requiredColumns.includes('user_id')))
assert.ok(draft.coreTables.some((table) => table.table === 'edit_sessions' && table.requiredColumns.includes('project_id')))
assert.ok(draft.routeDataTables.some((table) => table.table === 'edit_briefs' && table.requiredColumns.includes('edit_session_id')))
assert.ok(draft.verificationChecks.includes('non_member_edit_session_read_denied'))
assert.ok(draft.verificationChecks.includes('mutation_grants_absent_for_internal_testing_draft'))
assert.equal(draft.blockedScope.migrationSqlWritten, false)
assert.equal(draft.blockedScope.migrationApplied, false)
assert.equal(draft.blockedScope.remoteSupabaseValidation, false)
assert.equal(draft.blockedScope.localSupabaseReset, false)
assert.equal(draft.blockedScope.generatedTypes, false)
assert.equal(draft.blockedScope.tableBackedRouteImplementation, false)
assert.equal(draft.durableSupabaseAccessAllowed, false)
assert.equal(draft.productReady, false)
assert.equal(draft.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE)

const draftSource = read('src/lib/project-session-supabase-schema-rls-draft.ts')
assert.doesNotMatch(draftSource, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|supabase\.rpc/i)
assert.doesNotMatch(draftSource, /create\s+policy|alter\s+table|grant\s+select|grant\s+usage|create\s+index/i)

const migrationFiles = readdirSync(file('supabase/migrations'))
assert.equal(migrationFiles.some((name) => name.includes('project_session_supabase_schema_rls_draft')), false)

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-supabase-schema-rls-draft.json')) as {
  decision?: string
  priorDecision?: string
  currentMode?: string
  nextMode?: string
  coreTables?: Array<{ table?: string; requiredColumns?: string[] }>
  routeDataTables?: Array<{ table?: string; requiredColumns?: string[] }>
  verificationChecks?: string[]
  blockedScope?: Record<string, boolean>
  migrationApplied?: boolean
  durableSupabaseAccessAllowed?: boolean
  productReady?: boolean
  validation?: { required?: string[] }
  nextGate?: string
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION)
assert.equal(docJson.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION)
assert.equal(docJson.currentMode, 'schema_rls_draft_only')
assert.equal(docJson.nextMode, 'migration_sql_draft')
assert.ok(docJson.coreTables?.some((table) => table.table === 'projects' && table.requiredColumns?.includes('workspace_id')))
assert.ok(docJson.routeDataTables?.some((table) => table.table === 'edit_session_export_settings' && table.requiredColumns?.includes('edit_session_id')))
assert.ok(docJson.verificationChecks?.includes('anonymous_role_denied'))
assert.equal(docJson.blockedScope?.migrationSqlWritten, false)
assert.equal(docJson.blockedScope?.migrationApplied, false)
assert.equal(docJson.blockedScope?.localSupabaseReset, false)
assert.equal(docJson.blockedScope?.tableBackedRouteImplementation, false)
assert.equal(docJson.migrationApplied, false)
assert.equal(docJson.durableSupabaseAccessAllowed, false)
assert.equal(docJson.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE)

const docMd = read('docs/internal-testing-durable-project-session-supabase-schema-rls-draft.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
  'workspace_members',
  'edit_sessions',
  'authenticated-role RLS',
  'No migration SQL is written',
  'No migration is applied',
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
assert.match(runner, /smoke:internal-testing-durable-project-session-supabase-schema-rls-draft/)

const wrapperJson = JSON.parse(read('docs/internal-testing-qa-wrapper.json')) as { smokes?: string[] }
assert.ok(wrapperJson.smokes?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internal-testing-durable-project-session-supabase-schema-rls-draft/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION/)
assert.match(page, /migration SQL draft/i)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const entrypointJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  validation?: { required?: string[] }
}
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_schema_rls_draft'))
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-schema-rls-draft'], 'mock_local')
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_schema_rls_draft'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_review'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-schema-rls-draft'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-migration-sql-draft'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-migration-review'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_execution'))
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_review'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_sql_draft'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_schema_rls_draft'), false)

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-supabase-schema-rls-draft',
  decision: draft.decision,
  scenarioId: draft.scenarioId,
  coreTables: draft.coreTables.length,
  routeDataTables: draft.routeDataTables.length,
  verificationChecks: draft.verificationChecks.length,
  migrationApplied: draft.migrationApplied,
  durableSupabaseAccessAllowed: draft.durableSupabaseAccessAllowed,
  productReady: draft.productReady,
  nextGate: draft.nextGate,
}, null, 2))
