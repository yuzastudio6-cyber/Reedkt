import type {
  CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalModelArtifactDescriptor,
  CanonicalModelArtifactLocator,
} from './canonical-model-artifact-types'

export const CANONICAL_REMBG_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION =
  'canonical-rembg-model-artifact-requirement-set-v1' as const
export const CANONICAL_REMBG_SOURCE_OBSERVATION_VERSION =
  'canonical-rembg-source-observation-v1' as const

export interface CanonicalRembgSourceObservation {
  readonly observationVersion:
    typeof CANONICAL_REMBG_SOURCE_OBSERVATION_VERSION
  readonly observedAt: '2026-07-28'
  readonly rembgSourceRepository:
    'https://github.com/danielgatis/rembg'
  readonly rembgSourceRevision:
    '98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb'
  readonly rembgSourceRevisionMutable: false
  readonly rembgPackageVersion: '2.0.76'
  readonly rembgLicense: 'MIT'
  readonly rembgLicenseDocumentSha256:
    '90a3215072968fd304669c5389f04f1274a587abdd0507d99dead0f5511f8999'
  readonly rembgReadmeSha256:
    'ef67d0afa50bc139e3e9af511c6b48160ddab436c846443f85d7531d5d0ebcc3'
  readonly rembgU2netpSourcePath: 'rembg/sessions/u2netp.py'
  readonly rembgU2netpSourceSha256:
    'f0f0f344f5bb19505ab3570d226a73512f99ff28b021d563247776a44969b501'
  readonly u2netSourceRepository:
    'https://github.com/xuebinqin/U-2-Net'
  readonly u2netSourceRevision:
    'ac7e1c817ecab7c7dff5ce6b1abba61cd213ff29'
  readonly u2netSourceRevisionMutable: false
  readonly u2netLicense: 'Apache-2.0'
  readonly u2netLicenseDocumentSha256:
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
  readonly u2netReadmeSha256:
    '2dda6120b8fde9efc40f342db96087c1827b8657f98bb16b668ebe3c34f66c8f'
  readonly modelReleaseTag: 'v0.0.0'
  readonly modelReleaseFile: 'u2netp.onnx'
  readonly modelByteLength: 4_574_861
  readonly modelSha256:
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
  readonly rembgDeclaredModelMd5:
    '8e83ca70e441ab06c318d82300c84806'
  readonly rembgModelInputWidth: 320
  readonly rembgModelInputHeight: 320
  readonly outputDimensionsMatchSource: true
  readonly googleCloudRunL4BenchmarkPerformed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly sourceObservationDigestSha256: string
}

export interface CanonicalRembgModelArtifactRequirementDefinition {
  readonly canonicalOrder: 0
  readonly slotId: 'rembg_u2netp_onnx'
  readonly artifactId: 'rembg-u2netp-onnx'
  readonly revision:
    'rembg-v0.0.0-u2netp-309c8469258d'
  readonly artifactFormat: 'onnx'
  readonly artifactRole:
    'rembg-u2netp-background-removal-onnx'
  readonly modelFamily: 'u2netp'
  readonly byteLength: 4_574_861
  readonly contentSha256:
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
  readonly consumerScope: 'rembg.private-inference'
  readonly required: true
  readonly requirementDigestSha256: string
}

export interface CanonicalRembgModelArtifactRequirementSet {
  readonly requirementSetVersion:
    typeof CANONICAL_REMBG_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION
  readonly requirementSetClass:
    'server_owned_exact_rembg_operation_model_artifact_definition'
  readonly requirementSetId:
    'rembg_u2netp_mask_only_internal_candidate'
  readonly approvedToolId: 'rembg'
  readonly approvedOperationId:
    'tool.rembg.remove_image_background.v1'
  readonly legacyModelWeightManifestId:
    'rembg_u2netp_model'
  readonly sourceObservation: CanonicalRembgSourceObservation
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly artifacts:
    readonly [CanonicalRembgModelArtifactRequirementDefinition]
  readonly summary: {
    readonly artifactCount: 1
    readonly totalByteLength: 4_574_861
    readonly modelArtifactSlotDefinitionComplete: true
    readonly exactModelBytesPreviouslyObserved: true
    readonly dependencyLockedCudaRuntimeStillRequired: true
    readonly maskOnlySourceFrameFixtureStillRequired: true
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
    readonly exactModelIdentityObserved: true
    readonly exactModelArtifactSlotDefinitionComplete: true
    readonly exactRepositoryLocatorRequired: true
    readonly legacyManifestTemplateStillPlaceholder: true
    readonly existingCpuFixtureProductionAuthority: false
    readonly dependencyLockedCudaRuntimeQualified: false
    readonly modelArtifactIngested: false
    readonly canonicalOperationArtifactSetVerified: false
    readonly privateGpuDistributionVerified: false
    readonly cloudRunReadOnlyMountVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly privateSourceFrameArtifactReadVerified: false
    readonly privateMaskOutputArtifactVerified: false
    readonly maskQaVerified: false
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

export interface CanonicalRembgGpuBundleRequirementProjection {
  readonly requirementSetDigestSha256: string
  readonly approvedToolId: 'rembg'
  readonly approvedOperationId:
    'tool.rembg.remove_image_background.v1'
  readonly consumerScope: 'rembg.private-inference'
  readonly requirements:
    readonly [CanonicalModelArtifactGpuBundleRequirement]
  readonly repositoryVerificationStillRequired: true
  readonly canonicalOperationArtifactSetVerified: false
  readonly cloudDispatchAuthorized: false
  readonly modelInferenceAuthority: false
  readonly productionReady: false
  readonly projectionDigestSha256: string
}

export interface CanonicalRembgGpuBundleRequirementProjectionInput {
  readonly requirementSet: unknown
  readonly locator: CanonicalModelArtifactLocator
}
