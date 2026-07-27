import assert from 'node:assert/strict'

import {
  CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION,
  assertCanonicalSam2GpuBundleRequirementProjection,
  assertCanonicalSam2ModelArtifactRequirementSet,
  createCanonicalModelArtifactSourceReader,
  getCanonicalSam2ModelArtifactRequirementSet,
  projectCanonicalSam2GpuBundleRequirements,
  type CanonicalModelArtifactLocator,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const requirementSet =
  getCanonicalSam2ModelArtifactRequirementSet()

assert.equal(
  requirementSet.approvedToolId,
  'sam2',
)
assert.equal(
  requirementSet.approvedOperationId,
  'tool.sam2.segment_and_track_subject.v1',
)
assert.equal(requirementSet.summary.artifactCount, 1)
assert.equal(
  requirementSet.summary.totalByteLength,
  184_416_285,
)
assert.equal(
  requirementSet.sourceObservation.sourceRevision,
  '2b90b9f5ceec907a1c18123530e92e794ad901a4',
)
assert.equal(
  requirementSet.sourceObservation.checkpointRepositoryRevision,
  'ee5bba1d82bb8749febdf90f45e84b687142ba03',
)
assert.equal(
  requirementSet.sourceObservation.checkpointSha256,
  '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
)
assert.equal(
  requirementSet.sourceObservation.checkpointByteLength,
  184_416_285,
)
assert.equal(
  requirementSet.sourceObservation
    .officialMetaDistributionSha256Matches,
  true,
)
assert.equal(
  requirementSet.sourceObservation
    .googleCloudRunL4BenchmarkPerformed,
  false,
)
assert.equal(
  requirementSet.sourceObservation
    .checkpointRepositoryConfigMatchesSelectedRuntimeConfig,
  false,
)
assert.equal(
  requirementSet.sourceObservation.selectedRuntimeConfigSource,
  'pinned_official_source_repository',
)
assert.equal(
  requirementSet.sourceObservation.nativeSam2BuilderRequired,
  true,
)
assert.equal(
  requirementSet.sourceObservation
    .huggingFaceFromPretrainedRouteQualified,
  false,
)
assert.equal(
  requirementSet.descriptor.executionPolicy.executionClass,
  'gpu_required',
)
assert.equal(
  requirementSet.descriptor.executionPolicy
    .requiredExecutionTarget,
  'google_cloud_run_gpu',
)
assert.equal(
  requirementSet.descriptor.executionPolicy.accelerator,
  'cuda',
)
assert.equal(
  requirementSet.descriptor.executionPolicy.cpuFallbackAllowed,
  false,
)
assert.equal(
  requirementSet.descriptor.licensePolicy.commercialUseStatus,
  'allowed',
)
assert.equal(
  requirementSet.descriptor.licensePolicy.reviewStatus,
  'evaluation_only',
)
assert.equal(
  requirementSet.descriptor.licensePolicy
    .paidProductionUseApproved,
  false,
)
assert.equal(
  requirementSet.boundaries
    .exactModelArtifactSlotDefinitionComplete,
  true,
)
assert.equal(
  requirementSet.boundaries
    .legacyManifestTemplateStillPlaceholder,
  true,
)
assert.equal(
  requirementSet.boundaries.modelArtifactIngested,
  false,
)
assert.equal(
  requirementSet.boundaries
    .canonicalOperationArtifactSetVerified,
  false,
)
assert.equal(
  requirementSet.boundaries.modelInferenceAuthority,
  false,
)
assert.equal(requirementSet.boundaries.productionReady, false)
assert.ok(requirementSet.blockers.includes(
  'sam2_pickle_checkpoint_confined_deserialization_not_qualified',
))
assert.ok(requirementSet.blockers.includes(
  'google_cloud_run_l4_cuda_benchmark_not_run',
))
assert.ok(requirementSet.blockers.includes(
  'sam2_runtime_config_checkpoint_load_fixture_not_passed',
))

const sourceReader = createCanonicalModelArtifactSourceReader({
  descriptor: requirementSet.descriptor,
  openServerOwnedByteStream: async () => {
    throw new Error('smoke must not open or download SAM2 bytes')
  },
})
assert.equal(
  sourceReader.readerVersion,
  CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION,
)
assert.equal(sourceReader.callerBytesAccepted, false)
assert.equal(sourceReader.runtimeDownloadAllowed, false)

const locator: CanonicalModelArtifactLocator = {
  locatorVersion: 'canonical-model-artifact-locator-v1',
  artifactRecordId: `model-artifact-${'a'.repeat(64)}`,
  artifactId: requirementSet.descriptor.artifactId,
  revision: requirementSet.descriptor.revision,
  contentSha256: requirementSet.descriptor.contentSha256,
  manifestDigestSha256: 'b'.repeat(64),
}

const projection = projectCanonicalSam2GpuBundleRequirements({
  requirementSet,
  locator,
})
assert.equal(projection.consumerScope, 'sam2.private-inference')
assert.equal(projection.requirements.length, 1)
assert.equal(
  projection.requirements[0].expectedArtifactFormat,
  'pytorch_checkpoint',
)
assert.equal(
  projection.requirements[0].expectedByteLength,
  184_416_285,
)
assert.equal(
  projection.repositoryVerificationStillRequired,
  true,
)
assert.equal(
  projection.canonicalOperationArtifactSetVerified,
  false,
)
assert.equal(projection.modelInferenceAuthority, false)
assert.equal(projection.productionReady, false)
assert.deepEqual(
  assertCanonicalSam2GpuBundleRequirementProjection(
    structuredClone(projection),
  ),
  projection,
)
assert.deepEqual(
  assertCanonicalSam2ModelArtifactRequirementSet(
    structuredClone(requirementSet),
  ),
  requirementSet,
)

let adversarialAssertions = 0

expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    forgedProductionAuthority: true,
  }),
  'unknown requirement-set field',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    approvedOperationId: 'tool.sam2.unregistered.v1',
  })),
  'correctly re-signed wrong operation',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    boundaries: {
      ...requirementSet.boundaries,
      productionReady: true,
    },
  })),
  'correctly re-signed production authority',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    sourceObservation: {
      ...requirementSet.sourceObservation,
      sourceRevision:
        'main',
    },
  })),
  'mutable source revision',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    sourceObservation: {
      ...requirementSet.sourceObservation,
      checkpointRepositoryRevision:
        'main',
    },
  })),
  'mutable checkpoint revision',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    descriptor: {
      ...requirementSet.descriptor,
      contentSha256: 'c'.repeat(64),
    },
  })),
  're-signed wrong checkpoint hash',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    descriptor: {
      ...requirementSet.descriptor,
      executionPolicy: {
        ...requirementSet.descriptor.executionPolicy,
        requiredExecutionTarget: 'private_controlled_cpu',
      },
    },
  })),
  're-signed CPU target',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    descriptor: {
      ...requirementSet.descriptor,
      executionPolicy: {
        ...requirementSet.descriptor.executionPolicy,
        cpuFallbackAllowed: true,
      },
    },
  })),
  're-signed CPU fallback',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    descriptor: {
      ...requirementSet.descriptor,
      executionPolicy: {
        ...requirementSet.descriptor.executionPolicy,
        runtimeDownloadAllowed: true,
      },
    },
  })),
  're-signed runtime download',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    sourceObservation: {
      ...requirementSet.sourceObservation,
      checkpointRepositoryConfigMatchesSelectedRuntimeConfig:
        true,
    },
  })),
  'forged config compatibility',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet(rehash({
    ...structuredClone(requirementSet),
    descriptor: {
      ...requirementSet.descriptor,
      licensePolicy: {
        ...requirementSet.descriptor.licensePolicy,
        paidProductionUseApproved: true,
      },
    },
  })),
  're-signed paid-production approval',
  'sam2_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalSam2ModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    requirementSetDigestSha256: 'd'.repeat(64),
  }),
  'wrong requirement-set digest',
  'sam2_model_artifact_requirement_set_mismatch',
)
expectRejects(
  () => projectCanonicalSam2GpuBundleRequirements({
    requirementSet,
    locator: {
      ...locator,
      artifactId: 'different-model',
    },
  }),
  'wrong locator artifact',
  'sam2_model_artifact_locator_invalid',
)
expectRejects(
  () => projectCanonicalSam2GpuBundleRequirements({
    requirementSet,
    locator: {
      ...locator,
      contentSha256: 'e'.repeat(64),
    },
  }),
  'wrong locator checksum',
  'sam2_model_artifact_locator_invalid',
)
expectRejects(
  () => projectCanonicalSam2GpuBundleRequirements({
    requirementSet,
    locator: {
      ...locator,
      forgedPath: '/tmp/model.pt',
    } as CanonicalModelArtifactLocator,
  }),
  'path-bearing locator',
  'sam2_model_artifact_locator_invalid',
)
expectRejects(
  () => assertCanonicalSam2GpuBundleRequirementProjection({
    ...structuredClone(projection),
    projectionDigestSha256: 'f'.repeat(64),
  }),
  'wrong projection digest',
  'sam2_gpu_bundle_requirement_projection_mismatch',
)
expectRejects(
  () => assertCanonicalSam2GpuBundleRequirementProjection({
    ...structuredClone(projection),
    repositoryVerificationStillRequired: false,
  }),
  'forged repository verification',
  'sam2_gpu_bundle_requirement_projection_invalid',
)
expectRejects(
  () => assertCanonicalSam2GpuBundleRequirementProjection({
    ...structuredClone(projection),
    modelInferenceAuthority: true,
  }),
  'forged inference authority',
  'sam2_gpu_bundle_requirement_projection_invalid',
)

console.log(JSON.stringify({
  requirementSetVersion: requirementSet.requirementSetVersion,
  approvedOperationId: requirementSet.approvedOperationId,
  modelVariant: requirementSet.artifacts[0].modelFamily,
  sourceRevision: requirementSet.sourceObservation.sourceRevision,
  checkpointRepositoryRevision:
    requirementSet.sourceObservation.checkpointRepositoryRevision,
  checkpointByteLength:
    requirementSet.sourceObservation.checkpointByteLength,
  checkpointSha256:
    requirementSet.sourceObservation.checkpointSha256,
  officialMetaDistributionSha256Matches:
    requirementSet.sourceObservation
      .officialMetaDistributionSha256Matches,
  executionTarget:
    requirementSet.descriptor.executionPolicy
      .requiredExecutionTarget,
  accelerator:
    requirementSet.descriptor.executionPolicy.accelerator,
  cpuFallbackAllowed:
    requirementSet.descriptor.executionPolicy.cpuFallbackAllowed,
  artifactSlotDefinitionComplete:
    requirementSet.summary.modelArtifactSlotDefinitionComplete,
  repositoryVerificationStillRequired:
    projection.repositoryVerificationStillRequired,
  googleCloudRunL4BenchmarkVerified:
    requirementSet.boundaries.cloudRunL4CudaBenchmarkVerified,
  modelInferenceAuthority:
    requirementSet.boundaries.modelInferenceAuthority,
  productionReady: requirementSet.boundaries.productionReady,
  adversarialAssertions,
}, null, 2))

function rehash(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.requirementSetDigestSha256
  return {
    ...draft,
    requirementSetDigestSha256: sha256AuthorityValue(draft),
  }
}

function expectRejects(
  operation: () => unknown,
  label: string,
  code: string,
): void {
  assert.throws(
    operation,
    (error: unknown) => {
      assert.equal(error instanceof Error, true, `${label}: Error`)
      assert.equal(
        (error as Error).message.includes(code),
        true,
        `${label}: ${String((error as Error).message)}`,
      )
      return true
    },
    label,
  )
  adversarialAssertions += 1
}
