import type {
  QwenProviderReadiness,
  QwenRuntimeBoundaryContext,
  QwenRuntimeBoundaryValidationResult,
  QwenRuntimeReadiness,
  QwenSecretReference,
} from '../../types'

export interface CreateQwenRuntimeBoundaryContextRequest {
  mockOnly?: true
}

export interface CreateQwenRuntimeBoundaryContextResponse {
  context: QwenRuntimeBoundaryContext
}

export interface ListQwenSecretReferencesRequest {
  mockOnly?: true
}

export interface ListQwenSecretReferencesResponse {
  secretReferences: QwenSecretReference[]
}

export interface ResolveQwenSecretValueDisabledRequest {
  symbolicName: string
}

export interface ResolveQwenSecretValueDisabledResponse {
  ok: false
  valueAccessed: false
  valuePrinted: false
  gcloudCommandRun: false
  warning: string
}

export interface CreateQwenProviderReadinessRequest {
  context?: QwenRuntimeBoundaryContext
}

export interface CreateQwenProviderReadinessResponse {
  readiness: QwenProviderReadiness
}

export interface ValidateQwenRuntimeBoundaryRequest {
  readiness: QwenRuntimeReadiness
}

export interface ValidateQwenRuntimeBoundaryResponse {
  validation: QwenRuntimeBoundaryValidationResult
}

export interface CreateQwenRuntimeBoundarySummaryRequest {
  readiness: QwenRuntimeReadiness
}

export interface CreateQwenRuntimeBoundarySummaryResponse {
  summary: string
}
