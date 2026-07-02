import type {
  QwenMarkerChatBridgeResult,
  QwenMarkerChatRuntimeRequest,
  QwenRuntimeAdapterScenario,
  QwenRuntimeConfig,
  QwenSecretResolutionDiagnostic,
  QwenStructuredResponseValidationResult,
} from '../../types'

export interface QwenRuntimeBetaConfigRequest {
  env?: Record<string, string | undefined>
}

export interface QwenRuntimeBetaConfigResponse {
  config: QwenRuntimeConfig
}

export interface QwenSecretManagerRuntimeRequest {
  symbolicName: string
  env?: Record<string, string | undefined>
}

export interface QwenSecretManagerRuntimeResponse {
  diagnostic: QwenSecretResolutionDiagnostic
}

export interface QwenStructuredMarkerChatValidationRequest {
  candidate: unknown
}

export interface QwenStructuredMarkerChatValidationResponse {
  validation: QwenStructuredResponseValidationResult
}

export interface QwenMarkerChatBridgeRequest {
  request: QwenMarkerChatRuntimeRequest
}

export interface QwenMarkerChatBridgeResponse {
  result: QwenMarkerChatBridgeResult
}

export interface QwenRuntimeBetaScenarioListResponse {
  scenarios: QwenRuntimeAdapterScenario[]
}
