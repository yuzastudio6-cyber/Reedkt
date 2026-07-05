export type QwenRuntimeMode =
  | 'mock_disabled'
  | 'secret_boundary_ready'
  | 'provider_config_ready'
  | 'runtime_adapter_future'
  | 'runtime_enabled_future'

export type QwenRuntimeGateStatus =
  | 'blocked_owner_approval'
  | 'blocked_secret_manager'
  | 'blocked_provider_config'
  | 'blocked_runtime_adapter'
  | 'blocked_structured_validation'
  | 'blocked_rate_limit_policy'
  | 'blocked_usage_policy'
  | 'blocked_security_review'
  | 'ready_boundary_only'
  | 'ready_for_fake_adapter'
  | 'ready_for_runtime_adapter_future'

export type QwenSecretReferenceStatus =
  | 'not_configured'
  | 'symbolic_reference_only'
  | 'resolver_disabled'
  | 'resolver_ready_no_access'
  | 'secret_value_unavailable'
  | 'secret_value_access_future'

export type QwenProviderCallStatus =
  | 'not_attempted'
  | 'blocked_by_gate'
  | 'mock_fallback_used'
  | 'future_real_call_allowed'

export type QwenRuntimeBoundaryCheck =
  | 'server_only_import'
  | 'no_frontend_secret_access'
  | 'no_secret_value_logging'
  | 'no_gcloud_command'
  | 'no_provider_call'
  | 'no_marker_chat_runtime_change'
  | 'fallback_available'
  | 'structured_validation_required'

export interface QwenRuntimeBoundaryContext {
  mode: QwenRuntimeMode
  gateStatus: QwenRuntimeGateStatus
  ownerApproval: 'pending' | 'approved_future'
  providerName: 'qwen_3_7'
  role: 'reasoning_brain'
  mockOnly: boolean
  notes: string[]
}

export interface QwenSecretReference {
  id: string
  providerName: 'qwen_3_7'
  purpose: 'reasoning_api_key' | 'reasoning_base_url' | 'runtime_config'
  referenceStatus: QwenSecretReferenceStatus
  symbolicName: string
  valueAccessed: false
  valuePrinted: false
  frontendVisible: false
  mockOnly: boolean
  warnings: string[]
}

export interface QwenRuntimeReadiness {
  context: QwenRuntimeBoundaryContext
  secretReferences: QwenSecretReference[]
  providerCallStatus: QwenProviderCallStatus
  canResolveSecretValue: false
  canCreateProviderClient: false
  canCallProvider: false
  canWireMarkerChat: false
  canUseFallback: true
  requiredNextGates: string[]
  mockOnly: boolean
}

export interface QwenRuntimeBoundaryValidationCheckResult {
  check: QwenRuntimeBoundaryCheck
  passed: boolean
  summary: string
}

export interface QwenRuntimeBoundaryValidationResult {
  ok: boolean
  blocked: boolean
  checks: QwenRuntimeBoundaryValidationCheckResult[]
  blockedReasons: string[]
  warnings: string[]
  secretValueAccessed: false
  secretValuePrinted: false
  gcloudCommandRun: false
  providerCallMade: false
  markerChatRuntimeChanged: false
  mockOnly: boolean
}

export interface QwenDisabledSecretResolverResult {
  ok: false
  status: 'blocked'
  symbolicName: string
  value?: never
  valueAccessed: false
  valuePrinted: false
  gcloudCommandRun: false
  secretMetadataInspected: false
  warning: string
  mockOnly: true
}

export interface QwenProviderReadiness {
  providerName: 'qwen_3_7'
  gateStatus: QwenRuntimeGateStatus
  providerCallStatus: QwenProviderCallStatus
  canCreateProviderClient: false
  canCallProvider: false
  providerClientCreated: false
  qwenCallMade: false
  deepSeekCallMade: false
  providerCallMade: false
  mockFallbackAvailable: true
  structuredValidationRequired: true
  warnings: string[]
  mockOnly: true
}

export interface QwenSecretRedactionResult {
  inputContainedSecretLikeValue: boolean
  redactedText: string
  replacements: number
  secretValuePrinted: false
  mockOnly: true
}

export interface QwenRuntimeBoundaryScenario {
  id: string
  title: string
  expectedOk: boolean
  expectedGateStatus: QwenRuntimeGateStatus
  expectedSecretValueAccessed: false
  expectedProviderCallMade: false
  mockOnly: true
}

export interface QwenRuntimeBoundaryOrchestratorResult {
  context: QwenRuntimeBoundaryContext
  secretReferences: QwenSecretReference[]
  readiness: QwenRuntimeReadiness
  validation: QwenRuntimeBoundaryValidationResult
  summary: string
  warnings: string[]
  nextStep: 'RP-QWEN-02 - Backend Qwen 3.7 Max Adapter'
}

export const REEDITPRO_QWEN_RUNTIME_BOUNDARY_RULE =
  'Qwen 3.7 Max is ReEditPro backend-only reasoning brain; browser code must never receive provider secrets or call Qwen directly.'

export const REEDITPRO_QWEN_SECRET_MANAGER_NO_VALUE_RULE =
  'RP-QWEN-01 may define secret references and disabled resolver boundaries, but must not inspect, access, print, or log Secret Manager values.'

export const REEDITPRO_QWEN_RUNTIME_NO_PROVIDER_CALL_RULE =
  'RP-QWEN-01 prepares the runtime boundary only; it must not create provider clients, call Qwen, or modify Marker Chat runtime behavior.'
