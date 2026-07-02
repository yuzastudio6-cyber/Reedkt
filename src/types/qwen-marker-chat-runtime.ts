import type {
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
} from './project-edit-brief'
import type {
  QwenMarkerChatStructuredResponse,
  QwenProviderRuntimeStatus,
  QwenRuntimeConfig,
  QwenRuntimeFallbackStatus,
  QwenRuntimeSafetyFlags,
  QwenRuntimeUsageRecord,
  QwenStructuredResponseValidationResult,
} from './qwen-runtime-adapter'

export type QwenMarkerChatRuntimeSource =
  | 'backend_route'
  | 'runtime_smoke'
  | 'orchestrator'

export type QwenMarkerChatBridgeStatus =
  | 'qwen_beta_completed'
  | 'fallback_completed'
  | 'blocked_validation'
  | 'blocked_missing_marker'
  | 'failed_safe'

export interface QwenMarkerChatRuntimeRequest {
  id: string
  source: QwenMarkerChatRuntimeSource
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  messageText: string
  runtimeMode: 'qwen_beta'
  createdAt: string
}

export interface QwenMarkerChatPromptPackage extends QwenRuntimeSafetyFlags {
  id: string
  markerId: string
  systemPrompt: string
  userPrompt: string
  schemaName: 'QwenMarkerChatStructuredResponse'
  includedContext: string[]
  excludedContext: string[]
}

export interface QwenMarkerChatBridgeResult extends QwenRuntimeSafetyFlags {
  ok: boolean
  status: QwenMarkerChatBridgeStatus
  runtimeStatus: QwenProviderRuntimeStatus
  fallbackStatus: QwenRuntimeFallbackStatus
  config: QwenRuntimeConfig
  request: QwenMarkerChatRuntimeRequest
  promptPackage: QwenMarkerChatPromptPackage
  drawer?: ProjectEditBriefMarkerDrawerModel
  userMessage?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  structuredResponse?: QwenMarkerChatStructuredResponse
  validation: QwenStructuredResponseValidationResult
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  updatedMarker?: ProjectEditBriefMarkerRecord
  usage: QwenRuntimeUsageRecord
  warnings: string[]
  publicSummary: string
}

export interface QwenMarkerChatRuntimeValidationResult extends QwenRuntimeSafetyFlags {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface QwenRuntimeBetaOrchestratorResult extends QwenRuntimeSafetyFlags {
  config: QwenRuntimeConfig
  bridgeResult: QwenMarkerChatBridgeResult
  scenarioCount: number
  summary: string
  nextStep: 'RP-QWEN-BETA-02'
}

export const REEDITPRO_QWEN_MARKER_CHAT_BACKEND_ONLY_RULE =
  'Qwen Marker Chat beta bridge is backend-only; React and browser-safe adapters must never import backend qwen-runtime modules.'

export const REEDITPRO_QWEN_MARKER_CHAT_FALLBACK_RULE =
  'Qwen Marker Chat beta must keep deterministic local fallback for disabled config, Secret Manager failure, provider failure, timeout, invalid schema, unsafe response, rate limit, or empty response.'

export const REEDITPRO_QWEN_MARKER_CHAT_NO_PLAN_EXECUTION_RULE =
  'Qwen Marker Chat beta may create marker intent and planner hints only; it must not create real edit plans or start planner execution.'
