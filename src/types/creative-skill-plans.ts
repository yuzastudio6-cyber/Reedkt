import type {
  ApprovalStatus,
  CreditImpact,
  ID,
  ISODateString,
  JSONObject,
  ProcessingStatus,
  TargetPlatform,
  TimeRange,
} from './shared'
import type {
  CreativeSkillFamily,
  CreativeSkillKey,
  CreativeSkillPlanningContractType,
  CreativeSkillRuntimeReadiness,
  CreativeSkillSourceSafetyStatus,
} from './creative-skills-core'

export type SkillPlanStatus =
  | 'not_started'
  | 'planning'
  | 'planned'
  | 'needs_user_input'
  | 'needs_storytiming'
  | 'needs_credit_approval'
  | 'approved_for_future_execution'
  | 'rejected'
  | 'blocked'
  | 'superseded'
  | 'revision_requested'

export type SkillRestraintDecision =
  | 'use_skill'
  | 'use_lower_cost_alternative'
  | 'use_no_skill'
  | 'reduce_intensity'
  | 'ask_user'
  | 'defer'
  | 'block'

export interface SkillTimingPlanEnvelope {
  timingIntent: string
  timeRange?: TimeRange
  speechAnchor?: string
  beatAnchor?: string
  entryBehavior?: string
  holdBehavior?: string
  exitBehavior?: string
  storyTimingWindowIds: ID[]
  metadata?: JSONObject
}

export interface SkillCompositionPlanEnvelope {
  compositionIntent: string
  screenZone?: string
  safeAreaNotes?: string
  collisionRisks: string[]
  layerOrderNotes?: string
  aspectRatioNotes?: string
  metadata?: JSONObject
}

export interface SkillAudioRelationshipEnvelope {
  audioIntent: string
  speechPriority: 'primary' | 'balanced' | 'not_applicable'
  musicRelationship?: string
  sfxRelationship?: string
  duckingRequired: boolean
  silenceAllowed: boolean
  metadata?: JSONObject
}

export interface SkillToolStrategyEnvelope {
  toolCandidateIds: ID[]
  providerCandidateIds: ID[]
  workerCandidateIds: ID[]
  runtimeReadiness: CreativeSkillRuntimeReadiness
  noExecutionBeforeApproval: true
  notes: string
  metadata?: JSONObject
}

export interface SkillCreditApprovalEnvelope {
  creditImpact: CreditImpact
  approvalStatus: ApprovalStatus
  approvalRequiredBeforeGeneration: boolean
  premiumItem: boolean
  lowerCostAlternativeSkillKeys: CreativeSkillKey[]
  estimateItemIds: ID[]
  approvalGroupIds: ID[]
  metadata?: JSONObject
}

export interface SkillRevisionEnvelope {
  revisionStatus: 'not_revised' | 'revision_requested' | 'revision_planned' | 'superseded'
  affectedRecordIds: ID[]
  affectedStoryTimingWindowIds: ID[]
  reapprovalRequired: boolean
  reestimateRequired: boolean
  revisionReason?: string
  metadata?: JSONObject
}

export interface UniversalSkillPlanRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  routeId?: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  planningContractType: CreativeSkillPlanningContractType
  skillPlanStatus: SkillPlanStatus
  planReadinessStatus: ProcessingStatus
  planningReason: string
  creativeIntent: string
  viewerBenefit: string
  targetPlatform?: TargetPlatform
  inputContextSummary: string
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  restraintDecision: SkillRestraintDecision
  timingPlan?: SkillTimingPlanEnvelope
  compositionPlan?: SkillCompositionPlanEnvelope
  audioRelationship?: SkillAudioRelationshipEnvelope
  toolStrategy?: SkillToolStrategyEnvelope
  creditApproval?: SkillCreditApprovalEnvelope
  revision?: SkillRevisionEnvelope
  qaRequirementIds: ID[]
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface RejectedSkillCandidateRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  rejectionReason: string
  rejectedFor: 'restraint' | 'preference' | 'credit' | 'storytiming' | 'source_safety' | 'quality' | 'duplicate' | 'runtime_boundary'
  lowerCostOrSaferAlternativeSkillKey?: CreativeSkillKey
  userVisibleSummary?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface TransitionTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  transitionAnchor: string
  durationSeconds?: number
  entryFrameBehavior: string
  exitFrameBehavior: string
  storyTimingWindowId?: ID
  metadata?: JSONObject
}

export interface TransitionCompositionPlanRecord {
  id: ID
  skillPlanId: ID
  transitionFamily: string
  visualContinuityIntent: string
  edgeBehavior: string
  screenCoverage: 'none' | 'partial' | 'full_frame'
  collisionRisks: string[]
  metadata?: JSONObject
}

export interface TransitionAudioPlanRecord {
  id: ID
  skillPlanId: ID
  audioBridgeIntent: string
  sfxPermission: 'not_allowed' | 'subtle_allowed' | 'allowed_with_approval'
  musicBridgeIntent?: string
  speechProtectionRequired: boolean
  metadata?: JSONObject
}

export interface TransitionSkillPlanRecord extends UniversalSkillPlanRecord {
  transitionTimingPlanId?: ID
  transitionCompositionPlanId?: ID
  transitionAudioPlanId?: ID
  transitionIntensity: 'none' | 'subtle' | 'moderate' | 'high' | 'hero'
  transitionScore?: number
}

export interface OverlayTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  entryTiming: string
  holdTiming: string
  exitTiming: string
  persistentDuringSpeech: boolean
  metadata?: JSONObject
}

export interface OverlayCompositionPlanRecord {
  id: ID
  skillPlanId: ID
  overlayRole: string
  screenZone: string
  safeAreaNotes: string
  collisionAvoidance: string
  blendOpacityIntent: string
  layerOrder: number
  metadata?: JSONObject
}

export interface OverlayCompositingSkillPlanRecord extends UniversalSkillPlanRecord {
  overlayTimingPlanIds: ID[]
  overlayCompositionPlanIds: ID[]
  overlayDensity: 'none' | 'low' | 'medium' | 'high'
  trackingMaskingOcclusionPlan?: string
}

export interface GraphicDesignTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  revealTiming: string
  readTimeSeconds?: number
  exitTiming: string
  metadata?: JSONObject
}

export interface GraphicDesignStructurePlanRecord {
  id: ID
  skillPlanId: ID
  graphicRole: string
  informationHierarchy: string[]
  layoutFamily: string
  typographyIntent: string
  proofSafetyNotes?: string
  metadata?: JSONObject
}

export interface GraphicDesignSkillPlanRecord extends UniversalSkillPlanRecord {
  graphicTimingPlanIds: ID[]
  graphicStructurePlanIds: ID[]
  visualDensity: 'minimal' | 'balanced' | 'rich' | 'hero'
  sourceProofSafetyRequired: boolean
}

export interface MotionTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  timingAnchor: string
  entryHoldExit: string
  repetitionNotes?: string
  metadata?: JSONObject
}

export interface MotionBehaviorPlanRecord {
  id: ID
  skillPlanId: ID
  motionSubject: string
  motionLanguage: string
  energyLevel: 'none' | 'subtle' | 'balanced' | 'energetic' | 'hero'
  easingIntent: string
  comfortNotes: string
  metadata?: JSONObject
}

export interface MotionCompositionPlanRecord {
  id: ID
  skillPlanId: ID
  screenZone: string
  safeZoneRelationship: string
  readabilityProtection: string
  speechSafetyNotes?: string
  metadata?: JSONObject
}

export interface MotionDesignSkillPlanRecord extends UniversalSkillPlanRecord {
  motionTimingPlanIds: ID[]
  motionBehaviorPlanIds: ID[]
  motionCompositionPlanIds: ID[]
  motionStopsWhen: string
}

export interface ThreeDVisualTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  heroHoldRequired: boolean
  entryExitTiming: string
  storyTimingWindowId?: ID
  metadata?: JSONObject
}

export interface ThreeDSpatialCompositionPlanRecord {
  id: ID
  skillPlanId: ID
  roleFamily: string
  cameraIntent: string
  scaleDepthIntent: string
  lightingShadowContactReflection: string
  screenInteractionMode: string
  trackingMaskingOcclusionSafety: string
  metadata?: JSONObject
}

export interface ThreeDMotionBehaviorPlanRecord {
  id: ID
  skillPlanId: ID
  motionPurpose: string
  cameraMotionIntent?: string
  objectMotionIntent?: string
  repetitionControl: string
  accessibilityComfortNotes: string
  metadata?: JSONObject
}

export interface ThreeDVisualSkillPlanRecord extends UniversalSkillPlanRecord {
  threeDTimingPlanIds: ID[]
  threeDSpatialCompositionPlanIds: ID[]
  threeDMotionBehaviorPlanIds: ID[]
  sourceModelProvenance: string
  lowerCostAlternativeSkillKey?: CreativeSkillKey
}

export interface BRollTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  durationIntent: string
  speechRelationship: string
  storyTimingWindowId?: ID
  metadata?: JSONObject
}

export interface BRollSourceSelectionPlanRecord {
  id: ID
  skillPlanId: ID
  sourceType: 'existing_source' | 'uploaded_reference' | 'stock_future' | 'generated_future' | 'browser_app_future' | 'unknown'
  sourceStatus: CreativeSkillSourceSafetyStatus
  proofContextLevel: 'none' | 'context' | 'proof' | 'evidence_sensitive'
  rightsProvenanceNotes: string
  metadata?: JSONObject
}

export interface BRollCompositionPlanRecord {
  id: ID
  skillPlanId: ID
  displayMode: 'full_frame' | 'inset' | 'picture_in_picture' | 'split_screen' | 'background'
  captionRelationship: string
  faceProductActionSafety: string
  redactionNotes?: string
  metadata?: JSONObject
}

export interface BRollAudioRelationshipPlanRecord {
  id: ID
  skillPlanId: ID
  keepSourceAudio: boolean
  speechPriority: 'primary' | 'balanced' | 'not_applicable'
  musicOrSfxRelationship?: string
  metadata?: JSONObject
}

export interface BRollSkillPlanRecord extends UniversalSkillPlanRecord {
  bRollTimingPlanIds: ID[]
  bRollSourceSelectionPlanIds: ID[]
  bRollCompositionPlanIds: ID[]
  bRollAudioRelationshipPlanIds: ID[]
  provesClarifiesCoversOrSupports: string
}

export interface CaptionTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  speechAnchor: string
  minimumReadTimeSeconds?: number
  maximumOnScreenSeconds?: number
  storyTimingWindowId?: ID
  metadata?: JSONObject
}

export interface CaptionTextPlanRecord {
  id: ID
  skillPlanId: ID
  textSourceType: 'transcript' | 'user_provided' | 'manual_future' | 'translation_future' | 'unknown'
  accuracyStatus: 'confirmed' | 'needs_review' | 'unconfirmed' | 'future_pending'
  meaningPreservationNotes: string
  lineBreakPolicy: string
  claimSafetyNotes?: string
  metadata?: JSONObject
}

export interface CaptionPlacementPlanRecord {
  id: ID
  skillPlanId: ID
  placementZone: string
  safeAreaNotes: string
  faceObjectCollisionChecks: string[]
  animationEmphasisIntent?: string
  accessibilityNotes: string
  metadata?: JSONObject
}

export interface CaptionSkillPlanRecord extends UniversalSkillPlanRecord {
  captionTimingPlanIds: ID[]
  captionTextPlanIds: ID[]
  captionPlacementPlanIds: ID[]
  readabilityPriority: 'meaning_first' | 'readability_first' | 'style_support'
}

export interface MusicCuePlanRecord {
  id: ID
  skillPlanId: ID
  cueRole: string
  sourceRightsProvenance: string
  moodEnergyIntent: string
  lyricsPolicy: 'instrumental_preferred' | 'lyrics_allowed_with_review' | 'no_lyrics' | 'unknown'
  timeRange?: TimeRange
  metadata?: JSONObject
}

export interface SoundTimingPlanRecord {
  id: ID
  skillPlanId: ID
  timeRange: TimeRange
  cuePointSummary: string
  beatMapRelationship?: string
  visualActionRelationship?: string
  metadata?: JSONObject
}

export interface DuckingSpeechSafetyPlanRecord {
  id: ID
  skillPlanId: ID
  speechProtectionRequired: boolean
  duckingIntensity: 'none' | 'subtle' | 'moderate' | 'strong'
  protectedSpeechRanges: TimeRange[]
  notes: string
  metadata?: JSONObject
}

export interface SFXPlanRecord {
  id: ID
  skillPlanId: ID
  sfxRole: string
  sourceStatus: CreativeSkillSourceSafetyStatus
  automaticSfxAllowed: boolean
  timingPlanId?: ID
  mixSafetyNotes: string
  metadata?: JSONObject
}

export interface AmbienceRoomTonePlanRecord {
  id: ID
  skillPlanId: ID
  ambienceRole: string
  roomTonePolicy: 'preserve' | 'reduce' | 'replace_future' | 'unknown'
  comfortTrustNotes: string
  metadata?: JSONObject
}

export interface SoundMusicSkillPlanRecord extends UniversalSkillPlanRecord {
  musicCuePlanIds: ID[]
  soundTimingPlanIds: ID[]
  duckingSpeechSafetyPlanIds: ID[]
  sfxPlanIds: ID[]
  ambienceRoomTonePlanIds: ID[]
  soundSupports: 'speech' | 'emotion' | 'rhythm' | 'transition' | 'visual_action' | 'ambience' | 'silence'
}

export type StoryTimingPrimaryFocus =
  | 'speech'
  | 'caption'
  | 'source_action'
  | 'b_roll'
  | 'overlay'
  | 'graphic'
  | 'motion'
  | 'three_d'
  | 'music'
  | 'sfx'
  | 'silence'

export type StoryTimingSecondarySupportRole =
  | 'none'
  | 'caption_support'
  | 'visual_support'
  | 'audio_support'
  | 'proof_support'
  | 'rhythm_support'

export type StoryTimingVisualDensityLevel = 'none' | 'low' | 'medium' | 'high' | 'hero'

export type StoryTimingAudioDensityLevel = 'none' | 'low' | 'medium' | 'high'

export type StoryTimingConflictType =
  | 'caption_collision'
  | 'speech_masking'
  | 'safe_zone_collision'
  | 'too_many_layers'
  | 'transition_permission_missing'
  | 'sfx_permission_missing'
  | 'music_ducking_missing'
  | 'source_proof_conflict'
  | 'credit_approval_conflict'
  | 'runtime_boundary_conflict'

export type StoryTimingResolutionAction =
  | 'move_timing'
  | 'reduce_density'
  | 'remove_support_layer'
  | 'switch_to_lower_cost'
  | 'ask_user'
  | 'block_until_resolved'
  | 'approve_as_deliberate_multi_layer_moment'

export type StoryTimingPermissionGate =
  | 'transition_permission'
  | 'sfx_permission'
  | 'music_permission'
  | 'caption_permission'
  | 'premium_visual_permission'
  | 'source_sensitive_permission'

export interface StoryTimingWindowRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  timeRange: TimeRange
  primaryFocus: StoryTimingPrimaryFocus
  secondarySupportRoles: StoryTimingSecondarySupportRole[]
  visualDensityLevel: StoryTimingVisualDensityLevel
  audioDensityLevel: StoryTimingAudioDensityLevel
  linkedSkillPlanIds: ID[]
  metadata?: JSONObject
}

export interface FocusDensityBudget {
  primaryFocus: StoryTimingPrimaryFocus
  allowedSecondarySupportCount: number
  visualDensityLevel: StoryTimingVisualDensityLevel
  audioDensityLevel: StoryTimingAudioDensityLevel
  densityReason: string
  metadata?: JSONObject
}

export interface StoryTimingCoordinationPlanRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  status: SkillPlanStatus
  windowIds: ID[]
  focusDensityBudget: FocusDensityBudget
  permissionGates: StoryTimingPermissionGate[]
  conflictResolutionPlanIds: ID[]
  coordinationScore?: number
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface StoryTimingConflictResolutionPlanRecord {
  id: ID
  coordinationPlanId: ID
  conflictType: StoryTimingConflictType
  affectedWindowIds: ID[]
  affectedSkillPlanIds: ID[]
  resolutionAction: StoryTimingResolutionAction
  userVisibleMessage?: string
  resolved: boolean
  metadata?: JSONObject
}

export interface StoryTimingDensityBudgetPlanRecord {
  id: ID
  coordinationPlanId: ID
  windowId: ID
  visualDensityLevel: StoryTimingVisualDensityLevel
  audioDensityLevel: StoryTimingAudioDensityLevel
  maximumSimultaneousSkillPlans: number
  reason: string
  metadata?: JSONObject
}
