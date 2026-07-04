import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID,
  getDurableProjectSessionSupabaseMigrationReview,
} from '../../src/lib/project-session-supabase-migration-review'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
} from '../../src/lib/project-session-supabase-migration-sql-draft'
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
  'src/lib/project-session-supabase-migration-review.ts',
  'docs/internal-testing-durable-project-session-supabase-migration-review.md',
  'docs/internal-testing-durable-project-session-supabase-migration-review.json',
  'server/smoke/internal-testing-durable-project-session-supabase-migration-review-smoke.ts',
  'src/lib/project-session-supabase-local-migration-dry-run-plan.ts',
  'docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.md',
  'docs/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan.json',
  'server/smoke/internal-testing-durable-project-session-supabase-local-migration-dry-run-plan-smoke.ts',
  'src/lib/project-session-supabase-migration-sql-draft.ts',
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.md',
  'docs/internal-testing-durable-project-session-supabase-migration-sql-draft.json',
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
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-supabase-migration-review'],
  'tsx server/smoke/internal-testing-durable-project-session-supabase-migration-review-smoke.ts',
)

const review = getDurableProjectSessionSupabaseMigrationReview()
assert.equal(review.decision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION)
assert.equal(review.scenarioId, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID)
assert.equal(review.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION)
assert.equal(review.currentMode, 'migration_review_only')
assert.equal(review.nextMode, 'local_migration_dry_run_plan')
assert.equal(review.reviewedDraftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.ok(review.acceptedFindings.some((finding) => finding.id === 'route-data-hardening'))
assert.ok(review.productionBlockers.includes('table_backed_routes_are_not_implemented'))
assert.ok(review.localDryRunRequirements.includes('verify_member_project_session_brief_cue_export_select_passes'))
assert.equal(review.blockedScope.migrationReviewCompleted, true)
assert.equal(review.blockedScope.localMigrationDryRunPlanAllowed, true)
assert.equal(review.blockedScope.localMigrationDryRunExecuted, false)
assert.equal(review.blockedScope.executableMigrationCreated, false)
assert.equal(review.blockedScope.migrationApplied, false)
assert.equal(review.blockedScope.remoteSupabaseValidation, false)
assert.equal(review.blockedScope.localSupabaseReset, false)
assert.equal(review.blockedScope.generatedTypes, false)
assert.equal(review.blockedScope.tableBackedRouteImplementation, false)
assert.equal(review.blockedScope.productionMigrationAllowed, false)
assert.equal(review.durableSupabaseAccessAllowed, false)
assert.equal(review.productReady, false)
assert.equal(review.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE)

const source = read('src/lib/project-session-supabase-migration-review.ts')
assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|supabase\.rpc/i)

const draftSql = read(DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
for (const phrase of [
  'grant select on public.edit_briefs to authenticated',
  'grant select on public.edit_cues to authenticated',
  'grant select on public.edit_session_export_settings to authenticated',
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
  'reviewed draft must not be copied into supabase/migrations',
)

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-supabase-migration-review.json')) as {
  decision?: string
  priorDecision?: string
  currentMode?: string
  nextMode?: string
  reviewedDraftSqlFile?: string
  acceptedFindings?: Array<{ id?: string; status?: string }>
  productionBlockers?: string[]
  localDryRunRequirements?: string[]
  blockedScope?: Record<string, boolean>
  durableSupabaseAccessAllowed?: boolean
  productReady?: boolean
  validation?: { required?: string[] }
  nextGate?: string
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION)
assert.equal(docJson.priorDecision, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION)
assert.equal(docJson.currentMode, 'migration_review_only')
assert.equal(docJson.nextMode, 'local_migration_dry_run_plan')
assert.equal(docJson.reviewedDraftSqlFile, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE)
assert.ok(docJson.acceptedFindings?.some((finding) => finding.id === 'route-data-hardening' && finding.status === 'accepted'))
assert.ok(docJson.productionBlockers?.includes('full_mvp_schema_review_still_required_before_production_migration'))
assert.ok(docJson.localDryRunRequirements?.includes('verify_non_member_and_anonymous_select_denied'))
assert.equal(docJson.blockedScope?.localMigrationDryRunPlanAllowed, true)
assert.equal(docJson.blockedScope?.localMigrationDryRunExecuted, false)
assert.equal(docJson.blockedScope?.migrationApplied, false)
assert.equal(docJson.blockedScope?.productionMigrationAllowed, false)
assert.equal(docJson.durableSupabaseAccessAllowed, false)
assert.equal(docJson.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-migration-review'))
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE)

const docMd = read('docs/internal-testing-durable-project-session-supabase-migration-review.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION,
  'route-data',
  'No executable migration is created',
  'No local Supabase reset',
  'local migration dry-run plan',
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
assert.match(runner, /smoke:internal-testing-durable-project-session-supabase-migration-review/)

const page = read('src/pages/InternalTestingPage.tsx')
assert.match(page, /internal-testing-durable-project-session-supabase-migration-review/)
assert.match(page, /DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION/)
assert.match(page, /local migration dry-run plan/i)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const entrypointJson = JSON.parse(read('docs/project-edit-brief-internal-testing-entrypoint.json')) as {
  features?: string[]
  scenarioStatus?: Record<string, string | number>
  validation?: { required?: string[] }
}
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_migration_review'))
assert.ok(entrypointJson.features?.includes('durable_project_session_supabase_local_migration_dry_run_plan'))
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-migration-review'], 'mock_local')
assert.equal(entrypointJson.scenarioStatus?.['durable-project-session-supabase-local-migration-dry-run-plan'], 'mock_local')
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-migration-review'))
assert.ok(entrypointJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))

const sourceTruthJson = JSON.parse(read('docs/project-edit-brief-source-truth-reconciliation.json')) as {
  landedScope?: string[]
  validation?: { smokesPassed?: string[] }
  remainingGates?: string[]
}
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_migration_review'))
assert.ok(sourceTruthJson.landedScope?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-migration-review'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan'))
assert.ok(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_execution'))
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_migration_review'), false)
assert.equal(sourceTruthJson.remainingGates?.includes('internal_testing_durable_project_session_supabase_local_migration_dry_run_plan'), false)

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-supabase-migration-review',
  decision: review.decision,
  scenarioId: review.scenarioId,
  acceptedFindings: review.acceptedFindings.length,
  localDryRunRequirements: review.localDryRunRequirements.length,
  migrationApplied: review.blockedScope.migrationApplied,
  durableSupabaseAccessAllowed: review.durableSupabaseAccessAllowed,
  productReady: review.productReady,
  nextGate: review.nextGate,
}, null, 2))
