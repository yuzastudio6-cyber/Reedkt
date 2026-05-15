import type {
  GeneratedAssetRecord,
  GeneratedAssetTimingMapRecord,
  GenerationProviderRecord,
  GenerationRequestInputRecord,
  GenerationRequestRecord,
} from '../../types'

export interface CreateGenerationRequestRequest {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditEstimateId?: string
  creditReservationId?: string
  strokeMotionPlanId?: string
}

export interface CreateGenerationRequestResponse {
  generationRequest: GenerationRequestRecord
}

export interface CreateGenerationProviderResponse {
  provider: GenerationProviderRecord
}

export interface CreateGenerationRequestInputsResponse {
  inputs: GenerationRequestInputRecord[]
}

export interface CreateGeneratedAssetResponse {
  generatedAsset: GeneratedAssetRecord
}

export interface CreateGeneratedAssetTimingMapResponse {
  timingMap: GeneratedAssetTimingMapRecord
}
