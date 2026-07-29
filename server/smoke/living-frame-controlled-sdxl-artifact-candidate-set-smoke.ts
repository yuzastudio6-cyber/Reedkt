import assert from 'node:assert/strict'

import type {
  LivingFrameControlledSdxlArtifactCandidateAuthority,
  LivingFrameControlledSdxlArtifactCandidateSet,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import {
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
  LivingFrameControlledSdxlArtifactCandidateSetError,
  createLivingFrameControlledSdxlArtifactCandidateSet,
  createLivingFrameControlledSdxlMetadataReader,
  verifyLivingFrameControlledSdxlArtifactCandidateSet,
  type LivingFrameControlledSdxlUpstreamMetadataObservation,
} from '../living-frame/living-frame-controlled-sdxl-artifact-candidate-set'
import {
  createLivingFrameComfyUiModelArtifactRequirements,
} from '../living-frame/living-frame-comfyui-model-artifact-requirements'
import {
  modelArtifactRequirementSmokeFixture,
} from './living-frame-comfyui-model-artifact-requirements-smoke'

const controlledObservation = {
  observedOnDate:
    LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
  artifacts: [
    {
      order: 1,
      role: 'base_checkpoint',
      bindingKind: 'base_checkpoint_artifact_expectation',
      artifactCode: 'sdxl_base_1_0_monolithic_safetensors',
      repositoryCode:
        'hf_stabilityai_stable_diffusion_xl_base_1_0',
      repositoryRevisionSha1:
        '462165984030d82259a11f4367a4eed129e94a7b',
      artifactFormat: 'safetensors',
      expectedModelFamily: 'stable_diffusion_xl_base_1_0',
      reportedByteLength: 6_938_078_334,
      reportedContentSha256:
        '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
      declaredLicenseLabel: 'openrail_plus_plus',
      compatibilityObservationCode:
        'base_repository_declares_sdxl_base_1_0',
    },
    {
      order: 2,
      role: 'controlnet_checkpoint',
      bindingKind: 'controlnet_checkpoint_artifact_expectation',
      artifactCode:
        'controlnet_canny_sdxl_1_0_small_fp16_safetensors',
      repositoryCode:
        'hf_diffusers_controlnet_canny_sdxl_1_0_small',
      repositoryRevisionSha1:
        'edd85f64c5f87dfb6d73762949d9daca16389518',
      artifactFormat: 'safetensors',
      expectedModelFamily: 'stable_diffusion_xl_base_1_0',
      reportedByteLength: 320_237_179,
      reportedContentSha256:
        'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
      declaredLicenseLabel: 'openrail_plus_plus',
      compatibilityObservationCode:
        'controlnet_model_card_names_sdxl_base_1_0',
    },
    {
      order: 3,
      role: 'lora_adapter',
      bindingKind: 'lora_artifact_expectation',
      artifactCode:
        'sdxl_offset_example_lora_1_0_safetensors',
      repositoryCode:
        'hf_stabilityai_stable_diffusion_xl_base_1_0',
      repositoryRevisionSha1:
        '462165984030d82259a11f4367a4eed129e94a7b',
      artifactFormat: 'safetensors',
      expectedModelFamily: 'stable_diffusion_xl_base_1_0',
      reportedByteLength: 49_553_604,
      reportedContentSha256:
        '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
      declaredLicenseLabel: 'openrail_plus_plus',
      compatibilityObservationCode:
        'lora_is_co_located_with_sdxl_base_only',
    },
    {
      order: 4,
      role: 'generic_ipadapter_checkpoint',
      bindingKind: 'generic_ipadapter_checkpoint_artifact',
      artifactCode:
        'generic_ipadapter_sdxl_big_g_safetensors',
      repositoryCode: 'hf_h94_ip_adapter',
      repositoryRevisionSha1:
        '018e402774aeeddd60609b4ecdb7e298259dc729',
      artifactFormat: 'safetensors',
      expectedModelFamily: 'stable_diffusion_xl_base_1_0',
      reportedByteLength: 702_585_376,
      reportedContentSha256:
        'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
      declaredLicenseLabel: 'apache_2_0',
      compatibilityObservationCode:
        'ipadapter_model_card_maps_sdxl_default_to_big_g',
    },
    {
      order: 5,
      role: 'clip_vision_checkpoint',
      bindingKind: 'clip_vision_checkpoint_artifact',
      artifactCode:
        'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
      repositoryCode: 'hf_h94_ip_adapter',
      repositoryRevisionSha1:
        '018e402774aeeddd60609b4ecdb7e298259dc729',
      artifactFormat: 'safetensors',
      expectedModelFamily: 'clip_vision_vit_big_g_14',
      reportedByteLength: 3_689_912_664,
      reportedContentSha256:
        '657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d',
      declaredLicenseLabel: 'apache_2_0',
      compatibilityObservationCode:
        'ipadapter_model_card_maps_sdxl_image_encoder_to_big_g',
    },
  ],
  documents: [
    {
      order: 1,
      documentCode: 'sdxl_base_model_card',
      repositoryCode:
        'hf_stabilityai_stable_diffusion_xl_base_1_0',
      repositoryRevisionSha1:
        '462165984030d82259a11f4367a4eed129e94a7b',
      observedContentDigestSha256:
        '40d263065b8a3e9a41996c257e11463fd97ae956ebf4e3f8b9625e0d78183893',
      declaredLicenseLabel: 'openrail_plus_plus',
      observedOnDate:
        LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
    },
    {
      order: 2,
      documentCode: 'sdxl_base_license',
      repositoryCode:
        'hf_stabilityai_stable_diffusion_xl_base_1_0',
      repositoryRevisionSha1:
        '462165984030d82259a11f4367a4eed129e94a7b',
      observedContentDigestSha256:
        '19b6998b569b53ac1fc2158a8a3202c8699a9a4605b47075715d9c96be7fb6d0',
      declaredLicenseLabel: 'openrail_plus_plus',
      observedOnDate:
        LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
    },
    {
      order: 3,
      documentCode: 'controlnet_canny_sdxl_small_model_card',
      repositoryCode:
        'hf_diffusers_controlnet_canny_sdxl_1_0_small',
      repositoryRevisionSha1:
        'edd85f64c5f87dfb6d73762949d9daca16389518',
      observedContentDigestSha256:
        '9cdd8431afd69f0fa9b3f4005d0b29d08f06ff7ed5cd9488913e8167950a9fff',
      declaredLicenseLabel: 'openrail_plus_plus',
      observedOnDate:
        LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
    },
    {
      order: 4,
      documentCode: 'generic_ipadapter_model_card',
      repositoryCode: 'hf_h94_ip_adapter',
      repositoryRevisionSha1:
        '018e402774aeeddd60609b4ecdb7e298259dc729',
      observedContentDigestSha256:
        'ba3a50dc2093d0eb075890e9af7409382874669d83939e64323246d0c4403cf8',
      declaredLicenseLabel: 'apache_2_0',
      observedOnDate:
        LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE,
    },
  ],
} as const satisfies
  LivingFrameControlledSdxlUpstreamMetadataObservation

const requirementsInput =
  modelArtifactRequirementSmokeFixture.input
const requirements =
  createLivingFrameComfyUiModelArtifactRequirements(
    requirementsInput,
  )
const reader = createLivingFrameControlledSdxlMetadataReader({
  readControlledObservation: async () =>
    structuredClone(controlledObservation),
})
const input = {
  candidateSetId: 'candidate-set.sdxl.controlled.001',
  requirements,
  requirementsInput,
  metadataReader: reader,
}
const candidateSet =
  await createLivingFrameControlledSdxlArtifactCandidateSet(input)

assert.equal(
  await verifyLivingFrameControlledSdxlArtifactCandidateSet(
    candidateSet,
    input,
  ),
  true,
)
assert.equal(candidateSet.artifacts.length, 5)
assert.equal(candidateSet.documents.length, 4)
assert.deepEqual(
  candidateSet.artifacts.map((artifact) => artifact.role),
  requirements.requirements.map((requirement) => requirement.role),
)
assert.deepEqual(
  candidateSet.artifacts.map(
    (artifact) => artifact.bindingDigestSha256,
  ),
  requirements.requirements.map(
    (requirement) => requirement.bindingDigestSha256,
  ),
)
assert.equal(
  candidateSet.metrics.totalReportedByteLength,
  11_700_367_157,
)
assert.equal(
  candidateSet.artifacts.every((artifact) =>
    artifact.upstreamBlobMetadataObserved
    && artifact.controlledMetadataObservationOnly
    && artifact.independentSourceReReadRequired
    && !artifact.artifactBytesFetchedByReeditPro
    && !artifact.fullContentDigestIndependentlyVerified
    && !artifact.safetensorsSchemaInspected
    && !artifact.canonicalRepositoryObjectPresent
    && !artifact.compatibilityBenchmarkPassed
    && !artifact.paidProductionUseApproved),
  true,
)
assert.equal(candidateSet.exactArtifactCompatibilityProven, false)
assert.equal(candidateSet.canonicalArtifactBundlePresent, false)
assert.equal(candidateSet.productionReady, false)
assertAllAuthorityClosed(candidateSet.authorityBoundary)

const serialized = JSON.stringify(candidateSet)
for (const forbidden of [
  '://',
  '/Users/',
  '/tmp/',
  '.safetensors',
  'api/models',
  'resolve/',
  'token',
  'credential',
]) {
  assert.equal(
    serialized.includes(forbidden),
    false,
    `Serialized candidate set must not include ${forbidden}.`,
  )
}

await assert.rejects(
  () => createLivingFrameControlledSdxlArtifactCandidateSet({
    ...input,
    metadataReader: null,
  }),
  /controlled SDXL artifact candidate set failed/,
)
await assert.rejects(
  () => createLivingFrameControlledSdxlArtifactCandidateSet({
    ...input,
    metadataReader: {
      ...reader,
    },
  } as never),
  /controlled SDXL artifact candidate set failed/,
)
await assert.rejects(
  () => createLivingFrameControlledSdxlArtifactCandidateSet({
    ...input,
    metadataReader:
      createLivingFrameControlledSdxlMetadataReader({
        readControlledObservation: async () => {
          throw new Error('controlled reader unavailable')
        },
      }),
  }),
  /controlled SDXL artifact candidate set failed/,
)

for (const mutate of [
  (
    value: Mutable<
      LivingFrameControlledSdxlUpstreamMetadataObservation
    >,
  ) => {
    value.observedOnDate = '2026-07-27' as never
  },
  (
    value: Mutable<
      LivingFrameControlledSdxlUpstreamMetadataObservation
    >,
  ) => {
    value.artifacts[0]!.repositoryRevisionSha1 = 'a'.repeat(40)
  },
  (
    value: Mutable<
      LivingFrameControlledSdxlUpstreamMetadataObservation
    >,
  ) => {
    value.artifacts[1]!.reportedContentSha256 = 'b'.repeat(64)
  },
  (
    value: Mutable<
      LivingFrameControlledSdxlUpstreamMetadataObservation
    >,
  ) => {
    value.artifacts.reverse()
  },
  (
    value: Mutable<
      LivingFrameControlledSdxlUpstreamMetadataObservation
    >,
  ) => {
    value.documents[0]!.observedContentDigestSha256 =
      'c'.repeat(64)
  },
] as const) {
  const altered = structuredClone(
    controlledObservation,
  ) as unknown as Mutable<
    LivingFrameControlledSdxlUpstreamMetadataObservation
  >
  mutate(altered)
  await assert.rejects(
    () => createLivingFrameControlledSdxlArtifactCandidateSet({
      ...input,
      metadataReader:
        createLivingFrameControlledSdxlMetadataReader({
          readControlledObservation: async () => altered,
        }),
    }),
    /controlled SDXL artifact candidate set failed/,
  )
}

const alteredRequirements =
  structuredClone(requirements) as unknown as Mutable<
    typeof requirements
  >
alteredRequirements.requirements[0]!.expectedFamily = {
  familyClass: 'diffusion_base_model_family',
  family: 'stable_diffusion_1_5',
}
await assert.rejects(
  () => createLivingFrameControlledSdxlArtifactCandidateSet({
    ...input,
    requirements: alteredRequirements,
  }),
  /controlled SDXL artifact candidate set failed/,
)

for (const forged of [
  {
    ...candidateSet,
    productionReady: true,
  },
  {
    ...candidateSet,
    candidateSetDigestSha256: 'd'.repeat(64),
  },
  {
    ...candidateSet,
    artifactPath: '/tmp/untrusted.safetensors',
  },
  {
    ...candidateSet,
    authorityBoundary: {
      ...candidateSet.authorityBoundary,
      modelWeightAuthority: true,
      operationAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      forged,
      input,
    ),
    false,
  )
}

const allGreenObservation = {
  ...structuredClone(controlledObservation),
  verified: true,
  approved: true,
  runtimeReady: true,
}
await assert.rejects(
  () => createLivingFrameControlledSdxlArtifactCandidateSet({
    ...input,
    metadataReader:
      createLivingFrameControlledSdxlMetadataReader({
        readControlledObservation:
          async () => allGreenObservation as never,
      }),
  }),
  /controlled SDXL artifact candidate set failed/,
)

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-artifact-candidate-set',
  controlledFixtures: 1,
  adversarialAssertions: 16,
  artifactCount: candidateSet.artifacts.length,
  totalReportedByteLength:
    candidateSet.metrics.totalReportedByteLength,
  artifactBytesFetchedByReeditPro: false,
  exactArtifactCompatibilityProven: false,
  canonicalArtifactBundlePresent: false,
  productionReady: false,
}))

function assertAllAuthorityClosed(
  authority:
    LivingFrameControlledSdxlArtifactCandidateAuthority,
): void {
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      key === 'controlledUpstreamMetadataObservationConsumed',
      `Unexpected authority value for ${key}.`,
    )
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]:
    T[K] extends readonly (infer U)[]
      ? Mutable<U>[]
      : T[K] extends object
        ? Mutable<T[K]>
        : T[K]
}

void LivingFrameControlledSdxlArtifactCandidateSetError
void (candidateSet satisfies
  LivingFrameControlledSdxlArtifactCandidateSet)
