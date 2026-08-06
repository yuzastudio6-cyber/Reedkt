export type SupabaseProductionReadinessStatus =
  | 'not_started'
  | 'migration_files_ready'
  | 'local_testing_required'
  | 'staging_testing_required'
  | 'production_blocked'
  | 'production_ready_pending_approval'

export interface SupabaseProductionReadinessCheck {
  id: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'error' | 'blocking'
  message: string
  recommendation: string
}

export interface SupabaseProductionReadinessPlan {
  id: string
  status: SupabaseProductionReadinessStatus
  migrationBaselineStatus: 'reproducible' | 'blocked_by_parallel_foundations'
  securitySourceStatus: 'static_review_clear' | 'blocked_by_security_findings'
  summary: string
  activeMigrationFiles: string[]
  manualTestFiles: string[]
  checks: SupabaseProductionReadinessCheck[]
  localTestingSteps: string[]
  stagingTestingSteps: string[]
  productionBlockers: string[]
  nextSteps: string[]
  limitations: string[]
}
