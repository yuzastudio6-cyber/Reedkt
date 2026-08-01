import type {
  LivingFrameAlphaFindingCode,
} from './living-frame-alpha-measurement'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION =
  'living-frame-controlled-sdxl-gpu-output-observation-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS =
  'private_opaque_output_reread_non_authoritative_observation' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES = [
  'controlled_source_fixture',
  'fixed_gpu_subprocess_unqualified',
] as const

export type LivingFrameControlledSdxlGpuOutputEvidenceClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES = [
  'canonical_comfyui_operation_and_dispatch_receipt_required',
  'canonical_worker_completion_receipt_required',
  'runtime_image_identity_and_gpu_metric_attestation_required',
  'canonical_worker_resource_cost_evidence_required',
  'opaque_source_segmentation_or_matting_required',
  'alpha_edge_decontamination_required',
  'true_alpha_artifact_commit_required',
  'multi_background_and_destination_composite_qa_required',
  'continuity_and_documentary_safety_qa_required',
  'selected_scene_snapshot_work_asset_and_private_review_required',
] as const

export type LivingFrameControlledSdxlGpuOutputObservationOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_ISSUES = [
  'input_invalid',
  'request_receipt_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'reader_lineage_invalid',
  'consumer_invalid',
  'consumer_reused',
  'consumer_failed',
  'output_packet_invalid',
  'output_lineage_invalid',
  'output_bytes_invalid',
  'output_digest_mismatch',
  'output_decode_failed',
  'output_format_invalid',
  'output_dimension_invalid',
  'output_alpha_policy_invalid',
  'alpha_measurement_invalid',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlGpuOutputObservationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_ISSUES)[number]

export interface LivingFrameControlledSdxlGpuOutputObservationAuthority {
  readonly privateOutputRereadAuthority: true
  readonly requestAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly workerCompletionAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactCommitAuthority: false
  readonly segmentationOrMattingAuthority: false
  readonly alphaQaAuthority: false
  readonly continuityQaAuthority: false
  readonly documentarySafetyQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlGpuOutputObservationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS
  readonly observationId: string
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly sourceBindings: {
    readonly requestReceiptId: string
    readonly requestReceiptDigestSha256: string
    readonly privateWireRequestDigestSha256: string
    readonly promptMaterializationDigestSha256: string
    readonly artifactSetDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly outputReader: {
    readonly evidenceClass:
      LivingFrameControlledSdxlGpuOutputEvidenceClass
    readonly oneShotReaderConsumed: true
    readonly oneShotConsumerConsumed: true
    readonly verifiedBytesDeliveredOutOfBand: true
  }
  readonly verifiedOutput: {
    readonly outputArtifactId: string
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly decodedChannelCount: 4
    readonly sourcePngHadAlphaChannel: false
    readonly transparentPixelCount: 0
    readonly semiTransparentPixelCount: 0
    readonly opaquePixelCount: 1_048_576
    readonly alphaMeasurementReportDigestSha256: string
    readonly alphaFindingCodes:
      readonly LivingFrameAlphaFindingCode[]
    readonly alphaDisposition:
      'opaque_generated_source_requires_segmentation_matting_decontamination_and_alpha_qa'
  }
  readonly costLineage: {
    readonly costComponentId:
      'shared_controlled_illustration_gpu_host'
    readonly oneObservedOutputBelongsToOneGpuAttempt: true
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true
    readonly auraFaceCpuMeasurementExcluded: true
    readonly canonicalWorkerResourceCostEvidenceRequired: true
    readonly completedFailedOrUnknownOutcomeNotInferred: true
    readonly actualCostAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlGpuOutputObservationOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlGpuOutputObservationAuthority
  readonly requestReceiptRevalidated: true
  readonly exactRequestAndOutputLineageMatched: true
  readonly exactPrivateOutputBytesRereadAndDecoded: true
  readonly alphaMeasurementRecomputedFromDecodedBytes: true
  readonly outputIsOpaqueSourceOnly: true
  readonly transparentComponentCreated: false
  readonly artifactCommitted: false
  readonly actualAttemptCostEvidenceVerified: false
  readonly selectedSceneCreated: false
  readonly containsOutputBytesPathUrlCredentialPromptAliasOrCommand:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlGpuOutputObservation
  extends LivingFrameControlledSdxlGpuOutputObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameControlledSdxlGpuOutputObservationIssue {
  readonly code:
    LivingFrameControlledSdxlGpuOutputObservationIssueCode
  readonly path: string
}
