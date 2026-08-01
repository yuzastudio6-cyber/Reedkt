import type {
  LivingFrameAlphaFindingCode,
  LivingFrameAlphaMeasurementReport,
} from './living-frame-alpha-measurement'

export const LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_VERSION =
  'living-frame-destination-composite-measurement-v1' as const

export const LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_CLASS =
  'private_internal_non_promotable_destination_composite_measurement' as const

export const LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_STATES = [
  'measurement_clear_pending_canonical_qa',
  'blocked_by_destination_composite_findings',
] as const

export type LivingFrameDestinationCompositeMeasurementState =
  (typeof LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_STATES)[number]

export const LIVING_FRAME_DESTINATION_COMPOSITE_BLOCKING_FINDINGS = [
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
] as const satisfies readonly LivingFrameAlphaFindingCode[]

export type LivingFrameDestinationCompositeBlockingFinding =
  (typeof LIVING_FRAME_DESTINATION_COMPOSITE_BLOCKING_FINDINGS)[number]

export const LIVING_FRAME_DESTINATION_COMPOSITE_OPEN_GATES = [
  'canonical_component_artifact_reread_required',
  'canonical_destination_frame_reread_required',
  'canonical_asset_quality_gate_interpretation_required',
  'canonical_continuity_and_documentary_fact_review_required',
  'canonical_private_review_required',
  'canonical_scene_evidence_and_remotion_reconciliation_required',
] as const

export type LivingFrameDestinationCompositeOpenGate =
  (typeof LIVING_FRAME_DESTINATION_COMPOSITE_OPEN_GATES)[number]

export interface LivingFrameDestinationCompositeMeasurementAuthority {
  readonly measurementOnly: true
  readonly sourceTruthAuthority: false
  readonly identityAuthority: false
  readonly continuityQaAuthority: false
  readonly documentaryFactAuthority: false
  readonly artifactQaAuthority: false
  readonly finalQaAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly toolRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly assetManifestAuthority: false
  readonly privateReviewAuthority: false
  readonly rendererAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameDestinationCompositeMeasurementDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_VERSION
  readonly evidenceClass:
    typeof LIVING_FRAME_DESTINATION_COMPOSITE_MEASUREMENT_CLASS
  readonly measurementId: string
  readonly measurementState:
    LivingFrameDestinationCompositeMeasurementState
  readonly sceneBinding: {
    readonly sceneId: string
    readonly componentId: string
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
    readonly masterTimingPlanId: string
    readonly masterTimingDigestSha256: string
    readonly destinationFrameIndex: number
  }
  readonly sourceBindings: {
    readonly generatedStillArtifactQaProjectionId: string
    readonly generatedStillArtifactQaProjectionDigestSha256: string
    readonly baseAlphaMeasurementReportDigestSha256: string
  }
  readonly componentArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly decodedRgbaDigestSha256: string
    readonly width: number
    readonly height: number
    readonly alphaMode: 'straight_alpha'
  }
  readonly destinationFrame: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly decodedRgbDigestSha256: string
    readonly width: number
    readonly height: number
    readonly frameIndex: number
  }
  readonly destinationAlphaMeasurementReport:
    LivingFrameAlphaMeasurementReport
  readonly destinationComposite: {
    readonly backgroundId: 'destination_raster'
    readonly edgeSampleCount: number
    readonly meanEdgeContrast: number | null
    readonly lowContrastEdgeRatio: number | null
  }
  readonly blockingFindingCodes:
    readonly LivingFrameDestinationCompositeBlockingFinding[]
  readonly openGateCodes:
    readonly LivingFrameDestinationCompositeOpenGate[]
  readonly authorityBoundary:
    LivingFrameDestinationCompositeMeasurementAuthority
  readonly containsRawPixelsPathsUrlsCredentialsPromptsOrCommands: false
  readonly canonicalQaPassed: false
  readonly assetManifestUpdated: false
  readonly sceneEvidenceReconciled: false
  readonly remotionAuthorized: false
  readonly productionReady: false
}

export interface LivingFrameDestinationCompositeMeasurement
  extends LivingFrameDestinationCompositeMeasurementDraft {
  readonly measurementDigestSha256: string
}
