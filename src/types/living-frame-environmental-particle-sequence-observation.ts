import type {
  LivingFrameAlphaFindingCode,
  LivingFrameAlphaPixelBounds,
} from './living-frame-alpha-measurement'
import type {
  LivingFrameEnvironmentalParticleEffectFamily,
  LivingFrameEnvironmentalParticleProfileId,
} from './living-frame-environmental-particle-kernel'

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION =
  'living-frame-environmental-particle-sequence-observation-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS =
  'controlled_non_promotable_private_transparent_sequence_measurement_candidate' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE =
  'transparent_sequence_measured_runtime_artifact_qa_review_and_production_unproven' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_OPEN_GATES = [
  'qualified_pixijs_runtime_output_required',
  'canonical_selected_scene_and_timing_binding_required',
  'canonical_create_only_artifact_persistence_required',
  'canonical_asset_manifest_and_work_graph_reconciliation_required',
  'canonical_attempt_cost_receipt_required',
  'canonical_temporal_procedural_alpha_qa_required',
  'canonical_destination_composite_and_caption_safety_qa_required',
  'canonical_remotion_overlay_adapter_required',
  'canonical_private_review_and_release_evidence_required',
] as const

export type LivingFrameEnvironmentalParticleSequenceObservationOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_OPEN_GATES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_ISSUE_CODES = [
  'input_invalid',
  'reader_invalid',
  'output_packet_invalid',
  'materialization_invalid',
  'kernel_candidate_invalid',
  'source_lineage_mismatch',
  'frame_set_invalid',
  'png_structure_invalid',
  'png_dimension_invalid',
  'png_alpha_invalid',
  'png_digest_invalid',
  'alpha_measurement_invalid',
  'temporal_measurement_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameEnvironmentalParticleSequenceObservationIssueCode =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_ISSUE_CODES)[number]

export interface LivingFrameEnvironmentalParticleSequenceObservationAuthority {
  readonly privateSequenceMeasurementAuthority: true
  readonly runtimeOutputAuthority: false
  readonly particleKernelAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly motionBudgetAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolRegistryAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameEnvironmentalParticleFrameObservation {
  readonly order: number
  readonly absoluteFrame: number
  readonly framePngDigestSha256: string
  readonly framePngByteLength: number
  readonly decodedRgbaDigestSha256: string
  readonly alphaMeasurementReportDigestSha256: string
  readonly alphaFindingCodes:
    readonly LivingFrameAlphaFindingCode[]
  readonly transparentPixelCount: number
  readonly semiTransparentPixelCount: number
  readonly opaquePixelCount: number
  readonly alphaCoverageRatio: number
  readonly borderTransparentRatio: number
  readonly nonTransparentBounds:
    LivingFrameAlphaPixelBounds | null
  readonly alphaWeightedCentroid: {
    readonly xNormalized: number | null
    readonly yNormalized: number | null
  }
  readonly expectedActiveParticleCount: number
  readonly fullyTransparentFrameExpected: boolean
  readonly frameExpectationMatched: boolean
}

export interface LivingFrameEnvironmentalParticleSequenceObservationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_CLASS
  readonly observationState:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SEQUENCE_OBSERVATION_STATE
  readonly observationId: string
  readonly serverOwnedOutputLocatorId: string
  readonly sourceBindings: {
    readonly materializationDigestSha256: string
    readonly privateRequestDigestSha256: string
    readonly kernelCandidateDigestSha256: string
    readonly deterministicStateSequenceDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly outputPacketDigestSha256: string
  }
  readonly sequenceIdentity: {
    readonly toolId: 'pixijs'
    readonly candidateOperationId:
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    readonly profileId:
      LivingFrameEnvironmentalParticleProfileId
    readonly effectFamily:
      LivingFrameEnvironmentalParticleEffectFamily
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly frameImageCount: number
    readonly logicalBundleCount: 1
    readonly frameImageContentType: 'image/png'
    readonly alphaMode: 'straight_alpha'
  }
  readonly frameObservations:
    readonly LivingFrameEnvironmentalParticleFrameObservation[]
  readonly aggregateMeasurement: {
    readonly exactFrameSetMeasured: true
    readonly everyPngDecodedFromBytes: true
    readonly everyFrameExactDimension: true
    readonly everyFrameRgbaColorType: true
    readonly everyFrameAlphaMeasured: true
    readonly everyFrameExpectationMatched: true
    readonly firstFrameFullyTransparent: true
    readonly lastFrameFullyTransparent: true
    readonly activeFrameCount: number
    readonly fullyTransparentFrameCount: number
    readonly uniqueFramePngDigestCount: number
    readonly temporalVariationPresent: true
    readonly alphaCentroidMovementPresent: true
    readonly maximumAlphaCoverageRatio: number
    readonly minimumBorderTransparentRatio: number
    readonly noLoopingClaimedFromPixels: false
  }
  readonly evidenceDisposition: {
    readonly outputPacketSource:
      'controlled_non_promotable_fixture'
    readonly privateBytesMeasuredInProcess: true
    readonly byteFreeReceipt: true
    readonly pixiJsEntrypointExecutionProven: false
    readonly qualifiedRuntimeOutputProven: false
    readonly artifactPersisted: false
    readonly createOnlyPersistenceProven: false
    readonly canonicalQaApproved: false
    readonly privateReviewApproved: false
  }
  readonly authorityBoundary:
    LivingFrameEnvironmentalParticleSequenceObservationAuthority
  readonly openGateCodes:
    readonly LivingFrameEnvironmentalParticleSequenceObservationOpenGate[]
  readonly selectedSceneBound: false
  readonly canonicalTimingBound: false
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly rendererMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsRawPixelsOrPngBytes: false
  readonly containsPathsUrlsCredentialsCommandsOrEnvironment: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleSequenceObservation
  extends LivingFrameEnvironmentalParticleSequenceObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameEnvironmentalParticleSequenceObservationIssue {
  readonly code:
    LivingFrameEnvironmentalParticleSequenceObservationIssueCode
  readonly path: string
}
