import type {
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
} from './edit-level'

export type EditLevelSourceUnderstandingLayerId =
  | 'source_metadata'
  | 'browser_local_playback'
  | 'media_extraction_metadata'
  | 'keyframe_sampling_plan'
  | 'speech_transcript'
  | 'qwen25vl_visual_segments'
  | 'qwen25vl_marker_windows'
  | 'audio_soundsync_segments'
  | 'graphic_text_segments'
  | 'preference_dna_context'
  | 'edit_brief_marker_context'
  | 'marker_context_package'
  | 'source_video_understanding_package'
  | 'qwen3_reasoning_context'

export type EditLevelSourceUnderstandingDepth =
  | 'metadata_and_targeted_context'
  | 'key_moments_and_marker_windows'
  | 'scene_level_deep_context'

export type EditLevelSourceLayerRequiredness =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'targeted'
  | 'future_only'
  | 'not_used'

export type EditLevelSourceLayerStatus =
  | 'available_mock'
  | 'available_beta'
  | 'runtime_disabled'
  | 'provider_required'
  | 'worker_required'
  | 'storage_required'
  | 'future_gated'
  | 'not_required'
  | 'degraded_fallback'

export type EditLevelMarkerTranscriptInclusion =
  | 'never'
  | 'if_available'
  | 'when_speech_exists'
  | 'required_when_speech'

export type EditLevelMarkerVisualContextInclusion =
  | 'targeted'
  | 'marker_window'
  | 'scene_level'

export type EditLevelMarkerAudioContextInclusion =
  | 'targeted'
  | 'if_available'
  | 'sound_design'

export type EditLevelMarkerGraphicTextContextInclusion =
  | 'basic'
  | 'if_relevant'
  | 'scene_level'

export type EditLevelQwenContextDepth =
  | 'compact'
  | 'enhanced'
  | 'studio'

export interface EditLevelSourceUnderstandingSideEffectFlags {
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
  sourceUnderstandingToolExecuted: false
}

export interface EditLevelSourceUnderstandingLayerDefinition {
  layerId: EditLevelSourceUnderstandingLayerId
  displayName: string
  sourceTool: string
  purpose: string
  defaultStatus: EditLevelSourceLayerStatus
  mockOnly: true
}

export interface EditLevelSourceUnderstandingLayerRoute extends EditLevelSourceUnderstandingSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  layerId: EditLevelSourceUnderstandingLayerId
  displayName: string
  requiredness: EditLevelSourceLayerRequiredness
  status: EditLevelSourceLayerStatus
  sourceTool: string
  purpose: string
  fallback: string
  userFacingSummary: string
  technicalNotes: string[]
  sideEffectFlags: EditLevelSourceUnderstandingSideEffectFlags
}

export interface EditLevelMarkerContextPolicy {
  level: ReEditProCanonicalEditLevel
  windowBeforeSeconds: number
  windowAfterSeconds: number
  includeTranscript: EditLevelMarkerTranscriptInclusion
  includeVisualContext: EditLevelMarkerVisualContextInclusion
  includeAudioContext: EditLevelMarkerAudioContextInclusion
  includeGraphicTextContext: EditLevelMarkerGraphicTextContextInclusion
  includeNearbyMarkers: boolean
  includePreferenceDNA: boolean
  includeQAWarnings: boolean
  includeMarkerConflicts: boolean
  includePlanHintHistory: boolean
  userFacingSummary: string
  mockOnly: true
}

export interface EditLevelQwenContextPolicy {
  level: ReEditProCanonicalEditLevel
  qwenContextDepth: EditLevelQwenContextDepth
  includeSourceSummary: boolean
  includeTranscriptWindow: boolean
  includeVisualSummary: boolean
  includeAudioSummary: boolean
  includeGraphicTextSummary: boolean
  includePreferenceDNA: boolean
  includeQAWarnings: boolean
  includePlanHistory: boolean
  maxContextWindowSeconds: number
  userFacingSummary: string
  mockOnly: true
}

export interface EditLevelSourceUnderstandingPolicyPackage extends EditLevelSourceUnderstandingSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  selectedLevel: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  sourceUnderstandingDepth: EditLevelSourceUnderstandingDepth
  layers: EditLevelSourceUnderstandingLayerRoute[]
  requiredLayers: EditLevelSourceUnderstandingLayerId[]
  recommendedLayers: EditLevelSourceUnderstandingLayerId[]
  optionalLayers: EditLevelSourceUnderstandingLayerId[]
  targetedLayers: EditLevelSourceUnderstandingLayerId[]
  futureOnlyLayers: EditLevelSourceUnderstandingLayerId[]
  degradedLayers: EditLevelSourceUnderstandingLayerId[]
  markerContextPolicy: EditLevelMarkerContextPolicy
  qwenContextPolicy: EditLevelQwenContextPolicy
  fallbackPolicy: string[]
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  sideEffectFlags: EditLevelSourceUnderstandingSideEffectFlags
}

export interface EditLevelSourceUnderstandingValidationResult extends EditLevelSourceUnderstandingSideEffectFlags {
  ok: boolean
  blocked: boolean
  level?: ReEditProCanonicalEditLevel
  errors: string[]
  warnings: string[]
  checkedLayerCount: number
  sideEffectFlags: EditLevelSourceUnderstandingSideEffectFlags
}

export interface EditLevelSourceUnderstandingSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  depth: EditLevelSourceUnderstandingDepth
  depthLabel: string
  headline: string
  userFacingSummary: string
  transcriptPolicy: string
  visualPolicy: string
  audioPolicy: string
  graphicTextPolicy: string
  markerContextWindow: string
  futureGatedSummary: string
  highlights: string[]
  mockOnly: true
}

export interface EditLevelSourceContextLayerListModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  required: EditLevelSourceUnderstandingLayerRoute[]
  recommended: EditLevelSourceUnderstandingLayerRoute[]
  optional: EditLevelSourceUnderstandingLayerRoute[]
  targeted: EditLevelSourceUnderstandingLayerRoute[]
  futureGated: EditLevelSourceUnderstandingLayerRoute[]
  degradedOrFallback: EditLevelSourceUnderstandingLayerRoute[]
  mockOnly: true
}

export interface EditLevelMarkerContextPolicyModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  windowLabel: string
  transcriptPolicy: string
  visualPolicy: string
  audioPolicy: string
  graphicTextPolicy: string
  includesPreferenceDNA: boolean
  includesQAWarnings: boolean
  summary: string
  mockOnly: true
}

export interface EditLevelSourceUnderstandingFallbackNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  notices: string[]
  boundary: string
  mockOnly: true
}

export const REEDITPRO_EDIT_LEVEL_SOURCE_UNDERSTANDING_RULE =
  'Edit Level Source Understanding routing defines how deeply ReEditPro should understand the source video for each level without executing media, model, worker, render, or credit operations.'

export const REEDITPRO_EDIT_LEVEL_SOURCE_UNDERSTANDING_NO_EXECUTION_RULE =
  'RP-EDITLEVEL-06 resolves mock/local source-understanding policy only; it must not run Qwen, Qwen2.5-VL, transcript, media extraction, audio, graphic, workers, render, or credits.'
