import type {
  BaseRecord,
  CreditImpact,
  ID,
  ISODateString,
  JSONValue,
  Percentage,
  Seconds,
  TimeRange,
} from './shared'
import type { AudioAssetOrigin, AudioLicenseScope, SfxUseCase } from './audio-music'
import type { DuckingStrategy, EditQualityLevel, SoundEffectType } from './edit-quality'
import type { SignatureSystem } from './signature-systems'

export type SFXDecisionState =
  | 'needed'
  | 'optional'
  | 'not_needed'
  | 'avoid'
  | 'needs_user_confirmation'

export type SFXTargetLayer =
  | 'transition'
  | 'title_card'
  | 'chapter_card'
  | 'graphic_design'
  | 'stroke_motion'
  | 'real_motion'
  | 'caption_emphasis'
  | 'montage_hit'
  | 'cta_reveal'
  | 'ambient_bridge'
  | 'ui_feedback'
  | 'source_footage_repair'
  | 'none'

export type SFXProvider =
  | 'reeditpro_internal_library'
  | 'mmaudio_v'
  | 'mirelo_sfx_v1_5'
  | 'no_sfx'
  | 'manual_upload'
  | 'unknown'

export type SFXProviderRole =
  | 'internal_library_first_choice'
  | 'cheap_draft_fallback'
  | 'basic_pro_fallback'
  | 'production_final'
  | 'premium_signature'
  | 'none'

export type SFXPromptStyle =
  | 'simple_keyword'
  | 'short_phrase'
  | 'tag_list'
  | 'structured_sentence'
  | 'video_conditioned_short_prompt'
  | 'library_search_tags'

export type SFXAnchorType =
  | 'cut'
  | 'music_beat'
  | 'music_downbeat'
  | 'title_reveal'
  | 'chapter_card_reveal'
  | 'graphic_reveal'
  | 'stroke_motion_start'
  | 'stroke_motion_completion'
  | 'stroke_motion_morph'
  | 'real_motion_object_enter'
  | 'real_motion_object_settle'
  | 'caption_keyword'
  | 'cta_reveal'
  | 'camera_movement'
  | 'gesture'
  | 'manual'

export type SFXTimingPriority =
  | 'frame_accurate'
  | 'beat_aligned'
  | 'speech_safe'
  | 'loose_background'
  | 'manual_review'

export type SFXVolumeProfile =
  | 'none'
  | 'whisper'
  | 'subtle_polish'
  | 'standard_social'
  | 'impact'
  | 'premium_soft'

export type SFXMixPriority =
  | 'voice_first'
  | 'ambience_first'
  | 'music_support'
  | 'effect_moment'
  | 'signature_sync'
  | 'low_priority'

export type SFXGenerationStatus =
  | 'draft'
  | 'planned'
  | 'awaiting_approval'
  | 'approved'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'trimmed'
  | 'aligned'
  | 'mixed'
  | 'qa_pending'
  | 'qa_passed'
  | 'qa_failed'
  | 'used_in_preview'
  | 'used_in_export'
  | 'cancelled'
  | 'failed'

export type SFXReuseStatus =
  | 'project_generated'
  | 'approved_for_project'
  | 'candidate_for_library'
  | 'reuse_review'
  | 'approved_internal_library'
  | 'workspace_only'
  | 'blocked_from_reuse'
  | 'requires_terms_review'

export type SFXQAStatus =
  | 'pending'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'requires_trim_adjustment'
  | 'requires_mix_adjustment'
  | 'requires_regeneration'
  | 'remove_sfx'
  | 'waived'

export type SFXQAIssueType =
  | 'too_loud'
  | 'too_quiet'
  | 'late_hit'
  | 'early_hit'
  | 'wrong_style'
  | 'sounds_cheap'
  | 'cartoonish_when_should_be_premium'
  | 'fights_voice'
  | 'fights_music'
  | 'tail_too_long'
  | 'audio_artifact'
  | 'bad_trim'
  | 'bad_hit_alignment'
  | 'repeats_too_often'
  | 'not_needed'
  | 'does_not_match_edit_layer'
  | 'does_not_match_user_instruction'
  | 'provider_output_low_quality'
  | 'license_or_provenance_missing'
  | 'other'

export type SFXQARecommendedAction =
  | 'use'
  | 'use_with_mix_adjustment'
  | 'trim_again'
  | 'lower_volume'
  | 'regenerate'
  | 'replace_with_library'
  | 'remove_sfx'
  | 'ask_user'

export type SFXSourceFootagePolicy =
  | 'edit_layer_only_default'
  | 'allow_source_repair'
  | 'allow_full_sound_design'
  | 'user_requested_source_sfx'
  | 'avoid_source_action_sfx'

export type SFXGeneratedDurationPolicy =
  | 'generate_2_to_3_seconds'
  | 'generate_3_to_5_seconds'
  | 'generate_6_to_8_seconds'
  | 'custom'

export type SFXCostSensitivity = 'lowest_cost' | 'balanced' | 'quality_first' | 'premium_allowed'

export type SFXQualityTarget = 'draft' | 'preview' | 'production' | 'premium'

export type SFXUsageType =
  | 'project_preview'
  | 'final_export'
  | 'preview'
  | 'export'
  | 'revision_preview'
  | 'library_audit'
  | 'manual_review'

export type SFXQAIssueSeverity =
  | 'info'
  | 'warning'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocking'

export type SFXPromptAdapterTestStatus =
  | 'planned'
  | 'ready_for_test'
  | 'tested'
  | 'passed'
  | 'failed'
  | 'archived'
  | 'approved_pattern'
  | 'rejected_pattern'
  | 'needs_more_examples'

export type SFXWaveformShape =
  | 'single_hit'
  | 'whoosh_rise_hit_tail'
  | 'draw_texture'
  | 'soft_pop'
  | 'ambient_swell'
  | 'object_movement'
  | 'unknown'

export type SFXTransientStrength =
  | 'none'
  | 'soft'
  | 'medium'
  | 'strong'
  | 'too_harsh'

export type SFXTrimConfidence =
  | 'low'
  | 'medium'
  | 'high'
  | 'needs_manual_review'

export type SFXTimingValidationIssue =
  | 'hit_late'
  | 'hit_early'
  | 'tail_too_long'
  | 'pre_roll_too_short'
  | 'trim_too_short'
  | 'trim_too_long'
  | 'missing_anchor'
  | 'bad_hit_offset'
  | 'not_frame_accurate'
  | 'speech_overlap_risk'
  | 'music_beat_mismatch'
  | 'manual_review_needed'

export type SFXDuckingIntensity =
  | 'none'
  | 'light'
  | 'medium'
  | 'strong'
  | 'voice_first'

export type SFXEQProfile =
  | 'none'
  | 'soften_harsh_highs'
  | 'reduce_low_end'
  | 'voice_safe'
  | 'premium_smooth'
  | 'tight_social'
  | 'warm_respectful'
  | 'room_matched'

export type SFXStereoWidthProfile =
  | 'mono_center'
  | 'narrow'
  | 'moderate'
  | 'wide'
  | 'visual_positioned'

export type SFXReverbProfile =
  | 'dry'
  | 'small_room'
  | 'natural_air'
  | 'premium_smooth'
  | 'tight_social'
  | 'warm_subtle'
  | 'room_matched'

export type SFXMixValidationIssue =
  | 'too_loud_for_dialogue'
  | 'too_quiet_to_notice'
  | 'fights_music'
  | 'fights_ambience'
  | 'wrong_volume_profile'
  | 'ducking_missing'
  | 'fade_too_short'
  | 'fade_too_long'
  | 'harsh_frequency_risk'
  | 'too_wide_for_dialogue'
  | 'reverb_mismatch'
  | 'room_mismatch'
  | 'manual_review_needed'

export type SFXRegenerationReason =
  | 'too_loud'
  | 'too_quiet'
  | 'wrong_style'
  | 'wrong_energy'
  | 'too_cartoonish'
  | 'not_premium_enough'
  | 'not_speech_safe'
  | 'bad_hit_timing'
  | 'bad_trim'
  | 'tail_too_long'
  | 'audio_artifact'
  | 'fights_music'
  | 'fights_ambience'
  | 'source_policy_conflict'
  | 'user_instruction_conflict'
  | 'provider_output_low_quality'
  | 'license_provenance_missing'

export type SFXAdjustmentType =
  | 'trim_adjustment'
  | 'volume_adjustment'
  | 'ducking_adjustment'
  | 'fade_adjustment'
  | 'eq_adjustment'
  | 'reverb_room_match_adjustment'
  | 'timing_alignment_adjustment'
  | 'remove_sfx'

export type SFXLibraryDecision =
  | 'project_only'
  | 'workspace_only'
  | 'candidate_for_library'
  | 'approved_internal_library'
  | 'blocked_from_reuse'
  | 'requires_terms_review'

export type SFXReuseRisk =
  | 'low'
  | 'medium'
  | 'high'
  | 'privacy_risk'
  | 'license_risk'
  | 'reference_copy_risk'
  | 'client_specific_risk'

export type SFXLibrarySearchMatchStrength =
  | 'none'
  | 'weak'
  | 'good'
  | 'strong'
  | 'exact'

export type SFXLibraryPromotionReason =
  | 'general_purpose_sound'
  | 'high_quality'
  | 'qa_passed'
  | 'useful_for_common_edit_layer'
  | 'good_timing_metadata'
  | 'clean_trim'
  | 'safe_under_voice'
  | 'premium_style'
  | 'low_reuse_risk'

export type SFXLibraryBlockReason =
  | 'private_context'
  | 'client_specific'
  | 'brand_specific'
  | 'user_voice_or_identity'
  | 'provider_terms_unclear'
  | 'reference_copy_risk'
  | 'qa_failed'
  | 'not_general_purpose'
  | 'bad_metadata'
  | 'license_provenance_missing'

export interface SFXGeneratedDurationPolicyRange {
  policy: SFXGeneratedDurationPolicy
  finalNeededSecondsMin: Seconds
  finalNeededSecondsMax: Seconds
  generateSecondsMin: Seconds
  generateSecondsMax: Seconds
  notes: string
}

export interface SFXDurationPlan {
  policy: SFXGeneratedDurationPolicy
  category: 'short_hit' | 'medium_motion' | 'ambient_bridge' | 'custom'
  neededDurationSeconds: Seconds
  durationToGenerateSeconds: Seconds
  reason: string
  warnings: string[]
}

export interface SFXMockWaveformAnalysisRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  sfxGeneratedAssetId?: ID
  sfxEventPlanId: ID
  waveformShape: SFXWaveformShape
  detectedHitTimeSeconds?: Seconds
  detectedHitStrength: SFXTransientStrength
  cleanStartTimeSeconds?: Seconds
  cleanEndTimeSeconds?: Seconds
  suggestedTrimStartSeconds?: Seconds
  suggestedTrimEndSeconds?: Seconds
  tailDurationMs?: number
  noiseOrArtifactNotes: string[]
  confidence: Percentage
  createdAt: ISODateString
}

export interface SFXTransientDetectionResult {
  detectedHitTimeSeconds?: Seconds
  chosenHitTimeSeconds?: Seconds
  detectedHitStrength: SFXTransientStrength
  hitOffsetInsideTrimMs?: number
  alignmentNote: string
  confidence: Percentage
  warnings: string[]
}

export interface SFXTimelinePlacement {
  startTimeSeconds: Seconds
  hitTimeSeconds: Seconds
  endTimeSeconds: Seconds
  startFrame: number
  hitFrame: number
  endFrame: number
  fps: 24 | 25 | 30 | 60
  frameAccurate: boolean
  speechSafePlacement: boolean
  warnings: string[]
}

export interface SFXTimingValidationResult {
  ok: boolean
  issues: SFXTimingValidationIssue[]
  warnings: string[]
  recommendedFixes: string[]
}

export interface SFXMixValidationResult {
  ok: boolean
  issues: SFXMixValidationIssue[]
  warnings: string[]
  recommendedFixes: string[]
}

export interface SFXEventPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  transitionPlanId?: ID
  signatureRouteId?: ID
  strokeMotionBeatId?: ID
  musicCueId?: ID
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  legacySoundEffectType?: SoundEffectType
  decisionState: SFXDecisionState
  sourceFootagePolicy: SFXSourceFootagePolicy
  reason: string
  sceneContext: string
  videoTone: string
  editLevel: EditQualityLevel
  signatureSystem?: SignatureSystem
  anchorType: SFXAnchorType
  anchorTimeSeconds: Seconds
  startTimeSeconds?: Seconds
  hitTimeSeconds?: Seconds
  endTimeSeconds?: Seconds
  timingPriority: SFXTimingPriority
  volumeProfile: SFXVolumeProfile
  mixPriority: SFXMixPriority
  creditImpact: CreditImpact
  requiresApproval: boolean
  userVisibleSummary: string
  avoidRules: string[]
  mustFollowRules: string[]
  status: SFXGenerationStatus
  notes: string[]
}

export interface SFXProviderRouteRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  recommendedProvider: SFXProvider
  providerRole: SFXProviderRole
  fallbackProvider?: SFXProvider
  reason: string
  useInternalLibraryFirst: boolean
  useMMAudioForDraft: boolean
  useMireloForProduction: boolean
  noSfxAllowed: boolean
  costSensitivity: SFXCostSensitivity
  qualityTarget: SFXQualityTarget
  approvalRequired: boolean
  notes: string[]
}

export interface SFXLibrarySearchPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  searchTags: string[]
  avoidTags: string[]
  requiredLicenseScope: AudioLicenseScope
  minimumQualityScore: Percentage
  workspaceOnlyAllowed: boolean
  fallbackProvider: SFXProvider
  resultAssetIds: ID[]
  noMatchReason?: string
  status: SFXGenerationStatus
  notes: string[]
}

export interface SFXPromptPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  providerRouteId: ID
  provider: SFXProvider
  modelName: string
  promptStyle: SFXPromptStyle
  prompt: string
  negativePrompt: string
  librarySearchTags: string[]
  durationNeededSeconds: Seconds
  durationToGenerateSeconds: Seconds
  generatedDurationPolicy: SFXGeneratedDurationPolicy
  textureWords: string[]
  energyWords: string[]
  styleWords: string[]
  avoidWords: string[]
  timingInstructions: string[]
  mixInstructions: string[]
  promptWarnings: string[]
  status: SFXGenerationStatus
  notes: string[]
}

export interface SFXGeneratedAssetRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxPromptPlanId: ID
  generationRequestId?: ID
  generatedAssetId?: ID
  mediaAssetId?: ID
  provider: SFXProvider
  modelName: string
  origin: AudioAssetOrigin
  storagePath?: string
  fullGeneratedDurationSeconds: Seconds
  recommendedTrimStartSeconds?: Seconds
  recommendedTrimEndSeconds?: Seconds
  detectedHitTimeSeconds?: Seconds
  reuseStatus: SFXReuseStatus
  qaStatus: SFXQAStatus
  licenseProvenanceId?: ID
  licenseScope?: AudioLicenseScope
  status: SFXGenerationStatus
  notes: string[]
}

export interface SFXTrimPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxGeneratedAssetId: ID
  generatedDurationSeconds: Seconds
  neededDurationSeconds: Seconds
  trimStartSeconds: Seconds
  trimEndSeconds: Seconds
  hitOffsetInsideTrimMs: number
  fadeInMs: number
  fadeOutMs: number
  tailMs: number
  reason: string
  requiresManualReview: boolean
  status: SFXGenerationStatus
  notes: string[]
}

export interface SFXTimingAlignmentRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxTrimPlanId?: ID
  anchorType: SFXAnchorType
  anchorTimeSeconds: Seconds
  startTimeSeconds: Seconds
  hitTimeSeconds: Seconds
  endTimeSeconds: Seconds
  preRollMs: number
  tailMs: number
  durationNeededMs: number
  durationGeneratedMs: number
  hitOffsetInsideTrimMs: number
  timingPriority: SFXTimingPriority
  frameAccurateRequired: boolean
  musicBeatAligned: boolean
  speechSafePlacement: boolean
  notes: string[]
}

export interface SFXMixPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxGeneratedAssetId?: ID
  volumeProfile: SFXVolumeProfile
  targetGainDb: number
  duckUnderVoice: boolean
  duckUnderMusic: boolean
  duckingStrategy?: DuckingStrategy
  duckingIntensity?: SFXDuckingIntensity
  sidechainToVoice: boolean
  sidechainToMusic: boolean
  fadeInMs: number
  fadeOutMs: number
  eqNotes: string[]
  eqProfile?: SFXEQProfile
  stereoWidth: Percentage
  stereoWidthProfile?: SFXStereoWidthProfile
  reverbMatch: string
  reverbProfile?: SFXReverbProfile
  roomMatch: string
  mixPriority: SFXMixPriority
  voicePresent: boolean
  musicPresent: boolean
  ambienceImportant: boolean
  notes: string[]
  status: SFXGenerationStatus
}

export interface SFXQAIssue {
  id: ID
  issueType: SFXQAIssueType
  severity: SFXQAIssueSeverity
  description: string
  recommendedFix: string
  timeRange?: TimeRange
  blocksUse: boolean
}

export interface SFXQAReportRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxGeneratedAssetId?: ID
  sfxTrimPlanId?: ID
  sfxTimingAlignmentId?: ID
  sfxMixPlanId?: ID
  status: SFXQAStatus
  overallScore: Percentage
  timingScore: Percentage
  volumeScore: Percentage
  styleFitScore: Percentage
  voiceSafetyScore: Percentage
  musicFitScore: Percentage
  artifactScore: Percentage
  issues: SFXQAIssue[]
  recommendedAction: SFXQARecommendedAction
  approvedForProject: boolean
  approvedForLibraryCandidate: boolean
  requiresRegeneration: boolean
  requiresTrimAdjustment: boolean
  requiresMixAdjustment: boolean
  notes: string[]
}

export interface SFXRegenerationDecisionRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxGeneratedAssetId?: ID
  sfxQAReportId?: ID
  shouldRegenerate: boolean
  reasons?: SFXRegenerationReason[]
  recommendedAction: SFXQARecommendedAction
  issueTypes: SFXQAIssueType[]
  providerRouteId?: ID
  preferredProvider: SFXProvider
  providerRecommendation?: SFXProvider
  promptAdjustment: string
  lowerCostAlternative?: string
  requiresNewApproval: boolean
  userFacingSummary?: string
  userVisibleSummary: string
  notes: string[]
}

export interface SFXAdjustmentDecisionRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxQAReportId?: ID
  adjustmentTypes: SFXAdjustmentType[]
  recommendedAction: SFXQARecommendedAction
  adjustmentSummary: string
  canUseWithoutRegeneration: boolean
  notes: string[]
}

export interface SFXReplacementDecisionRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  sfxEventPlanId: ID
  sfxQAReportId?: ID
  shouldReplaceWithLibrary: boolean
  recommendedAction: SFXQARecommendedAction
  replacementReason: string
  searchTags: string[]
  libraryAvailable: boolean
  userFacingSummary: string
  notes: string[]
}

export interface SFXProvenanceReviewRecord extends BaseRecord {
  projectId: ID
  workspaceId?: ID
  sfxGeneratedAssetId: ID
  provider: SFXProvider
  modelName?: string
  licenseProvenanceId?: ID
  commercialAllowed?: boolean
  adsAllowed?: boolean
  clientWorkAllowed?: boolean
  reuseAcrossUsersAllowed?: boolean
  requiresAttribution?: boolean
  termsReviewRequired: boolean
  riskLevel: SFXReuseRisk
  notes: string[]
}

export interface SFXLibrarySearchRecord extends BaseRecord {
  projectId: ID
  workspaceId?: ID
  sfxEventPlanId?: ID
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  searchTags: string[]
  desiredVolumeProfile: SFXVolumeProfile
  desiredDurationSeconds?: Seconds
  desiredTone: string[]
  matchStrength: SFXLibrarySearchMatchStrength
  matchedLibraryAssetId?: ID
  fallbackReason?: string
}

export interface SFXUsageLearningRecord extends BaseRecord {
  projectId: ID
  sfxGeneratedAssetId?: ID
  sfxEventPlanId: ID
  useCase: SfxUseCase
  targetLayer: SFXTargetLayer
  userKept?: boolean
  userRemoved?: boolean
  qaPassed?: boolean
  usedInPreview?: boolean
  usedInExport?: boolean
  regenerationRequested?: boolean
  replacementRequested?: boolean
  learningSummary: string
  tagsToImprove: string[]
}

export interface SFXLibraryCandidateRecord extends BaseRecord {
  projectId: ID
  workspaceId?: ID
  sfxGeneratedAssetId: ID
  sfxEventPlanId: ID
  reuseStatus: SFXReuseStatus
  candidateReason: string
  qualityScore: Percentage
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  provider: SFXProvider
  modelName: string
  generalPurpose: boolean
  containsPrivateContext: boolean
  licenseReviewRequired: boolean
  licenseScope?: AudioLicenseScope
  approvedBy?: ID
  approvedAt?: ISODateString
  tags: string[]
  recommendedUseCases: SfxUseCase[]
  avoidUseCases: SfxUseCase[]
  notes: string[]
}

export interface SFXUsageRecord extends BaseRecord {
  projectId: ID
  editPlanId?: ID
  renderId?: ID
  exportId?: ID
  sfxGeneratedAssetId?: ID
  generatedAssetId?: ID
  sfxEventPlanId: ID
  sfxTimingAlignmentId?: ID
  sfxMixPlanId?: ID
  usageType: SFXUsageType
  usedStartTimeSeconds: Seconds
  usedEndTimeSeconds: Seconds
  hitTimeSeconds: Seconds
  volumeProfile: SFXVolumeProfile
  userKept: boolean
  userRemoved: boolean
  qaPassed: boolean
  notes: string[]
}

export interface SFXPromptAdapterTestRecord extends BaseRecord {
  provider: SFXProvider
  modelName: string
  promptStyle: SFXPromptStyle
  testPrompt: string
  expectedUseCase: SfxUseCase
  resultQualityScore?: Percentage
  timingFitScore?: Percentage
  styleFitScore?: Percentage
  adapterMetadata?: JSONValue
  notes: string[]
  status: SFXPromptAdapterTestStatus
}

export const SFX_DEFAULT_RULE =
  'ReeditPro must not add random sound effects. No SFX is always a valid professional decision when sound does not improve the edit.'

export const SFX_EDIT_LAYER_DEFAULT_RULE =
  'By default, ReeditPro creates or selects SFX for ReeditPro-created edit layers, not every real-world action in the source footage.'

export const SFX_GENERATE_EXTRA_DURATION_RULE =
  'Generated SFX should usually be longer than the final needed sound, then trimmed to the best region and hit-aligned to the edit anchor.'

export const SFX_VOICE_FIRST_MIX_RULE =
  'SFX must be voice-first, subtle by default, ducked when needed, and QA-checked before preview or export.'

export const MIRELO_SFX_FUTURE_MODEL_NAME = 'mirelo-sfx-v1.5'

export const MMAUDIO_FUTURE_MODEL_NAME = 'mmaudio-v'

export const SFX_GENERATED_DURATION_POLICY_RANGES: Record<
  Exclude<SFXGeneratedDurationPolicy, 'custom'>,
  SFXGeneratedDurationPolicyRange
> = {
  generate_2_to_3_seconds: {
    policy: 'generate_2_to_3_seconds',
    finalNeededSecondsMin: 0.3,
    finalNeededSecondsMax: 0.7,
    generateSecondsMin: 2,
    generateSecondsMax: 3,
    notes: 'Use for short hits, transition accents, reveal sounds, and small edit-layer polish moments.',
  },
  generate_3_to_5_seconds: {
    policy: 'generate_3_to_5_seconds',
    finalNeededSecondsMin: 1,
    finalNeededSecondsMax: 2,
    generateSecondsMin: 3,
    generateSecondsMax: 5,
    notes: 'Use for longer movement sounds, title/chapter sounds, and short designed audio gestures.',
  },
  generate_6_to_8_seconds: {
    policy: 'generate_6_to_8_seconds',
    finalNeededSecondsMin: 3,
    finalNeededSecondsMax: 5,
    generateSecondsMin: 6,
    generateSecondsMax: 8,
    notes: 'Use for ambient bridges and broader room, travel, or transition beds that need clean trim space.',
  },
}
