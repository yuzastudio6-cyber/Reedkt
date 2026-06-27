import type {
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningSideEffectFlags,
  EditLevelQwenPlanningValidationResult,
  EditLevelQwenPromptPolicy,
  EditLevelQwenStructuredOutputPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface CreateEditLevelQwenPlanningProfileRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQwenPlanningProfileResponse {
  qwenPlanningProfile: EditLevelQwenPlanningProfilePackage
  sideEffectFlags: EditLevelQwenPlanningSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelQwenPromptPolicyRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQwenPromptPolicyResponse {
  promptPolicy: EditLevelQwenPromptPolicy
  mockOnly: true
}

export interface CreateEditLevelQwenStructuredOutputPolicyRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQwenStructuredOutputPolicyResponse {
  structuredOutputPolicy: EditLevelQwenStructuredOutputPolicy
  label: string
  mockOnly: true
}

export interface ValidateEditLevelQwenPlanningRequest {
  qwenPlanningProfile: EditLevelQwenPlanningProfilePackage
  mockOnly: true
}

export interface ValidateEditLevelQwenPlanningResponse {
  validation: EditLevelQwenPlanningValidationResult
  sideEffectFlags: EditLevelQwenPlanningSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelQwenPlanningSummaryRequest {
  level: ReEditProCanonicalEditLevel
  mockOnly: true
}

export interface CreateEditLevelQwenPlanningSummaryResponse {
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  mockOnly: true
}
