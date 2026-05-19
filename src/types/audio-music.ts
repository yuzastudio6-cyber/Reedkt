import type { ID, ISODateString, TimeRange } from './shared'

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
