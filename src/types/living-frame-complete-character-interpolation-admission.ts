import type {
  LivingFrameCompleteCharacterKeyposeRole,
} from './living-frame-complete-character-keypose-plan'
import type {
  LivingFrameCharacterActionMotionCurve,
  LivingFrameCharacterActionPropConstraint,
} from './living-frame-character-action-choreography'

export const LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_VERSION =
  'living-frame-complete-character-interpolation-admission-v2' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_CLASS =
  'server_derived_non_executable_accepted_keypose_interpolation_admission_candidate' as const

export interface LivingFrameAuthoritativeKeyposeTimingRef {
  readonly sourceOwner: 'StoryTiming'
  readonly artifactId: string
  readonly version: number
  readonly digestSha256: string
  readonly sourceActionTimingArtifactId:
    string
  readonly sourceActionTimingDigestSha256:
    string
  readonly masterTimingPlanId: string
  readonly masterTimingDigestSha256:
    string
  readonly segmentId: string
  readonly keyposes: readonly {
    readonly keyposeUnitId: string
    readonly role:
      LivingFrameCompleteCharacterKeyposeRole
    readonly frame: number
  }[]
}

export interface LivingFrameCompleteCharacterInterpolationTransitionUnit {
  readonly order: number
  readonly transitionUnitId: string
  readonly fromKeypose: {
    readonly keyposeUnitId: string
    readonly role:
      LivingFrameCompleteCharacterKeyposeRole
    readonly frame: number
    readonly reviewId: string
    readonly reviewDigestSha256: string
    readonly privateArtifactId: string
    readonly privateArtifactSha256:
      string
    readonly privateObjectIdentityHash:
      string
  }
  readonly toKeypose: {
    readonly keyposeUnitId: string
    readonly role:
      LivingFrameCompleteCharacterKeyposeRole
    readonly frame: number
    readonly reviewId: string
    readonly reviewDigestSha256: string
    readonly privateArtifactId: string
    readonly privateArtifactSha256:
      string
    readonly privateObjectIdentityHash:
      string
  }
  readonly requestedMotionSpanFrames:
    number
  readonly actionTransitionBinding: {
    readonly fromActionPhaseId: string
    readonly toActionPhaseId: string
    readonly fromBodyMechanicIntent: string
    readonly toBodyMechanicIntent: string
    readonly fromPropConstraint:
      LivingFrameCharacterActionPropConstraint
    readonly toPropConstraint:
      LivingFrameCharacterActionPropConstraint
    readonly motionCurve:
      LivingFrameCharacterActionMotionCurve
    readonly choreographyTransitionDigestSha256:
      string
  }
  readonly route: {
    readonly proposedToolId: 'tooncrafter'
    readonly proposedOperationId:
      'tool.tooncrafter.interpolate_accepted_character_keyposes.v1'
    readonly acceptedCompleteKeyposeInputsOnly:
      true
    readonly serverOwnedSeedRequired:
      true
    readonly serverDerivedMotionPromptRequired:
      true
    readonly callerSeedPromptModelDimensionsPathsUrlsBytesCredentialsCommandsOrEnvironmentAllowed:
      false
    readonly oneAttemptOnePrivateCandidateOutput:
      true
    readonly qualifiedFrameCapacityMustCoverRequestedSpan:
      true
  }
  readonly outputPolicy: {
    readonly outputClass:
      'private_interpolated_character_motion_candidate'
    readonly alphaOrTransparencyAssumed:
      false
    readonly anatomyIdentityOrAttachmentRepairClaimAllowed:
      false
    readonly finalCanvasClaimAllowed: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly transitionUnitDigestSha256:
    string
}

export interface LivingFrameCompleteCharacterInterpolationAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_CLASS
  readonly admissionState:
    'source_only_candidate_blocked_pending_tooncrafter_release_and_private_runtime'
  readonly admissionId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256:
      string
    readonly selectedSceneBindingDigestSha256:
      string
    readonly feasibilitySprintId: string
    readonly feasibilitySprintVersion:
      'living-frame-ai-2d-feasibility-sprint-v1'
    readonly feasibilitySprintDigestSha256:
      string
    readonly fixtureId: string
    readonly fixtureDigestSha256: string
    readonly keyposePlanId: string
    readonly keyposePlanDigestSha256:
      string
    readonly actionChoreographyDigestSha256:
      string
    readonly authoritativeActionTimingDigestSha256:
      string
    readonly keyposeReviewSetId: string
    readonly keyposeReviewSetDigestSha256:
      string
    readonly interpolationQualificationVersion:
      'living-frame-ai-2d-interpolation-qualification-v1'
    readonly interpolationQualificationDigestSha256:
      string
    readonly authoritativeKeyposeTimingArtifactId:
      string
    readonly authoritativeKeyposeTimingDigestSha256:
      string
    readonly confirmedOutputFrameDigestSha256:
      string
    readonly styleProfileDigestSha256:
      string
  }
  readonly authoritativeKeyposeTimingRef:
    LivingFrameAuthoritativeKeyposeTimingRef
  readonly transitionUnits:
    readonly LivingFrameCompleteCharacterInterpolationTransitionUnit[]
  readonly sequencingPolicy: {
    readonly everyInputKeyposeProfessionallyAccepted:
      true
    readonly actionSpecificKeyposeSelectionRevalidated:
      true
    readonly authoritativeActionTimingRevalidated:
      true
    readonly genericOrEvenlySpacedDefaultTimingForbidden:
      true
    readonly transitionCountEqualsKeyposeCountMinusOne:
      true
    readonly interpolationCannotBeginUntilToonCrafterQualificationReleased:
      true
    readonly eachMotionOutputRequiresTechnicalQaAndActualVisualInspection:
      true
    readonly rifeBlockedUntilUnderlyingMotionAccepted:
      true
    readonly temporalMaskAndAlphaRequiredBeforeRemotionWhenIsolationNeeded:
      true
    readonly remotionBlockedUntilRequiredMotionAndMaskAssetsAccepted:
      true
    readonly interpolationFailureReturnsToAcceptedStillOrRestrainedMotion:
      true
  }
  readonly openGateCodes: readonly [
    'tooncrafter_exact_source_model_license_and_runtime_release_required',
    'tooncrafter_qualified_frame_capacity_required',
    'approved_interpolation_work_item_and_planned_asset_entry_required',
    'private_interpolation_request_and_single_attempt_lease_required',
    'private_output_persistence_reread_and_technical_qa_required',
    'interpolated_motion_professional_visual_acceptance_required',
    'temporal_mask_and_alpha_required_when_isolation_needed',
    'remotion_final_composition_and_visual_acceptance_required',
  ]
  readonly containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
    false
  readonly authorityBoundary: {
    readonly masterTimingAuthority: false
    readonly registryAuthority: false
    readonly operationAuthority: false
    readonly providerAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly assetManifestAuthority:
      false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority:
      false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterInterpolationAdmission
  extends LivingFrameCompleteCharacterInterpolationAdmissionDraft {
  readonly admissionDigestSha256: string
}
