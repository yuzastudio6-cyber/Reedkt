import type {
  EditLevelQwenReasoningDepth,
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
} from './edit-level'

export type EditLevelQwenPlanningDimensionId =
  | 'qwen_reasoning_depth'
  | 'planning_pass_count'
  | 'prompt_context_budget'
  | 'source_context_depth'
  | 'marker_context_depth'
  | 'edit_brief_marker_priority'
  | 'preference_dna_usage'
  | 'qwen25vl_visual_summary_usage'
  | 'transcript_usage'
  | 'audio_context_usage'
  | 'graphic_text_context_usage'
  | 'qa_warning_usage'
  | 'plan_hint_complexity'
  | 'fallback_behavior'
  | 'usage_estimate_policy'
  | 'credit_behavior'

export type EditLevelQwenPlanningRequiredness =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'future_only'
  | 'not_used'

export type EditLevelQwenPlanningStatus =
  | 'available_mock'
  | 'available_beta'
  | 'runtime_disabled'
  | 'provider_required'
  | 'worker_required'
  | 'future_gated'
  | 'not_required'
  | 'degraded_fallback'

export type EditLevelQwenPlanningPassPolicy =
  | 'single_pass'
  | 'two_pass'
  | 'studio_multi_pass'

export type EditLevelQwenPromptContextPolicy =
  | 'compact'
  | 'enhanced'
  | 'studio'

export type EditLevelQwenStructuredOutputPolicy =
  | 'simple_professional_plan_hints'
  | 'layered_creative_plan_hints'
  | 'studio_multi_layer_plan_hints'

export type EditLevelQwenCreditBehavior = 'estimate_only_no_spend'

export interface EditLevelQwenPlanningSideEffectFlags {
  mockOnly: true
  providerCallMade: false
  qwenCallMade: false
  qwen25vlCallMade: false
  deepseekCallMade: false
  plannerExecuted: false
  editPlanCreated: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  fileBytesRead: false
  externalUrlFetched: false
}

export interface EditLevelQwenPlanningDimensionDefinition {
  dimensionId: EditLevelQwenPlanningDimensionId
  displayName: string
  purpose: string
  defaultStatus: EditLevelQwenPlanningStatus
  mockOnly: true
}

export interface EditLevelQwenPlanningDimensionRoute extends EditLevelQwenPlanningSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  dimensionId: EditLevelQwenPlanningDimensionId
  displayName: string
  requiredness: EditLevelQwenPlanningRequiredness
  status: EditLevelQwenPlanningStatus
  policyValue: string
  purpose: string
  fallback: string
  userFacingSummary: string
  technicalNotes: string[]
  sideEffectFlags: EditLevelQwenPlanningSideEffectFlags
}

export interface EditLevelQwenPromptPolicy {
  level: ReEditProCanonicalEditLevel
  promptContextPolicy: EditLevelQwenPromptContextPolicy
  includeUserPrompt: boolean
  includeSourceSummary: boolean
  includeMarkerContext: boolean
  includeEditBriefMarkers: boolean
  includePreferenceDNA: boolean
  includeQwen25VLVisualSummary: boolean
  includeTranscriptSummary: boolean
  includeAudioSummary: boolean
  includeGraphicTextSummary: boolean
  includeQAWarnings: boolean
  includePlanHistory: boolean
  maxPromptContextTokensEstimate: number
  userFacingSummary: string
  mockOnly: true
}

export interface EditLevelQwenPlanningProfilePackage extends EditLevelQwenPlanningSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  selectedLevel: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  qwenReasoningDepth: EditLevelQwenReasoningDepth
  planningPassPolicy: EditLevelQwenPlanningPassPolicy
  promptPolicy: EditLevelQwenPromptPolicy
  promptContextPolicy: EditLevelQwenPromptContextPolicy
  structuredOutputPolicy: EditLevelQwenStructuredOutputPolicy
  markerChatPolicy: string
  editBriefPolicy: string
  sourceContextPolicy: string
  preferenceDNAPolicy: string
  qaExplanationPolicy: string
  dimensions: EditLevelQwenPlanningDimensionRoute[]
  requiredDimensions: EditLevelQwenPlanningDimensionId[]
  recommendedDimensions: EditLevelQwenPlanningDimensionId[]
  futureOnlyDimensions: EditLevelQwenPlanningDimensionId[]
  degradedDimensions: EditLevelQwenPlanningDimensionId[]
  fallbackPolicy: string[]
  usageEstimatePolicy: 'low_estimate' | 'medium_estimate' | 'high_estimate'
  creditBehavior: EditLevelQwenCreditBehavior
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  sideEffectFlags: EditLevelQwenPlanningSideEffectFlags
}

export interface EditLevelQwenPlanningValidationResult extends EditLevelQwenPlanningSideEffectFlags {
  ok: boolean
  blocked: boolean
  level?: ReEditProCanonicalEditLevel
  errors: string[]
  warnings: string[]
  checkedDimensionCount: number
  sideEffectFlags: EditLevelQwenPlanningSideEffectFlags
}

export interface EditLevelQwenPlanningSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  qwenReasoningDepth: string
  planningPassPolicy: string
  promptContextPolicy: string
  markerChatPolicy: string
  preferenceDNAPolicy: string
  qaExplanationPolicy: string
  structuredOutputPolicy: string
  userFacingSummary: string
  highlights: string[]
  mockOnly: true
}

export interface EditLevelQwenPlanningDimensionListModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  required: EditLevelQwenPlanningDimensionRoute[]
  recommended: EditLevelQwenPlanningDimensionRoute[]
  futureGated: EditLevelQwenPlanningDimensionRoute[]
  degradedOrFallback: EditLevelQwenPlanningDimensionRoute[]
  notUsed: EditLevelQwenPlanningDimensionRoute[]
  mockOnly: true
}

export interface EditLevelQwenFallbackNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  notices: string[]
  boundary: string
  mockOnly: true
}

export interface EditLevelQwenUsageEstimateNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  usageEstimatePolicy: 'low_estimate' | 'medium_estimate' | 'high_estimate'
  creditBehavior: EditLevelQwenCreditBehavior
  notice: string
  mockOnly: true
}

export const REEDITPRO_EDIT_LEVEL_QWEN_PLANNING_RULE =
  'Edit Level Qwen Planning profiles define how Qwen 3.7 should reason by level, but they do not call Qwen or execute planners.'

export const REEDITPRO_EDIT_LEVEL_QWEN_PLANNING_NO_EXECUTION_RULE =
  'RP-EDITLEVEL-07 resolves mock/local Qwen planning policy only; it must not call Qwen, Qwen2.5-VL, DeepSeek, providers, planners, workers, render, or credits.'
