import type {
  CaptionImmutablePlanningEvidenceRef,
} from './caption-direction'
import type { BoundingBox, ID } from './workflow-common'

export const CAPTION_LIVING_FRAME_REQUEST_VERSION =
  'caption-direction-living-frame-request-v1' as const

export const LIVING_FRAME_CAPTION_RESPONSE_VERSION =
  'living-frame-caption-direction-response-v1' as const

export const CAPTION_LIVING_FRAME_ADAPTER_VERSION =
  'caption-direction-living-frame-adapter-v1' as const

export const CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT_VERSION =
  'caption-direction-living-frame-public-type-receipt-v1' as const

export type CaptionLivingFrameRequestPhase =
  | 'planning_draft'
  | 'approved_projection'

export type CaptionLivingFrameMode =
  | 'living_a_roll'
  | 'living_still'
  | 'living_archive'
  | 'living_diagram'
  | 'hybrid_expansion'

export type CaptionLivingFrameSelectedSceneTreatment =
  | 'use_full'
  | 'use_subtle'
  | 'use_simpler_treatment'

export type CaptionLivingFrameFallbackStep =
  | 'full_living_frame'
  | 'simplified_depth_composition'
  | 'safe_space_overlay'
  | 'lower_visual_stage'
  | 'side_by_side'
  | 'full_illustrated_scene'
  | 'static_card'
  | 'captions_only'
  | 'no_extra_visual'

export type CaptionLivingFrameQaCode =
  | 'narrative_relevance_expected'
  | 'one_focal_primary_expected'
  | 'visual_density_restraint_expected'
  | 'caption_safe_region_expected'
  | 'face_safe_region_expected'
  | 'gesture_safe_region_expected'
  | 'continuity_comparison_required'
  | 'component_separability_required'
  | 'alpha_multi_background_qa_required'
  | 'temporal_mask_stability_required'
  | 'pivot_physics_qa_required'
  | 'semantic_timing_binding_required'
  | 'attention_restoration_required'
  | 'semantic_scale_truth_required'
  | 'narration_protection_required'
  | 'documentary_integrity_required'
  | 'exact_geography_verification_required'
  | 'exact_data_verification_required'
  | 'generated_video_restraint_required'

export interface CaptionLivingFramePublicTypeFileReceipt {
  path: string
  gitBlobSha: string
  fileDigestSha256: string
}

export interface CaptionLivingFramePublicTypeReceipt {
  schemaVersion:
    typeof CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT_VERSION
  repository: 'yuzastudio6-cyber/Reedkt'
  branch: 'codex/living-frame-gpu-operation-preflight-v1'
  commitSha:
    '8f88f6d702781aec64b5b5795fc12c65619d93b0'
  publicTypeFiles: CaptionLivingFramePublicTypeFileReceipt[]
  publicTypesMergedIntoActiveCheckout: false
  structuralCompatibilityOnly: true
  serverImplementationImported: false
}

export interface CaptionLivingFrameContractVersions {
  professionalSkillId: 'motion.living_frame_storytelling'
  professionalSkillComponent:
    'living-frame-professional-skill-component-v1'
  semanticPlanProjection:
    'living-frame-semantic-plan-projection-v1'
  selectedSceneAdmission:
    'living-frame-selected-scene-admission-candidate-v1'
  selectedSceneBinding:
    'canonical-living-frame-selected-scene-binding-v1'
  selectedSceneBindingComponentKey:
    'livingFrameSelectedSceneBinding'
  timingBinding: 'canonical-living-frame-timing-binding-v1'
  timingBindingComponentKey: 'livingFrameTimingBinding'
  motionSpec: 'canonical-living-frame-motion-spec-v2'
  motionProfile:
    'approved_visual_interval_scalar_keyframe_choreography_v2'
  estimateWorkAssetProjection:
    'canonical-living-frame-estimate-work-asset-projection-v6'
  estimateWorkAssetProjectionComponentKey:
    'livingFrameEstimateWorkAssetProjection'
  workGraphProjection:
    'canonical-living-frame-work-graph-projection-v10'
  workGraphProjectionComponentKey:
    'livingFrameCanonicalWorkGraphProjection'
  rendererPlanBinding: 'living-frame-renderer-plan-binding-v1'
  approvedLineageBinding:
    'living-frame-approved-lineage-binding-v1'
}

export interface CaptionLivingFrameCanonicalScope {
  workspaceId: ID
  projectId: ID
  editSessionId: ID
  handoffId: ID
  planVersionId: ID
  approvedSnapshotId: ID | null
}

export interface CaptionLivingFrameCaptionPlanRef {
  captionDirectionPlanId: ID
  captionDirectionPlanVersion: number
  captionDirectionPlanDigestSha256: string
  captionDirectionProjectionId: ID
  captionDirectionProjectionVersion: number
  captionDirectionProjectionDigestSha256: string
  sceneGraphRef: CaptionImmutablePlanningEvidenceRef
}

export interface CaptionLivingFrameTranscriptRef {
  artifactId: ID
  artifactVersion: number
  artifactDigestSha256: string
  language: string
  sourceSegmentIds: ID[]
  semanticPhraseIds: ID[]
  exactSourceWordIds: ID[]
  containsRawTranscriptText: false
}

export interface CaptionLivingFrameSemanticRequest {
  stableConceptId: ID
  classification: 'cross_system_transform'
  semanticPurpose:
    | 'explain_relationship'
    | 'show_cause_and_effect'
    | 'demonstrate_operation'
    | 'organize_evidence'
    | 'establish_geography'
    | 'reinforce_key_concept'
  visualVerbIntent:
    | 'reveal'
    | 'converge'
    | 'restrict'
    | 'surround'
    | 'expand'
    | 'contract'
    | 'connect'
    | 'separate'
    | 'rotate'
    | 'approach'
    | 'retreat'
    | 'transform'
    | 'hold'
  sourceSemanticPhraseIds: ID[]
  exactSourceWordIds: ID[]
  informationOwnerBefore: 'caption'
  informationOwnerRequestedAfter: 'living_frame'
  noDuplicateVisibleInformationAfterTransfer: true
  restoreCaptionOwnershipOnFailureOrExit: true
}

export interface CaptionLivingFrameConfirmedFrame {
  outputId: ID
  width: number
  height: number
  aspectRatio: string
  aspectRatioNumerator: number
  aspectRatioDenominator: number
  confirmedOutputFrameDigestSha256: string
  userConfirmed: true
  silentlyInferredOrSubstituted: false
}

export interface CaptionLivingFrameReservedRegion {
  regionId: ID
  normalizedBox: BoundingBox
  pixelBox: BoundingBox
  regionDigestSha256: string
}

export interface CaptionLivingFrameProtectedRegion {
  regionId: ID
  kind:
    | 'caption'
    | 'face'
    | 'gesture'
    | 'product'
    | 'map_label'
    | 'chart_label'
    | 'browser_highlight'
    | 'fact_safety_note'
  regionDigestSha256: string
}

export interface CaptionLivingFrameReservation {
  reservedRegions: CaptionLivingFrameReservedRegion[]
  captionPlanePriority: number
  protectedRegions: CaptionLivingFrameProtectedRegion[]
  desiredReservationBoundary:
    | 'semantic_phrase'
    | 'story_beat'
    | 'scene'
  desiredReservationDurationIntent:
    | 'brief'
    | 'standard'
    | 'extended_for_comprehension'
  fallbackRegionIds: ID[]
}

export interface CaptionLivingFrameTimingRequest {
  masterTimingPlanId: ID
  masterTimingDigestSha256: string
  storyTimingPlanId: ID
  storyTimingDigestSha256: string
  existingStoryTimingEventIds: ID[]
  existingStoryTimingCueIds: ID[]
  semanticStartIntent:
    | 'spoken_meaning_begins'
    | 'visual_introduction_requested'
  semanticHitIntent:
    | 'primary_motion_requested'
    | 'visual_resolution_requested'
  semanticHoldIntent: 'meaning_comprehension_hold_requested'
  semanticExitIntent:
    | 'visual_resolution_requested'
    | 'attention_return_requested'
  captionDirectionAssignsFinalLivingFrameFrames: false
  masterTimingRemainsSoleClockAuthority: true
}

export interface CaptionLivingFrameStyleRequest {
  captionStyleProfileId: ID
  captionStyleProfileVersion: number
  captionStyleProfileDigestSha256: string
  approvedSemanticColorTokenIds: ID[]
  motionIntent:
    | 'restrained'
    | 'moderate'
    | 'expressive'
  reducedMotionIntent:
    | 'static_hierarchy'
    | 'opacity_only'
    | 'direct_state_change'
  containsCssReactAssCommandsOrExecutablePrompt: false
}

export interface CaptionLivingFrameDependencyRefs {
  layoutPlanRef: CaptionImmutablePlanningEvidenceRef
  occupancyManifestRef: CaptionImmutablePlanningEvidenceRef
  visualAssetPlanRef?: CaptionImmutablePlanningEvidenceRef
  depthPlanRef?: CaptionImmutablePlanningEvidenceRef
  maskManifestRef?: CaptionImmutablePlanningEvidenceRef
  expectedLivingFrameComponentVersion:
    'living-frame-professional-skill-component-v1'
  captionDirectionComponentVersion:
    'caption-direction-contract-v1'
  contractVersions: CaptionLivingFrameContractVersions
  publicTypeReceipt: CaptionLivingFramePublicTypeReceipt
}

export interface CaptionLivingFrameEstimateInputs {
  requestedComplexityCeiling: 'low' | 'medium' | 'high'
  premiumOperationPermissionExpectation:
    | 'not_expected'
    | 'expected_if_approved'
  lowerCostFallbackPreference:
    | 'prefer_simpler_treatment'
    | 'prefer_captions_only'
    | 'no_preference'
  pricingOrBillingAuthorityProvided: false
}

export interface CaptionLivingFrameFallbackPolicy {
  orderedSteps: CaptionLivingFrameFallbackStep[]
  captionRetainsOrRegainsInformationOwnership: true
  structuralFailureRequiresReview: boolean
}

export interface CaptionLivingFrameAccessibilityAndSafety {
  qaExpectationCodes: CaptionLivingFrameQaCode[]
  accessibleCaptionTrackId: ID
  completeAccessibleWordingRetained: true
  reducedMotionRequired: boolean
  reducedMotionParityRequired: true
  documentaryFactSafetyRefIds: ID[]
  narrationProtection: 'strict'
}

export interface CaptionLivingFramePrivateArtifactMetadata {
  tenantScope: {
    workspaceId: ID
    projectId: ID
  }
  retentionClass:
    | 'planning_receipt_short_lived'
    | 'approved_private_artifact'
  accessClass: 'tenant_private'
  byteFreeRequest: true
  replayPolicy:
    | 'same_digest_same_result'
    | 'reject_stale_or_changed_authority'
  stalenessRefs: {
    transcriptDigestSha256: string
    captionPlanDigestSha256: string
    confirmedFrameDigestSha256: string
    layoutOccupancyDigestSha256: string
    masterTimingDigestSha256: string
    approvedSnapshotDigestSha256: string | null
  }
}

export interface CaptionLivingFrameRequestAuthorityBoundary {
  captionOwnsRequestShape: true
  livingFrameOwnsResponseAndExecution: true
  preapprovalIntentReservationOnly: true
  operationAuthority: false
  dispatchAuthority: false
  providerAuthority: false
  runtimeAuthority: false
  assetCreationAuthority: false
  qaApprovalAuthority: false
  approvalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

interface CaptionLivingFrameRequestBase {
  schemaVersion: typeof CAPTION_LIVING_FRAME_REQUEST_VERSION
  requestId: ID
  requestDigestSha256: string
  idempotencyKey: ID
  createdForPhase: CaptionLivingFrameRequestPhase
  canonicalScope: CaptionLivingFrameCanonicalScope
  captionPlanRef: CaptionLivingFrameCaptionPlanRef
  canonicalTranscriptRef: CaptionLivingFrameTranscriptRef
  semanticRequest: CaptionLivingFrameSemanticRequest
  confirmedFrame: CaptionLivingFrameConfirmedFrame
  captionReservation: CaptionLivingFrameReservation
  timingRequest: CaptionLivingFrameTimingRequest
  styleRequest: CaptionLivingFrameStyleRequest
  dependencyRefs: CaptionLivingFrameDependencyRefs
  estimateInputs: CaptionLivingFrameEstimateInputs
  fallbackPolicy: CaptionLivingFrameFallbackPolicy
  accessibilityAndSafety:
    CaptionLivingFrameAccessibilityAndSafety
  privateArtifactMetadata:
    CaptionLivingFramePrivateArtifactMetadata
  authority: CaptionLivingFrameRequestAuthorityBoundary
  containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText: false
}

export interface CaptionLivingFramePlanningDraftRequest
  extends CaptionLivingFrameRequestBase {
  createdForPhase: 'planning_draft'
  canonicalScope: CaptionLivingFrameCanonicalScope & {
    approvedSnapshotId: null
  }
}

export interface CaptionLivingFrameApprovedProjectionRequest
  extends CaptionLivingFrameRequestBase {
  createdForPhase: 'approved_projection'
  canonicalScope: CaptionLivingFrameCanonicalScope & {
    approvedSnapshotId: ID
  }
  immutableApprovedSnapshotRef:
    CaptionImmutablePlanningEvidenceRef
  immutableSnapshotRereadAndDigestMatched: true
}

export type CaptionLivingFrameRequest =
  | CaptionLivingFramePlanningDraftRequest
  | CaptionLivingFrameApprovedProjectionRequest

export type CaptionLivingFrameResponseDisposition =
  | 'supported_selected'
  | 'supported_simpler_treatment'
  | 'declined_not_applicable'
  | 'declined_caption_or_speaker_priority'
  | 'blocked_stale_authority'
  | 'blocked_missing_canonical_authority'

export interface CaptionLivingFrameOpaqueContractRef {
  id: ID
  schemaVersion: string
  version: number
  digestSha256: string
}

export interface CaptionLivingFrameAttentionEvent {
  attentionEventId: ID
  order: number
  eventType: 'handoff' | 'hold' | 'restore'
  target: 'speaker' | 'visual' | 'shared'
  methods: (
    | 'focus_depth_expectation'
    | 'local_contrast_expectation'
    | 'camera_reframe_expectation'
    | 'camera_push_expectation'
    | 'motion_emphasis_expectation'
    | 'light_emphasis_expectation'
    | 'sound_emphasis_expectation'
  )[]
  summary: string
  exactFramesProvided: false
}

export interface CaptionLivingFrameSelectedSceneResult {
  selectedSceneAdmissionRef?: CaptionLivingFrameOpaqueContractRef
  selectedSceneBindingRef?: CaptionLivingFrameOpaqueContractRef
  selectedSceneIds: ID[]
  selectedModes: CaptionLivingFrameMode[]
  selectedTreatments:
    CaptionLivingFrameSelectedSceneTreatment[]
  deliberateNonUse: boolean
  executionClaimed: false
}

export interface CaptionLivingFrameTimingDependencies {
  masterTimingPlanId: ID
  masterTimingDigestSha256: string
  consumedStoryTimingEventIds: ID[]
  consumedStoryTimingCueIds: ID[]
  canonicalTimingBindingRef?:
    CaptionLivingFrameOpaqueContractRef
  semanticTimingRequestIds: ID[]
  parallelClockCreated: false
  masterTimingRemainsSoleClockAuthority: true
}

export interface CaptionLivingFrameLayoutDependencies {
  occupancyRegionIds: ID[]
  captionSafeExpectationRegionIds: ID[]
  faceProtectionRegionIds: ID[]
  gestureProtectionRegionIds: ID[]
  depthBandNeeds: (
    | 'far_background'
    | 'mid_background'
    | 'subject_plane'
    | 'foreground'
  )[]
  occlusionNeeded: boolean
  captionPlaneRemainsAboveLivingFrame: true
  explicitStoryTimingBoundInformationHandoffRequiredForException:
    true
  maskArtifactDependencyIds: ID[]
  unresolvedGateCodes: string[]
}

export interface CaptionLivingFrameEstimateProjection {
  estimateProjectionRef?: CaptionLivingFrameOpaqueContractRef
  requestedComplexity: 'none' | 'low' | 'medium' | 'high'
  requiredCapabilityKeys: string[]
  requiredWorkCategories: string[]
  pricingOrReservationDecisionProvided: false
}

export interface CaptionLivingFrameFallbackResult {
  selectedTreatment: CaptionLivingFrameFallbackStep
  evaluatedLadder: CaptionLivingFrameFallbackStep[]
  informationOwnerAfterDisposition: 'caption' | 'living_frame'
  captionRetainsOrRegainsInformationOwnership: boolean
}

export interface CaptionLivingFrameQaEvidenceRequirements {
  captionSafeRegionRequired: true
  attentionRestorationRequired: true
  semanticTimingRequired: true
  visualDensityReviewRequired: true
  narrationProtectionRequired: true
  documentaryFactSafetyRequired: boolean
  reducedMotionParityRequired: true
  privateArtifactReviewRequired: boolean
  requiredQaCodes: CaptionLivingFrameQaCode[]
}

export interface CaptionLivingFrameStalenessTuple {
  transcriptDigestSha256: string
  captionPlanDigestSha256: string
  confirmedFrameDigestSha256: string
  layoutOccupancyDigestSha256: string
  masterTimingDigestSha256: string
  livingFrameComponentVersion:
    'living-frame-professional-skill-component-v1'
  selectedSceneBindingVersion:
    'canonical-living-frame-selected-scene-binding-v1'
  approvedSnapshotDigestSha256: string | null
}

export interface CaptionLivingFrameResponseAuthorityBoundary {
  operationRegistered: false
  dispatchGranted: false
  providerAuthority: false
  runtimeAuthority: false
  assetCreatedOrApproved: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}

export interface LivingFrameCaptionDirectionResponse {
  schemaVersion: typeof LIVING_FRAME_CAPTION_RESPONSE_VERSION
  responseId: ID
  responseDigestSha256: string
  originalRequestId: ID
  originalRequestDigestSha256: string
  idempotencyKey: ID
  canonicalScope: CaptionLivingFrameCanonicalScope
  disposition: CaptionLivingFrameResponseDisposition
  reasonCode: string
  safeUserFacingSummary: string
  professionalComponentRef?:
    CaptionLivingFrameOpaqueContractRef & {
      professionalSkillId:
        'motion.living_frame_storytelling'
      contractVersion:
        'living-frame-professional-skill-component-v1'
    }
  semanticProjectionRef?:
    CaptionLivingFrameOpaqueContractRef
  motionSpecRef?: CaptionLivingFrameOpaqueContractRef
  selectedSceneResult:
    CaptionLivingFrameSelectedSceneResult
  requestedInformationOwnerHandoff:
    | 'caption_to_living_frame'
    | 'caption_retains_ownership'
  attentionEvents: CaptionLivingFrameAttentionEvent[]
  timingDependencies: CaptionLivingFrameTimingDependencies
  layoutDependencies: CaptionLivingFrameLayoutDependencies
  estimateProjection: CaptionLivingFrameEstimateProjection
  workGraphProjectionRef?:
    CaptionLivingFrameOpaqueContractRef
  rendererPlanBindingRef?:
    CaptionLivingFrameOpaqueContractRef
  fallbackResult: CaptionLivingFrameFallbackResult
  qaEvidenceRequirements:
    CaptionLivingFrameQaEvidenceRequirements
  staleness: CaptionLivingFrameStalenessTuple
  approvedLineageBindingRef?:
    CaptionLivingFrameOpaqueContractRef
  authority: CaptionLivingFrameResponseAuthorityBoundary
  containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText: false
}

export interface CaptionLivingFrameAdaptationResult {
  ok: boolean
  errors: string[]
  disposition?: CaptionLivingFrameResponseDisposition
  informationOwner?: 'caption' | 'living_frame'
  acceptedResponseRef?: CaptionLivingFrameOpaqueContractRef
  adapterVersion: typeof CAPTION_LIVING_FRAME_ADAPTER_VERSION
  runtimeOrExecutionAuthorityGranted: false
}
