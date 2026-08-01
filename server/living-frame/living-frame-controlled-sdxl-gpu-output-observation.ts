import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { z } from 'zod'

import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
  type LivingFrameAlphaMeasurementReport,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
  type LivingFrameControlledSdxlGpuOutputEvidenceClass,
  type LivingFrameControlledSdxlGpuOutputObservation,
  type LivingFrameControlledSdxlGpuOutputObservationAuthority,
  type LivingFrameControlledSdxlGpuOutputObservationDraft,
  type LivingFrameControlledSdxlGpuOutputObservationIssue,
  type LivingFrameControlledSdxlGpuOutputObservationIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-gpu-output-observation'
import type {
  LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
} from '../../src/types/living-frame-controlled-sdxl-gpu-runtime-protocol'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt,
} from './living-frame-controlled-sdxl-gpu-runtime-protocol'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024
const EXPECTED_WIDTH = 1024 as const
const EXPECTED_HEIGHT = 1024 as const
const EXPECTED_PIXEL_COUNT = 1_048_576 as const
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex')
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlGpuOutputObservationAuthority =
  deepFreeze({
    privateOutputRereadAuthority: true,
    requestAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    workerCompletionAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCommitAuthority: false,
    segmentationOrMattingAuthority: false,
    alphaQaAuthority: false,
    continuityQaAuthority: false,
    documentarySafetyQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledSdxlGpuPrivateOutputPacket {
  readonly packetClass:
    'server_owned_controlled_comfyui_png_output_packet_v1'
  readonly evidenceClass:
    LivingFrameControlledSdxlGpuOutputEvidenceClass
  readonly requestReceiptId: string
  readonly requestReceiptDigestSha256: string
  readonly privateWireRequestDigestSha256: string
  readonly outputArtifactId: string
  readonly outputContentType: 'image/png'
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly outputPng: Buffer
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly workerCompletionAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlGpuPrivateOutputReader {
  readonly readerVersion:
    'living-frame-controlled-sdxl-gpu-private-output-reader-v1'
  readonly readerClass:
    'process_bound_server_owned_controlled_comfyui_output_reader'
  readonly evidenceClass:
    LivingFrameControlledSdxlGpuOutputEvidenceClass
  readonly binding: {
    readonly requestReceiptId: string
    readonly requestReceiptDigestSha256: string
    readonly privateWireRequestDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly credentialsIncluded: false
  readonly workerCompletionAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readServerOwnedOutput():
    Promise<LivingFrameControlledSdxlGpuPrivateOutputPacket>
}

export interface LivingFrameControlledSdxlGpuVerifiedOpaqueOutput {
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly verification: {
    readonly requestReceiptDigestSha256: string
    readonly privateWireRequestDigestSha256: string
    readonly outputArtifactId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly alphaMeasurementReportDigestSha256: string
    readonly opaqueSourceOnly: true
  }
}

export interface LivingFrameControlledSdxlGpuVerifiedOutputConsumer {
  readonly consumerVersion:
    'living-frame-controlled-sdxl-gpu-verified-output-consumer-v1'
  readonly consumerClass:
    'process_bound_server_owned_verified_controlled_comfyui_output_consumer'
  readonly acceptsOnlyVerifiedOpaqueOutput: true
  readonly browserShareable: false
  readonly artifactCommitAuthority: false
  readonly segmentationOrMattingAuthority: false
  readonly productionReady: false
  consume(
    payload: LivingFrameControlledSdxlGpuVerifiedOpaqueOutput,
  ): Promise<void>
}

const authorityBoundarySchema = z.object({
  privateOutputRereadAuthority: z.literal(true),
  requestAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  workerCompletionAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  artifactCommitAuthority: z.literal(false),
  segmentationOrMattingAuthority: z.literal(false),
  alphaQaAuthority: z.literal(false),
  continuityQaAuthority: z.literal(false),
  documentarySafetyQaAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const observationDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
  ),
  observationId: z.string().regex(SAFE_ID),
  caseId: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  ).exclude(['exact_bundle_load']),
  sourceBindings: z.object({
    requestReceiptId: z.string().regex(SAFE_ID),
    requestReceiptDigestSha256: z.string().regex(SHA256),
    privateWireRequestDigestSha256: z.string().regex(SHA256),
    promptMaterializationDigestSha256: z.string().regex(SHA256),
    artifactSetDigestSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
    readerBindingDigestSha256: z.string().regex(SHA256),
  }).strict(),
  outputReader: z.object({
    evidenceClass: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES,
    ),
    oneShotReaderConsumed: z.literal(true),
    oneShotConsumerConsumed: z.literal(true),
    verifiedBytesDeliveredOutOfBand: z.literal(true),
  }).strict(),
  verifiedOutput: z.object({
    outputArtifactId: z.string().regex(SAFE_ID),
    contentType: z.literal('image/png'),
    byteLength:
      z.number().int().positive().max(MAX_OUTPUT_BYTES),
    contentSha256: z.string().regex(SHA256),
    decodedRgbaSha256: z.string().regex(SHA256),
    widthPixels: z.literal(EXPECTED_WIDTH),
    heightPixels: z.literal(EXPECTED_HEIGHT),
    decodedChannelCount: z.literal(4),
    sourcePngHadAlphaChannel: z.literal(false),
    transparentPixelCount: z.literal(0),
    semiTransparentPixelCount: z.literal(0),
    opaquePixelCount: z.literal(EXPECTED_PIXEL_COUNT),
    alphaMeasurementReportDigestSha256:
      z.string().regex(SHA256),
    alphaFindingCodes: z.array(z.enum(
      LIVING_FRAME_ALPHA_FINDING_CODES,
    )).min(1).max(LIVING_FRAME_ALPHA_FINDING_CODES.length),
    alphaDisposition: z.literal(
      'opaque_generated_source_requires_segmentation_matting_decontamination_and_alpha_qa',
    ),
  }).strict(),
  costLineage: z.object({
    costComponentId: z.literal(
      'shared_controlled_illustration_gpu_host',
    ),
    oneObservedOutputBelongsToOneGpuAttempt: z.literal(true),
    fiveGpuCapabilitiesShareAttemptLifetime: z.literal(true),
    auraFaceCpuMeasurementExcluded: z.literal(true),
    canonicalWorkerResourceCostEvidenceRequired: z.literal(true),
    completedFailedOrUnknownOutcomeNotInferred: z.literal(true),
    actualCostAmountIncluded: z.literal(false),
    customerPriceOrCreditIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  requestReceiptRevalidated: z.literal(true),
  exactRequestAndOutputLineageMatched: z.literal(true),
  exactPrivateOutputBytesRereadAndDecoded: z.literal(true),
  alphaMeasurementRecomputedFromDecodedBytes: z.literal(true),
  outputIsOpaqueSourceOnly: z.literal(true),
  transparentComponentCreated: z.literal(false),
  artifactCommitted: z.literal(false),
  actualAttemptCostEvidenceVerified: z.literal(false),
  selectedSceneCreated: z.literal(false),
  containsOutputBytesPathUrlCredentialPromptAliasOrCommand:
    z.literal(false),
  containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const observationSchema = observationDraftSchema.extend({
  observationDigestSha256: z.string().regex(SHA256),
}).strict()

const outputReaders = new WeakSet<object>()
const consumedOutputReaders = new WeakSet<object>()
const outputConsumers = new WeakSet<object>()
const consumedOutputConsumers = new WeakSet<object>()

export class LivingFrameControlledSdxlGpuOutputObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlGpuOutputObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlGpuOutputObservationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL GPU output observation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlGpuOutputObservationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlGpuPrivateOutputReader(
  input: {
    readonly requestReceipt:
      LivingFrameControlledSdxlGpuRuntimeRequestReceipt
    readonly evidenceClass:
      LivingFrameControlledSdxlGpuOutputEvidenceClass
    readonly readServerOwnedOutput:
      LivingFrameControlledSdxlGpuPrivateOutputReader[
        'readServerOwnedOutput'
      ]
  },
): LivingFrameControlledSdxlGpuPrivateOutputReader {
  if (
    !verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      input.requestReceipt,
    )
    || !(
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(input.evidenceClass)
    || typeof input.readServerOwnedOutput !== 'function'
  ) throw invalid('reader_invalid', '$.outputReader')
  const bindingDraft = {
    requestReceiptId:
      input.requestReceipt.requestReceiptId,
    requestReceiptDigestSha256:
      input.requestReceipt.requestReceiptDigestSha256,
    privateWireRequestDigestSha256:
      input.requestReceipt.requestSummary
        .privateWireRequestDigestSha256,
    outputFrameExpectationDigestSha256:
      input.requestReceipt.sourceBindings
        .outputFrameExpectationDigestSha256,
  }
  const reader:
    LivingFrameControlledSdxlGpuPrivateOutputReader =
    Object.freeze({
      readerVersion:
        'living-frame-controlled-sdxl-gpu-private-output-reader-v1',
      readerClass:
        'process_bound_server_owned_controlled_comfyui_output_reader',
      evidenceClass: input.evidenceClass,
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256: digest(bindingDraft),
      }),
      callerBytesAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      credentialsIncluded: false,
      workerCompletionAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      readServerOwnedOutput:
        input.readServerOwnedOutput.bind(undefined),
    })
  outputReaders.add(reader)
  return reader
}

export function createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
  consume:
    LivingFrameControlledSdxlGpuVerifiedOutputConsumer[
      'consume'
    ],
): LivingFrameControlledSdxlGpuVerifiedOutputConsumer {
  if (typeof consume !== 'function') {
    throw invalid('consumer_invalid', '$.outputConsumer')
  }
  const consumer:
    LivingFrameControlledSdxlGpuVerifiedOutputConsumer =
    Object.freeze({
      consumerVersion:
        'living-frame-controlled-sdxl-gpu-verified-output-consumer-v1',
      consumerClass:
        'process_bound_server_owned_verified_controlled_comfyui_output_consumer',
      acceptsOnlyVerifiedOpaqueOutput: true,
      browserShareable: false,
      artifactCommitAuthority: false,
      segmentationOrMattingAuthority: false,
      productionReady: false,
      consume: consume.bind(undefined),
    })
  outputConsumers.add(consumer)
  return consumer
}

export async function observeLivingFrameControlledSdxlGpuPrivateOutput(
  input: {
    readonly requestReceipt:
      LivingFrameControlledSdxlGpuRuntimeRequestReceipt
    readonly outputReader:
      LivingFrameControlledSdxlGpuPrivateOutputReader
    readonly outputConsumer:
      LivingFrameControlledSdxlGpuVerifiedOutputConsumer
  },
): Promise<LivingFrameControlledSdxlGpuOutputObservation> {
  assertInput(input)
  const request = input.requestReceipt
  const reader = requireReader(input.outputReader, request)
  const consumer = requireConsumer(input.outputConsumer)
  consumedOutputReaders.add(reader)
  let packetValue:
    LivingFrameControlledSdxlGpuPrivateOutputPacket
  try {
    packetValue = await reader.readServerOwnedOutput()
  } catch {
    throw invalid('reader_failed', '$.outputReader')
  }
  const packet = assertOutputPacket(packetValue, request)
  const outputPng = Buffer.from(packet.outputPng)
  const outputContentSha256 = digestBytes(outputPng)
  if (
    outputPng.byteLength !== packet.outputByteLength
    || outputContentSha256 !== packet.outputContentSha256
  ) throw invalid(
    'output_digest_mismatch',
    '$.outputPacket.outputPng',
  )

  const decoded = decodeOpaquePng(outputPng)
  const alphaReport = measureLivingFrameAlphaArtifact({
    artifactId: packet.outputArtifactId,
    artifactDigestSha256: outputContentSha256,
    width: decoded.width,
    height: decoded.height,
    rgbaBytes: Uint8Array.from(decoded.rgba),
    alphaMode: 'straight_alpha',
    alphaExpectation: 'opaque_plate_expected',
  })
  assertOpaqueAlphaMeasurement(alphaReport)

  const verification = Object.freeze({
    requestReceiptDigestSha256:
      request.requestReceiptDigestSha256,
    privateWireRequestDigestSha256:
      request.requestSummary.privateWireRequestDigestSha256,
    outputArtifactId: packet.outputArtifactId,
    outputContentSha256,
    decodedRgbaSha256: digestBytes(decoded.rgba),
    widthPixels: EXPECTED_WIDTH,
    heightPixels: EXPECTED_HEIGHT,
    alphaMeasurementReportDigestSha256:
      alphaReport.reportDigestSha256,
    opaqueSourceOnly: true as const,
  })
  consumedOutputConsumers.add(consumer)
  try {
    await consumer.consume({
      outputPng: Buffer.from(outputPng),
      decodedRgba: Buffer.from(decoded.rgba),
      verification,
    })
  } catch {
    throw invalid('consumer_failed', '$.outputConsumer')
  }

  const observationId =
    `lfgpuout_${digest({
      request: request.requestReceiptDigestSha256,
      output: outputContentSha256,
      rgba: verification.decodedRgbaSha256,
    }).slice(0, 40)}`
  const draft:
    LivingFrameControlledSdxlGpuOutputObservationDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
      observationId,
      caseId: request.caseId,
      sourceBindings: {
        requestReceiptId: request.requestReceiptId,
        requestReceiptDigestSha256:
          request.requestReceiptDigestSha256,
        privateWireRequestDigestSha256:
          request.requestSummary.privateWireRequestDigestSha256,
        promptMaterializationDigestSha256:
          request.sourceBindings.promptMaterializationDigestSha256,
        artifactSetDigestSha256:
          request.sourceBindings.artifactSetDigestSha256,
        outputFrameExpectationDigestSha256:
          request.sourceBindings
            .outputFrameExpectationDigestSha256,
        readerBindingDigestSha256:
          reader.binding.readerBindingDigestSha256,
      },
      outputReader: {
        evidenceClass: reader.evidenceClass,
        oneShotReaderConsumed: true,
        oneShotConsumerConsumed: true,
        verifiedBytesDeliveredOutOfBand: true,
      },
      verifiedOutput: {
        outputArtifactId: packet.outputArtifactId,
        contentType: 'image/png',
        byteLength: outputPng.byteLength,
        contentSha256: outputContentSha256,
        decodedRgbaSha256: verification.decodedRgbaSha256,
        widthPixels: EXPECTED_WIDTH,
        heightPixels: EXPECTED_HEIGHT,
        decodedChannelCount: 4,
        sourcePngHadAlphaChannel: false,
        transparentPixelCount: 0,
        semiTransparentPixelCount: 0,
        opaquePixelCount: EXPECTED_PIXEL_COUNT,
        alphaMeasurementReportDigestSha256:
          alphaReport.reportDigestSha256,
        alphaFindingCodes: alphaReport.findingCodes,
        alphaDisposition:
          'opaque_generated_source_requires_segmentation_matting_decontamination_and_alpha_qa',
      },
      costLineage: {
        costComponentId:
          'shared_controlled_illustration_gpu_host',
        oneObservedOutputBelongsToOneGpuAttempt: true,
        fiveGpuCapabilitiesShareAttemptLifetime: true,
        auraFaceCpuMeasurementExcluded: true,
        canonicalWorkerResourceCostEvidenceRequired: true,
        completedFailedOrUnknownOutcomeNotInferred: true,
        actualCostAmountIncluded: false,
        customerPriceOrCreditIncluded: false,
        serviceFeeIncluded: false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      requestReceiptRevalidated: true,
      exactRequestAndOutputLineageMatched: true,
      exactPrivateOutputBytesRereadAndDecoded: true,
      alphaMeasurementRecomputedFromDecodedBytes: true,
      outputIsOpaqueSourceOnly: true,
      transparentComponentCreated: false,
      artifactCommitted: false,
      actualAttemptCostEvidenceVerified: false,
      selectedSceneCreated: false,
      containsOutputBytesPathUrlCredentialPromptAliasOrCommand:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertObservationSafe(draft)
  return deepFreeze({
    ...draft,
    observationDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameControlledSdxlGpuOutputObservation(
  value: unknown,
): value is LivingFrameControlledSdxlGpuOutputObservation {
  try {
    const parsed = observationSchema.safeParse(value)
    if (!parsed.success) return false
    const {
      observationDigestSha256,
      ...draft
    } = parsed.data
    assertObservationSafe(draft)
    return digest(draft) === observationDigestSha256
  } catch {
    return false
  }
}

function assertInput(
  value: unknown,
): asserts value is {
  readonly requestReceipt:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt
  readonly outputReader:
    LivingFrameControlledSdxlGpuPrivateOutputReader
  readonly outputConsumer:
    LivingFrameControlledSdxlGpuVerifiedOutputConsumer
} {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'requestReceipt',
      'outputReader',
      'outputConsumer',
    ])
    || !verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      value.requestReceipt,
    )
  ) throw invalid('input_invalid', '$')
}

function requireReader(
  reader: LivingFrameControlledSdxlGpuPrivateOutputReader,
  request: LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
): LivingFrameControlledSdxlGpuPrivateOutputReader {
  if (
    reader
    && outputReaders.has(reader)
    && consumedOutputReaders.has(reader)
  ) throw invalid('reader_reused', '$.outputReader')
  if (
    !reader
    || !outputReaders.has(reader)
    || consumedOutputReaders.has(reader)
    || reader.readerVersion
      !==
        'living-frame-controlled-sdxl-gpu-private-output-reader-v1'
    || reader.readerClass
      !==
        'process_bound_server_owned_controlled_comfyui_output_reader'
    || reader.callerBytesAccepted !== false
    || reader.callerPathAccepted !== false
    || reader.callerUrlAccepted !== false
    || reader.credentialsIncluded !== false
    || reader.workerCompletionAuthority !== false
    || reader.actualCostAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.outputReader')
  const expectedBindingDraft = {
    requestReceiptId: request.requestReceiptId,
    requestReceiptDigestSha256:
      request.requestReceiptDigestSha256,
    privateWireRequestDigestSha256:
      request.requestSummary.privateWireRequestDigestSha256,
    outputFrameExpectationDigestSha256:
      request.sourceBindings.outputFrameExpectationDigestSha256,
  }
  if (
    reader.binding.requestReceiptId
      !== expectedBindingDraft.requestReceiptId
    || reader.binding.requestReceiptDigestSha256
      !== expectedBindingDraft.requestReceiptDigestSha256
    || reader.binding.privateWireRequestDigestSha256
      !== expectedBindingDraft.privateWireRequestDigestSha256
    || reader.binding.outputFrameExpectationDigestSha256
      !== expectedBindingDraft.outputFrameExpectationDigestSha256
    || reader.binding.readerBindingDigestSha256
      !== digest(expectedBindingDraft)
  ) throw invalid('reader_lineage_invalid', '$.outputReader.binding')
  return reader
}

function requireConsumer(
  consumer:
    LivingFrameControlledSdxlGpuVerifiedOutputConsumer,
): LivingFrameControlledSdxlGpuVerifiedOutputConsumer {
  if (
    consumer
    && outputConsumers.has(consumer)
    && consumedOutputConsumers.has(consumer)
  ) throw invalid('consumer_reused', '$.outputConsumer')
  if (
    !consumer
    || !outputConsumers.has(consumer)
    || consumedOutputConsumers.has(consumer)
    || consumer.consumerVersion
      !==
        'living-frame-controlled-sdxl-gpu-verified-output-consumer-v1'
    || consumer.consumerClass
      !==
        'process_bound_server_owned_verified_controlled_comfyui_output_consumer'
    || consumer.acceptsOnlyVerifiedOpaqueOutput !== true
    || consumer.browserShareable !== false
    || consumer.artifactCommitAuthority !== false
    || consumer.segmentationOrMattingAuthority !== false
    || consumer.productionReady !== false
  ) throw invalid('consumer_invalid', '$.outputConsumer')
  return consumer
}

function assertOutputPacket(
  value: unknown,
  request: LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
): LivingFrameControlledSdxlGpuPrivateOutputPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'evidenceClass',
      'requestReceiptId',
      'requestReceiptDigestSha256',
      'privateWireRequestDigestSha256',
      'outputArtifactId',
      'outputContentType',
      'outputByteLength',
      'outputContentSha256',
      'outputPng',
      'callerBytesPathUrlOrCredentialAccepted',
      'workerCompletionAuthority',
      'actualCostAuthority',
      'productionReady',
    ])
    || value.packetClass
      !==
        'server_owned_controlled_comfyui_png_output_packet_v1'
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
    || !Buffer.isBuffer(value.outputPng)
    || value.outputPng.buffer instanceof SharedArrayBuffer
    || value.callerBytesPathUrlOrCredentialAccepted !== false
    || value.workerCompletionAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
  ) throw invalid('output_packet_invalid', '$.outputPacket')
  if (
    value.requestReceiptId !== request.requestReceiptId
    || value.requestReceiptDigestSha256
      !== request.requestReceiptDigestSha256
    || value.privateWireRequestDigestSha256
      !== request.requestSummary.privateWireRequestDigestSha256
  ) throw invalid('output_lineage_invalid', '$.outputPacket')
  return value as unknown as
    LivingFrameControlledSdxlGpuPrivateOutputPacket
}

function decodeOpaquePng(
  outputPng: Buffer,
): {
  readonly rgba: Buffer
  readonly width: number
  readonly height: number
} {
  try {
    const decoded = decodeApprovedOpaqueRgbPng(outputPng)
    return {
      rgba: decoded.rgba,
      width: decoded.width,
      height: decoded.height,
    }
  } catch (error) {
    if (
      error instanceof
        LivingFrameControlledSdxlGpuOutputObservationError
    ) throw error
    throw invalid('output_decode_failed', '$.outputPacket.outputPng')
  }
}

function decodeApprovedOpaqueRgbPng(
  bytes: Buffer,
): {
  readonly rgba: Buffer
  readonly width: number
  readonly height: number
} {
  if (
    bytes.byteLength < 8
    || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)
  ) throw invalid(
    'output_format_invalid',
    '$.outputPacket.outputPng',
  )
  let offset = 8
  let width = 0
  let height = 0
  let sawIhdr = false
  let sawIend = false
  const idat: Buffer[] = []
  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset)
    if (
      length > MAX_OUTPUT_BYTES
      || offset + 12 + length > bytes.byteLength
    ) throw invalid(
      'output_decode_failed',
      '$.outputPacket.outputPng',
    )
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    const expectedCrc = bytes.readUInt32BE(offset + 8 + length)
    if (
      pngCrc32(bytes.subarray(offset + 4, offset + 8 + length))
        !== expectedCrc
    ) throw invalid(
      'output_decode_failed',
      '$.outputPacket.outputPng',
    )
    if (type === 'IHDR') {
      if (sawIhdr || length !== 13 || offset !== 8) {
        throw invalid(
          'output_decode_failed',
          '$.outputPacket.outputPng',
        )
      }
      sawIhdr = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (
        width !== EXPECTED_WIDTH
        || height !== EXPECTED_HEIGHT
      ) throw invalid(
        'output_dimension_invalid',
        '$.outputPacket.outputPng',
      )
      const bitDepth = data[8]
      const colorType = data[9]
      const compression = data[10]
      const filter = data[11]
      const interlace = data[12]
      if (colorType === 4 || colorType === 6 || typeHasTransparency(
        colorType,
      )) throw invalid(
        'output_alpha_policy_invalid',
        '$.outputPacket.outputPng',
      )
      if (
        bitDepth !== 8
        || colorType !== 2
        || compression !== 0
        || filter !== 0
        || interlace !== 0
      ) throw invalid(
        'output_format_invalid',
        '$.outputPacket.outputPng',
      )
    } else if (type === 'IDAT') {
      if (!sawIhdr || sawIend) {
        throw invalid(
          'output_decode_failed',
          '$.outputPacket.outputPng',
        )
      }
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (!sawIhdr || sawIend || length !== 0) {
        throw invalid(
          'output_decode_failed',
          '$.outputPacket.outputPng',
        )
      }
      sawIend = true
      offset += 12
      break
    } else if (type === 'tRNS') {
      throw invalid(
        'output_alpha_policy_invalid',
        '$.outputPacket.outputPng',
      )
    } else if (isCriticalPngChunk(type)) {
      throw invalid(
        'output_format_invalid',
        '$.outputPacket.outputPng',
      )
    }
    offset += 12 + length
  }
  if (
    !sawIhdr
    || !sawIend
    || idat.length === 0
    || offset !== bytes.byteLength
  ) throw invalid(
    'output_decode_failed',
    '$.outputPacket.outputPng',
  )
  const bytesPerPixel = 3
  const rowByteLength = width * bytesPerPixel
  const expectedInflatedLength = (rowByteLength + 1) * height
  let inflated: Buffer
  try {
    inflated = inflateSync(Buffer.concat(idat), {
      maxOutputLength: expectedInflatedLength,
    })
  } catch {
    throw invalid(
      'output_decode_failed',
      '$.outputPacket.outputPng',
    )
  }
  if (inflated.byteLength !== expectedInflatedLength) {
    throw invalid(
      'output_decode_failed',
      '$.outputPacket.outputPng',
    )
  }
  const rgb = Buffer.alloc(rowByteLength * height)
  let sourceOffset = 0
  for (let row = 0; row < height; row += 1) {
    const filterType = inflated[sourceOffset]
    sourceOffset += 1
    if (filterType === undefined || filterType > 4) {
      throw invalid(
        'output_decode_failed',
        '$.outputPacket.outputPng',
      )
    }
    const rowOffset = row * rowByteLength
    for (let column = 0; column < rowByteLength; column += 1) {
      const raw = inflated[sourceOffset + column]
      if (raw === undefined) {
        throw invalid(
          'output_decode_failed',
          '$.outputPacket.outputPng',
        )
      }
      const left = column >= bytesPerPixel
        ? rgb[rowOffset + column - bytesPerPixel] ?? 0
        : 0
      const up = row > 0
        ? rgb[rowOffset + column - rowByteLength] ?? 0
        : 0
      const upperLeft = row > 0 && column >= bytesPerPixel
        ? rgb[
          rowOffset + column - rowByteLength - bytesPerPixel
        ] ?? 0
        : 0
      rgb[rowOffset + column] = (
        raw + unfilterPngByte(
          filterType,
          left,
          up,
          upperLeft,
        )
      ) & 0xff
    }
    sourceOffset += rowByteLength
  }
  const rgba = Buffer.alloc(EXPECTED_PIXEL_COUNT * 4)
  for (
    let source = 0, target = 0;
    source < rgb.byteLength;
    source += 3, target += 4
  ) {
    rgba[target] = rgb[source]!
    rgba[target + 1] = rgb[source + 1]!
    rgba[target + 2] = rgb[source + 2]!
    rgba[target + 3] = 255
  }
  return { rgba, width, height }
}

function typeHasTransparency(colorType: number): boolean {
  return colorType < 0 || colorType > 6
}

function isCriticalPngChunk(type: string): boolean {
  return type.length !== 4
    || (
      type.charCodeAt(0) >= 65
      && type.charCodeAt(0) <= 90
    )
}

function unfilterPngByte(
  filterType: number,
  left: number,
  up: number,
  upperLeft: number,
): number {
  if (filterType === 0) return 0
  if (filterType === 1) return left
  if (filterType === 2) return up
  if (filterType === 3) return Math.floor((left + up) / 2)
  return paethPredictor(left, up, upperLeft)
}

function paethPredictor(
  left: number,
  up: number,
  upperLeft: number,
): number {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left
  }
  return upDistance <= upperLeftDistance ? up : upperLeft
}

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }
    return value >>> 0
  },
)

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value = PNG_CRC32_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function assertOpaqueAlphaMeasurement(
  report: LivingFrameAlphaMeasurementReport,
): void {
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(report)
    || report.raster.width !== EXPECTED_WIDTH
    || report.raster.height !== EXPECTED_HEIGHT
    || report.raster.alphaExpectation !== 'opaque_plate_expected'
    || report.distribution.pixelCount !== EXPECTED_PIXEL_COUNT
    || report.distribution.transparentPixelCount !== 0
    || report.distribution.semiTransparentPixelCount !== 0
    || report.distribution.opaquePixelCount !== EXPECTED_PIXEL_COUNT
    || !report.findingCodes.includes(
      'alpha_channel_fully_opaque',
    )
  ) throw invalid(
    'alpha_measurement_invalid',
    '$.alphaMeasurement',
  )
}

function assertObservationSafe(
  draft:
    LivingFrameControlledSdxlGpuOutputObservationDraft,
): void {
  if (!observationDraftSchema.safeParse(draft).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  if (
    canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || !draft.verifiedOutput.alphaFindingCodes.includes(
      'alpha_channel_fully_opaque',
    )
    || draft.outputIsOpaqueSourceOnly !== true
    || draft.transparentComponentCreated !== false
    || draft.artifactCommitted !== false
    || draft.actualAttemptCostEvidenceVerified !== false
    || draft.selectedSceneCreated !== false
    || draft.productionReady !== false
    || draft.containsOutputBytesPathUrlCredentialPromptAliasOrCommand
      !== false
    || draft.containsPriceCreditServiceFeeReservationWalletOrLedgerData
      !== false
    || draft.subjectSpecificRouting !== false
    || containsUnsafeReceiptKey(draft)
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function containsUnsafeReceiptKey(value: unknown): boolean {
  const denied = new Set([
    'outputPng',
    'decodedRgba',
    'bytes',
    'path',
    'url',
    'credential',
    'secret',
    'prompt',
    'privateAlias',
    'command',
    'actualCostMicros',
    'price',
    'credits',
    'serviceFeeAmount',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walkEntries(value, (key, child) => {
    if (denied.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) unsafe = true
  })
  return unsafe
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return canonicalJson(Object.keys(value).sort())
    === canonicalJson([...expected].sort())
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function walkEntries(
  value: unknown,
  visitor: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walkEntries(child, visitor))
    return
  }
  if (!isRecord(value)) return
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child)
    walkEntries(child, visitor)
  })
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function digestBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
    && !Buffer.isBuffer(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}

function invalid(
  code: LivingFrameControlledSdxlGpuOutputObservationIssueCode,
  path: string,
): LivingFrameControlledSdxlGpuOutputObservationError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame GPU output issue code.')
  return new LivingFrameControlledSdxlGpuOutputObservationError([
    { code, path },
  ])
}
