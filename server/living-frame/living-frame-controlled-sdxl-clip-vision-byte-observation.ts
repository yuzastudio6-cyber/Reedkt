import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlClipVisionByteObservation,
  LivingFrameControlledSdxlClipVisionByteObservationAuthority,
  LivingFrameControlledSdxlClipVisionByteObservationDraft,
  LivingFrameControlledSdxlClipVisionByteObservationIssue,
  LivingFrameControlledSdxlClipVisionByteObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-clip-vision-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_ARTIFACT_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_KEY_SET_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_NAMESPACE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_REVISION,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_TENSOR_NAME_SET_SHA256,
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
  verifyLivingFrameControlledSdxlIpAdapterByteObservation,
} from './living-frame-controlled-sdxl-ipadapter-byte-observation'
import type {
  LivingFrameControlledSafetensorsByteInspection,
} from './living-frame-controlled-safetensors-byte-inspector'
import {
  inspectLivingFrameControlledSafetensorsByteStream,
} from './living-frame-controlled-safetensors-byte-inspector'

export interface LivingFrameControlledSdxlClipVisionByteReaderPort {
  readonly readerClass:
    'process_bound_server_owned_exact_sdxl_clip_vision_byte_reader'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly artifactRepositoryAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CreateLivingFrameControlledSdxlClipVisionByteObservationInput {
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
  readonly byteReader:
    LivingFrameControlledSdxlClipVisionByteReaderPort | null
}

export interface VerifyLivingFrameControlledSdxlClipVisionByteObservationInput {
  readonly candidateSet: LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly priorControlNetObservation:
    LivingFrameControlledSdxlControlNetByteObservation
  readonly priorIpAdapterObservation:
    LivingFrameControlledSdxlIpAdapterByteObservation
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXPECTED_TENSOR_COUNT = 777
const EXPECTED_DATA_SECTION_BYTES = 3_689_816_584
const EXPECTED_DTYPE_COUNTS = Object.freeze([
  { dtype: 'F16', count: 776 },
  { dtype: 'I64', count: 1 },
] as const)
const EXPECTED_RANK_COUNTS = Object.freeze([
  { rank: 1, count: 485 },
  { rank: 2, count: 291 },
  { rank: 4, count: 1 },
] as const)
const EXPECTED_NAMESPACE_COUNTS = Object.freeze([
  { namespace: 'vision_model', count: 776 },
  { namespace: 'visual_projection', count: 1 },
] as const)
const EXPECTED_SELECTED_TENSOR_SHAPES = Object.freeze([
  ['vision_model.embeddings.class_embedding', [1664]],
  [
    'vision_model.embeddings.patch_embedding.weight',
    [1664, 3, 14, 14],
  ],
  [
    'vision_model.embeddings.position_embedding.weight',
    [257, 1664],
  ],
  ['vision_model.embeddings.position_ids', [1, 257]],
  [
    'vision_model.encoder.layers.0.self_attn.k_proj.weight',
    [1664, 1664],
  ],
  [
    'vision_model.encoder.layers.0.self_attn.q_proj.weight',
    [1664, 1664],
  ],
  [
    'vision_model.encoder.layers.0.self_attn.v_proj.weight',
    [1664, 1664],
  ],
  [
    'vision_model.encoder.layers.47.self_attn.k_proj.weight',
    [1664, 1664],
  ],
  [
    'vision_model.encoder.layers.47.self_attn.q_proj.weight',
    [1664, 1664],
  ],
  [
    'vision_model.encoder.layers.47.self_attn.v_proj.weight',
    [1664, 1664],
  ],
  ['vision_model.post_layernorm.bias', [1664]],
  ['vision_model.post_layernorm.weight', [1664]],
  ['vision_model.pre_layrnorm.bias', [1664]],
  ['vision_model.pre_layrnorm.weight', [1664]],
  ['visual_projection.weight', [1280, 1664]],
] as const)

const byteReaderPorts = new WeakSet<object>()
const consumedByteReaderPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlClipVisionByteObservationAuthority =
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

export class LivingFrameControlledSdxlClipVisionByteObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlClipVisionByteObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlClipVisionByteObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL CLIP Vision byte observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlClipVisionByteObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlClipVisionByteReader(
  input: {
    readonly openServerOwnedByteStream:
      LivingFrameControlledSdxlClipVisionByteReaderPort[
        'openServerOwnedByteStream'
      ]
  },
): LivingFrameControlledSdxlClipVisionByteReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('reader_invalid', '$.byteReader')
  }
  const reader =
    Object.freeze<LivingFrameControlledSdxlClipVisionByteReaderPort>({
      readerClass:
        'process_bound_server_owned_exact_sdxl_clip_vision_byte_reader',
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

export async function createLivingFrameControlledSdxlClipVisionByteObservation(
  input:
    CreateLivingFrameControlledSdxlClipVisionByteObservationInput,
): Promise<LivingFrameControlledSdxlClipVisionByteObservation> {
  assertInput(input)
  await assertParents(input)
  const candidate = requireClipVisionCandidate(input.candidateSet)
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
          LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
        expectedContentSha256:
          LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
        maximumHeaderByteLength: 1024 * 1024,
        expectedMetadataValues: { format: 'pt' },
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

export async function verifyLivingFrameControlledSdxlClipVisionByteObservation(
  value: unknown,
  input:
    VerifyLivingFrameControlledSdxlClipVisionByteObservationInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.observationId !== 'string'
      || !SAFE_ID.test(value.observationId)
    ) return false
    await assertParents(input)
    const candidate = requireClipVisionCandidate(input.candidateSet)
    const draft = compileDraft({
      observationId: value.observationId,
      candidateSet: input.candidateSet,
      priorIpAdapterObservation:
        input.priorIpAdapterObservation,
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
    readonly priorIpAdapterObservation:
      LivingFrameControlledSdxlIpAdapterByteObservation
  },
  candidate: LivingFrameControlledSdxlArtifactCandidate,
): LivingFrameControlledSdxlClipVisionByteObservationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_CLASS,
    observationId: input.observationId,
    observationState:
      LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_OBSERVATION_STATE,
    sourceBindings: {
      candidateSetId: input.candidateSet.candidateSetId,
      candidateSetDigestSha256:
        input.candidateSet.candidateSetDigestSha256,
      priorIpAdapterObservationId:
        input.priorIpAdapterObservation.observationId,
      priorIpAdapterObservationDigestSha256:
        input.priorIpAdapterObservation.observationDigestSha256,
      requirementBindingDigestSha256:
        candidate.bindingDigestSha256,
      artifactCode:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_ARTIFACT_CODE,
      repositoryCode:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_CODE,
      repositoryRevisionSha1:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_REVISION,
    },
    byteVerification: {
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
      observedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
      observedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
      fullByteStreamConsumed: true,
      fullContentDigestIndependentlyVerified: true,
    },
    safetensorsStructure: {
      headerLength:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_LENGTH,
      headerDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_SHA256,
      tensorNameSetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_TENSOR_NAME_SET_SHA256,
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
      metadataKeyCount: 1,
      metadataKeySetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_KEY_SET_SHA256,
      metadataDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_SHA256,
      embeddedFormatLabel: 'pt',
    },
    compatibilityClues: {
      namespaceCountDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_NAMESPACE_SHA256,
      namespaceCounts: EXPECTED_NAMESPACE_COUNTS,
      selectedTensorShapeDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_SELECTED_SHAPE_SHA256,
      visionEmbeddingWidth: 1664,
      patchSize: 14,
      positionalTokenCount: 257,
      lastSampledEncoderLayerIndex: 47,
      visualProjectionInputWidth: 1664,
      visualProjectionOutputWidth: 1280,
      genericIpAdapterImageProjectionInputWidth: 1280,
      projectionWidthMatchesGenericIpAdapterInputWidth: true,
      genericVisionAndProjectionNamespacesObserved: true,
      embeddedMetadataNamesExactClipVariant: false,
      exactPinnedModelCardBindingStillRequired: true,
      exactComfyUiLoadAndReferenceBehaviorBenchmarkRequired: true,
    },
    bundleProgress: {
      candidateArtifactCount: 5,
      independentlyVerifiedArtifactByteCount: 4,
      safetensorsSchemaInspectedArtifactCount: 4,
      remainingUnverifiedArtifactCodes: [
        'sdxl_base_1_0_monolithic_safetensors',
      ],
      completeBundleBytesVerified: false,
      exactBundleCompatibilityProven: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
    priorIpAdapterObservationRevalidated: true,
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
  input:
    VerifyLivingFrameControlledSdxlClipVisionByteObservationInput,
): Promise<void> {
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')
  if (
    !await verifyLivingFrameControlledSdxlIpAdapterByteObservation(
      input.priorIpAdapterObservation,
      {
        candidateSet: input.candidateSet,
        candidateSetInput: input.candidateSetInput,
        priorLoraObservation: input.priorLoraObservation,
        priorControlNetObservation:
          input.priorControlNetObservation,
      },
    )
  ) throw invalid(
    'ipadapter_observation_invalid',
    '$.priorIpAdapterObservation',
  )
  if (
    input.priorIpAdapterObservation.sourceBindings
      .candidateSetId !== input.candidateSet.candidateSetId
    || input.priorIpAdapterObservation.sourceBindings
      .candidateSetDigestSha256
      !== input.candidateSet.candidateSetDigestSha256
    || input.priorIpAdapterObservation.sourceBindings
      .priorControlNetObservationId
      !== input.priorControlNetObservation.observationId
    || input.priorIpAdapterObservation.sourceBindings
      .priorControlNetObservationDigestSha256
      !== input.priorControlNetObservation.observationDigestSha256
  ) throw invalid(
    'ipadapter_lineage_mismatch',
    '$.priorIpAdapterObservation.sourceBindings',
  )
}

function requireClipVisionCandidate(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
): LivingFrameControlledSdxlArtifactCandidate {
  const candidates = candidateSet.artifacts.filter(
    (candidate) =>
      candidate.artifactCode
        === LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_ARTIFACT_CODE,
  )
  const candidate = candidates[0]
  if (
    candidates.length !== 1
    || !candidate
    || candidate.order !== 5
    || candidate.role !== 'clip_vision_checkpoint'
    || candidate.bindingKind
      !== 'clip_vision_checkpoint_artifact'
    || candidate.repositoryCode
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_CODE
    || candidate.repositoryRevisionSha1
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_REPOSITORY_REVISION
    || candidate.reportedByteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH
    || candidate.reportedContentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256
    || candidate.artifactFormat !== 'safetensors'
    || candidate.expectedModelFamily !== 'clip_vision_vit_big_g_14'
    || candidate.declaredLicenseLabel !== 'apache_2_0'
    || candidate.compatibilityObservationCode
      !== 'ipadapter_model_card_maps_sdxl_image_encoder_to_big_g'
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
    LivingFrameControlledSdxlClipVisionByteReaderPort | null,
): LivingFrameControlledSdxlClipVisionByteReaderPort {
  if (
    !value
    || !byteReaderPorts.has(value)
    || consumedByteReaderPorts.has(value)
    || value.readerClass
      !==
      'process_bound_server_owned_exact_sdxl_clip_vision_byte_reader'
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
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH
    || value.contentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256
    || value.headerLength
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_LENGTH
    || value.headerDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_SHA256
    || value.tensorNameSetDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_TENSOR_NAME_SET_SHA256
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
    || value.metadataKeyCount !== 1
    || value.metadataKeySetDigestSha256
      !==
      LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_KEY_SET_SHA256
    || value.metadataDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_SHA256
    || value.metadataExpectationCount !== 1
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
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_SELECTED_SHAPE_SHA256
  ) throw invalid('selected_shape_mismatch', '$.safetensors')
  if (
    canonicalJson(value.namespaceCounts)
      !== canonicalJson(EXPECTED_NAMESPACE_COUNTS)
    || value.namespaceCountDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_NAMESPACE_SHA256
  ) throw invalid('namespace_mismatch', '$.safetensors')
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlClipVisionByteObservationInput,
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
      'byteReader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code:
    LivingFrameControlledSdxlClipVisionByteObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlClipVisionByteObservationError {
  return new LivingFrameControlledSdxlClipVisionByteObservationError([
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
