export const LIVING_FRAME_CONTROL_IMAGE_CANNY_VERSION =
  'living-frame-control-image-canny-v1' as const

export const LIVING_FRAME_CONTROL_IMAGE_CANNY_CLASS =
  'controlled_deterministic_canny_control_image_reference' as const

export const LIVING_FRAME_CONTROL_IMAGE_CANNY_PROFILE =
  'rgba_black_composite_gaussian3_sobel_nms_hysteresis_v1' as const

export interface LivingFrameControlImageCannyMetrics {
  readonly pixelCount: number
  readonly transparentInputPixelCount: number
  readonly semitransparentInputPixelCount: number
  readonly opaqueInputPixelCount: number
  readonly nonZeroGradientPixelCount: number
  readonly nonMaximumSuppressedPixelCount: number
  readonly strongSeedPixelCount: number
  readonly weakCandidatePixelCount: number
  readonly promotedWeakPixelCount: number
  readonly finalEdgePixelCount: number
  readonly finalEdgeCoverageRatio: number
}

export interface LivingFrameControlImageCannyAuthorityBoundary {
  readonly deterministicReferencePixelProcessingOnly: true
  readonly sourceAnalysisAuthority: false
  readonly semanticControlChoiceAuthority: false
  readonly selectedSceneAuthority: false
  readonly artifactCreationAuthority: false
  readonly artifactCommitmentAuthority: false
  readonly artifactQaAuthority: false
  readonly assetManifestAuthority: false
  readonly modelWeightAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly renderAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlImageCannyReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROL_IMAGE_CANNY_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROL_IMAGE_CANNY_CLASS
  readonly algorithmProfile:
    typeof LIVING_FRAME_CONTROL_IMAGE_CANNY_PROFILE
  readonly sourceArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly measuredSourceRgbaDigestSha256: string
  }
  readonly outputRaster: {
    readonly width: number
    readonly height: number
    readonly pixelFormat: 'rgba8'
    readonly alphaMode: 'opaque'
    readonly measuredOutputRgbaDigestSha256: string
  }
  readonly thresholds: {
    readonly low: number
    readonly high: number
  }
  readonly processingContract: {
    readonly straightAlphaInput: true
    readonly transparentPixelPolicy: 'composite_over_black'
    readonly grayscaleCoefficients: readonly [77, 150, 29]
    readonly gaussianKernel: readonly [1, 2, 1, 2, 4, 2, 1, 2, 1]
    readonly borderPolicy: 'clamp_to_edge'
    readonly gradientOperator: 'sobel_3x3'
    readonly orientationBucketsDegrees: readonly [0, 45, 90, 135]
    readonly nonMaximumSuppression: true
    readonly hysteresisConnectivity: 8
    readonly finalEdgeValue: 255
    readonly finalBackgroundValue: 0
  }
  readonly metrics: LivingFrameControlImageCannyMetrics
  readonly authorityBoundary:
    LivingFrameControlImageCannyAuthorityBoundary
  readonly outputPixelsReturnedOutOfBand: true
  readonly sourcePixelsUnmodified: true
  readonly reportContainsRawPixels: false
  readonly reportContainsPathOrUrl: false
  readonly reportContainsCredentials: false
  readonly controlImageArtifactCreated: false
  readonly passesCanonicalQa: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlImageCannyReport
  extends LivingFrameControlImageCannyReportDraft {
  readonly reportDigestSha256: string
}
