import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlControlNetByteObservation,
  LivingFrameControlledSdxlControlNetByteObservationAuthority,
  LivingFrameControlledSdxlControlNetByteObservationDraft,
  LivingFrameControlledSdxlControlNetByteObservationIssue,
  LivingFrameControlledSdxlControlNetByteObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_ARTIFACT_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_KEY_SET_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_NAMESPACE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_REVISION,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-controlnet-byte-observation'
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
  verifyLivingFrameControlledSdxlLoraByteObservation,
} from './living-frame-controlled-sdxl-lora-byte-observation'
import type {
  LivingFrameControlledSafetensorsByteInspection,
} from './living-frame-controlled-safetensors-byte-inspector'
import {
  inspectLivingFrameControlledSafetensorsByteStream,
} from './living-frame-controlled-safetensors-byte-inspector'

export interface LivingFrameControlledSdxlControlNetByteReaderPort {
  readonly readerClass:
    'process_bound_server_owned_exact_sdxl_controlnet_byte_reader'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly artifactRepositoryAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CreateLivingFrameControlledSdxlControlNetByteObservationInput {
  readonly observationId: string
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly byteReader:
    LivingFrameControlledSdxlControlNetByteReaderPort | null
}

export interface VerifyLivingFrameControlledSdxlControlNetByteObservationInput {
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXPECTED_TENSOR_COUNT = 140
const EXPECTED_DATA_SECTION_BYTES = 320_222_240

const EXPECTED_RANK_COUNTS = Object.freeze([
  { rank: 1, count: 87 },
  { rank: 2, count: 14 },
  { rank: 4, count: 39 },
] as const)

const EXPECTED_NAMESPACE_COUNTS = Object.freeze([
  { namespace: 'add_embedding', count: 4 },
  { namespace: 'controlnet_cond_embedding', count: 16 },
  { namespace: 'controlnet_down_blocks', count: 18 },
  { namespace: 'controlnet_mid_block', count: 2 },
  { namespace: 'conv_in', count: 2 },
  { namespace: 'down_blocks', count: 68 },
  { namespace: 'mid_block', count: 26 },
  { namespace: 'time_embedding', count: 4 },
] as const)

const EXPECTED_SELECTED_TENSOR_SHAPES = Object.freeze([
  ['add_embedding.linear_1.weight', [1280, 2816]],
  ['add_embedding.linear_2.weight', [1280, 1280]],
  ['controlnet_cond_embedding.conv_in.weight', [16, 3, 3, 3]],
  [
    'controlnet_cond_embedding.conv_out.weight',
    [320, 256, 3, 3],
  ],
  ['controlnet_down_blocks.0.weight', [320, 320, 1, 1]],
  ['controlnet_down_blocks.8.weight', [1280, 1280, 1, 1]],
  ['conv_in.weight', [320, 4, 3, 3]],
  ['time_embedding.linear_1.weight', [1280, 320]],
] as const)

const byteReaderPorts = new WeakSet<object>()
const consumedByteReaderPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlControlNetByteObservationAuthority =
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

export class LivingFrameControlledSdxlControlNetByteObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlControlNetByteObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlControlNetByteObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL ControlNet byte observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlControlNetByteObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlControlNetByteReader(
  input: {
    readonly openServerOwnedByteStream:
      LivingFrameControlledSdxlControlNetByteReaderPort[
        'openServerOwnedByteStream'
      ]
  },
): LivingFrameControlledSdxlControlNetByteReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('reader_invalid', '$.byteReader')
  }
  const reader =
    Object.freeze<LivingFrameControlledSdxlControlNetByteReaderPort>({
      readerClass:
        'process_bound_server_owned_exact_sdxl_controlnet_byte_reader',
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

export async function createLivingFrameControlledSdxlControlNetByteObservation(
  input:
    CreateLivingFrameControlledSdxlControlNetByteObservationInput,
): Promise<LivingFrameControlledSdxlControlNetByteObservation> {
  assertInput(input)
  await assertParents(input)
  const candidate = requireControlNetCandidate(input.candidateSet)
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
          LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
        expectedContentSha256:
          LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
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

export async function verifyLivingFrameControlledSdxlControlNetByteObservation(
  value: unknown,
  input:
    VerifyLivingFrameControlledSdxlControlNetByteObservationInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.observationId !== 'string'
      || !SAFE_ID.test(value.observationId)
    ) return false
    await assertParents(input)
    const candidate = requireControlNetCandidate(
      input.candidateSet,
    )
    const draft = compileDraft({
      observationId: value.observationId,
      candidateSet: input.candidateSet,
      priorLoraObservation: input.priorLoraObservation,
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
    readonly priorLoraObservation:
      LivingFrameControlledSdxlLoraByteObservation
  },
  candidate: LivingFrameControlledSdxlArtifactCandidate,
): LivingFrameControlledSdxlControlNetByteObservationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_CLASS,
    observationId: input.observationId,
    observationState:
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_STATE,
    sourceBindings: {
      candidateSetId: input.candidateSet.candidateSetId,
      candidateSetDigestSha256:
        input.candidateSet.candidateSetDigestSha256,
      priorLoraObservationId:
        input.priorLoraObservation.observationId,
      priorLoraObservationDigestSha256:
        input.priorLoraObservation.observationDigestSha256,
      requirementBindingDigestSha256:
        candidate.bindingDigestSha256,
      artifactCode:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_ARTIFACT_CODE,
      repositoryCode:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_CODE,
      repositoryRevisionSha1:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_REVISION,
    },
    byteVerification: {
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
      observedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
      observedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
      fullByteStreamConsumed: true,
      fullContentDigestIndependentlyVerified: true,
    },
    safetensorsStructure: {
      headerLength:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_LENGTH,
      headerDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_SHA256,
      tensorNameSetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_TENSOR_NAME_SET_SHA256,
      tensorCount: EXPECTED_TENSOR_COUNT,
      dtypeCounts: [{ dtype: 'F16', count: 140 }],
      rankCounts: EXPECTED_RANK_COUNTS,
      maximumRank: 4,
      dataSectionByteLength: EXPECTED_DATA_SECTION_BYTES,
      totalTensorByteLength: EXPECTED_DATA_SECTION_BYTES,
      finalDataOffset: EXPECTED_DATA_SECTION_BYTES,
      offsetsContiguousFromZero: true,
      everyTensorSpanMatchesShapeAndDtype: true,
      tensorPayloadExactlyAccountsForDataSection: true,
      metadataKeyCount: 1,
      metadataKeySetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_KEY_SET_SHA256,
      metadataDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_SHA256,
      declaredSerializationFormat: 'pt',
    },
    compatibilityClues: {
      namespaceCountDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_NAMESPACE_SHA256,
      namespaceCounts: EXPECTED_NAMESPACE_COUNTS,
      selectedTensorShapeDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_SELECTED_SHAPE_SHA256,
      sdxlTextTimeConditioningShapeCluesPresent: true,
      controlNetConditioningPathShapeCluesPresent: true,
      embeddedMetadataNamesExactModelFamily: false,
      embeddedMetadataNamesCannyConditioning: false,
      exactPinnedConfigAndModelCardReReadRequired: true,
      exactComfyUiLoadAndCannyBehaviorBenchmarkRequired: true,
    },
    bundleProgress: {
      candidateArtifactCount: 5,
      independentlyVerifiedArtifactByteCount: 2,
      safetensorsSchemaInspectedArtifactCount: 2,
      remainingUnverifiedArtifactCodes: [
        'sdxl_base_1_0_monolithic_safetensors',
        'generic_ipadapter_sdxl_big_g_safetensors',
        'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
      ],
      completeBundleBytesVerified: false,
      exactBundleCompatibilityProven: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
    priorLoraObservationRevalidated: true,
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
  input: {
    readonly candidateSet:
      LivingFrameControlledSdxlArtifactCandidateSet
    readonly candidateSetInput:
      CreateLivingFrameControlledSdxlArtifactCandidateSetInput
    readonly priorLoraObservation:
      LivingFrameControlledSdxlLoraByteObservation
  },
): Promise<void> {
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')
  if (
    !await verifyLivingFrameControlledSdxlLoraByteObservation(
      input.priorLoraObservation,
      {
        candidateSet: input.candidateSet,
        candidateSetInput: input.candidateSetInput,
      },
    )
  ) throw invalid(
    'lora_observation_invalid',
    '$.priorLoraObservation',
  )
  if (
    input.priorLoraObservation.sourceBindings
      .candidateSetId !== input.candidateSet.candidateSetId
    || input.priorLoraObservation.sourceBindings
      .candidateSetDigestSha256
      !== input.candidateSet.candidateSetDigestSha256
  ) throw invalid(
    'lora_lineage_mismatch',
    '$.priorLoraObservation.sourceBindings',
  )
}

function requireControlNetCandidate(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
): LivingFrameControlledSdxlArtifactCandidate {
  const candidates = candidateSet.artifacts.filter(
    (candidate) =>
      candidate.artifactCode
        === LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_ARTIFACT_CODE,
  )
  const candidate = candidates[0]
  if (
    candidates.length !== 1
    || !candidate
    || candidate.order !== 2
    || candidate.role !== 'controlnet_checkpoint'
    || candidate.bindingKind
      !== 'controlnet_checkpoint_artifact_expectation'
    || candidate.repositoryCode
      !== LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_CODE
    || candidate.repositoryRevisionSha1
      !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_REPOSITORY_REVISION
    || candidate.reportedByteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH
    || candidate.reportedContentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256
    || candidate.artifactFormat !== 'safetensors'
    || candidate.expectedModelFamily
      !== 'stable_diffusion_xl_base_1_0'
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
    LivingFrameControlledSdxlControlNetByteReaderPort | null,
): LivingFrameControlledSdxlControlNetByteReaderPort {
  if (
    !value
    || !byteReaderPorts.has(value)
    || consumedByteReaderPorts.has(value)
    || value.readerClass
      !==
      'process_bound_server_owned_exact_sdxl_controlnet_byte_reader'
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
    value.byteLength !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH
    || value.contentSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256
    || value.headerLength !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_LENGTH
    || value.headerDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_SHA256
    || value.tensorNameSetDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_TENSOR_NAME_SET_SHA256
    || value.tensorCount !== EXPECTED_TENSOR_COUNT
    || canonicalJson(value.dtypeCounts)
      !== canonicalJson([{ dtype: 'F16', count: 140 }])
    || canonicalJson(value.rankCounts)
      !== canonicalJson(EXPECTED_RANK_COUNTS)
    || value.maximumRank !== 4
    || value.dataSectionByteLength
      !== EXPECTED_DATA_SECTION_BYTES
    || value.totalTensorByteLength
      !== EXPECTED_DATA_SECTION_BYTES
    || value.finalDataOffset !== EXPECTED_DATA_SECTION_BYTES
    || !value.offsetsContiguousFromZero
    || !value.everyTensorSpanMatchesShapeAndDtype
    || !value.tensorPayloadExactlyAccountsForDataSection
    || value.metadataKeyCount !== 1
    || value.metadataKeySetDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_KEY_SET_SHA256
    || value.metadataDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_SHA256
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
    || value.selectedTensorShapeDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_SELECTED_SHAPE_SHA256
  ) throw invalid('selected_shape_mismatch', '$.safetensors')
  if (
    canonicalJson(value.namespaceCounts)
      !== canonicalJson(EXPECTED_NAMESPACE_COUNTS)
    || value.namespaceCountDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_NAMESPACE_SHA256
  ) throw invalid('namespace_mismatch', '$.safetensors')
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlControlNetByteObservationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'candidateSet',
      'candidateSetInput',
      'priorLoraObservation',
      'byteReader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code:
    LivingFrameControlledSdxlControlNetByteObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlControlNetByteObservationError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_OBSERVATION_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error(
    'Unknown Living Frame SDXL ControlNet observation issue.',
  )
  return new LivingFrameControlledSdxlControlNetByteObservationError([
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
