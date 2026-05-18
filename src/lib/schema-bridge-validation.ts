import type { SupabaseSchemaPlan, SupabaseTablePlan } from '../types/supabase-schema-plan'
import type { MigrationDraftPlan } from '../types/supabase-migration-drafts'
import type { MigrationReviewPlan } from '../types/supabase-rls-hardening'
import { validateMigrationDraftPlan } from './migration-draft-validation'

export type SchemaBridgeValidationSeverity = 'info' | 'warning' | 'error' | 'blocking'

export type SchemaBridgeValidationStatus = 'passed' | 'warning' | 'failed'

export interface SchemaBridgeValidationCheck {
  id: string
  label: string
  passed: boolean
  severity: SchemaBridgeValidationSeverity
  message: string
  recommendation?: string
}

export interface SchemaBridgeValidationReport {
  id: string
  status: SchemaBridgeValidationStatus
  summary: string
  checks: SchemaBridgeValidationCheck[]
}

function table(plan: SupabaseSchemaPlan, tableName: string) {
  return plan.tables.find((tablePlan) => tablePlan.name === tableName)
}

function hasColumn(tablePlan: SupabaseTablePlan | undefined, columnName: string) {
  return Boolean(tablePlan?.columns.some((column) => column.name === columnName))
}

function hasJsonb(tablePlan: SupabaseTablePlan | undefined, columnName: string) {
  return Boolean(tablePlan?.jsonbFields.includes(columnName) || tablePlan?.columns.some((column) => column.name === columnName && column.type === 'jsonb'))
}

function check(params: SchemaBridgeValidationCheck): SchemaBridgeValidationCheck {
  return params
}

function aggregateStatus(checks: SchemaBridgeValidationCheck[]): SchemaBridgeValidationStatus {
  const failedBlockingOrError = checks.some((item) => !item.passed && (item.severity === 'blocking' || item.severity === 'error'))

  if (failedBlockingOrError) {
    return 'failed'
  }

  return checks.some((item) => !item.passed && item.severity === 'warning') ? 'warning' : 'passed'
}

export function validateSupabaseSchemaPlan(
  plan: SupabaseSchemaPlan,
  migrationDraftPlan?: MigrationDraftPlan,
  migrationReviewPlan?: MigrationReviewPlan,
): SchemaBridgeValidationReport {
  const approvedSnapshots = table(plan, 'approved_plan_snapshots')
  const approvalRecords = table(plan, 'approval_records')
  const editPlanVersions = table(plan, 'edit_plan_versions')
  const creditEstimates = table(plan, 'credit_estimates')
  const generationRequests = table(plan, 'generation_requests')
  const editingJobs = table(plan, 'editing_jobs')
  const jobSteps = table(plan, 'job_steps')
  const auditEvents = table(plan, 'audit_events')
  const migrationDraftReport = migrationDraftPlan ? validateMigrationDraftPlan(migrationDraftPlan) : undefined
  const checks = [
    check({
      id: 'schema-approved-snapshots-table',
      label: 'Approved snapshots table planned',
      passed: Boolean(approvedSnapshots),
      severity: 'blocking',
      message: 'approved_plan_snapshots must be planned because workers execute approved snapshots.',
    }),
    check({
      id: 'schema-approved-snapshots-jsonb',
      label: 'Approved snapshot JSONB planned',
      passed: hasJsonb(approvedSnapshots, 'snapshot_json'),
      severity: 'blocking',
      message: 'approved_plan_snapshots must include snapshot_json as the full execution contract.',
    }),
    check({
      id: 'schema-approved-snapshots-immutable',
      label: 'Approved snapshots immutable flag',
      passed: hasColumn(approvedSnapshots, 'immutable') && Boolean(approvedSnapshots?.migrationNotes.join(' ').toLowerCase().includes('immutable')),
      severity: 'blocking',
      message: 'Approved snapshots need an immutable flag and migration notes preserving immutable behavior.',
    }),
    check({
      id: 'schema-approval-record-snapshot-link',
      label: 'Approval records point to snapshots',
      passed: hasColumn(approvalRecords, 'approved_snapshot_id'),
      severity: 'error',
      message: 'approval_records must point to the exact approved snapshot.',
    }),
    check({
      id: 'schema-edit-plan-full-json',
      label: 'Full edit plan JSONB planned',
      passed: hasJsonb(editPlanVersions, 'full_plan_json'),
      severity: 'error',
      message: 'edit_plan_versions must store full_plan_json for the complete mock plan.',
    }),
    check({
      id: 'schema-credit-estimate-json',
      label: 'Credit estimate JSONB planned',
      passed: hasJsonb(creditEstimates, 'estimate_json'),
      severity: 'error',
      message: 'credit_estimates must store estimate_json for the full user-facing estimate.',
    }),
    check({
      id: 'schema-generation-request-snapshot-link',
      label: 'Generation requests link snapshots',
      passed: hasColumn(generationRequests, 'approved_plan_snapshot_id'),
      severity: 'error',
      message: 'generation_requests must link to approved_plan_snapshot_id.',
    }),
    check({
      id: 'schema-editing-job-snapshot-link',
      label: 'Editing jobs link snapshots',
      passed: hasColumn(editingJobs, 'approved_plan_snapshot_id'),
      severity: 'error',
      message: 'editing_jobs must link to approved_plan_snapshot_id.',
    }),
    check({
      id: 'schema-job-step-json-envelopes',
      label: 'Job step JSON envelopes',
      passed: hasJsonb(jobSteps, 'input_json') && hasJsonb(jobSteps, 'output_json') && hasJsonb(jobSteps, 'error_json'),
      severity: 'error',
      message: 'job_steps should include input_json, output_json, and error_json.',
    }),
    check({
      id: 'schema-storage-private-default',
      label: 'Storage buckets private by default',
      passed: plan.storageBuckets.length > 0 && plan.storageBuckets.every((bucket) => !bucket.isPublic),
      severity: 'blocking',
      message: 'All schema bridge storage buckets should remain private by default.',
    }),
    check({
      id: 'schema-rls-policies-planned',
      label: 'RLS policies planned',
      passed: plan.tables.length > 0 && plan.tables.every((tablePlan) => tablePlan.rlsPolicies.length > 0),
      severity: 'error',
      message: 'Every MVP table should have at least one planned RLS policy summary.',
    }),
    check({
      id: 'schema-audit-events-table',
      label: 'Audit events table planned',
      passed: Boolean(auditEvents),
      severity: 'error',
      message: 'audit_events should exist for future append-only audit records.',
    }),
    check({
      id: 'schema-no-ready-with-reviews',
      label: 'No table marked ready before reviews',
      passed: plan.requiredReviews.length > 0 && plan.tables.every((tablePlan) => tablePlan.readinessStatus !== 'ready_for_migration'),
      severity: 'warning',
      message: 'No table should be marked ready_for_migration while required reviews remain open.',
    }),
    check({
      id: 'schema-no-migration-files-created',
      label: 'No active Supabase migrations in schema bridge',
      passed: plan.nonGoals.some((goal) => goal.toLowerCase().includes('no real supabase migrations')),
      severity: 'blocking',
      message: 'The schema bridge must remain planning-only and must not create active Supabase migrations.',
    }),
    check({
      id: 'schema-migration-draft-plan-exists',
      label: 'Migration draft plan exists',
      passed: Boolean(migrationDraftPlan),
      severity: 'warning',
      message: 'RP-DATA-02 should add a review-only migration draft plan alongside the schema bridge.',
    }),
    check({
      id: 'schema-migration-drafts-all-listed',
      label: 'All migration drafts listed',
      passed: Boolean(migrationDraftReport?.checks.some((item) => item.id === 'migration-drafts-all-files-listed' && item.passed)),
      severity: 'warning',
      message: 'The schema bridge should reference all eight review-only SQL draft files.',
    }),
    check({
      id: 'schema-migration-drafts-folder',
      label: 'Migration drafts stay in draft folder',
      passed: Boolean(migrationDraftReport?.checks.some((item) => item.id === 'migration-drafts-draft-folder-only' && item.passed)),
      severity: 'blocking',
      message: 'Migration draft files must stay in database/migration-drafts/.',
    }),
    check({
      id: 'schema-migration-drafts-no-active-path',
      label: 'No active Supabase migration path',
      passed: Boolean(migrationDraftReport?.checks.some((item) => item.id === 'migration-drafts-no-active-path' && item.passed)),
      severity: 'blocking',
      message: 'RP-DATA-02 must not use supabase/migrations/ for draft SQL.',
    }),
    check({
      id: 'schema-migration-drafts-approved-snapshot-covered',
      label: 'Approved snapshot SQL draft covered',
      passed: Boolean(migrationDraftReport?.checks.some((item) => item.id === 'migration-drafts-approved-snapshot-covered' && item.passed)),
      severity: 'warning',
      message: 'SQL draft coverage should include approved_plan_snapshots.',
    }),
    check({
      id: 'schema-migration-drafts-rls-storage-covered',
      label: 'RLS and storage drafts covered',
      passed: Boolean(
        migrationDraftReport?.checks.some((item) => item.id === 'migration-drafts-rls-covered' && item.passed) &&
        migrationDraftReport.checks.some((item) => item.id === 'migration-drafts-storage-covered' && item.passed),
      ),
      severity: 'warning',
      message: 'SQL draft coverage should include RLS and storage bucket draft files.',
    }),
    check({
      id: 'schema-migration-review-plan-exists',
      label: 'Migration review plan exists',
      passed: Boolean(migrationReviewPlan),
      severity: 'warning',
      message: 'Schema bridge validation should reference the RP-DATA-03 migration review and RLS hardening plan.',
    }),
    check({
      id: 'schema-migration-review-rls-hardening-exists',
      label: 'RLS hardening plan exists',
      passed: Boolean(migrationReviewPlan?.rlsHardeningPlan),
      severity: 'warning',
      message: 'Migration review should include a table-by-table RLS hardening plan.',
    }),
    check({
      id: 'schema-migration-review-storage-privacy',
      label: 'Storage privacy plan exists',
      passed: Boolean(
        migrationReviewPlan?.checks.some((item) => item.id === 'migration-review-source-media-private' && item.passed) &&
        migrationReviewPlan.privacyRetentionNotes.some((note) => note.toLowerCase().includes('private')),
      ),
      severity: 'warning',
      message: 'Migration review should preserve private storage and privacy/retention planning.',
    }),
    check({
      id: 'schema-migration-review-approved-immutability',
      label: 'Approved immutability represented',
      passed: Boolean(
        migrationReviewPlan?.checks.some((item) => item.id === 'migration-review-approved-snapshot-immutability' && item.passed),
      ),
      severity: 'blocking',
      message: 'Migration review must keep approved snapshot immutability represented.',
    }),
    check({
      id: 'schema-migration-review-needs-testing',
      label: 'Draft policy still needs testing',
      passed: migrationReviewPlan?.overallStatus === 'hardened_draft' &&
        migrationReviewPlan.rlsHardeningPlan.overallStatus !== 'ready_for_testing',
      severity: 'warning',
      message: 'RLS hardening should remain draft-only until future Supabase testing.',
    }),
  ]
  const status = aggregateStatus(checks)

  return {
    id: 'schema-bridge-validation-report',
    status,
    summary: status === 'passed'
      ? 'Supabase schema bridge is internally consistent and remains planning-only.'
      : 'Supabase schema bridge needs review before a future migration milestone.',
    checks,
  }
}
