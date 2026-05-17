import type { BaseRecord, ID, Percentage, ProcessingStatus, TimeRange } from './shared'
import type { EditComplexity } from './planning'

export type EditQualityLevel = 'basic' | 'pro' | 'signature' | 'premium_signature'

export type ProfessionalStandard =
  | 'clean_professional'
  | 'social_polished'
  | 'premium_brand'
  | 'cinematic'
  | 'educational_clear'
  | 'faith_respectful'
  | 'business_direct'
  | 'luxury_subtle'
  | 'energetic_social'
  | 'documentary_natural'

export type GenerationBudgetLevel = 'low' | 'balanced' | 'high' | 'premium'

export type TransitionPolicy =
  | 'none'
  | 'only_when_needed'
  | 'clean_cuts'
  | 'soft_contextual'
  | 'beat_matched'
  | 'story_matched'
  | 'premium_subtle'

export type MusicPolicy =
  | 'none'
  | 'only_if_appropriate'
  | 'subtle_bed'
  | 'mood_support'
  | 'beat_driven'
  | 'premium_scoring'
  | 'reference_guided'

export type SfxPolicy =
  | 'none'
  | 'minimal'
  | 'subtle_when_needed'
  | 'motion_linked'
  | 'transition_linked'
  | 'premium_designed'

export type AudioCleanupPolicy =
  | 'none'
  | 'light_cleanup'
  | 'voice_leveling'
  | 'noise_reduction'
  | 'room_tone_preserve'
  | 'dialogue_enhance'
  | 'heavy_repair'

export type CaptionPolicy =
  | 'none'
  | 'basic_readable'
  | 'clean_social'
  | 'premium_subtle'
  | 'educational_clear'
  | 'word_emphasis'
  | 'brand_style'

export type SignaturePolicy =
  | 'none_unless_requested'
  | 'allow_if_useful'
  | 'actively_investigate'
  | 'required_by_user'
  | 'premium_generation'

export type PacingStyle =
  | 'natural_clean'
  | 'tight_clean'
  | 'fast_social'
  | 'educational_clear'
  | 'premium_smooth'
  | 'cinematic_slow'
  | 'emotional_breathing'
  | 'sales_direct'

export type SpeakerEnergy = 'low' | 'calm' | 'medium' | 'high' | 'excited' | 'serious' | 'emotional'

export type PauseQuality =
  | 'dead_space'
  | 'mistake_pause'
  | 'thinking_pause'
  | 'emotional_pause'
  | 'dramatic_pause'
  | 'natural_breath'
  | 'unknown'

export type CutType =
  | 'remove_dead_space'
  | 'remove_mistake'
  | 'tighten_pause'
  | 'preserve_emotional_pause'
  | 'jump_cut'
  | 'j_cut'
  | 'l_cut'
  | 'match_cut'
  | 'cutaway_insert'
  | 'none'

export type TransitionType =
  | 'hard_cut'
  | 'soft_cut'
  | 'crossfade'
  | 'dip_to_black'
  | 'match_cut'
  | 'camera_motion_cut'
  | 'speed_ramp'
  | 'whip_pan'
  | 'push_transition'
  | 'wipe'
  | 'ambient_bridge'
  | 'none'

export type AudioEnvironmentType =
  | 'indoor_room'
  | 'office'
  | 'home_interior'
  | 'outdoor_street'
  | 'outdoor_nature'
  | 'vehicle'
  | 'restaurant'
  | 'crowd'
  | 'studio'
  | 'unknown'

export type NoiseSeverity = 'none' | 'low' | 'medium' | 'high' | 'severe'

export type AmbientSoundType =
  | 'room_tone'
  | 'office_room'
  | 'outdoor_street'
  | 'nature'
  | 'home_interior'
  | 'crowd_soft'
  | 'restaurant_soft'
  | 'real_estate_walkthrough'
  | 'silent_clean'
  | 'none'

export type MusicRole =
  | 'none'
  | 'subtle_bed'
  | 'emotional_support'
  | 'premium_polish'
  | 'energy_driver'
  | 'cinematic_build'
  | 'educational_background'
  | 'sales_momentum'

export type MusicEnergy = 'none' | 'low' | 'medium_low' | 'medium' | 'medium_high' | 'high'

export type DuckingStrategy = 'none' | 'light' | 'medium' | 'strong' | 'voice_first' | 'beat_sensitive'

export type SoundEffectType =
  | 'none'
  | 'soft_whoosh'
  | 'light_hit'
  | 'success_chime'
  | 'transition_riser'
  | 'subtle_pop'
  | 'paper_swipe'
  | 'object_whoosh'
  | 'stroke_draw_sound'
  | 'ambient_bridge'

export type CaptionDensity = 'none' | 'low' | 'medium' | 'high' | 'word_by_word'

export type CaptionStyleIntent =
  | 'basic_readable'
  | 'clean_social'
  | 'premium_subtle'
  | 'educational_clear'
  | 'emphasis_words'
  | 'brand_style'

export type EditQualityCheckType =
  | 'speech_clarity'
  | 'cut_smoothness'
  | 'caption_readability'
  | 'music_balance'
  | 'sfx_balance'
  | 'transition_quality'
  | 'ambient_consistency'
  | 'story_flow'
  | 'signature_timing'
  | 'credit_compliance'
  | 'user_instruction_compliance'
  | 'professional_standard'

export type EditQualityCheckStatus =
  | 'pending'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'requires_retry'
  | 'waived'
  | 'not_run'

export interface EditQualityProfileRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editComplexity: EditComplexity
  qualityLevel: EditQualityLevel
  professionalStandard: ProfessionalStandard
  professionalStandardRequired: true
  generationBudgetLevel?: GenerationBudgetLevel
  pacingStyle?: PacingStyle
  pacingStrategy: string
  transitionPolicy: TransitionPolicy
  musicPolicy?: MusicPolicy
  sfxPolicy?: SfxPolicy
  audioCleanupPolicy?: AudioCleanupPolicy
  captionPolicy?: CaptionPolicy
  signaturePolicy?: SignaturePolicy
  captionStrategy: string
  audioStrategy: string
  signatureUsageBoundary: string
  qualityGoal?: string
  userInstructionSummary?: string
  workerNotes?: string
  notes: string[]
}

export interface PacingAnalysisRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  sourceClipId?: ID
  storyBeatId?: ID
  timeRange: TimeRange
  speakerEnergy?: SpeakerEnergy
  currentPaceSummary: string
  recommendedPaceSummary: string
  deadSpaceSeconds: number
  emotionalPauseSecondsToPreserve: number
  pauseQuality?: PauseQuality
  recommendedPacing?: PacingStyle
  cutDensity?: 'low' | 'medium' | 'high' | 'variable'
  preserveBreaths?: boolean
  preserveEmotionalPauses?: boolean
  confidence: Percentage
}

export interface CutDecisionRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  sourceClipId?: ID
  sourceClipSequenceItemId?: ID
  mediaAssetId?: ID
  cutOrder?: number
  cutType: CutType
  timeRange: TimeRange
  outputTimeRange?: TimeRange
  reason: string
  preserveContext?: boolean
  affectsSentence?: boolean
  preserveAudioContinuity: boolean
  workerNotes: string[]
}

export interface TransitionPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  fromSegmentId?: ID
  toSegmentId?: ID
  transitionOrder?: number
  transitionType: TransitionType
  transitionPolicy: TransitionPolicy
  reason: string
  musicBeatAligned: boolean
  emotionalTone: string
  durationSeconds: number
  soundEffectNeeded?: boolean
  musicSyncPoint?: string
  sfxHint?: SoundEffectType
}

export interface AudioEnvironmentAnalysisRecord extends BaseRecord {
  projectId: ID
  mediaAssetId: ID
  editPlanId?: ID
  editPlanSegmentId?: ID
  timeRange: TimeRange
  environmentType?: AudioEnvironmentType
  roomTone: AmbientSoundType
  roomToneType?: string
  ambientEnvironment?: string
  backgroundNoise: string[]
  backgroundNoiseType?: string
  noiseSeverity?: NoiseSeverity
  reverbLevel: 'low' | 'medium' | 'high'
  echoDetected: boolean
  humDetected: boolean
  windDetected: boolean
  trafficDetected: boolean
  voiceClarityScore: Percentage
  recommendedCleanup?: AudioCleanupPolicy
  preserveNaturalAmbience?: boolean
  cleanupRecommendations: string[]
}

export interface AmbientSoundPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  audioEnvironmentAnalysisId?: ID
  ambientNeeded?: boolean
  ambientSoundType: AmbientSoundType
  sourceOrGenerated?: 'source' | 'generated' | 'stock' | 'none'
  mixLevel?: 'none' | 'low' | 'medium' | 'high'
  preserveNaturalRoomTone: boolean
  bridgeSceneChanges: boolean
  reductionStrategy: string
  notes: string[]
}

export interface MusicPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  musicContextAnalysisId?: ID
  musicCueSheetId?: ID
  referenceMusicDNAId?: ID
  lyriaPromptPlanId?: ID
  generatedMusicTrackIds?: ID[]
  musicMixPlanId?: ID
  musicNeeded?: boolean
  role: MusicRole
  mood: string
  musicEnergy?: MusicEnergy
  energyCurve: string
  musicStartStrategy?: string
  musicEndStrategy?: string
  duckingStrategy: string
  duckingStrategyType?: DuckingStrategy
  startTiming: string
  beatSyncNeeded?: boolean
  referenceMusicInfluence?: string
  licenseSource?: string
  beatChangeNotes: string[]
  status: ProcessingStatus
}

export interface SoundEffectPlanItem {
  id: ID
  effectType: SoundEffectType
  timeRange: TimeRange
  purpose: string
  volumeHint: string
  linkedSignatureRouteId?: ID
}

export interface SoundEffectPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  transitionPlanId?: ID
  signatureRouteId?: ID
  sfxNeeded?: boolean
  sfxType?: SoundEffectType
  timingAnchor?: string
  volumeLevel?: 'none' | 'low' | 'medium' | 'high'
  avoidOverpoweringVoice?: boolean
  strategy: string
  effects: SoundEffectPlanItem[]
  avoidRules: string[]
}

export interface CaptionPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  captionNeeded?: boolean
  captionPolicy?: CaptionPolicy
  captionDensity?: CaptionDensity
  styleIntent?: CaptionStyleIntent
  styleSummary: string
  readabilityStandard: string
  lineBreakStrategy: string
  placementStrategy: string
  safeZoneRequired: boolean
  avoidFaceOverlap?: boolean
  avoidVisualOverlayOverlap?: boolean
  wordEmphasisEnabled?: boolean
  editableAfterPreview?: boolean
  animated: boolean
}

export interface EditQualityCheckRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  renderId?: ID
  checkType: EditQualityCheckType
  status: EditQualityCheckStatus
  score?: Percentage
  summary: string
  blocker: boolean
  requiresRetry?: boolean
  recommendedFix?: string
}

export const PROFESSIONAL_EDIT_RULE =
  'Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing. Edit level controls complexity and cost, not quality.'
