import type { ProjectEditBriefMarkerIntentAction, ProjectEditBriefMarkerIntentStatus } from './project-edit-brief'

export type QwenBetaRuntimeMode =
  | 'disabled'
  | 'beta_enabled'

export type QwenRuntimeTransportProfile =
  | 'openai_chat_completions'
  | 'generic_json_post'

export type QwenRuntimeConfigStatus =
  | 'blocked_missing_beta_flag'
  | 'blocked_missing_secret_reference'
  | 'blocked_missing_project'
  | 'blocked_missing_base_url'
  | 'blocked_missing_model_id'
  | 'ready_for_secret_resolution'
  | 'ready_for_provider_call'

export type QwenSecretRuntimeStatus =
  | 'not_attempted'
  | 'blocked_missing_beta_config'
  | 'blocked_missing_project'
  | 'blocked_missing_secret_reference'
  | 'resolved_no_print'
  | 'failed_redacted'

export type QwenProviderRuntimeStatus =
  | 'not_attempted'
  | 'blocked_config'
  | 'blocked_secret'
  | 'provider_response_valid'
  | 'provider_response_invalid'
  | 'provider_timeout'
  | 'provider_rate_limited'
  | 'provider_error'
  | 'empty_response'
  | 'deterministic_fallback_used'

export type QwenProviderTransportStatus =
  | 'not_attempted'
  | 'request_built'
  | 'completed'
  | 'timeout'
  | 'rate_limited'
  | 'failed'
  | 'invalid_json'
  | 'empty_response'

export type QwenRuntimeFallbackStatus =
  | 'not_needed'
  | 'deterministic_fallback_used'

export type QwenStructuredResponseValidationStatus =
  | 'valid'
  | 'invalid_missing_field'
  | 'invalid_unsupported_action'
  | 'invalid_unsupported_status'
  | 'invalid_array_field'
  | 'invalid_unsafe_copy_instruction'
  | 'invalid_empty_response'
  | 'invalid_json'

export interface QwenRuntimeSafetyFlags {
  providerCallMade: boolean
  modelCallMade: boolean
  qwenCallMade: boolean
  deepSeekCallMade: false
  gcloudCommandRun: false
  secretValuePrinted: false
  secretSentToFrontend: false
  authorizationHeaderLogged: false
  supabaseCommandRun: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  soundRuntimeInvoked: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  editPlanCreated: false
  plannerExecuted: false
  creditReservedOrSpent: false
}

export interface QwenRuntimeConfig {
  providerName: 'qwen_3_7'
  role: 'reasoning_brain'
  runtimeMode: QwenBetaRuntimeMode
  status: QwenRuntimeConfigStatus
  transportProfile: QwenRuntimeTransportProfile
  projectIdConfigured: boolean
  apiKeySecretReferenceName?: string
  baseUrlSecretReferenceName?: string
  modelIdSecretReferenceName?: string
  legacyRuntimeConfigSecretReferenceName?: string
  baseUrlConfigured: boolean
  modelIdConfigured: boolean
  requestPath: string
  timeoutMs: number
  maxRetries: number
  fallbackMode: 'deterministic_marker_chat'
  warnings: string[]
}

export interface QwenSecretResolutionDiagnostic extends QwenRuntimeSafetyFlags {
  status: QwenSecretRuntimeStatus
  symbolicName: string
  referenceNameConfigured: boolean
  valueAccessed: boolean
  valueLength?: number
  redactedFingerprint?: string
  warning?: string
}

export interface QwenSecretResolutionInternalResult extends QwenSecretResolutionDiagnostic {
  value?: string
}

export interface QwenProviderTransportRequest {
  profile: QwenRuntimeTransportProfile
  baseUrl: string
  requestPath: string
  modelId: string
  systemPrompt: string
  userPrompt: string
  timeoutMs: number
  maxRetries: number
}

export interface QwenProviderTransportResult extends QwenRuntimeSafetyFlags {
  status: QwenProviderTransportStatus
  httpStatus?: number
  parsedJson?: unknown
  redactedRawPreview?: string
  warnings: string[]
}

export interface QwenRuntimeUsageRecord {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  providerUsageReturned: boolean
  usageEstimated: boolean
  creditReservedOrSpent: false
  notes: string[]
}

export interface QwenMarkerChatStructuredResponse {
  assistantMessage: string
  action: ProjectEditBriefMarkerIntentAction
  status: Extract<ProjectEditBriefMarkerIntentStatus, 'draft_intent' | 'needs_clarification' | 'needs_asset' | 'confirmed' | 'blocked'>
  visualBehavior: string
  audioBehavior: string
  captionBehavior: string
  assetRequirement?: string
  confidence: 'low' | 'medium' | 'high'
  blockingNeeds: string[]
  plannerHints: string[]
  doNotCopyNotes: string[]
  clarificationQuestion?: string
  suggestions?: string[]
  safetyWarnings: string[]
}

export interface QwenStructuredResponseValidationResult extends QwenRuntimeSafetyFlags {
  ok: boolean
  status: QwenStructuredResponseValidationStatus
  response?: QwenMarkerChatStructuredResponse
  errors: string[]
  warnings: string[]
}

export interface QwenRuntimeAdapterScenario {
  id: string
  title: string
  category: string
  expectedStatus:
    | QwenProviderRuntimeStatus
    | QwenRuntimeConfigStatus
    | QwenSecretRuntimeStatus
    | QwenProviderTransportStatus
    | QwenStructuredResponseValidationStatus
  fallbackExpected: boolean
  qwenCallAllowed: boolean
  productionSideEffectsExpected: false
}

export const REEDITPRO_QWEN_BETA_RUNTIME_RULE =
  'Qwen 3.7 Max beta runtime is backend-only and requires REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled plus Secret Manager runtime config before any provider call.'

export const REEDITPRO_QWEN_BETA_SECRET_RULE =
  'Qwen beta runtime may resolve secrets server-side through Secret Manager only; secret values must never be logged, printed, committed, or sent to browser code.'

export const REEDITPRO_QWEN_BETA_NO_EXECUTION_RULE =
  'Qwen beta Marker Chat understands marker intent only; it must not render video, run workers, process media, create edit plans, or reserve/spend credits.'
