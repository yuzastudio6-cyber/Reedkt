export type ReEditProCanonicalEditLevel =
  | 'normal'
  | 'premium'
  | 'ultra_premium'

export type ReEditProLegacyEditLevel =
  | 'basic'
  | 'pro'
  | 'premium'

export type ReEditProEditLevelInputSource =
  | 'legacy_runtime'
  | 'public_beta'
  | 'explicit_canonical'

export type ReEditProEditLevelDisplayName =
  | 'Normal'
  | 'Premium'
  | 'Ultra Premium'

export type EditLevelAnalysisDepth =
  | 'baseline'
  | 'enhanced'
  | 'studio'

export type EditLevelQwenReasoningDepth =
  | 'standard'
  | 'deep'
  | 'multi_pass'

export type EditLevelQwen25VLVisualDepth =
  | 'targeted'
  | 'key_moments_and_marker_windows'
  | 'scene_level'

export type EditLevelTranscriptPolicy =
  | 'optional_or_targeted'
  | 'recommended_when_speech'
  | 'required_when_speech'

export type EditLevelAudioPolicy =
  | 'basic'
  | 'music_sfx_ducking'
  | 'sound_design'

export type EditLevelGraphicsPolicy =
  | 'basic_captions'
  | 'styled_captions_cards'
  | 'motion_graphics_direction'

export type EditLevelEditBriefPolicy =
  | 'optional'
  | 'recommended'
  | 'strongly_recommended'

export type EditLevelEditPreferencePolicy =
  | 'safe_style_hints'
  | 'strong_dna_application'
  | 'deep_dna_application'

export type EditLevelSourceUnderstandingPolicy =
  | 'metadata_and_targeted_context'
  | 'key_moments_and_context_package'
  | 'scene_level_deep_context'

export type EditLevelQAProfile =
  | 'baseline'
  | 'premium'
  | 'ultra'

export type EditLevelPlanComplexity =
  | 'simple_professional'
  | 'layered'
  | 'studio_multi_layer'

export type EditLevelToolBudget =
  | 'minimal_professional'
  | 'medium'
  | 'highest'

export type EditLevelCapabilityStatus =
  | 'available_mock'
  | 'available_beta'
  | 'runtime_disabled'
  | 'provider_required'
  | 'worker_required'
  | 'future_gated'
  | 'not_required'

export type EditLevelRecommendationConfidence = 'low' | 'medium' | 'high'

export type EditLevelDesiredPolish = 'fast_clean' | 'enhanced' | 'studio'

export interface EditLevelLegacyAliasMapping {
  legacyLevel: ReEditProLegacyEditLevel
  canonicalLevel: ReEditProCanonicalEditLevel
  publicDisplayName: ReEditProEditLevelDisplayName
  inputSource: 'legacy_runtime'
  notes: string[]
}

export interface EditLevelToolRoutingProfile {
  qwen3ReasoningDepth: EditLevelQwenReasoningDepth
  qwen25vlVisualDepth: EditLevelQwen25VLVisualDepth
  transcriptPolicy: EditLevelTranscriptPolicy
  audioPolicy: EditLevelAudioPolicy
  graphicsPolicy: EditLevelGraphicsPolicy
  mediaExtractionPolicy: string
  deepseekPolicy: 'not_user_reasoning' | 'tool_code_future'
  sourceUnderstandingPolicy: EditLevelSourceUnderstandingPolicy
  requiredCapabilities: string[]
  recommendedCapabilities: string[]
  fallbackCapabilities: string[]
  mockOnly: boolean
}

export interface EditLevelEstimateProfile {
  creditEstimateMultiplier: number
  timeEstimateMultiplier: number
  analysisPassBudget: number
  qwenReasoningPassBudget: number | 'multi_pass'
  qwen25vlVisualPassBudget: 'targeted_only' | 'key_moments' | 'scene_level'
  renderPassBudgetFuture: number
  revisionBudgetFuture: number
  variantBudgetFuture: number
  estimateOnly: true
  creditsReservedOrSpent: false
  needsProductValue: boolean
}

export interface EditLevelQAProfileDefinition {
  qaProfile: EditLevelQAProfile
  checks: string[]
  blockingChecks: string[]
  warningChecks: string[]
  strictnessSummary: string
  mockOnly: boolean
}

export interface EditLevelFallbackPolicy {
  qwenUnavailable: string
  qwen25vlUnavailable: string
  transcriptUnavailable: string
  audioUnavailable: string
  graphicDesignUnavailable: string
  renderWorkerUnavailable: string
  creditGateUnavailable: string
  degradedCapabilityNotice: string
  mockOnly: boolean
}

export interface EditLevelUICardModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  tagline: string
  bestFor: string[]
  includedHighlights: string[]
  editBriefGuidance: string
  estimateSummary: string
  disabledReason?: string
  recommended: boolean
  mockOnly: boolean
}

export interface EditLevelProfile {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  legacyAliases: ReEditProLegacyEditLevel[]
  shortPromise: string
  userFacingDescription: string
  analysisDepth: EditLevelAnalysisDepth
  toolRouting: EditLevelToolRoutingProfile
  editBriefPolicy: EditLevelEditBriefPolicy
  editPreferencePolicy: EditLevelEditPreferencePolicy
  qaProfile: EditLevelQAProfileDefinition
  planComplexity: EditLevelPlanComplexity
  toolBudget: EditLevelToolBudget
  estimateProfile: EditLevelEstimateProfile
  fallbackPolicy: EditLevelFallbackPolicy
  uiCard: EditLevelUICardModel
  betaReady: boolean
  productionReady: false
  mockOnly: boolean
  warnings: string[]
}

export interface EditLevelRecommendationInput {
  sourceDurationSeconds?: number
  sourceAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | 'custom'
  platformTarget?: string
  userPrompt?: string
  selectedEditPreferenceId?: string
  editBriefMarkerCount?: number
  attachmentCount?: number
  desiredPolish?: EditLevelDesiredPolish
  toolReadiness?: Record<string, EditLevelCapabilityStatus>
  mockOnly: boolean
}

export interface EditLevelRecommendationResult {
  recommendedLevel: ReEditProCanonicalEditLevel
  confidence: EditLevelRecommendationConfidence
  reasons: string[]
  warnings: string[]
  degradedCapabilityNotices: string[]
  userOverrideAllowed: true
  mockOnly: boolean
}

export interface EditLevelNormalizationInput {
  value: string
  inputSource: ReEditProEditLevelInputSource
}

export interface EditLevelNormalizationResult {
  inputValue: string
  inputSource: ReEditProEditLevelInputSource
  canonicalLevel?: ReEditProCanonicalEditLevel
  legacyLevel?: ReEditProLegacyEditLevel
  publicDisplayName?: ReEditProEditLevelDisplayName
  ambiguous: boolean
  ok: boolean
  notes: string[]
}

export interface EditLevelProfileDebugModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  legacyAliases: ReEditProLegacyEditLevel[]
  qwen3ReasoningDepth: EditLevelQwenReasoningDepth
  qwen25vlVisualDepth: EditLevelQwen25VLVisualDepth
  editBriefPolicy: EditLevelEditBriefPolicy
  qaProfile: EditLevelQAProfile
  estimateOnly: true
  creditsReservedOrSpent: false
  mockOnly: boolean
  productionReady: false
  warnings: string[]
}

export const REEDITPRO_EDIT_LEVEL_PROFESSIONAL_RULE =
  'Every ReEditPro Edit Level must produce a professional edit; higher levels increase depth, polish, tool coverage, QA strictness, and future budget, not basic correctness.'

export const REEDITPRO_EDIT_LEVEL_LEGACY_COMPATIBILITY_RULE =
  'The legacy runtime values basic/pro/premium remain compatible until an explicit migration maps them to Normal/Premium/Ultra Premium product labels.'

export const REEDITPRO_EDIT_LEVEL_NO_RUNTIME_RULE =
  'RP-EDITLEVEL-02 defines types, profiles, fixtures, contracts, and smoke coverage only; it must not change runtime edit-level behavior.'
