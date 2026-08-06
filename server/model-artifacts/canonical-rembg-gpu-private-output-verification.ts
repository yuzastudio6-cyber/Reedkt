import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalRembgGpuRuntimeRequestCandidate,
} from './canonical-rembg-gpu-runtime-request'
import {
  assertCanonicalRembgGpuRuntimeResultCandidate,
  assertCanonicalRembgGpuRuntimeWireResponse,
} from './canonical-rembg-gpu-runtime-result'
import {
  CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_READER_VERSION,
  CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_VERIFICATION_VERSION,
  CANONICAL_REMBG_GPU_VERIFIED_OUTPUT_CONSUMER_VERSION,
  type CanonicalRembgGpuPrivateOutputFiles,
  type CanonicalRembgGpuPrivateOutputReader,
  type CanonicalRembgGpuPrivateOutputReaderInput,
  type CanonicalRembgGpuPrivateOutputVerification,
  type CanonicalRembgGpuPrivateOutputVerificationInput,
  type CanonicalRembgGpuVerifiedOutputConsumer,
} from './canonical-rembg-gpu-private-output-verification-types'
import {
  verifyCanonicalRembgGray8MaskPng,
} from './canonical-rembg-mask-png-verifier'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const MAXIMUM_MASK_BYTES = 16_777_216
const MAXIMUM_EVIDENCE_BYTES = 65_536
const MAXIMUM_SOURCE_PIXELS = 16_777_216
const REQUIRED_QA_GATES = [
  'mask_edge_quality',
  'mask_subject_coverage',
] as const
const OUTPUT_FILE_NAMES = [
  'mask.png',
  'mask-analysis.json',
  'mask-qa-measurement.json',
] as const

const digestSchema = z.string().regex(DIGEST_PATTERN)
const analysisSchema = z.object({
  schemaVersion: z.literal('rembg-u2netp-mask-analysis-v1'),
  sourceArtifactSha256: digestSchema,
  sourceDecodedRgbaSha256: digestSchema,
  maskSha256: digestSchema,
  width: z.number().int().min(1).max(4_096),
  height: z.number().int().min(1).max(4_096),
  minimumMaskValue: z.number().int().min(0).max(254),
  maximumMaskValue: z.number().int().min(1).max(255),
  uniqueMaskValueCount: z.number().int().min(2).max(256),
  transparentPixelCount:
    z.number().int().min(0).max(MAXIMUM_SOURCE_PIXELS),
  partialPixelCount:
    z.number().int().min(1).max(MAXIMUM_SOURCE_PIXELS),
  opaquePixelCount:
    z.number().int().min(0).max(MAXIMUM_SOURCE_PIXELS),
  confidenceThreshold: z.literal(0.5),
  thresholdMaskValue: z.literal(128),
  foregroundPixelCountAtThreshold:
    z.number().int().min(0).max(MAXIMUM_SOURCE_PIXELS),
  maskVariationObserved: z.literal(true),
}).strict()
const qaMeasurementSchema = z.object({
  schemaVersion: z.literal('rembg-mask-qa-measurement-v1'),
  analysisSha256: digestSchema,
  maskSha256: digestSchema,
  requiredQaGates: z.tuple([
    z.literal('mask_edge_quality'),
    z.literal('mask_subject_coverage'),
  ]),
  findingCodes: z.array(
    z.string().regex(/^[a-z0-9][a-z0-9_]{2,95}$/u),
  ).length(0),
  measurementOnly: z.literal(true),
  qaPassAuthority: z.literal(false),
}).strict()

const outputReaders = new WeakSet<object>()
const consumedOutputReaders = new WeakSet<object>()
const outputConsumers = new WeakSet<object>()
const consumedOutputConsumers = new WeakSet<object>()

const BLOCKERS = [
  'canonical_cloud_dispatch_completion_receipt_required',
  'canonical_cloud_dispatch_worker_receipt_required',
  'canonical_gpu_runtime_image_identity_required',
  'canonical_mask_artifact_commit_required',
  'canonical_mask_edge_quality_qa_required',
  'canonical_mask_subject_coverage_qa_required',
  'canonical_mask_artifact_reconciliation_required',
  'live_service_identity_and_iam_required',
  'official_cloud_gpu_rate_and_attempt_cost_evidence_required',
] as const

export function createCanonicalRembgGpuPrivateOutputReader(
  input: CanonicalRembgGpuPrivateOutputReaderInput,
): CanonicalRembgGpuPrivateOutputReader {
  if (typeof input.readServerOwnedOutputs !== 'function') {
    throw invalid('rembg_private_output_reader_function_required')
  }
  if (
    input.evidenceClass !== 'controlled_source_fixture'
    && input.evidenceClass
      !== 'fixed_gpu_subprocess_unqualified'
  ) {
    throw invalid('rembg_private_output_reader_evidence_invalid')
  }
  const response = assertCanonicalRembgGpuRuntimeWireResponse({
    value: input.runtimeWireResponse,
    request: input.runtimeRequest,
  })
  const bindingDraft = {
    admissionDigestSha256: response.admissionDigestSha256,
    requestBindingSha256: response.requestBindingSha256,
    dispatchIntentId: response.dispatchIntentId,
    responseDigestSha256: sha256AuthorityValue(response),
    maskSha256: response.outputs[0].contentSha256,
    maskAnalysisSha256:
      response.processEvidence[0].contentSha256,
    maskQaMeasurementSha256:
      response.processEvidence[1].contentSha256,
  }
  const reader = Object.freeze<CanonicalRembgGpuPrivateOutputReader>({
    readerVersion:
      CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_READER_VERSION,
    readerClass:
      'process_bound_server_owned_rembg_private_output_reader',
    evidenceClass: input.evidenceClass,
    binding: Object.freeze({
      ...bindingDraft,
      readerBindingDigestSha256:
        sha256AuthorityValue(bindingDraft),
    }),
    fileNames: Object.freeze([...OUTPUT_FILE_NAMES]),
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    credentialsIncluded: false,
    productionReady: false,
    readServerOwnedOutputs:
      input.readServerOwnedOutputs.bind(undefined),
  })
  outputReaders.add(reader)
  return reader
}

export function createCanonicalRembgGpuVerifiedOutputConsumer(
  consume: (
    payload: Parameters<
      CanonicalRembgGpuVerifiedOutputConsumer['consume']
    >[0],
  ) => Promise<void>,
): CanonicalRembgGpuVerifiedOutputConsumer {
  if (typeof consume !== 'function') {
    throw invalid('rembg_verified_output_consumer_function_required')
  }
  const consumer =
    Object.freeze<CanonicalRembgGpuVerifiedOutputConsumer>({
      consumerVersion:
        CANONICAL_REMBG_GPU_VERIFIED_OUTPUT_CONSUMER_VERSION,
      consumerClass:
        'process_bound_server_owned_verified_rembg_output_consumer',
      acceptsOnlyVerifiedOutput: true,
      browserShareable: false,
      productionReady: false,
      consume: consume.bind(undefined),
    })
  outputConsumers.add(consumer)
  return consumer
}

export async function verifyCanonicalRembgGpuPrivateOutputs(
  input: CanonicalRembgGpuPrivateOutputVerificationInput,
): Promise<CanonicalRembgGpuPrivateOutputVerification> {
  const resultCandidate =
    await assertCanonicalRembgGpuRuntimeResultCandidate(input)
  const requestCandidate =
    await assertCanonicalRembgGpuRuntimeRequestCandidate({
      ...input,
      candidate: input.runtimeRequestCandidate,
    })
  const reader = assertOutputReader(input.outputReader)
  const consumer = assertOutputConsumer(input.outputConsumer)
  assertReaderLineage({
    reader,
    resultCandidate,
  })

  consumedOutputReaders.add(reader)
  let rawFiles: CanonicalRembgGpuPrivateOutputFiles
  try {
    rawFiles = await reader.readServerOwnedOutputs()
  } catch {
    throw blocked('rembg_private_output_reader_failed')
  }
  const files = copyExactOutputFiles(rawFiles)
  const maskReceipt = resultCandidate.outputCandidates[0]
  const analysisReceipt =
    resultCandidate.processEvidenceCandidates[0]
  const qaReceipt =
    resultCandidate.processEvidenceCandidates[1]
  assertFileMatchesReceipt(
    files.maskPng,
    maskReceipt.byteLength,
    maskReceipt.contentSha256,
    MAXIMUM_MASK_BYTES,
    'mask',
  )
  assertFileMatchesReceipt(
    files.maskAnalysisJson,
    analysisReceipt.byteLength,
    analysisReceipt.contentSha256,
    MAXIMUM_EVIDENCE_BYTES,
    'analysis',
  )
  assertFileMatchesReceipt(
    files.maskQaMeasurementJson,
    qaReceipt.byteLength,
    qaReceipt.contentSha256,
    MAXIMUM_EVIDENCE_BYTES,
    'qa_measurement',
  )

  const maskVerification = verifyCanonicalRembgGray8MaskPng(
    files.maskPng,
    {
      expectedWidth: maskReceipt.width,
      expectedHeight: maskReceipt.height,
      maximumPixelCount: MAXIMUM_SOURCE_PIXELS,
    },
  )
  if (
    maskVerification.minimumMaskValue
      !== maskReceipt.minimumMaskValue
    || maskVerification.maximumMaskValue
      !== maskReceipt.maximumMaskValue
    || maskVerification.uniqueMaskValueCount
      !== maskReceipt.uniqueMaskValueCount
    || maskVerification.transparentPixelCount
      !== maskReceipt.transparentPixelCount
    || maskVerification.partialPixelCount
      !== maskReceipt.partialPixelCount
    || maskVerification.opaquePixelCount
      !== maskReceipt.opaquePixelCount
  ) {
    throw blocked('rembg_private_output_mask_metrics_mismatch')
  }

  const analysis = parseStableJson({
    bytes: files.maskAnalysisJson,
    schema: analysisSchema,
    code: 'rembg_private_output_analysis_invalid',
  })
  const requestSource = requestCandidate.runnerRequest.source
  if (
    analysis.sourceArtifactSha256
      !== requestSource.contentSha256
    || analysis.sourceDecodedRgbaSha256
      !== requestSource.decodedRgbaSha256
    || analysis.maskSha256 !== maskReceipt.contentSha256
    || analysis.width !== maskVerification.width
    || analysis.height !== maskVerification.height
    || analysis.minimumMaskValue
      !== maskVerification.minimumMaskValue
    || analysis.maximumMaskValue
      !== maskVerification.maximumMaskValue
    || analysis.uniqueMaskValueCount
      !== maskVerification.uniqueMaskValueCount
    || analysis.transparentPixelCount
      !== maskVerification.transparentPixelCount
    || analysis.partialPixelCount
      !== maskVerification.partialPixelCount
    || analysis.opaquePixelCount
      !== maskVerification.opaquePixelCount
    || analysis.thresholdMaskValue
      !== maskVerification.thresholdMaskValue
    || analysis.foregroundPixelCountAtThreshold
      !== maskVerification.foregroundPixelCountAtThreshold
  ) {
    throw blocked(
      'rembg_private_output_analysis_lineage_mismatch',
    )
  }

  const qaMeasurement = parseStableJson({
    bytes: files.maskQaMeasurementJson,
    schema: qaMeasurementSchema,
    code: 'rembg_private_output_qa_measurement_invalid',
  })
  if (
    qaMeasurement.analysisSha256
      !== analysisReceipt.contentSha256
    || qaMeasurement.maskSha256
      !== maskReceipt.contentSha256
  ) {
    throw blocked(
      'rembg_private_output_qa_measurement_lineage_mismatch',
    )
  }

  const verificationPayload = Object.freeze({
    resultCandidateDigestSha256:
      resultCandidate.resultCandidateDigestSha256,
    responseDigestSha256:
      resultCandidate.runtimeWireReceipt.responseDigestSha256,
    requestBindingSha256:
      resultCandidate.identity.runtimeRequestBindingSha256,
    dispatchIntentId: resultCandidate.identity.dispatchIntentId,
    maskSha256: maskReceipt.contentSha256,
    decodedMaskSha256: maskVerification.decodedMaskSha256,
    maskAnalysisSha256: analysisReceipt.contentSha256,
    maskQaMeasurementSha256: qaReceipt.contentSha256,
    width: maskVerification.width,
    height: maskVerification.height,
    foregroundPixelCountAtThreshold:
      maskVerification.foregroundPixelCountAtThreshold,
  })
  consumedOutputConsumers.add(consumer)
  try {
    await consumer.consume({
      maskPng: Buffer.from(files.maskPng),
      maskAnalysisJson: Buffer.from(files.maskAnalysisJson),
      maskQaMeasurementJson:
        Buffer.from(files.maskQaMeasurementJson),
      verification: verificationPayload,
    })
  } catch {
    throw blocked('rembg_verified_output_consumer_failed')
  }

  const verifiedFiles = [
    {
      canonicalOrder: 0 as const,
      fileName: 'mask.png' as const,
      fileKind: 'mask_image' as const,
      byteLength: files.maskPng.byteLength,
      contentSha256: maskReceipt.contentSha256,
    },
    {
      canonicalOrder: 1 as const,
      fileName: 'mask-analysis.json' as const,
      fileKind: 'mask_analysis_receipt' as const,
      byteLength: files.maskAnalysisJson.byteLength,
      contentSha256: analysisReceipt.contentSha256,
    },
    {
      canonicalOrder: 2 as const,
      fileName: 'mask-qa-measurement.json' as const,
      fileKind: 'mask_qa_measurement_receipt' as const,
      byteLength: files.maskQaMeasurementJson.byteLength,
      contentSha256: qaReceipt.contentSha256,
    },
  ] as const
  const draft = {
    verificationVersion:
      CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_VERIFICATION_VERSION,
    verificationClass:
      'private_bytes_reread_and_recomputed_non_authoritative_output_verification' as const,
    identity: {
      resultCandidateDigestSha256:
        resultCandidate.resultCandidateDigestSha256,
      runtimeRequestCandidateDigestSha256:
        resultCandidate.identity
          .runtimeRequestCandidateDigestSha256,
      admissionDigestSha256:
        resultCandidate.identity.admissionDigestSha256,
      requestBindingSha256:
        resultCandidate.identity.runtimeRequestBindingSha256,
      dispatchIntentId:
        resultCandidate.identity.dispatchIntentId,
      responseDigestSha256:
        resultCandidate.runtimeWireReceipt.responseDigestSha256,
      sourceFrameArtifactBindingDigestSha256:
        resultCandidate.identity
          .sourceFrameArtifactBindingDigestSha256,
    },
    outputReader: {
      evidenceClass: reader.evidenceClass,
      readerBindingDigestSha256:
        reader.binding.readerBindingDigestSha256,
      oneShotReaderConsumed: true as const,
      oneShotConsumerConsumed: true as const,
      verifiedBytesDeliveredOutOfBand: true as const,
    },
    verifiedFiles,
    maskVerification: {
      encodingProfile: 'gray8_mask_png_v1' as const,
      ...maskVerification,
      maskVariationObserved: true as const,
      pngChunkCrcsVerified: true as const,
      pngInflateAndFiltersVerified: true as const,
    },
    processEvidenceVerification: {
      analysisSchemaVersion:
        'rembg-u2netp-mask-analysis-v1' as const,
      qaMeasurementSchemaVersion:
        'rembg-mask-qa-measurement-v1' as const,
      stableJsonByteEncodingVerified: true as const,
      exactSourceArtifactLineageMatched: true as const,
      exactMaskLineageMatched: true as const,
      requiredQaGates: REQUIRED_QA_GATES,
      findingCodes: [] as const,
      measurementOnly: true as const,
      qaPassAuthority: false as const,
    },
    summary: {
      exactRuntimeResultCandidateReread: true as const,
      exactPrivateOutputFileSetReread: true as const,
      exactOutputReceiptDigestsMatched: true as const,
      exactMaskPixelsRecomputed: true as const,
      exactMaskMetricsMatched: true as const,
      exactProcessEvidenceBytesRecomputed: true as const,
      sourceDimensionsPreserved: true as const,
      outputBytesSerialized: false as const,
      outputPathsSerialized: false as const,
      callerUrlsIncluded: false as const,
      credentialsIncluded: false as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      candidateOnly: true as const,
      privateOutputRereadOnly: true as const,
      controlledFixtureOnly:
        reader.evidenceClass === 'controlled_source_fixture',
      outputBytesRereadVerified: true as const,
      maskPngIntegrityVerified: true as const,
      processEvidenceBytesRereadVerified: true as const,
      canonicalWorkerReceiptVerified: false as const,
      canonicalCompletionReceiptVerified: false as const,
      actualCloudRunExecutionVerified: false as const,
      runtimeImageIdentityVerified: false as const,
      liveServiceIdentityAndIamVerified: false as const,
      outputArtifactCommitAuthority: false as const,
      maskEdgeQualityQaAuthority: false as const,
      maskSubjectCoverageQaAuthority: false as const,
      qaPassAuthority: false as const,
      attemptInternalCostEvidenceVerified: false as const,
      cloudDispatchAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return deepFreeze({
    ...draft,
    verificationDigestSha256: sha256AuthorityValue(draft),
  })
}

function assertOutputReader(
  reader: CanonicalRembgGpuPrivateOutputReader,
): CanonicalRembgGpuPrivateOutputReader {
  if (
    !reader
    || typeof reader !== 'object'
    || !outputReaders.has(reader)
    || consumedOutputReaders.has(reader)
    || reader.readerVersion
      !== CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_READER_VERSION
    || reader.readerClass
      !== 'process_bound_server_owned_rembg_private_output_reader'
    || stableAuthorityStringify(reader.fileNames)
      !== stableAuthorityStringify(OUTPUT_FILE_NAMES)
    || reader.callerBytesAccepted
    || reader.callerPathAccepted
    || reader.callerUrlAccepted
    || reader.credentialsIncluded
    || reader.productionReady
  ) {
    throw blocked('rembg_private_output_reader_not_admitted')
  }
  return reader
}

function assertOutputConsumer(
  consumer: CanonicalRembgGpuVerifiedOutputConsumer,
): CanonicalRembgGpuVerifiedOutputConsumer {
  if (
    !consumer
    || typeof consumer !== 'object'
    || !outputConsumers.has(consumer)
    || consumedOutputConsumers.has(consumer)
    || consumer.consumerVersion
      !== CANONICAL_REMBG_GPU_VERIFIED_OUTPUT_CONSUMER_VERSION
    || consumer.consumerClass
      !== 'process_bound_server_owned_verified_rembg_output_consumer'
    || !consumer.acceptsOnlyVerifiedOutput
    || consumer.browserShareable
    || consumer.productionReady
  ) {
    throw blocked('rembg_verified_output_consumer_not_admitted')
  }
  return consumer
}

function assertReaderLineage(input: {
  reader: CanonicalRembgGpuPrivateOutputReader
  resultCandidate:
    Awaited<ReturnType<
      typeof assertCanonicalRembgGpuRuntimeResultCandidate
    >>
}): void {
  const reader = input.reader
  const result = input.resultCandidate
  const expectedBindingDraft = {
    admissionDigestSha256:
      result.identity.admissionDigestSha256,
    requestBindingSha256:
      result.identity.runtimeRequestBindingSha256,
    dispatchIntentId: result.identity.dispatchIntentId,
    responseDigestSha256:
      result.runtimeWireReceipt.responseDigestSha256,
    maskSha256:
      result.outputCandidates[0].contentSha256,
    maskAnalysisSha256:
      result.processEvidenceCandidates[0].contentSha256,
    maskQaMeasurementSha256:
      result.processEvidenceCandidates[1].contentSha256,
  }
  if (
    stableAuthorityStringify(reader.binding)
      !== stableAuthorityStringify({
        ...expectedBindingDraft,
        readerBindingDigestSha256:
          sha256AuthorityValue(expectedBindingDraft),
      })
  ) {
    throw blocked('rembg_private_output_reader_lineage_mismatch')
  }
}

function copyExactOutputFiles(
  value: CanonicalRembgGpuPrivateOutputFiles,
): CanonicalRembgGpuPrivateOutputFiles {
  if (
    !value
    || typeof value !== 'object'
    || stableAuthorityStringify(Object.keys(value).sort())
      !== stableAuthorityStringify([
        'maskAnalysisJson',
        'maskPng',
        'maskQaMeasurementJson',
      ])
    || !Buffer.isBuffer(value.maskPng)
    || !Buffer.isBuffer(value.maskAnalysisJson)
    || !Buffer.isBuffer(value.maskQaMeasurementJson)
  ) {
    throw invalid('rembg_private_output_file_set_invalid')
  }
  return {
    maskPng: Buffer.from(value.maskPng),
    maskAnalysisJson: Buffer.from(value.maskAnalysisJson),
    maskQaMeasurementJson:
      Buffer.from(value.maskQaMeasurementJson),
  }
}

function assertFileMatchesReceipt(
  bytes: Buffer,
  expectedByteLength: number,
  expectedSha256: string,
  maximumByteLength: number,
  label: string,
): void {
  if (
    bytes.byteLength < 2
    || bytes.byteLength > maximumByteLength
    || bytes.byteLength !== expectedByteLength
    || sha256Bytes(bytes) !== expectedSha256
  ) {
    throw blocked(`rembg_private_output_${label}_receipt_mismatch`)
  }
}

function parseStableJson<T>(input: {
  bytes: Buffer
  schema: z.ZodType<T>
  code: string
}): T {
  let raw: unknown
  try {
    raw = JSON.parse(input.bytes.toString('utf8'))
  } catch {
    throw invalid(input.code)
  }
  const parsed = input.schema.safeParse(raw)
  if (!parsed.success) {
    throw invalid(input.code)
  }
  const stableBytes = Buffer.from(
    stableAuthorityStringify(parsed.data),
    'utf8',
  )
  if (!input.bytes.equals(stableBytes)) {
    throw invalid(input.code)
  }
  return parsed.data
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 409)
}
