import type {
  LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport,
} from './living-frame-blender-selected-scene-remotion-review-internal-test'

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_VERSION =
  'living-frame-blender-selected-scene-illustrated-remotion-review-internal-test-v1' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_textured_blender_illustrated_remotion_review_evidence' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_STATE =
  'selected_scene_textured_blender_illustration_private_remotion_review_green_canonical_reconciliation_pending' as const

export interface LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneTextureBindingDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly componentQaReportDigestSha256: string
    readonly persistenceReportDigestSha256: string
    readonly baseReviewReportDigestSha256: string
    readonly basePlateArtifactId: string
    readonly basePlateSha256: string
    readonly captionArtifactId: string
    readonly captionSha256: string
    readonly texturedBlenderPayloadDigestSha256: string
  }
  readonly compositionIdentity: {
    readonly styleProfile:
      'illustrated_musashi_deep_2_5d_v1'
    readonly basePlateContainsReconstructedCharacterAndStaticSecondaryParts:
      true
    readonly blenderSequenceContainsApprovedTexturedSwordArmComponent:
      true
    readonly captionPlaneAboveLivingFrame: true
    readonly exactConfirmedAspectRatioPreserved: true
    readonly everyFinalReviewFrameCompositedByRemotion: true
    readonly remotionRemainsFinalCanvas: true
  }
  readonly baseReview:
    LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport
  readonly qaEvidence: {
    readonly exactBasePlateBytesRevalidated: true
    readonly exactCaptionBytesRevalidated: true
    readonly selectedSceneTextureBindingRevalidated: true
    readonly texturedBlenderComponentQaPassed: true
    readonly illustratedSourcePlateVisible: true
    readonly texturedSwordArmMotionVisible: true
    readonly initialPoseRestored: true
    readonly privateReviewArtifactPersistedAndReread: true
  }
  readonly authorityBoundary: {
    readonly privateInternalIllustratedReviewEvidenceAuthority:
      true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly canonicalArtifactAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewApprovalAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReport
  extends LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReportDraft {
  readonly reportDigestSha256: string
}
