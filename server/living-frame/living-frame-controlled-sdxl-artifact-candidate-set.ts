import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlArtifactCandidate,
  LivingFrameControlledSdxlArtifactCandidateAuthority,
  LivingFrameControlledSdxlArtifactCandidateIssue,
  LivingFrameControlledSdxlArtifactCandidateIssueCode,
  LivingFrameControlledSdxlArtifactCandidateSet,
  LivingFrameControlledSdxlArtifactCandidateSetDraft,
  LivingFrameControlledSdxlDocumentObservation,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import {
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import type {
  LivingFrameComfyUiModelArtifactRequirements,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import type {
  CreateLivingFrameComfyUiModelArtifactRequirementsInput,
} from './living-frame-comfyui-model-artifact-requirements'
import {
  verifyLivingFrameComfyUiModelArtifactRequirements,
} from './living-frame-comfyui-model-artifact-requirements'

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE =
  '2026-07-28' as const

type CandidateMetadata =
  Pick<
    LivingFrameControlledSdxlArtifactCandidate,
    | 'order'
    | 'role'
    | 'bindingKind'
    | 'artifactCode'
    | 'repositoryCode'
    | 'repositoryRevisionSha1'
    | 'artifactFormat'
    | 'expectedModelFamily'
    | 'reportedByteLength'
    | 'reportedContentSha256'
    | 'declaredLicenseLabel'
    | 'compatibilityObservationCode'
  >

type DocumentMetadata =
  Pick<
    LivingFrameControlledSdxlDocumentObservation,
    | 'order'
    | 'documentCode'
    | 'repositoryCode'
    | 'repositoryRevisionSha1'
    | 'observedContentDigestSha256'
    | 'declaredLicenseLabel'
    | 'observedOnDate'
  >

export interface LivingFrameControlledSdxlUpstreamMetadataObservation {
  readonly observedOnDate:
    typeof LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE
  readonly artifacts: readonly CandidateMetadata[]
  readonly documents: readonly DocumentMetadata[]
}

export interface LivingFrameControlledSdxlMetadataReaderPort {
  readonly readerClass:
    'process_bound_server_owned_sdxl_upstream_metadata_reader'
  readonly callerMetadataAccepted: false
  readonly callerArtifactLocatorAccepted: false
  readonly callerPathUrlFilenameOrBytesAccepted: false
  readonly currentSourceAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly modelWeightAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readControlledObservation():
    Promise<LivingFrameControlledSdxlUpstreamMetadataObservation>
}

export interface CreateLivingFrameControlledSdxlArtifactCandidateSetInput {
  readonly candidateSetId: string
  readonly requirements: LivingFrameComfyUiModelArtifactRequirements
  readonly requirementsInput:
    CreateLivingFrameComfyUiModelArtifactRequirementsInput
  readonly metadataReader:
    LivingFrameControlledSdxlMetadataReaderPort | null
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const metadataReaderPorts = new WeakSet<object>()

const EXPECTED_ARTIFACTS: readonly CandidateMetadata[] =
  Object.freeze([
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
  ] satisfies readonly CandidateMetadata[])

const EXPECTED_DOCUMENTS: readonly DocumentMetadata[] =
  Object.freeze([
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
  ] satisfies readonly DocumentMetadata[])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlArtifactCandidateAuthority =
  Object.freeze({
    controlledUpstreamMetadataObservationConsumed: true,
    currentSourceAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    artifactRepositoryAuthority: false,
    artifactLocatorAuthority: false,
    artifactManifestAuthority: false,
    modelWeightAuthority: false,
    modelCompatibilityAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    semanticRouteAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export class LivingFrameControlledSdxlArtifactCandidateSetError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlArtifactCandidateIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlArtifactCandidateIssue[],
  ) {
    super('Living Frame controlled SDXL artifact candidate set failed.')
    this.name =
      'LivingFrameControlledSdxlArtifactCandidateSetError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlMetadataReader(
  input: {
    readonly readControlledObservation:
      LivingFrameControlledSdxlMetadataReaderPort[
        'readControlledObservation'
      ]
  },
): LivingFrameControlledSdxlMetadataReaderPort {
  if (typeof input.readControlledObservation !== 'function') {
    throw invalid('reader_invalid', '$.metadataReader')
  }
  const port =
    Object.freeze<LivingFrameControlledSdxlMetadataReaderPort>({
      readerClass:
        'process_bound_server_owned_sdxl_upstream_metadata_reader',
      callerMetadataAccepted: false,
      callerArtifactLocatorAccepted: false,
      callerPathUrlFilenameOrBytesAccepted: false,
      currentSourceAuthority: false,
      artifactRepositoryAuthority: false,
      modelWeightAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readControlledObservation:
        input.readControlledObservation.bind(undefined),
    })
  metadataReaderPorts.add(port)
  return port
}

export async function createLivingFrameControlledSdxlArtifactCandidateSet(
  input: CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
): Promise<LivingFrameControlledSdxlArtifactCandidateSet> {
  assertInput(input)
  if (
    !verifyLivingFrameComfyUiModelArtifactRequirements(
      input.requirements,
      input.requirementsInput,
    )
  ) throw invalid('requirements_invalid', '$.requirements')
  assertRequirementsCompatible(input.requirements)
  const reader = requireReader(input.metadataReader)
  let observation: LivingFrameControlledSdxlUpstreamMetadataObservation
  try {
    observation = await reader.readControlledObservation()
  } catch {
    throw invalid('reader_failed', '$.metadataReader')
  }
  assertObservation(observation)
  const artifacts = compileArtifacts(
    input.requirements,
    observation.artifacts,
  )
  const documents = compileDocuments(observation.documents)
  const draft:
    LivingFrameControlledSdxlArtifactCandidateSetDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_CLASS,
    candidateSetId: input.candidateSetId,
    candidateState:
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_STATE,
    observedOnDate: observation.observedOnDate,
    sourceBindings: {
      requirementSetId: input.requirements.requirementSetId,
      requirementsDigestSha256:
        input.requirements.requirementsDigestSha256,
      controlledModelFamilyBindingId:
        input.requirements.sourceBindings
          .controlledModelFamilyBindingId,
      controlledModelFamilyBindingDigestSha256:
        input.requirements.sourceBindings
          .controlledModelFamilyBindingDigestSha256,
    },
    artifacts,
    documents,
    metrics: {
      artifactCount: 5,
      documentCount: 4,
      totalReportedByteLength:
        artifacts.reduce(
          (sum, artifact) =>
            sum + artifact.reportedByteLength,
          0,
        ),
      upstreamBlobMetadataObservationCount: 5,
      independentlyVerifiedArtifactByteCount: 0,
      compatibilityBenchmarkPassedCount: 0,
      paidProductionUseApprovedCount: 0,
    },
    coherenceChecks: {
      requirementRolesExactlyCovered: true,
      requirementBindingDigestsExactlyBound: true,
      allDiffusionArtifactsDeclareSdxlFamily: true,
      genericIpAdapterAndClipVisionPairDeclareBigG: true,
      faceIdInsightFaceAndAuraFaceGenerationRoutesAbsent: true,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    sourceRequirementsRevalidated: true,
    processBoundReaderConsumed: true,
    upstreamMetadataExactlyMatched: true,
    artifactBytesOrLocatorsPresent: false,
    exactArtifactCompatibilityProven: false,
    canonicalArtifactBundlePresent: false,
    containsUrlPathFilenameCredentialOrRawBytes: false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    candidateSetDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlArtifactCandidateSet(
  value: unknown,
  input: CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
): Promise<boolean> {
  try {
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlArtifactCandidateSet(
        input,
      ),
    )
  } catch {
    return false
  }
}

function assertRequirementsCompatible(
  requirements: LivingFrameComfyUiModelArtifactRequirements,
): void {
  if (
    requirements.requirements.length !== EXPECTED_ARTIFACTS.length
    || requirements.requirements.some((requirement, index) => {
      const expected = EXPECTED_ARTIFACTS[index]!
      return (
        requirement.order !== expected.order
        || requirement.role !== expected.role
        || requirement.bindingKind !== expected.bindingKind
        || requirement.expectedFamily.family
          !== expected.expectedModelFamily
      )
    })
  ) throw invalid(
    'requirement_set_incompatible',
    '$.requirements.requirements',
  )
}

function requireReader(
  value: LivingFrameControlledSdxlMetadataReaderPort | null,
): LivingFrameControlledSdxlMetadataReaderPort {
  if (
    !value
    || !metadataReaderPorts.has(value)
    || value.readerClass
      !==
      'process_bound_server_owned_sdxl_upstream_metadata_reader'
    || value.callerMetadataAccepted !== false
    || value.callerArtifactLocatorAccepted !== false
    || value.callerPathUrlFilenameOrBytesAccepted !== false
    || value.currentSourceAuthority !== false
    || value.artifactRepositoryAuthority !== false
    || value.modelWeightAuthority !== false
    || value.runtimeAuthority !== false
    || value.productionReady !== false
    || typeof value.readControlledObservation !== 'function'
  ) throw invalid('reader_invalid', '$.metadataReader')
  return value
}

function assertObservation(
  observation: LivingFrameControlledSdxlUpstreamMetadataObservation,
): void {
  if (
    !isRecord(observation)
    || !hasExactKeys(observation, [
      'observedOnDate',
      'artifacts',
      'documents',
    ])
  ) throw invalid('observation_invalid', '$.metadataReader')
  if (
    observation.observedOnDate
      !== LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_OBSERVATION_DATE
  ) throw invalid('observation_date_invalid', '$.observedOnDate')
  if (
    canonicalJson(observation.artifacts)
      !== canonicalJson(EXPECTED_ARTIFACTS)
  ) throw invalid('artifact_metadata_mismatch', '$.artifacts')
  if (
    canonicalJson(observation.documents)
      !== canonicalJson(EXPECTED_DOCUMENTS)
  ) throw invalid('document_metadata_mismatch', '$.documents')
}

function compileArtifacts(
  requirements: LivingFrameComfyUiModelArtifactRequirements,
  metadata: readonly CandidateMetadata[],
): readonly LivingFrameControlledSdxlArtifactCandidate[] {
  const artifactCodes = metadata.map((entry) => entry.artifactCode)
  const shaValues =
    metadata.map((entry) => entry.reportedContentSha256)
  if (
    new Set(artifactCodes).size !== artifactCodes.length
    || new Set(shaValues).size !== shaValues.length
  ) throw invalid('artifact_duplicate', '$.artifacts')
  return metadata.map((entry, index) => {
    const requirement = requirements.requirements[index]!
    if (
      requirement.role !== entry.role
      || requirement.bindingKind !== entry.bindingKind
    ) throw invalid('artifact_role_mismatch', `$.artifacts.${index}`)
    if (
      requirement.expectedFamily.family
        !== entry.expectedModelFamily
    ) throw invalid('artifact_family_mismatch', `$.artifacts.${index}`)
    return {
      ...entry,
      bindingDigestSha256: requirement.bindingDigestSha256,
      upstreamBlobMetadataObserved: true,
      controlledMetadataObservationOnly: true,
      independentSourceReReadRequired: true,
      artifactBytesFetchedByReeditPro: false,
      fullContentDigestIndependentlyVerified: false,
      safetensorsSchemaInspected: false,
      canonicalRepositoryObjectPresent: false,
      compatibilityBenchmarkPassed: false,
      paidProductionUseApproved: false,
    }
  })
}

function compileDocuments(
  metadata: readonly DocumentMetadata[],
): readonly LivingFrameControlledSdxlDocumentObservation[] {
  return metadata.map((entry) => ({
    ...entry,
    controlledDocumentObservationOnly: true,
    independentSourceReReadRequired: true,
    currentTruthAuthority: false,
    legalInterpretationProvided: false,
    commercialApprovalProvided: false,
  }))
}

function assertInput(
  input: CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'candidateSetId',
      'requirements',
      'requirementsInput',
      'metadataReader',
    ])
    || typeof input.candidateSetId !== 'string'
    || !SAFE_ID.test(input.candidateSetId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code: LivingFrameControlledSdxlArtifactCandidateIssueCode,
  path: string,
): LivingFrameControlledSdxlArtifactCandidateSetError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame SDXL artifact issue code.')
  return new LivingFrameControlledSdxlArtifactCandidateSetError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  throw invalid('observation_invalid', '$')
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze)
    return Object.freeze(value)
  }
  if (isRecord(value)) {
    Object.values(value).forEach(deepFreeze)
    return Object.freeze(value)
  }
  return value
}
