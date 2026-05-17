import type {
  BaseRecord,
  CreditImpact,
  ID,
  ISODateString,
  Percentage,
  Seconds,
  TargetPlatform,
  TimeRange,
} from './shared'
import type { SignatureSystem } from './signature-systems'
import type { DuckingStrategy } from './edit-quality'

export type MusicSceneType =
  | 'talking_head'
  | 'dialogue'
  | 'narration'
  | 'lifestyle'
  | 'vacation'
  | 'travel_montage'
  | 'coming_up_teaser'
  | 'intro'
  | 'outro'
  | 'chapter_transition'
  | 'food_social'
  | 'boat_movement'
  | 'city_walk'
  | 'luxury_showcase'
  | 'real_estate'
  | 'product_demo'
  | 'education'
  | 'faith_reflective'
  | 'fitness'
  | 'comedy'
  | 'documentary'
  | 'ad_sales'
  | 'custom'

export type MusicCueRole =
  | 'no_music'
  | 'subtle_bed'
  | 'dialogue_bed'
  | 'intro_hook'
  | 'coming_up_teaser'
  | 'montage_driver'
  | 'travel_movement'
  | 'chapter_transition'
  | 'emotional_support'
  | 'premium_polish'
  | 'comedic_accent'
  | 'food_social_warmth'
  | 'sales_momentum'
  | 'outro_resolve'
  | 'ambient_only'
  | 'custom'

export type VocalPolicy =
  | 'no_vocals'
  | 'instrumental_only'
  | 'vocal_texture_only'
  | 'vocal_chops_only'
  | 'soft_hook_vocals'
  | 'full_lyrical_song'
  | 'lyrics_allowed_only_without_speech'
  | 'intro_outro_vocals_only'
  | 'user_requested_vocals'

export type LyricLanguagePolicy =
  | 'no_lyrics'
  | 'same_as_spoken_language'
  | 'match_location_context'
  | 'english_only'
  | 'french_allowed'
  | 'italian_allowed'
  | 'spanish_allowed'
  | 'japanese_allowed'
  | 'korean_allowed'
  | 'portuguese_allowed'
  | 'multilingual_allowed'
  | 'user_specified'
  | 'unknown'

export type MusicCultureRegion =
  | 'global'
  | 'usa'
  | 'uk'
  | 'france'
  | 'italy'
  | 'spain'
  | 'latin_america'
  | 'caribbean'
  | 'west_africa'
  | 'east_africa'
  | 'middle_east'
  | 'india'
  | 'japan'
  | 'korea'
  | 'southeast_asia'
  | 'european_luxury'
  | 'tropical'
  | 'unknown'

export type MusicGenreFamily =
  | 'cinematic'
  | 'orchestral'
  | 'ambient'
  | 'pop'
  | 'indie_pop'
  | 'french_pop'
  | 'italian_inspired_pop'
  | 'hip_hop'
  | 'trap'
  | 'lofi_hip_hop'
  | 'rnb'
  | 'soul'
  | 'gospel_inspired'
  | 'rock'
  | 'acoustic'
  | 'folk'
  | 'jazz'
  | 'electronic'
  | 'house'
  | 'tropical_house'
  | 'afrobeat'
  | 'latin'
  | 'reggaeton'
  | 'dancehall'
  | 'reggae'
  | 'country'
  | 'corporate'
  | 'luxury_lounge'
  | 'documentary'
  | 'faith_reflective'
  | 'travel_vlog'
  | 'lifestyle_vlog'
  | 'custom'

export type MusicMood =
  | 'calm'
  | 'emotional'
  | 'hopeful'
  | 'luxury'
  | 'stylish'
  | 'romantic'
  | 'playful'
  | 'funny'
  | 'serious'
  | 'cinematic'
  | 'premium'
  | 'energetic'
  | 'clean'
  | 'educational'
  | 'mysterious'
  | 'dramatic'
  | 'relaxed'
  | 'warm'
  | 'inspirational'
  | 'custom'

export type MusicEnergyLevel =
  | 'none'
  | 'very_low'
  | 'low'
  | 'medium_low'
  | 'medium'
  | 'medium_high'
  | 'high'
  | 'intense'

export type MusicEnergyArc =
  | 'flat'
  | 'gentle_build'
  | 'rise_and_resolve'
  | 'teaser_peak_then_drop'
  | 'montage_drive'
  | 'emotional_swell'
  | 'soft_resolve'
  | 'beat_drop'
  | 'chapter_hit'
  | 'custom'

export type MusicSpeechSafety =
  | 'safe_under_voice'
  | 'needs_ducking'
  | 'not_safe_under_voice'
  | 'montage_only'
  | 'intro_outro_only'
  | 'unknown'

export type MusicGenerationPurpose =
  | 'project_specific_custom_music'
  | 'music_cue'
  | 'intro_music'
  | 'dialogue_bed'
  | 'montage_song'
  | 'outro_resolve'
  | 'reference_style_adaptation'
  | 'library_candidate'
  | 'regeneration'
  | 'variation'
  | 'custom'

export type MusicGenerationStatus =
  | 'draft'
  | 'planned'
  | 'awaiting_approval'
  | 'approved'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'qa_pending'
  | 'qa_passed'
  | 'qa_failed'
  | 'ready_for_mix'
  | 'used_in_preview'
  | 'used_in_export'
  | 'cancelled'
  | 'failed'

export type MusicReuseStatus =
  | 'project_only'
  | 'candidate_for_library'
  | 'approved_for_internal_library'
  | 'rejected_for_reuse'
  | 'requires_terms_review'
  | 'unknown'

export type MusicNeedDecision =
  | 'music_needed'
  | 'music_optional'
  | 'ambience_only'
  | 'no_music'
  | 'needs_user_confirmation'

export type MusicCueCountDecision =
  | 'single_cue'
  | 'multi_cue'
  | 'ambience_only'
  | 'needs_analysis'
  | 'needs_user_confirmation'

export type MusicQAStatus =
  | 'pending'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'requires_regeneration'
  | 'requires_mix_adjustment'
  | 'waived'

export type MusicQAIssueType =
  | 'unwanted_lyrics_under_voice'
  | 'wrong_mood'
  | 'wrong_culture_context'
  | 'too_loud_under_speech'
  | 'too_much_bass'
  | 'too_much_energy'
  | 'distracting_melody'
  | 'bad_loop_point'
  | 'weak_ending'
  | 'timing_mismatch'
  | 'generic_output'
  | 'audio_artifact'
  | 'does_not_match_reference_dna'
  | 'does_not_match_user_instruction'
  | 'license_or_provenance_missing'
  | 'other'

export type AudioAssetOrigin =
  | 'lyria_generated'
  | 'reeditpro_owned_sfx'
  | 'user_uploaded'
  | 'commissioned'
  | 'stock_licensed'
  | 'reference_only'
  | 'unknown'

export type AudioLicenseScope =
  | 'project_only'
  | 'workspace_only'
  | 'reeditpro_library'
  | 'user_provided'
  | 'commercial_allowed'
  | 'ads_allowed'
  | 'requires_review'
  | 'unknown'

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
  | 'custom'

export type MusicLibraryCandidateStatus =
  | 'not_candidate'
  | 'candidate'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_terms_review'

export type AudioUsageType =
  | 'project_preview'
  | 'final_export'
  | 'revision_preview'
  | 'internal_library_preview'
  | 'reference_analysis_only'
  | 'other'

export type MusicSpeechPresence =
  | 'none'
  | 'light_voiceover'
  | 'dialogue'
  | 'narration'
  | 'teaching'
  | 'podcast_style'
  | 'mixed_speech_and_montage'
  | 'unknown'

export type MusicReferenceInfluence =
  | 'none'
  | 'light_style_dna'
  | 'moderate_style_dna'
  | 'strong_structure_dna'
  | 'user_supplied_reference'
  | 'unknown'

export type MusicRecommendedAction =
  | 'approve_for_project'
  | 'approve_with_mix_adjustment'
  | 'regenerate'
  | 'revise_prompt'
  | 'use_ambience_only'
  | 'ask_user'
  | 'reject'

export type MusicQAIssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export type SfxVolumeCategory = 'none' | 'low' | 'medium' | 'high'

export type AudioGenerationWorkerStatus =
  | 'not_started'
  | 'planned'
  | 'waiting_credit_approval'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type LyriaPromptValidationWarningCode =
  | 'missing_duration'
  | 'missing_vocal_policy'
  | 'missing_speech_safety'
  | 'lyrics_under_speech'
  | 'reference_copy_risk'
  | 'culture_stereotype_risk'
  | 'prompt_too_vague'
  | 'missing_negative_prompt'
  | 'not_aligned_with_cue_role'
  | 'user_instruction_conflict'

export interface LyriaPromptValidationWarning {
  code: LyriaPromptValidationWarningCode
  message: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export const LYRIA_PRO_FUTURE_MODEL_NAME = 'lyria-3-pro-preview'

export const MUSIC_RANDOM_GENERATION_RULE =
  'SoundSync must analyze context and create an approved music plan before any future music generation starts.'

export const MUSIC_CULTURE_STEREOTYPE_RULE =
  'Culture-aware music should combine user intent, transcript, setting, audience, and reference DNA; never force stereotypes from location alone.'

export interface MusicContextAnalysisRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  referenceAssetId?: ID
  primarySceneType: MusicSceneType
  detectedSceneTypes: MusicSceneType[]
  videoTopic: string
  settingSummary: string
  locationHints: string[]
  cultureRegions: MusicCultureRegion[]
  spokenLanguages: string[]
  audience: string
  platform: TargetPlatform
  musicNeedDecision: MusicNeedDecision
  musicCueCountDecision: MusicCueCountDecision
  speechPresence: MusicSpeechPresence
  dialogueHeavy: boolean
  montageSectionsDetected: boolean
  ambienceImportant: boolean
  referenceMusicInfluence: MusicReferenceInfluence
  userMusicInstructions: string[]
  avoidMusicInstructions: string[]
  confidence: Percentage
  notes: string[]
}

export interface MusicLanguageContextRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicContextAnalysisId: ID
  spokenLanguage: string
  visualLocation: string
  cultureRegion: MusicCultureRegion
  recommendedLyricLanguagePolicy: LyricLanguagePolicy
  allowedLyricLanguages: string[]
  avoidLanguages: string[]
  cultureStyleNotes: string[]
  stereotypeAvoidanceNotes: string[]
  confidence: Percentage
}

export interface MusicCueSheetRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicContextAnalysisId: ID
  cueCountDecision: MusicCueCountDecision
  summary: string
  overallMood: MusicMood
  overallEnergyArc: MusicEnergyArc
  usesMultipleCues: boolean
  lyricsAllowedSomewhere: boolean
  dialogueSafeRequired: boolean
  referenceDnaUsed: boolean
  approvalRequired: boolean
  creditEstimateId?: ID
  status: MusicGenerationStatus
  notes: string[]
}

export interface MusicCueRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  editPlanSegmentId?: ID
  cueOrder: number
  cueRole: MusicCueRole
  sceneType: MusicSceneType
  startTimeSeconds?: Seconds
  endTimeSeconds?: Seconds
  targetDurationSeconds: Seconds
  mood: MusicMood
  genreFamilies: MusicGenreFamily[]
  energyLevel: MusicEnergyLevel
  energyArc: MusicEnergyArc
  cultureRegion: MusicCultureRegion
  vocalPolicy: VocalPolicy
  lyricLanguagePolicy: LyricLanguagePolicy
  speechSafety: MusicSpeechSafety
  instrumentation: string[]
  bpmTarget?: number
  keyTarget?: string
  referenceInfluence: MusicReferenceInfluence
  promptGoal: string
  negativePromptGoals: string[]
  duckingRequired: boolean
  loopableNeeded: boolean
  creditImpact: CreditImpact
  requiresApproval: boolean
  status: MusicGenerationStatus
  notes: string[]
}

export interface MusicStyleTaxonomyRecord extends BaseRecord {
  taxonomyKey: string
  genreFamily: MusicGenreFamily
  displayName: string
  description: string
  commonMoods: MusicMood[]
  commonInstruments: string[]
  goodForSceneTypes: MusicSceneType[]
  avoidForSceneTypes: MusicSceneType[]
  speechSafetyDefault: MusicSpeechSafety
  cultureRegion?: MusicCultureRegion
  examplePromptPhrases: string[]
  avoidPromptPhrases: string[]
  isActive: boolean
}

export interface ReferenceMusicDNARecord extends BaseRecord {
  projectId: ID
  referenceAssetId?: ID
  referenceUrl?: string
  summary: string
  cueBoundaryNotes: string[]
  musicCueCount: number
  genreMoodPerCue: string[]
  lyricsMoments: string[]
  instrumentalMoments: string[]
  dialogueDuckingBehavior: string
  introMusicBehavior: string
  montageMusicBehavior: string
  chapterTitleAudioBehavior: string
  outroResolveBehavior: string
  sfxBehavior: string
  ambienceBehavior: string
  adaptationRules: string[]
  doNotCopyRules: string[]
  confidence: Percentage
}

export interface LyriaPromptPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  generationPurpose: MusicGenerationPurpose
  modelName: string
  providerName: 'Lyria Pro' | string
  prompt: string
  negativePrompt: string
  durationSeconds: Seconds
  outputFormat: 'wav' | 'mp3' | 'stems' | 'unknown'
  instrumentalOnly: boolean
  lyricsAllowed: boolean
  targetLanguage?: string
  timestampedStructure: LyriaPromptSegment[]
  styleConstraints: string[]
  timingConstraints: string[]
  speechSafetyInstructions: string[]
  cultureContextInstructions: string[]
  qualityInstructions: string[]
  creditEstimateId?: ID
  generationRequestId?: ID
  status: MusicGenerationStatus
  notes: string[]
}

export interface LyriaPromptSegment extends BaseRecord {
  lyriaPromptPlanId: ID
  segmentOrder: number
  startTimeSeconds: Seconds
  endTimeSeconds: Seconds
  purpose: string
  energy: MusicEnergyLevel
  instrumentation: string[]
  lyricInstruction: string
  transitionInstruction: string
  promptText: string
}

export interface GeneratedMusicTrackRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicCueId: ID
  lyriaPromptPlanId: ID
  generationRequestId?: ID
  generatedAssetId?: ID
  origin: AudioAssetOrigin
  provider: string
  model: string
  prompt: string
  negativePrompt: string
  durationSeconds: Seconds
  genreFamilies: MusicGenreFamily[]
  mood: MusicMood
  energy: MusicEnergyLevel
  cultureRegion: MusicCultureRegion
  vocalPolicy: VocalPolicy
  lyricLanguagePolicy: LyricLanguagePolicy
  storagePath?: string
  reuseStatus: MusicReuseStatus
  qaStatus: MusicQAStatus
  usedInRenderId?: ID
  usedInExportId?: ID
  licenseProvenanceId?: ID
  notes: string[]
}

export interface MusicTrackAnalysisRecord extends BaseRecord {
  generatedMusicTrackId?: ID
  audioAssetId?: ID
  bpm: number
  key: string
  loudnessLufs: number
  peakDb: number
  hasVocals: boolean
  detectedLanguages: string[]
  energyLevel: MusicEnergyLevel
  moodTags: MusicMood[]
  instrumentTags: string[]
  loopable: boolean
  loopStartSeconds?: Seconds
  loopEndSeconds?: Seconds
  speechSafe: boolean
  artifactScore: Percentage
  qualityScore: Percentage
  recommendedUse: string
  warnings: string[]
}

export interface MusicMixPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  generatedMusicTrackId?: ID
  volumeDbTarget: number
  duckingStrategy: DuckingStrategy
  duckingAmountDb: number
  duckUnderSpeech: boolean
  introFadeSeconds: Seconds
  outroFadeSeconds: Seconds
  crossfadeWithPreviousCue: Seconds
  crossfadeWithNextCue: Seconds
  beatSyncPoints: TimeRange[]
  silenceMoments: TimeRange[]
  ambientBridgeNeeded: boolean
  sfxRelationship: string
  mixNotes: string[]
  status: MusicGenerationStatus
}

export interface MusicQAReportRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  generatedMusicTrackId?: ID
  status: MusicQAStatus
  overallScore: Percentage
  speechSafetyScore: Percentage
  contextFitScore: Percentage
  cultureFitScore: Percentage
  moodFitScore: Percentage
  mixReadinessScore: Percentage
  issues: MusicQAIssue[]
  recommendedAction: MusicRecommendedAction
  requiresRegeneration: boolean
  requiresMixAdjustment: boolean
  approvedForProject: boolean
  approvedForLibraryCandidate: boolean
  notes: string[]
}

export interface MusicQAIssue {
  id: ID
  issueType: MusicQAIssueType
  severity: MusicQAIssueSeverity
  description: string
  recommendedFix: string
  timeRange?: TimeRange
  blocksUse: boolean
}

export interface MusicLibraryCandidateRecord extends BaseRecord {
  generatedMusicTrackId: ID
  projectId: ID
  workspaceId?: ID
  candidateStatus: MusicLibraryCandidateStatus
  reason: string
  qualityScore: Percentage
  reuseStatus: MusicReuseStatus
  genreFamilies: MusicGenreFamily[]
  moodTags: MusicMood[]
  cultureRegion: MusicCultureRegion
  vocalPolicy: VocalPolicy
  speechSafe: boolean
  licenseReviewRequired: boolean
  approvedBy?: ID
  approvedAt?: ISODateString
  notes: string[]
}

export interface AudioLicenseProvenanceRecord extends BaseRecord {
  projectId?: ID
  workspaceId?: ID
  audioAssetOrigin: AudioAssetOrigin
  provider: string
  model?: string
  termsVersion?: string
  licenseScope: AudioLicenseScope
  commercialAllowed: boolean
  adsAllowed: boolean
  clientWorkAllowed: boolean
  reuseAcrossUsersAllowed: boolean
  requiresAttribution: boolean
  userProvided: boolean
  licenseNotes: string[]
  sourceUrl?: string
  proofStoragePath?: string
  createdAt: ISODateString
}

export interface AudioUsageRecord extends BaseRecord {
  projectId: ID
  editPlanId?: ID
  renderId?: ID
  exportId?: ID
  generatedMusicTrackId?: ID
  generatedAssetId?: ID
  musicCueId?: ID
  licenseProvenanceId?: ID
  usageType: AudioUsageType
  usedStartTimeSeconds: Seconds
  usedEndTimeSeconds: Seconds
  mixPlanId?: ID
  usageNotes: string[]
  createdAt: ISODateString
}

export interface SfxLibraryAssetRecord extends BaseRecord {
  displayName: string
  origin: AudioAssetOrigin
  sfxUseCase: SfxUseCase
  storagePath?: string
  durationSeconds: Seconds
  licenseProvenanceId?: ID
  safeUnderVoice: boolean
  volumeCategory: SfxVolumeCategory
  tags: string[]
  recommendedSceneTypes: MusicSceneType[]
  avoidSceneTypes: MusicSceneType[]
  supportsSignatureSystems: SignatureSystem[]
  approvedForUse: boolean
  notes: string[]
}

export interface AudioGenerationWorkerRequest {
  id: ID
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  lyriaPromptPlanId: ID
  generationPurpose: MusicGenerationPurpose
  providerName: 'Lyria Pro' | string
  modelName: string
  creditEstimateId?: ID
  creditReservationId?: ID
  approvedByUserId?: ID
  status: AudioGenerationWorkerStatus
  requestedAt: ISODateString
  notes: string[]
}

export interface AudioGenerationWorkerResult {
  id: ID
  workerRequestId: ID
  projectId: ID
  generatedMusicTrackId?: ID
  generatedAssetId?: ID
  qaReportId?: ID
  status: AudioGenerationWorkerStatus
  providerRequestId?: string
  providerResponseSummary?: string
  errorMessage?: string
  completedAt?: ISODateString
  notes: string[]
}
