import type {
  EditLevelEstimatePackage,
  EditLevelEstimateRange,
  EditLevelEstimateSideEffectFlags,
  EditLevelEstimateValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface CreateEditLevelEstimatePackageRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelEstimatePackageResponse {
  estimatePackage: EditLevelEstimatePackage
  sideEffectFlags: EditLevelEstimateSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelTimeEstimateRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelTimeEstimateResponse {
  timeEstimateRange: EditLevelEstimateRange
  mockOnly: true
}

export interface CreateEditLevelCreditEstimateRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelCreditEstimateResponse {
  creditEstimateRange: EditLevelEstimateRange
  creditEstimateMultiplier: number
  estimateOnly: true
  creditsReservedOrSpent: false
  creditRecordCreated: false
  mockOnly: true
}

export interface CreateEditLevelRenderBudgetRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelRenderBudgetResponse {
  renderPassBudgetFuture: number
  variantBudgetFuture: number
  renderJobCreated: false
  mockOnly: true
}

export interface ValidateEditLevelEstimateRequest {
  estimatePackage: EditLevelEstimatePackage
  mockOnly: true
}

export interface ValidateEditLevelEstimateResponse {
  validation: EditLevelEstimateValidationResult
  sideEffectFlags: EditLevelEstimateSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelEstimateSummaryRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelEstimateSummaryResponse {
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  mockOnly: true
}
