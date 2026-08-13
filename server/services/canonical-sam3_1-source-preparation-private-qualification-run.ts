import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
  type CanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_RUN_VERSION =
  'canonical-sam3_1-source-preparation-private-qualification-run-v1' as const
export const CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_REPOSITORY_VERSION =
  'canonical-sam3_1-source-preparation-private-qualification-repository-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-source-preparation-private-qualification-runs'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const QUALIFICATION_JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4-private-qualification' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
export type CanonicalSam31SourcePreparationPrivateQualificationRef = z.infer<
  typeof refSchema
>

const runWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_RUN_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_source_preparation_private_qualification_worker',
  ),
  evidenceClass: z.literal('canonical_private_exact_l4_runtime_reread'),
  qualificationRunId: safeId,
  cloudRunJobResource: z.literal(QUALIFICATION_JOB_RESOURCE),
  immutableImageRef: refSchema,
  immutableImageDigest: prefixedSha256,
  imageBuildReceiptRef: refSchema,
  imageSupplyChainRef: refSchema,
  qualificationSourcePlanRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  preparationRef: refSchema,
  workerOutputRef: refSchema,
  exact3840x2160At24FpsSourceReread: z.literal(true),
  exact11520FrameSequencePrepared: z.literal(true),
  exact49ChunkFrameAccountingVerified: z.literal(true),
  exactOneFrameCrossChunkOverlapVerified: z.literal(true),
  actualNvidiaL4Observed: z.literal(true),
  exactlyOneL4Allocated: z.literal(true),
  ffmpegCudaNvdecDecodeVerified: z.literal(true),
  ffmpegNvencH264EncodeVerified: z.literal(true),
  ffprobeMetadataOnlyVerified: z.literal(true),
  everyChunkPersistedCreateOnlyAndReread: z.literal(true),
  sourceAudioRemoved: z.literal(true),
  fullSourceResolutionPreserved: z.literal(true),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  runtimeModelOrToolDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandModelOrEnvironmentAccepted: z.literal(false),
  terminalCloudRunExecutionReconciliationRequired: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
  completedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.immutableImageRef.contentHash !== value.immutableImageDigest
    || Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Private L4 qualification run lineage changed.',
    })
  }
})
const runSchema = runWithoutHashSchema.extend({ runHash: sha256 }).strict()
export type CanonicalSam31SourcePreparationPrivateQualificationRun = z.infer<
  typeof runSchema
>

export interface CanonicalSam31SourcePreparationPrivateQualificationRepository {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly run: CanonicalSam31SourcePreparationPrivateQualificationRun
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly qualificationRunId: string
  }): Promise<CanonicalSam31SourcePreparationPrivateQualificationRun | null>
}

export function createCanonicalSam31SourcePreparationPrivateQualificationRun(
  input: {
    readonly qualificationRunId: string
    readonly immutableImageRef:
      CanonicalSam31SourcePreparationPrivateQualificationRef
    readonly immutableImageDigest: string
    readonly imageBuildReceiptRef:
      CanonicalSam31SourcePreparationPrivateQualificationRef
    readonly imageSupplyChainRef:
      CanonicalSam31SourcePreparationPrivateQualificationRef
    readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
    readonly preparation:
      CanonicalSam31EightMinuteQualificationSourcePreparation
    readonly workerOutputRef:
      CanonicalSam31SourcePreparationPrivateQualificationRef
    readonly startedAt: string
    readonly completedAt: string
  },
): CanonicalSam31SourcePreparationPrivateQualificationRun {
  assertPlainSerializedData(input, 'sam31_source_prep_private_qualification_run')
  const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(input.plan)
  const preparation =
    parseCanonicalSam31EightMinuteQualificationSourcePreparation(
      input.preparation,
    )
  const planRef = ref(plan.qualificationSourceId, plan.planHash)
  if (preparation.disposition !== 'ready'
    || !sameRef(preparation.qualificationSourcePlanRef, planRef)
    || !sameRef(preparation.exactEightMinuteSourceRef,
      plan.exactEightMinuteSourceRef)) {
    throw new TypeError('Private L4 qualification preparation is incomplete.')
  }
  const payload = runWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_RUN_VERSION,
    source:
      'canonical_server_sam3_1_source_preparation_private_qualification_worker',
    evidenceClass: 'canonical_private_exact_l4_runtime_reread',
    qualificationRunId: input.qualificationRunId,
    cloudRunJobResource: QUALIFICATION_JOB_RESOURCE,
    immutableImageRef: input.immutableImageRef,
    immutableImageDigest: input.immutableImageDigest,
    imageBuildReceiptRef: input.imageBuildReceiptRef,
    imageSupplyChainRef: input.imageSupplyChainRef,
    qualificationSourcePlanRef: planRef,
    exactEightMinuteSourceRef: plan.exactEightMinuteSourceRef,
    preparationRef: ref(preparation.preparationId, preparation.preparationHash),
    workerOutputRef: input.workerOutputRef,
    exact3840x2160At24FpsSourceReread: true,
    exact11520FrameSequencePrepared: true,
    exact49ChunkFrameAccountingVerified: true,
    exactOneFrameCrossChunkOverlapVerified: true,
    actualNvidiaL4Observed: true,
    exactlyOneL4Allocated: true,
    ffmpegCudaNvdecDecodeVerified: true,
    ffmpegNvencH264EncodeVerified: true,
    ffprobeMetadataOnlyVerified: true,
    everyChunkPersistedCreateOnlyAndReread: true,
    sourceAudioRemoved: true,
    fullSourceResolutionPreserved: true,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    callerPathUrlBytesCommandModelOrEnvironmentAccepted: false,
    terminalCloudRunExecutionReconciliationRequired: true,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  })
  return assertCanonicalSam31SourcePreparationPrivateQualificationRun({
    ...payload,
    runHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourcePreparationPrivateQualificationRun(
  value: unknown,
): CanonicalSam31SourcePreparationPrivateQualificationRun {
  assertPlainSerializedData(value, 'sam31_source_prep_private_qualification_run')
  const parsed = runSchema.parse(value)
  const { runHash, ...payload } = parsed
  if (runHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Private L4 qualification run digest changed.')
  }
  return freeze(structuredClone(parsed))
}

export function getCanonicalSam31SourcePreparationPrivateQualificationRunRef(
  value: unknown,
): CanonicalSam31SourcePreparationPrivateQualificationRef {
  const run = assertCanonicalSam31SourcePreparationPrivateQualificationRun(
    value,
  )
  return ref(run.qualificationRunId, run.runHash)
}

export function createCanonicalSam31SourcePreparationPrivateQualificationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31SourcePreparationPrivateQualificationRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('Private L4 qualification repository port is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (qualificationRunId: string) => {
    const id = safeId.parse(qualificationRunId)
    const body = await input.objectPort.readExact(`${prefix}/${id}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('Private L4 qualification bytes are invalid.')
    }
    let raw: unknown
    try {
      raw = JSON.parse(body.toString('utf8')) as unknown
    } catch {
      throw new TypeError('Private L4 qualification JSON is invalid.')
    }
    const run = assertCanonicalSam31SourcePreparationPrivateQualificationRun(
      raw,
    )
    if (run.qualificationRunId !== id
      || stableAuthorityStringify(run) !== body.toString('utf8')) {
      throw new TypeError('Private L4 qualification exact reread changed.')
    }
    return run
  }
  const repository:
  CanonicalSam31SourcePreparationPrivateQualificationRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_PREPARATION_PRIVATE_QUALIFICATION_REPOSITORY_VERSION,
    async persistCreateOnly({ run }) {
      const parsed =
        assertCanonicalSam31SourcePreparationPrivateQualificationRun(run)
      const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${parsed.qualificationRunId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const accepted = await reread(parsed.qualificationRunId)
      if (!accepted || accepted.runHash !== parsed.runHash) {
        throw new TypeError('Private L4 qualification persistence changed.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    reread({ qualificationRunId }) {
      return reread(qualificationRunId)
    },
  }
  return Object.freeze(repository)
}

function ref(
  id: string,
  hash: string,
): CanonicalSam31SourcePreparationPrivateQualificationRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
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
