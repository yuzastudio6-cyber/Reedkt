import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlLoraByteObservation,
  LivingFrameControlledSdxlLoraByteObservationAuthority,
  LivingFrameControlledSdxlLoraByteObservationDraft,
  LivingFrameControlledSdxlLoraByteObservationIssue,
  LivingFrameControlledSdxlLoraByteObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-lora-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_LORA_ARTIFACT_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_KEY_SET_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_CODE,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_REVISION,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256,
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
import type {
  LivingFrameControlledSafetensorsByteInspection,
} from './living-frame-controlled-safetensors-byte-inspector'
import {
  inspectLivingFrameControlledSafetensorsByteStream,
} from './living-frame-controlled-safetensors-byte-inspector'

export interface LivingFrameControlledSdxlLoraByteReaderPort {
  readonly readerClass:
    'process_bound_server_owned_exact_sdxl_lora_byte_reader'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly artifactRepositoryAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CreateLivingFrameControlledSdxlLoraByteObservationInput {
  readonly observationId: string
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
  readonly byteReader:
    LivingFrameControlledSdxlLoraByteReaderPort | null
}

export interface VerifyLivingFrameControlledSdxlLoraByteObservationInput {
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXPECTED_TENSOR_COUNT = 2_364
const EXPECTED_DATA_SECTION_BYTES = 49_189_416
const EXPECTED_METADATA_KEY_COUNT = 67
const EXPECTED_MAXIMUM_RANK = 4

const byteReaderPorts = new WeakSet<object>()
const consumedByteReaderPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlLoraByteObservationAuthority =
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

export class LivingFrameControlledSdxlLoraByteObservationError extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlLoraByteObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlLoraByteObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL LoRA byte observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlLoraByteObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlLoraByteReader(
  input: {
    readonly openServerOwnedByteStream:
      LivingFrameControlledSdxlLoraByteReaderPort[
        'openServerOwnedByteStream'
      ]
  },
): LivingFrameControlledSdxlLoraByteReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('reader_invalid', '$.byteReader')
  }
  const reader =
    Object.freeze<LivingFrameControlledSdxlLoraByteReaderPort>({
      readerClass:
        'process_bound_server_owned_exact_sdxl_lora_byte_reader',
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

export async function createLivingFrameControlledSdxlLoraByteObservation(
  input: CreateLivingFrameControlledSdxlLoraByteObservationInput,
): Promise<LivingFrameControlledSdxlLoraByteObservation> {
  assertInput(input)
  await assertCandidateSet(
    input.candidateSet,
    input.candidateSetInput,
  )
  const candidate = requireLoraCandidate(input.candidateSet)
  const reader = requireReader(input.byteReader)
  consumedByteReaderPorts.add(reader)
  let stream: Readable
  try {
    stream = await reader.openServerOwnedByteStream()
  } catch {
    throw invalid('reader_failed', '$.byteReader')
  }
  const measurement = await measureStream(stream)
  assertExactMeasurement(measurement)
  const draft = compileDraft(
    input.observationId,
    input.candidateSet,
    candidate,
  )
  return deepFreeze({
    ...draft,
    observationDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlLoraByteObservation(
  value: unknown,
  input:
    VerifyLivingFrameControlledSdxlLoraByteObservationInput,
): Promise<boolean> {
  try {
    if (!isRecord(value) || !SAFE_ID.test(
      typeof value.observationId === 'string'
        ? value.observationId
        : '',
    )) return false
    await assertCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
    const candidate = requireLoraCandidate(input.candidateSet)
    const draft = compileDraft(
      value.observationId as string,
      input.candidateSet,
      candidate,
    )
    const expected = {
      ...draft,
      observationDigestSha256: digest(draft),
    }
    return canonicalJson(value) === canonicalJson(expected)
  } catch {
    return false
  }
}

function compileDraft(
  observationId: string,
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
  candidate: LivingFrameControlledSdxlArtifactCandidate,
): LivingFrameControlledSdxlLoraByteObservationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_CLASS,
    observationId,
    observationState:
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_STATE,
    sourceBindings: {
      candidateSetId: candidateSet.candidateSetId,
      candidateSetDigestSha256:
        candidateSet.candidateSetDigestSha256,
      requirementBindingDigestSha256:
        candidate.bindingDigestSha256,
      artifactCode:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_ARTIFACT_CODE,
      repositoryCode:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_CODE,
      repositoryRevisionSha1:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_REVISION,
    },
    byteVerification: {
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
      observedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
      observedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
      fullByteStreamConsumed: true,
      fullContentDigestIndependentlyVerified: true,
    },
    safetensorsStructure: {
      headerLength:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH,
      headerDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_SHA256,
      tensorNameSetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256,
      tensorCount: EXPECTED_TENSOR_COUNT,
      dtypeCounts: [{
        dtype: 'F16',
        count: EXPECTED_TENSOR_COUNT,
      }],
      maximumRank: EXPECTED_MAXIMUM_RANK,
      dataSectionByteLength: EXPECTED_DATA_SECTION_BYTES,
      totalTensorByteLength: EXPECTED_DATA_SECTION_BYTES,
      finalDataOffset: EXPECTED_DATA_SECTION_BYTES,
      offsetsContiguousFromZero: true,
      everyTensorSpanMatchesShapeAndDtype: true,
      tensorPayloadExactlyAccountsForDataSection: true,
      metadataKeyCount: EXPECTED_METADATA_KEY_COUNT,
      metadataKeySetDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_KEY_SET_SHA256,
      metadataDigestSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256,
      declaredArchitecture:
        'stable-diffusion-xl-v1-base/lora',
      declaredBaseModelVersion: 'sdxl_base_v0-9',
      declaredResolution: '1024x1024',
      declaredPredictionType: 'epsilon',
      declaredNetworkModule: 'networks.lora',
      declaredLicenseText:
        'CreativeML Open RAIL++-M License',
      metadataNamesEarlierSdxlBaseVersion: true,
    },
    bundleProgress: {
      candidateArtifactCount: 5,
      independentlyVerifiedArtifactByteCount: 1,
      safetensorsSchemaInspectedArtifactCount: 1,
      remainingUnverifiedArtifactCodes: [
        'sdxl_base_1_0_monolithic_safetensors',
        'controlnet_canny_sdxl_1_0_small_fp16_safetensors',
        'generic_ipadapter_sdxl_big_g_safetensors',
        'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
      ],
      completeBundleBytesVerified: false,
      exactBundleCompatibilityProven: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_LORA_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
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

async function assertCandidateSet(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
  candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
): Promise<void> {
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      candidateSet,
      candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')
}

function requireLoraCandidate(
  candidateSet: LivingFrameControlledSdxlArtifactCandidateSet,
): LivingFrameControlledSdxlArtifactCandidate {
  const candidates = candidateSet.artifacts.filter(
    (candidate) =>
      candidate.artifactCode
        === LIVING_FRAME_CONTROLLED_SDXL_LORA_ARTIFACT_CODE,
  )
  const candidate = candidates[0]
  if (
    candidates.length !== 1
    || !candidate
    || candidate.order !== 3
    || candidate.role !== 'lora_adapter'
    || candidate.bindingKind !== 'lora_artifact_expectation'
    || candidate.repositoryCode
      !== LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_CODE
    || candidate.repositoryRevisionSha1
      !== LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_REVISION
    || candidate.reportedByteLength
      !== LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH
    || candidate.reportedContentSha256
      !== LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256
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
  value: LivingFrameControlledSdxlLoraByteReaderPort | null,
): LivingFrameControlledSdxlLoraByteReaderPort {
  if (
    !value
    || !byteReaderPorts.has(value)
    || consumedByteReaderPorts.has(value)
    || value.readerClass
      !==
      'process_bound_server_owned_exact_sdxl_lora_byte_reader'
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

async function measureStream(
  stream: Readable,
): Promise<LivingFrameControlledSafetensorsByteInspection> {
  try {
    return await inspectLivingFrameControlledSafetensorsByteStream({
      stream,
      expectedByteLength:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
      expectedContentSha256:
        LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
      maximumHeaderByteLength: 16 * 1024 * 1024,
      expectedMetadataValues: {
        'modelspec.architecture':
          'stable-diffusion-xl-v1-base/lora',
        ss_base_model_version: 'sdxl_base_v0-9',
        'modelspec.resolution': '1024x1024',
        'modelspec.prediction_type': 'epsilon',
        ss_network_module: 'networks.lora',
        'modelspec.license':
          'CreativeML Open RAIL++-M License',
      },
    })
  } catch {
    throw invalid(
      'safetensors_data_section_mismatch',
      '$.safetensors',
    )
  }
}

function assertExactMeasurement(
  value: LivingFrameControlledSafetensorsByteInspection,
): void {
  if (
    value.byteLength !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH
    || value.contentSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256
    || value.headerLength !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH
    || value.headerDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_SHA256
    || value.tensorNameSetDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256
    || value.tensorCount !== EXPECTED_TENSOR_COUNT
    || value.dtypeCounts.length !== 1
    || value.dtypeCounts[0]?.dtype !== 'F16'
    || value.dtypeCounts[0]?.count !== EXPECTED_TENSOR_COUNT
    || value.maximumRank !== EXPECTED_MAXIMUM_RANK
    || value.dataSectionByteLength
      !== EXPECTED_DATA_SECTION_BYTES
    || value.totalTensorByteLength
      !== EXPECTED_DATA_SECTION_BYTES
    || value.finalDataOffset !== EXPECTED_DATA_SECTION_BYTES
    || !value.offsetsContiguousFromZero
    || !value.everyTensorSpanMatchesShapeAndDtype
    || !value.tensorPayloadExactlyAccountsForDataSection
    || value.metadataKeyCount !== EXPECTED_METADATA_KEY_COUNT
    || value.metadataKeySetDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_KEY_SET_SHA256
    || value.metadataDigestSha256 !==
      LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256
    || value.metadataExpectationCount !== 6
    || !value.expectedMetadataValuesMatched
    || value.rawMetadataReturned !== false
    || value.rawHeaderOrTensorBytesReturned !== false
  ) throw invalid(
    'safetensors_data_section_mismatch',
    '$.safetensors',
  )
}

function assertInput(
  input: CreateLivingFrameControlledSdxlLoraByteObservationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'candidateSet',
      'candidateSetInput',
      'byteReader',
    ])
    || typeof input.observationId !== 'string'
    || !SAFE_ID.test(input.observationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code:
    LivingFrameControlledSdxlLoraByteObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlLoraByteObservationError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error(
    'Unknown Living Frame SDXL LoRA byte observation issue code.',
  )
  return new LivingFrameControlledSdxlLoraByteObservationError([
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
