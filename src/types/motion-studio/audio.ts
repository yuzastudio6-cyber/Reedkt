import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'

export const MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION =
  'motion-studio.storytelling-audio-authority.v2' as const
export const MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION =
  'motion-studio.audio-capability-policy.v1' as const

export interface MotionStudioAudioAssetVersionRef {
  assetId: ID
  assetVersionId: ID
  contentDigest: string
  provenanceRecordId: ID
  rightsEvidenceIds: readonly ID[]
}

export interface MotionStudioAudioFrameRange {
  startTimingAnchorId: ID
  endTimingAnchorId: ID
  startFrame: number
  endFrame: number
}

export type MotionStudioSpokenTextChangeReason =
  | 'none'
  | 'pronunciation_normalization'
  | 'number_reading_normalization'
  | 'date_reading_normalization'
  | 'abbreviation_expansion'

export interface MotionStudioPronunciationEntryV1 {
  pronunciationId: ID
  writtenForm: string
  spokenForm: string
  language: string
  reason: 'proper_name' | 'place_name' | 'foreign_term' | 'number' | 'date' | 'abbreviation'
  evidenceId: ID
}

export interface MotionStudioVoicePerformancePlanV1 {
  pace: 'measured' | 'natural' | 'urgent'
  energy: 'restrained' | 'balanced' | 'intense'
  emotionalDirection: readonly string[]
  emphasisTerms: readonly string[]
  pauseBeforeFrames: number
  pauseAfterFrames: number
  performanceTagIds: readonly string[]
}

export interface MotionStudioVoiceSegmentPlanV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-segment-plan.v2'
  productionId: ID
  voiceSegmentId: ID
  preparedScriptArtifactVersion: MotionStudioVersionReference
  preparedScriptSegmentId: ID
  chapterId: ID
  sceneId: ID
  order: number
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  displayText: string
  spokenText: string
  spokenTextChangeReason: MotionStudioSpokenTextChangeReason
  spokenTextChangeExplanation?: string
  preparedMeaningDigest: string
  meaningPreserved: true
  language: string
  pronunciationEntries: readonly MotionStudioPronunciationEntryV1[]
  performance: MotionStudioVoicePerformancePlanV1
  immutable: true
}

export type MotionStudioVoiceTakeOrigin =
  | 'uploaded_narration'
  | 'generated_speech_protocol_fixture'

export interface MotionStudioVoiceConsentAuthorityV1 {
  status: 'not_required_user_upload' | 'verified_provider_voice_catalog'
  evidenceId: ID
  cloningAuthorized: false
  dubbingAuthorized: false
}

export interface MotionStudioVoiceDisclosureAuthorityV1 {
  aiGenerated: boolean
  disclosureRequired: boolean
  disclosureCode?: 'ai_generated_voice'
  disclosureReviewed: boolean
}

export interface MotionStudioVoiceTakeCandidateV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-take-candidate.v2'
  productionId: ID
  takeId: ID
  voiceSegmentId: ID
  origin: MotionStudioVoiceTakeOrigin
  audioAssetVersion: MotionStudioAudioAssetVersionRef
  voiceProfileReference: string
  capabilityPolicyEntryId: ID
  consent: MotionStudioVoiceConsentAuthorityV1
  disclosure: MotionStudioVoiceDisclosureAuthorityV1
  cloningEnabled: false
  dubbingEnabled: false
  providerExecutionPerformed: false
  mediaExecutionPerformed: false
  reviewStatus: 'candidate' | 'selected' | 'rejected'
  finalAssetEligible: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioVoiceTakeSelectionV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-take-selection.v1'
  productionId: ID
  voiceSegmentId: ID
  candidateTakeIds: readonly ID[]
  selectedTakeId: ID
  selectionMethod: 'explicit_fixture_review'
  firstTakeAutoAccepted: false
  selectedByActorId: ID
  selectedAt: ISODateString
  decisionReason: string
  immutable: true
}

export interface MotionStudioVoiceAlignmentTokenV1 {
  tokenId: ID
  text: string
  range: MotionStudioAudioFrameRange
}

export interface MotionStudioVoiceAlignmentV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-alignment.v1'
  productionId: ID
  alignmentId: ID
  voiceSegmentId: ID
  takeId: ID
  method: 'declared_fixture_alignment'
  timingAuthorityDigest: string
  tokens: readonly MotionStudioVoiceAlignmentTokenV1[]
  executionPerformed: false
  reviewed: true
  immutable: true
}

export type MotionStudioVoiceQaGate =
  | 'file_integrity'
  | 'alignment'
  | 'pronunciation'
  | 'voice_continuity'
  | 'clipping'
  | 'loudness'
  | 'timing'
  | 'disclosure'
  | 'rights'

export interface MotionStudioVoiceQaGateResultV1 {
  gate: MotionStudioVoiceQaGate
  result: 'passed' | 'failed' | 'not_run'
  blocking: true
  evidenceId?: ID
  note: string
}

export interface MotionStudioVoiceQualityReportV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-quality-report.v1'
  productionId: ID
  qualityReportId: ID
  voiceSegmentId: ID
  takeId: ID
  gateResults: readonly MotionStudioVoiceQaGateResultV1[]
  selectionEligible: boolean
  finalMixEligible: false
  reviewedAt: ISODateString
  immutable: true
}

export interface MotionStudioVoiceBibleV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.voice-bible.v2'
  productionId: ID
  voiceBibleId: ID
  voiceBibleArtifactVersion: MotionStudioVersionReference
  preparedScriptArtifactVersion: MotionStudioVersionReference
  language: string
  voiceSegmentIds: readonly ID[]
  selectedTakeIds: readonly ID[]
  performanceDirection: readonly string[]
  cloningEnabled: false
  dubbingEnabled: false
  providerExecutionAllowed: false
  immutable: true
}

export type MotionStudioAudioStemRole =
  | 'narration'
  | 'music'
  | 'foley'
  | 'ambience'
  | 'exact_sfx'

export type MotionStudioAudioStemOrigin =
  | 'uploaded_narration'
  | 'uploaded_music'
  | 'uploaded_stem'
  | 'licensed_sfx'
  | 'generated_speech_protocol_fixture'
  | 'generated_music_protocol_fixture'
  | 'synchronized_foley_protocol_fixture'

export interface MotionStudioAudioStemV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.audio-stem.v1'
  productionId: ID
  stemId: ID
  role: MotionStudioAudioStemRole
  origin: MotionStudioAudioStemOrigin
  audioAssetVersion: MotionStudioAudioAssetVersionRef
  capabilityPolicyEntryId: ID
  speechBearing: boolean
  rightsReviewed: true
  providerExecutionPerformed: false
  mediaExecutionPerformed: false
  finalAssetEligible: false
  immutable: true
}

export interface MotionStudioMusicBibleV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-bible.v2'
  productionId: ID
  musicBibleId: ID
  musicBibleArtifactVersion: MotionStudioVersionReference
  scoreMode: 'uploaded_music' | 'uploaded_stems' | 'hybrid'
  mood: readonly string[]
  instrumentation: readonly string[]
  vocalPolicy: 'instrumental_only'
  speechSafetyRules: readonly string[]
  rightsEvidenceIds: readonly ID[]
  stemIds: readonly ID[]
  providerExecutionAllowed: false
  immutable: true
}

export interface MotionStudioMusicCueV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-cue.v2'
  productionId: ID
  cueId: ID
  musicBibleArtifactVersion: MotionStudioVersionReference
  stemId: ID
  sceneIds: readonly ID[]
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  narrativePurpose: string
  emotionalDirection: string
  speechOverlapPolicy: 'duck_below_narration' | 'no_speech_overlap'
  immutable: true
}

export interface MotionStudioSoundEventV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.sound-event.v1'
  productionId: ID
  soundEventId: ID
  role: 'foley' | 'ambience' | 'exact_sfx'
  stemId: ID
  sceneId: ID
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  reasonKind: 'visible_action' | 'story_environment' | 'exact_named_sound'
  reason: string
  sourceEventId: ID
  speechOverlapPolicy: 'duck_below_narration' | 'avoid_speech_overlap'
  immutable: true
}

export type MotionStudioMixQaGate =
  | 'stem_integrity'
  | 'narration_intelligibility'
  | 'speech_priority'
  | 'integrated_loudness'
  | 'true_peak'
  | 'clipping'
  | 'cue_timing'
  | 'rights'

export interface MotionStudioMixPlanV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.mix-plan.v1'
  productionId: ID
  mixPlanId: ID
  mixPlanArtifactVersion: MotionStudioVersionReference
  timingAuthorityDigest: string
  stemIds: readonly ID[]
  narrationStemIds: readonly ID[]
  musicStemIds: readonly ID[]
  foleyStemIds: readonly ID[]
  ambienceStemIds: readonly ID[]
  exactSfxStemIds: readonly ID[]
  speechPriority: true
  narrationDucking: {
    enabled: true
    musicGainReductionDb: number
    effectsGainReductionDb: number
    attackFrames: number
    releaseFrames: number
  }
  targetIntegratedLufs: number
  targetTruePeakDbtp: number
  requiredQaGates: readonly MotionStudioMixQaGate[]
  finalMixExecutionAllowed: false
  timelineMutationAllowed: false
  renderAllowed: false
  immutable: true
}

export type MotionStudioAudioCapabilityKind =
  | 'speech_generation'
  | 'uploaded_narration'
  | 'music_generation'
  | 'uploaded_music'
  | 'synchronized_foley'
  | 'exact_sfx'
  | 'deterministic_mix'

export interface MotionStudioAudioCapabilityPolicyEntryV1 {
  entryId: ID
  capability: MotionStudioAudioCapabilityKind
  routeId:
    | 'eleven_v3'
    | 'eleven_multilingual_v2'
    | 'eleven_flash_v2_5'
    | 'verified_private_narration_upload'
    | 'verified_private_music_upload'
    | 'lyria_3_pro'
    | 'mmaudio'
    | 'licensed_or_uploaded_sfx'
    | 'reeditpro_deterministic_mix'
  use: 'final_candidate' | 'stability_fallback' | 'audition_or_temporary' | 'user_asset' | 'planned_only'
  runtimeEnabled: false
  externalTransportEnabled: false
  runtimeAccessAvailable: false
  productReady: false
  capabilityDiscoveryMethod: 'owner_policy_snapshot'
}

export interface MotionStudioAudioCapabilityPolicySnapshotV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION
  productionId: ID
  policySnapshotId: ID
  entries: readonly MotionStudioAudioCapabilityPolicyEntryV1[]
  capturedAt: ISODateString
  providerExecutionAllowed: false
  immutable: true
}

export interface MotionStudioAudioExecutionBoundaryV1 {
  localFixtureOnly: true
  providerCallMade: false
  mediaExecutionPerformed: false
  alignmentExecutionPerformed: false
  mixExecutionPerformed: false
  timelineMutationPerformed: false
  renderPerformed: false
  providerCostMicros: 0
  maximumAuthorizedProviderCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export interface MotionStudioAudioAuthorityBundleV2 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION
  productionId: ID
  approvedSnapshotId: ID
  approvedSnapshotDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  timingAuthority: MotionStudioTimingAuthority
  voiceBible: MotionStudioVoiceBibleV2
  voiceSegments: readonly MotionStudioVoiceSegmentPlanV2[]
  takeCandidates: readonly MotionStudioVoiceTakeCandidateV2[]
  takeSelections: readonly MotionStudioVoiceTakeSelectionV1[]
  alignments: readonly MotionStudioVoiceAlignmentV1[]
  voiceQualityReports: readonly MotionStudioVoiceQualityReportV1[]
  musicBible: MotionStudioMusicBibleV2
  stems: readonly MotionStudioAudioStemV1[]
  musicCues: readonly MotionStudioMusicCueV2[]
  soundEvents: readonly MotionStudioSoundEventV1[]
  mixPlan: MotionStudioMixPlanV1
  capabilityPolicy: MotionStudioAudioCapabilityPolicySnapshotV1
  executionBoundary: MotionStudioAudioExecutionBoundaryV1
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioAudioWorkspaceDto extends MotionStudioOwnership {
  productionId: ID
  audioAuthority: MotionStudioAudioAuthorityBundleV2
  state: 'review_only'
  warning: string
}
