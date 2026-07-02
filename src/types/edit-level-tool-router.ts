import type {
  EditLevelQAProfile,
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
} from './edit-level'
import type { OpenSourceToolId } from './reeditpro'

export type EditLevelToolCapabilityId =
  | 'qwen_3_reasoning'
  | 'qwen25vl_visual_understanding'
  | 'speech_transcript'
  | 'media_extraction'
  | 'audio_soundsync'
  | 'graphic_design_understanding'
  | 'preference_dna'
  | 'edit_brief'
  | 'edit_brief_marker_chat'
  | 'edit_brief_marker_qa'
  | 'edit_brief_plan_hints'
  | 'source_video_playback'
  | 'source_video_understanding_package'
  | 'media_asset_repository'
  | 'storage_runtime'
  | 'deepseek_tool_code'
  | 'render_worker'
  | 'credit_gate'

export type EditLevelToolCapabilityCategory =
  | 'reasoning'
  | 'visual_understanding'
  | 'transcript'
  | 'audio'
  | 'media_metadata'
  | 'graphics'
  | 'preference'
  | 'edit_brief'
  | 'storage'
  | 'coding'
  | 'render'
  | 'credits'

export type EditLevelToolRequiredness =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'future_only'
  | 'not_used'

export type EditLevelToolCapabilityStatus =
  | 'available_mock'
  | 'available_beta'
  | 'runtime_disabled'
  | 'provider_required'
  | 'worker_required'
  | 'storage_required'
  | 'future_gated'
  | 'not_required'
  | 'degraded_fallback'

export interface EditLevelToolRouterSideEffectFlags {
  mockOnly: true
  providerCallMade: false
  qwen3CallMade: false
  qwen25vlCallMade: false
  deepSeekCallMade: false
  mediaProcessingStarted: false
  transcriptStarted: false
  workerJobCreated: false
  renderJobCreated: false
  progressStarted: false
  creditReservedOrSpent: false
  supabaseReadMade: false
  supabaseWriteMade: false
  fileBytesRead: false
  externalUrlFetched: false
  toolExecutionStarted: false
}

export interface EditLevelToolCapabilityDefinition {
  capabilityId: EditLevelToolCapabilityId
  displayName: string
  category: EditLevelToolCapabilityCategory
  description: string
  defaultStatus: EditLevelToolCapabilityStatus
  browserSafeToolIds: OpenSourceToolId[]
  productionToolIds: string[]
  mockOnly: true
}

export interface EditLevelToolRoute extends EditLevelToolRouterSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  capabilityId: EditLevelToolCapabilityId
  displayName: string
  category: EditLevelToolCapabilityCategory
  requiredness: EditLevelToolRequiredness
  status: EditLevelToolCapabilityStatus
  reason: string
  fallback: string
  userFacingSummary: string
  technicalNotes: string[]
  browserSafeToolIds: OpenSourceToolId[]
  productionToolIds: string[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
}

export interface EditLevelToolRoutingPackage extends EditLevelToolRouterSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  selectedLevel: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  toolDepth: 'normal_clean' | 'premium_enhanced' | 'ultra_studio'
  qaProfile: EditLevelQAProfile
  routes: EditLevelToolRoute[]
  requiredCapabilities: EditLevelToolCapabilityId[]
  recommendedCapabilities: EditLevelToolCapabilityId[]
  optionalCapabilities: EditLevelToolCapabilityId[]
  futureOnlyCapabilities: EditLevelToolCapabilityId[]
  blockedCapabilities: EditLevelToolCapabilityId[]
  degradedCapabilities: EditLevelToolCapabilityId[]
  fallbacks: string[]
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
}

export interface EditLevelToolRouterValidationResult extends EditLevelToolRouterSideEffectFlags {
  ok: boolean
  blocked: boolean
  level?: ReEditProCanonicalEditLevel
  errors: string[]
  warnings: string[]
  checkedRouteCount: number
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
}

export interface EditLevelToolCapabilitySummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  reasoningDepth: string
  visualUnderstandingDepth: string
  transcriptAudioGraphicsDepth: string
  editBriefGuidance: string
  qaStrictness: string
  futureGatedSummary: string
  estimateOnlyNotice: string
  highlights: string[]
  mockOnly: true
}

export interface EditLevelToolCapabilityListModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  availableNow: EditLevelToolRoute[]
  betaReady: EditLevelToolRoute[]
  futureGated: EditLevelToolRoute[]
  degradedOrFallback: EditLevelToolRoute[]
  notUsed: EditLevelToolRoute[]
  mockOnly: true
}

export interface EditLevelToolFallbackNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  notices: string[]
  boundary: string
  mockOnly: true
}

export interface EditLevelToolRouterBoundaryNoticeModel {
  title: string
  summary: string[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export const REEDITPRO_EDIT_LEVEL_TOOL_ROUTER_RULE =
  'The Edit Level Tool Router selects required, recommended, optional, future-gated, degraded, and fallback capabilities for an edit level without executing those tools.'

export const REEDITPRO_EDIT_LEVEL_TOOL_ROUTER_NO_EXECUTION_RULE =
  'RP-EDITLEVEL-05 must not call providers, run media tools, create workers, render, start progress, or reserve credits; it only resolves mock/local routing packages.'
