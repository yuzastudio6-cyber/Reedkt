import type {
  CanonicalModelArtifactGpuBundle,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalFasterWhisperGpuBundleRequirementProjection,
  CanonicalFasterWhisperModelArtifactRequirementSet,
  CanonicalFasterWhisperModelArtifactSlotId,
} from './canonical-faster-whisper-model-artifact-requirement-types'
import type {
  CanonicalModelArtifactFormat,
} from './canonical-model-artifact-types'

export const CANONICAL_FASTER_WHISPER_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION =
  'canonical-faster-whisper-cloud-run-gpu-execution-admission-candidate-v1' as const

export interface CanonicalFasterWhisperSourceAudioExpectation {
  readonly artifactId: string
  readonly artifactKind: 'audio'
  readonly contentType: 'audio/wav'
  readonly contentSha256: string
  readonly byteLength: number
  readonly durationMilliseconds: number
  readonly sampleRateHz: 16_000
  readonly channelCount: 1
  readonly sampleFormat: 'pcm_s16le'
  readonly dependencyQaEvaluationId: string
  readonly dependencyReconciliationId: string
  readonly sourceExpectationDigestSha256: string
}

export interface CanonicalFasterWhisperSourceAudioExpectationInput {
  readonly artifactId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly durationMilliseconds: number
  readonly sampleRateHz: 16_000
  readonly channelCount: 1
  readonly sampleFormat: 'pcm_s16le'
  readonly dependencyQaEvaluationId: string
  readonly dependencyReconciliationId: string
}

export interface CanonicalFasterWhisperOperationSettings {
  readonly device: 'cuda'
  readonly computeType: 'float16'
  readonly beamSize: 5
  readonly wordTimestamps: true
  readonly vadFilter: true
  readonly languagePolicy: 'auto_detect_v1'
  readonly temperature: 0
  readonly conditionOnPreviousText: true
}

export interface CanonicalFasterWhisperBoundModelArtifact {
  readonly canonicalOrder: 0 | 1 | 2 | 3
  readonly slotId: CanonicalFasterWhisperModelArtifactSlotId
  readonly artifactRecordId: string
  readonly manifestDigestSha256: string
  readonly artifactId: string
  readonly revision:
    '536b0662742c02347bc0e980a01041f333bce120'
  readonly artifactFormat: CanonicalModelArtifactFormat
  readonly artifactRole: string
  readonly modelFamily: 'systran-faster-whisper-small'
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate {
  readonly admissionVersion:
    typeof CANONICAL_FASTER_WHISPER_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION
  readonly admissionClass:
    'controlled_non_executable_faster_whisper_gpu_operation_preflight'
  readonly admissionId: string
  readonly identity: {
    readonly approvedToolId: 'faster_whisper'
    readonly approvedOperationId:
      'tool.faster_whisper.transcribe_private_audio.v1'
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
    readonly operationRequestDigestSha256: string
  }
  readonly modelArtifactBinding: {
    readonly artifactCount: 4
    readonly totalByteLength: 486_212_372
    readonly artifacts: readonly [
      CanonicalFasterWhisperBoundModelArtifact,
      CanonicalFasterWhisperBoundModelArtifact,
      CanonicalFasterWhisperBoundModelArtifact,
      CanonicalFasterWhisperBoundModelArtifact,
    ]
    readonly consumerScope: 'faster_whisper.private-inference'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly cloudRunAccelerator: 'nvidia_l4'
    readonly modelAccelerator: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly source: CanonicalFasterWhisperSourceAudioExpectation
  readonly settings: CanonicalFasterWhisperOperationSettings
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'transcript_json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_word_timed_transcript_json_v1'
      readonly privateArtifactRequired: true
    },
    {
      readonly canonicalOrder: 1
      readonly artifactKind: 'caption_segments_json'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_caption_segments_json_v1'
      readonly privateArtifactRequired: true
    },
    {
      readonly canonicalOrder: 2
      readonly artifactKind: 'analysis_report'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'faster_whisper_transcription_analysis_report_json_v1'
      readonly privateArtifactRequired: true
    },
  ]
  readonly requiredQaGates: readonly [
    'transcript_alignment',
    'caption_timing',
  ]
  readonly summary: {
    readonly exactModelArtifactSetMatched: true
    readonly exactCloudRunGpuAttemptIdentityMatched: true
    readonly exactPrivateAudioBindingMatched: true
    readonly exactGpuOnlySettingsMatched: true
    readonly exactOutputAndQaContractDeclared: true
    readonly modelArtifactCount: 4
    readonly inputDurationMilliseconds: number
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly productionToolRegistryCountPreserved: true
    readonly productionToolPromotionAuthorized: false
    readonly canonicalOperationArtifactSetVerified: false
    readonly freshRepositoryByteRehashRequired: true
    readonly approvedPackageRereadRequired: true
    readonly approvedSnapshotRereadRequired: true
    readonly workerLeaseRereadRequired: true
    readonly privateAudioArtifactReadVerified: false
    readonly cloudRunReadOnlyModelMountVerified: false
    readonly cloudRunCudaRuntimeImageVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly packageDependencyLockVerified: false
    readonly ctranslate2ModelLoadVerified: false
    readonly fasterWhisperInferenceVerified: false
    readonly privateTranscriptArtifactWriteVerified: false
    readonly transcriptAlignmentQaVerified: false
    readonly captionTimingQaVerified: false
    readonly paidProductionOwnerApproval: false
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

export interface CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidateInput {
  readonly requirementSet:
    CanonicalFasterWhisperModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalFasterWhisperGpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly source: CanonicalFasterWhisperSourceAudioExpectationInput
  readonly operationRequest: unknown
}

export interface CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput {
  readonly value: unknown
  readonly requirementSet:
    CanonicalFasterWhisperModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalFasterWhisperGpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly source: CanonicalFasterWhisperSourceAudioExpectationInput
  readonly operationRequest: unknown
}
