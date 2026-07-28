import type {
  CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput,
} from './canonical-rembg-cloud-run-gpu-execution-admission-types'

export const CANONICAL_REMBG_GPU_RUNTIME_RESULT_CANDIDATE_VERSION =
  'canonical-rembg-gpu-runtime-result-candidate-v1' as const

export interface CanonicalRembgGpuRuntimeMaskOutputReceipt {
  readonly canonicalOrder: 0
  readonly artifactKind: 'mask_image'
  readonly fileName: 'mask.png'
  readonly contentType: 'image/png'
  readonly encodingProfile: 'gray8_mask_png_v1'
  readonly byteLength: number
  readonly contentSha256: string
  readonly width: number
  readonly height: number
  readonly minimumMaskValue: number
  readonly maximumMaskValue: number
  readonly uniqueMaskValueCount: number
  readonly transparentPixelCount: number
  readonly partialPixelCount: number
  readonly opaquePixelCount: number
}

export interface CanonicalRembgGpuRuntimeProcessEvidenceReceipt {
  readonly canonicalOrder: 0 | 1
  readonly evidenceKind:
    | 'mask_analysis_receipt'
    | 'mask_qa_measurement_receipt'
  readonly fileName:
    | 'mask-analysis.json'
    | 'mask-qa-measurement.json'
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalRembgGpuRuntimeSuccessWireResponse {
  readonly schemaVersion:
    'canonical-rembg-gpu-runtime-response-v1'
  readonly ok: true
  readonly status: 'controlled_rembg_gpu_inference_completed'
  readonly operationId:
    'tool.rembg.remove_image_background.v1'
  readonly admissionDigestSha256: string
  readonly requestBindingSha256: string
  readonly dispatchIntentId: string
  readonly runtimeIdentity: {
    readonly rembgVersion: '2.0.76'
    readonly onnxRuntimeGpuVersion: '1.27.0'
    readonly executionProvider: 'CUDAExecutionProvider'
    readonly providerCount: number
    readonly device: 'cuda'
    readonly runtimeRegion: 'europe-west1'
    readonly cpuFallbackDisabled: true
  }
  readonly outputs: readonly [
    CanonicalRembgGpuRuntimeMaskOutputReceipt,
  ]
  readonly processEvidence: readonly [
    CanonicalRembgGpuRuntimeProcessEvidenceReceipt,
    CanonicalRembgGpuRuntimeProcessEvidenceReceipt,
  ]
  readonly receiptBoundaries: {
    readonly outputBytesIncluded: false
    readonly sourceBytesIncluded: false
    readonly modelBytesIncluded: false
    readonly pathsIncluded: false
    readonly urlsIncluded: false
    readonly credentialsIncluded: false
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly artifactCommitAuthority: false
    readonly qaPassAuthority: false
    readonly productionReady: false
  }
}

export interface CanonicalRembgGpuRuntimeResultCandidate {
  readonly resultCandidateVersion:
    typeof CANONICAL_REMBG_GPU_RUNTIME_RESULT_CANDIDATE_VERSION
  readonly resultCandidateClass:
    'untrusted_wire_structurally_verified_non_authoritative_gpu_result_candidate'
  readonly identity: {
    readonly admissionId: string
    readonly admissionDigestSha256: string
    readonly runtimeRequestCandidateDigestSha256: string
    readonly runtimeRequestBindingSha256: string
    readonly runtimeContractDigestSha256: string
    readonly runtimeSourceDigestSha256: string
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
    readonly sourceFrameArtifactBindingDigestSha256: string
  }
  readonly runtimeWireReceipt: {
    readonly responseDigestSha256: string
    readonly rembgVersion: '2.0.76'
    readonly onnxRuntimeGpuVersion: '1.27.0'
    readonly executionProvider: 'CUDAExecutionProvider'
    readonly providerCount: number
    readonly device: 'cuda'
    readonly runtimeRegion: 'europe-west1'
    readonly cpuFallbackDisabled: true
    readonly outputCount: 1
    readonly processEvidenceCount: 2
    readonly combinedOutputByteLength: number
  }
  readonly outputCandidates: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'mask_image'
      readonly fileName: 'mask.png'
      readonly contentType: 'image/png'
      readonly encodingProfile: 'gray8_mask_png_v1'
      readonly byteLength: number
      readonly contentSha256: string
      readonly width: number
      readonly height: number
      readonly minimumMaskValue: number
      readonly maximumMaskValue: number
      readonly uniqueMaskValueCount: number
      readonly transparentPixelCount: number
      readonly partialPixelCount: number
      readonly opaquePixelCount: number
      readonly requiredQaGates: readonly [
        'mask_edge_quality',
        'mask_subject_coverage',
      ]
      readonly privateArtifactCommitRequired: true
    },
  ]
  readonly processEvidenceCandidates: readonly [
    {
      readonly canonicalOrder: 0
      readonly evidenceKind: 'mask_analysis_receipt'
      readonly fileName: 'mask-analysis.json'
      readonly byteLength: number
      readonly contentSha256: string
      readonly customerAsset: false
      readonly immutableAttemptEvidenceRequired: true
    },
    {
      readonly canonicalOrder: 1
      readonly evidenceKind: 'mask_qa_measurement_receipt'
      readonly fileName: 'mask-qa-measurement.json'
      readonly byteLength: number
      readonly contentSha256: string
      readonly customerAsset: false
      readonly immutableAttemptEvidenceRequired: true
    },
  ]
  readonly canonicalCompletionRequirements: {
    readonly workerReceiptVersion:
      'canonical-cloud-dispatch-worker-receipt-v1'
    readonly completionEvidenceVersion:
      'canonical-cloud-dispatch-worker-completion-evidence-v1'
    readonly completionReceiptVersion:
      'canonical-cloud-dispatch-worker-completion-receipt-v1'
    readonly exactRequestBindingRequired: true
    readonly immutablePrivateArtifactManifestRequired: true
    readonly artifactQaAndReconciliationRequired: true
    readonly downstreamLeaseVerificationRequired: true
  }
  readonly costEvidenceRequirements: {
    readonly evidenceVersion:
      'private-worker-resource-usage-cost-evidence-v1'
    readonly boundary: 'internal_production_cost_only'
    readonly allocatedGpuCount: 1
    readonly gpuActiveMeasurementRequired: true
    readonly attemptInternalCostEvidenceRequired: true
    readonly officialCloudRateRequiredBeforeProduction: true
    readonly customerPriceIncluded: false
    readonly customerCreditsIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly summary: {
    readonly exactAdmissionReread: true
    readonly exactRuntimeRequestReread: true
    readonly exactRequestBindingMatched: true
    readonly exactCudaRuntimeShapeMatched: true
    readonly exactMaskOutputShapeMatched: true
    readonly exactProcessEvidenceShapeMatched: true
    readonly sourceDimensionsPreserved: true
    readonly maskPopulationAccountingMatched: true
    readonly maskVariationObserved: true
    readonly outputByteCeilingsMatched: true
    readonly outputBytesIncluded: false
    readonly callerPathsIncluded: false
    readonly callerUrlsIncluded: false
    readonly credentialsIncluded: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly untrustedWireOnly: true
    readonly structuralResultVerificationOnly: true
    readonly canonicalWorkerReceiptVerified: false
    readonly canonicalCompletionReceiptVerified: false
    readonly actualCloudRunExecutionVerified: false
    readonly runtimeImageIdentityVerified: false
    readonly liveServiceIdentityAndIamVerified: false
    readonly outputBytesRereadVerified: false
    readonly outputArtifactCommitAuthority: false
    readonly maskEdgeQualityQaAuthority: false
    readonly maskSubjectCoverageQaAuthority: false
    readonly attemptInternalCostEvidenceVerified: false
    readonly customerCostAuthority: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly resultCandidateDigestSha256: string
}

export interface CanonicalRembgGpuRuntimeResultCandidateInput
  extends CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput {
  readonly runtimeRequestCandidate: unknown
  readonly runtimeWireResponse: unknown
}

export interface CanonicalRembgGpuRuntimeResultCandidateAssertionInput
  extends CanonicalRembgGpuRuntimeResultCandidateInput {
  readonly resultCandidate: unknown
}
