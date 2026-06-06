import type { ID, ISODateString, JSONObject, TimeRange } from './shared'

export type ReferenceVideoCategory =
  | 'lifestyle_vacation'
  | 'travel_vlog'
  | 'luxury_travel'
  | 'real_estate'
  | 'product_demo'
  | 'talking_head'
  | 'education'
  | 'faith_teaching'
  | 'fitness_social'
  | 'food_social'
  | 'documentary'
  | 'ad'
  | 'custom'

export type ReferenceAudioSectionType =
  | 'coming_up_teaser'
  | 'intro'
  | 'dialogue'
  | 'montage'
  | 'chapter_title'
  | 'transition'
  | 'ambience_only'
  | 'food_social'
  | 'movement'
  | 'outro'
  | 'custom'

export type ReferenceAudioBehaviorType =
  | 'music_start'
  | 'music_stop'
  | 'music_rise'
  | 'music_drop'
  | 'music_duck_under_voice'
  | 'music_crossfade'
  | 'sfx_hit'
  | 'sfx_whoosh'
  | 'ambient_bridge'
  | 'room_tone_preserved'
  | 'lyrics_enter'
  | 'lyrics_exit'
  | 'chapter_hit'
  | 'outro_resolve'

export type ReferenceAdaptationRisk =
  | 'low'
  | 'medium'
  | 'high'
  | 'copy_risk'
  | 'copyright_risk'
  | 'stereotype_risk'

export type MusicCueRole =
  | 'teaser'
  | 'intro_arrival'
  | 'dialogue_bed'
  | 'montage_drive'
  | 'warm_social'
  | 'chapter_punctuation'
  | 'ambient_bridge'
  | 'outro_resolve'
  | 'brand_bed'
  | 'none'
  | 'custom'

export type MusicMood =
  | 'premium_lifestyle'
  | 'cinematic_travel'
  | 'warm_social'
  | 'playful_light'
  | 'reflective'
  | 'energetic'
  | 'educational_clean'
  | 'documentary_neutral'
  | 'corporate_polished'
  | 'faith_reflective'
  | 'custom'

export type MusicEnergyLevel =
  | 'none'
  | 'low'
  | 'medium_low'
  | 'medium'
  | 'medium_high'
  | 'high'

export type VocalPolicy =
  | 'instrumental_only'
  | 'light_vocal_texture'
  | 'lyrics_allowed_no_speech'
  | 'no_vocals_under_dialogue'
  | 'voice_first'
  | 'custom'

export type MusicSpeechSafety =
  | 'speech_first'
  | 'duck_under_voice'
  | 'no_music_under_key_dialogue'
  | 'montage_only_vocals'
  | 'not_applicable'

export type MusicGenreFamily =
  | 'cinematic_lifestyle'
  | 'european_lounge'
  | 'indie_pop'
  | 'electro_lounge'
  | 'acoustic_warm'
  | 'ambient_cinematic'
  | 'documentary_minimal'
  | 'corporate_clean'
  | 'faith_reflective_instrumental'
  | 'fitness_electronic'
  | 'food_warm_social'
  | 'custom'

export type SfxUseCase =
  | 'transition'
  | 'stroke_motion_draw'
  | 'graphic_reveal'
  | 'real_motion_object'
  | 'chapter_title'
  | 'comedic_hit'
  | 'ambient_bridge'
  | 'soft_whoosh'
  | 'light_hit'
  | 'success_chime'
  | 'paper_swipe'
  | 'transition_soft_whoosh'
  | 'transition_camera_swipe'
  | 'transition_air_pass'
  | 'transition_light_riser'
  | 'transition_ambient_bridge'
  | 'transition_subtle_cut_accent'
  | 'transition_dip_to_black_swell'
  | 'stroke_draw'
  | 'stroke_line_trace'
  | 'stroke_soft_pencil_draw'
  | 'stroke_sketch_texture'
  | 'stroke_symbol_pop'
  | 'stroke_circle_complete'
  | 'stroke_line_crack'
  | 'stroke_line_reconnect'
  | 'stroke_light_shimmer'
  | 'graphic_card_reveal'
  | 'graphic_label_pop'
  | 'graphic_diagram_trace'
  | 'graphic_line_draw'
  | 'graphic_list_item_tick'
  | 'graphic_data_point_reveal'
  | 'graphic_subtle_click'
  | 'real_motion_object_enter'
  | 'real_motion_object_settle'
  | 'real_motion_soft_impact'
  | 'real_motion_paper_movement'
  | 'real_motion_glass_movement'
  | 'real_motion_wood_movement'
  | 'real_motion_cloth_movement'
  | 'lifestyle_travel_whoosh'
  | 'lifestyle_camera_shutter'
  | 'lifestyle_water_boat_ambience'
  | 'lifestyle_restaurant_ambience_bridge'
  | 'cta_success_chime'
  | 'cta_light_tap'
  | 'cta_clean_resolve_hit'
  | 'cta_subtle_shimmer'
  | 'montage_beat_accent'
  | 'ambient_soft_bridge'
  | 'source_footage_repair'
  | 'none'
  | 'custom'

export type AudioAssetOrigin =
  | 'mock_generated'
  | 'provider_generated'
  | 'project_generated'
  | 'internal_library'
  | 'workspace_library'
  | 'manual_upload'
  | 'source_audio'
  | 'licensed_library'
  | 'unknown'

export type AudioLicenseScope =
  | 'project_only'
  | 'workspace_only'
  | 'approved_internal_library'
  | 'commercial_allowed'
  | 'ads_allowed'
  | 'terms_review_required'
  | 'blocked_from_reuse'
  | 'unknown'

export interface ReferenceVideoObservationRecord {
  id: string
  projectId?: string
  referenceAssetId?: string
  referenceUrl?: string
  category: ReferenceVideoCategory
  title?: string
  summary: string
  durationSeconds?: number
  visualStyleNotes: string[]
  pacingNotes: string[]
  chapterStructureNotes: string[]
  ambienceNotes: string[]
  dialogueNotes: string[]
  montageNotes: string[]
  createdAt: string
}

export interface ReferenceSceneSectionRecord {
  id: string
  referenceObservationId: string
  sectionOrder: number
  sectionType: ReferenceAudioSectionType
  label: string
  sceneSummary: string
  visualNotes: string[]
  pacingNotes: string[]
  audioExpectation: string
}

export interface ReferenceAudioSectionRecord {
  id: string
  referenceDnaId: string
  sectionOrder: number
  sectionType: ReferenceAudioSectionType
  startTimeSeconds?: number
  endTimeSeconds?: number
  sceneSummary: string
  musicRole?: MusicCueRole
  musicMood?: MusicMood
  energyLevel?: MusicEnergyLevel
  vocalPolicy?: VocalPolicy
  speechSafety?: MusicSpeechSafety
  genreHints: MusicGenreFamily[]
  ambienceBehavior?: string
  sfxBehavior?: string
  transitionBehavior?: string
  adaptationNotes: string[]
  doNotCopyNotes: string[]
}

export interface ReferenceAudioBehaviorRecord {
  id: string
  referenceDnaId: string
  sectionId?: string
  behaviorType: ReferenceAudioBehaviorType
  timeRange?: {
    startSeconds: number
    endSeconds: number
  }
  description: string
  whyItWorks: string
  adaptationRule: string
  copyRisk: ReferenceAdaptationRisk
}

export interface ReferenceStyleAdaptationPlanRecord {
  id: string
  referenceDnaId: string
  projectId?: string
  allowedInfluences: string[]
  blockedInfluences: string[]
  musicAdaptationRules: string[]
  sfxAdaptationRules: string[]
  ambienceAdaptationRules: string[]
  pacingAdaptationRules: string[]
  lyricsAdaptationRules: string[]
  cultureAdaptationRules: string[]
  doNotCopyRules: string[]
  riskLevel: ReferenceAdaptationRisk
}

export interface ReferenceMusicDNARecord {
  id: string
  observationId: string
  projectId?: string
  referenceAssetId?: string
  referenceUrl?: string
  category: ReferenceVideoCategory
  title?: string
  styleSummary: string
  sceneMusicMapSummary: string
  cueBoundarySummary: string
  musicCueBehavior: string[]
  sfxBehavior: string[]
  ambienceBehavior: string[]
  chapterTitleAudioBehavior: string[]
  pacingMusicRelationship: string[]
  lyricsVsInstrumentalBehavior: string[]
  dialogueDuckingBehavior: string[]
  adaptationRules: string[]
  doNotCopyRules: string[]
  safeMusicDirectorGuidance: string[]
  safeLyriaPromptGuidance: string[]
  visualStyleNotes: string[]
  pacingNotes: string[]
  audioSections: ReferenceAudioSectionRecord[]
  audioBehaviors: ReferenceAudioBehaviorRecord[]
  createdAt: ISODateString
}

export interface MusicDirectorGuidanceRecord {
  id: ID
  projectId?: ID
  referenceDnaId?: ID
  summary: string
  recommendedCueStrategy: 'single_cue' | 'multi_cue' | 'ambient_first' | 'voice_first'
  cueRoles: MusicCueRole[]
  moodTargets: MusicMood[]
  genreFamilies: MusicGenreFamily[]
  vocalPolicy: VocalPolicy
  speechSafety: MusicSpeechSafety
  ambiencePriorities: string[]
  sfxNotes: string[]
  userInstructionPriority: string
  adaptationRules: string[]
  doNotCopyRules: string[]
  createdAt: ISODateString
}

export interface MusicCueSheetItemRecord {
  id: ID
  cueSheetId: ID
  cueOrder: number
  cueRole: MusicCueRole
  sectionType: ReferenceAudioSectionType
  label: string
  timeRange?: TimeRange
  mood: MusicMood
  energyLevel: MusicEnergyLevel
  vocalPolicy: VocalPolicy
  speechSafety: MusicSpeechSafety
  genreHints: MusicGenreFamily[]
  ambienceNotes: string[]
  sfxNotes: string[]
  adaptationNotes: string[]
  doNotCopyNotes: string[]
}

export interface MusicCueSheetRecord {
  id: ID
  projectId?: ID
  editPlanId?: ID
  referenceDnaId?: ID
  guidanceId?: ID
  summary: string
  items: MusicCueSheetItemRecord[]
  doNotCopyRules: string[]
  createdAt: ISODateString
}

export interface LyriaPromptPlanRecord {
  id: ID
  cueSheetItemId: ID
  referenceDnaId?: ID
  promptTitle: string
  prompt: string
  negativePrompt: string
  styleDnaOnly: boolean
  blockedReferenceContent: string[]
  adaptationRules: string[]
  speechSafety: MusicSpeechSafety
  vocalPolicy: VocalPolicy
  createdAt: ISODateString
}

export type MusicQARecommendedAction =
  | 'use_track'
  | 'use_with_mix_adjustment'
  | 'regenerate'
  | 'regenerate_without_vocals'
  | 'regenerate_lower_energy'
  | 'regenerate_different_style'
  | 'use_ambience_only'
  | 'ask_user'
  | 'reject'

export type MusicRegenerationReason =
  | 'unwanted_vocals'
  | 'wrong_mood'
  | 'wrong_energy'
  | 'wrong_culture_context'
  | 'too_generic'
  | 'not_speech_safe'
  | 'bad_loop'
  | 'bad_ending'
  | 'audio_artifacts'
  | 'user_instruction_conflict'
  | 'reference_dna_mismatch'
  | 'license_provenance_missing'

export type MusicQAIssueSeverity = 'info' | 'warning' | 'high' | 'blocking'

export type MusicQAStatus = 'passed' | 'warning' | 'failed'

export type MusicQACheckCategory =
  | 'context_fit'
  | 'speech_safety'
  | 'lyrics_policy'
  | 'culture_fit'
  | 'mood_fit'
  | 'energy_fit'
  | 'reference_dna_fit'
  | 'user_instruction_fit'
  | 'loop_ending_quality'
  | 'artifact_quality'
  | 'mix_readiness'
  | 'license_provenance'

export type MusicSpeechSafetyResult =
  | 'safe_for_speech'
  | 'ducking_required'
  | 'unsafe_for_speech'
  | 'not_applicable'

export type GeneratedMusicProvenance =
  | 'mock_generated'
  | 'library_candidate'
  | 'user_uploaded'
  | 'unknown'

export type MusicReuseStatus =
  | 'project_only'
  | 'allowed'
  | 'terms_review_required'
  | 'blocked'

export type MusicLoopQuality = 'clean' | 'usable_with_crossfade' | 'bad_loop' | 'not_loopable'

export type MusicEndingQuality = 'clean_resolve' | 'fade_needed' | 'abrupt' | 'weak'

export type MusicArtifactHint = 'none' | 'minor' | 'noticeable' | 'severe'

export type MusicBassIntensity = 'low' | 'medium' | 'high'

export type MusicVocalHint = 'none' | 'vocal_texture' | 'lyrics' | 'unknown'

export type MusicMixStatus = 'ready' | 'needs_adjustment' | 'needs_regeneration'

export type MusicDuckingStrategy =
  | 'none'
  | 'voice_first_ducking'
  | 'sidechain_ducking'
  | 'manual_keyframe_ducking'
  | 'mute_under_speech'

export type MusicLibraryCandidateStatus =
  | 'project_only'
  | 'candidate'
  | 'terms_review_required'
  | 'rejected'

export interface GeneratedMusicTrackRecord {
  id: ID
  projectId?: ID
  cueSheetItemId?: ID
  promptPlanId?: ID
  referenceDnaId?: ID
  title: string
  cueRole: MusicCueRole
  sectionType: ReferenceAudioSectionType
  durationSeconds: number
  provenance: GeneratedMusicProvenance
  reuseStatus: MusicReuseStatus
  vocalHint: MusicVocalHint
  lyricLanguageHint?: string
  energyHint: MusicEnergyLevel
  moodHint: MusicMood
  genreHints: MusicGenreFamily[]
  instrumentHints: string[]
  bassIntensity: MusicBassIntensity
  artifactHint: MusicArtifactHint
  loopHint: MusicLoopQuality
  endingHint: MusicEndingQuality
  hasSpeechInScene: boolean
  userInstructionTags: string[]
  createdAt: ISODateString
}

export interface MusicTrackAnalysisRecord {
  id: ID
  generatedMusicTrackId: ID
  bpm: number
  key: string
  loudnessLufs: number
  peakDb: number
  hasVocals: boolean
  detectedLyricLanguage?: string
  energyLevel: MusicEnergyLevel
  moodTags: MusicMood[]
  instrumentTags: string[]
  loopable: boolean
  loopPoints?: TimeRange
  speechSafety: MusicSpeechSafetyResult
  artifactScore: number
  qualityScore: number
  recommendedUse: string
  warnings: string[]
  createdAt: ISODateString
}

export interface MusicQAIssueRecord {
  id: ID
  qaReportId?: ID
  category: MusicQACheckCategory
  severity: MusicQAIssueSeverity
  message: string
  recommendation: string
  relatedCueId?: ID
  relatedTrackId?: ID
}

export interface MusicQAReportRecord {
  id: ID
  projectId?: ID
  cueSheetItemId?: ID
  generatedMusicTrackId: ID
  referenceDnaId?: ID
  status: MusicQAStatus
  recommendedAction: MusicQARecommendedAction
  overallScore: number
  speechSafetyScore: number
  contextFitScore: number
  cultureFitScore: number
  moodFitScore: number
  mixReadinessScore: number
  issues: MusicQAIssueRecord[]
  passedChecks: string[]
  warningChecks: string[]
  failedChecks: string[]
  summary: string
  createdAt: ISODateString
}

export interface MusicMixPlanRecord {
  id: ID
  projectId?: ID
  cueSheetItemId?: ID
  generatedMusicTrackId?: ID
  qaReportId?: ID
  targetVolumeDb: number
  duckingStrategy: MusicDuckingStrategy
  duckingAmountDb: number
  duckUnderSpeech: boolean
  introFadeSeconds: number
  outroFadeSeconds: number
  crossfadeWithPreviousSeconds: number
  crossfadeWithNextSeconds: number
  beatSyncPoints: string[]
  silenceMoments: string[]
  ambientBridgeNeeded: boolean
  sfxRelationship: string
  mixNotes: string[]
  status: MusicMixStatus
  createdAt: ISODateString
}

export interface MusicRegenerationDecisionRecord {
  id: string
  projectId: string
  editPlanId: string
  musicCueId?: string
  generatedMusicTrackId?: string
  shouldRegenerate: boolean
  reasons: MusicRegenerationReason[]
  recommendedAction: MusicQARecommendedAction
  promptAdjustment: string
  lowerCostAlternative?: string
  userFacingSummary: string
  createdAt: string
}

export interface MusicLibraryCandidateRecord {
  id: ID
  generatedMusicTrackId: ID
  qaReportId?: ID
  status: MusicLibraryCandidateStatus
  reason: string
  reusableAcrossProjects: boolean
  requiresTermsReview: boolean
  tags: string[]
  createdAt: ISODateString
}

export type SoundMusicWorkstreamId = 'SOUND_MUSIC_AUDIO'

export type SoundRelatedWorkstreamId =
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'WORKER_RUNTIME_JOBS'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'

export type SoundToolId =
  | 'action_foley_sfx_tool'
  | 'ambient_everyday_soundscape_tool'
  | 'sfx_director_tool'
  | 'music_cue_planner'
  | 'ambient_sound_planner'
  | 'soundsync_planner'
  | 'audio_qa_tool'
  | 'private_audio_artifact_manifest_builder'
  | 'timing_aware_cue_manifest_builder'

export type SoundCueFamily =
  | 'action_foley_sfx'
  | 'ambient_everyday_soundscape'
  | 'music_cue'
  | 'soundtrack_layer'
  | 'audio_bed'
  | 'transition_sound'
  | 'whoosh_hit_riser'
  | 'ambience_match'
  | 'audio_mood_design'

export type SoundCueRole =
  | 'foreground_accent'
  | 'transition_support'
  | 'object_motion_support'
  | 'gesture_support'
  | 'title_card_accent'
  | 'background_bed'
  | 'room_tone'
  | 'environmental_texture'
  | 'music_mood_layer'
  | 'soundtrack_layer'
  | 'riser'
  | 'hit'
  | 'whoosh'
  | 'silence_or_no_cue'

export type SoundProviderId =
  | 'mock_sfx_provider'
  | 'mock_music_provider'
  | 'lyria_mock'
  | 'mirelo_sfx_mock'
  | 'mmaudio_mock'
  | 'dasheng_audiogen_candidate'
  | 'stable_audio_open_license_gated'
  | 'openmoss_moss_soundeffect_v2_pending_verification'
  | 'meta_audiogen_disabled'
  | 'woosh_disabled'
  | 'tangoflux_disabled'
  | 'mmaudio_disabled'
  | 'audioflux_analysis_only'
  | 'signalsmith_stretch_processing_only'
  | 'deepfilternet_review_required'
  | 'rnnoise_review_required'
  | 'demucs_review_required'

export type SoundProviderPolicyStatus =
  | 'mock_only'
  | 'mock_only_real_client_placeholder_fail_closed'
  | 'candidate_requires_license_dependency_model_card_runtime_quality_review'
  | 'conditional_license_gated_optional'
  | 'disabled_until_model_card_weights_license_runtime_quality_verified'
  | 'disabled_for_commercial_production'
  | 'disabled_until_license_policy_changes'
  | 'disabled_until_license_policy_changes_for_public_weights'
  | 'analysis_processing_only_not_generation_provider'
  | 'stretch_pitch_processing_only_not_generation_provider'
  | 'cleanup_separation_candidate_requires_model_license_readiness_review'
  | 'cleanup_candidate_requires_license_readiness_review'
  | 'separation_candidate_requires_model_license_readiness_review'

export type SoundProviderLicenseStatus =
  | 'not_applicable_mock'
  | 'apache_2_candidate'
  | 'stability_ai_community_license_conditional'
  | 'unknown_until_reverified'
  | 'non_commercial_public_weights'
  | 'license_policy_change_required'
  | 'analysis_processing_only'
  | 'review_required'

export type SoundProviderCommercialUseStatus =
  | 'commercial_export_blocked'
  | 'pending_review'
  | 'conditional_pending_license_review'
  | 'internal_beta_only_pending_review'
  | 'analysis_only_not_generation'
  | 'processing_only_not_generation'

export type SoundCommercialExportAllowed =
  | false
  | 'pending_review'
  | 'conditional_pending_license_review'

export type SoundRuntimeTarget =
  | 'cpu_service'
  | 'cpu_cloud_run_job'
  | 'gpu_cloud_run_job_l4'
  | 'gpu_cloud_run_job_blackwell'
  | 'external_provider_gateway'
  | 'mock_only'
  | 'blocked'

export type SoundExecutionMode =
  | 'planning_only'
  | 'mock_preview_only'
  | 'benchmark_only'
  | 'internal_beta_generation'
  | 'approved_generation'
  | 'blocked'

export type SoundApprovalState =
  | 'not_required'
  | 'requires_approval'
  | 'pending_approval'
  | 'approved'
  | 'blocked'

export type SoundCreditGateState =
  | 'not_required'
  | 'estimate_required'
  | 'approval_required'
  | 'reservation_required'
  | 'reserved'
  | 'blocked'

export type SoundReadinessStatus =
  | 'not_checked'
  | 'planning_ready'
  | 'mock_safe'
  | 'ready'
  | 'warning'
  | 'blocked'

export type SoundBlockedUseReason =
  | 'real_provider_call_blocked'
  | 'provider_generation_disabled'
  | 'commercial_export_not_allowed'
  | 'provider_license_blocked'
  | 'approved_snapshot_required'
  | 'credit_estimate_required'
  | 'credit_approval_required'
  | 'credit_reservation_required'
  | 'runtime_target_blocked'
  | 'runtime_target_mock_only'
  | 'tool_readiness_not_enabled'
  | 'worker_execution_not_allowed'
  | 'internal_test_scope_required'
  | 'benchmark_scope_required'
  | 'generated_asset_not_allowed'
  | 'storage_object_not_allowed'
  | 'public_artifact_blocked'
  | 'signed_url_blocked'
  | 'secret_blocked'
  | 'raw_chat_execution_blocked'
  | 'supabase_mutation_blocked'
  | 'final_render_export_not_owned'
  | 'provider_gateway_handoff_required'
  | 'worker_runtime_handoff_required'

export type SoundArtifactKind =
  | 'private_audio_artifact_manifest'
  | 'timing_aware_cue_manifest'
  | 'sound_readiness_status'
  | 'sound_qa_report'
  | 'generated_audio_metadata'
  | 'generated_sfx_metadata'
  | 'generated_ambient_soundscape_metadata'
  | 'sound_mix_manifest'
  | 'handoff_notes'

export type SoundTimingAnchor =
  | 'timeline_time'
  | 'cut'
  | 'music_beat'
  | 'music_downbeat'
  | 'caption_keyword'
  | 'visual_reveal'
  | 'transition'
  | 'object_motion'
  | 'gesture'
  | 'title_card'
  | 'emotional_pause'
  | 'manual'

export type SoundSpeechOverlapState =
  | 'none'
  | 'possible'
  | 'overlaps_speech'
  | 'speech_first_ducking_required'

export type SoundQAStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocked'
  | 'needs_human_review'

export type SoundHandoffStatus =
  | 'not_ready'
  | 'metadata_ready'
  | 'blocked'
  | 'handoff_required'
  | 'accepted_by_consumer'

export type SoundPrivateStorageScope = 'private'

export type SoundOwnerBoundary =
  | SoundRelatedWorkstreamId
  | 'PROVIDER_GATEWAY_MODELS for real transport'
  | 'PROVIDER_GATEWAY_MODELS plus WORKER_RUNTIME_JOBS'

export type SoundExecutionGateAllowedMode =
  | 'planning'
  | 'mock'
  | 'benchmark'
  | 'internal'
  | 'approved'
  | 'blocked'

export interface SoundLicensePolicy {
  licenseStatus: SoundProviderLicenseStatus
  commercialUseStatus: SoundProviderCommercialUseStatus
  commercialExportAllowed: SoundCommercialExportAllowed
  requiresLicenseGate?: boolean
  complianceEvidenceIds?: ID[]
  notes: string[]
}

export interface SoundProviderPolicy {
  providerId: SoundProviderId
  status: SoundProviderPolicyStatus
  generationEnabled: false
  commercialExportAllowed: SoundCommercialExportAllowed
  runtimeDefault: SoundRuntimeTarget
  allowedForPlanning: boolean
  license?: string
  licensePolicy: SoundLicensePolicy
  defaultFor?: SoundCueFamily[]
  fallbackFor?: SoundCueFamily[]
  requiresLicenseGate?: boolean
  ownerBoundary?: SoundOwnerBoundary
  realExecutionOwnerBoundary?: SoundOwnerBoundary
  notes: string[]
}

export interface SoundRuntimePolicy {
  policyKey: string
  runtimeTarget: SoundRuntimeTarget
  executionMode: SoundExecutionMode
  planningAllowed: boolean
  generationAllowed: false
  requiresApprovedSnapshot: boolean
  requiresCreditGate: boolean
  mayCreateGeneratedAsset: boolean
  mayDispatchWorker: boolean
  mayCallProvider: false
  requiredHandoffs: SoundRelatedWorkstreamId[]
  requiredEvidence: string[]
  blockedReasons: SoundBlockedUseReason[]
}

export type SoundAgentRequestedOutputMode =
  | 'planning_only'
  | 'mock_preview_only'
  | 'handoff_manifest_only'

export type SoundAgentSpeechDensity = 'none' | 'low' | 'medium' | 'high'

export type SoundAgentMotionIntensity = 'none' | 'subtle' | 'medium' | 'high'

export type SoundDraftCreditEstimateCategory =
  | 'sfx_planning'
  | 'ambient_planning'
  | 'music_planning'
  | 'future_generation_estimate'
  | 'qa_handoff'

export type SoundHandoffReadinessCheckName =
  | 'planning'
  | 'approval'
  | 'credit_estimate'
  | 'provider_license'
  | 'worker_execution'
  | 'audio_qa'
  | 'private_artifact_manifest'
  | 'timing_cue_manifest'
  | 'track_a_final_composition_handoff'
  | 'track_b_processing_handoff'
  | 'supabase_mutation'
  | 'observability_audit_cost'
  | 'beta_production_readiness'

export interface SoundAgentUserSoundPreferences {
  enableSfx: boolean
  enableAmbience: boolean
  enableMusic: boolean
  preferSubtleSound: boolean
  avoidFakeFoley: boolean
  avoidLoudSfxUnderSpeech: boolean
  moodKeywords: string[]
  referenceStyleNotes: string[]
}

export interface SoundAgentTranscriptSummary {
  hasSpeech: boolean
  speechDensity: SoundAgentSpeechDensity
  importantSpeechRanges: TimeRange[]
  silenceRanges: TimeRange[]
}

export interface SoundAgentEditSegmentInput {
  segmentId: ID
  startTimeSeconds: number
  endTimeSeconds: number
  visualSummary: string
  storyPurpose: string
  motionIntensity: SoundAgentMotionIntensity
  transitionType?: string
  hasTitleCard: boolean
  hasObjectMotion: boolean
  hasGesture: boolean
  needsEmotionalLift: boolean
}

export interface SoundAgentExistingAudioContext {
  hasOriginalAudio: boolean
  hasMusic: boolean
  musicMood?: string
  ambienceDescription?: string
  noisyDialogue: boolean
  cleanupNeeded: boolean
}

export interface SoundAgentTimingHint {
  hintId?: ID
  timeSeconds: number
  relatedSegmentId?: ID
  label?: string
}

export interface SoundAgentTimingHints {
  cuts: SoundAgentTimingHint[]
  beats: SoundAgentTimingHint[]
  transitions: SoundAgentTimingHint[]
  gestures: SoundAgentTimingHint[]
  objectMotions: SoundAgentTimingHint[]
  titleCards: SoundAgentTimingHint[]
}

export interface SoundAgentSourceEvidence {
  approvedPlanSnapshotId?: ID
  editPlanSource: string
  timingSource: string
  transcriptSource: string
  userInstructionSource: string
}

export interface SoundAgentPlannerInput {
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedPlanSnapshotId?: ID
  executionMode: SoundExecutionMode
  requestedOutputMode: SoundAgentRequestedOutputMode
  userSoundPreferences: SoundAgentUserSoundPreferences
  transcriptSummary: SoundAgentTranscriptSummary
  editSegments: SoundAgentEditSegmentInput[]
  existingAudioContext: SoundAgentExistingAudioContext
  timingHints: SoundAgentTimingHints
  creditBudgetHint?: number
  sourceEvidence: SoundAgentSourceEvidence
  deterministicIdSeed?: string
}

export interface SoundDraftCreditEstimateLineItem {
  lineItemId: ID
  cueId?: ID
  category: SoundDraftCreditEstimateCategory
  estimatedCreditsMin: number
  estimatedCreditsMax: number
  requiresApprovalBeforeSpend: true
  reservationRequiredBeforeExecution: true
  noSpendOccurred: true
  reason: string
}

export interface SoundDraftCreditEstimateMetadata {
  estimateId: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedPlanSnapshotId?: ID
  lineItems: SoundDraftCreditEstimateLineItem[]
  totalEstimatedCreditsMin: number
  totalEstimatedCreditsMax: number
  noSpendOccurred: true
  creditRowsCreated: false
  approvalRowsCreated: false
  reservationRowsCreated: false
  notes: string[]
}

export interface SoundHandoffReadinessCheck {
  checkName: SoundHandoffReadinessCheckName
  status: SoundReadinessStatus
  handoffStatus?: SoundHandoffStatus
  blockedReasons: SoundBlockedUseReason[]
  requiredEvidence: string[]
  notes: string[]
}

export interface SoundCuePlan {
  cueId: ID
  family: SoundCueFamily
  role: SoundCueRole
  toolId: SoundToolId
  startTimeSeconds: number
  endTimeSeconds: number
  durationSeconds: number
  anchorType: SoundTimingAnchor
  anchorId?: ID
  visualOrStoryReason: string
  promptIntent: string
  negativePromptIntent?: string
  speechOverlap: SoundSpeechOverlapState
  duckingRequired: boolean
  intensity: 'none' | 'subtle' | 'medium' | 'strong'
  providerCandidate: SoundProviderId
  providerPolicyStatus: SoundProviderPolicyStatus
  providerBlockedReasons: SoundBlockedUseReason[]
  licenseEvidenceRequired: string[]
  runtimeTarget: SoundRuntimeTarget
  runtimePolicyKey: string
  approvalState: SoundApprovalState
  creditGateState: SoundCreditGateState
  qaStatus: SoundQAStatus
  blockedReasons: SoundBlockedUseReason[]
}

export interface SoundAgentPlanningRequest {
  requestId: ID
  workstreamId: SoundMusicWorkstreamId
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedPlanSnapshotId?: ID
  timingManifestId?: ID
  sourceMediaAssetIds: ID[]
  requestedFamilies: SoundCueFamily[]
  requestedToolIds: SoundToolId[]
  userIntentSummary?: string
  compiledIntentId?: ID
  notes: string[]
}

export interface SoundAgentPlan {
  planId: ID
  workstreamId: SoundMusicWorkstreamId
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedPlanSnapshotId?: ID
  cuePlans: SoundCuePlan[]
  providerPolicies: SoundProviderPolicy[]
  runtimePolicies: SoundRuntimePolicy[]
  blockedUses: SoundBlockedUseReason[]
  readiness: SoundHandoffReadiness
  warnings: string[]
}

export interface SoundAgentPlannerResult {
  plan: SoundAgentPlan
  timingAwareCueManifest: TimingAwareSoundCueManifest
  privateAudioArtifactManifest: PrivateAudioArtifactManifest
  handoffReadiness: SoundHandoffReadiness
  qaWarnings: string[]
  blockedReasons: SoundBlockedUseReason[]
  draftCreditEstimate: SoundDraftCreditEstimateMetadata
  toolRequests: SoundToolRequest[]
  toolResults: SoundToolResult[]
  executionGateResults: SoundExecutionGateResult[]
  handoffMetadata: Record<SoundRelatedWorkstreamId, JSONObject>
}

export interface SoundToolRequest {
  toolRequestId: ID
  toolId: SoundToolId
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  cueIds: ID[]
  executionMode: SoundExecutionMode
  providerCandidate?: SoundProviderId
  runtimeTarget: SoundRuntimeTarget
  approvalState: SoundApprovalState
  creditGateState: SoundCreditGateState
  metadata?: JSONObject
}

export interface SoundToolResult {
  toolRequestId: ID
  toolId: SoundToolId
  status: SoundReadinessStatus
  artifactKinds: SoundArtifactKind[]
  artifactManifestIds: ID[]
  cueManifestIds: ID[]
  qaResultIds: ID[]
  blockedReasons: SoundBlockedUseReason[]
  warnings: string[]
  metadata?: JSONObject
}

export interface SoundQAResult {
  qaResultId: ID
  workspaceId: ID
  projectId: ID
  cueIds: ID[]
  artifactManifestIds: ID[]
  status: SoundQAStatus
  checks: string[]
  requiredEvidence: string[]
  blockedReasons: SoundBlockedUseReason[]
  warnings: string[]
  createdAt?: ISODateString
}

export interface PrivateAudioArtifactManifest {
  manifestId: ID
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId?: ID
  artifactKind: SoundArtifactKind
  metadataOnly: true
  sourceCueIds: ID[]
  generationRequestIds?: ID[]
  generatedAssetIds?: ID[]
  mediaAssetIds?: ID[]
  timingMapIds?: ID[]
  storageScope: SoundPrivateStorageScope
  publicArtifactAllowed: false
  licensePolicy: SoundLicensePolicy
  provenanceSummary: string
  qaEvidenceIds: ID[]
  blockedUses: SoundBlockedUseReason[]
  handoffTargets: SoundRelatedWorkstreamId[]
  trackAHandoffStatus: SoundHandoffStatus
  providerGatewayHandoffStatus: SoundHandoffStatus
  workerRuntimeHandoffStatus: SoundHandoffStatus
}

export interface TimingAwareSoundCueManifest {
  cueManifestId: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedPlanSnapshotId?: ID
  version: string
  metadataOnly: true
  cues: SoundCuePlan[]
  timingAnchors: SoundTimingAnchor[]
  sourceReasoning: string[]
  speechDuckingNotes: string[]
  moodNotes: string[]
  providerPolicyIds: SoundProviderId[]
  runtimeTargets: SoundRuntimeTarget[]
  blockedUses: SoundBlockedUseReason[]
  qaReadiness: SoundReadinessStatus
  trackAHandoffStatus: SoundHandoffStatus
  trackBHandoffStatus: SoundHandoffStatus
  trackAFinalRenderReady: false
  providerExecutionReady: false
  workerExecutionReady: false
  generatedAssetIds?: ID[]
}

export interface SoundHandoffReadiness {
  readinessId: ID
  workstreamId: SoundMusicWorkstreamId
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId?: ID
  privateAudioArtifactManifestIds: ID[]
  timingAwareCueManifestIds: ID[]
  audioReadinessStatus: SoundReadinessStatus
  blockedUses: SoundBlockedUseReason[]
  requiredValidationEvidence: string[]
  handoffTargets: SoundRelatedWorkstreamId[]
  trackAStatus: SoundHandoffStatus
  trackBStatus: SoundHandoffStatus
  providerGatewayStatus: SoundHandoffStatus
  workerRuntimeStatus: SoundHandoffStatus
  supabaseStatus: SoundHandoffStatus
  observabilityStatus: SoundHandoffStatus
  billingStatus?: SoundHandoffStatus
  readinessChecks: SoundHandoffReadinessCheck[]
  productionReadinessStatus: SoundHandoffStatus
}

export interface SoundExecutionGateInput {
  executionMode: SoundExecutionMode
  providerPolicy: SoundProviderPolicy
  runtimeTarget: SoundRuntimeTarget
  approvedPlanSnapshotId?: ID
  creditEstimateId?: ID
  creditApprovalId?: ID
  creditReservationId?: ID
  toolReadinessEnabled?: boolean
  workerExecutionAllowed?: boolean
  internalTestScope?: boolean
  benchmarkScopeApproved?: boolean
  benchmarkProviderAllowed?: boolean
  commercialExportRequested?: boolean
}

export interface SoundExecutionGateResult {
  allowed: boolean
  allowedMode: SoundExecutionGateAllowedMode
  blockedReasons: SoundBlockedUseReason[]
  requiredHandoffs: SoundRelatedWorkstreamId[]
  requiredEvidence: string[]
  mayCreateGeneratedAsset: boolean
  mayDispatchWorker: boolean
  mayCallProvider: false
}
