import type {
  EditLevelMarkerContextPolicy,
  EditLevelQwenContextPolicy,
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface CreateEditLevelSourceUnderstandingPackageRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelSourceUnderstandingPackageResponse {
  routingPackage: EditLevelSourceUnderstandingPolicyPackage
  mockOnly: true
}

export interface CreateEditLevelMarkerContextPolicyRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelMarkerContextPolicyResponse {
  markerContextPolicy: EditLevelMarkerContextPolicy
  mockOnly: true
}

export interface CreateEditLevelQwenContextPolicyRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQwenContextPolicyResponse {
  qwenContextPolicy: EditLevelQwenContextPolicy
  mockOnly: true
}

export interface ValidateEditLevelSourceUnderstandingRequest {
  routingPackage: EditLevelSourceUnderstandingPolicyPackage
  mockOnly: true
}

export interface ValidateEditLevelSourceUnderstandingResponse {
  validation: EditLevelSourceUnderstandingValidationResult
  mockOnly: true
}

export interface CreateEditLevelSourceUnderstandingSummaryRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelSourceUnderstandingSummaryResponse {
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  mockOnly: true
}
