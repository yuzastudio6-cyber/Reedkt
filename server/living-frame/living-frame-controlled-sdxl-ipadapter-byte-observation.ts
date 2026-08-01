import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlIpAdapterByteObservation,
  LivingFrameControlledSdxlIpAdapterByteObservationAuthority,
  LivingFrameControlledSdxlIpAdapterByteObservationDraft,
  LivingFrameControlledSdxlIpAdapterByteObservationIssue,
  LivingFrameControlledSdxlIpAdapterByteObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-ipadapter-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_ARTIFACT_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_KEY_SET_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_NAMESPACE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_REVISION,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-ipadapter-byte-observation'
import type {
  LivingFrameControlledSdxlControlNetByteObservation,
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
  verifyLivingFrameControlledSdxlControlNetByteObservation,
} from './living-frame-controlled-sdxl-controlnet-byte-observation'
import type {
  LivingFrameControlledSafetensorsByteInspection,
} from './living-frame-controlled-safetensors-byte-inspector'
import {
  inspectLivingFrameControlledSafetensorsByteStream,
} from './living-frame-controlled-safetensors-byte-inspector'

export interface LivingFrameControlledSdxlIpAdapterByteReaderPort {
  readonly readerClass:
    'process_bound_server_owned_exact_generic_sdxl_ipadapter_byte_reader'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly artifactRepositoryAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CreateLivingFrameControlledSdxlIpAdapterByteObservationInput {
  readonly observationId: string
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly priorControlNetObservation:
    LivingFrameControlledSdxlControlNetByteObservation
  readonly byteReader:
    LivingFrameControlledSdxlIpAdapterByteReaderPort | null
}

export interface VerifyLivingFrameControlledSdxlIpAdapterByteObservationInput {
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly priorLoraObservation:
    LivingFrameControlledSdxlLoraByteObservation
  readonly priorControlNetObservation:
    LivingFrameControlledSdxlControlNetByteObservation
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXPECTED_TENSOR_COUNT = 144
const EXPECTED_DATA_SECTION_BYTES = 702_570_496
const EXPECTED_RANK_COUNTS = Object.freeze([
  { rank: 1, count: 3 },
  { rank: 2, count: 141 },
] as const)
const EXPECTED_NAMESPACE_COUNTS = Object.freeze([
  { namespace: 'image_proj', count: 4 },
  { namespace: 'ip_adapter', count: 140 },
] as const)
const EXPECTED_SELECTED_TENSOR_SHAPES = Object.freeze([
  ['image_proj.norm.bias', [2048]],
  ['image_proj.norm.weight', [2048]],
  ['image_proj.proj.bias', [8192]],
  ['image_proj.proj.weight', [8192, 1280]],
  ['ip_adapter.1.to_k_ip.weight', [640, 2048]],
  ['ip_adapter.1.to_v_ip.weight', [640, 2048]],
  ['ip_adapter.101.to_k_ip.weight', [1280, 2048]],
  ['ip_adapter.101.to_v_ip.weight', [1280, 2048]],
] as const)

const byteReaderPorts = new WeakSet<object>()
const consumedByteReaderPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlIpAdapterByteObservationAuthority =
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

export class LivingFrameControlledSdxlIpAdapterByteObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlIpAdapterByteObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlIpAdapterByteObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL IP-Adapter byte observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlIpAdapterByteObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlIpAdapterByteReader(
  input: {
    readonly openServerOwnedByteStream:
      LivingFrameControlledSdxlIpAdapterByteReaderPort[
        'openServerOwnedByteStream'
      ]
  },
): LivingFrameControlledSdxlIpAdapterByteReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('reader_invalid', '$.byteReader')
  }
  const reader =
    Object.freeze<LivingFrameControlledSdxlIpAdapterByteReaderPort>({
      readerClass:
        'process_bound_server_owned_exact_generic_sdxl_ipadapter_byte_reader',
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

export async function createLivingFrameControlledSdxlIpAdapterByteObservation(
  input:
    CreateLivingFrameControlledSdxlIpAdapterByteObservationInput,
): Promise<LivingFrameControlledSdxlIpAdapterByteObservation> {
  assertInput(input)
  await assertParents(input)
  const candidate = requireIpAdapterCandidate(input.candidateSet)
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
          LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
        expectedContentSha256:
          LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
        maximumHeaderByteLength: 1024 * 1024,
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

export async function verifyLivingFrameControlledSdxlIpAdapterByteObservation(
  value: unknown,
  input:
    VerifyLivingFrameControlledSdxlIpAdapterByteObservationInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.observationId !== 'string'
      || !SAFE_ID.test(value.observationId)
    ) return false
    await assertParents(input)
    const candidate = requireIpAdapterCandidate(input.candidateSet)
    const draft = compileDraft({
      observationId: value.observationId,
      candidateSet: input.candidateSet,
      priorControlNetObservation:
        input.priorControlNetObservation,
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
    readonly priorControlNetObservation:
      LivingFrameControlledSdxlControlNetByteObservation
  },
  candidate: LivingFrameControlledSdxlArtifactCandidate,
): LivingFrameControlledSdxlIpAdapterByteObservationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_CLASS,
    observationId: input.observationId,
    observationState:
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_STATE,
    sourceBindings: {
      candidateSetId: input.candidateSet.candidateSetId,
      candidateSetDigestSha256:
        input.candidateSet.candidateSetDigestSha256,
      priorControlNetObservationId:
        input.priorControlNetObservation.observationId,
      priorControlNetObservationDigestSha256:
        input.priorControlNetObservation.observationDigestSha256,
      requirementBindingDigestSha256:
        candidate.bindingDigestSha256,
      artifactCode:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_ARTIFACT_CODE,
      repositoryCode:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_CODE,
      repositoryRevisionSha1:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_REVISION,
    },
    byteVerification: {
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
      observedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
      observedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
      fullByteStreamConsumed: true,
      fullContentDigestIndependentlyVerified: true,
    },
    safetensorsStructure: {
      headerLength:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH,
      headerDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_SHA256,
      tensorNameSetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256,
      tensorCount: EXPECTED_TENSOR_COUNT,
      dtypeCounts: [{ dtype: 'F16', count: 144 }],
      rankCounts: EXPECTED_RANK_COUNTS,
      maximumRank: 2,
      dataSectionByteLength: EXPECTED_DATA_SECTION_BYTES,
      totalTensorByteLength: EXPECTED_DATA_SECTION_BYTES,
      finalDataOffset: EXPECTED_DATA_SECTION_BYTES,
      offsetsContiguousFromZero: true,
      everyTensorSpanMatchesShapeAndDtype: true,
      tensorPayloadExactlyAccountsForDataSection: true,
      metadataPresent: false,
      metadataKeyCount: 0,
      metadataKeySetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_KEY_SET_SHA256,
      metadataDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256,
    },
    compatibilityClues: {
      namespaceCountDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_NAMESPACE_SHA256,
      namespaceCounts: EXPECTED_NAMESPACE_COUNTS,
      selectedTensorShapeDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_SELECTED_SHAPE_SHA256,
      imageProjectionInputWidth: 1280,
      imageProjectionOutputWidth: 8192,
      adapterContextWidth: 2048,
      adapterAttentionIndexCount: 70,
      pairedKeyAndValueProjectionCount: 70,
      genericIpAdapterNamespaceStructureObserved: true,
      faceIdOrInsightFaceNamespaceObserved: false,
      embeddedMetadataNamesExactModelFamily: false,
      exactPinnedModelCardAndClipEncoderBindingRequired: true,
      exactComfyUiLoadAndGenericReferenceBehaviorBenchmarkRequired:
        true,
    },
    bundleProgress: {
      candidateArtifactCount: 5,
      independentlyVerifiedArtifactByteCount: 3,
      safetensorsSchemaInspectedArtifactCount: 3,
      remainingUnverifiedArtifactCodes: [
        'sdxl_base_1_0_monolithic_safetensors',
        'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
      ],
      completeBundleBytesVerified: false,
      exactBundleCompatibilityProven: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
    priorControlNetObservationRevalidated: true,
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
  input: VerifyLivingFrameControlledSdxlIpAdapterByteObservationInput,
): Promise<void> {
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')
  if (
    !await verifyLivingFrameControlledSdxlControlNetByteObservation(
      input.priorControlNetObservation,
      {
        candidateSet: input.candidateSet,
        candidateSetInput: input.candidateSetInput,
        priorLoraObservation: input.priorLoraObservation,
      },
    )
  ) throw invalid(
    'controlnet_observation_invalid',
    '$.priorControlNetObservation',
  )
  if (
    input.priorControlNetObservation.sourceBindings
      .candidateSetId !== input.candidateSet.candidateSetId
    || input.priorControlNetObservation.sourceBindings
      .candidateSetDigestSha256
      !== input.candidateSet.candidateSetDigestSha256
    || input.priorControlNetObservation.sourceBindings
      .priorLoraObservationId
      !== input.priorLoraObservation.observationId
    || input.priorControlNetObservation.sourceBindings
      .priorLoraObservationDigestSha256
      !== input.priorLoraObservation.observationDigestSha256
  ) throw invalid(
    'controlnet_lineage_mismatch',
    '$.priorControlNetObservation.sourceBindings',
  )
}

function requireIpAdapterCandidate(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
): LivingFrameControlledSdxlArtifactCandidate {
  const candidates = candidateSet.artifacts.filter(
    (candidate) =>
      candidate.artifactCode
        === LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_ARTIFACT_CODE,
  )
  const candidate = candidates[0]
  if (
    candidates.length !== 1
    || !candidate
    || candidate.order !== 4
    || candidate.role !== 'generic_ipadapter_checkpoint'
    || candidate.bindingKind
      !== 'generic_ipadapter_checkpoint_artifact'
    || candidate.repositoryCode
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_CODE
    || candidate.repositoryRevisionSha1
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_REVISION
    || candidate.reportedByteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH
    || candidate.reportedContentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256
    || candidate.artifactFormat !== 'safetensors'
    || candidate.expectedModelFamily
      !== 'stable_diffusion_xl_base_1_0'
    || candidate.declaredLicenseLabel !== 'apache_2_0'
    || candidate.compatibilityObservationCode
      !== 'ipadapter_model_card_maps_sdxl_default_to_big_g'
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
    LivingFrameControlledSdxlIpAdapterByteReaderPort | null,
): LivingFrameControlledSdxlIpAdapterByteReaderPort {
  if (
    !value
    || !byteReaderPorts.has(value)
    || consumedByteReaderPorts.has(value)
    || value.readerClass
      !==
      'process_bound_server_owned_exact_generic_sdxl_ipadapter_byte_reader'
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
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH
    || value.contentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256
    || value.headerLength
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH
    || value.headerDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_SHA256
    || value.tensorNameSetDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256
    || value.tensorCount !== EXPECTED_TENSOR_COUNT
    || canonicalJson(value.dtypeCounts)
      !== canonicalJson([{ dtype: 'F16', count: 144 }])
    || canonicalJson(value.rankCounts)
      !== canonicalJson(EXPECTED_RANK_COUNTS)
    || value.maximumRank !== 2
    || value.dataSectionByteLength !== EXPECTED_DATA_SECTION_BYTES
    || value.totalTensorByteLength !== EXPECTED_DATA_SECTION_BYTES
    || value.finalDataOffset !== EXPECTED_DATA_SECTION_BYTES
    || !value.offsetsContiguousFromZero
    || !value.everyTensorSpanMatchesShapeAndDtype
    || !value.tensorPayloadExactlyAccountsForDataSection
    || value.metadataPresent !== false
    || value.metadataKeyCount !== 0
    || value.metadataKeySetDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_KEY_SET_SHA256
    || value.metadataDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256
    || value.metadataExpectationCount !== 0
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
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_SELECTED_SHAPE_SHA256
  ) throw invalid('selected_shape_mismatch', '$.safetensors')
  if (
    canonicalJson(value.namespaceCounts)
      !== canonicalJson(EXPECTED_NAMESPACE_COUNTS)
    || value.namespaceCountDigestSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_NAMESPACE_SHA256
  ) throw invalid('namespace_mismatch', '$.safetensors')
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlIpAdapterByteObservationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'candidateSet',
      'candidateSetInput',
      'priorLoraObservation',
      'priorControlNetObservation',
      'byteReader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code: LivingFrameControlledSdxlIpAdapterByteObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlIpAdapterByteObservationError {
  return new LivingFrameControlledSdxlIpAdapterByteObservationError([
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
