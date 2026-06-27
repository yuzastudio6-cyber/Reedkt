import type {
  EditLevelQAGatePackage,
  EditLevelQAGateSideEffectFlags,
  EditLevelQAGateValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface CreateEditLevelQAGatePackageRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQAGatePackageResponse {
  qaGatePackage: EditLevelQAGatePackage
  sideEffectFlags: EditLevelQAGateSideEffectFlags
  mockOnly: true
}

export interface ValidateEditLevelQAGatePackageRequest {
  qaGatePackage: EditLevelQAGatePackage
  mockOnly: true
}

export interface ValidateEditLevelQAGatePackageResponse {
  validation: EditLevelQAGateValidationResult
  sideEffectFlags: EditLevelQAGateSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelQAReadinessRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQAReadinessResponse {
  readinessStatus: EditLevelQAGatePackage['readinessStatus']
  readinessSummary: string
  blockingGateCount: number
  futureGateCount: number
  mockOnly: true
}

export interface CreateEditLevelQAFallbackRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQAFallbackResponse {
  fallbacks: string[]
  warnings: string[]
  degradedGateCount: number
  mockOnly: true
}

export interface CreateEditLevelQAGateSummaryRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQAGateSummaryResponse {
  userFacingSummary: string
  technicalSummary: string
  readinessSummary: string
  warnings: string[]
  mockOnly: true
}
