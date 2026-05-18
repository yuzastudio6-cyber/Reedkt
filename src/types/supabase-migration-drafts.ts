export interface MigrationDraftFilePlan {
  id: string
  fileName: string
  path: string
  purpose: string
  tablesCovered: string[]
  status: 'draft_only' | 'needs_review' | 'ready_for_real_migration'
  mustNotRun: boolean
  reviewChecklist: string[]
}

export interface MigrationDraftPlan {
  id: string
  summary: string
  files: MigrationDraftFilePlan[]
  warnings: string[]
  nextSteps: string[]
}

export interface MigrationDraftValidationCheck {
  id: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'error' | 'blocking'
  message: string
  recommendation?: string
}

export interface MigrationDraftValidationReport {
  status: 'passed' | 'warning' | 'failed'
  summary: string
  checks: MigrationDraftValidationCheck[]
}

