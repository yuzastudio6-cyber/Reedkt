import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID,
  getDurableProjectSessionSupabaseLocalMigrationDryRunPlan,
} from '../../src/lib/project-session-supabase-local-migration-dry-run-plan'
import { DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION } from '../../src/lib/project-session-supabase-migration-review'
import { DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE } from '../../src/lib/project-session-supabase-migration-sql-draft'

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
  'src/lib/project-session-supabase-local-migration-dry-run-plan.ts',
  'docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.md',
  'docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.json',
  'server/smoke/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan-smoke.ts',
  'src/lib/project-session-supabase-migration-review.ts',
  'docs/internal-testing-durable-project-session-supabase-migration-review.md',
  'docs/internal-testing-durable-project-session-supabase-migration-review.json',
  'server/smoke/internal-testing-durable-project-session-supabase-migration-review-smoke.ts',
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
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
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'],
  'tsx server/smoke/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan-smoke.ts',
)

const plan = getDurableProjectSessionSupabaseLocalMigrationDryRunPlan()
assert.equal(plan.decision, DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION)
assert.equal(plan.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID)
assert.equal(plan.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION)
assert.equal(plan.currentMode, 'local_migration_dry_run_plan_only')
assert.equal(plan.nextMode, 'local_migration_dry_run_execution')
assert.equal(plan.reviewedDraftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.equal(plan.futureCommands.length, 6)
assert.ok(plan.futureCommands.some((command) => command.id === 'local-only-reset' && command.command.includes('supabase db reset --local')))
assert.ok(plan.fixtureAssertions.includes('member_can_select_project_session_brief_cue_export_settings'))
assert.ok(plan.fixtureAssertions.includes('authenticated_role_cannot_insert_update_or_delete_project_session_rows'))
assert.equal(plan.blockedScope.localMigrationDryRunPlanCompleted, true)
assert.equal(plan.blockedScope.localMigrationDryRunExecutionAllowed, true)
assert.equal(plan.blockedScope.localMigrationDryRunExecuted, false)
assert.equal(plan.blockedScope.executableMigrationCommitted, false)
assert.equal(plan.blockedScope.supabaseCliStarted, false)
assert.equal(plan.blockedScope.supabaseDbResetRan, false)
assert.equal(plan.blockedScope.psqlFixtureChecksRan, false)
assert.equal(plan.blockedScope.migrationApplied, false)
assert.equal(plan.blockedScope.remoteSupabaseValidation, false)
assert.equal(plan.blockedScope.generatedTypes, false)
assert.equal(plan.blockedScope.tableBackedRouteImplementation, false)
assert.equal(plan.durableSupabaseAccessAllowed, false)
assert.equal(plan.productReady, false)
assert.equal(plan.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE)

const source = read('src/lib/project-session-supabase-local-migration-dry-run-plan.ts')
assert.match(source, /futureCommands/)
assert.match(source, /supabase db reset --local/)
assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|supabase\.rpc/i)

const migrationFiles = readdirSync(file('supabase/migrations'))
assert.equal(
  migrationFiles.some((name) => name.includes('internal_testing_durable_project_session_access')),
  false,
  'local dry-run plan must not add executable supabase/migrations files',
)

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.json')) as {
  decision?: string
  priorDecision?: string
  currentMode?: string
  nextMode?: string
  reviewedDraftSqlFile?: string
  tempRoot?: string
  futureCommands?: Array<{ id?: string; command?: string }>
  fixtureAssertions?: string[]
  blockedScope?: Record<string, boolean>
  durableSupabaseAccessAllowed?: boolean
  productReady?: boolean
  validation?: { required?: string[] }
  nextGate?: string
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION)
assert.equal(docJson.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION)
assert.equal(docJson.currentMode, 'local_migration_dry_run_plan_only')
assert.equal(docJson.nextMode, 'local_migration_dry_run_execution')
assert.equal(docJson.reviewedDraftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.match(docJson.tempRoot ?? '', /^\/tmp\/reeditpro-internal-testing-durable-project-session-supabase-local-migration-dry-run/)
assert.ok(docJson.futureCommands?.some((command) => command.id === 'copy-reviewed-draft'))
assert.ok(docJson.futureCommands?.some((command) => command.command?.includes('supabase start')))
assert.ok(docJson.fixtureAssertions?.includes('anonymous_cannot_select_project_session_brief_cue_export_settings'))
assert.equal(docJson.blockedScope?.localMigrationDryRunPlanCompleted, true)
assert.equal(docJson.blockedScope?.localMigrationDryRunExecuted, false)
assert.equal(docJson.blockedScope?.supabaseCliStarted, false)
assert.equal(docJson.blockedScope?.supabaseDbResetRan, false)
assert.equal(docJson.blockedScope?.migrationApplied, false)
assert.equal(docJson.blockedScope?.productionMigrationAllowed, false)
assert.equal(docJson.durableSupabaseAccessAllowed, false)
assert.equal(docJson.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE)

const docMd = read('docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION,
  'Future Local Dry-Run Flow',
  'supabase db reset --local',
  'No Supabase command is run',
  'No `supabase/migrations` file is added',
  DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
assert.match(runner, /smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan/)

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internal-testing-durable-project-session-supabase-local-migration-dry-run-plan/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION/)
assert.match(page, /local dry-run execution/i)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const entrypointJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  validation?: { required?: string[] }
}
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_local_migration_dry_run_plan'))
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-local-migration-dry-run-plan'], 'mock_local')
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_execution'))
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'), false)

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-supabase-local-migration-dry-run-plan',
  decision: plan.decision,
  scenarioId: plan.scenarioId,
  futureCommands: plan.futureCommands.length,
  fixtureAssertions: plan.fixtureAssertions.length,
  localMigrationDryRunExecuted: plan.blockedScope.localMigrationDryRunExecuted,
  durableSupabaseAccessAllowed: plan.durableSupabaseAccessAllowed,
  productReady: plan.productReady,
  nextGate: plan.nextGate,
}, null, 2))
