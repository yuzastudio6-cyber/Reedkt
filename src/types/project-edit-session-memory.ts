import type {
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
} from './project-edit-session'

export type ProjectEditSessionMemoryUpdateSource =
  | 'user_message'
  | 'mock_assistant_response'
  | 'revision_request'
  | 'source_note'
  | 'preference_dna_application'
  | 'approval_event'
  | 'preview_event'
  | 'manual_mock_update'

export type ProjectEditSessionMemoryUpdateAction =
  | 'create_layer'
  | 'append_fact'
  | 'append_preference'
  | 'append_warning'
  | 'replace_summary'
  | 'merge_memory'
  | 'no_op'

export type ProjectEditSessionMemoryConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type ProjectEditSessionMemorySafetyStatus =
  | 'safe_mock_update'
  | 'requires_user_review'
  | 'blocked_sensitive'
  | 'blocked_model_required'
  | 'failed_validation'

export interface ProjectEditSessionMemoryLayerDefinition {
  layer: ProjectEditSessionMemoryLayer
  displayName: string
  purpose: string
  examples: string[]
  futureQwenRole?: string
  mockOnly: boolean
}

export interface ProjectEditSessionMemoryExtraction {
  id: string
  projectId: string
  editSessionId: string
  source: ProjectEditSessionMemoryUpdateSource
  sourceMessageId?: string
  sourceRevisionId?: string
  targetLayers: ProjectEditSessionMemoryLayer[]
  extractedFacts: string[]
  extractedPreferences: string[]
  extractedWarnings: string[]
  proposedSummary?: string
  confidence: ProjectEditSessionMemoryConfidence
  safetyStatus: ProjectEditSessionMemorySafetyStatus
  mockOnly: boolean
  notes: string[]
}

export interface ProjectEditSessionMemoryUpdatePlan {
  id: string
  projectId: string
  editSessionId: string
  extraction: ProjectEditSessionMemoryExtraction
  actions: Array<{
    layer: ProjectEditSessionMemoryLayer
    action: ProjectEditSessionMemoryUpdateAction
    value: string
    reason: string
  }>
  shouldPersist: boolean
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionMemoryPackage {
  id: string
  projectId: string
  editSessionId: string
  layers: ProjectEditSessionMemoryRecord[]
  readableSummary: string
  factsCount: number
  preferencesCount: number
  warningsCount: number
  updatedAt: string
  mockOnly: boolean
}

export interface ProjectEditSessionMemoryValidationResult {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
  providerCallMade: false
  qwenCallMade: false
  deepSeekCallMade: false
  supabaseWriteMade: false
  storageWriteMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export const REEDITPRO_PROJECT_EDIT_SESSION_MEMORY_RULE =
  'Project Edit Session memory stores structured mock context for a persistent Edit Chat and must not call models, embeddings, workers, providers, or remote storage.'

export const REEDITPRO_PROJECT_EDIT_SESSION_MEMORY_NO_QWEN_RULE =
  'RP-EDITSESSION-08 uses deterministic mock memory extraction only; Qwen-assisted memory remains future gated work.'

export const REEDITPRO_PROJECT_EDIT_SESSION_MEMORY_SAFE_PERSISTENCE_RULE =
  'Memory updates must go through Project Edit Session API/repository seams and must not bypass the mock/local boundaries.'
