export type ProductionHardeningCategory =
  | 'readiness_validation'
  | 'worker_security'
  | 'tool_security'
  | 'model_weight_policy'
  | 'cost_controls'
  | 'concurrency_limits'
  | 'observability'
  | 'logging_sanitization'
  | 'privacy_retention'
  | 'artifact_storage'
  | 'export_delivery'
  | 'audit_logs'
  | 'incident_response'
  | 'beta_readiness'

export type ProductionHardeningOverallStatus =
  | 'blocked'
  | 'warning'
  | 'ready_for_internal_testing'
  | 'ready_for_limited_beta'
  | 'not_ready'

export interface ProductionHardeningCheck {
  id: string
  category: ProductionHardeningCategory
  status: 'passed' | 'warning' | 'blocked'
  message: string
  manualReviewRequired: boolean
}

export interface ProductionReadinessScorecard {
  readinessScore: number
  blockerCount: number
  warningCount: number
  manualReviewCount: number
  categoryScores: Record<ProductionHardeningCategory, number>
  productionReadyAllowed: false
  limitedBetaAllowed: boolean
}

export interface ProductionLaunchBlockerSummary {
  hardBlockers: string[]
  warnings: string[]
  manualReviewItems: string[]
}

export interface ProductionRiskRegisterItem {
  id: string
  category: ProductionHardeningCategory
  severity: 'high' | 'medium' | 'low'
  risk: string
  mitigation: string
}

export interface ProductionHardeningReport {
  reportId: string
  createdAt: string
  overallStatus: ProductionHardeningOverallStatus
  categories: ProductionHardeningCategory[]
  scorecard: ProductionReadinessScorecard
  blockers: string[]
  warnings: string[]
  passedChecks: ProductionHardeningCheck[]
  failedChecks: ProductionHardeningCheck[]
  manualReviewItems: string[]
  riskRegister: ProductionRiskRegisterItem[]
  nextActions: string[]
  productionReadyAllowed: false
  limitedBetaAllowed: boolean
}
