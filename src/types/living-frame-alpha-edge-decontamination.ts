export const LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_VERSION =
  'living-frame-alpha-edge-decontamination-v1' as const

export const LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_PROFILE =
  'srgb8_known_matte_unmix_v1' as const

export const LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_RESULT_CLASS =
  'controlled_non_promotable_alpha_edge_processing_result' as const

export const LIVING_FRAME_ALPHA_EDGE_INPUT_MODE =
  'straight_alpha_with_known_matte_contamination' as const

export const LIVING_FRAME_ALPHA_EDGE_OUTPUT_MODE = 'straight_alpha' as const

export const LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES = [
  'no_semitransparent_edge_pixels',
  'low_alpha_recovery_present',
  'transparent_rgb_cleanup_applied',
  'channel_clamping_observed',
  'excessive_channel_clamping_observed',
] as const
export type LivingFrameAlphaEdgeDecontaminationFindingCode =
  (typeof LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES)[number]

export interface LivingFrameAlphaEdgeDecontaminationAuthorityBoundary {
  readonly deterministicProcessingPrimitiveOnly: true
  readonly artifactQaAuthority: false
  readonly planningAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly renderAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAlphaEdgeDecontaminationMetrics {
  readonly pixelCount: number
  readonly transparentPixelCount: number
  readonly semitransparentPixelCount: number
  readonly opaquePixelCount: number
  readonly lowAlphaPixelCount: number
  readonly changedPixelCount: number
  readonly transparentRgbCleanupPixelCount: number
  readonly clampedChannelCount: number
  readonly semitransparentPixelRatio: number
  readonly changedPixelRatio: number
  readonly clampedSemitransparentChannelRatio: number
  readonly maximumRgbChannelDelta: number
  readonly meanSemitransparentRgbChannelDelta: number
}

export interface LivingFrameAlphaEdgeDecontaminationReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_VERSION
  readonly processingProfile:
    typeof LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_PROFILE
  readonly resultClass:
    typeof LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_RESULT_CLASS
  readonly sourceArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly measuredInputRgbaDigestSha256: string
  }
  readonly outputArtifact: {
    readonly measuredOutputRgbaDigestSha256: string
    readonly width: number
    readonly height: number
    readonly inputAlphaMode: typeof LIVING_FRAME_ALPHA_EDGE_INPUT_MODE
    readonly outputAlphaMode: typeof LIVING_FRAME_ALPHA_EDGE_OUTPUT_MODE
    readonly knownSourceMatteRgb: readonly [number, number, number]
  }
  readonly metrics: LivingFrameAlphaEdgeDecontaminationMetrics
  readonly findingCodes:
    readonly LivingFrameAlphaEdgeDecontaminationFindingCode[]
  readonly authorityBoundary:
    LivingFrameAlphaEdgeDecontaminationAuthorityBoundary
  readonly reportContainsRawPixels: false
  readonly reportContainsPathOrUrl: false
  readonly reportContainsCredentials: false
}

export interface LivingFrameAlphaEdgeDecontaminationReport
  extends LivingFrameAlphaEdgeDecontaminationReportDraft {
  readonly reportDigestSha256: string
}
