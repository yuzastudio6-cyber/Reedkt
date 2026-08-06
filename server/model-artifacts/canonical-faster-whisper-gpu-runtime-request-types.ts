import type {
  CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput,
} from './canonical-faster-whisper-cloud-run-gpu-execution-admission-types'

export const CANONICAL_FASTER_WHISPER_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION =
  'canonical-faster-whisper-gpu-runtime-request-candidate-v1' as const

export interface CanonicalFasterWhisperGpuRuntimeRunnerRequest {
  readonly schemaVersion:
    'canonical-faster-whisper-gpu-runtime-request-v1'
  readonly operationId:
    'tool.faster_whisper.transcribe_private_audio.v1'
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
    readonly durationMilliseconds: number
    readonly contentType: 'audio/wav'
    readonly sampleRateHz: 16_000
    readonly channelCount: 1
    readonly sampleFormat: 'pcm_s16le'
  }
  readonly modelArtifacts: readonly [
    {
      readonly canonicalOrder: 0
      readonly slotId: 'faster_whisper_config'
      readonly fileName: 'config.json'
      readonly byteLength: 2_370
      readonly contentSha256:
        'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828'
    },
    {
      readonly canonicalOrder: 1
      readonly slotId: 'faster_whisper_model'
      readonly fileName: 'model.bin'
      readonly byteLength: 483_546_902
      readonly contentSha256:
        '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671'
    },
    {
      readonly canonicalOrder: 2
      readonly slotId: 'faster_whisper_tokenizer'
      readonly fileName: 'tokenizer.json'
      readonly byteLength: 2_203_239
      readonly contentSha256:
        'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab'
    },
    {
      readonly canonicalOrder: 3
      readonly slotId: 'faster_whisper_vocabulary'
      readonly fileName: 'vocabulary.txt'
      readonly byteLength: 459_861
      readonly contentSha256:
        '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913'
    },
  ]
  readonly settings: {
    readonly device: 'cuda'
    readonly computeType: 'float16'
    readonly beamSize: 5
    readonly wordTimestamps: true
    readonly vadFilter: true
    readonly languagePolicy: 'auto_detect_v1'
    readonly temperature: 0
    readonly conditionOnPreviousText: true
  }
  readonly requestBindingSha256: string
}

export interface CanonicalFasterWhisperGpuRuntimeRequestCandidate {
  readonly requestCandidateVersion:
    typeof CANONICAL_FASTER_WHISPER_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION
  readonly requestCandidateClass:
    'server_derived_non_dispatching_gpu_runtime_request_candidate'
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
  }
  readonly runnerRequest:
    CanonicalFasterWhisperGpuRuntimeRunnerRequest
  readonly serializedRunnerRequestByteLength: number
  readonly runnerRequestDigestSha256: string
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'transcript_json'
      readonly fileName: 'transcript.json'
      readonly contentType: 'application/json'
    },
    {
      readonly canonicalOrder: 1
      readonly artifactKind: 'caption_segments_json'
      readonly fileName: 'caption-segments.json'
      readonly contentType: 'application/json'
    },
    {
      readonly canonicalOrder: 2
      readonly artifactKind: 'analysis_report'
      readonly fileName: 'analysis-report.json'
      readonly contentType: 'application/json'
    },
  ]
  readonly summary: {
    readonly exactAdmissionReread: true
    readonly exactRuntimeSourceReread: true
    readonly exactModelArtifactSetMatched: true
    readonly exactPrivateAudioExpectationMatched: true
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
    readonly approvedPackageRereadStillRequiredAtExecution: true
    readonly approvedSnapshotRereadStillRequiredAtExecution: true
    readonly workerLeaseRereadStillRequiredAtExecution: true
    readonly modelArtifactBundleRereadStillRequiredAtExecution: true
    readonly privateAudioArtifactRereadStillRequiredAtExecution: true
    readonly runnerInvoked: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly outputArtifactCommitAuthority: false
    readonly transcriptAlignmentQaAuthority: false
    readonly captionTimingQaAuthority: false
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

export type CanonicalFasterWhisperGpuRuntimeRequestCandidateInput =
  CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput

export interface CanonicalFasterWhisperGpuRuntimeRequestCandidateAssertionInput
  extends CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput {
  readonly candidate: unknown
}
