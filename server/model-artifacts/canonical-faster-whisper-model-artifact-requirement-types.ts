import type {
  CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalModelArtifactDescriptor,
  CanonicalModelArtifactLocator,
} from './canonical-model-artifact-types'

export const CANONICAL_FASTER_WHISPER_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION =
  'canonical-faster-whisper-model-artifact-requirement-set-v1' as const
export const CANONICAL_FASTER_WHISPER_SOURCE_OBSERVATION_VERSION =
  'canonical-faster-whisper-source-observation-v1' as const

export interface CanonicalFasterWhisperSourceObservation {
  readonly observationVersion:
    typeof CANONICAL_FASTER_WHISPER_SOURCE_OBSERVATION_VERSION
  readonly observedAt: '2026-07-27'
  readonly sourceOwner: 'SYSTRAN'
  readonly sourceRepository:
    'https://github.com/SYSTRAN/faster-whisper'
  readonly sourceRevision:
    '65882eee9f5cdbeeb2d877f1131d48cf241b327d'
  readonly sourceTag: 'v1.2.1'
  readonly packageVersion: '1.2.1'
  readonly sourceRevisionMutable: false
  readonly sourceLicense: 'MIT'
  readonly sourceLicenseDocumentSha256:
    'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5'
  readonly sourceReadmeSha256:
    '5ae59e0781834e6887bbd51bda2d8bd5dfe08cd345e0c6f7f3aca455d129cc69'
  readonly modelRepository:
    'https://huggingface.co/Systran/faster-whisper-small'
  readonly modelRevision:
    '536b0662742c02347bc0e980a01041f333bce120'
  readonly modelRevisionMutable: false
  readonly modelLicense: 'MIT'
  readonly modelCardSha256:
    '329373481008c7c38654aff8ecdcf0163c211557cc7ba8e2ef6f2f84b4f75ec8'
  readonly modelBinaryMetadataObservedWithoutDownload: true
  readonly modelBinaryLfsSha256:
    '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671'
  readonly modelBinaryByteLength: 483_546_902
  readonly expectedRuntimeFileCount: 4
  readonly expectedRuntimeFileNames: readonly [
    'config.json',
    'model.bin',
    'tokenizer.json',
    'vocabulary.txt',
  ]
  readonly officialGpuRuntimeCudaMajor: 12
  readonly officialGpuRuntimeCudnnMajor: 9
  readonly requiredDevice: 'cuda'
  readonly requiredComputeType: 'float16'
  readonly googleCloudRunL4BenchmarkPerformed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly sourceObservationDigestSha256: string
}

export type CanonicalFasterWhisperModelArtifactSlotId =
  | 'faster_whisper_config'
  | 'faster_whisper_model'
  | 'faster_whisper_tokenizer'
  | 'faster_whisper_vocabulary'

export interface CanonicalFasterWhisperModelArtifactRequirementDefinition {
  readonly canonicalOrder: 0 | 1 | 2 | 3
  readonly slotId: CanonicalFasterWhisperModelArtifactSlotId
  readonly artifactId: string
  readonly revision:
    '536b0662742c02347bc0e980a01041f333bce120'
  readonly artifactFormat:
    | 'configuration'
    | 'reviewed_binary'
    | 'tokenizer'
  readonly artifactRole:
    | 'ctranslate2-whisper-config'
    | 'ctranslate2-whisper-model'
    | 'whisper-tokenizer'
    | 'whisper-vocabulary'
  readonly modelFamily: 'systran-faster-whisper-small'
  readonly byteLength: 2_370 | 483_546_902 | 2_203_239 | 459_861
  readonly contentSha256: string
  readonly consumerScope: 'faster_whisper.private-inference'
  readonly required: true
  readonly requirementDigestSha256: string
}

export interface CanonicalFasterWhisperModelArtifactRequirementSet {
  readonly requirementSetVersion:
    typeof CANONICAL_FASTER_WHISPER_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION
  readonly requirementSetClass:
    'server_owned_exact_faster_whisper_operation_model_artifact_definition'
  readonly requirementSetId:
    'systran_faster_whisper_small_transcription_internal_candidate'
  readonly approvedToolId: 'faster_whisper'
  readonly approvedOperationId:
    'tool.faster_whisper.transcribe_private_audio.v1'
  readonly legacyModelWeightManifestId: 'faster_whisper_model'
  readonly sourceObservation: CanonicalFasterWhisperSourceObservation
  readonly descriptors: readonly [
    CanonicalModelArtifactDescriptor,
    CanonicalModelArtifactDescriptor,
    CanonicalModelArtifactDescriptor,
    CanonicalModelArtifactDescriptor,
  ]
  readonly artifacts: readonly [
    CanonicalFasterWhisperModelArtifactRequirementDefinition,
    CanonicalFasterWhisperModelArtifactRequirementDefinition,
    CanonicalFasterWhisperModelArtifactRequirementDefinition,
    CanonicalFasterWhisperModelArtifactRequirementDefinition,
  ]
  readonly summary: {
    readonly artifactCount: 4
    readonly totalByteLength: 486_212_372
    readonly exactRuntimeFileSetDefined: true
    readonly packageDependencyLockStillRequired: true
    readonly exactCudaRuntimeImageStillRequired: true
    readonly allArtifactsGpuRequired: true
    readonly googleCloudRunGpuRequired: true
    readonly cudaRequired: true
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly exactImmutablePackageSourceObserved: true
    readonly exactImmutableModelRevisionObserved: true
    readonly exactRuntimeFileSetDefined: true
    readonly exactRepositoryLocatorsRequired: true
    readonly legacyManifestTemplateStillPlaceholder: true
    readonly packageDependencyLockQualified: false
    readonly modelArtifactsIngested: false
    readonly canonicalOperationArtifactSetVerified: false
    readonly privateGpuDistributionVerified: false
    readonly cloudRunReadOnlyMountVerified: false
    readonly cloudRunCudaRuntimeImageVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly privateAudioArtifactReadVerified: false
    readonly privateTranscriptArtifactsVerified: false
    readonly transcriptAlignmentQaVerified: false
    readonly captionTimingQaVerified: false
    readonly paidProductionOwnerApproval: false
    readonly sourceDownloadAuthorized: false
    readonly modelArtifactIngestAuthorized: false
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
  readonly requirementSetDigestSha256: string
}

export interface CanonicalFasterWhisperGpuBundleRequirementProjection {
  readonly requirementSetDigestSha256: string
  readonly approvedToolId: 'faster_whisper'
  readonly approvedOperationId:
    'tool.faster_whisper.transcribe_private_audio.v1'
  readonly consumerScope: 'faster_whisper.private-inference'
  readonly requirements: readonly [
    CanonicalModelArtifactGpuBundleRequirement,
    CanonicalModelArtifactGpuBundleRequirement,
    CanonicalModelArtifactGpuBundleRequirement,
    CanonicalModelArtifactGpuBundleRequirement,
  ]
  readonly repositoryVerificationStillRequired: true
  readonly canonicalOperationArtifactSetVerified: false
  readonly cloudDispatchAuthorized: false
  readonly modelInferenceAuthority: false
  readonly productionReady: false
  readonly projectionDigestSha256: string
}

export interface CanonicalFasterWhisperGpuBundleRequirementProjectionInput {
  readonly requirementSet: unknown
  readonly locators: readonly [
    CanonicalModelArtifactLocator,
    CanonicalModelArtifactLocator,
    CanonicalModelArtifactLocator,
    CanonicalModelArtifactLocator,
  ]
}
