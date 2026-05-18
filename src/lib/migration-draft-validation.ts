import type {
  MigrationDraftPlan,
  MigrationDraftValidationCheck,
  MigrationDraftValidationReport,
} from '../types/supabase-migration-drafts'

const expectedDraftIds = [
  '001_core_workspace_projects',
  '002_media_and_source_sequence',
  '003_intent_and_plan_versions',
  '004_credits_approval_snapshots',
  '005_generation_assets_jobs',
  '006_qa_exports_audit',
  '007_rls_policy_drafts',
  '008_storage_bucket_policy_drafts',
]

function check(params: MigrationDraftValidationCheck): MigrationDraftValidationCheck {
  return params
}

function aggregateStatus(checks: MigrationDraftValidationCheck[]): MigrationDraftValidationReport['status'] {
  if (checks.some((item) => !item.passed && (item.severity === 'blocking' || item.severity === 'error'))) {
    return 'failed'
  }

  return checks.some((item) => !item.passed && item.severity === 'warning') ? 'warning' : 'passed'
}

function hasDraft(plan: MigrationDraftPlan, id: string) {
  return plan.files.some((file) => file.id === id)
}

function coveredTables(plan: MigrationDraftPlan) {
  return plan.files.flatMap((file) => file.tablesCovered.map((table) => table.toLowerCase()))
}

export function validateMigrationDraftPlan(plan: MigrationDraftPlan): MigrationDraftValidationReport {
  const lowerWarnings = plan.warnings.join(' ').toLowerCase()
  const tableCoverage = coveredTables(plan)
  const checks = [
    check({
      id: 'migration-drafts-all-files-listed',
      label: 'All draft files listed',
      passed: expectedDraftIds.every((id) => hasDraft(plan, id)) && plan.files.length === expectedDraftIds.length,
      severity: 'blocking',
      message: 'The migration draft registry should list all eight RP-DATA-02 draft files.',
    }),
    check({
      id: 'migration-drafts-draft-folder-only',
      label: 'Draft folder only',
      passed: plan.files.every((file) => file.path.startsWith('database/migration-drafts/')),
      severity: 'blocking',
      message: 'All draft SQL paths must live under database/migration-drafts/.',
    }),
    check({
      id: 'migration-drafts-extension',
      label: 'Draft SQL extension',
      passed: plan.files.every((file) => file.fileName.endsWith('.draft.sql') && file.path.endsWith('.draft.sql')),
      severity: 'error',
      message: 'Every draft SQL file should use the .draft.sql extension.',
    }),
    check({
      id: 'migration-drafts-must-not-run',
      label: 'Must not run flags',
      passed: plan.files.every((file) => file.mustNotRun),
      severity: 'blocking',
      message: 'Every draft file must be marked mustNotRun.',
    }),
    check({
      id: 'migration-drafts-approved-snapshot-covered',
      label: 'Approved snapshot draft covered',
      passed: tableCoverage.includes('approved_plan_snapshots'),
      severity: 'blocking',
      message: 'The draft registry must cover approved_plan_snapshots.',
    }),
    check({
      id: 'migration-drafts-rls-covered',
      label: 'RLS draft covered',
      passed: hasDraft(plan, '007_rls_policy_drafts'),
      severity: 'error',
      message: 'The draft registry must include the RLS policy draft file.',
    }),
    check({
      id: 'migration-drafts-storage-covered',
      label: 'Storage draft covered',
      passed: hasDraft(plan, '008_storage_bucket_policy_drafts'),
      severity: 'error',
      message: 'The draft registry must include the storage bucket policy draft file.',
    }),
    check({
      id: 'migration-drafts-no-active-path',
      label: 'No active migration path',
      passed: plan.files.every((file) => !file.path.startsWith('supabase/migrations/')),
      severity: 'blocking',
      message: 'Draft SQL must not be placed in supabase/migrations/.',
    }),
    check({
      id: 'migration-drafts-warning-no-sql-run',
      label: 'No SQL run warning',
      passed: lowerWarnings.includes('no sql has been run') || lowerWarnings.includes('do not run'),
      severity: 'blocking',
      message: 'The draft plan warnings must state that SQL has not been run and should not be run.',
    }),
  ]
  const status = aggregateStatus(checks)

  return {
    status,
    summary: status === 'passed'
      ? 'SQL migration draft registry is review-only and keeps every file outside the active Supabase migration path.'
      : 'SQL migration draft registry needs review before future migration hardening.',
    checks,
  }
}

