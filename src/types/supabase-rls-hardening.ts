export type RlsAccessDecision =
  | 'allow'
  | 'deny'
  | 'service_only'
  | 'owner_only'
  | 'workspace_member'
  | 'future_review'

export type RlsReviewStatus =
  | 'draft'
  | 'needs_review'
  | 'hardened_draft'
  | 'blocked'
  | 'ready_for_testing'

export type DataSensitivityLevel =
  | 'public'
  | 'internal'
  | 'private'
  | 'sensitive'
  | 'restricted'

export interface RlsTableAccessPlan {
  tableName: string
  sensitivity: DataSensitivityLevel
  userSelect: RlsAccessDecision
  userInsert: RlsAccessDecision
  userUpdate: RlsAccessDecision
  userDelete: RlsAccessDecision
  serviceInsert: RlsAccessDecision
  serviceUpdate: RlsAccessDecision
  immutableAfterApproval: boolean
  appendOnly: boolean
  reviewStatus: RlsReviewStatus
  notes: string[]
}

export interface RlsHardeningCheck {
  id: string
  tableName?: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'error' | 'blocking'
  message: string
  recommendation: string
}

export interface RlsHardeningPlan {
  id: string
  summary: string
  tableAccessPlans: RlsTableAccessPlan[]
  checks: RlsHardeningCheck[]
  overallStatus: RlsReviewStatus
  blockingIssues: string[]
  needsReviewItems: string[]
  notes: string[]
}

export interface MigrationReviewCheck {
  id: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'error' | 'blocking'
  message: string
  recommendation: string
}

export interface MigrationReviewPlan {
  id: string
  summary: string
  reviewedDraftFiles: string[]
  checks: MigrationReviewCheck[]
  rlsHardeningPlan: RlsHardeningPlan
  privacyRetentionNotes: string[]
  overallStatus: RlsReviewStatus
  limitations: string[]
  nextSteps: string[]
}

