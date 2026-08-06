import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2,
  canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema,
  type CanonicalTrackAllSam31L4TaskQaWorkerRequestV2,
  type CanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_QUALIFICATION_RECEIPT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-private-qualification-receipt-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4' as const
const IMAGE_DIGEST =
  'sha256:fb9ced131438f50c7273f11fd47febfb2b7d440e1ae3d18f78151d33ce4e83de' as const
const NETWORK = 'weeditpro-gpu-private' as const
const SUBNET = 'weeditpro-gpu-private-us-central1' as const
const NETWORK_TAG = 'weeditpro-gpu-private-no-nat' as const
const MASK_WIDTH = 640 as const
const MASK_HEIGHT = 360 as const
const FRAME_COUNT = 8 as const
const SUBJECT_COUNT = 2 as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const supplyEvidenceSchema = z.object({
  imageBuildAuthorityRef: evidenceRefSchema,
  imageBuildSubmissionRef: evidenceRefSchema,
  imageBuildTerminalRef: evidenceRefSchema,
  supplyChainAdmissionRef: evidenceRefSchema,
  supplyChainSubmissionRef: evidenceRefSchema,
  supplyChainTerminalRef: evidenceRefSchema,
  sbomRef: evidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  signatureVerificationRef: evidenceRefSchema,
  slsaProvenanceRef: evidenceRefSchema,
  securityReviewRef: evidenceRefSchema,
  exactSupplyChainRereadBeforeQualification: z.literal(true),
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_QUALIFICATION_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_private_qualification_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_l4_cuda_execution_and_terminal_reread',
  ),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  disposition: z.literal('l4_task_qa_qualified_rate_blocked'),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  routeId: z.literal('l4_standard_primary'),
  supplyChainEvidence: supplyEvidenceSchema,
  deployment: z.object({
    projectId: z.literal(PROJECT_ID),
    region: z.literal(REGION),
    jobResource: z.literal(JOB_RESOURCE),
    jobUid: safeId,
    immutableImageDigest: z.literal(IMAGE_DIGEST),
    accelerator: z.literal('nvidia_l4'),
    allocatedGpuCount: z.literal(1),
    allocatedVcpuCount: z.literal(8),
    allocatedMemoryGiB: z.literal(32),
    taskCount: z.literal(1),
    parallelism: z.literal(1),
    maximumRetries: z.literal(0),
    network: z.literal(NETWORK),
    subnet: z.literal(SUBNET),
    networkTag: z.literal(NETWORK_TAG),
    vpcEgress: z.literal('all-traffic'),
    privateGoogleAccessEnabled: z.literal(true),
    cloudNatPresent: z.literal(false),
    publicNetworkEgressAllowed: z.literal(false),
    minimumIdleInstances: z.literal(0),
  }).strict(),
  deterministicFixture: z.object({
    fixtureId: z.literal('weeditpro-sam31-l4-mask-qa-fixture-v1'),
    fixtureDigestSha256: sha256,
    width: z.literal(MASK_WIDTH),
    height: z.literal(MASK_HEIGHT),
    frameCount: z.literal(FRAME_COUNT),
    subjectCount: z.literal(SUBJECT_COUNT),
    maskPngCount: z.literal(FRAME_COUNT * SUBJECT_COUNT),
    sam31InvocationId: safeId,
    l4InvocationId: safeId,
    manifestRef: evidenceRefSchema,
    requestRef: evidenceRefSchema,
    taskObjectRef: evidenceRefSchema,
  }).strict(),
  execution: z.object({
    cloudRunOperationName: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/operations\/[a-z0-9-]+$/u,
    ),
    cloudRunExecutionResource: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-track-all-mask-qa-l4\/executions\/[a-z0-9-]+$/u,
    ),
    executionStartTime: timestamp,
    executionCompletionTime: timestamp,
    activeExecutionCountBeforeStart: z.literal(0),
    activeExecutionCountAfterTerminal: z.literal(0),
    executionSucceededCount: z.literal(1),
    executionFailedCount: z.literal(0),
    executionCancelledCount: z.literal(0),
    scaleFromZeroObserved: z.literal(true),
    terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
    automaticRetryPerformed: z.literal(false),
    responseObjectRef: evidenceRefSchema,
  }).strict(),
  workerResponse: canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema,
  pricing: z.object({
    disposition: z.literal(
      'blocked_missing_billing_account_effective_price_authority',
    ),
    accountEffectiveRateAuthorityRef: z.null(),
    attemptCostReceiptRef: z.null(),
    customerCreditSettlementRef: z.null(),
    publicCatalogListPriceSubstitutionAccepted: z.literal(false),
    customerCreditsMutated: z.literal(false),
  }).strict(),
  actualL4GpuExecutionObserved: z.literal(true),
  actualKorniaCudaKernelExecutionObserved: z.literal(true),
  actualOpenCvCudaCrosscheckExecutionObserved: z.literal(true),
  everyFixtureMaskRereadAndMeasured: z.literal(true),
  runtimeDownloadPerformed: z.literal(false),
  sam31CheckpointOrModelExecuted: z.literal(false),
  cpuOnlySubstantiveMaskQaUsed: z.literal(false),
  customerMediaUsed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const response = receipt.workerResponse
  const exact = response.status === 'completed'
    && response.terminalStage === 'completed'
    && response.failureCode === 'none'
    && response.l4InvocationId
      === receipt.deterministicFixture.l4InvocationId
    && response.sam31InvocationId
      === receipt.deterministicFixture.sam31InvocationId
    && response.requestBindingSha256
      === receipt.deterministicFixture.requestRef.contentHash.slice(7)
    && response.inputEvidence?.manifestSha256
      === receipt.deterministicFixture.manifestRef.contentHash.slice(7)
    && response.inputEvidence.maskPngCount
      === receipt.deterministicFixture.maskPngCount
    && response.gpuEvidence?.exactL4DeviceObserved
    && response.gpuEvidence.korniaCudaTensorExecutionObserved
    && response.gpuEvidence.opencvCudaEveryMaskCrosschecked
    && response.gpuEvidence.torchCudaKernelCount > 0
    && response.gpuEvidence.opencvCudaKernelCount
      === receipt.deterministicFixture.maskPngCount * 2
    && response.outputSummary?.completeRequestedFrameAndSubjectCoverage
    && response.outputSummary.exactMaskManifestAndEveryMaskPngReread
    && !response.outputSummary.sampledOrRepresentativeOnlyMeasurementAccepted
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Track All L4 private qualification lost exact GPU evidence.',
  })
})

const receiptSchema = receiptWithoutHashSchema.extend({
  receiptHash: sha256,
}).strict()

export type CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt =
  z.infer<typeof receiptSchema>

export interface CanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture {
  readonly fixtureId: 'weeditpro-sam31-l4-mask-qa-fixture-v1'
  readonly fixtureDigestSha256: string
  readonly sam31InvocationId: string
  readonly l4InvocationId: string
  readonly manifest: Readonly<Record<string, unknown>>
  readonly manifestBytes: Buffer
  readonly masks: readonly {
    readonly relativeFileName: string
    readonly body: Buffer
    readonly sha256: string
  }[]
  readonly request: CanonicalTrackAllSam31L4TaskQaWorkerRequestV2
  readonly taskBytes: Buffer
}

export function buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture(
  input: {
    readonly qualificationId: string
    readonly sam31InvocationId: string
    readonly l4InvocationId: string
  },
): CanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture {
  const qualificationId = safeId.parse(input.qualificationId)
  const sam31InvocationId = safeId.parse(input.sam31InvocationId)
  const l4InvocationId = safeId.parse(input.l4InvocationId)
  if (sam31InvocationId === l4InvocationId) {
    throw new TypeError('SAM 3.1 and L4 qualification invocations collapsed.')
  }
  const sourceFrameMappingRef = ref('weeditpro-sam31-l4-qa-source-mapping', {
    fixture: 'weeditpro-sam31-l4-mask-qa-fixture-v1',
    canonicalStartFrame: 300,
    canonicalEndFrameExclusive: 308,
  })
  const confirmedOutputFrameRef = ref(
    'weeditpro-sam31-l4-qa-confirmed-output-frame',
    { width: MASK_WIDTH, height: MASK_HEIGHT, fps: 30, outputId: 'qa-wide' },
  )
  const masks = createMaskSet()
  const manifest = createManifest({
    masks,
    sourceFrameMappingRef,
    sam31RuntimeRequestBindingSha256: sha256AuthorityValue({
      fixture: 'weeditpro-sam31-l4-mask-qa-fixture-v1',
      qualificationId,
      sam31InvocationId,
    }),
  })
  const manifestBytes = Buffer.from(stableAuthorityStringify(manifest))
  const manifestSha256 = hashBytes(manifestBytes)
  const manifestRef = {
    id: 'weeditpro-sam31-l4-qa-mask-manifest',
    version: 1 as const,
    contentHash: `sha256:${manifestSha256}` as const,
  }
  const request = buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-request-v2',
    operationId: 'tool.kornia.refine_mask.v1',
    l4InvocationId,
    sam31InvocationId,
    sam31TaskRef: ref('weeditpro-sam31-l4-qa-sam-task', {
      qualificationId,
      sam31InvocationId,
    }),
    sam31RuntimeRequestBindingSha256:
      String(manifest.requestBindingSha256),
    sam31RuntimeResultAdmissionRef: ref(
      'weeditpro-sam31-l4-qa-sam-result-admission',
      { qualificationId, sam31InvocationId },
    ),
    sam31MaskManifestRef: manifestRef,
    l4ExecutionEnvelopeRef: ref(l4InvocationId, {
      qualificationId,
      l4InvocationId,
      routeId: 'l4_standard_primary',
    }),
    approvedWorkItemRef: ref('weeditpro-sam31-l4-qa-approved-work', {
      qualificationId,
    }),
    workerLeaseRef: ref('weeditpro-sam31-l4-qa-worker-lease', {
      qualificationId,
    }),
    executionAttemptRef: ref('weeditpro-sam31-l4-qa-attempt', {
      qualificationId,
    }),
    sourceFrameMappingRef,
    confirmedOutputFrameRef,
    sourceWidth: MASK_WIDTH,
    sourceHeight: MASK_HEIGHT,
    maskFrameRange: { startFrame: 0, endFrameExclusive: FRAME_COUNT },
    expectedMaskManifestByteLength: manifestBytes.byteLength,
    expectedMaskManifestSha256: manifestSha256,
    expectedMaskPngCount: FRAME_COUNT * SUBJECT_COUNT,
    subjects: [{
      subjectRequestId: 'weeditpro-sam31-l4-qa-primary-request',
      subjectEvidenceId: 'weeditpro-sam31-l4-qa-primary-evidence',
      subjectRole: 'primary_speaker',
      maskObjectId: 1,
      canonicalFrameRange: { startFrame: 300, endFrameExclusive: 308 },
      maskFrameRange: { startFrame: 0, endFrameExclusive: FRAME_COUNT },
      trackManifestRef: ref('weeditpro-sam31-l4-qa-primary-track', {
        qualificationId,
      }),
      anchorManifestRef: ref('weeditpro-sam31-l4-qa-primary-anchor', {
        qualificationId,
      }),
      sourceFrameMappingRef,
      outputFrameDigestSha256: confirmedOutputFrameRef.contentHash.slice(7),
    }, {
      subjectRequestId: 'weeditpro-sam31-l4-qa-product-request',
      subjectEvidenceId: 'weeditpro-sam31-l4-qa-product-evidence',
      subjectRole: 'product',
      maskObjectId: 2,
      canonicalFrameRange: { startFrame: 300, endFrameExclusive: 308 },
      maskFrameRange: { startFrame: 0, endFrameExclusive: FRAME_COUNT },
      trackManifestRef: ref('weeditpro-sam31-l4-qa-product-track', {
        qualificationId,
      }),
      anchorManifestRef: null,
      sourceFrameMappingRef,
      outputFrameDigestSha256: confirmedOutputFrameRef.contentHash.slice(7),
    }],
    executionPolicy: {
      routeId: 'l4_standard_primary',
      gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
      accelerator: 'nvidia_l4',
      korniaVersion: '0.8.3',
      torchVersion: '2.10.0+cu128',
      cudaRuntimeVersion: '12.8',
      morphologyKernelSize: 3,
      binaryThreshold: 127,
      everyManifestMaskMustBeReread: true,
      everyRequestedFrameAndSubjectMustBeMeasured: true,
      korniaCudaSubstantiveMeasurementRequired: true,
      opencvCudaEveryMaskCrosscheckRequired: true,
      cpuDecodeAndBoundedSerializationOnly: true,
      cpuOnlySubstantiveMaskQaAllowed: false,
      runtimeDownloadAllowed: false,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    byteFreeRequest: true,
    callerPathUrlCommandCodeOrEnvironmentAccepted: false,
    browserOrCallerMeasurementAccepted: false,
  })
  const taskBytes = Buffer.from(stableAuthorityStringify({
    runtimeRequest: request,
  }))
  return Object.freeze({
    fixtureId: 'weeditpro-sam31-l4-mask-qa-fixture-v1',
    fixtureDigestSha256: sha256AuthorityValue({
      fixtureId: 'weeditpro-sam31-l4-mask-qa-fixture-v1',
      width: MASK_WIDTH,
      height: MASK_HEIGHT,
      frameCount: FRAME_COUNT,
      subjectCount: SUBJECT_COUNT,
      masks: masks.map((mask) => ({
        relativeFileName: mask.relativeFileName,
        sha256: mask.sha256,
      })),
    }),
    sam31InvocationId,
    l4InvocationId,
    manifest: structuredClone(manifest),
    manifestBytes: Buffer.from(manifestBytes),
    masks: masks.map((mask) => Object.freeze({
      ...mask,
      body: Buffer.from(mask.body),
    })),
    request,
    taskBytes,
  })
}

export function buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(
  input: z.input<typeof receiptWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt {
  assertPlainSerializedData(input, 'track_all_l4_private_qualification_receipt')
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(input.workerResponse)
  const payload = receiptWithoutHashSchema.parse(input)
  return receiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt {
  assertPlainSerializedData(value, 'track_all_l4_private_qualification_receipt')
  const receipt = receiptSchema.parse(value)
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(receipt.workerResponse)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 private qualification digest is invalid.')
  }
  return structuredClone(receipt)
}

function createMaskSet() {
  const masks: {
    relativeFileName: string
    body: Buffer
    sha256: string
    frameIndex: number
    objectId: number
    box: readonly [number, number, number, number]
  }[] = []
  for (let frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex += 1) {
    const boxes = [{
      objectId: 1,
      box: [40 + frameIndex * 4, 50, 160, 180] as const,
    }, {
      objectId: 2,
      box: [360 - frameIndex * 3, 120, 140, 100] as const,
    }]
    for (const { objectId, box } of boxes) {
      const pixels = Buffer.alloc(MASK_WIDTH * MASK_HEIGHT)
      for (let y = box[1]; y < box[1] + box[3]; y += 1) {
        pixels.fill(255, y * MASK_WIDTH + box[0],
          y * MASK_WIDTH + box[0] + box[2])
      }
      const body = encodeGrayscalePng(MASK_WIDTH, MASK_HEIGHT, pixels)
      masks.push({
        relativeFileName:
          `frame-${String(frameIndex).padStart(6, '0')}-object-${String(objectId).padStart(6, '0')}.png`,
        body,
        sha256: hashBytes(body),
        frameIndex,
        objectId,
        box,
      })
    }
  }
  return masks
}

function createManifest(input: {
  masks: ReturnType<typeof createMaskSet>
  sourceFrameMappingRef: ReturnType<typeof ref>
  sam31RuntimeRequestBindingSha256: string
}) {
  return {
    schemaVersion: 'canonical-sam3_1-mask-sequence-manifest-v1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    requestBindingSha256: input.sam31RuntimeRequestBindingSha256,
    sourceFrameRangeMappingRef: input.sourceFrameMappingRef,
    width: MASK_WIDTH,
    height: MASK_HEIGHT,
    firstFrameIndex: 0,
    lastFrameIndex: FRAME_COUNT - 1,
    frames: Array.from({ length: FRAME_COUNT }, (_, frameIndex) => ({
      frameIndex,
      objects: input.masks.filter((mask) => mask.frameIndex === frameIndex)
        .map((mask) => ({
          objectId: mask.objectId,
          normalizedBoxXywh: [
            mask.box[0] / MASK_WIDTH,
            mask.box[1] / MASK_HEIGHT,
            mask.box[2] / MASK_WIDTH,
            mask.box[3] / MASK_HEIGHT,
          ],
          maskSha256: mask.sha256,
        })),
    })),
    masks: input.masks.map((mask) => ({
      frameIndex: mask.frameIndex,
      objectId: mask.objectId,
      relativeFileName: mask.relativeFileName,
      width: MASK_WIDTH,
      height: MASK_HEIGHT,
      byteLength: mask.body.byteLength,
      sha256: mask.sha256,
    })),
  } as const
}

function encodeGrayscalePng(width: number, height: number, pixels: Buffer) {
  if (pixels.byteLength !== width * height) {
    throw new TypeError('Grayscale PNG pixel buffer has invalid geometry.')
  }
  const scanlines = Buffer.alloc(height * (width + 1))
  for (let y = 0; y < height; y += 1) {
    pixels.copy(scanlines, y * (width + 1) + 1, y * width, (y + 1) * width)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 0
  header[10] = 0
  header[11] = 0
  header[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer) {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.byteLength, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([length, typeBytes, data, crc])
}

function crc32(value: Buffer) {
  let crc = 0xffffffff
  for (const byte of value) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function ref(id: string, authority: unknown) {
  return {
    id: safeId.parse(id),
    version: 1 as const,
    contentHash: `sha256:${sha256AuthorityValue(authority)}` as const,
  }
}

function hashBytes(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

export const canonicalTrackAllSam31L4TaskQaPrivateQualificationConstants =
  Object.freeze({
    projectId: PROJECT_ID,
    region: REGION,
    jobResource: JOB_RESOURCE,
    immutableImageDigest: IMAGE_DIGEST,
    network: NETWORK,
    subnet: SUBNET,
    networkTag: NETWORK_TAG,
    width: MASK_WIDTH,
    height: MASK_HEIGHT,
    frameCount: FRAME_COUNT,
    subjectCount: SUBJECT_COUNT,
  })

export function canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(
  receipt: CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
) {
  const exact = assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(
    receipt,
  )
  return {
    id: exact.qualificationId,
    version: 1 as const,
    contentHash: `sha256:${exact.receiptHash}` as const,
  }
}

export function canonicalTrackAllSam31L4TaskQaTaskRef(
  request: CanonicalTrackAllSam31L4TaskQaWorkerRequestV2,
) {
  return {
    id: request.l4InvocationId,
    version: 1 as const,
    contentHash: `sha256:${hashBytes(Buffer.from(stableAuthorityStringify({
      runtimeRequest: request,
    })))}` as const,
  }
}

export function canonicalTrackAllSam31L4TaskQaResponseRef(
  response: CanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
) {
  const exact = assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(response)
  return {
    id: exact.l4InvocationId,
    version: 1 as const,
    contentHash: `sha256:${hashBytes(Buffer.from(stableAuthorityStringify(
      exact,
    )))}` as const,
  }
}
