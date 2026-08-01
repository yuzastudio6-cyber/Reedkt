export const LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_VERSION =
  'living-frame-articulated-puppet-remotion-review-internal-test-v1' as const

export const LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_CLASS =
  'actual_private_internal_articulated_puppet_blender_to_remotion_technical_evidence_visual_rejected' as const

export const LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_STATE =
  'articulated_puppet_blender_sequence_technical_pass_professional_visual_rejected' as const

export const LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES = [
  'professional_head_visual_acceptance_failed',
  'source_joint_overlap_and_seam_concealment_redesign_required',
  'ai_2d_complete_keypose_feasibility_required',
  'canonical_approved_snapshot_reconciliation_required',
  'canonical_work_graph_admission_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_qa_approval_required',
  'canonical_private_review_reconciliation_required',
  'canonical_resource_and_actual_cost_receipt_required',
] as const

export interface LivingFrameArticulatedPuppetRemotionReviewChunkReceipt {
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

export interface LivingFrameArticulatedPuppetRemotionReviewInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly fixtureIdentity: {
    readonly sceneId:
      'scene.airship-navigator.spyglass-survey'
    readonly componentId:
      'airship.navigator.character'
    readonly sourceSheetSha256:
      '0a6d52335e32614d57a79ea4f93da81a3a325363aea319d21895cfcddde90b37'
    readonly preparedAlphaAtlasSha256: string
    readonly reviewedPartCount: 8
    readonly disconnectedMeshIslandCount: 8
    readonly rigidWeightedVertexCount: 32
    readonly articulatedBoneCount: 8
    readonly armIkChainLength: 3
    readonly genericWholeImageDeformationUsed:
      false
    readonly controlledGenerationUsedForIntermediateFrames:
      false
  }
  readonly sourceBindings: {
    readonly puppetSheetReceiptDigestSha256:
      string
    readonly characterAnimationRouteDecisionDigestSha256:
      string
    readonly riggingAdapterCandidateRequestDigestSha256:
      string
    readonly rigActionPlanDigestSha256: string
    readonly blenderPayloadDigestSha256: string
    readonly blenderResultDigestSha256: string
    readonly rgbaSequenceDigestSha256: string
    readonly selectedSceneBindingDigestSha256:
      string
    readonly currentMasterTimingDigestSha256:
      string
    readonly confirmedOutputFrameDigestSha256:
      string
    readonly finalPackagedReviewDigestSha256:
      string
  }
  readonly compositionIdentity: {
    readonly styleProfile:
      'cinematic_airship_navigation_2_5d_internal_review_v1'
    readonly sourceComponentWidthPixels: 1920
    readonly sourceComponentHeightPixels: 1080
    readonly sourceComponentAspectRatio: '16:9'
    readonly internalReviewWidthPixels: 640
    readonly internalReviewHeightPixels: 360
    readonly internalReviewIsBoundedProxy:
      true
    readonly exactConfirmedAspectRatioPreserved:
      true
    readonly internalReviewIsFinalCustomerCanvas:
      false
    readonly fps: 30
    readonly selectedStartFrame: 12
    readonly selectedEndFrameExclusive: 72
    readonly selectedDurationFrames: 60
    readonly finalReviewDurationFrames: 60
    readonly frameImageCount: 60
    readonly remotionChunkCount: 4
    readonly maximumOverlaysPerChunk: 16
    readonly localMinimumRenderDurationFrames:
      24
    readonly overlayAdapter:
      'bounded_remotion_chunks_with_exact_frame_packaging_v1'
    readonly packagingTool: 'ffmpeg'
    readonly packagingOnly: true
    readonly sourcePlateRole:
      'internal_navigation_grid_context'
    readonly captionPlaneRole:
      'internal_review_title_bar'
    readonly everyFinalReviewFrameCompositedByRemotion:
      true
    readonly captionsRemainAboveLivingFrame:
      true
    readonly remotionRemainsFinalCanvas: true
  }
  readonly chunkReceipts:
    readonly LivingFrameArticulatedPuppetRemotionReviewChunkReceipt[]
  readonly persistedPrivateReviewArtifact: {
    readonly persistenceOwner:
      'canonical_private_remotion_artifact_storage'
    readonly contentType: 'video/mp4'
    readonly privateObjectIdentityHash: string
    readonly byteLength: number
    readonly sha256: string
    readonly createOnlyPersistenceUsed: true
    readonly replayed: false
    readonly exactPrivateReadbackVerified:
      true
    readonly privatePlaybackLeaseIssued:
      true
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
    readonly probeEvidenceDigestSha256:
      string
  }
  readonly renderedVisualQa: {
    readonly sampleFrames:
      readonly [0, 30, 59]
    readonly firstPoseSubjectPixelCount:
      number
    readonly middlePoseSubjectPixelCount:
      number
    readonly finalPoseSubjectPixelCount:
      number
    readonly middlePoseDifferentPixelCount:
      number
    readonly firstFinalMeanAbsoluteDifference:
      number
    readonly primaryMotionVisible: true
    readonly requiredReturnToInitialPoseVisible:
      true
    readonly sourcePlateVisibleAcrossSamples:
      true
    readonly captionPlaneVisibleAcrossSamples:
      true
    readonly livingFrameRemainsBelowCaptionPlane:
      true
    readonly exactSelectedFrameOrderPreserved:
      true
    readonly automatedCompositionMetricsPassed:
      true
    readonly headVisualReviewPerformed: true
    readonly professionalVisualAcceptancePassed:
      false
    readonly visualReviewDisposition:
      'rejected'
    readonly rejectionReasonCodes: readonly [
      'visible_joint_socket_artwork',
      'articulated_limb_reads_as_disconnected_segments',
      'limb_extension_exceeds_believable_anatomy',
      'hand_prop_attachment_is_unclear',
      'detached_coat_flap_reads_as_floating',
    ]
  }
  readonly runtimeIdentity: {
    readonly blenderToolId: 'blender'
    readonly blenderOperationId:
      'tool.blender.render_living_frame_component_rig.v1'
    readonly remotionToolId: 'remotion'
    readonly remotionOperationId:
      'tool.remotion.render_approved_composition.v1'
    readonly remotionPackageName:
      'remotion+@remotion/renderer'
    readonly remotionPackageVersion: '4.0.487'
    readonly actualRemotionRenderCount: 4
    readonly ffmpegPackagingExecuted: true
    readonly sharedRuntimeSourceMutated:
      false
    readonly existingCanonicalRemotionRuntimeReused:
      true
  }
  readonly authorityBoundary: {
    readonly privateInternalRemotionReviewEvidenceAuthority:
      true
    readonly fixturePlaybackLeaseAuthority:
      true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly canonicalArtifactAuthority:
      false
    readonly assetManifestAuthority: false
    readonly finalRendererAuthority: false
    readonly canonicalQaApprovalAuthority:
      false
    readonly privateReviewApprovalAuthority:
      false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES
  readonly exactEightPartBlenderSequenceRevalidated:
    true
  readonly exactSelectedSceneSequenceComposited:
    true
  readonly privateInternalTechnicalExecutionPassed:
    true
  readonly privateInternalReviewEvidencePassed:
    false
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly furtherRenderAuthorized: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsSourceSequenceOrRenderedVideoBytes:
    false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment:
    false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameArticulatedPuppetRemotionReviewInternalTestReport
  extends LivingFrameArticulatedPuppetRemotionReviewInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameArticulatedPuppetPrivatePlaybackLease {
  readonly leaseClass:
    'process_bound_single_use_living_frame_articulated_puppet_private_playback_lease_v1'
  readonly leaseId: string
  readonly reportDigestSha256: string
  readonly privateObjectIdentityHash: string
  readonly contentType: 'video/mp4'
  readonly byteLength: number
  readonly sha256: string
  readonly callerSerializable: false
  readonly canonicalArtifactAuthority: false
  readonly assetManifestAuthority: false
  readonly canonicalQaApprovalAuthority: false
  readonly privateReviewApprovalAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameArticulatedPuppetRemotionReviewInternalTestExecution {
  readonly report:
    LivingFrameArticulatedPuppetRemotionReviewInternalTestReport
  readonly privatePlaybackLease:
    LivingFrameArticulatedPuppetPrivatePlaybackLease
}
