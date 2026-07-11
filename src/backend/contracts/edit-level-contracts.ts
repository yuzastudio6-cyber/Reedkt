import type {
  EditLevelEstimateProfile,
  EditLevelFallbackPolicy,
  EditLevelNormalizationInput,
  EditLevelNormalizationResult,
  EditLevelProfile,
  EditLevelProfileDebugModel,
  EditLevelQAProfileDefinition,
  EditLevelRecommendationInput,
  EditLevelRecommendationResult,
  EditLevelToolRoutingProfile,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface ListEditLevelProfilesRequest {
  includeMockOnly: boolean
}

export interface ListEditLevelProfilesResponse {
  profiles: EditLevelProfile[]
  mockOnly: true
}

export interface GetEditLevelProfileRequest {
  level: ReEditProCanonicalEditLevel
}

export interface GetEditLevelProfileResponse {
  profile?: EditLevelProfile
  found: boolean
  mockOnly: true
}

export interface NormalizeEditLevelInputRequest {
  input: EditLevelNormalizationInput
}

export interface NormalizeEditLevelInputResponse {
  result: EditLevelNormalizationResult
  mockOnly: true
}

export interface CreateEditLevelUICardsRequest {
  recommendedLevel?: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelUICardsResponse {
  cards: EditLevelUICardModel[]
  mockOnly: true
}

export interface CreateEditLevelRecommendationRequest {
  input: EditLevelRecommendationInput
}

export interface CreateEditLevelRecommendationResponse {
  recommendation: EditLevelRecommendationResult
  mockOnly: true
}

export interface CreateEditLevelToolRoutingRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelToolRoutingResponse {
  routing: EditLevelToolRoutingProfile
  mockOnly: true
}

export interface CreateEditLevelQAProfileRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelQAProfileResponse {
  qaProfile: EditLevelQAProfileDefinition
  mockOnly: true
}

export interface CreateEditLevelEstimateRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelEstimateResponse {
  estimate: EditLevelEstimateProfile
  fallbackPolicy: EditLevelFallbackPolicy
  mockOnly: true
}

export interface ValidateEditLevelProfilesRequest {
  requireExactlyThreeProfiles: boolean
}

export interface ValidateEditLevelProfilesResponse {
  ok: boolean
  scenarioCount: number
  errors: string[]
  warnings: string[]
  mockOnly: true
}

export interface CreateEditLevelSummaryRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelSummaryResponse {
  debugModel: EditLevelProfileDebugModel
  summary: string[]
  mockOnly: true
}
