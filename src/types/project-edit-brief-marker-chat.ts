import type {
  ProjectEditBriefIntentConfidence,
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerStatus,
} from './project-edit-brief'

export type ProjectEditBriefMarkerChatProcessingMode =
  | 'message_only'
  | 'extract_intent'
  | 'extract_and_confirm'
  | 'extract_and_clarify'
  | 'extract_and_suggest'

export type ProjectEditBriefMarkerChatResponseKind =
  | 'none'
  | 'mock_confirmation'
  | 'mock_clarifying_question'
  | 'mock_suggestions'
  | 'mock_boundary_notice'

export type ProjectEditBriefMarkerChatExtractionStatus =
  | 'not_processed'
  | 'processed_no_intent'
  | 'processed_intent_draft'
  | 'processed_needs_asset'
  | 'processed_needs_clarification'
  | 'processed_confirmed'
  | 'failed_validation'

export type ProjectEditBriefMarkerChatRuntimeSource =
  | 'deterministic_fallback'
  | 'qwen_live'

export interface ProjectEditBriefMarkerChatSafetyFlags {
  providerCallMade: false
  modelCallMade: false
  qwenCallMade: false
  deepSeekCallMade: false
  embeddingsUsed: false
  vectorDbUsed: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export interface ProjectEditBriefMarkerChatRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  messageText: string
  aiMode: ProjectEditBriefMarkerAIMode
  createdAt?: string
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatExtractionResult extends ProjectEditBriefMarkerChatSafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  userMessageId?: string
  processingMode: ProjectEditBriefMarkerChatProcessingMode
  extractionStatus: ProjectEditBriefMarkerChatExtractionStatus
  intentDraft?: Partial<ProjectEditBriefMarkerIntentRecord>
  responseKind: ProjectEditBriefMarkerChatResponseKind
  responseText?: string
  markerStatusSuggestion: ProjectEditBriefMarkerStatus
  blockingNeeds: string[]
  plannerHints: string[]
  confidence: ProjectEditBriefIntentConfidence
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatApplyResult extends ProjectEditBriefMarkerChatSafetyFlags {
  ok: boolean
  userMessage?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  updatedMarker?: ProjectEditBriefMarkerRecord
  runtimeSource?: ProjectEditBriefMarkerChatRuntimeSource
  fallbackReason?: string
  extraction: ProjectEditBriefMarkerChatExtractionResult
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatPanelModel extends ProjectEditBriefMarkerChatSafetyFlags {
  markerId: string
  title: string
  aiMode: ProjectEditBriefMarkerAIMode
  messages: ProjectEditBriefMarkerMessageRecord[]
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  statusLabel: string
  responseModeLabel: string
  boundarySummary: string
  canSendMessage: boolean
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefMarkerChatValidationResult extends ProjectEditBriefMarkerChatSafetyFlags {
  ok: boolean
  errors: string[]
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatScenario {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedProcessingMode: ProjectEditBriefMarkerChatProcessingMode
  expectedResponseKind: ProjectEditBriefMarkerChatResponseKind
  expectedExtractionStatus: ProjectEditBriefMarkerChatExtractionStatus
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatOrchestratorResult extends ProjectEditBriefMarkerChatSafetyFlags {
  request: ProjectEditBriefMarkerChatRequest
  extraction: ProjectEditBriefMarkerChatExtractionResult
  userMessage?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  updatedMarker?: ProjectEditBriefMarkerRecord
  panelModel?: ProjectEditBriefMarkerChatPanelModel
  validation: ProjectEditBriefMarkerChatValidationResult
  summary: string
  warnings: string[]
  nextStep: 'RP-EDITBRIEF-08 — Marker Attachments: B-roll, Image, Music, SFX'
  mockOnly: true
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_MARKER_CHAT_SCOPE_RULE =
  'Marker Chat is scoped to one Edit Brief marker and stores raw marker conversation plus structured marker intent for future planning.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_MARKER_CHAT_NO_MODEL_RULE =
  'RP-EDITBRIEF-07 uses deterministic mock marker intent extraction only; it must not call Qwen, DeepSeek, providers, embeddings, or vector DBs.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_MARKER_CHAT_NO_EXECUTION_RULE =
  'Marker Chat captures intent only; it must not start progress, media processing, workers, render, providers, Supabase, or credits.'
