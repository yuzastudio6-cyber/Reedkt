import type { MigrationDraftPlan } from '../types/supabase-migration-drafts'
import type { MigrationReviewCheck, MigrationReviewPlan, RlsReviewStatus } from '../types/supabase-rls-hardening'
import type { SupabaseSchemaPlan } from '../types/supabase-schema-plan'
import { validateMigrationDraftPlan } from './migration-draft-validation'
import { createRlsHardeningPlan } from './rls-hardening-plan'

type CreateMigrationReviewPlanParams = {
  migrationDraftPlan?: MigrationDraftPlan
  supabaseSchemaPlan?: SupabaseSchemaPlan
}

function check(params: MigrationReviewCheck): MigrationReviewCheck {
  return params
}

function draftCheckPassed(plan: MigrationDraftPlan | undefined, checkId: string) {
  if (!plan) {
    return false
  }

  return validateMigrationDraftPlan(plan).checks.some((item) => item.id === checkId && item.passed)
}

function tableCovered(plan: MigrationDraftPlan | undefined, tableName: string) {
  return Boolean(plan?.files.some((file) => file.tablesCovered.includes(tableName)))
}

function rlsCheckPassed(checks: MigrationReviewPlan['rlsHardeningPlan']['checks'], checkId: string) {
  return checks.some((item) => item.id === checkId && item.passed)
}

function aggregateStatus(checks: MigrationReviewCheck[], rlsStatus: RlsReviewStatus): RlsReviewStatus {
  if (checks.some((item) => !item.passed && item.severity === 'blocking') || rlsStatus === 'blocked') {
    return 'blocked'
  }

  return 'hardened_draft'
}

export function createMigrationReviewPlan(params: CreateMigrationReviewPlanParams): MigrationReviewPlan {
  const rlsHardeningPlan = createRlsHardeningPlan()
  const reviewedDraftFiles = params.migrationDraftPlan?.files.map((file) => file.path) ?? []
  const warningText = params.migrationDraftPlan?.warnings.join(' ').toLowerCase() ?? ''
  const schemaNonGoals = params.supabaseSchemaPlan?.nonGoals.join(' ').toLowerCase() ?? ''
  const checks = [
    check({
      id: 'migration-review-draft-registry-exists',
      label: 'Draft registry exists',
      passed: Boolean(params.migrationDraftPlan),
      severity: 'blocking',
      message: 'Migration review requires the RP-DATA-02 draft registry.',
      recommendation: 'Create migrationDraftPlan before migrationReviewPlan in the mock planner.',
    }),
    check({
      id: 'migration-review-all-drafts-listed',
      label: 'All draft files listed',
      passed: draftCheckPassed(params.migrationDraftPlan, 'migration-drafts-all-files-listed'),
      severity: 'blocking',
      message: 'All eight draft SQL files should be listed.',
      recommendation: 'Keep the migration draft registry complete before hardening review.',
    }),
    check({
      id: 'migration-review-draft-extension',
      label: 'Draft SQL extension',
      passed: draftCheckPassed(params.migrationDraftPlan, 'migration-drafts-extension'),
      severity: 'error',
      message: 'Draft files should use .draft.sql naming.',
      recommendation: 'Keep draft SQL visibly separate from real migrations.',
    }),
    check({
      id: 'migration-review-no-active-path',
      label: 'No active migration path',
      passed: draftCheckPassed(params.migrationDraftPlan, 'migration-drafts-no-active-path'),
      severity: 'blocking',
      message: 'Draft SQL must not use supabase/migrations/.',
      recommendation: 'Keep RP-DATA-03 files under database/migration-drafts/ only.',
    }),
    check({
      id: 'migration-review-approved-snapshot-covered',
      label: 'Approved snapshots covered',
      passed: tableCovered(params.migrationDraftPlan, 'approved_plan_snapshots'),
      severity: 'blocking',
      message: 'Draft SQL must cover approved_plan_snapshots.',
      recommendation: 'Preserve approved snapshot table and snapshot_json planning.',
    }),
    check({
      id: 'migration-review-rls-storage-covered',
      label: 'RLS and storage drafts covered',
      passed: draftCheckPassed(params.migrationDraftPlan, 'migration-drafts-rls-covered') &&
        draftCheckPassed(params.migrationDraftPlan, 'migration-drafts-storage-covered'),
      severity: 'error',
      message: 'Draft SQL should include RLS and storage policy draft files.',
      recommendation: 'Keep 007 and 008 draft files in the review set.',
    }),
    check({
      id: 'migration-review-approved-snapshot-immutability',
      label: 'Approved snapshot immutability checked',
      passed: rlsCheckPassed(rlsHardeningPlan.checks, 'rls-approved-snapshots-immutable'),
      severity: 'blocking',
      message: 'Approved snapshot immutability must be represented in the hardening review.',
      recommendation: 'Deny user update/delete and review trigger protection before real migration.',
    }),
    check({
      id: 'migration-review-worker-service-only',
      label: 'Worker writes service-only',
      passed: rlsCheckPassed(rlsHardeningPlan.checks, 'rls-worker-tables-service-only'),
      severity: 'blocking',
      message: 'Worker, generation, job, QA, and export writes should be backend/service-role controlled.',
      recommendation: 'Keep direct user writes denied for worker-owned tables.',
    }),
    check({
      id: 'migration-review-audit-append-only',
      label: 'Audit append-only planned',
      passed: rlsCheckPassed(rlsHardeningPlan.checks, 'rls-audit-append-only'),
      severity: 'blocking',
      message: 'Audit events should be append-only.',
      recommendation: 'Do not create user update/delete policies for audit_events.',
    }),
    check({
      id: 'migration-review-source-media-private',
      label: 'Source media private',
      passed: rlsCheckPassed(rlsHardeningPlan.checks, 'rls-source-media-private') &&
        Boolean(params.supabaseSchemaPlan?.storageBuckets.every((bucket) => !bucket.isPublic)),
      severity: 'blocking',
      message: 'Source media and planned storage buckets should be private by default.',
      recommendation: 'Use signed URLs or backend-mediated reads in future storage work.',
    }),
    check({
      id: 'migration-review-browser-capture-private',
      label: 'Browser capture artifacts private',
      passed: true,
      severity: 'warning',
      message: 'Browser capture privacy is documented as private/project-scoped and authorization-aware.',
      recommendation: 'Add explicit browser-capture storage handling only in a future reviewed storage milestone.',
    }),
    check({
      id: 'migration-review-no-sql-or-connection',
      label: 'No SQL run or Supabase connection',
      passed: warningText.includes('no sql has been run') &&
        schemaNonGoals.includes('no supabase client') &&
        schemaNonGoals.includes('no sql is run'),
      severity: 'blocking',
      message: 'Migration review remains draft-only with no SQL execution or Supabase connection.',
      recommendation: 'Do not add clients, migrations, SQL execution, or backend routes in RP-DATA-03.',
    }),
    check({
      id: 'migration-review-not-ready-for-testing',
      label: 'Not marked ready for testing',
      passed: rlsHardeningPlan.overallStatus !== 'ready_for_testing',
      severity: 'warning',
      message: 'RLS is hardened draft only and has not been tested in Supabase.',
      recommendation: 'Keep overall status as hardened_draft until a future Supabase testing milestone.',
    }),
  ]
  const overallStatus = aggregateStatus(checks, rlsHardeningPlan.overallStatus)

  return {
    id: 'rp-data-03-migration-review-plan',
    summary: 'Migration review hardens draft SQL, RLS intent, private storage assumptions, approved snapshot immutability, and worker service-role boundaries before any real Supabase migration is created.',
    reviewedDraftFiles,
    checks,
    rlsHardeningPlan,
    privacyRetentionNotes: [
      'Source media, generated assets, processed media, browser captures, QA artifacts, and exports are private by default.',
      'Previews and exports should use signed URLs later.',
      'Worker-temp files should use short retention.',
      'Audit events should be append-only.',
      'Browser capture artifacts require user authorization and redaction/privacy planning.',
    ],
    overallStatus,
    limitations: [
      'Draft-only review; no active migration files are created.',
      'No SQL is run.',
      'No Supabase client or remote connection is added.',
      'RLS policies are not tested in Supabase.',
      'No backend, storage operation, worker queue, credit ledger, billing, provider call, render, or export is implemented.',
    ],
    nextSteps: [
      'Manually review draft SQL and RLS templates.',
      'Test RLS in a local or staging Supabase project in a future milestone.',
      'Create active migrations only after explicit approval and review.',
      'Add service-role audit coverage when backend workers are implemented.',
    ],
  }
}

