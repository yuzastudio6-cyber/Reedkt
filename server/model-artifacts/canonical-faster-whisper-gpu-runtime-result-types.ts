import type {
  CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput,
} from './canonical-faster-whisper-cloud-run-gpu-execution-admission-types'

export const CANONICAL_FASTER_WHISPER_GPU_RUNTIME_RESULT_CANDIDATE_VERSION =
  'canonical-faster-whisper-gpu-runtime-result-candidate-v1' as const

export interface CanonicalFasterWhisperGpuRuntimeOutputReceipt {
  readonly canonicalOrder: 0 | 1 | 2
  readonly artifactKind:
    | 'transcript_json'
    | 'caption_segments_json'
    | 'analysis_report'
  readonly fileName:
    | 'transcript.json'
    | 'caption-segments.json'
    | 'analysis-report.json'
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalFasterWhisperGpuRuntimeSuccessWireResponse {
  readonly schemaVersion:
    'canonical-faster-whisper-gpu-runtime-response-v1'
  readonly ok: true
  readonly status:
    'controlled_faster_whisper_gpu_inference_completed'
  readonly operationId:
    'tool.faster_whisper.transcribe_private_audio.v1'
  readonly admissionDigestSha256: string
  readonly requestBindingSha256: string
  readonly dispatchIntentId: string
  readonly runtimeIdentity: {
    readonly fasterWhisperVersion: '1.2.1'
    readonly ctranslate2Version: '4.6.2'
    readonly cudaDeviceCount: number
    readonly device: 'cuda'
    readonly computeType: 'float16'
    readonly runtimeRegion: 'europe-west1'
  }
  readonly outputs: readonly [
    CanonicalFasterWhisperGpuRuntimeOutputReceipt,
    CanonicalFasterWhisperGpuRuntimeOutputReceipt,
    CanonicalFasterWhisperGpuRuntimeOutputReceipt,
  ]
  readonly receiptBoundaries: {
    readonly outputBytesIncluded: false
    readonly transcriptTextIncluded: false
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

export interface CanonicalFasterWhisperGpuRuntimeResultCandidate {
  readonly resultCandidateVersion:
    typeof CANONICAL_FASTER_WHISPER_GPU_RUNTIME_RESULT_CANDIDATE_VERSION
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
  }
  readonly runtimeWireReceipt: {
    readonly responseDigestSha256: string
    readonly fasterWhisperVersion: '1.2.1'
    readonly ctranslate2Version: '4.6.2'
    readonly cudaDeviceCount: number
    readonly device: 'cuda'
    readonly computeType: 'float16'
    readonly runtimeRegion: 'europe-west1'
    readonly outputCount: 3
    readonly combinedOutputByteLength: number
  }
  readonly outputCandidates: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'transcript_json'
      readonly fileName: 'transcript.json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_word_timed_transcript_json_v1'
      readonly byteLength: number
      readonly contentSha256: string
      readonly requiredQaGates: readonly ['transcript_alignment']
      readonly privateArtifactCommitRequired: true
    },
    {
      readonly canonicalOrder: 1
      readonly artifactKind: 'caption_segments_json'
      readonly fileName: 'caption-segments.json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_caption_segments_json_v1'
      readonly byteLength: number
      readonly contentSha256: string
      readonly requiredQaGates: readonly ['caption_timing']
      readonly privateArtifactCommitRequired: true
    },
    {
      readonly canonicalOrder: 2
      readonly artifactKind: 'analysis_report'
      readonly fileName: 'analysis-report.json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_transcription_analysis_report_json_v1'
      readonly byteLength: number
      readonly contentSha256: string
      readonly requiredQaGates: readonly []
      readonly privateArtifactCommitRequired: true
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
    readonly exactThreeOutputShapeMatched: true
    readonly outputByteCeilingsMatched: true
    readonly outputBytesIncluded: false
    readonly transcriptTextIncluded: false
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
    readonly transcriptAlignmentQaAuthority: false
    readonly captionTimingQaAuthority: false
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

export interface CanonicalFasterWhisperGpuRuntimeResultCandidateInput
  extends CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput {
  readonly runtimeRequestCandidate: unknown
  readonly runtimeWireResponse: unknown
}

export interface CanonicalFasterWhisperGpuRuntimeResultCandidateAssertionInput
  extends CanonicalFasterWhisperGpuRuntimeResultCandidateInput {
  readonly resultCandidate: unknown
}
