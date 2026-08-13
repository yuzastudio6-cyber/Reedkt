import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PLAN_VERSION =
  'canonical-sam3_1-eight-minute-qualification-source-plan-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PREPARATION_VERSION =
  'canonical-sam3_1-eight-minute-qualification-source-preparation-v1' as const

const SOURCE_DURATION_MILLISECONDS = 480_000
const SOURCE_FRAME_COUNT = 11_520
const SOURCE_WIDTH = 3_840
const SOURCE_HEIGHT = 2_160
const FPS_NUMERATOR = 24
const FPS_DENOMINATOR = 1
const SOURCE_SLICE_FRAME_COUNT = 384
const REPETITION_COUNT = 30
const CHUNK_FRAME_COUNT = 240
const CHUNK_OVERLAP_FRAME_COUNT = 1
const CHUNK_STRIDE_FRAME_COUNT = 239
const CHUNK_COUNT = 49
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-eight-minute-qualification-sources'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const sourceSliceSchema = z.object({
  sequenceOrdinal: z.number().int().min(1).max(REPETITION_COUNT),
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  sourceStartFrameInclusive: z.literal(0),
  sourceEndFrameInclusive: z.literal(SOURCE_SLICE_FRAME_COUNT - 1),
  exactSourceObjectRef: refSchema,
}).strict()

const chunkSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(CHUNK_COUNT),
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  overlapWithPreviousFrames: z.union([
    z.literal(0), z.literal(CHUNK_OVERLAP_FRAME_COUNT),
  ]),
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  ffprobeEvidenceRef: refSchema,
  gpuPreparationEvidenceRef: refSchema,
  byteLength: z.number().int().positive().safe(),
  sha256,
  decodedFrameCount: z.number().int().min(1).max(CHUNK_FRAME_COUNT).safe(),
}).strict()

const planWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PLAN_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_qualification_source_owner',
  ),
  evidenceClass: z.literal('canonical_private_source_sequence_plan'),
  qualificationSourceId: safeId,
  exactEightMinuteSourceRef: refSchema,
  exactSourceObjectRef: refSchema,
  exactSourceReadAuthorityRef: refSchema,
  sourceObjectSha256: z.literal(
    'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
  ),
  sourceObjectByteLength: z.literal(90_971_927),
  sourceObjectWidth: z.literal(SOURCE_WIDTH),
  sourceObjectHeight: z.literal(SOURCE_HEIGHT),
  sourceObjectFrameCount: z.literal(386),
  sourceObjectFpsNumerator: z.literal(FPS_NUMERATOR),
  sourceObjectFpsDenominator: z.literal(FPS_DENOMINATOR),
  sourceSliceFrameCount: z.literal(SOURCE_SLICE_FRAME_COUNT),
  sourceSliceStartFrameInclusive: z.literal(0),
  sourceSliceEndFrameInclusive: z.literal(SOURCE_SLICE_FRAME_COUNT - 1),
  repeatedSequenceCount: z.literal(REPETITION_COUNT),
  sourceDurationMilliseconds: z.literal(SOURCE_DURATION_MILLISECONDS),
  sourceFrameCount: z.literal(SOURCE_FRAME_COUNT),
  sourceWidth: z.literal(SOURCE_WIDTH),
  sourceHeight: z.literal(SOURCE_HEIGHT),
  fpsNumerator: z.literal(FPS_NUMERATOR),
  fpsDenominator: z.literal(FPS_DENOMINATOR),
  sequence: z.array(sourceSliceSchema).length(REPETITION_COUNT),
  chunkFrameCount: z.literal(CHUNK_FRAME_COUNT),
  chunkOverlapFrameCount: z.literal(CHUNK_OVERLAP_FRAME_COUNT),
  chunkStrideFrameCount: z.literal(CHUNK_STRIDE_FRAME_COUNT),
  exactChunkCount: z.literal(CHUNK_COUNT),
  preparationRouteId: z.literal('l4_standard_primary'),
  preparationAccelerator: z.literal('nvidia_l4'),
  preparationOperationId: z.literal(
    'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1',
  ),
  fixedServerOwnedNvdecNvencProfileRequired: z.literal(true),
  substantiveCpuMediaProcessingAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  privatePerformanceQualificationOnly: z.literal(true),
  representativeContentDiversityClaimAllowed: z.literal(false),
  temporalQualityQualificationClaimAllowed: z.literal(false),
  customerFootageClaimAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  plannedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (!exactSequence(value.sequence, value.exactSourceObjectRef)) {
    context.addIssue({
      code: 'custom',
      message: 'Eight-minute qualification source sequence changed.',
    })
  }
})

export const canonicalSam31EightMinuteQualificationSourcePlanSchema =
  planWithoutHashSchema.extend({ planHash: sha256 }).strict()
    .superRefine((value, context) => {
      if (!exactSequence(value.sequence, value.exactSourceObjectRef)) {
        context.addIssue({
          code: 'custom',
          message: 'Eight-minute qualification source sequence changed.',
        })
      }
    })
export type CanonicalSam31EightMinuteQualificationSourcePlan = z.infer<
  typeof canonicalSam31EightMinuteQualificationSourcePlanSchema
>

const preparationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PREPARATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_qualification_source_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_gpu_artifact_reread'),
  preparationId: safeId,
  qualificationSourcePlanRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  disposition: z.enum(['planned', 'ready']),
  preparedChunks: z.array(chunkSchema).max(CHUNK_COUNT),
  preparedChunkCount: z.number().int().min(0).max(CHUNK_COUNT).safe(),
  exactChunkCount: z.literal(CHUNK_COUNT),
  exactSourceObjectGenerationEtagChecksumAndLengthReread: z.boolean(),
  everyPreparedChunkPersistedCreateOnlyAndExactReread: z.boolean(),
  everyPreparedChunkFfprobeGeometryFrameCountAndColorVerified: z.boolean(),
  l4NvdecHardwareDecodeVerified: z.boolean(),
  l4NvencHardwareEncodeVerified: z.boolean(),
  allCanonicalFramesCoveredWithoutGap: z.boolean(),
  deterministicOneFrameOverlapVerified: z.boolean(),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  sourceResolutionReductionUsed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (!exactPreparation(value)) context.addIssue({
    code: 'custom',
    message: 'Eight-minute qualification source preparation is incomplete.',
  })
})

export const canonicalSam31EightMinuteQualificationSourcePreparationSchema =
  preparationWithoutHashSchema.extend({ preparationHash: sha256 }).strict()
    .superRefine((value, context) => {
      if (!exactPreparation(value)) context.addIssue({
        code: 'custom',
        message: 'Eight-minute qualification source preparation is incomplete.',
      })
    })
export type CanonicalSam31EightMinuteQualificationSourcePreparation = z.infer<
  typeof canonicalSam31EightMinuteQualificationSourcePreparationSchema
>

export interface CanonicalSam31EightMinuteQualificationSourceRepository {
  readonly schemaVersion:
    'canonical-sam3_1-eight-minute-qualification-source-repository-v1'
  persistPlanCreateOnly(input: {
    readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
  }): Promise<'created' | 'identical_replay'>
  rereadPlan(input: {
    readonly qualificationSourceId: string
  }): Promise<CanonicalSam31EightMinuteQualificationSourcePlan | null>
  persistPreparationCreateOnly(input: {
    readonly preparation:
      CanonicalSam31EightMinuteQualificationSourcePreparation
  }): Promise<'created' | 'identical_replay'>
  rereadPreparation(input: {
    readonly preparationId: string
  }): Promise<CanonicalSam31EightMinuteQualificationSourcePreparation | null>
}

export function buildCanonicalSam31EightMinuteQualificationSourcePlan(input: {
  readonly qualificationSourceId: string
  readonly exactSourceObjectRef: EvidenceRef
  readonly exactSourceReadAuthorityRef: EvidenceRef
  readonly plannedAt: string
}): CanonicalSam31EightMinuteQualificationSourcePlan {
  assertPlainSerializedData(input, 'sam31_eight_minute_source_plan_input')
  const qualificationSourceId = safeId.parse(input.qualificationSourceId)
  const exactSourceObjectRef = refSchema.parse(input.exactSourceObjectRef)
  const exactSourceReadAuthorityRef = refSchema.parse(
    input.exactSourceReadAuthorityRef,
  )
  if (exactSourceObjectRef.contentHash !==
    'sha256:c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb') {
    throw new TypeError('Eight-minute source object identity changed.')
  }
  const sequence = Array.from({ length: REPETITION_COUNT }, (_, index) => ({
    sequenceOrdinal: index + 1,
    canonicalStartFrameInclusive: index * SOURCE_SLICE_FRAME_COUNT,
    canonicalEndFrameInclusive:
      (index + 1) * SOURCE_SLICE_FRAME_COUNT - 1,
    sourceStartFrameInclusive: 0 as const,
    sourceEndFrameInclusive: SOURCE_SLICE_FRAME_COUNT - 1 as 383,
    exactSourceObjectRef,
  }))
  const exactEightMinuteSourceRef = ref(
    qualificationSourceId,
    sha256AuthorityValue({
      domain: 'weeditpro_sam3_1_eight_minute_source_sequence_v1',
      exactSourceObjectRef,
      sourceSliceStartFrameInclusive: 0,
      sourceSliceEndFrameInclusive: SOURCE_SLICE_FRAME_COUNT - 1,
      repeatedSequenceCount: REPETITION_COUNT,
      sequence,
      sourceFrameCount: SOURCE_FRAME_COUNT,
      fpsNumerator: FPS_NUMERATOR,
      fpsDenominator: FPS_DENOMINATOR,
    }),
  )
  const payload = planWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PLAN_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_qualification_source_owner',
    evidenceClass: 'canonical_private_source_sequence_plan',
    qualificationSourceId,
    exactEightMinuteSourceRef,
    exactSourceObjectRef,
    exactSourceReadAuthorityRef,
    sourceObjectSha256:
      'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
    sourceObjectByteLength: 90_971_927,
    sourceObjectWidth: SOURCE_WIDTH,
    sourceObjectHeight: SOURCE_HEIGHT,
    sourceObjectFrameCount: 386,
    sourceObjectFpsNumerator: FPS_NUMERATOR,
    sourceObjectFpsDenominator: FPS_DENOMINATOR,
    sourceSliceFrameCount: SOURCE_SLICE_FRAME_COUNT,
    sourceSliceStartFrameInclusive: 0,
    sourceSliceEndFrameInclusive: SOURCE_SLICE_FRAME_COUNT - 1,
    repeatedSequenceCount: REPETITION_COUNT,
    sourceDurationMilliseconds: SOURCE_DURATION_MILLISECONDS,
    sourceFrameCount: SOURCE_FRAME_COUNT,
    sourceWidth: SOURCE_WIDTH,
    sourceHeight: SOURCE_HEIGHT,
    fpsNumerator: FPS_NUMERATOR,
    fpsDenominator: FPS_DENOMINATOR,
    sequence,
    chunkFrameCount: CHUNK_FRAME_COUNT,
    chunkOverlapFrameCount: CHUNK_OVERLAP_FRAME_COUNT,
    chunkStrideFrameCount: CHUNK_STRIDE_FRAME_COUNT,
    exactChunkCount: CHUNK_COUNT,
    preparationRouteId: 'l4_standard_primary',
    preparationAccelerator: 'nvidia_l4',
    preparationOperationId:
      'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1',
    fixedServerOwnedNvdecNvencProfileRequired: true,
    substantiveCpuMediaProcessingAllowed: false,
    sourceResolutionReductionAllowed: false,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    privatePerformanceQualificationOnly: true,
    representativeContentDiversityClaimAllowed: false,
    temporalQualityQualificationClaimAllowed: false,
    customerFootageClaimAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    plannedAt: timestamp.parse(input.plannedAt),
  })
  return freeze(canonicalSam31EightMinuteQualificationSourcePlanSchema.parse({
    ...payload,
    planHash: sha256AuthorityValue(payload),
  }))
}

export function parseCanonicalSam31EightMinuteQualificationSourcePlan(
  value: unknown,
): CanonicalSam31EightMinuteQualificationSourcePlan {
  assertPlainSerializedData(value, 'sam31_eight_minute_source_plan')
  const parsed = canonicalSam31EightMinuteQualificationSourcePlanSchema
    .parse(value)
  const { planHash, ...payload } = parsed
  if (planHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Eight-minute qualification source plan changed.')
  }
  return freeze(parsed)
}

export function buildCanonicalSam31EightMinuteQualificationSourcePreparation(
  input: {
    readonly preparationId: string
    readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
    readonly disposition: 'planned' | 'ready'
    readonly preparedChunks: ReadonlyArray<z.infer<typeof chunkSchema>>
    readonly preparedAt: string
  },
): CanonicalSam31EightMinuteQualificationSourcePreparation {
  assertPlainSerializedData(input, 'sam31_eight_minute_source_preparation')
  const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
    input.plan,
  )
  const ready = input.disposition === 'ready'
  const preparedChunks = input.preparedChunks.map((chunk) =>
    chunkSchema.parse(chunk))
  const payload = preparationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_QUALIFICATION_SOURCE_PREPARATION_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_qualification_source_owner',
    evidenceClass: 'canonical_private_exact_gpu_artifact_reread',
    preparationId: safeId.parse(input.preparationId),
    qualificationSourcePlanRef: ref(
      plan.qualificationSourceId,
      plan.planHash,
    ),
    exactEightMinuteSourceRef: plan.exactEightMinuteSourceRef,
    disposition: input.disposition,
    preparedChunks,
    preparedChunkCount: preparedChunks.length,
    exactChunkCount: CHUNK_COUNT,
    exactSourceObjectGenerationEtagChecksumAndLengthReread: ready,
    everyPreparedChunkPersistedCreateOnlyAndExactReread: ready,
    everyPreparedChunkFfprobeGeometryFrameCountAndColorVerified: ready,
    l4NvdecHardwareDecodeVerified: ready,
    l4NvencHardwareEncodeVerified: ready,
    allCanonicalFramesCoveredWithoutGap: ready,
    deterministicOneFrameOverlapVerified: ready,
    substantiveCpuMediaProcessingUsed: false,
    sourceResolutionReductionUsed: false,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    preparedAt: timestamp.parse(input.preparedAt),
  })
  return parseCanonicalSam31EightMinuteQualificationSourcePreparation({
    ...payload,
    preparationHash: sha256AuthorityValue(payload),
  })
}

export function sealCanonicalSam31EightMinuteQualificationSourcePreparation(
  value: unknown,
): CanonicalSam31EightMinuteQualificationSourcePreparation {
  assertPlainSerializedData(value, 'sam31_eight_minute_source_preparation')
  const payload = preparationWithoutHashSchema.parse(value)
  return parseCanonicalSam31EightMinuteQualificationSourcePreparation({
    ...payload,
    preparationHash: sha256AuthorityValue(payload),
  })
}

export function parseCanonicalSam31EightMinuteQualificationSourcePreparation(
  value: unknown,
): CanonicalSam31EightMinuteQualificationSourcePreparation {
  assertPlainSerializedData(value, 'sam31_eight_minute_source_preparation')
  const parsed = canonicalSam31EightMinuteQualificationSourcePreparationSchema
    .parse(value)
  const { preparationHash, ...payload } = parsed
  if (preparationHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Eight-minute qualification preparation changed.')
  }
  return freeze(parsed)
}

export function createCanonicalSam31EightMinuteQualificationSourceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31EightMinuteQualificationSourceRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('Eight-minute source repository port is unavailable.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-eight-minute-qualification-source-repository-v1' as const,
    persistPlanCreateOnly: ({ plan }) => persistExact({
      objectPort: input.objectPort,
      objectPath: `${prefix}/plans/${plan.qualificationSourceId}.json`,
      value: parseCanonicalSam31EightMinuteQualificationSourcePlan(plan),
      parser: parseCanonicalSam31EightMinuteQualificationSourcePlan,
    }),
    async rereadPlan({ qualificationSourceId }) {
      return readExact({
        objectPort: input.objectPort,
        objectPath: `${prefix}/plans/${safeId.parse(qualificationSourceId)}.json`,
        parser: parseCanonicalSam31EightMinuteQualificationSourcePlan,
      })
    },
    persistPreparationCreateOnly: ({ preparation }) => persistExact({
      objectPort: input.objectPort,
      objectPath: `${prefix}/preparations/${preparation.preparationId}.json`,
      value: parseCanonicalSam31EightMinuteQualificationSourcePreparation(
        preparation,
      ),
      parser: parseCanonicalSam31EightMinuteQualificationSourcePreparation,
    }),
    async rereadPreparation({ preparationId }) {
      return readExact({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/preparations/${safeId.parse(preparationId)}.json`,
        parser: parseCanonicalSam31EightMinuteQualificationSourcePreparation,
      })
    },
  })
}

function exactSequence(
  sequence: ReadonlyArray<z.infer<typeof sourceSliceSchema>>,
  exactSourceObjectRef: EvidenceRef,
): boolean {
  return sequence.length === REPETITION_COUNT
    && sequence.every((segment, index) =>
      segment.sequenceOrdinal === index + 1
      && segment.canonicalStartFrameInclusive ===
        index * SOURCE_SLICE_FRAME_COUNT
      && segment.canonicalEndFrameInclusive ===
        (index + 1) * SOURCE_SLICE_FRAME_COUNT - 1
      && sameRef(segment.exactSourceObjectRef, exactSourceObjectRef))
}

function exactPreparation(
  value: z.infer<typeof preparationWithoutHashSchema>,
): boolean {
  const ready = value.disposition === 'ready'
  const exactReadyFlags = [
    value.exactSourceObjectGenerationEtagChecksumAndLengthReread,
    value.everyPreparedChunkPersistedCreateOnlyAndExactReread,
    value.everyPreparedChunkFfprobeGeometryFrameCountAndColorVerified,
    value.l4NvdecHardwareDecodeVerified,
    value.l4NvencHardwareEncodeVerified,
    value.allCanonicalFramesCoveredWithoutGap,
    value.deterministicOneFrameOverlapVerified,
  ].every((flag) => flag === ready)
  const exactCount = value.preparedChunkCount === value.preparedChunks.length
    && (ready
      ? value.preparedChunkCount === CHUNK_COUNT
      : value.preparedChunkCount === 0)
  const exactChunks = ready
    ? value.preparedChunks.every((chunk, index) => {
      const start = index * CHUNK_STRIDE_FRAME_COUNT
      const end = Math.min(
        SOURCE_FRAME_COUNT - 1,
        start + CHUNK_FRAME_COUNT - 1,
      )
      return chunk.chunkOrdinal === index + 1
        && chunk.canonicalStartFrameInclusive === start
        && chunk.canonicalEndFrameInclusive === end
        && chunk.overlapWithPreviousFrames === (index === 0 ? 0 : 1)
        && chunk.decodedFrameCount === end - start + 1
        && chunk.preparedChunkArtifactRef.contentHash ===
          `sha256:${chunk.sha256}`
    })
    : value.preparedChunks.length === 0
  const uniqueArtifacts = new Set(value.preparedChunks.map((chunk) =>
    `${chunk.preparedChunkArtifactRef.id}:` +
    `${chunk.preparedChunkArtifactRef.version}:` +
    chunk.preparedChunkArtifactRef.contentHash)).size ===
      value.preparedChunks.length
  return exactReadyFlags && exactCount && exactChunks && uniqueArtifacts
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

async function persistExact<T>(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly objectPath: string
  readonly value: T
  readonly parser: (value: unknown) => T
}): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('Eight-minute source record size is invalid.')
  }
  const disposition = await input.objectPort.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.objectPort.readExact(input.objectPath)
  if (!reread || !Buffer.isBuffer(reread)
    || stableAuthorityStringify(input.parser(JSON.parse(
      reread.toString('utf8'),
    ) as unknown)) !== body.toString('utf8')) {
    throw new TypeError('Eight-minute source record exact reread changed.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact<T>(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly objectPath: string
  readonly parser: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('Eight-minute source record bytes are invalid.')
  }
  const parsed = input.parser(JSON.parse(body.toString('utf8')) as unknown)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new TypeError('Eight-minute source record serialization changed.')
  }
  return parsed
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child)
    }
  }
  return value
}
