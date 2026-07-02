import type { SupabaseProductionReadinessCheck, SupabaseProductionReadinessPlan } from '../types/supabase-production-readiness'

export const activeSupabaseMigrationFiles = [
  'supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql',
  'supabase/migrations/202605180002_reeditpro_media_source_sequence.sql',
  'supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql',
  'supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql',
  'supabase/migrations/202605180007_reeditpro_rls_policies.sql',
  'supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql',
] as const

export const manualSupabaseTestFiles = [
  'database/test-sql/001_rls_smoke_tests.sql',
  'database/test-sql/002_approved_snapshot_immutability_tests.sql',
  'database/test-sql/003_storage_policy_smoke_tests.sql',
  'database/test-sql/004_credit_audit_append_only_tests.sql',
] as const

function check(params: SupabaseProductionReadinessCheck): SupabaseProductionReadinessCheck {
  return params
}

export function createSupabaseProductionReadinessPlan(): SupabaseProductionReadinessPlan {
  const checks: SupabaseProductionReadinessCheck[] = [
    check({
      id: 'supabase-readiness-active-migrations-listed',
      label: 'Active migrations listed',
      passed: activeSupabaseMigrationFiles.length === 8,
      severity: 'warning',
      message: 'The RP-DATA-04 active Supabase migration files are listed for manual local/staging testing.',
      recommendation: 'Review every 20260518 migration before running Supabase CLI commands.',
    }),
    check({
      id: 'supabase-readiness-rls-migration-listed',
      label: 'RLS migration listed',
      passed: activeSupabaseMigrationFiles.some((file) => file.includes('rls_policies')),
      severity: 'blocking',
      message: 'RLS helper functions and policy SQL are represented by an active migration file.',
      recommendation: 'Test workspace/project isolation locally and in staging before production.',
    }),
    check({
      id: 'supabase-readiness-storage-migration-listed',
      label: 'Storage migration listed',
      passed: activeSupabaseMigrationFiles.some((file) => file.includes('storage_buckets_policies')),
      severity: 'blocking',
      message: 'Private storage bucket and storage object policy SQL are represented by an active migration file.',
      recommendation: 'Verify private buckets and project-scoped object access in local/staging.',
    }),
    check({
      id: 'supabase-readiness-manual-tests-listed',
      label: 'Manual SQL tests listed',
      passed: manualSupabaseTestFiles.length === 4,
      severity: 'warning',
      message: 'Manual smoke-test SQL files are listed for RLS, snapshot immutability, storage, and append-only checks.',
      recommendation: 'Run these only in local/staging Supabase testing after auth fixtures exist.',
    }),
    check({
      id: 'supabase-readiness-approved-snapshot-immutability',
      label: 'Approved snapshot immutability planned',
      passed: true,
      severity: 'blocking',
      message: 'The credits/approval migration includes immutable approved snapshot trigger planning.',
      recommendation: 'Manually verify update/delete failures against approved_plan_snapshots in local/staging.',
    }),
    check({
      id: 'supabase-readiness-audit-append-only',
      label: 'Audit append-only planned',
      passed: true,
      severity: 'blocking',
      message: 'The QA/export/audit migration includes append-only audit_events trigger planning.',
      recommendation: 'Manually verify audit update/delete attempts fail in local/staging.',
    }),
    check({
      id: 'supabase-readiness-credit-ledger-append-only',
      label: 'Credit ledger append-only planned',
      passed: true,
      severity: 'blocking',
      message: 'The credits migration includes append-only credit_ledger_entries trigger planning.',
      recommendation: 'Keep credit reservation and ledger writes backend/service controlled.',
    }),
    check({
      id: 'supabase-readiness-storage-private-default',
      label: 'Storage private by default',
      passed: true,
      severity: 'blocking',
      message: 'The storage migration creates ReeditPro buckets with public=false.',
      recommendation: 'Use signed URLs later and keep source media/browser captures/QA artifacts private.',
    }),
    check({
      id: 'supabase-readiness-no-sql-run',
      label: 'No SQL run by Codex',
      passed: true,
      severity: 'blocking',
      message: 'This readiness plan records migration files only; it does not execute SQL.',
      recommendation: 'Run SQL only in a later manual local/staging workflow.',
    }),
    check({
      id: 'supabase-readiness-no-supabase-connection',
      label: 'No Supabase connection',
      passed: true,
      severity: 'blocking',
      message: 'No Supabase client, connection, credentials, or environment variables are part of this plan.',
      recommendation: 'Introduce clients and secrets only in a future backend milestone.',
    }),
    check({
      id: 'supabase-readiness-local-testing-required',
      label: 'Local testing required',
      passed: true,
      severity: 'warning',
      message: 'The plan is intentionally local_testing_required, not production ready.',
      recommendation: 'Run local Supabase tests before staging.',
    }),
    check({
      id: 'supabase-readiness-advisors-required',
      label: 'Advisor review required',
      passed: true,
      severity: 'warning',
      message: 'Supabase Security Advisor and Performance Advisor review are required before production.',
      recommendation: 'Document any known advisor exceptions before approval.',
    }),
    check({
      id: 'supabase-readiness-no-service-role-frontend',
      label: 'No service role in frontend',
      passed: true,
      severity: 'blocking',
      message: 'Service-role writes are future backend/worker responsibilities and are not exposed to frontend code.',
      recommendation: 'Keep service-role secrets out of Vite/browser code.',
    }),
  ]

  return {
    id: 'supabase-production-readiness-rp-data-04',
    status: 'local_testing_required',
    summary: 'Active Supabase migration files are prepared for local/staging testing. Production remains blocked until manual tests, RLS/storage review, Supabase advisor checks, backups, and approval are complete.',
    activeMigrationFiles: [...activeSupabaseMigrationFiles],
    manualTestFiles: [...manualSupabaseTestFiles],
    checks,
    localTestingSteps: [
      'Review every 20260518 migration file before running Supabase CLI commands.',
      'Run local Supabase migration testing manually.',
      'Run the database/test-sql smoke-test checklists with environment-specific auth fixtures.',
      'Inspect RLS policies, storage buckets, triggers, and indexes.',
      'Generate database types later only after local schema is accepted.',
    ],
    stagingTestingSteps: [
      'Push migrations to staging only after local tests pass.',
      'Test user A/user B workspace and project isolation.',
      'Test approved snapshot immutability, audit append-only, and credit ledger append-only behavior.',
      'Test private storage and signed URL assumptions.',
      'Run Supabase Security Advisor and Performance Advisor.',
    ],
    productionBlockers: [
      'Local Supabase testing has not been run.',
      'Staging Supabase testing has not been run.',
      'Supabase Security Advisor has not been reviewed.',
      'Supabase Performance Advisor has not been reviewed.',
      'Backup/PITR and production rollback plan are not approved.',
      'No production migration approval has been recorded.',
    ],
    nextSteps: [
      'Run local Supabase tests manually in a future step.',
      'Fix any RLS/storage/index issues found locally.',
      'Test against staging with realistic workspace users.',
      'Approve production migration only after local/staging and advisor checks pass.',
    ],
    limitations: [
      'Codex did not run SQL.',
      'Codex did not connect Supabase.',
      'No Supabase client or backend route was implemented.',
      'No storage operation, provider call, worker execution, rendering, or billing logic was implemented.',
      'This is not a legal or security certification.',
    ],
  }
}
