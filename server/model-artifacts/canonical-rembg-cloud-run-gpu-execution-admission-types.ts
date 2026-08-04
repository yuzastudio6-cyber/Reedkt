import type {
  CanonicalModelArtifactGpuBundle,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalRembgGpuBundleRequirementProjection,
  CanonicalRembgModelArtifactRequirementSet,
} from './canonical-rembg-model-artifact-requirement-types'
import type {
  CanonicalRembgExactSourceFrameArtifactBinding,
} from './canonical-rembg-exact-source-frame-artifact-binding-types'

export const CANONICAL_REMBG_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION =
  'canonical-rembg-cloud-run-gpu-execution-admission-candidate-v1' as const

export interface CanonicalRembgSourceFrameExpectationInput {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly sourceCleanupDecisionId: string
  readonly masterFrameIndex: number
  readonly sourceFrameIndex: number
  readonly frameRate: number
  readonly frameSelectionPolicy:
    'scene_start_meaning_anchor_v1'
  readonly sourceFrameSelectionDigestSha256: string
  readonly sourceMediaContentSha256: string
  readonly sourceMediaByteLength: number
  readonly sourceMediaContentType:
    | 'video/mp4'
    | 'video/quicktime'
  readonly sourceBindingHash: string
  readonly storageIdentityHash: string
  readonly frameExtractionWorkItemKey: string
  readonly frameExtractionWorkItemDigestSha256: string
  readonly frameExtractionOperation:
    'extract_approved_exact_source_frame_png'
  readonly frameExtractionRecipeProfileId:
    'approved_exact_source_frame_png_v1'
  readonly frameExtractionToolId: 'ffmpeg'
  readonly frameExtractionToolOperationId:
    'tool.ffmpeg.execute_approved_media_recipe.v1'
  readonly frameExtractionOutputKey: string
  readonly frameExtractionDependencyJobId: string
  readonly frameExtractionExecutionAttemptId: string
  readonly frameExtractionSourceLeaseImmutableHash: string
  readonly frameExtractionDependencyReadEvidenceHash: string
  readonly frameArtifactId: string
  readonly frameArtifactAssetId: string
  readonly frameArtifactVersion: number
  readonly frameArtifactType:
    'approved_exact_source_frame_png'
  readonly frameArtifactContentType: 'image/png'
  readonly frameArtifactSha256: string
  readonly frameArtifactByteLength: number
  readonly frameWidth: number
  readonly frameHeight: number
  readonly frameDecodedRgbaSha256: string
  readonly frameOpaquePixelCount: number
}

export interface CanonicalRembgSourceFrameExpectation
  extends CanonicalRembgSourceFrameExpectationInput {
  readonly artifactKind: 'image'
  readonly frameDerivationPolicy:
    'canonical_ffmpeg_exact_decoded_source_frame_rgba_png_v1'
  readonly sourceFrameExpectationDigestSha256: string
}

export interface CanonicalRembgOperationSettings {
  readonly device: 'cuda'
  readonly modelId: 'u2netp'
  readonly outputMode: 'mask_only_png'
  readonly confidenceThreshold: 0.5
  readonly alphaMatteMode: 'straight'
  readonly edgeRefinementProfileId:
    'approved_u2netp_default_v1'
  readonly maximumSubjects: 1
  readonly preserveSourceDimensions: true
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
}

export interface CanonicalRembgCloudRunGpuExecutionAdmissionCandidate {
  readonly admissionVersion:
    typeof CANONICAL_REMBG_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION
  readonly admissionClass:
    'controlled_non_executable_rembg_gpu_source_frame_preflight'
  readonly admissionId: string
  readonly identity: {
    readonly approvedToolId: 'rembg'
    readonly approvedOperationId:
      'tool.rembg.remove_image_background.v1'
    readonly requirementSetDigestSha256: string
    readonly requirementProjectionDigestSha256: string
    readonly gpuBundleDigestSha256: string
    readonly gpuBundleRequirementsDigestSha256: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly creditEstimateId: string
    readonly creditReservationId: string
    readonly workerLeaseId: string
    readonly idempotencyKey: string
    readonly modelManifestId: string
    readonly sourceFrameArtifactBindingDigestSha256: string
    readonly operationRequestDigestSha256: string
  }
  readonly modelArtifactBinding: {
    readonly artifactCount: 1
    readonly slotId: 'rembg_u2netp_onnx'
    readonly artifactRecordId: string
    readonly artifactId: 'rembg-u2netp-onnx'
    readonly revision:
      'rembg-v0.0.0-u2netp-309c8469258d'
    readonly modelFamily: 'u2netp'
    readonly byteLength: 4_574_861
    readonly contentSha256:
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
    readonly consumerScope: 'rembg.private-inference'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly cloudRunAccelerator: 'nvidia_l4'
    readonly modelAccelerator: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly source: CanonicalRembgSourceFrameExpectation
  readonly settings: CanonicalRembgOperationSettings
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'mask_image'
      readonly contentType: 'image/png'
      readonly encodingProfile:
        'gray8_or_rgba_alpha_mask_png_v1'
      readonly dimensionsMustMatchSourceFrame: true
      readonly trueAlphaOrMaskVariationRequired: true
      readonly privateArtifactRequired: true
    },
  ]
  readonly processBoundEvidenceReceipts: readonly [
    {
      readonly canonicalOrder: 0
      readonly evidenceKind: 'mask_analysis_receipt'
      readonly encodingProfile:
        'rembg_u2netp_mask_analysis_receipt_v1'
      readonly digestOnly: true
      readonly persistedAsCustomerAsset: false
    },
    {
      readonly canonicalOrder: 1
      readonly evidenceKind: 'mask_qa_measurement_receipt'
      readonly encodingProfile:
        'rembg_mask_qa_measurement_receipt_v1'
      readonly digestOnly: true
      readonly persistedAsCustomerAsset: false
    },
  ]
  readonly requiredQaGates: readonly [
    'mask_edge_quality',
    'mask_subject_coverage',
  ]
  readonly summary: {
    readonly exactModelArtifactIdentityMatched: true
    readonly exactCloudRunGpuAttemptIdentityMatched: true
    readonly exactSourceMediaAndFrameLineageMatched: true
    readonly exactCanonicalSourceFrameExtractionArtifactMatched: true
    readonly exactGpuOnlySettingsMatched: true
    readonly exactSingleMaskArtifactAndProcessEvidenceContractDeclared:
      true
    readonly sourceMasterFrameIndex: number
    readonly sourceFrameIndex: number
    readonly frameWidth: number
    readonly frameHeight: number
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly exactFiftyToolRegistryPreserved: true
    readonly canonicalOperationArtifactSetVerified: false
    readonly freshRepositoryByteRehashRequired: true
    readonly approvedPackageRereadRequired: true
    readonly approvedSnapshotRereadRequired: true
    readonly workerLeaseRereadRequired: true
    readonly sourceMediaArtifactRereadRequired: true
    readonly sourceFrameExtractionArtifactAdmissionVerified: true
    readonly sourceFrameExtractionArtifactRereadRequired: true
    readonly cloudRunReadOnlyModelMountVerified: false
    readonly cloudRunCudaRuntimeImageVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly dependencyLockVerified: false
    readonly onnxCudaProviderLoadVerified: false
    readonly u2netpInferenceVerified: false
    readonly privateMaskOutputArtifactVerified: false
    readonly maskQaVerified: false
    readonly paidProductionOwnerApproval: false
    readonly existingCpuFixtureProductionAuthority: false
    readonly callerBytesAccepted: false
    readonly callerPathAccepted: false
    readonly callerUrlAccepted: false
    readonly rawChatAccepted: false
    readonly arbitrarySettingsAccepted: false
    readonly arbitraryModelAccepted: false
    readonly cpuExecutionAccepted: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerCostAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly admissionDigestSha256: string
}

export interface CanonicalRembgCloudRunGpuExecutionAdmissionCandidateInput {
  readonly requirementSet:
    CanonicalRembgModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalRembgGpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly sourceArtifactBinding:
    CanonicalRembgExactSourceFrameArtifactBinding
  readonly operationRequest: unknown
}

export interface CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput {
  readonly value: unknown
  readonly requirementSet:
    CanonicalRembgModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalRembgGpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly sourceArtifactBinding:
    CanonicalRembgExactSourceFrameArtifactBinding
  readonly operationRequest: unknown
}
