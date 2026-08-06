export const LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_VERSION =
  'living-frame-visual-continuity-measurement-v1' as const

export const LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_PROFILE =
  'aligned_rgba_component_comparison_v1' as const

export const LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_CLASS =
  'controlled_non_promotable_visual_continuity_measurement' as const

export const LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE =
  'aligned_same_view_component' as const

export const LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES = [
  'empty_reference_or_candidate',
  'silhouette_overlap_low',
  'silhouette_coverage_drift_high',
  'silhouette_centroid_shift_high',
  'alpha_distribution_drift_high',
  'alpha_boundary_drift_high',
  'palette_drift_high',
  'luminance_drift_high',
  'overlap_color_drift_high',
] as const
export type LivingFrameVisualContinuityFindingCode =
  (typeof LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES)[number]

export interface LivingFrameVisualContinuityMeasurementAuthorityBoundary {
  readonly measurementOnly: true
  readonly identityVerificationAuthority: false
  readonly likenessSafetyAuthority: false
  readonly documentaryFactAuthority: false
  readonly continuityQaAuthority: false
  readonly visualQaAuthority: false
  readonly planningAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly timingAuthority: false
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

export interface LivingFrameVisualContinuityArtifactIdentity {
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly measuredRgbaDigestSha256: string
}

export interface LivingFrameVisualContinuityMetrics {
  readonly pixelCount: number
  readonly referenceVisiblePixelCount: number
  readonly candidateVisiblePixelCount: number
  readonly exactRgbaMatch: boolean
  readonly binarySilhouetteIntersectionOverUnion: number | null
  readonly weightedCoverageChangeRatio: number
  readonly normalizedCentroidShift: number | null
  readonly meanAbsoluteAlphaDelta: number
  readonly alphaBoundaryDisagreementRatio: number | null
  readonly normalizedRgbHistogramDistance: number | null
  readonly normalizedLuminanceHistogramDistance: number | null
  readonly normalizedOverlapRgbDelta: number | null
}

export interface LivingFrameVisualContinuityMeasurementReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_VERSION
  readonly measurementProfile:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_PROFILE
  readonly measurementClass:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_CLASS
  readonly comparisonMode:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE
  readonly dimensions: {
    readonly width: number
    readonly height: number
  }
  readonly referenceArtifact: LivingFrameVisualContinuityArtifactIdentity
  readonly candidateArtifact: LivingFrameVisualContinuityArtifactIdentity
  readonly metrics: LivingFrameVisualContinuityMetrics
  readonly findingCodes:
    readonly LivingFrameVisualContinuityFindingCode[]
  readonly authorityBoundary:
    LivingFrameVisualContinuityMeasurementAuthorityBoundary
  readonly containsRawPixels: false
  readonly containsPathOrUrl: false
  readonly containsCredentials: false
}

export interface LivingFrameVisualContinuityMeasurementReport
  extends LivingFrameVisualContinuityMeasurementReportDraft {
  readonly reportDigestSha256: string
}
