import type {
  LivingFrameMode,
  LivingFrameTimingPhase,
} from './living-frame'
import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
  LivingFramePausedOwnerSpecificationScope,
} from './living-frame-owner-scope-amendment'
import type {
  LivingFrameNonCharacterProfessionalCheckId,
} from './living-frame-non-character-professional-review'
import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityCameraCharacter,
  LivingFrameVisualContinuityCompositionStrategy,
  LivingFrameVisualContinuityDepthStyle,
  LivingFrameVisualContinuityMotionCharacter,
  LivingFrameVisualContinuityMotionDensity,
  LivingFrameVisualContinuitySoundPalette,
  LivingFrameVisualContinuityStillnessPolicy,
} from './living-frame-visual-continuity'

export const LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_VERSION =
  'living-frame-representative-direction-acceptance-v1' as const

export type LivingFrameRepresentativeDirectionMode =
  | LivingFrameMode
  | 'final_artifact_review'

export type LivingFrameRepresentativeDemonstrationAction =
  | 'integrate_visual_with_speaker'
  | 'hold_static_illustration_and_reveal_editorial_context'
  | 'animate_environment_around_static_non_character_object'
  | 'assemble_source_verified_archive_evidence'
  | 'reveal_diagram_relationship'
  | 'expand_non_character_visual_and_return_to_speaker'
  | 'reveal_literal_map_route_and_data_relationship'
  | 'transfer_attention_and_apply_truthful_semantic_scale'
  | 'demonstrate_depth_occlusion_or_safe_space_fallback'
  | 'apply_environmental_or_preapproved_rigid_support_motion'
  | 'coordinate_caption_sound_and_visual_attention'
  | 'inspect_exact_final_artifact_without_new_motion'

export type LivingFrameRepresentativeMotionChannel =
  | 'none'
  | 'source_motion'
  | 'environmental'
  | 'editorial'
  | 'spatial'
  | 'camera'
  | 'attention'

export type LivingFrameRepresentativeSemanticScalePolicy =
  | 'none'
  | 'literal_relationship_only'
  | 'data_proportional_only'
  | 'perspective_only'
  | 'editorial_symbolic_with_disclosure'

export interface LivingFrameRepresentativeDirectionPhase {
  readonly phase: LivingFrameTimingPhase
  readonly order: number
  readonly relativeWeightBasisPoints: number
  readonly intent:
    | 'prepare_attention_without_preempting_meaning'
    | 'introduce_primary_visual_on_semantic_trigger'
    | 'demonstrate_action_and_hold_for_comprehension'
    | 'resolve_visual_argument'
    | 'settle_and_restore_or_transition_attention'
  readonly exactFramesProvided: false
}

export interface LivingFrameRepresentativeCaseDirectionAcceptance {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly directionMode: LivingFrameRepresentativeDirectionMode
  readonly sourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly caseSourceAdmissionRef: {
    readonly refVersion:
      'living-frame-representative-case-source-admission-v1'
    readonly digestSha256: string
    readonly canonicalRereadRequired: true
  }
  readonly demonstrationAction:
    LivingFrameRepresentativeDemonstrationAction
  readonly phasePlan:
    readonly LivingFrameRepresentativeDirectionPhase[]
  readonly styleProfile: {
    readonly assetTreatments:
      readonly LivingFrameVisualContinuityAssetTreatment[]
    readonly depthStyle: LivingFrameVisualContinuityDepthStyle
    readonly compositionStrategy:
      LivingFrameVisualContinuityCompositionStrategy
    readonly motionCharacter:
      LivingFrameVisualContinuityMotionCharacter
    readonly motionDensity: LivingFrameVisualContinuityMotionDensity
    readonly cameraCharacter:
      LivingFrameVisualContinuityCameraCharacter
    readonly stillnessPolicy:
      LivingFrameVisualContinuityStillnessPolicy
    readonly soundPalette: LivingFrameVisualContinuitySoundPalette
  }
  readonly motionBudget: {
    readonly primaryChannel: LivingFrameRepresentativeMotionChannel
    readonly secondaryChannels:
      readonly LivingFrameRepresentativeMotionChannel[]
    readonly maximumConcurrentMeaningfulMotions: 2
    readonly ambientMotionMustRemainSubordinate: true
    readonly cameraMotionMustBeNarrativelyMotivated: true
  }
  readonly semanticScalePolicy:
    LivingFrameRepresentativeSemanticScalePolicy
  readonly exactMapAndDataGeometryMayNotBeEditoriallyDistorted: true
  readonly illustratedOrLivingSubjectAnimationPermitted: false
  readonly mechanicalRiggingOrPartAnimationPermitted: false
  readonly staticIllustrationMustRemainStatic: boolean
  readonly captionsRemainAboveLivingFrame: true
  readonly focusHandoffRequiresRestoreOrPlannedTransition: true
  readonly actionSpecificTimingRequired: true
  readonly storyTimingOwnsExactFrames: true
  readonly soundSyncOwnsExactCueAndMix: true
  readonly headIntelligenceMustChooseRefineSimplifyOrRefuse: true
  readonly geometryOrMetricsOnlyAcceptancePermitted: false
  readonly completePlaybackAndCompleteTimeVisualReviewRequired: true
  readonly exactProfessionalCheckIds:
    readonly LivingFrameNonCharacterProfessionalCheckId[]
  readonly directionDigestSha256: string
}

export interface LivingFrameRepresentativeDirectionAcceptanceManifestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_VERSION
  readonly manifestClass:
    'source_only_representative_head_direction_and_action_timing_acceptance_profile'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly representativeVisualFixtureVersion:
    'living-frame-representative-visual-fixture-v1'
  readonly representativeVisualFixtureDigestSha256: string
  readonly representativeSourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly representativeSourceCandidateSetDigestSha256: string
  readonly cases:
    readonly LivingFrameRepresentativeCaseDirectionAcceptance[]
  readonly activeCaseCount: 12
  readonly exactFivePhaseActionSpecificPlansRequired: true
  readonly relativePhaseWeightsSumBasisPoints: 10_000
  readonly noUniversalAnimationTimingPreset: true
  readonly noUniversalStyleOrDepthTreatment: true
  readonly headIntelligenceCreativeDecisionRequired: true
  readonly canonicalSemanticPlannerMustRemainOwner: true
  readonly masterTimingAndStoryTimingRemainExactFrameOwners: true
  readonly pausedScopesRejected:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly pausedScopeCount: 7
  readonly canonicalConsumptionPending: true
  readonly createsPlannerTimingSoundWorkAssetRendererQaOrReviewOwner: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeDirectionAcceptanceManifest
  extends LivingFrameRepresentativeDirectionAcceptanceManifestDraft {
  readonly caseSetDigestSha256: string
  readonly manifestDigestSha256: string
}
