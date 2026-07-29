import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlBaseByteObservation,
  LivingFrameControlledSdxlBaseByteObservationAuthority,
  LivingFrameControlledSdxlBaseByteObservationDraft,
  LivingFrameControlledSdxlBaseByteObservationIssue,
  LivingFrameControlledSdxlBaseByteObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-base-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BASE_ARTIFACT_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_KEY_SET_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_NAMESPACE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_REVISION,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-base-byte-observation'
import type {
  LivingFrameControlledSdxlClipVisionByteObservation,
} from '../../src/types/living-frame-controlled-sdxl-clip-vision-byte-observation'
import type {
  LivingFrameControlledSdxlControlNetByteObservation,
} from '../../src/types/living-frame-controlled-sdxl-controlnet-byte-observation'
import type {
  LivingFrameControlledSdxlIpAdapterByteObservation,
} from '../../src/types/living-frame-controlled-sdxl-ipadapter-byte-observation'
import type {
  LivingFrameControlledSdxlLoraByteObservation,
} from '../../src/types/living-frame-controlled-sdxl-lora-byte-observation'
import type {
  LivingFrameControlledSdxlArtifactCandidate,
  LivingFrameControlledSdxlArtifactCandidateSet,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import type {
  CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
} from './living-frame-controlled-sdxl-artifact-candidate-set'
import {
  verifyLivingFrameControlledSdxlArtifactCandidateSet,
} from './living-frame-controlled-sdxl-artifact-candidate-set'
import {
  verifyLivingFrameControlledSdxlClipVisionByteObservation,
} from './living-frame-controlled-sdxl-clip-vision-byte-observation'
import type {
  LivingFrameControlledSafetensorsByteInspection,
} from './living-frame-controlled-safetensors-byte-inspector'
import {
  inspectLivingFrameControlledSafetensorsByteStream,
} from './living-frame-controlled-safetensors-byte-inspector'

export interface LivingFrameControlledSdxlBaseByteReaderPort {
  readonly readerClass:
    'process_bound_server_owned_exact_sdxl_base_byte_reader'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly artifactRepositoryAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CreateLivingFrameControlledSdxlBaseByteObservationInput {
  readonly observationId: string
  readonly candidateSet: LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly priorControlNetObservation:
    LivingFrameControlledSdxlControlNetByteObservation
  readonly priorIpAdapterObservation:
    LivingFrameControlledSdxlIpAdapterByteObservation
  readonly priorClipVisionObservation:
    LivingFrameControlledSdxlClipVisionByteObservation
  readonly byteReader:
    LivingFrameControlledSdxlBaseByteReaderPort | null
}

export interface VerifyLivingFrameControlledSdxlBaseByteObservationInput {
  readonly candidateSet: LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly priorControlNetObservation:
    LivingFrameControlledSdxlControlNetByteObservation
  readonly priorIpAdapterObservation:
    LivingFrameControlledSdxlIpAdapterByteObservation
  readonly priorClipVisionObservation:
    LivingFrameControlledSdxlClipVisionByteObservation
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXPECTED_TENSOR_COUNT = 2_515
const EXPECTED_DATA_SECTION_BYTES = 6_937_675_890
const EXPECTED_DTYPE_COUNTS = Object.freeze([
  { dtype: 'F16', count: 2_515 },
] as const)
const EXPECTED_RANK_COUNTS = Object.freeze([
  { rank: 0, count: 1 },
  { rank: 1, count: 1_442 },
  { rank: 2, count: 949 },
  { rank: 4, count: 123 },
] as const)
const EXPECTED_NAMESPACE_COUNTS = Object.freeze([
  { namespace: 'conditioner', count: 587 },
  { namespace: 'first_stage_model', count: 248 },
  { namespace: 'model', count: 1_680 },
] as const)
const EXPECTED_METADATA_VALUES = Object.freeze({
  'modelspec.sai_model_spec': '1.0.0',
  'modelspec.architecture': 'stable-diffusion-xl-v1-base',
  'modelspec.title': 'Stable Diffusion XL 1.0 Base',
  'modelspec.resolution': '1024x1024',
  'modelspec.prediction_type': 'epsilon',
  'modelspec.license': 'CreativeML Open RAIL++-M License',
} as const)
const EXPECTED_SELECTED_TENSOR_SHAPES = Object.freeze([
  [
    'conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
    [77, 768],
  ],
  [
    'conditioner.embedders.0.transformer.text_model.embeddings.token_embedding.weight',
    [49408, 768],
  ],
  ['conditioner.embedders.1.model.logit_scale', []],
  [
    'conditioner.embedders.1.model.text_projection',
    [1280, 1280],
  ],
  [
    'conditioner.embedders.1.model.token_embedding.weight',
    [49408, 1280],
  ],
  [
    'first_stage_model.decoder.conv_out.weight',
    [3, 128, 3, 3],
  ],
  [
    'first_stage_model.encoder.conv_in.weight',
    [128, 3, 3, 3],
  ],
  [
    'model.diffusion_model.input_blocks.0.0.weight',
    [320, 4, 3, 3],
  ],
  [
    'model.diffusion_model.label_emb.0.0.weight',
    [1280, 2816],
  ],
  [
    'model.diffusion_model.middle_block.1.transformer_blocks.0.attn2.to_k.weight',
    [1280, 2048],
  ],
  ['model.diffusion_model.out.2.weight', [4, 320, 3, 3]],
] as const)

const byteReaderPorts = new WeakSet<object>()
const consumedByteReaderPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlBaseByteObservationAuthority =
  Object.freeze({
    processBoundServerOwnedBytesConsumed: true,
    fullContentDigestVerificationAuthority: true,
    safetensorsStructureObservationAuthority: true,
    currentUpstreamSourceAuthority: false,
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

export class LivingFrameControlledSdxlBaseByteObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlBaseByteObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlBaseByteObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL base byte observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlBaseByteObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlBaseByteReader(
  input: {
    readonly openServerOwnedByteStream:
      LivingFrameControlledSdxlBaseByteReaderPort[
        'openServerOwnedByteStream'
      ]
  },
): LivingFrameControlledSdxlBaseByteReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('reader_invalid', '$.byteReader')
  }
  const reader =
    Object.freeze<LivingFrameControlledSdxlBaseByteReaderPort>({
      readerClass:
        'process_bound_server_owned_exact_sdxl_base_byte_reader',
      callerBytesAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      runtimeDownloadAllowed: false,
      artifactRepositoryAuthority: false,
      modelExecutionAuthority: false,
      productionReady: false,
      openServerOwnedByteStream:
        input.openServerOwnedByteStream.bind(undefined),
    })
  byteReaderPorts.add(reader)
  return reader
}

export async function createLivingFrameControlledSdxlBaseByteObservation(
  input: CreateLivingFrameControlledSdxlBaseByteObservationInput,
): Promise<LivingFrameControlledSdxlBaseByteObservation> {
  assertInput(input)
  await assertParents(input)
  const candidate = requireBaseCandidate(input.candidateSet)
  const reader = requireReader(input.byteReader)
  consumedByteReaderPorts.add(reader)
  let stream: Readable
  try {
    stream = await reader.openServerOwnedByteStream()
  } catch {
    throw invalid('reader_failed', '$.byteReader')
  }
  let inspection:
    LivingFrameControlledSafetensorsByteInspection
  try {
    inspection =
      await inspectLivingFrameControlledSafetensorsByteStream({
        stream,
        expectedByteLength:
          LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
        expectedContentSha256:
          LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
        maximumHeaderByteLength: 1024 * 1024,
        expectedMetadataValues: EXPECTED_METADATA_VALUES,
        selectedTensorNames:
          EXPECTED_SELECTED_TENSOR_SHAPES.map(([name]) => name),
      })
  } catch {
    throw invalid(
      'safetensors_inspection_failed',
      '$.safetensors',
    )
  }
  assertExactInspection(inspection)
  const draft = compileDraft(input, candidate)
  return deepFreeze({
    ...draft,
    observationDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlBaseByteObservation(
  value: unknown,
  input: VerifyLivingFrameControlledSdxlBaseByteObservationInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.observationId !== 'string'
      || !SAFE_ID.test(value.observationId)
    ) return false
    await assertParents(input)
    const candidate = requireBaseCandidate(input.candidateSet)
    const draft = compileDraft({
      observationId: value.observationId,
      candidateSet: input.candidateSet,
      priorClipVisionObservation:
        input.priorClipVisionObservation,
    }, candidate)
    return canonicalJson(value) === canonicalJson({
      ...draft,
      observationDigestSha256: digest(draft),
    })
  } catch {
    return false
  }
}

function compileDraft(
  input: {
    readonly observationId: string
    readonly candidateSet:
      LivingFrameControlledSdxlArtifactCandidateSet
    readonly priorClipVisionObservation:
      LivingFrameControlledSdxlClipVisionByteObservation
  },
  candidate: LivingFrameControlledSdxlArtifactCandidate,
): LivingFrameControlledSdxlBaseByteObservationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_CLASS,
    observationId: input.observationId,
    observationState:
      LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_STATE,
    sourceBindings: {
      candidateSetId: input.candidateSet.candidateSetId,
      candidateSetDigestSha256:
        input.candidateSet.candidateSetDigestSha256,
      priorClipVisionObservationId:
        input.priorClipVisionObservation.observationId,
      priorClipVisionObservationDigestSha256:
        input.priorClipVisionObservation.observationDigestSha256,
      requirementBindingDigestSha256:
        candidate.bindingDigestSha256,
      artifactCode:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_ARTIFACT_CODE,
      repositoryCode:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_CODE,
      repositoryRevisionSha1:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_REVISION,
    },
    byteVerification: {
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
      observedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
      observedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
      fullByteStreamConsumed: true,
      fullContentDigestIndependentlyVerified: true,
    },
    safetensorsStructure: {
      headerLength:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH,
      headerDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_SHA256,
      tensorNameSetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256,
      tensorCount: EXPECTED_TENSOR_COUNT,
      dtypeCounts: EXPECTED_DTYPE_COUNTS,
      rankCounts: EXPECTED_RANK_COUNTS,
      maximumRank: 4,
      dataSectionByteLength: EXPECTED_DATA_SECTION_BYTES,
      totalTensorByteLength: EXPECTED_DATA_SECTION_BYTES,
      finalDataOffset: EXPECTED_DATA_SECTION_BYTES,
      offsetsContiguousFromZero: true,
      everyTensorSpanMatchesShapeAndDtype: true,
      tensorPayloadExactlyAccountsForDataSection: true,
      metadataPresent: true,
      metadataKeyCount: 12,
      metadataKeySetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_KEY_SET_SHA256,
      metadataDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256,
    },
    embeddedModelSpecClues: {
      saiModelSpec: '1.0.0',
      architecture: 'stable-diffusion-xl-v1-base',
      title: 'Stable Diffusion XL 1.0 Base',
      resolution: '1024x1024',
      predictionType: 'epsilon',
      licenseLabel: 'CreativeML Open RAIL++-M License',
      metadataExpectationCount: 6,
      independentFullContentDigestIsArtifactIdentity: true,
    },
    compatibilityClues: {
      namespaceCountDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_NAMESPACE_SHA256,
      namespaceCounts: EXPECTED_NAMESPACE_COUNTS,
      selectedTensorShapeDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256,
      primaryTextEncoderWidth: 768,
      secondaryTextEncoderWidth: 1280,
      crossAttentionContextWidth: 2048,
      additionalConditioningInputWidth: 2816,
      latentChannelCount: 4,
      imageChannelCount: 3,
      embeddedMetadataNamesExactBaseFamily: true,
      priorLoraMetadataNamesSdxlBaseVersion09: true,
      priorLoraMetadataMatchesBaseVersion10: false,
      completeBundleLoadAndBehaviorBenchmarkRequired: true,
    },
    bundleProgress: {
      candidateArtifactCount: 5,
      independentlyVerifiedArtifactByteCount: 5,
      safetensorsSchemaInspectedArtifactCount: 5,
      remainingUnverifiedArtifactCodes: [],
      completeBundleBytesVerified: true,
      completeBundleSafetensorsSchemasInspected: true,
      exactBundleCompatibilityProven: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_BASE_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
    priorClipVisionObservationRevalidated: true,
    processBoundReaderConsumedExactlyOnce: true,
    artifactPathUrlFilenameOrRawBytesPersisted: false,
    canonicalRepositoryObjectPresent: false,
    modelLoadedOrExecuted: false,
    generationPerformed: false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
}

async function assertParents(
  input: VerifyLivingFrameControlledSdxlBaseByteObservationInput,
): Promise<void> {
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')
  if (
    !await verifyLivingFrameControlledSdxlClipVisionByteObservation(
      input.priorClipVisionObservation,
      {
        candidateSet: input.candidateSet,
        candidateSetInput: input.candidateSetInput,
        priorLoraObservation: input.priorLoraObservation,
        priorControlNetObservation:
          input.priorControlNetObservation,
        priorIpAdapterObservation:
          input.priorIpAdapterObservation,
      },
    )
  ) throw invalid(
    'clip_vision_observation_invalid',
    '$.priorClipVisionObservation',
  )
  if (
    input.priorClipVisionObservation.sourceBindings
      .candidateSetId !== input.candidateSet.candidateSetId
    || input.priorClipVisionObservation.sourceBindings
      .candidateSetDigestSha256
      !== input.candidateSet.candidateSetDigestSha256
    || input.priorClipVisionObservation.sourceBindings
      .priorIpAdapterObservationId
      !== input.priorIpAdapterObservation.observationId
    || input.priorClipVisionObservation.sourceBindings
      .priorIpAdapterObservationDigestSha256
      !== input.priorIpAdapterObservation.observationDigestSha256
  ) throw invalid(
    'clip_vision_lineage_mismatch',
    '$.priorClipVisionObservation.sourceBindings',
  )
}

function requireBaseCandidate(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
): LivingFrameControlledSdxlArtifactCandidate {
  const candidates = candidateSet.artifacts.filter(
    (candidate) =>
      candidate.artifactCode
        === LIVING_FRAME_CONTROLLED_SDXL_BASE_ARTIFACT_CODE,
  )
  const candidate = candidates[0]
  if (
    candidates.length !== 1
    || !candidate
    || candidate.order !== 1
    || candidate.role !== 'base_checkpoint'
    || candidate.bindingKind
      !== 'base_checkpoint_artifact_expectation'
    || candidate.repositoryCode
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_CODE
    || candidate.repositoryRevisionSha1
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_REVISION
    || candidate.reportedByteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH
    || candidate.reportedContentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256
    || candidate.artifactFormat !== 'safetensors'
    || candidate.expectedModelFamily
      !== 'stable_diffusion_xl_base_1_0'
    || candidate.declaredLicenseLabel !== 'openrail_plus_plus'
    || candidate.compatibilityObservationCode
      !== 'base_repository_declares_sdxl_base_1_0'
    || candidate.fullContentDigestIndependentlyVerified !== false
    || candidate.safetensorsSchemaInspected !== false
  ) throw invalid(
    'candidate_lineage_mismatch',
    '$.candidateSet.artifacts',
  )
  return candidate
}

function requireReader(
  value:
    LivingFrameControlledSdxlBaseByteReaderPort | null,
): LivingFrameControlledSdxlBaseByteReaderPort {
  if (
    !value
    || !byteReaderPorts.has(value)
    || consumedByteReaderPorts.has(value)
    || value.readerClass
      !== 'process_bound_server_owned_exact_sdxl_base_byte_reader'
    || value.callerBytesAccepted !== false
    || value.callerPathAccepted !== false
    || value.callerUrlAccepted !== false
    || value.runtimeDownloadAllowed !== false
    || value.artifactRepositoryAuthority !== false
    || value.modelExecutionAuthority !== false
    || value.productionReady !== false
    || typeof value.openServerOwnedByteStream !== 'function'
  ) throw invalid(
    consumedByteReaderPorts.has(value as object)
      ? 'reader_reused'
      : 'reader_invalid',
    '$.byteReader',
  )
  return value
}

function assertExactInspection(
  value: LivingFrameControlledSafetensorsByteInspection,
): void {
  if (
    value.byteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH
    || value.contentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256
    || value.headerLength
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH
    || value.headerDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_SHA256
    || value.tensorNameSetDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256
    || value.tensorCount !== EXPECTED_TENSOR_COUNT
    || canonicalJson(value.dtypeCounts)
      !== canonicalJson(EXPECTED_DTYPE_COUNTS)
    || canonicalJson(value.rankCounts)
      !== canonicalJson(EXPECTED_RANK_COUNTS)
    || value.maximumRank !== 4
    || value.dataSectionByteLength !== EXPECTED_DATA_SECTION_BYTES
    || value.totalTensorByteLength !== EXPECTED_DATA_SECTION_BYTES
    || value.finalDataOffset !== EXPECTED_DATA_SECTION_BYTES
    || !value.offsetsContiguousFromZero
    || !value.everyTensorSpanMatchesShapeAndDtype
    || !value.tensorPayloadExactlyAccountsForDataSection
    || value.metadataPresent !== true
    || value.metadataKeyCount !== 12
    || value.metadataKeySetDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_KEY_SET_SHA256
    || value.metadataDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256
    || value.metadataExpectationCount !== 6
    || !value.expectedMetadataValuesMatched
    || value.rawMetadataReturned !== false
    || value.rawHeaderOrTensorBytesReturned !== false
  ) throw invalid('tensor_structure_mismatch', '$.safetensors')
  if (
    canonicalJson(value.selectedTensorShapes)
      !== canonicalJson(
        EXPECTED_SELECTED_TENSOR_SHAPES.map(
          ([name, shape]) => ({ name, shape }),
        ),
      )
    || value.selectedTensorShapeDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256
  ) throw invalid('selected_shape_mismatch', '$.safetensors')
  if (
    canonicalJson(value.namespaceCounts)
      !== canonicalJson(EXPECTED_NAMESPACE_COUNTS)
    || value.namespaceCountDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_BASE_NAMESPACE_SHA256
  ) throw invalid('namespace_mismatch', '$.safetensors')
}

function assertInput(
  input: CreateLivingFrameControlledSdxlBaseByteObservationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'candidateSet',
      'candidateSetInput',
      'priorLoraObservation',
      'priorControlNetObservation',
      'priorIpAdapterObservation',
      'priorClipVisionObservation',
      'byteReader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code: LivingFrameControlledSdxlBaseByteObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlBaseByteObservationError {
  return new LivingFrameControlledSdxlBaseByteObservationError([
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
  throw invalid('input_invalid', '$')
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
