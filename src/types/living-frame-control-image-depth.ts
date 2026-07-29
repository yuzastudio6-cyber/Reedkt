export const LIVING_FRAME_CONTROL_IMAGE_DEPTH_VERSION =
  'living-frame-control-image-depth-v1' as const

export const LIVING_FRAME_CONTROL_IMAGE_DEPTH_CLASS =
  'controlled_deterministic_depth_control_image_reference' as const

export const LIVING_FRAME_CONTROL_IMAGE_DEPTH_PROFILE =
  'uint16_linear_near_white_opaque_rgba_v1' as const

export interface LivingFrameControlImageDepthMetrics {
  readonly pixelCount: number
  readonly minimumDepthSample: number
  readonly maximumDepthSample: number
  readonly nonZeroSampleCount: number
  readonly fullScaleSampleCount: number
  readonly meanNormalizedDepth: number
  readonly dynamicRange: number
}

export interface LivingFrameControlImageDepthAuthorityBoundary {
  readonly deterministicReferencePixelProcessingOnly: true
  readonly depthEstimationAuthority: false
  readonly depthEvidenceAuthority: false
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

export interface LivingFrameControlImageDepthReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROL_IMAGE_DEPTH_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROL_IMAGE_DEPTH_CLASS
  readonly algorithmProfile:
    typeof LIVING_FRAME_CONTROL_IMAGE_DEPTH_PROFILE
  readonly sourceArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
  }
  readonly depthSamplePacket: {
    readonly packetId: string
    readonly measuredPacketDigestSha256: string
    readonly sampleEncoding: 'uint16_big_endian_digest'
    readonly coordinateSystem: 'output_frame_raster_order'
    readonly polarity: 'larger_value_is_nearer'
  }
  readonly outputRaster: {
    readonly width: number
    readonly height: number
    readonly pixelFormat: 'rgba8'
    readonly alphaMode: 'opaque'
    readonly measuredOutputRgbaDigestSha256: string
  }
  readonly processingContract: {
    readonly normalization: 'uint16_full_range_to_uint8_round_nearest'
    readonly nearColor: readonly [255, 255, 255, 255]
    readonly farColor: readonly [0, 0, 0, 255]
    readonly channelMapping: 'equal_rgb'
    readonly alphaValue: 255
  }
  readonly metrics: LivingFrameControlImageDepthMetrics
  readonly authorityBoundary:
    LivingFrameControlImageDepthAuthorityBoundary
  readonly outputPixelsReturnedOutOfBand: true
  readonly inputDepthSamplesRetained: false
  readonly reportContainsRawDepthOrPixels: false
  readonly reportContainsPathOrUrl: false
  readonly reportContainsCredentialsOrRawInstructions: false
  readonly depthControlImageArtifactCreated: false
  readonly passesCanonicalQa: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlImageDepthReport
  extends LivingFrameControlImageDepthReportDraft {
  readonly reportDigestSha256: string
}
