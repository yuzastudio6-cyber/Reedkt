import type {
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
} from './edit-level'

export type EditLevelQAGateId =
  | 'safety_do_not_copy'
  | 'copy_risk'
  | 'source_video_present'
  | 'source_metadata_ready'
  | 'export_settings_valid'
  | 'caption_safe_zone'
  | 'caption_readability'
  | 'audio_basic_sanity'
  | 'audio_music_ducking'
  | 'sfx_restraint'
  | 'sound_design_coherence'
  | 'marker_missing_asset'
  | 'marker_needs_clarification'
  | 'marker_conflict'
  | 'marker_time_range_valid'
  | 'edit_brief_priority_consistency'
  | 'preference_dna_match'
  | 'qwen_response_validation'
  | 'qwen25vl_visual_confidence'
  | 'transcript_coverage'
  | 'source_context_coverage'
  | 'broll_timing'
  | 'pacing_consistency'
  | 'story_arc_quality'
  | 'style_consistency'
  | 'graphic_layout_consistency'
  | 'plan_completeness'
  | 'render_readiness_future'
  | 'revision_budget_future'
  | 'credit_gate_future'

export type EditLevelQAGateCategory =
  | 'safety'
  | 'source'
  | 'export'
  | 'caption'
  | 'audio'
  | 'marker'
  | 'preference'
  | 'qwen'
  | 'visual'
  | 'transcript'
  | 'planning'
  | 'render'
  | 'credits'

export type EditLevelQAGateRequiredness =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'warning_only'
  | 'future_only'
  | 'not_used'

export type EditLevelQAGateStrictness = 'baseline' | 'premium' | 'ultra'

export type EditLevelQAGateStatus =
  | 'available_mock'
  | 'available_beta'
  | 'runtime_disabled'
  | 'provider_required'
  | 'worker_required'
  | 'future_gated'
  | 'storage_required'
  | 'not_required'
  | 'degraded_fallback'

export type EditLevelQAReadinessStatus =
  | 'not_checked'
  | 'ready_for_mock_planning'
  | 'ready_with_warnings'
  | 'needs_user_review'
  | 'blocked_by_safety'
  | 'blocked_by_missing_asset'
  | 'blocked_by_conflict'
  | 'blocked_by_context_gap'
  | 'blocked_by_future_runtime_gate'

export interface EditLevelQAGateSideEffectFlags {
  mockOnly: true
  providerCallMade: false
  qwenCallMade: false
  qwen25vlCallMade: false
  deepseekCallMade: false
  plannerExecuted: false
  editPlanCreated: false
  mediaProcessingStarted: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  fileBytesRead: false
  externalUrlFetched: false
}

export interface EditLevelQAGateDefinition {
  gateId: EditLevelQAGateId
  displayName: string
  category: EditLevelQAGateCategory
  purpose: string
  defaultStatus: EditLevelQAGateStatus
  mockOnly: true
}

export interface EditLevelQAGateRoute extends EditLevelQAGateSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  gateId: EditLevelQAGateId
  displayName: string
  category: EditLevelQAGateCategory
  requiredness: EditLevelQAGateRequiredness
  strictness: EditLevelQAGateStrictness
  status: EditLevelQAGateStatus
  blocksPlan: boolean
  blocksRenderFuture: boolean
  purpose: string
  fallback: string
  userFacingSummary: string
  technicalNotes: string[]
  sideEffectFlags: EditLevelQAGateSideEffectFlags
}

export interface EditLevelQAGatePackage extends EditLevelQAGateSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  selectedLevel: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  qaStrictness: EditLevelQAGateStrictness
  readinessStatus: EditLevelQAReadinessStatus
  gates: EditLevelQAGateRoute[]
  requiredGates: EditLevelQAGateId[]
  recommendedGates: EditLevelQAGateId[]
  warningOnlyGates: EditLevelQAGateId[]
  blockingGates: EditLevelQAGateId[]
  futureOnlyGates: EditLevelQAGateId[]
  degradedGates: EditLevelQAGateId[]
  fallbackPolicy: string[]
  readinessSummary: string
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  sideEffectFlags: EditLevelQAGateSideEffectFlags
}

export interface EditLevelQAGateValidationResult extends EditLevelQAGateSideEffectFlags {
  ok: boolean
  blocked: boolean
  level?: ReEditProCanonicalEditLevel
  errors: string[]
  warnings: string[]
  checkedGateCount: number
  sideEffectFlags: EditLevelQAGateSideEffectFlags
}

export interface EditLevelQAGateSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  qaStrictnessLabel: string
  readinessStatusLabel: string
  requiredCount: number
  warningCount: number
  blockingCount: number
  futureGatedCount: number
  userFacingSummary: string
  highlights: string[]
  mockOnly: true
}

export interface EditLevelQAGateListModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  required: EditLevelQAGateRoute[]
  recommended: EditLevelQAGateRoute[]
  warningOnly: EditLevelQAGateRoute[]
  blocking: EditLevelQAGateRoute[]
  futureGated: EditLevelQAGateRoute[]
  degradedOrFallback: EditLevelQAGateRoute[]
  mockOnly: true
}

export interface EditLevelQAFallbackNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  notices: string[]
  boundary: string
  mockOnly: true
}

export interface EditLevelQAReadinessCardModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  readinessStatus: EditLevelQAReadinessStatus
  readinessLabel: string
  readinessSummary: string
  blockingGates: EditLevelQAGateRoute[]
  futureGatedChecks: EditLevelQAGateRoute[]
  noExecutionNotice: string
  mockOnly: true
}

export const REEDITPRO_EDIT_LEVEL_QA_GATE_RULE =
  'Edit Level QA Gates define level-aware QA policy only; they do not execute QA tools or inspect media.'

export const REEDITPRO_EDIT_LEVEL_QA_GATE_NO_EXECUTION_RULE =
  'RP-EDITLEVEL-08 resolves mock/local QA gate policy only; it must not call Qwen, Qwen2.5-VL, DeepSeek, providers, planners, media workers, render, Supabase, external fetch, file-byte reads, or credits.'
