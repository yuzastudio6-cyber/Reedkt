import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID,
  getDurableProjectSessionSupabaseMigrationReview,
} from './project-session-supabase-migration-review'
import { DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE } from './project-session-supabase-migration-sql-draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION =
  'internal_testing_durable_project_session_supabase_local_migration_dry_run_plan_passed_ready_for_local_migration_dry_run_execution'

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_EXECUTION'

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID =
  'durable-project-session-supabase-local-migration-dry-run-plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_TEMP_ROOT =
  '/tmp/reeditpro-internal-testing-durable-project-session-supabase-local-migration-dry-run/<runId>'

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FUTURE_COMMANDS = [
  {
    id: 'preflight',
    command: 'supabase --version && git status --short',
    purpose: 'Confirm local Supabase CLI availability and a clean checkout before creating any temp dry-run target.',
  },
  {
    id: 'temp-root',
    command: `mkdir -p ${DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_TEMP_ROOT}`,
    purpose: 'Create an isolated temp root outside the repository so executable migration files are never committed.',
  },
  {
    id: 'copy-reviewed-draft',
    command:
      'cp database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql "$RUN_ROOT/supabase/migrations/20260704_internal_testing_durable_project_session_access.sql"',
    purpose: 'Use the reviewed draft as the only temp migration input for the local dry run.',
  },
  {
    id: 'local-only-reset',
    command: 'supabase start && supabase db reset --local',
    purpose: 'Apply the temp migration to a local Supabase stack only after explicit execution approval.',
  },
  {
    id: 'fixture-rls-checks',
    command: 'psql "$LOCAL_SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$RUN_ROOT/rls-fixture-checks.sql"',
    purpose: 'Verify member select pass, non-member/anonymous select denial, and authenticated mutation denial with synthetic fixtures.',
  },
  {
    id: 'cleanup',
    command: 'supabase stop --no-backup && rm -rf "$RUN_ROOT"',
    purpose: 'Remove local dry-run services and generated temp outputs before any commit or PR handoff.',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FIXTURE_ASSERTIONS = [
  'member_can_select_project_session_brief_cue_export_settings',
  'non_member_cannot_select_project_session_brief_cue_export_settings',
  'anonymous_cannot_select_project_session_brief_cue_export_settings',
  'authenticated_role_cannot_insert_update_or_delete_project_session_rows',
  'service_role_is_not_used_from_browser_or_test_fixture',
  'private_media_and_storage_objects_are_not_created',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_BLOCKED_SCOPE = {
  ...getDurableProjectSessionSupabaseMigrationReview().blockedScope,
  localMigrationDryRunPlanCompleted: true,
  localMigrationDryRunExecutionAllowed: true,
  localMigrationDryRunExecuted: false,
  executableMigrationCommitted: false,
  supabaseCliStarted: false,
  supabaseDbResetRan: false,
  psqlFixtureChecksRan: false,
  generatedTypes: false,
  tableBackedRouteImplementation: false,
  remoteSupabaseValidation: false,
  productionMigrationAllowed: false,
  durableSupabaseAccessAllowed: false,
  productReady: false,
} as const

export interface DurableProjectSessionSupabaseLocalMigrationDryRunPlan {
  decision: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION
  scenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID
  priorDecision: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION
  priorGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE
  priorScenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID
  currentMode: 'local_migration_dry_run_plan_only'
  nextMode: 'local_migration_dry_run_execution'
  reviewedDraftSqlFile: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE
  tempRoot: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_TEMP_ROOT
  futureCommands: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FUTURE_COMMANDS
  fixtureAssertions: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FIXTURE_ASSERTIONS
  inheritedProductionBlockers: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS
  blockedScope: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_BLOCKED_SCOPE
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE
}

export function getDurableProjectSessionSupabaseLocalMigrationDryRunPlan(): DurableProjectSessionSupabaseLocalMigrationDryRunPlan {
  return {
    decision: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_DECISION,
    scenarioId: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_SCENARIO_ID,
    priorDecision: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION,
    priorGate: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE,
    priorScenarioId: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID,
    currentMode: 'local_migration_dry_run_plan_only',
    nextMode: 'local_migration_dry_run_execution',
    reviewedDraftSqlFile: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
    tempRoot: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_TEMP_ROOT,
    futureCommands: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FUTURE_COMMANDS,
    fixtureAssertions: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_FIXTURE_ASSERTIONS,
    inheritedProductionBlockers: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS,
    blockedScope: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_BLOCKED_SCOPE,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN_NEXT_GATE,
  }
}
