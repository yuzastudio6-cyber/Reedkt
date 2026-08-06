export const LIVING_FRAME_ALPHA_MEASUREMENT_VERSION =
  'living-frame-alpha-measurement-v1' as const

export const LIVING_FRAME_ALPHA_MEASUREMENT_PROFILE =
  'fixed_rgba_artifact_measurement_v1' as const

export const LIVING_FRAME_ALPHA_MEASUREMENT_EVIDENCE_CLASS =
  'controlled_non_promotable_alpha_measurement' as const

export const LIVING_FRAME_ALPHA_EXPECTATIONS = [
  'alpha_required',
  'opaque_plate_expected',
] as const
export type LivingFrameAlphaExpectation =
  (typeof LIVING_FRAME_ALPHA_EXPECTATIONS)[number]

export const LIVING_FRAME_ALPHA_MODES = [
  'straight_alpha',
  'premultiplied_alpha',
] as const
export type LivingFrameMeasuredAlphaMode =
  (typeof LIVING_FRAME_ALPHA_MODES)[number]

export const LIVING_FRAME_ALPHA_BACKGROUND_IDS = [
  'black',
  'white',
  'mid_gray',
  'saturated_red',
  'destination_raster',
] as const
export type LivingFrameAlphaBackgroundId =
  (typeof LIVING_FRAME_ALPHA_BACKGROUND_IDS)[number]

export const LIVING_FRAME_ALPHA_FINDING_CODES = [
  'alpha_channel_variation_present',
  'alpha_channel_fully_opaque',
  'alpha_channel_fully_transparent',
  'opaque_rectangle_detected',
  'checkerboard_encoded_as_pixels_suspected',
  'matte_edge_contamination_suspected',
  'premultiplied_alpha_violation',
  'alpha_bounds_touch_all_edges',
  'insufficient_transparent_margin',
  'edge_discontinuity_high',
  'destination_edge_contrast_low',
] as const
export type LivingFrameAlphaFindingCode =
  (typeof LIVING_FRAME_ALPHA_FINDING_CODES)[number]

export interface LivingFrameAlphaMeasurementAuthorityBoundary {
  readonly measurementOnly: true
  readonly planningAuthority: false
  readonly qaAuthority: false
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
  readonly renderAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAlphaPixelBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly touchesTop: boolean
  readonly touchesRight: boolean
  readonly touchesBottom: boolean
  readonly touchesLeft: boolean
}

export interface LivingFrameAlphaDistributionMeasurement {
  readonly pixelCount: number
  readonly transparentPixelCount: number
  readonly semiTransparentPixelCount: number
  readonly opaquePixelCount: number
  readonly transparentPixelRatio: number
  readonly semiTransparentPixelRatio: number
  readonly opaquePixelRatio: number
  readonly alphaCoverageRatio: number
  readonly borderPixelCount: number
  readonly borderTransparentRatio: number
  readonly borderOpaqueRatio: number
  readonly nonTransparentBounds: LivingFrameAlphaPixelBounds | null
}

export interface LivingFrameAlphaEdgeMeasurement {
  readonly edgeSampleCount: number
  readonly matteColorProvided: boolean
  readonly matteSuspectPixelRatio: number | null
  readonly premultipliedViolationRatio: number | null
  readonly alphaTransitionSampleCount: number
  readonly abruptTransitionRatio: number
  readonly twoToneOpaquePatternScore: number
}

export interface LivingFrameAlphaCompositeMeasurement {
  readonly backgroundId: LivingFrameAlphaBackgroundId
  readonly edgeSampleCount: number
  readonly meanEdgeContrast: number | null
  readonly lowContrastEdgeRatio: number | null
}

export interface LivingFrameAlphaMeasurementReportDraft {
  readonly contractVersion: typeof LIVING_FRAME_ALPHA_MEASUREMENT_VERSION
  readonly measurementProfile: typeof LIVING_FRAME_ALPHA_MEASUREMENT_PROFILE
  readonly evidenceClass: typeof LIVING_FRAME_ALPHA_MEASUREMENT_EVIDENCE_CLASS
  readonly artifactIdentity: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly measuredRgbaDigestSha256: string
    readonly frameIndex: number | null
  }
  readonly raster: {
    readonly width: number
    readonly height: number
    readonly alphaMode: LivingFrameMeasuredAlphaMode
    readonly alphaExpectation: LivingFrameAlphaExpectation
  }
  readonly distribution: LivingFrameAlphaDistributionMeasurement
  readonly edge: LivingFrameAlphaEdgeMeasurement
  readonly compositeContext: {
    readonly destinationRasterProvided: boolean
    readonly destinationRgbDigestSha256: string | null
  }
  readonly composites: readonly LivingFrameAlphaCompositeMeasurement[]
  readonly findingCodes: readonly LivingFrameAlphaFindingCode[]
  readonly authorityBoundary: LivingFrameAlphaMeasurementAuthorityBoundary
  readonly containsRawPixels: false
  readonly containsPathOrUrl: false
  readonly containsCredentials: false
}

export interface LivingFrameAlphaMeasurementReport
  extends LivingFrameAlphaMeasurementReportDraft {
  readonly reportDigestSha256: string
}
