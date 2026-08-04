export const LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_VERSION =
  'living-frame-temporal-mask-measurement-v1' as const

export const LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_PROFILE =
  'contiguous_mask_sequence_measurement_v1' as const

export const LIVING_FRAME_TEMPORAL_MASK_EVIDENCE_CLASS =
  'controlled_non_promotable_temporal_mask_measurement' as const

export const LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES = [
  'frame_count_insufficient',
  'empty_mask_frame_present',
  'full_frame_mask_present',
  'mask_touches_all_edges',
  'coverage_jump_high',
  'centroid_jitter_high',
  'mask_overlap_low',
  'boundary_crawl_high',
  'alpha_flicker_high',
] as const
export type LivingFrameTemporalMaskFindingCode =
  (typeof LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES)[number]

export interface LivingFrameTemporalMaskMeasurementAuthorityBoundary {
  readonly measurementOnly: true
  readonly planningAuthority: false
  readonly qaAuthority: false
  readonly fallbackAuthority: false
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

export interface LivingFrameTemporalMaskArtifactIdentity {
  readonly frameIndex: number
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly measuredAlphaDigestSha256: string
}

export interface LivingFrameTemporalMaskFrameMeasurement {
  readonly frameIndex: number
  readonly weightedCoverageRatio: number
  readonly binaryCoverageRatio: number
  readonly weightedCentroidX: number | null
  readonly weightedCentroidY: number | null
  readonly emptyMask: boolean
  readonly fullFrameMask: boolean
  readonly touchesAllEdges: boolean
}

export interface LivingFrameTemporalMaskPairMeasurement {
  readonly fromFrameIndex: number
  readonly toFrameIndex: number
  readonly weightedCoverageChangeRatio: number
  readonly normalizedCentroidShift: number | null
  readonly binaryIntersectionOverUnion: number | null
  readonly changedPixelRatio: number
  readonly meanAbsoluteAlphaDelta: number
  readonly boundaryDisagreementRatio: number | null
}

export interface LivingFrameTemporalMaskAggregateMeasurement {
  readonly pairCount: number
  readonly maximumCoverageChangeRatio: number
  readonly p95CoverageChangeRatio: number
  readonly maximumNormalizedCentroidShift: number | null
  readonly p95NormalizedCentroidShift: number | null
  readonly minimumBinaryIntersectionOverUnion: number | null
  readonly p05BinaryIntersectionOverUnion: number | null
  readonly maximumChangedPixelRatio: number
  readonly p95MeanAbsoluteAlphaDelta: number
  readonly maximumBoundaryDisagreementRatio: number | null
  readonly p95BoundaryDisagreementRatio: number | null
}

export interface LivingFrameTemporalMaskMeasurementReportDraft {
  readonly contractVersion: typeof LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_VERSION
  readonly measurementProfile: typeof LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_PROFILE
  readonly evidenceClass: typeof LIVING_FRAME_TEMPORAL_MASK_EVIDENCE_CLASS
  readonly sequenceIdentity: {
    readonly sequenceId: string
    readonly width: number
    readonly height: number
    readonly firstFrameIndex: number
    readonly lastFrameIndex: number
    readonly frameCount: number
    readonly frameSetDigestSha256: string
  }
  readonly frameArtifacts: readonly LivingFrameTemporalMaskArtifactIdentity[]
  readonly frames: readonly LivingFrameTemporalMaskFrameMeasurement[]
  readonly pairs: readonly LivingFrameTemporalMaskPairMeasurement[]
  readonly aggregate: LivingFrameTemporalMaskAggregateMeasurement
  readonly findingCodes: readonly LivingFrameTemporalMaskFindingCode[]
  readonly authorityBoundary: LivingFrameTemporalMaskMeasurementAuthorityBoundary
  readonly containsRawMaskBytes: false
  readonly containsPathOrUrl: false
  readonly containsCredentials: false
}

export interface LivingFrameTemporalMaskMeasurementReport
  extends LivingFrameTemporalMaskMeasurementReportDraft {
  readonly reportDigestSha256: string
}
