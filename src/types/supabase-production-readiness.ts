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
