import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES,
  type LivingFrameControlledSdxlGpuOutputEvidenceClass,
  type LivingFrameControlledSdxlGpuOutputObservation,
} from '../../src/types/living-frame-controlled-sdxl-gpu-output-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_VERSION,
  type LivingFrameControlledSdxlRembgInputBinding,
  type LivingFrameControlledSdxlRembgInputBindingAuthority,
  type LivingFrameControlledSdxlRembgInputBindingDraft,
  type LivingFrameControlledSdxlRembgInputBindingIssue,
  type LivingFrameControlledSdxlRembgInputBindingIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-rembg-input-binding'
import {
  verifyLivingFrameControlledSdxlGpuOutputObservation,
} from './living-frame-controlled-sdxl-gpu-output-observation'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024
const EXPECTED_WIDTH = 1024 as const
const EXPECTED_HEIGHT = 1024 as const
const EXPECTED_PIXEL_COUNT = 1_048_576 as const
const EXPECTED_RGBA_BYTES = EXPECTED_PIXEL_COUNT * 4

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlRembgInputBindingAuthority =
  deepFreeze({
    privateOpaqueInputRereadAuthority: true,
    genericRembgSourceVariantAuthority: false,
    rembgAdmissionAuthority: false,
    modelArtifactAuthority: false,
    toolOperationAuthority: false,
    dispatchAuthority: false,
    workerCompletionAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    serviceFeeAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    maskArtifactCommitAuthority: false,
    maskQaAuthority: false,
    alphaComponentAuthority: false,
    alphaQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledSdxlRembgPrivateInputPacket {
  readonly packetClass:
    'server_owned_living_frame_opaque_output_for_rembg_v1'
  readonly evidenceClass:
    LivingFrameControlledSdxlGpuOutputEvidenceClass
  readonly gpuOutputObservationId: string
  readonly gpuOutputObservationDigestSha256: string
  readonly outputArtifactId: string
  readonly outputContentType: 'image/png'
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly decodedRgbaSha256: string
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly genericRembgSourceVariantAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlRembgPrivateInputReader {
  readonly readerVersion:
    'living-frame-controlled-sdxl-rembg-private-input-reader-v1'
  readonly readerClass:
    'process_bound_server_owned_opaque_output_reader_for_rembg'
  readonly evidenceClass:
    LivingFrameControlledSdxlGpuOutputEvidenceClass
  readonly binding: {
    readonly gpuOutputObservationId: string
    readonly gpuOutputObservationDigestSha256: string
    readonly outputArtifactId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly credentialsIncluded: false
  readonly rembgAdmissionAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readServerOwnedOpaqueOutput():
    Promise<LivingFrameControlledSdxlRembgPrivateInputPacket>
}

export interface LivingFrameControlledSdxlRembgVerifiedInput {
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly verification: {
    readonly gpuOutputObservationId: string
    readonly gpuOutputObservationDigestSha256: string
    readonly outputArtifactId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly sourceVariant:
      'living_frame_generated_opaque_still_png'
    readonly opaqueSourceOnly: true
  }
}

export interface LivingFrameControlledSdxlRembgInputConsumer {
  readonly consumerVersion:
    'living-frame-controlled-sdxl-rembg-input-consumer-v1'
  readonly consumerClass:
    'process_bound_server_owned_verified_opaque_input_consumer'
  readonly acceptsOnlyVerifiedOpaqueInput: true
  readonly browserShareable: false
  readonly genericRembgSourceVariantAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly maskArtifactCommitAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  consume(
    payload: LivingFrameControlledSdxlRembgVerifiedInput,
  ): Promise<void>
}

const authorityBoundarySchema = z.object({
  privateOpaqueInputRereadAuthority: z.literal(true),
  genericRembgSourceVariantAuthority: z.literal(false),
  rembgAdmissionAuthority: z.literal(false),
  modelArtifactAuthority: z.literal(false),
  toolOperationAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  workerCompletionAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  maskArtifactCommitAuthority: z.literal(false),
  maskQaAuthority: z.literal(false),
  alphaComponentAuthority: z.literal(false),
  alphaQaAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const bindingDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_CLASS,
  ),
  bindingId: z.string().regex(SAFE_ID),
  caseId: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  ).exclude(['exact_bundle_load']),
  sourceBindings: z.object({
    gpuOutputObservationId: z.string().regex(SAFE_ID),
    gpuOutputObservationDigestSha256: z.string().regex(SHA256),
    requestReceiptId: z.string().regex(SAFE_ID),
    requestReceiptDigestSha256: z.string().regex(SHA256),
    privateWireRequestDigestSha256: z.string().regex(SHA256),
    outputArtifactId: z.string().regex(SAFE_ID),
    outputContentSha256: z.string().regex(SHA256),
    decodedRgbaSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
    readerBindingDigestSha256: z.string().regex(SHA256),
  }).strict(),
  inputReader: z.object({
    evidenceClass: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES,
    ),
    oneShotReaderConsumed: z.literal(true),
    oneShotConsumerConsumed: z.literal(true),
    verifiedBytesDeliveredOutOfBand: z.literal(true),
  }).strict(),
  verifiedOpaqueInput: z.object({
    sourceVariant: z.literal(
      'living_frame_generated_opaque_still_png',
    ),
    contentType: z.literal('image/png'),
    byteLength: z.number().int().positive().max(MAX_OUTPUT_BYTES),
    contentSha256: z.string().regex(SHA256),
    decodedRgbaSha256: z.string().regex(SHA256),
    widthPixels: z.literal(EXPECTED_WIDTH),
    heightPixels: z.literal(EXPECTED_HEIGHT),
    decodedChannelCount: z.literal(4),
    transparentPixelCount: z.literal(0),
    semiTransparentPixelCount: z.literal(0),
    opaquePixelCount: z.literal(EXPECTED_PIXEL_COUNT),
    sourceIsFfmpegExtractedFrame: z.literal(false),
    sourceIsCommittedTransparentArtifact: z.literal(false),
  }).strict(),
  rembgOperationExpectation: z.object({
    canonicalToolId: z.literal('rembg'),
    canonicalOperationId: z.literal(
      'tool.rembg.remove_image_background.v1',
    ),
    executionTarget: z.literal('google_cloud_run_gpu'),
    runtimeRegion: z.literal('europe-west1'),
    accelerator: z.literal('nvidia_l4'),
    gpuCount: z.literal(1),
    device: z.literal('cuda'),
    modelId: z.literal('u2netp'),
    outputMode: z.literal('mask_only_png'),
    preserveSourceDimensions: z.literal(true),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  downstreamContract: z.object({
    sharedCanonicalRembgRuntimeMustAdmitGeneratedOpaqueImageVariant:
      z.literal(true),
    existingSourceFrameOnlyAdmissionCannotBeRelabeledEquivalent:
      z.literal(true),
    expectedMaskContentType: z.literal('image/png'),
    expectedMaskEncodingProfile: z.literal('gray8_mask_png_v1'),
    maskDimensionsMustMatchInput: z.literal(true),
    sharpStraightAlphaCompositionRequired: z.literal(true),
  }).strict(),
  costLineage: z.object({
    comfyuiGpuAttemptNotChargedAgain: z.literal(true),
    rembgIsSeparateCanonicalToolAttempt: z.literal(true),
    rembgAttemptCostOwnedByExistingToolCostAuthority: z.literal(true),
    costAmountIncluded: z.literal(false),
    customerPriceOrCreditIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  gpuOutputObservationRevalidated: z.literal(true),
  exactOpaqueBytesAndDecodedRgbaReread: z.literal(true),
  exactObservationAndInputLineageMatched: z.literal(true),
  genericRembgSourceVariantAdmitted: z.literal(false),
  rembgRequestCreated: z.literal(false),
  rembgInferenceExecuted: z.literal(false),
  maskArtifactCreated: z.literal(false),
  transparentComponentCreated: z.literal(false),
  containsBytesPathUrlCredentialPromptCommandOrRawMedia:
    z.literal(false),
  containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const bindingSchema = bindingDraftSchema.extend({
  bindingDigestSha256: z.string().regex(SHA256),
}).strict()

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const consumers = new WeakSet<object>()
const consumedConsumers = new WeakSet<object>()

export class LivingFrameControlledSdxlRembgInputBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlRembgInputBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlRembgInputBindingIssue[],
  ) {
    super(
      'Living Frame controlled SDXL rembg input binding failed.',
    )
    this.name =
      'LivingFrameControlledSdxlRembgInputBindingError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlRembgPrivateInputReader(
  input: {
    readonly gpuOutputObservation:
      LivingFrameControlledSdxlGpuOutputObservation
    readonly readServerOwnedOpaqueOutput:
      LivingFrameControlledSdxlRembgPrivateInputReader[
        'readServerOwnedOpaqueOutput'
      ]
  },
): LivingFrameControlledSdxlRembgPrivateInputReader {
  if (
    !verifyLivingFrameControlledSdxlGpuOutputObservation(
      input.gpuOutputObservation,
    )
    || typeof input.readServerOwnedOpaqueOutput !== 'function'
  ) throw invalid('reader_invalid', '$.inputReader')
  const observation = input.gpuOutputObservation
  const bindingDraft = {
    gpuOutputObservationId: observation.observationId,
    gpuOutputObservationDigestSha256:
      observation.observationDigestSha256,
    outputArtifactId: observation.verifiedOutput.outputArtifactId,
    outputContentSha256: observation.verifiedOutput.contentSha256,
    decodedRgbaSha256:
      observation.verifiedOutput.decodedRgbaSha256,
    outputFrameExpectationDigestSha256:
      observation.sourceBindings.outputFrameExpectationDigestSha256,
  }
  const reader:
    LivingFrameControlledSdxlRembgPrivateInputReader =
    Object.freeze({
      readerVersion:
        'living-frame-controlled-sdxl-rembg-private-input-reader-v1',
      readerClass:
        'process_bound_server_owned_opaque_output_reader_for_rembg',
      evidenceClass: observation.outputReader.evidenceClass,
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256: digest(bindingDraft),
      }),
      callerBytesAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      credentialsIncluded: false,
      rembgAdmissionAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      readServerOwnedOpaqueOutput:
        input.readServerOwnedOpaqueOutput.bind(undefined),
    })
  readers.add(reader)
  return reader
}

export function createLivingFrameControlledSdxlRembgInputConsumer(
  consume:
    LivingFrameControlledSdxlRembgInputConsumer['consume'],
): LivingFrameControlledSdxlRembgInputConsumer {
  if (typeof consume !== 'function') {
    throw invalid('consumer_invalid', '$.inputConsumer')
  }
  const consumer: LivingFrameControlledSdxlRembgInputConsumer =
    Object.freeze({
      consumerVersion:
        'living-frame-controlled-sdxl-rembg-input-consumer-v1',
      consumerClass:
        'process_bound_server_owned_verified_opaque_input_consumer',
      acceptsOnlyVerifiedOpaqueInput: true,
      browserShareable: false,
      genericRembgSourceVariantAuthority: false,
      rembgAdmissionAuthority: false,
      maskArtifactCommitAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      consume: consume.bind(undefined),
    })
  consumers.add(consumer)
  return consumer
}

export async function createLivingFrameControlledSdxlRembgInputBinding(
  input: {
    readonly gpuOutputObservation:
      LivingFrameControlledSdxlGpuOutputObservation
    readonly inputReader:
      LivingFrameControlledSdxlRembgPrivateInputReader
    readonly inputConsumer:
      LivingFrameControlledSdxlRembgInputConsumer
  },
): Promise<LivingFrameControlledSdxlRembgInputBinding> {
  assertInput(input)
  const observation = input.gpuOutputObservation
  const reader = requireReader(input.inputReader, observation)
  const consumer = requireConsumer(input.inputConsumer)
  consumedReaders.add(reader)

  let packetValue: LivingFrameControlledSdxlRembgPrivateInputPacket
  try {
    packetValue = await reader.readServerOwnedOpaqueOutput()
  } catch {
    throw invalid('reader_failed', '$.inputReader')
  }
  const packet = assertPacket(packetValue, observation)
  const outputPng = Buffer.from(packet.outputPng)
  const decodedRgba = Buffer.from(packet.decodedRgba)
  if (
    outputPng.byteLength !== packet.outputByteLength
    || digestBytes(outputPng) !== packet.outputContentSha256
  ) throw invalid(
    'source_byte_digest_mismatch',
    '$.inputPacket.outputPng',
  )
  if (decodedRgba.byteLength !== EXPECTED_RGBA_BYTES) {
    throw invalid(
      'decoded_rgba_shape_invalid',
      '$.inputPacket.decodedRgba',
    )
  }
  if (digestBytes(decodedRgba) !== packet.decodedRgbaSha256) {
    throw invalid(
      'decoded_rgba_digest_mismatch',
      '$.inputPacket.decodedRgba',
    )
  }
  for (let offset = 3; offset < decodedRgba.byteLength; offset += 4) {
    if (decodedRgba[offset] !== 255) {
      throw invalid(
        'opaque_alpha_policy_invalid',
        '$.inputPacket.decodedRgba',
      )
    }
  }

  const verification = Object.freeze({
    gpuOutputObservationId: observation.observationId,
    gpuOutputObservationDigestSha256:
      observation.observationDigestSha256,
    outputArtifactId: packet.outputArtifactId,
    outputContentSha256: packet.outputContentSha256,
    decodedRgbaSha256: packet.decodedRgbaSha256,
    widthPixels: EXPECTED_WIDTH,
    heightPixels: EXPECTED_HEIGHT,
    sourceVariant:
      'living_frame_generated_opaque_still_png' as const,
    opaqueSourceOnly: true as const,
  })
  consumedConsumers.add(consumer)
  try {
    await consumer.consume({
      outputPng: Buffer.from(outputPng),
      decodedRgba: Buffer.from(decodedRgba),
      verification,
    })
  } catch {
    throw invalid('consumer_failed', '$.inputConsumer')
  }

  const bindingId =
    `lfrembgin_${digest({
      observation: observation.observationDigestSha256,
      output: packet.outputContentSha256,
      reader: reader.binding.readerBindingDigestSha256,
    }).slice(0, 40)}`
  const draft: LivingFrameControlledSdxlRembgInputBindingDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_CLASS,
    bindingId,
    caseId: observation.caseId,
    sourceBindings: {
      gpuOutputObservationId: observation.observationId,
      gpuOutputObservationDigestSha256:
        observation.observationDigestSha256,
      requestReceiptId: observation.sourceBindings.requestReceiptId,
      requestReceiptDigestSha256:
        observation.sourceBindings.requestReceiptDigestSha256,
      privateWireRequestDigestSha256:
        observation.sourceBindings.privateWireRequestDigestSha256,
      outputArtifactId: packet.outputArtifactId,
      outputContentSha256: packet.outputContentSha256,
      decodedRgbaSha256: packet.decodedRgbaSha256,
      outputFrameExpectationDigestSha256:
        observation.sourceBindings.outputFrameExpectationDigestSha256,
      readerBindingDigestSha256:
        reader.binding.readerBindingDigestSha256,
    },
    inputReader: {
      evidenceClass: reader.evidenceClass,
      oneShotReaderConsumed: true,
      oneShotConsumerConsumed: true,
      verifiedBytesDeliveredOutOfBand: true,
    },
    verifiedOpaqueInput: {
      sourceVariant: 'living_frame_generated_opaque_still_png',
      contentType: 'image/png',
      byteLength: outputPng.byteLength,
      contentSha256: packet.outputContentSha256,
      decodedRgbaSha256: packet.decodedRgbaSha256,
      widthPixels: EXPECTED_WIDTH,
      heightPixels: EXPECTED_HEIGHT,
      decodedChannelCount: 4,
      transparentPixelCount: 0,
      semiTransparentPixelCount: 0,
      opaquePixelCount: EXPECTED_PIXEL_COUNT,
      sourceIsFfmpegExtractedFrame: false,
      sourceIsCommittedTransparentArtifact: false,
    },
    rembgOperationExpectation: {
      canonicalToolId: 'rembg',
      canonicalOperationId:
        'tool.rembg.remove_image_background.v1',
      executionTarget: 'google_cloud_run_gpu',
      runtimeRegion: 'europe-west1',
      accelerator: 'nvidia_l4',
      gpuCount: 1,
      device: 'cuda',
      modelId: 'u2netp',
      outputMode: 'mask_only_png',
      preserveSourceDimensions: true,
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    downstreamContract: {
      sharedCanonicalRembgRuntimeMustAdmitGeneratedOpaqueImageVariant:
        true,
      existingSourceFrameOnlyAdmissionCannotBeRelabeledEquivalent:
        true,
      expectedMaskContentType: 'image/png',
      expectedMaskEncodingProfile: 'gray8_mask_png_v1',
      maskDimensionsMustMatchInput: true,
      sharpStraightAlphaCompositionRequired: true,
    },
    costLineage: {
      comfyuiGpuAttemptNotChargedAgain: true,
      rembgIsSeparateCanonicalToolAttempt: true,
      rembgAttemptCostOwnedByExistingToolCostAuthority: true,
      costAmountIncluded: false,
      customerPriceOrCreditIncluded: false,
      serviceFeeIncluded: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    gpuOutputObservationRevalidated: true,
    exactOpaqueBytesAndDecodedRgbaReread: true,
    exactObservationAndInputLineageMatched: true,
    genericRembgSourceVariantAdmitted: false,
    rembgRequestCreated: false,
    rembgInferenceExecuted: false,
    maskArtifactCreated: false,
    transparentComponentCreated: false,
    containsBytesPathUrlCredentialPromptCommandOrRawMedia: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertBindingSafe(draft)
  return deepFreeze({
    ...draft,
    bindingDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameControlledSdxlRembgInputBinding(
  value: unknown,
): value is LivingFrameControlledSdxlRembgInputBinding {
  try {
    const parsed = bindingSchema.safeParse(value)
    if (!parsed.success) return false
    const { bindingDigestSha256, ...draft } = parsed.data
    assertBindingSafe(draft)
    if (
      canonicalJson(draft.openGateCodes)
        !== canonicalJson(
          LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
        )
      || canonicalJson(draft.authorityBoundary)
        !== canonicalJson(AUTHORITY_BOUNDARY)
    ) return false
    return digest(draft) === bindingDigestSha256
  } catch {
    return false
  }
}

function assertInput(
  value: unknown,
): asserts value is {
  readonly gpuOutputObservation:
    LivingFrameControlledSdxlGpuOutputObservation
  readonly inputReader:
    LivingFrameControlledSdxlRembgPrivateInputReader
  readonly inputConsumer:
    LivingFrameControlledSdxlRembgInputConsumer
} {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'gpuOutputObservation',
      'inputReader',
      'inputConsumer',
    ])
    || !verifyLivingFrameControlledSdxlGpuOutputObservation(
      value.gpuOutputObservation,
    )
  ) throw invalid('input_invalid', '$')
}

function requireReader(
  reader: LivingFrameControlledSdxlRembgPrivateInputReader,
  observation: LivingFrameControlledSdxlGpuOutputObservation,
): LivingFrameControlledSdxlRembgPrivateInputReader {
  if (reader && readers.has(reader) && consumedReaders.has(reader)) {
    throw invalid('reader_reused', '$.inputReader')
  }
  if (
    !reader
    || !readers.has(reader)
    || consumedReaders.has(reader)
    || reader.readerVersion
      !== 'living-frame-controlled-sdxl-rembg-private-input-reader-v1'
    || reader.readerClass
      !== 'process_bound_server_owned_opaque_output_reader_for_rembg'
    || reader.evidenceClass !== observation.outputReader.evidenceClass
    || reader.callerBytesAccepted !== false
    || reader.callerPathAccepted !== false
    || reader.callerUrlAccepted !== false
    || reader.credentialsIncluded !== false
    || reader.rembgAdmissionAuthority !== false
    || reader.actualCostAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.inputReader')
  const expected = {
    gpuOutputObservationId: observation.observationId,
    gpuOutputObservationDigestSha256:
      observation.observationDigestSha256,
    outputArtifactId: observation.verifiedOutput.outputArtifactId,
    outputContentSha256: observation.verifiedOutput.contentSha256,
    decodedRgbaSha256:
      observation.verifiedOutput.decodedRgbaSha256,
    outputFrameExpectationDigestSha256:
      observation.sourceBindings.outputFrameExpectationDigestSha256,
  }
  if (
    reader.binding.gpuOutputObservationId
      !== expected.gpuOutputObservationId
    || reader.binding.gpuOutputObservationDigestSha256
      !== expected.gpuOutputObservationDigestSha256
    || reader.binding.outputArtifactId
      !== expected.outputArtifactId
    || reader.binding.outputContentSha256
      !== expected.outputContentSha256
    || reader.binding.decodedRgbaSha256
      !== expected.decodedRgbaSha256
    || reader.binding.outputFrameExpectationDigestSha256
      !== expected.outputFrameExpectationDigestSha256
    || reader.binding.readerBindingDigestSha256 !== digest(expected)
  ) throw invalid(
    'reader_lineage_invalid',
    '$.inputReader.binding',
  )
  return reader
}

function requireConsumer(
  consumer: LivingFrameControlledSdxlRembgInputConsumer,
): LivingFrameControlledSdxlRembgInputConsumer {
  if (
    consumer
    && consumers.has(consumer)
    && consumedConsumers.has(consumer)
  ) throw invalid('consumer_reused', '$.inputConsumer')
  if (
    !consumer
    || !consumers.has(consumer)
    || consumedConsumers.has(consumer)
    || consumer.consumerVersion
      !== 'living-frame-controlled-sdxl-rembg-input-consumer-v1'
    || consumer.consumerClass
      !==
        'process_bound_server_owned_verified_opaque_input_consumer'
    || consumer.acceptsOnlyVerifiedOpaqueInput !== true
    || consumer.browserShareable !== false
    || consumer.genericRembgSourceVariantAuthority !== false
    || consumer.rembgAdmissionAuthority !== false
    || consumer.maskArtifactCommitAuthority !== false
    || consumer.actualCostAuthority !== false
    || consumer.productionReady !== false
  ) throw invalid('consumer_invalid', '$.inputConsumer')
  return consumer
}

function assertPacket(
  value: unknown,
  observation: LivingFrameControlledSdxlGpuOutputObservation,
): LivingFrameControlledSdxlRembgPrivateInputPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'evidenceClass',
      'gpuOutputObservationId',
      'gpuOutputObservationDigestSha256',
      'outputArtifactId',
      'outputContentType',
      'outputByteLength',
      'outputContentSha256',
      'decodedRgbaSha256',
      'outputPng',
      'decodedRgba',
      'callerBytesPathUrlOrCredentialAccepted',
      'genericRembgSourceVariantAuthority',
      'rembgAdmissionAuthority',
      'actualCostAuthority',
      'productionReady',
    ])
    || value.packetClass
      !== 'server_owned_living_frame_opaque_output_for_rembg_v1'
    || typeof value.evidenceClass !== 'string'
    || !(
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(value.evidenceClass)
    || typeof value.outputArtifactId !== 'string'
    || !SAFE_ID.test(value.outputArtifactId)
    || value.outputContentType !== 'image/png'
    || typeof value.outputByteLength !== 'number'
    || !Number.isInteger(value.outputByteLength)
    || value.outputByteLength < 1
    || value.outputByteLength > MAX_OUTPUT_BYTES
    || typeof value.outputContentSha256 !== 'string'
    || !SHA256.test(value.outputContentSha256)
    || typeof value.decodedRgbaSha256 !== 'string'
    || !SHA256.test(value.decodedRgbaSha256)
    || !Buffer.isBuffer(value.outputPng)
    || value.outputPng.buffer instanceof SharedArrayBuffer
    || !Buffer.isBuffer(value.decodedRgba)
    || value.decodedRgba.buffer instanceof SharedArrayBuffer
    || value.callerBytesPathUrlOrCredentialAccepted !== false
    || value.genericRembgSourceVariantAuthority !== false
    || value.rembgAdmissionAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
  ) throw invalid('packet_invalid', '$.inputPacket')
  if (
    value.evidenceClass !== observation.outputReader.evidenceClass
    || value.gpuOutputObservationId !== observation.observationId
    || value.gpuOutputObservationDigestSha256
      !== observation.observationDigestSha256
    || value.outputArtifactId
      !== observation.verifiedOutput.outputArtifactId
    || value.outputContentSha256
      !== observation.verifiedOutput.contentSha256
    || value.outputByteLength
      !== observation.verifiedOutput.byteLength
    || value.decodedRgbaSha256
      !== observation.verifiedOutput.decodedRgbaSha256
  ) throw invalid('packet_lineage_invalid', '$.inputPacket')
  return value as unknown as
    LivingFrameControlledSdxlRembgPrivateInputPacket
}

function assertBindingSafe(
  value: LivingFrameControlledSdxlRembgInputBindingDraft,
): void {
  if (
    canonicalJson(value.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || canonicalJson(value.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
      )
    || value.genericRembgSourceVariantAdmitted !== false
    || value.rembgRequestCreated !== false
    || value.rembgInferenceExecuted !== false
    || value.maskArtifactCreated !== false
    || value.transparentComponentCreated !== false
    || value.productionReady !== false
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  const serialized = canonicalJson(value)
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    'data:',
    'AKIA',
    'sk-',
    'BEGIN PRIVATE KEY',
    '"outputPng"',
    '"decodedRgba"',
    '"path"',
    '"url"',
    '"credential"',
    '"prompt"',
    '"command"',
    '"customerCredits"',
    '"serviceFee"',
    '"priceUsd"',
    '"costUsd"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.toLowerCase().includes(forbidden.toLowerCase())) {
      throw invalid(
        'unsafe_binding_forbidden',
        '$',
      )
    }
  }
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function digestBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (
      typeof value === 'number'
      && Number.isFinite(value)
    )
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    const output: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) {
        throw new TypeError('undefined is not canonical JSON')
      }
      output[key] = canonicalize(value[key])
    }
    return output
  }
  throw new TypeError('non-JSON value')
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  return actual.length === required.length
    && actual.every((key, index) => key === required[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function invalid(
  code: LivingFrameControlledSdxlRembgInputBindingIssueCode,
  path: string,
): LivingFrameControlledSdxlRembgInputBindingError {
  if (
    !(
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_ISSUES as
        readonly string[]
    ).includes(code)
  ) throw new TypeError('unknown issue code')
  return new LivingFrameControlledSdxlRembgInputBindingError([
    { code, path },
  ])
}
