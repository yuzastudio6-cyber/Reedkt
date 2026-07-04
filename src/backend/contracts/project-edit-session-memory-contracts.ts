import type {
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemoryExtraction,
  ProjectEditSessionMemoryPackage,
  ProjectEditSessionMemoryUpdatePlan,
  ProjectEditSessionMemoryUpdateSource,
  ProjectEditSessionMemoryValidationResult,
} from '../../types/project-edit-session-memory'

export interface ExtractProjectEditSessionMemoryRequest {
  projectId: string
  editSessionId: string
  text: string
  source: ProjectEditSessionMemoryUpdateSource
  sourceMessageId?: string
  sourceRevisionId?: string
}

export interface ExtractProjectEditSessionMemoryResponse {
  extraction: ProjectEditSessionMemoryExtraction
  validation: ProjectEditSessionMemoryValidationResult
}

export interface CreateProjectEditSessionMemoryUpdatePlanRequest {
  extraction: ProjectEditSessionMemoryExtraction
}

export interface CreateProjectEditSessionMemoryUpdatePlanResponse {
  updatePlan: ProjectEditSessionMemoryUpdatePlan
  validation: ProjectEditSessionMemoryValidationResult
}

export interface ApplyProjectEditSessionMemoryUpdateRequest {
  updatePlan: ProjectEditSessionMemoryUpdatePlan
  existingLayers?: ProjectEditSessionMemoryRecord[]
}

export interface ApplyProjectEditSessionMemoryUpdateResponse {
  layers: ProjectEditSessionMemoryRecord[]
  validation: ProjectEditSessionMemoryValidationResult
}

export interface CreateProjectEditSessionMemoryPackageRequest {
  projectId: string
  editSessionId: string
  layers: ProjectEditSessionMemoryRecord[]
}

export interface CreateProjectEditSessionMemoryPackageResponse {
  memoryPackage: ProjectEditSessionMemoryPackage
  validation: ProjectEditSessionMemoryValidationResult
}

export interface ValidateProjectEditSessionMemoryRequest {
  extraction?: ProjectEditSessionMemoryExtraction
  updatePlan?: ProjectEditSessionMemoryUpdatePlan
  memoryPackage?: ProjectEditSessionMemoryPackage
}

export interface ValidateProjectEditSessionMemoryResponse {
  validation: ProjectEditSessionMemoryValidationResult
}

export interface CreateProjectEditSessionMemorySummaryRequest {
  projectId: string
  editSessionId: string
  layers: ProjectEditSessionMemoryRecord[]
  focusLayer?: ProjectEditSessionMemoryLayer
}

export interface CreateProjectEditSessionMemorySummaryResponse {
  readableSummary: string
  chatSummary: string
  debugSummary: {
    layerCount: number
    factsCount: number
    preferencesCount: number
    warningsCount: number
    updatedAt: string
    mockOnly: true
  }
}
