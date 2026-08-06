import type {
  CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput,
  CanonicalSam2SubjectPromptPacket,
} from './canonical-sam2-cloud-run-gpu-execution-admission-types'

export const CANONICAL_SAM2_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION =
  'canonical-sam2-gpu-runtime-request-candidate-v1' as const

export interface CanonicalSam2GpuRuntimeRunnerRequest {
  readonly schemaVersion:
    'canonical-sam2-gpu-runtime-request-v1'
  readonly operationId:
    'tool.sam2.segment_and_track_subject.v1'
  readonly admissionDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
  }
  readonly source: {
    readonly artifactId: string
    readonly contentSha256: string
    readonly byteLength: number
    readonly contentType: 'video/mp4'
    readonly width: number
    readonly height: number
    readonly frameCount: number
    readonly fpsNumerator: number
    readonly fpsDenominator: number
    readonly durationMilliseconds: number
    readonly sourceExpectationDigestSha256: string
  }
  readonly subjectPromptArtifact: {
    readonly artifactId: string
    readonly contentSha256: string
    readonly byteLength: number
    readonly contentType: 'application/json'
    readonly canonicalJsonEncoding:
      'stable_authority_json_utf8_no_bom'
  }
  readonly subjectPrompt: CanonicalSam2SubjectPromptPacket
  readonly modelArtifacts: readonly [
    {
      readonly canonicalOrder: 0
      readonly slotId: 'sam2_checkpoint'
      readonly fileName: 'sam2.1_hiera_small.pt'
      readonly artifactId:
        'meta-sam2.1-hiera-small-checkpoint'
      readonly revision:
        'ee5bba1d82bb8749febdf90f45e84b687142ba03'
      readonly modelFamily: 'sam2.1-hiera-small'
      readonly byteLength: 184_416_285
      readonly contentSha256:
        '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
    },
  ]
  readonly settings: {
    readonly device: 'cuda'
    readonly modelConfigPath:
      'configs/sam2.1/sam2.1_hiera_s.yaml'
    readonly confidenceThreshold: number
    readonly maximumSubjects: 1
    readonly frameStride: 1
    readonly preserveContactObjects: boolean
    readonly subjectPromptProfile:
      'normalized_box_or_points_v1'
    readonly subjectPromptSha256: string
    readonly outputMode:
      'gray8_ffv1_matroska_mask_sequence_v1'
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly requestBindingSha256: string
}

export interface CanonicalSam2GpuRuntimeRequestCandidate {
  readonly requestCandidateVersion:
    typeof CANONICAL_SAM2_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION
  readonly requestCandidateClass:
    'server_derived_non_dispatching_sam2_gpu_runtime_request_candidate'
  readonly identity: {
    readonly admissionId: string
    readonly admissionDigestSha256: string
    readonly runtimeContractDigestSha256: string
    readonly runtimeSourceDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly creditEstimateId: string
    readonly creditReservationId: string
    readonly workerLeaseId: string
    readonly idempotencyKey: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly sourceExpectationDigestSha256: string
    readonly subjectPromptDigestSha256: string
  }
  readonly runnerRequest: CanonicalSam2GpuRuntimeRunnerRequest
  readonly serializedRunnerRequestByteLength: number
  readonly runnerRequestDigestSha256: string
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'mask_sequence'
      readonly fileName: 'mask-sequence.mkv'
      readonly contentType: 'video/x-matroska'
      readonly encodingProfile:
        'gray8_ffv1_matroska_mask_sequence_v1'
    },
    {
      readonly canonicalOrder: 1
      readonly artifactKind: 'analysis_report'
      readonly fileName: 'tracking-analysis.json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'sam2_tracking_analysis_report_json_v1'
    },
    {
      readonly canonicalOrder: 2
      readonly artifactKind: 'qa_report'
      readonly fileName: 'mask-qa-measurement.json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'sam2_mask_qa_measurement_report_json_v1'
    },
  ]
  readonly summary: {
    readonly exactAdmissionReread: true
    readonly exactRuntimeSourceReread: true
    readonly exactCheckpointMatched: true
    readonly exactPrivateSourceExpectationMatched: true
    readonly exactStructuredPromptMatched: true
    readonly exactCudaOnlySettingsMatched: true
    readonly exactL4RegionMatched: true
    readonly requestContainsCallerPaths: false
    readonly requestContainsCallerUrls: false
    readonly requestContainsCallerBytes: false
    readonly requestContainsCredentials: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly serverDerived: true
    readonly runnerInvoked: false
    readonly checkpointMounted: false
    readonly cloudRunL4ExecutionVerified: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly outputArtifactCommitAuthority: false
    readonly maskEdgeQualityQaAuthority: false
    readonly maskTemporalStabilityQaAuthority: false
    readonly maskSubjectCoverageQaAuthority: false
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
  readonly requestCandidateDigestSha256: string
}

export type CanonicalSam2GpuRuntimeRequestCandidateInput =
  CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput

export interface CanonicalSam2GpuRuntimeRequestCandidateAssertionInput
  extends CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput {
  readonly candidate: unknown
}
