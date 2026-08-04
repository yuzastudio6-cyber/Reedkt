import type {
  BoundingBox,
  ID,
  PlatformAspectRatio,
  ProjectScopedRecord,
  TimeRange,
} from './workflow-common'
import type { CaptionPlan, CaptionStyleId } from './reeditpro'
import type {
  PictureLockManifest,
  PictureLockVersionRef,
} from './picture-lock'

export type CaptionDirectionSchemaVersion = 'caption-direction-contract-v1'

export type CaptionLifecycleStatus =
  | 'strategy_draft'
  | 'strategy_reviewable'
  | 'strategy_approved'
  | 'opportunities_mapped'
  | 'space_reserved'
  | 'blocking_ready'
  | 'awaiting_picture_lock'
  | 'finish_readiness_blocked'
  | 'finish_ready'
  | 'choreography_resolving'
  | 'choreography_resolved'
  | 'storytiming_locked'
  | 'sound_handoff_ready'
  | 'render_ready'
  | 'rendered'
  | 'qa_warning'
  | 'qa_failed'
  | 'qa_passed'
  | 'delivery_ready'
  | 'stale'
  | 'revision_required'
  | 'superseded'

export type CaptionPlanningPass =
  | 'strategy_and_reservation'
  | 'late_bound_finish'

export type CaptionDirectionAuthority =
  | 'caption_direction'
  | 'compiled_editing_intent'
  | 'canonical_transcript'
  | 'storytiming'
  | 'aspect_ratio_frame_plan'
  | 'picture_lock_manifest'
  | 'visual_occupancy'
  | 'visual_layout'
  | 'mask_tracking'
  | 'living_frame'
  | 'visual_system'
  | 'soundsync'
  | 'edit_plan_approval'
  | 'credit_system'
  | 'asset_manifest'
  | 'font_registry'
  | 'render_export'

export interface CaptionDirectionAuthorityDeclaration {
  owns: CaptionDirectionAuthority[]
  consumes: CaptionDirectionAuthority[]
  explicitlyDoesNotOwn: CaptionDirectionAuthority[]
}

export interface CaptionDirectionVersionRef {
  id: ID
  version: number
  schemaVersion: CaptionDirectionSchemaVersion
  contentHash?: string
}

export interface CaptionDirectionRecordBase extends ProjectScopedRecord {
  schemaVersion: CaptionDirectionSchemaVersion
  version: number
  editPlanId: ID
  editPlanVersionId?: ID
  approvedPlanSnapshotId?: ID
  lifecycleStatus: CaptionLifecycleStatus
  supersedesId?: ID
  authority: CaptionDirectionAuthorityDeclaration
  mockOnly: true
}

export type CaptionProjectMode =
  | 'accessibility_first'
  | 'clean_long_form'
  | 'dynamic_short_form'
  | 'cinematic_editorial'
  | 'educational_explainer'
  | 'multi_speaker_dialogue'
  | 'brand_directed'
  | 'minimal_support'

export type CaptionSceneMode =
  | 'clean_subtitles'
  | 'creator_phrase_captions'
  | 'spatial_sentence'
  | 'hero_typography'
  | 'behind_subject_typography'
  | 'persistent_list'
  | 'full_screen_title'
  | 'caption_to_visual'
  | 'minimal_captions'
  | 'no_captions'

export type CaptionRole =
  | 'accessibility'
  | 'speech_reinforcement'
  | 'semantic_emphasis'
  | 'speaker_attribution'
  | 'visual_storytelling'
  | 'structural_typography'
  | 'restraint'

export type CaptionProjectionKind =
  | 'creative_open_caption'
  | 'stable_open_caption'
  | 'accessible_full_text'
  | 'srt'
  | 'webvtt'
  | 'ass'
  | 'translated'
  | 'reduced_motion'

export interface CaptionProjectionRequirement {
  id: ID
  kind: CaptionProjectionKind
  language: string
  required: boolean
  completeCanonicalWordingRequired: boolean
  outputIds: ID[]
}

export type CaptionDirectionDensity = 'none' | 'low' | 'balanced' | 'high'
export type CaptionMotionIntensity = 'none' | 'restrained' | 'moderate' | 'expressive'
export type CaptionCreditImpact = 'none' | 'low' | 'medium' | 'high' | 'premium'

export interface CaptionStrategyPlan extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  planningStage?: CaptionStrategyPlanningStage
  compiledIntentRef?: CaptionImmutablePlanningEvidenceRef
  canonicalTranscriptRef?: CaptionImmutablePlanningEvidenceRef
  videoUnderstandingRef?: CaptionImmutablePlanningEvidenceRef
  referenceDnaRefs?: CaptionImmutablePlanningEvidenceRef[]
  sourceOrderConfirmationRef?: CaptionImmutablePlanningEvidenceRef
  outputFrameRef?: CaptionConfirmedOutputFrameRef
  restraint: 'none' | 'no_captions'
  captionRole: CaptionRole
  projectMode: CaptionProjectMode
  defaultSceneMode: CaptionSceneMode
  projectCaptionLanguage: string
  projectionRequirements: CaptionProjectionRequirement[]
  approximateDensity: CaptionDirectionDensity
  likelyHeroPhraseCount: number
  likelyStructuralTypography: boolean
  likelyCaptionToVisualHandoffs: boolean
  approximateOccupancy: 'overlay_only' | 'reserved_regions' | 'structural'
  preferredRegions: string[]
  potentialDepthUse: boolean
  maskTrackingRequirements: string[]
  motionIntensity: CaptionMotionIntensity
  captionSoundPermitted: boolean
  accessibilityRequirements: string[]
  estimatedCreditImpact: CaptionCreditImpact
  approvalEnvelopeRef: CaptionDirectionVersionRef
  userFacingSummary: string
  limitations: string[]
}

export type CaptionIntegrationClass =
  | 'late_overlay'
  | 'reserved_composition'
  | 'structural_typography'
  | 'cross_system_transform'

export type CaptionTrackKind =
  | 'verbatim'
  | 'semantic'
  | 'hero'
  | 'persistent_list'
  | 'speaker_label'
  | 'accessible'

export interface CaptionOpportunity {
  id: ID
  sceneId?: ID
  outputId?: ID
  sourceRange?: TimeRange
  outputRangeCandidate?: TimeRange
  linkedSourceClipIds: ID[]
  linkedTranscriptSegmentIds: ID[]
  linkedTranscriptWordIds?: ID[]
  spokenConcept: string
  captionRole: CaptionRole
  proposedIntegrationClass: CaptionIntegrationClass
  possibleTracks: CaptionTrackKind[]
  visualImportance: 'low' | 'medium' | 'high'
  structuralImpact: 'none' | 'space' | 'duration' | 'shot_structure'
  likelyScreenSpaceNeed: 'small' | 'medium' | 'large' | 'full_frame'
  likelyMaskRequirement: 'none' | 'optional' | 'required'
  possibleSoundRequirement: 'none' | 'optional' | 'requested'
  selectedConcept?: string
  rejectedConcepts: string[]
  reason: string
  lowerCostAlternative?: string
  selected: boolean
  userDirective?: CaptionStrategyUserDirective
  crossSystemTarget?: CaptionCrossSystemTarget
  sensitiveReviewState?: 'not_required' | 'resolved' | 'unresolved'
  sensitiveReviewEvidenceIds?: ID[]
}

export interface CaptionOpportunityMap extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  strategyPlanRef: CaptionDirectionVersionRef
  opportunities: CaptionOpportunity[]
  selectedOpportunityIds: ID[]
  rejectedOpportunityIds: ID[]
  sourceEvidenceIds: ID[]
  referenceDnaIds: ID[]
  limitations: string[]
}

export type CaptionCrossSystemTarget =
  | 'living_frame'
  | 'map'
  | 'chart'
  | 'diagram'
  | 'b_roll'
  | 'stroke_motion'
  | 'transition'
  | 'camera'

export type CaptionCrossSystemReceiverSkillId =
  | 'motion.living_frame_storytelling'
  | 'graphics.map_route_visual'
  | 'graphics.chart_or_data_visual'
  | 'dataviz.diagram_layout'
  | 'motion.stroke_motion_storytelling'
  | 'motion.transition_language'

export interface CaptionIntegrationClassification {
  id: ID
  captionDirectionPlanId: ID
  opportunityId: ID
  primaryClass: CaptionIntegrationClass
  secondaryHandoffs: CaptionCrossSystemTarget[]
  affectsEditStructure: boolean
  requiresReservation: boolean
  requiresMaskOrTracking: boolean
  requiresStoryTimingHandoff: boolean
  receivingSystemOwnsExecution: boolean
  reason: string
  fallbackClass: CaptionIntegrationClass
  qaChecks: string[]
  crossSystemIntent?: CaptionCrossSystemIntent
}

export interface CaptionCrossSystemIntent {
  target: CaptionCrossSystemTarget
  receiverSkillId?: CaptionCrossSystemReceiverSkillId
  contractPhase: 'preapproval_intent_only'
  informationOwnerBeforeHandoff: 'caption_direction'
  receivingSystemOwnsExecution: true
  semanticContinuityToken: string
  accessibleCaptionRestoredOnFailure: true
  noDuplicateInformationAfterHandoff: true
}

export type CaptionReservationKind =
  | 'speaker_side_region'
  | 'behind_subject_plane'
  | 'hero_typography_zone'
  | 'lower_transcript_region'
  | 'above_broll_panel'
  | 'caption_to_visual_handoff_region'
  | 'additional_shot_duration'
  | 'transition_beat'

export type CaptionReservationDisposition =
  | 'proposed'
  | 'approved'
  | 'honored'
  | 'adjusted_inside_envelope'
  | 'rejected'
  | 'stale'

export interface CaptionReservation {
  id: ID
  opportunityId: ID
  integrationClassificationId: ID
  kind: CaptionReservationKind
  outputId?: ID
  sceneId?: ID
  normalizedRegion?: BoundingBox
  fallbackRegionIds?: ID[]
  protectedRegionIds?: ID[]
  additionalDurationMs?: number
  priority: 'required' | 'preferred' | 'optional'
  disposition: CaptionReservationDisposition
  reason: string
  fallback: string
}

export type CaptionBlockingDepthHint =
  | 'stable_top'
  | 'foreground'
  | 'subject_interleaved'
  | 'behind_subject'
  | 'environmental_surface'

export interface CaptionBlockingItem {
  id: ID
  opportunityId: ID
  sceneId: ID
  outputId?: ID
  sourceTranscriptSegmentIds: ID[]
  sourceTranscriptWordIds: ID[]
  approximatePhraseText: string
  normalizedRegion?: BoundingBox
  approximateDepthPlane: CaptionBlockingDepthHint
  approximateHeroScale?: number
  handoffTarget?: CaptionCrossSystemTarget
  timingIntent: 'phrase_boundary_only'
  noSound: true
  finalFramesAssigned: false
}

export interface CaptionBlockingMetadataPlan extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  strategyPlanRef: CaptionDirectionVersionRef
  opportunityMapRef: CaptionDirectionVersionRef
  reservationPlanRef: CaptionDirectionVersionRef
  outputFrameRef?: CaptionConfirmedOutputFrameRef
  label: 'blocking_preview_only'
  readiness: 'blocked' | 'ready'
  items: CaptionBlockingItem[]
  blockerCodes: CaptionStrategyBlockerCode[]
  finalTypographyResolved: false
  finalTimingResolved: false
  finalDepthResolved: false
  soundEnabled: false
  generationPermitted: false
  exportPermitted: false
  limitations: string[]
}

export interface CaptionReservationPlan extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  opportunityMapRef: CaptionDirectionVersionRef
  reservations: CaptionReservation[]
  structuralReservationCount: number
  unresolvedRequiredReservationIds: ID[]
  blockingPreviewArtifactIds: ID[]
  blockingPreviewOnly: true
  limitations: string[]
}

export type CaptionTypographyRole =
  | 'primary_speech'
  | 'hero_display'
  | 'editorial_serif'
  | 'quotation'
  | 'handwritten_emotional_accent'
  | 'cultural_archival_accent'
  | 'technical'
  | 'speaker_label'

export type CaptionColorRole =
  | 'base_speech'
  | 'active_speech'
  | 'semantic_emphasis'
  | 'warning_conflict'
  | 'positive_result'
  | 'speaker_identity'
  | 'hero_phrase'
  | 'historical_context'
  | 'caption_to_visual_connection'

export type CaptionTextTransformation =
  | 'verbatim'
  | 'punctuation_cleanup'
  | 'disfluency_cleanup'
  | 'condensation'
  | 'semantic_rephrase'
  | 'translation'

export type CaptionFallbackPermission =
  | 'stable_top_layer'
  | 'remove_intentional_occlusion'
  | 'simplify_motion'
  | 'approved_font_fallback'
  | 'disable_caption_sound'
  | 'revert_cross_system_transform'
  | 'libass_stable_projection'
  | 'require_user_revision'

export interface CaptionApprovalEnvelope extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  approvalOwner: 'existing_edit_plan_approval'
  approvalRecordId?: ID
  permittedIntegrationClasses: CaptionIntegrationClass[]
  permittedSceneModes: CaptionSceneMode[]
  projectCaptionLanguage: string
  permittedTypographyRoles: CaptionTypographyRole[]
  permittedColorRoles: CaptionColorRole[]
  maximumMotionIntensity: CaptionMotionIntensity
  maximumHeroTypographyMoments: number
  behindSubjectTypographyPermitted: boolean
  frontOfSubjectTypographyPermitted: boolean
  objectAnchoringPermitted: boolean
  captionToVisualBridgePermitted: boolean
  captionSoundDesignPermitted: boolean
  allowedTextTransformations: CaptionTextTransformation[]
  accessibleOutputs: CaptionProjectionKind[]
  translationScope: string[]
  maximumCaptionCreditAllowance: number
  creditEstimateRef?: CaptionImmutablePlanningEvidenceRef
  estimatedCaptionCredits?: number
  fallbackPermissions: CaptionFallbackPermission[]
  changesRequiringReapproval: string[]
}

export interface CaptionTypographyRoleProfile {
  role: CaptionTypographyRole
  purpose: string
  activationRules: string[]
  maximumFrequency: number
  fontAssetId?: ID
  supportedScripts: string[]
  compatibleWeights: number[]
  permittedMotion: string[]
  permittedColors: CaptionColorRole[]
  accessibilityFallbackRole: CaptionTypographyRole
}

export interface CaptionOpticalSizingProfile {
  normalizedBaseSize: number
  minimumSize: number
  maximumSize: number
  maximumWidthRatio: number
  maximumLineCount: number
  phraseSizeStabilityRatio: number
  phoneViewingScale: number
  desktopViewingScale: number
  televisionViewingScale: number
  heroScaleRange: [number, number]
  semanticScaleRange: [number, number]
}

export interface CaptionLegibilityProfile {
  textColor: string
  strokeColor: string
  strokeWidth: number
  shadowColor: string
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  backplateColor: string
  backplateOpacity: number
  horizontalPadding: number
  verticalPadding: number
  cornerRadius: number
  localScrimColor: string
  localScrimOpacity: number
  approvedLocalBackgroundBlur: number
  minimumSufficientTreatment: true
}

export interface CaptionMotionLanguageProfile {
  allowedEntrances: string[]
  allowedInternalMotions: string[]
  allowedExits: string[]
  durationRangeMs: [number, number]
  allowedEasings: string[]
  maximumOvershoot: number
  maximumTravelRatio: number
  maximumStaggerMs: number
  maximumMotionDensity: CaptionMotionIntensity
  repetitionLimit: number
  reducedMotionReplacements: Record<string, string>
}

export type CaptionDepthPlane =
  | 'stable_top'
  | 'foreground'
  | 'subject_interleaved'
  | 'behind_subject'
  | 'environmental_surface'

export interface CaptionPlacementLanguageProfile {
  preferredScreenZones: string[]
  permittedFallbackZones: string[]
  zoneStabilityRequired: boolean
  protectFaces: boolean
  protectMouths: boolean
  protectGestures: boolean
  protectProducts: boolean
  protectTextLabels: boolean
  protectPlatformInterface: boolean
  permittedDepthPlanes: CaptionDepthPlane[]
}

export interface CaptionSceneModeOverride {
  sceneId: ID
  mode: CaptionSceneMode
  reason: string
  insideApprovalEnvelope: boolean
}

export interface CaptionStyleProfile extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  profileName: string
  projectMode: CaptionProjectMode
  sourceLegacyStyle?: CaptionStyleId
  sceneModeOverrides: CaptionSceneModeOverride[]
  typographyRoles: CaptionTypographyRoleProfile[]
  opticalSizing: CaptionOpticalSizingProfile
  colorRoles: Record<CaptionColorRole, string>
  legibility: CaptionLegibilityProfile
  motionLanguage: CaptionMotionLanguageProfile
  placementLanguage: CaptionPlacementLanguageProfile
  colorManagementPlanId?: ID
  fontManifestId?: ID
  rendererCompatibilityIds: ID[]
  outputProfileIds: ID[]
  mutablePresetChangesDoNotAffectSnapshot: true
}

export type CaptionDependencyKind =
  | 'timeline'
  | 'transcript'
  | 'alignment'
  | 'diarization'
  | 'timestamp'
  | 'storytiming'
  | 'output_frame'
  | 'picture_lock'
  | 'visual_layout'
  | 'b_roll'
  | 'living_frame'
  | 'map_chart_graphic'
  | 'lower_third'
  | 'transition'
  | 'mask_tracking'
  | 'anchor'
  | 'visual_occupancy'
  | 'color_proxy'
  | 'visual_finish_proxy'
  | 'platform_profile'
  | 'caption_style_profile'
  | 'sound_plan'
  | 'font_manifest'
  | 'renderer_runtime'
  | 'approval_envelope'
  | 'approved_snapshot'
  | 'asset_manifest'
  | 'qa_policy'

export type CaptionDependencyStatus =
  | 'current'
  | 'missing'
  | 'stale'
  | 'exempted'

export interface CaptionDependency {
  id: ID
  kind: CaptionDependencyKind
  owner: CaptionDirectionAuthority
  artifactId?: ID
  version?: number
  contentHash?: string
  required: boolean
  affectedScopeIds: ID[]
  status: CaptionDependencyStatus
  observedAt: string
  reason?: string
}

export interface CaptionDependencyManifest extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  sceneId?: ID
  outputId?: ID
  dependencies: CaptionDependency[]
  status: 'current' | 'blocked' | 'stale'
  staleScopeIds: ID[]
  blockingDependencyIds: ID[]
  checkedAt: string
}

export interface CaptionDirectionSnapshotReferences {
  editPlanId: ID
  editPlanVersionId?: ID
  approvedPlanSnapshotId?: ID
  strategyPlanRef?: CaptionDirectionVersionRef
  opportunityMapRef?: CaptionDirectionVersionRef
  integrationClassificationIds: ID[]
  reservationPlanRef?: CaptionDirectionVersionRef
  blockingMetadataRef?: CaptionDirectionVersionRef
  approvalEnvelopeRef?: CaptionDirectionVersionRef
  styleProfileRef?: CaptionDirectionVersionRef
  finishReadinessRef?: CaptionDirectionVersionRef
  finishReadinessRefs?: CaptionFinishReadinessOutputRef[]
  lateResolutionRef?: CaptionDirectionVersionRef
  adaptiveStyleResolutionRef?: CaptionImmutablePlanningEvidenceRef
  colorManagementPlanRefs?: CaptionImmutablePlanningEvidenceRef[]
  calibrationPreviewPlanRef?: CaptionImmutablePlanningEvidenceRef
  sceneGraphRef?: CaptionImmutablePlanningEvidenceRef
  motionHandoffPlanRef?: CaptionImmutablePlanningEvidenceRef
  soundCuePlanRef?: CaptionImmutablePlanningEvidenceRef
  renderSpecRef?: CaptionImmutablePlanningEvidenceRef
  deliveryPlanRef?: CaptionImmutablePlanningEvidenceRef
  qaReportRef?: CaptionImmutablePlanningEvidenceRef
  dependencyManifestRefs: CaptionDirectionVersionRef[]
  canonicalTranscriptArtifactId?: ID
  timestampArtifactId?: ID
  pictureLockManifestId?: ID
  storyTimingPlanId?: ID
  assetManifestId?: ID
}

export interface CaptionLegacyCompatibility {
  mode: 'none' | 'legacy_single_stable_track'
  legacyCaptionPlan?: CaptionPlan
  legacyCaptionPlanRecordIds: ID[]
  legacySkillIds: ID[]
  syntheticTimingPreviewOnly: boolean
  intentionalOcclusionDisabled: boolean
  crossSystemTransformsDisabled: boolean
}

export interface CaptionDirectionPlan extends CaptionDirectionRecordBase {
  canonicalSkillId: 'caption_design'
  planningPass: CaptionPlanningPass
  restraint: 'none' | 'no_captions'
  strategyPlanRef?: CaptionDirectionVersionRef
  opportunityMapRef?: CaptionDirectionVersionRef
  integrationClassificationIds: ID[]
  reservationPlanRef?: CaptionDirectionVersionRef
  blockingMetadataRef?: CaptionDirectionVersionRef
  approvalEnvelopeRef?: CaptionDirectionVersionRef
  styleProfileRef?: CaptionDirectionVersionRef
  finishReadinessRef?: CaptionDirectionVersionRef
  finishReadinessRefs?: CaptionFinishReadinessOutputRef[]
  lateResolutionRef?: CaptionDirectionVersionRef
  adaptiveStyleResolutionRef?: CaptionImmutablePlanningEvidenceRef
  colorManagementPlanRefs?: CaptionImmutablePlanningEvidenceRef[]
  calibrationPreviewPlanRef?: CaptionImmutablePlanningEvidenceRef
  sceneGraphRef?: CaptionImmutablePlanningEvidenceRef
  motionHandoffPlanRef?: CaptionImmutablePlanningEvidenceRef
  soundCuePlanRef?: CaptionImmutablePlanningEvidenceRef
  renderSpecRef?: CaptionImmutablePlanningEvidenceRef
  deliveryPlanRef?: CaptionImmutablePlanningEvidenceRef
  qaReportRef?: CaptionImmutablePlanningEvidenceRef
  dependencyManifestRefs: CaptionDirectionVersionRef[]
  snapshotReferences: CaptionDirectionSnapshotReferences
  outputAspectRatios: PlatformAspectRatio[]
  outputFrameConfirmed: boolean
  userFacingSummary: string
  blockers: string[]
  warnings: string[]
  compatibility: CaptionLegacyCompatibility
}

export interface CaptionLifecycleTransitionEvent extends ProjectScopedRecord {
  schemaVersion: CaptionDirectionSchemaVersion
  captionDirectionPlanId: ID
  fromPlanId: ID
  toPlanId: ID
  fromStatus: CaptionLifecycleStatus
  toStatus: CaptionLifecycleStatus
  reason: string
  actor: 'user' | 'agent' | 'system' | 'worker'
  evidenceIds: ID[]
  approvedPlanSnapshotId?: ID
  appendOnly: true
  mockOnly: true
}

export interface CaptionLifecycleTransitionEvidence {
  strategyApprovalPassed?: boolean
  captionFinishReadinessPassed?: boolean
  lateResolutionPassed?: boolean
  storyTimingLocked?: boolean
  captionMotionLocked?: boolean
  renderPreflightPassed?: boolean
  renderedArtifactsReady?: boolean
  qaOutcome?: 'warning' | 'failed' | 'passed'
  deliveryArtifactsReady?: boolean
}

export interface CaptionDirectionContractBundle {
  plan: CaptionDirectionPlan
  strategyPlan?: CaptionStrategyPlan
  opportunityMap?: CaptionOpportunityMap
  integrationClassifications: CaptionIntegrationClassification[]
  reservationPlan?: CaptionReservationPlan
  blockingMetadataPlan?: CaptionBlockingMetadataPlan
  approvalEnvelope?: CaptionApprovalEnvelope
  styleProfile?: CaptionStyleProfile
  finishReadiness?: CaptionFinishReadiness
  finishReadinesses?: CaptionFinishReadiness[]
  dependencyManifests: CaptionDependencyManifest[]
}

export type CaptionFinishReadinessCheckKind =
  | 'canonical_transcript'
  | 'required_alignment'
  | 'required_diarization'
  | 'storytiming_draft'
  | 'picture_lock'
  | 'approved_snapshot'
  | 'confirmed_output_frame'
  | 'output_layout'
  | 'living_frame'
  | 'b_roll_graphics'
  | 'mask_tracking'
  | 'visual_finish_proxy'
  | 'caption_style_profile'
  | 'platform_profile'
  | 'font_runtime'
  | 'reservation_honored'
  | 'approval_envelope'
  | 'asset_manifest'

export type CaptionFinishReadinessCheckStatus =
  | 'ready'
  | 'not_required'
  | 'missing'
  | 'stale'
  | 'blocked'
  | 'approved_degraded'

export interface CaptionFinishReadinessCheck {
  id: ID
  kind: CaptionFinishReadinessCheckKind
  required: boolean
  status: CaptionFinishReadinessCheckStatus
  dependencyIds: ID[]
  evidenceIds: ID[]
  affectedScopeIds: ID[]
  reason: string
  degradedRoute?: string
  degradedPermission?: CaptionFallbackPermission
  insideApprovalEnvelope: boolean
}

export interface CaptionFinishReadiness extends CaptionDirectionRecordBase {
  captionDirectionPlanId: ID
  outputId: ID
  pictureLockManifestRef: PictureLockVersionRef
  approvedPlanSnapshotRef: CaptionImmutablePlanningEvidenceRef
  approvalEnvelopeRef: CaptionDirectionVersionRef
  dependencyManifestRefs: CaptionDirectionVersionRef[]
  checks: CaptionFinishReadinessCheck[]
  readyForChoreography: boolean
  finalChoreographyPermitted: boolean
  blockerCheckIds: ID[]
  staleScopeIds: ID[]
  approvedDegradedCheckIds: ID[]
  checkedAt: string
  noFinalFramesAssigned: true
  limitations: string[]
}

export interface CaptionFinishReadinessOutputRef
  extends CaptionDirectionVersionRef {
  outputId: ID
}

export interface CaptionFinishReadinessRequirements {
  alignment: boolean
  diarization: boolean
  livingFrame: boolean
  bRollOrGraphics: boolean
  maskTracking: boolean
}

export interface CaptionFinishReadinessDegradedRoute {
  kind: CaptionFinishReadinessCheckKind
  permission: CaptionFallbackPermission
  route: string
  insideApprovalEnvelope: boolean
  approvalEvidenceIds: ID[]
}

export interface CaptionFinishReadinessInput {
  id: ID
  createdAt: string
  plan: CaptionDirectionPlan
  pictureLockManifest: PictureLockManifest
  dependencyManifests: CaptionDependencyManifest[]
  reservationPlan: CaptionReservationPlan
  integrationClassifications: CaptionIntegrationClassification[]
  approvalEnvelope: CaptionApprovalEnvelope
  approvedPlanSnapshotRef: CaptionImmutablePlanningEvidenceRef
  requirements: CaptionFinishReadinessRequirements
  degradedRoutes: CaptionFinishReadinessDegradedRoute[]
}

export interface CaptionFinishReadinessBuildResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  readiness?: CaptionFinishReadiness
}

export type CaptionStrategyReservationSchemaVersion =
  'caption-strategy-reservation-contract-v1'

export type CaptionStrategyPlanningStage = 'draft' | 'approval_candidate'

export type CaptionStrategyBlockerCode =
  | 'output_frame_unconfirmed'
  | 'source_order_unconfirmed'
  | 'credit_estimate_missing'
  | 'credit_estimate_exceeds_allowance'
  | 'canonical_transcript_missing'
  | 'compiled_intent_missing'
  | 'accessible_projection_missing'
  | 'required_reservation_unresolved'
  | 'requested_scope_outside_envelope'
  | 'cross_system_target_missing'
  | 'sensitive_text_review_unresolved'

export interface CaptionImmutablePlanningEvidenceRef {
  id: ID
  version: number
  contentHash: string
}

export interface CaptionConfirmedOutputFrameRef extends CaptionImmutablePlanningEvidenceRef {
  outputId: ID
  aspectRatio: PlatformAspectRatio
  width: number
  height: number
  confirmedByUser: boolean
  confirmationRecordId?: ID
}

export type CaptionStrategyUserDirective =
  | 'require'
  | 'prefer'
  | 'allow'
  | 'avoid'
  | 'forbid'

export interface CaptionStrategyOpportunityCandidate {
  id: ID
  sceneId: ID
  outputId?: ID
  sourceRange?: TimeRange
  outputRangeCandidate?: TimeRange
  linkedSourceClipIds: ID[]
  linkedTranscriptSegmentIds: ID[]
  linkedTranscriptWordIds: ID[]
  spokenConcept: string
  captionRole: CaptionRole
  possibleTracks: CaptionTrackKind[]
  visualImportance: 'low' | 'medium' | 'high'
  structuralImpact: CaptionOpportunity['structuralImpact']
  likelyScreenSpaceNeed: CaptionOpportunity['likelyScreenSpaceNeed']
  likelyMaskRequirement: CaptionOpportunity['likelyMaskRequirement']
  possibleSoundRequirement: CaptionOpportunity['possibleSoundRequirement']
  requestedIntegrationClass?: CaptionIntegrationClass
  crossSystemTarget?: CaptionCrossSystemTarget
  userDirective: CaptionStrategyUserDirective
  selectedConcept: string
  rejectedConcepts: string[]
  reason: string
  lowerCostAlternative: string
  sensitiveReviewState: 'not_required' | 'resolved' | 'unresolved'
  sensitiveReviewEvidenceIds: ID[]
  reservation?: {
    kind: CaptionReservationKind
    normalizedRegion?: BoundingBox
    fallbackRegionIds: ID[]
    protectedRegionIds: ID[]
    additionalDurationMs?: number
    priority: CaptionReservation['priority']
    fallback: string
  }
}

export interface CaptionStrategyReservationInput {
  schemaVersion: CaptionStrategyReservationSchemaVersion
  stage: CaptionStrategyPlanningStage
  idPrefix: string
  createdAt: string
  plan: CaptionDirectionPlan
  compiledIntentRef: CaptionImmutablePlanningEvidenceRef
  canonicalTranscriptRef?: CaptionImmutablePlanningEvidenceRef
  videoUnderstandingRef: CaptionImmutablePlanningEvidenceRef
  referenceDnaRefs: CaptionImmutablePlanningEvidenceRef[]
  outputFrameRef?: CaptionConfirmedOutputFrameRef
  sourceOrderConfirmed: boolean
  sourceOrderConfirmationRef?: CaptionImmutablePlanningEvidenceRef
  creditEstimateRef?: CaptionImmutablePlanningEvidenceRef
  estimatedCaptionCredits?: number
  restraint: 'none' | 'no_captions'
  captionRole: CaptionRole
  projectMode: CaptionProjectMode
  defaultSceneMode: CaptionSceneMode
  projectCaptionLanguage: string
  projectionRequirements: CaptionProjectionRequirement[]
  approximateDensity: CaptionDirectionDensity
  motionIntensity: CaptionMotionIntensity
  captionSoundPermitted: boolean
  accessibilityRequirements: string[]
  estimatedCreditImpact: CaptionCreditImpact
  maximumCaptionCreditAllowance: number
  permissions: {
    integrationClasses: CaptionIntegrationClass[]
    sceneModes: CaptionSceneMode[]
    typographyRoles: CaptionTypographyRole[]
    colorRoles: CaptionColorRole[]
    maximumHeroTypographyMoments: number
    behindSubjectTypography: boolean
    frontOfSubjectTypography: boolean
    objectAnchoring: boolean
    captionToVisualBridge: boolean
    captionSoundDesign: boolean
    textTransformations: CaptionTextTransformation[]
    accessibleOutputs: CaptionProjectionKind[]
    translationScope: string[]
    fallbackPermissions: CaptionFallbackPermission[]
  }
  candidates: CaptionStrategyOpportunityCandidate[]
}

export interface CaptionStrategyReservationBuildResult {
  schemaVersion: CaptionStrategyReservationSchemaVersion
  ok: boolean
  approvalEligible: boolean
  errors: string[]
  warnings: string[]
  blockerCodes: CaptionStrategyBlockerCode[]
  strategyPlan?: CaptionStrategyPlan
  opportunityMap?: CaptionOpportunityMap
  integrationClassifications: CaptionIntegrationClassification[]
  reservationPlan?: CaptionReservationPlan
  approvalEnvelope?: CaptionApprovalEnvelope
  blockingMetadataPlan?: CaptionBlockingMetadataPlan
}
