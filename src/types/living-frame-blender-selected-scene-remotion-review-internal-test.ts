export const LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_VERSION =
  'living-frame-blender-selected-scene-remotion-review-internal-test-v1' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_blender_rig_remotion_review_evidence' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_STATE =
  'blender_rig_selected_scene_private_remotion_review_green_canonical_reconciliation_pending' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES = [
  'canonical_work_graph_admission_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_qa_approval_required',
  'canonical_private_review_reconciliation_required',
  'canonical_resource_and_actual_cost_receipt_required',
] as const

export interface LivingFrameBlenderSelectedSceneRemotionReviewChunkReceipt {
  readonly order: number
  readonly sourceStartFrame: number
  readonly sourceEndFrameExclusive: number
  readonly sourceFrameCount: number
  readonly localRenderedDurationFrames: 24
  readonly localOverlayCount: number
  readonly maximumCanonicalOverlayCount: 16
  readonly remotionRequestDigestSha256: string
  readonly remotionArtifactDigestSha256: string
  readonly exactSourceFramesRetainedDuringPackaging: true
  readonly fillerFramesDiscardedDuringPackaging: number
}

export interface LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly componentQaReportDigestSha256: string
    readonly persistenceReportDigestSha256: string
    readonly admissionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly artifactSetDigestSha256: string
    readonly finalPackagedReviewDigestSha256: string
  }
  readonly compositionIdentity: {
    readonly sourceComponentWidthPixels: 1920
    readonly sourceComponentHeightPixels: 1080
    readonly sourceComponentAspectRatio: '16:9'
    readonly internalReviewWidthPixels: 640
    readonly internalReviewHeightPixels: 360
    readonly internalReviewIsBoundedProxy: true
    readonly exactConfirmedAspectRatioPreserved: true
    readonly internalReviewIsFinalCustomerCanvas: false
    readonly fps: 30
    readonly selectedStartFrame: 12
    readonly selectedEndFrameExclusive: 72
    readonly selectedDurationFrames: 60
    readonly finalReviewDurationFrames: 60
    readonly frameImageCount: 60
    readonly remotionChunkCount: 4
    readonly maximumOverlaysPerChunk: 16
    readonly localMinimumRenderDurationFrames: 24
    readonly overlayAdapter:
      'bounded_remotion_chunks_with_exact_frame_packaging_v1'
    readonly packagingTool: 'ffmpeg'
    readonly packagingOnly: true
    readonly everyFinalReviewFrameCompositedByRemotion: true
    readonly captionsRemainAboveLivingFrame: true
    readonly remotionRemainsFinalCanvas: true
  }
  readonly chunkReceipts:
    readonly LivingFrameBlenderSelectedSceneRemotionReviewChunkReceipt[]
  readonly persistedPrivateReviewArtifact: {
    readonly persistenceOwner:
      'canonical_private_remotion_artifact_storage'
    readonly contentType: 'video/mp4'
    readonly privateObjectIdentityHash: string
    readonly byteLength: number
    readonly sha256: string
    readonly createOnlyPersistenceUsed: true
    readonly replayed: false
    readonly exactPrivateReadbackVerified: true
    readonly rawBytesIncluded: false
    readonly storagePathIncluded: false
  }
  readonly persistedMediaQa: {
    readonly probeToolId: 'ffprobe'
    readonly probeOperation:
      'tool.ffprobe.inspect_approved_media.v1'
    readonly actualRuntimeExecuted: true
    readonly codecName: 'h264'
    readonly widthPixels: 640
    readonly heightPixels: 360
    readonly fps: 30
    readonly readFrameCount: 60
    readonly pixelFormat: string
    readonly probeEvidenceDigestSha256: string
  }
  readonly renderedVisualQa: {
    readonly sampleFrames: readonly [0, 30, 59]
    readonly firstPoseSubjectPixelCount: number
    readonly middlePoseSubjectPixelCount: number
    readonly finalPoseSubjectPixelCount: number
    readonly middlePoseDifferentPixelCount: number
    readonly firstFinalMeanAbsoluteDifference: number
    readonly primaryMotionVisible: true
    readonly requiredReturnToInitialPoseVisible: true
    readonly sourcePlateVisibleAcrossSamples: true
    readonly captionPlaneVisibleAcrossSamples: true
    readonly livingFrameRemainsBelowCaptionPlane: true
    readonly exactSelectedFrameOrderPreserved: true
  }
  readonly runtimeIdentity: {
    readonly toolId: 'remotion'
    readonly operationId:
      'tool.remotion.render_approved_composition.v1'
    readonly packageName:
      'remotion+@remotion/renderer'
    readonly packageVersion: '4.0.487'
    readonly actualRemotionRenderCount: 4
    readonly ffmpegPackagingExecuted: true
    readonly sharedRuntimeSourceMutated: false
    readonly existingCanonicalRuntimeReused: true
  }
  readonly authorityBoundary: {
    readonly privateInternalRemotionReviewEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly timingAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly canonicalArtifactAuthority: false
    readonly assetManifestAuthority: false
    readonly finalRendererAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewApprovalAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES
  readonly componentQaReportRevalidated: true
  readonly privateRemotionSequenceLeaseConsumedExactlyOnce: true
  readonly exactSelectedSceneSequenceComposited: true
  readonly privateInternalReviewEvidencePassed: true
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly furtherRenderAuthorized: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsSourceSequenceOrRenderedVideoBytes: false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport
  extends LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReportDraft {
  readonly reportDigestSha256: string
}
