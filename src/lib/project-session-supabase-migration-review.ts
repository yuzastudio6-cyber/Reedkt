import {
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_BLOCKED_SCOPE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS,
  DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS,
} from './project-session-supabase-migration-sql-draft'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS,
} from './project-session-supabase-schema-rls-draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION =
  'internal_testing_durable_project_session_supabase_migration_review_passed_ready_for_local_migration_dry_run_plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID =
  'durable-project-session-supabase-migration-review'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_ACCEPTED_FINDINGS = [
  {
    id: 'draft-location',
    status: 'accepted',
    finding: 'SQL remains under database/migration-drafts and is not copied into supabase/migrations.',
  },
  {
    id: 'core-access-chain',
    status: 'accepted',
    finding: 'profiles, workspaces, workspace_members, projects, and edit_sessions preserve the workspace_members/auth.uid() access chain.',
  },
  {
    id: 'route-data-hardening',
    status: 'accepted',
    finding:
      'edit_briefs, edit_cues, and edit_session_export_settings now have review-only select grants plus project/session membership RLS policies in the draft.',
  },
  {
    id: 'mutation-boundary',
    status: 'accepted',
    finding: 'mutation grants are absent; this draft only plans authenticated select access for internal-testing routes.',
  },
  {
    id: 'destructive-sql-boundary',
    status: 'accepted',
    finding: 'draft contains no drop table, drop schema, role mutation, service-role grant, or provider-secret storage.',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS = [
  'full_mvp_schema_review_still_required_before_production_migration',
  'approved_plan_snapshots_and_worker_tables_are_out_of_scope_for_this_project_session_draft',
  'credit_ledger_and_audit_append_only_tables_are_out_of_scope_for_this_project_session_draft',
  'storage_bucket_policies_remain_unapplied_and_unvalidated',
  'remote_supabase_validation_has_not_run',
  'generated_types_have_not_been_created',
  'table_backed_routes_are_not_implemented',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_LOCAL_DRY_RUN_REQUIREMENTS = [
  'create_an_ephemeral_local_supabase_project_or_reset_target_only_after_explicit_approval',
  'apply_only_database_migration_drafts_024_internal_testing_durable_project_session_access_as_a_dry_run',
  'seed_member_and_non_member_fixture_users_without_private_media',
  'verify_member_project_session_brief_cue_export_select_passes',
  'verify_non_member_and_anonymous_select_denied',
  'verify_mutation_attempts_denied_for_authenticated_role',
  'remove_local_generated_outputs_and_do_not_commit_types_or_database_state',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_BLOCKED_SCOPE = {
  ...DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_BLOCKED_SCOPE,
  migrationReviewCompleted: true,
  localMigrationDryRunPlanAllowed: true,
  localMigrationDryRunExecuted: false,
  executableMigrationCreated: false,
  migrationApplied: false,
  remoteSupabaseValidation: false,
  localSupabaseReset: false,
  generatedTypes: false,
  tableBackedRouteImplementation: false,
  liveRouteRead: false,
  liveRouteWrite: false,
  productionMigrationAllowed: false,
  durableSupabaseAccessAllowed: false,
  productReady: false,
} as const

export interface DurableProjectSessionSupabaseMigrationReview {
  decision: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION
  scenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID
  priorDecision: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION
  currentMode: 'migration_review_only'
  nextMode: 'local_migration_dry_run_plan'
  reviewedDraftSqlFile: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE
  coreTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES
  routeDataTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES
  acceptedFindings: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_ACCEPTED_FINDINGS
  inheritedReviewChecks: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS
  inheritedVerificationChecks: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS
  reviewedDraftStatements: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS
  productionBlockers: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS
  localDryRunRequirements: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_LOCAL_DRY_RUN_REQUIREMENTS
  blockedScope: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_BLOCKED_SCOPE
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE
}

export function getDurableProjectSessionSupabaseMigrationReview(): DurableProjectSessionSupabaseMigrationReview {
  return {
    decision: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_DECISION,
    scenarioId: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_SCENARIO_ID,
    priorDecision: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
    currentMode: 'migration_review_only',
    nextMode: 'local_migration_dry_run_plan',
    reviewedDraftSqlFile: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
    coreTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES,
    routeDataTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES,
    acceptedFindings: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_ACCEPTED_FINDINGS,
    inheritedReviewChecks: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS,
    inheritedVerificationChecks: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS,
    reviewedDraftStatements: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS,
    productionBlockers: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_PRODUCTION_BLOCKERS,
    localDryRunRequirements: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_LOCAL_DRY_RUN_REQUIREMENTS,
    blockedScope: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_BLOCKED_SCOPE,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW_NEXT_GATE,
  }
}
