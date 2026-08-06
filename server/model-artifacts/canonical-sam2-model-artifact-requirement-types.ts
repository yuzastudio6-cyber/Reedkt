import type {
  CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalModelArtifactDescriptor,
  CanonicalModelArtifactLocator,
} from './canonical-model-artifact-types'

export const CANONICAL_SAM2_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION =
  'canonical-sam2-model-artifact-requirement-set-v1' as const
export const CANONICAL_SAM2_SOURCE_OBSERVATION_VERSION =
  'canonical-sam2-source-observation-v1' as const

export interface CanonicalSam2SourceObservation {
  readonly observationVersion:
    typeof CANONICAL_SAM2_SOURCE_OBSERVATION_VERSION
  readonly observedAt: '2026-07-27'
  readonly sourceOwner: 'Meta Platforms, Inc.'
  readonly sourceRepository:
    'https://github.com/facebookresearch/sam2'
  readonly sourceRevision:
    '2b90b9f5ceec907a1c18123530e92e794ad901a4'
  readonly sourceRevisionMutable: false
  readonly sourceLicense: 'Apache-2.0'
  readonly sourceLicenseDocumentSha256:
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
  readonly sourceReadmeSha256:
    'eea69ee1042fb30933c5ca5019fbf0f6f9366cec5e792109281b5023a4f1589c'
  readonly sourcePyprojectSha256:
    'c58230f78769620dcd11d15824d491b049be8f542eeb875d2e8091be797ec3f3'
  readonly checkpointDownloadScriptPath:
    'checkpoints/download_ckpts.sh'
  readonly checkpointDownloadScriptSha256:
    '6cb8caa8f70f40f7076029a9c858bfa4d4fdfb6c960b7943331c85432f6c2ac6'
  readonly modelConfigPath:
    'sam2/configs/sam2.1/sam2.1_hiera_s.yaml'
  readonly modelConfigSha256:
    '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
  readonly checkpointRepository:
    'https://huggingface.co/facebook/sam2.1-hiera-small'
  readonly checkpointRepositoryRevision:
    'ee5bba1d82bb8749febdf90f45e84b687142ba03'
  readonly checkpointRevisionMutable: false
  readonly checkpointFileName: 'sam2.1_hiera_small.pt'
  readonly checkpointByteLength: 184_416_285
  readonly checkpointSha256:
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
  readonly checkpointModelCardSha256:
    '6ec2d54879e41ad876d8cded0d641e8bc6ab74d5e095a73afc3f8406372ee6e9'
  readonly checkpointRepositoryConfigSha256:
    '632e5cd0104f5ab6cd4f9d2dfd80a8e7240e481ad7960a13cad2ae3504b88dbd'
  readonly checkpointRepositoryConfigMatchesSelectedRuntimeConfig: false
  readonly selectedRuntimeConfigSource:
    'pinned_official_source_repository'
  readonly nativeSam2BuilderRequired: true
  readonly huggingFaceFromPretrainedRouteQualified: false
  readonly officialMetaDistributionSha256Matches: true
  readonly officialMetaDistributionByteLengthMatches: true
  readonly officialModelParameterCountMillions: 46
  readonly officialA100CompiledFramesPerSecond: 84.8
  readonly officialBenchmarkAccelerator: 'nvidia_a100'
  readonly officialBenchmarkTorchVersion: '2.5.1'
  readonly officialBenchmarkCudaVersion: '12.4'
  readonly googleCloudRunL4BenchmarkPerformed: false
  readonly mutableReferenceAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly sourceObservationDigestSha256: string
}

export interface CanonicalSam2ModelArtifactRequirementDefinition {
  readonly canonicalOrder: 0
  readonly slotId: 'sam2_checkpoint'
  readonly artifactId: 'meta-sam2.1-hiera-small-checkpoint'
  readonly revision:
    'ee5bba1d82bb8749febdf90f45e84b687142ba03'
  readonly artifactFormat: 'pytorch_checkpoint'
  readonly artifactRole: 'sam2-video-segmentation-checkpoint'
  readonly modelFamily: 'sam2.1-hiera-small'
  readonly byteLength: 184_416_285
  readonly contentSha256:
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
  readonly consumerScope: 'sam2.private-inference'
  readonly required: true
  readonly requirementDigestSha256: string
}

export interface CanonicalSam2ModelArtifactRequirementSet {
  readonly requirementSetVersion:
    typeof CANONICAL_SAM2_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION
  readonly requirementSetClass:
    'server_owned_exact_sam2_operation_model_artifact_definition'
  readonly requirementSetId:
    'sam2_1_hiera_small_segment_and_track_subject_internal_candidate'
  readonly approvedToolId: 'sam2'
  readonly approvedOperationId:
    'tool.sam2.segment_and_track_subject.v1'
  readonly legacyModelWeightManifestId: 'sam2_checkpoint'
  readonly sourceObservation: CanonicalSam2SourceObservation
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly artifacts:
    readonly [CanonicalSam2ModelArtifactRequirementDefinition]
  readonly summary: {
    readonly artifactCount: 1
    readonly totalByteLength: 184_416_285
    readonly modelArtifactSlotDefinitionComplete: true
    readonly runtimeSourceAndConfigQualificationStillRequired: true
    readonly runtimeConfigCheckpointLoadFixtureStillRequired: true
    readonly allArtifactsGpuRequired: true
    readonly googleCloudRunGpuRequired: true
    readonly cudaRequired: true
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly exactImmutableUpstreamSourceObserved: true
    readonly exactCheckpointIdentityObserved: true
    readonly exactModelArtifactSlotDefinitionComplete: true
    readonly exactRepositoryLocatorRequired: true
    readonly legacyManifestTemplateStillPlaceholder: true
    readonly runtimeSourceInstallQualified: false
    readonly checkpointConfinedDeserializationQualified: false
    readonly modelArtifactIngested: false
    readonly canonicalOperationArtifactSetVerified: false
    readonly privateGpuDistributionVerified: false
    readonly cloudRunReadOnlyMountVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly privateInputArtifactReadVerified: false
    readonly privateMaskOutputArtifactVerified: false
    readonly temporalMaskQaVerified: false
    readonly paidProductionOwnerApproval: false
    readonly sourceDownloadAuthorized: false
    readonly modelArtifactIngestAuthorized: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
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

export interface CanonicalSam2GpuBundleRequirementProjection {
  readonly requirementSetDigestSha256: string
  readonly approvedToolId: 'sam2'
  readonly approvedOperationId:
    'tool.sam2.segment_and_track_subject.v1'
  readonly consumerScope: 'sam2.private-inference'
  readonly requirements:
    readonly [CanonicalModelArtifactGpuBundleRequirement]
  readonly repositoryVerificationStillRequired: true
  readonly canonicalOperationArtifactSetVerified: false
  readonly cloudDispatchAuthorized: false
  readonly modelInferenceAuthority: false
  readonly productionReady: false
  readonly projectionDigestSha256: string
}

export interface CanonicalSam2GpuBundleRequirementProjectionInput {
  readonly requirementSet: unknown
  readonly locator: CanonicalModelArtifactLocator
}
