export const LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION =
  'living-frame-character-pixijs-remotion-composite-internal-test-v1' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS =
  'actual_private_internal_pixijs_whole_character_sequence_composited_by_remotion' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE =
  'passed_actual_pixijs_to_remotion_whole_character_composite' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_VIDEO_LEASE_VERSION =
  'living-frame-character-pixijs-remotion-video-lease-v1' as const

export interface LivingFrameCharacterPixiJsRemotionCompositeInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE
  readonly qualificationId:
    'lf-character-pixijs-remotion-musashi-private-v1'
  readonly sourceBindings: {
    readonly pixiJsRuntimeReportDigestSha256:
      string
    readonly pixiJsSequenceDigestSha256:
      string
    readonly characterAnimationRouteDecisionDigestSha256:
      string
    readonly rejectedSwordArmRouteDecisionDigestSha256:
      string
  }
  readonly compositionIdentity: {
    readonly widthPixels: 640
    readonly heightPixels: 360
    readonly fps: 30
    readonly startFrame: 0
    readonly endFrameExclusive: 120
    readonly finalFrameCount: 120
    readonly pixiJsFrameCount: 120
    readonly remotionChunkCount: 8
    readonly maximumOverlaysPerChunk: 15
    readonly everyFinalFrameUsesExactPixiJsPngBytes:
      true
    readonly captionPlaneAboveLivingFrame:
      true
    readonly remotionRemainsFinalCanvas:
      true
  }
  readonly runtimeIdentity: {
    readonly pixiJsToolId: 'pixijs'
    readonly pixiJsOperationId:
      'tool.pixijs.render_pixi_scene.v1'
    readonly remotionToolId: 'remotion'
    readonly remotionOperationId:
      'tool.remotion.render_approved_composition.v1'
    readonly remotionPackageVersion: '4.0.487'
    readonly actualPixiJsApplicationInitExecuted:
      true
    readonly actualRemotionRenderCount: 8
    readonly actualFfmpegPackagingExecuted:
      true
    readonly actualFfprobeQaExecuted:
      true
  }
  readonly renderedQa: {
    readonly codecName: 'h264'
    readonly pixelFormat: string
    readonly exactDimensionsPassed: true
    readonly exactFrameRatePassed: true
    readonly exactFrameCountPassed: true
    readonly sourcePoseRestoredAtFinalFrame:
      true
    readonly wholeCharacterMotionVisible:
      true
    readonly noArticulatedBodyPartCutOrWarpRouteUsed:
      true
    readonly captionVisibleAboveCharacter:
      true
    readonly captionProtectedRegionStable:
      true
    readonly maximumCaptionProtectedRegionMeanAbsoluteDifference:
      number
    readonly reviewFrameIndexes:
      readonly [0, 52, 119]
    readonly reviewFramePngDigestsSha256:
      readonly [string, string, string]
    readonly firstMiddleDifferentPixelCount:
      number
    readonly firstFinalMeanAbsoluteDifference:
      number
  }
  readonly persistedPrivateArtifact: {
    readonly persistenceOwner:
      'canonical_private_remotion_artifact_storage'
    readonly contentType: 'video/mp4'
    readonly privateObjectIdentityHash:
      string
    readonly byteLength: number
    readonly sha256: string
    readonly createOnlyPersistenceUsed:
      true
    readonly replayed: false
    readonly exactPrivateReadbackVerified:
      true
    readonly rawBytesIncluded: false
    readonly storagePathIncluded: false
  }
  readonly swordActionBoundary: {
    readonly currentSwordArmCompositeRejected:
      true
    readonly requiredRoute:
      'comfyui_controlled_component_preparation'
    readonly downstreamRouteAfterPreparation:
      'pixijs_rigid_cutout'
    readonly independentPerFrameGenerationAllowed:
      false
  }
  readonly authorityBoundary: {
    readonly privateInternalCompositeEvidenceAuthority:
      true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly canonicalArtifactAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority:
      false
    readonly privateReviewApprovalAuthority:
      false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly canonicalDispatchIntegrated: false
  readonly canonicalAssetManifestMutated:
    false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterPixiJsRemotionCompositeInternalTestReport
  extends LivingFrameCharacterPixiJsRemotionCompositeInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameCharacterPixiJsRemotionVideoLease {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_VIDEO_LEASE_VERSION
  readonly leaseId: string
  readonly qualificationId:
    'lf-character-pixijs-remotion-musashi-private-v1'
  readonly reportDigestSha256: string
  readonly outputSha256: string
  readonly outputByteLength: number
  readonly processBound: true
  readonly singleUse: true
  readonly containsRawVideoBytes: false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment:
    false
  readonly dispatchAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterPixiJsRemotionCompositeInternalTestExecution {
  readonly report:
    LivingFrameCharacterPixiJsRemotionCompositeInternalTestReport
  readonly privateVideoLease:
    LivingFrameCharacterPixiJsRemotionVideoLease
}

export interface LivingFrameCharacterPixiJsRemotionPrivateVideoOutput {
  readonly qualificationId:
    'lf-character-pixijs-remotion-musashi-private-v1'
  readonly reportDigestSha256: string
  readonly outputSha256: string
  readonly outputByteLength: number
  readonly widthPixels: 640
  readonly heightPixels: 360
  readonly fps: 30
  readonly frameCount: 120
  readonly mp4Bytes: Uint8Array
}
