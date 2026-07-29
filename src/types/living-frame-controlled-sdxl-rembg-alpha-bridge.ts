import type {
  LivingFrameAlphaFindingCode,
  LivingFrameAlphaMeasurementReport,
} from './living-frame-alpha-measurement'

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_VERSION =
  'living-frame-controlled-sdxl-rembg-alpha-bridge-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_RESULT_CLASS =
  'private_internal_generated_still_sharp_alpha_observation' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_EVIDENCE_CLASSES = [
  'controlled_non_promotable_generated_still_sharp_alpha_fixture',
  'private_internal_generated_still_sharp_alpha_observation_unreleased',
] as const

export type LivingFrameControlledSdxlRembgAlphaBridgeEvidenceClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_EVIDENCE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_ISSUE_CODES = [
  'input_invalid',
  'runtime_receipt_invalid',
  'runtime_lineage_invalid',
  'sharp_dispatch_invalid',
  'sharp_dispatch_replay_forbidden',
  'sharp_operation_mismatch',
  'sharp_port_invalid',
  'sharp_result_invalid',
  'source_lease_invalid',
  'mask_lease_invalid',
  'source_mask_lineage_mismatch',
  'alpha_output_invalid',
  'alpha_measurement_invalid',
  'unsafe_receipt_forbidden',
  'output_lease_invalid',
  'output_lease_reused',
] as const

export type LivingFrameControlledSdxlRembgAlphaBridgeIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_ISSUE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES = [
  'canonical_sharp_generated_still_source_variant_admission_required',
  'canonical_generated_still_source_and_mask_artifact_reread_required',
  'canonical_alpha_component_artifact_commit_required',
  'canonical_alpha_qa_gate_required',
  'destination_composite_continuity_fact_and_private_review_required',
] as const

export type LivingFrameControlledSdxlRembgAlphaBridgeOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES)[number]

export interface LivingFrameControlledSdxlRembgAlphaBridgeAuthority {
  readonly processBoundSourceMaskConsumptionAuthority: true
  readonly namespacedSharpObservationAuthority: true
  readonly alphaMeasurementAuthority: true
  readonly canonicalSourceVariantAuthority: false
  readonly canonicalDispatchAuthority: false
  readonly toolRegistryAuthority: false
  readonly selectedSceneAuthority: false
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
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly alphaQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlRembgAlphaBridgeReceipt {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_RESULT_CLASS
  readonly bridgeObservationId: string
  readonly evidenceClass:
    LivingFrameControlledSdxlRembgAlphaBridgeEvidenceClass
  readonly sourceBindings: {
    readonly rembgRuntimeObservationDigestSha256: string
    readonly rembgInputBindingDigestSha256: string
    readonly generatedOpaqueSourceArtifactId: string
    readonly generatedOpaqueSourceContentSha256: string
    readonly generatedOpaqueDecodedRgbaSha256: string
    readonly rembgMaskContentSha256: string
    readonly rembgMaskDecodedSha256: string
    readonly sharpDispatchConsumptionResponseHash: string
    readonly sharpExecutionAttemptId: string
    readonly approvedPlanSnapshotId: string
    readonly expectedAlphaComponentAssetId: string
  }
  readonly operation: {
    readonly canonicalToolId: 'sharp'
    readonly operationId:
      'tool.sharp.prepare_approved_image_asset.v1'
    readonly imageRecipeId:
      'approved_living_frame_alpha_component_v1'
    readonly sourceVariant:
      'living_frame_generated_opaque_still_png'
    readonly maskVariant: 'verified_rembg_gray8_mask_png'
    readonly outputVariant:
      'living_frame_component_rgba_png'
    readonly outputFormat: 'png'
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly alphaMode: 'straight_alpha'
    readonly transparentRgbCleared: true
    readonly metadataStripped: true
    readonly networkAllowed: false
  }
  readonly packageObservation: {
    readonly packageName: 'sharp'
    readonly packageVersion: '0.35.3'
    readonly actualSharpPackageExecuted: true
    readonly sourceBytesVerified: true
    readonly maskBytesVerified: true
    readonly sourceOpaque: true
    readonly maskGrayscale: true
    readonly alphaDerivedFromMask: true
    readonly sourcePixelsUnmodified: true
  }
  readonly alphaOutput: {
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly transparentPixelCount: number
    readonly partialAlphaPixelCount: number
    readonly opaquePixelCount: number
    readonly outputBytesIncluded: false
  }
  readonly alphaMeasurement: {
    readonly reportDigestSha256: string
    readonly measuredRgbaDigestSha256: string
    readonly findingCodes:
      readonly LivingFrameAlphaFindingCode[]
    readonly alphaQaApproved: false
  }
  readonly costLineage: {
    readonly comfyuiGpuAttemptChargedAgain: false
    readonly rembgGpuAttemptChargedAgain: false
    readonly sharpUsesExistingDeterministicToolCostOwner: true
    readonly actualCostAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly outputLeaseIssued: true
  readonly outputArtifactPersisted: false
  readonly assetManifestUpdated: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly alphaQaPassed: false
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlRembgAlphaBridgeOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlRembgAlphaBridgeAuthority
  readonly productionReady: false
  readonly bridgeObservationDigestSha256: string
}

export interface LivingFrameControlledSdxlRembgAlphaOutputLease {
  readonly leaseClass:
    'process_bound_single_use_unpersisted_generated_still_straight_alpha_png_v1'
  readonly leaseId: string
  readonly bridgeObservationDigestSha256: string
  readonly contentSha256: string
  readonly decodedRgbaSha256: string
  readonly byteLength: number
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly alphaMode: 'straight_alpha'
  readonly callerSerializable: false
  readonly artifactPersistenceAuthority: false
  readonly alphaQaAuthority: false
  readonly renderAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlRembgAlphaOutputLeasePayload {
  readonly alphaPng: Uint8Array
  readonly decodedRgba: Uint8Array
  readonly alphaMeasurementReport:
    LivingFrameAlphaMeasurementReport
  readonly verification: {
    readonly bridgeObservationDigestSha256: string
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly alphaMode: 'straight_alpha'
  }
}
