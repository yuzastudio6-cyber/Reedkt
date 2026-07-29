import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'
import type {
  LivingFrameControlledSdxlGpuOutputEvidenceClass,
} from './living-frame-controlled-sdxl-gpu-output-observation'

export const LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_VERSION =
  'living-frame-controlled-sdxl-rembg-input-binding-v1' as const

export const LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_CLASS =
  'private_opaque_generated_image_reread_for_existing_rembg_operation' as const

export const LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES = [
  'canonical_rembg_generic_opaque_image_source_variant_required',
  'current_rembg_gpu_admission_and_model_mount_reread_required',
  'canonical_rembg_dispatch_completion_and_cost_evidence_required',
  'mask_artifact_commit_and_qa_required',
  'sharp_true_alpha_component_required',
  'multi_background_destination_continuity_and_fact_qa_required',
  'approved_snapshot_work_asset_and_private_review_required',
] as const

export type LivingFrameControlledSdxlRembgInputBindingOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_ISSUES = [
  'input_invalid',
  'observation_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'reader_lineage_invalid',
  'consumer_invalid',
  'consumer_reused',
  'consumer_failed',
  'packet_invalid',
  'packet_lineage_invalid',
  'source_byte_digest_mismatch',
  'decoded_rgba_digest_mismatch',
  'decoded_rgba_shape_invalid',
  'opaque_alpha_policy_invalid',
  'unsafe_binding_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlRembgInputBindingIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_ISSUES)[number]

export interface LivingFrameControlledSdxlRembgInputBindingAuthority {
  readonly privateOpaqueInputRereadAuthority: true
  readonly genericRembgSourceVariantAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly modelArtifactAuthority: false
  readonly toolOperationAuthority: false
  readonly dispatchAuthority: false
  readonly workerCompletionAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly maskArtifactCommitAuthority: false
  readonly maskQaAuthority: false
  readonly alphaComponentAuthority: false
  readonly alphaQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlRembgInputBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_CLASS
  readonly bindingId: string
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly sourceBindings: {
    readonly gpuOutputObservationId: string
    readonly gpuOutputObservationDigestSha256: string
    readonly requestReceiptId: string
    readonly requestReceiptDigestSha256: string
    readonly privateWireRequestDigestSha256: string
    readonly outputArtifactId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly inputReader: {
    readonly evidenceClass:
      LivingFrameControlledSdxlGpuOutputEvidenceClass
    readonly oneShotReaderConsumed: true
    readonly oneShotConsumerConsumed: true
    readonly verifiedBytesDeliveredOutOfBand: true
  }
  readonly verifiedOpaqueInput: {
    readonly sourceVariant:
      'living_frame_generated_opaque_still_png'
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly decodedChannelCount: 4
    readonly transparentPixelCount: 0
    readonly semiTransparentPixelCount: 0
    readonly opaquePixelCount: 1_048_576
    readonly sourceIsFfmpegExtractedFrame: false
    readonly sourceIsCommittedTransparentArtifact: false
  }
  readonly rembgOperationExpectation: {
    readonly canonicalToolId: 'rembg'
    readonly canonicalOperationId:
      'tool.rembg.remove_image_background.v1'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly runtimeRegion: 'europe-west1'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly device: 'cuda'
    readonly modelId: 'u2netp'
    readonly outputMode: 'mask_only_png'
    readonly preserveSourceDimensions: true
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly downstreamContract: {
    readonly sharedCanonicalRembgRuntimeMustAdmitGeneratedOpaqueImageVariant:
      true
    readonly existingSourceFrameOnlyAdmissionCannotBeRelabeledEquivalent:
      true
    readonly expectedMaskContentType: 'image/png'
    readonly expectedMaskEncodingProfile:
      'gray8_mask_png_v1'
    readonly maskDimensionsMustMatchInput: true
    readonly sharpStraightAlphaCompositionRequired: true
  }
  readonly costLineage: {
    readonly comfyuiGpuAttemptNotChargedAgain: true
    readonly rembgIsSeparateCanonicalToolAttempt: true
    readonly rembgAttemptCostOwnedByExistingToolCostAuthority: true
    readonly costAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlRembgInputBindingOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlRembgInputBindingAuthority
  readonly gpuOutputObservationRevalidated: true
  readonly exactOpaqueBytesAndDecodedRgbaReread: true
  readonly exactObservationAndInputLineageMatched: true
  readonly genericRembgSourceVariantAdmitted: false
  readonly rembgRequestCreated: false
  readonly rembgInferenceExecuted: false
  readonly maskArtifactCreated: false
  readonly transparentComponentCreated: false
  readonly containsBytesPathUrlCredentialPromptCommandOrRawMedia:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlRembgInputBinding
  extends LivingFrameControlledSdxlRembgInputBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledSdxlRembgInputBindingIssue {
  readonly code:
    LivingFrameControlledSdxlRembgInputBindingIssueCode
  readonly path: string
}
