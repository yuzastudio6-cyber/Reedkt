import type {
  CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput,
} from './canonical-sam2-cloud-run-gpu-execution-admission-types'

export const CANONICAL_SAM2_GPU_RUNTIME_RESULT_CANDIDATE_VERSION =
  'canonical-sam2-gpu-runtime-result-candidate-v1' as const

export interface CanonicalSam2GpuRuntimeMaskSequenceReceipt {
  readonly canonicalOrder: 0
  readonly artifactKind: 'mask_sequence'
  readonly fileName: 'mask-sequence.mkv'
  readonly contentType: 'video/x-matroska'
  readonly encodingProfile:
    'gray8_ffv1_matroska_mask_sequence_v1'
  readonly byteLength: number
  readonly contentSha256: string
  readonly width: number
  readonly height: number
  readonly frameCount: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly activeFrameCount: number
  readonly minimumCoveragePpm: number
  readonly maximumCoveragePpm: number
  readonly meanCoveragePpm: number
  readonly meanTemporalIouPpm: number
  readonly centroidMotionPpm: number
}

export interface CanonicalSam2GpuRuntimeJsonOutputReceipt {
  readonly canonicalOrder: 1 | 2
  readonly artifactKind: 'analysis_report' | 'qa_report'
  readonly fileName:
    | 'tracking-analysis.json'
    | 'mask-qa-measurement.json'
  readonly contentType: 'application/json'
  readonly encodingProfile:
    | 'sam2_tracking_analysis_report_json_v1'
    | 'sam2_mask_qa_measurement_report_json_v1'
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalSam2GpuRuntimeSuccessWireResponse {
  readonly schemaVersion:
    'canonical-sam2-gpu-runtime-response-v1'
  readonly ok: true
  readonly status: 'controlled_sam2_gpu_inference_completed'
  readonly operationId:
    'tool.sam2.segment_and_track_subject.v1'
  readonly admissionDigestSha256: string
  readonly requestBindingSha256: string
  readonly dispatchIntentId: string
  readonly runtimeIdentity: {
    readonly sam2DistributionVersion: '1.0'
    readonly sam2SourceRevision:
      '2b90b9f5ceec907a1c18123530e92e794ad901a4'
    readonly sam2ConfigSha256:
      '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cudaBuild: '12.4'
    readonly cudaDeviceCount: 1
    readonly accelerator: 'nvidia_l4'
    readonly device: 'cuda'
    readonly runtimeRegion: 'europe-west1'
    readonly checkpointLoaded: true
    readonly cpuFallbackDisabled: true
  }
  readonly outputs: readonly [
    CanonicalSam2GpuRuntimeMaskSequenceReceipt,
    CanonicalSam2GpuRuntimeJsonOutputReceipt,
    CanonicalSam2GpuRuntimeJsonOutputReceipt,
  ]
  readonly receiptBoundaries: {
    readonly outputBytesIncluded: false
    readonly sourceBytesIncluded: false
    readonly modelBytesIncluded: false
    readonly promptCoordinatesIncluded: false
    readonly pathsIncluded: false
    readonly urlsIncluded: false
    readonly credentialsIncluded: false
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly artifactCommitAuthority: false
    readonly qaPassAuthority: false
    readonly customerCostAuthority: false
    readonly productionReady: false
  }
}

export interface CanonicalSam2GpuRuntimeResultCandidate {
  readonly resultCandidateVersion:
    typeof CANONICAL_SAM2_GPU_RUNTIME_RESULT_CANDIDATE_VERSION
  readonly resultCandidateClass:
    'untrusted_wire_structurally_verified_non_authoritative_sam2_gpu_result_candidate'
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
    readonly sourceExpectationDigestSha256: string
    readonly subjectPromptDigestSha256: string
  }
  readonly runtimeWireReceipt: {
    readonly responseDigestSha256: string
    readonly sam2DistributionVersion: '1.0'
    readonly sam2SourceRevision:
      '2b90b9f5ceec907a1c18123530e92e794ad901a4'
    readonly sam2ConfigSha256:
      '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cudaBuild: '12.4'
    readonly cudaDeviceCount: 1
    readonly accelerator: 'nvidia_l4'
    readonly device: 'cuda'
    readonly runtimeRegion: 'europe-west1'
    readonly checkpointLoaded: true
    readonly cpuFallbackDisabled: true
    readonly outputCount: 3
    readonly combinedOutputByteLength: number
  }
  readonly outputCandidates: readonly [
    CanonicalSam2GpuRuntimeMaskSequenceReceipt & {
      readonly requiredQaGates: readonly [
        'mask_edge_quality',
        'mask_temporal_stability',
        'mask_subject_coverage',
      ]
      readonly privateArtifactCommitRequired: true
    },
    CanonicalSam2GpuRuntimeJsonOutputReceipt & {
      readonly customerAsset: false
      readonly immutableAttemptEvidenceRequired: true
    },
    CanonicalSam2GpuRuntimeJsonOutputReceipt & {
      readonly customerAsset: false
      readonly immutableAttemptEvidenceRequired: true
    },
  ]
  readonly costEvidenceRequirements: {
    readonly evidenceVersion:
      'private-worker-resource-usage-cost-evidence-v1'
    readonly boundary: 'internal_production_cost_only'
    readonly allocatedGpuCount: 1
    readonly gpuActiveMeasurementRequired: true
    readonly attemptInternalCostEvidenceRequired: true
    readonly customerPriceIncluded: false
    readonly customerCreditsIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly summary: {
    readonly exactAdmissionReread: true
    readonly exactRuntimeRequestReread: true
    readonly exactRequestBindingMatched: true
    readonly exactCudaL4RuntimeShapeMatched: true
    readonly exactMaskSequenceShapeMatched: true
    readonly sourceDimensionsAndTimingPreserved: true
    readonly temporalMeasurementsPresent: true
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
    readonly checkpointMountRereadVerified: false
    readonly outputBytesRereadVerified: false
    readonly outputArtifactCommitAuthority: false
    readonly maskEdgeQualityQaAuthority: false
    readonly maskTemporalStabilityQaAuthority: false
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

export interface CanonicalSam2GpuRuntimeResultCandidateInput
  extends CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput {
  readonly runtimeRequestCandidate: unknown
  readonly runtimeWireResponse: unknown
}

export interface CanonicalSam2GpuRuntimeResultCandidateAssertionInput
  extends CanonicalSam2GpuRuntimeResultCandidateInput {
  readonly resultCandidate: unknown
}
