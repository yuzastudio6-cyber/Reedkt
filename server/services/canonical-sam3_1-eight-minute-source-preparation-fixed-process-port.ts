import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  lstat,
  mkdir,
  open,
  realpath,
  rm,
} from 'node:fs/promises'
import type { FileHandle } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  buildCanonicalSam31EightMinuteQualificationSourcePreparation,
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_FIXED_PROCESS_PORT_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-fixed-process-port-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PRIVATE_CHUNK_OBJECT_PORT_VERSION =
  'canonical-sam3_1-eight-minute-source-private-chunk-object-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_VERSION =
  'canonical-sam3_1-eight-minute-source-gpu-task-v1' as const
const OUTPUT_VERSION =
  'canonical-sam3_1-eight-minute-source-gpu-output-v1' as const
const SCRATCH_ROOT = '/mnt/weeditpro-private/l4-visual-evidence' as const
const PYTHON = '/opt/weeditpro/visual-evidence/venv/bin/python' as const
const RUNNER =
  '/opt/weeditpro/visual-evidence/sam3_1-source-preparation-runner.py' as const
const DEFAULT_OBJECT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/qualification-sources'
const MAXIMUM_SOURCE_BYTES = 10 * 1024 * 1024 * 1024
const MAXIMUM_CHUNK_BYTES = 2 * 1024 * 1024 * 1024
const MAXIMUM_STDOUT_BYTES = 4 * 1024 * 1024
const MAXIMUM_STDERR_BYTES = 256 * 1024
const SOURCE_FRAME_COUNT = 11_520
const SOURCE_SLICE_FRAME_COUNT = 384
const CHUNK_FRAME_COUNT = 240
const CHUNK_STRIDE_FRAME_COUNT = 239
const CHUNK_COUNT = 49

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const ffprobeSchema = z.object({
  codecName: z.literal('h264'),
  width: z.literal(3_840),
  height: z.literal(2_160),
  pixelFormat: z.literal('yuv420p'),
  averageFrameRate: z.literal('24/1'),
  decodedFrameCount: z.number().int().min(1).max(CHUNK_FRAME_COUNT),
  colorRange: z.union([z.literal('tv'), z.literal('unknown'), z.null()]),
  colorSpace: z.literal('bt709'),
  colorTransfer: z.literal('bt709'),
  colorPrimaries: z.literal('bt709'),
  metadataOnly: z.literal(true),
}).strict()

const chunkOutputSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(CHUNK_COUNT),
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  overlapWithPreviousFrames: z.union([z.literal(0), z.literal(1)]),
  fileName: z.string().regex(/^chunk-[0-9]{3}\.mp4$/u),
  byteLength: z.number().int().positive().max(MAXIMUM_CHUNK_BYTES).safe(),
  sha256,
  decodedFrameCount: z.number().int().min(1).max(CHUNK_FRAME_COUNT).safe(),
  sourceModuloStartFrameInclusive:
    z.number().int().min(0).max(SOURCE_SLICE_FRAME_COUNT - 1),
  sourceModuloEndFrameInclusive:
    z.number().int().min(0).max(SOURCE_SLICE_FRAME_COUNT - 1),
  wrapsSourceSliceBoundary: z.boolean(),
  ffprobe: ffprobeSchema,
}).strict()

const deviceSchema = z.object({
  acceleratorClass: z.literal('nvidia_l4'),
  deviceName: z.literal('NVIDIA L4'),
  deviceUuid: z.string().trim().min(1).max(240),
  driverVersion: z.string().regex(/^[0-9.]+$/u),
  pciBusId: z.string().regex(/^[A-Fa-f0-9:.]+$/u),
  allocatedGpuCount: z.literal(1),
}).strict()

const outputWithoutHashSchema = z.object({
  schemaVersion: z.literal(OUTPUT_VERSION),
  source: z.literal(
    'fixed_weeditpro_l4_sam3_1_source_preparation_runner',
  ),
  invocationId: safeId,
  qualificationSourceId: safeId,
  qualificationSourcePlanRef: refSchema,
  dispatchAdmissionRef: refSchema,
  immutableImageRef: refSchema,
  toolchainQualificationRef: refSchema,
  taskDigestSha256: sha256,
  sourceObjectSha256: sha256,
  sourceObjectByteLength: z.number().int().positive()
    .max(MAXIMUM_SOURCE_BYTES).safe(),
  sourceProbe: ffprobeSchema.extend({
    decodedFrameCount: z.literal(386),
  }).strict(),
  baseSlice: z.object({
    byteLength: z.number().int().positive().max(MAXIMUM_CHUNK_BYTES).safe(),
    sha256,
    decodedFrameCount: z.literal(SOURCE_SLICE_FRAME_COUNT),
    ffprobe: ffprobeSchema.extend({
      decodedFrameCount: z.literal(SOURCE_SLICE_FRAME_COUNT),
    }).strict(),
  }).strict(),
  device: deviceSchema,
  chunks: z.array(chunkOutputSchema).length(CHUNK_COUNT),
  preparedChunkCount: z.literal(CHUNK_COUNT),
  exactChunkCount: z.literal(CHUNK_COUNT),
  sourceFrameCount: z.literal(SOURCE_FRAME_COUNT),
  sourceDurationMilliseconds: z.literal(480_000),
  gpuDecodeProfile: z.literal('ffmpeg_cuda_nvdec_fixed_v1'),
  gpuEncodeProfile: z.literal(
    'h264_nvenc_p7_hq_constqp20_bt709_fixed_v1',
  ),
  sourceAudioRemoved: z.literal(true),
  fullSourceResolutionPreserved: z.literal(true),
  sourcePixelExactnessClaimed: z.literal(false),
  losslessEncodingClaimed: z.literal(false),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  ffprobeMetadataOnly: z.literal(true),
  runtimeModelOrToolDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  terminalCloudRunExecutionClaimed: z.literal(false),
  scaleBackToZeroClaimedByWorker: z.literal(false),
  accountEffectiveCostClaimedByWorker: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
  completedAt: timestamp,
  workerWallDurationMilliseconds:
    z.number().int().nonnegative().max(7_200_000).safe(),
}).strict().superRefine((value, context) => {
  if (!exactOutputGeometry(value.chunks)
    || Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Eight-minute source worker output is inconsistent.',
    })
  }
})

export const canonicalSam31EightMinuteSourceGpuOutputSchema =
  outputWithoutHashSchema.extend({ resultDigestSha256: sha256 }).strict()
    .superRefine((value, context) => {
      if (!exactOutputGeometry(value.chunks)) context.addIssue({
        code: 'custom',
        message: 'Eight-minute source worker chunk geometry changed.',
      })
    })
export type CanonicalSam31EightMinuteSourceGpuOutput = z.infer<
  typeof canonicalSam31EightMinuteSourceGpuOutputSchema
>

export interface CanonicalSam31EightMinuteSourcePrivateChunkObjectPort {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PRIVATE_CHUNK_OBJECT_PORT_VERSION
  publishCreateOnlyAndReread(input: {
    readonly invocationId: string
    readonly qualificationSourceId: string
    readonly qualificationSourcePlanHash: string
    readonly chunkOrdinal: number
    readonly expectedByteLength: number
    readonly expectedSha256: string
    openSourceStream(): Promise<Readable>
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly bucketName: typeof PRIVATE_GPU_BUCKET
    readonly objectName: string
    readonly generation: string
    readonly etagSha256: string
    readonly byteLength: number
    readonly sha256: string
    readonly createdWithIfGenerationMatchZero: true
    readonly exactGenerationMetadataAndBytesReread: true
  }>
}

export interface CanonicalSam31EightMinuteSourcePreparationFixedProcessPort {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_FIXED_PROCESS_PORT_VERSION
  readonly accelerator: 'nvidia_l4'
  readonly fixedServerOwnedNvdecNvencProcess: true
  readonly substantiveCpuMediaProcessingAllowed: false
  readonly runnerPathFixedByImage: true
  readonly callerPathUrlBytesCommandOrEnvironmentAccepted: false
  readonly privateScratchRemovedAfterAttempt: true
  executeExact(input: {
    readonly invocationId: string
    readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
    readonly dispatchAdmissionRef: EvidenceRef
    readonly immutableImageRef: EvidenceRef
    readonly toolchainQualificationRef: EvidenceRef
  }): Promise<{
    readonly preparation:
      CanonicalSam31EightMinuteQualificationSourcePreparation
    readonly workerOutputRef: EvidenceRef
    readonly terminalCloudRunExecutionClaimed: false
    readonly scaleBackToZeroClaimedByWorker: false
    readonly accountEffectiveCostClaimedByWorker: false
    readonly customerCreditsMutated: false
    readonly productionAuthorityGranted: false
  }>
}

export function createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort(
  input: {
    readonly storage: Storage
    readonly chunkObjectPort:
      CanonicalSam31EightMinuteSourcePrivateChunkObjectPort
  },
): CanonicalSam31EightMinuteSourcePreparationFixedProcessPort {
  if (typeof input.storage?.bucket !== 'function'
    || input.chunkObjectPort?.schemaVersion !==
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PRIVATE_CHUNK_OBJECT_PORT_VERSION
    || typeof input.chunkObjectPort.publishCreateOnlyAndReread !== 'function') {
    throw new TypeError('Eight-minute L4 source preparation port is absent.')
  }
  const port: CanonicalSam31EightMinuteSourcePreparationFixedProcessPort = {
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_FIXED_PROCESS_PORT_VERSION,
    accelerator: 'nvidia_l4' as const,
    fixedServerOwnedNvdecNvencProcess: true as const,
    substantiveCpuMediaProcessingAllowed: false as const,
    runnerPathFixedByImage: true as const,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
    privateScratchRemovedAfterAttempt: true as const,
    async executeExact(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_source_preparation_execute')
      const invocationId = safeId.parse(untrusted.invocationId)
      const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
        untrusted.plan,
      )
      const dispatchAdmissionRef = refSchema.parse(
        untrusted.dispatchAdmissionRef,
      )
      const immutableImageRef = refSchema.parse(untrusted.immutableImageRef)
      const toolchainQualificationRef = refSchema.parse(
        untrusted.toolchainQualificationRef,
      )
      assertDistinctRefs([
        dispatchAdmissionRef,
        immutableImageRef,
        toolchainQualificationRef,
      ])
      const invocationRoot = await createPrivateInvocationRoot(invocationId)
      try {
        await stageExactSource({
          storage: input.storage,
          plan,
          targetPath: join(invocationRoot, 'source.mov'),
        })
        const task = await writeTaskCreateOnly({
          invocationRoot,
          invocationId,
          plan,
          dispatchAdmissionRef,
          immutableImageRef,
          toolchainQualificationRef,
        })
        const output = parseOutput(await runFixedProcess(invocationId), {
          invocationId,
          plan,
          taskDigestSha256: task.taskDigestSha256,
          dispatchAdmissionRef,
          immutableImageRef,
          toolchainQualificationRef,
        })
        const preparedChunks = []
        for (const chunk of output.chunks) {
          const path = join(invocationRoot, 'outputs', chunk.fileName)
          await assertExactLocalChunk(path, chunk)
          const stored = await input.chunkObjectPort
            .publishCreateOnlyAndReread({
              invocationId,
              qualificationSourceId: plan.qualificationSourceId,
              qualificationSourcePlanHash: plan.planHash,
              chunkOrdinal: chunk.chunkOrdinal,
              expectedByteLength: chunk.byteLength,
              expectedSha256: chunk.sha256,
              async openSourceStream() {
                return createReadStream(path)
              },
            })
          if (stored.byteLength !== chunk.byteLength
            || stored.sha256 !== chunk.sha256) {
            throw conflict('sam31_source_preparation_object_changed')
          }
          const mapping = {
            qualificationSourcePlanRef: ref(
              plan.qualificationSourceId,
              plan.planHash,
            ),
            chunkOrdinal: chunk.chunkOrdinal,
            canonicalStartFrameInclusive:
              chunk.canonicalStartFrameInclusive,
            canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
            sourceModuloStartFrameInclusive:
              chunk.sourceModuloStartFrameInclusive,
            sourceModuloEndFrameInclusive:
              chunk.sourceModuloEndFrameInclusive,
            wrapsSourceSliceBoundary: chunk.wrapsSourceSliceBoundary,
          }
          preparedChunks.push({
            chunkOrdinal: chunk.chunkOrdinal,
            canonicalStartFrameInclusive:
              chunk.canonicalStartFrameInclusive,
            canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
            overlapWithPreviousFrames: chunk.overlapWithPreviousFrames,
            preparedChunkArtifactRef: ref(
              `${plan.qualificationSourceId}:chunk:${String(
                chunk.chunkOrdinal,
              ).padStart(3, '0')}`,
              chunk.sha256,
            ),
            exactSourceRangeMappingRef: ref(
              `${plan.qualificationSourceId}:chunk-map:${String(
                chunk.chunkOrdinal,
              ).padStart(3, '0')}`,
              sha256AuthorityValue(mapping),
            ),
            ffprobeEvidenceRef: ref(
              `${plan.qualificationSourceId}:chunk-ffprobe:${String(
                chunk.chunkOrdinal,
              ).padStart(3, '0')}`,
              sha256AuthorityValue(chunk.ffprobe),
            ),
            gpuPreparationEvidenceRef: ref(
              `${plan.qualificationSourceId}:chunk-l4-gpu:${String(
                chunk.chunkOrdinal,
              ).padStart(3, '0')}`,
              sha256AuthorityValue({
                device: output.device,
                gpuDecodeProfile: output.gpuDecodeProfile,
                gpuEncodeProfile: output.gpuEncodeProfile,
                resultDigestSha256: output.resultDigestSha256,
                chunkOrdinal: chunk.chunkOrdinal,
              }),
            ),
            privateCoordinate: {
              bucketName: stored.bucketName,
              objectName: stored.objectName,
              generation: stored.generation,
              etagSha256: stored.etagSha256,
            },
            byteLength: stored.byteLength,
            sha256: stored.sha256,
            decodedFrameCount: chunk.decodedFrameCount,
          })
        }
        const preparation =
          buildCanonicalSam31EightMinuteQualificationSourcePreparation({
            preparationId:
              `${plan.qualificationSourceId}:preparation:${invocationId}`,
            plan,
            disposition: 'ready',
            preparedChunks,
            preparedAt: output.completedAt,
          })
        return Object.freeze({
          preparation,
          workerOutputRef: ref(
            `${plan.qualificationSourceId}:worker-output:${invocationId}`,
            output.resultDigestSha256,
          ),
          terminalCloudRunExecutionClaimed: false as const,
          scaleBackToZeroClaimedByWorker: false as const,
          accountEffectiveCostClaimedByWorker: false as const,
          customerCreditsMutated: false as const,
          productionAuthorityGranted: false as const,
        })
      } finally {
        await rm(invocationRoot, { recursive: true, force: true })
      }
    },
  }
  return Object.freeze(port)
}

export function createCanonicalGcsSam31EightMinuteSourcePrivateChunkObjectPort(
  input?: {
    readonly storage?: Storage
    readonly projectId?: typeof PROJECT_ID
    readonly bucketName?: typeof PRIVATE_GPU_BUCKET
    readonly prefix?: string
  },
): CanonicalSam31EightMinuteSourcePrivateChunkObjectPort {
  const projectId = input?.projectId ?? PROJECT_ID
  const bucketName = input?.bucketName ?? PRIVATE_GPU_BUCKET
  if (projectId !== PROJECT_ID || bucketName !== PRIVATE_GPU_BUCKET) {
    throw new TypeError('Eight-minute source private storage changed.')
  }
  const storage = input?.storage ?? new Storage({ projectId })
  const prefix = safePrefix.parse(input?.prefix ?? DEFAULT_OBJECT_PREFIX)
  const port: CanonicalSam31EightMinuteSourcePrivateChunkObjectPort = {
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PRIVATE_CHUNK_OBJECT_PORT_VERSION,
    async publishCreateOnlyAndReread(untrusted) {
      if (typeof untrusted.openSourceStream !== 'function') {
        throw new TypeError('Eight-minute source chunk stream is absent.')
      }
      assertPlainSerializedData({
        invocationId: untrusted.invocationId,
        qualificationSourceId: untrusted.qualificationSourceId,
        qualificationSourcePlanHash: untrusted.qualificationSourcePlanHash,
        chunkOrdinal: untrusted.chunkOrdinal,
        expectedByteLength: untrusted.expectedByteLength,
        expectedSha256: untrusted.expectedSha256,
      }, 'sam31_source_chunk_publication')
      const invocationId = safeId.parse(untrusted.invocationId)
      const sourceId = safeId.parse(untrusted.qualificationSourceId)
      const planHash = sha256.parse(untrusted.qualificationSourcePlanHash)
      const ordinal = z.number().int().min(1).max(CHUNK_COUNT)
        .parse(untrusted.chunkOrdinal)
      const expectedByteLength = z.number().int().positive()
        .max(MAXIMUM_CHUNK_BYTES).safe().parse(untrusted.expectedByteLength)
      const expectedSha256 = sha256.parse(untrusted.expectedSha256)
      const objectName = `${prefix}/${sourceId}/${invocationId}/chunk-${String(
        ordinal,
      ).padStart(3, '0')}.mp4`
      const bucket = storage.bucket(bucketName)
      const liveFile = bucket.file(objectName)
      const metadata = {
        'weeditpro-contract': OUTPUT_VERSION,
        'weeditpro-content-sha256': expectedSha256,
        'weeditpro-plan-sha256': planHash,
        'weeditpro-chunk-ordinal': String(ordinal),
        'weeditpro-create-only': 'true',
      }
      let disposition: 'created' | 'identical_replay' = 'created'
      try {
        await pipeline(
          await untrusted.openSourceStream(),
          liveFile.createWriteStream({
            resumable: true,
            validation: 'crc32c',
            preconditionOpts: { ifGenerationMatch: 0 },
            metadata: { contentType: 'video/mp4', metadata },
          }),
        )
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw error
        disposition = 'identical_replay'
      }
      const [observed] = await liveFile.getMetadata()
      const generation = String(observed.generation ?? '')
      const etag = String(observed.etag ?? '')
      if (!/^[1-9][0-9]{0,30}$/u.test(generation) || !etag
        || Number(observed.size ?? -1) !== expectedByteLength
        || observed.contentType !== 'video/mp4'
        || stableAuthorityStringify(observed.metadata ?? {}) !==
          stableAuthorityStringify(metadata)) {
        throw conflict('sam31_source_chunk_gcs_metadata_changed')
      }
      const exactFile = bucket.file(objectName, { generation })
      const reread = await hashReadable(
        exactFile.createReadStream({ decompress: false, validation: 'crc32c' }),
        expectedByteLength,
      )
      const [stable] = await exactFile.getMetadata()
      if (reread.byteLength !== expectedByteLength
        || reread.sha256 !== expectedSha256
        || String(stable.generation ?? '') !== generation
        || String(stable.etag ?? '') !== etag
        || stableAuthorityStringify(stable.metadata ?? {}) !==
          stableAuthorityStringify(metadata)) {
        throw conflict('sam31_source_chunk_exact_generation_changed')
      }
      return Object.freeze({
        disposition,
        bucketName,
        objectName,
        generation,
        etagSha256: createHash('sha256').update(etag, 'utf8').digest('hex'),
        byteLength: reread.byteLength,
        sha256: reread.sha256,
        createdWithIfGenerationMatchZero: true as const,
        exactGenerationMetadataAndBytesReread: true as const,
      })
    },
  }
  return Object.freeze(port)
}

export function parseCanonicalSam31EightMinuteSourceGpuOutput(
  value: unknown,
): CanonicalSam31EightMinuteSourceGpuOutput {
  assertPlainSerializedData(value, 'sam31_source_preparation_gpu_output')
  const parsed = canonicalSam31EightMinuteSourceGpuOutputSchema.parse(value)
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_preparation_output_digest_changed')
  }
  return freeze(parsed)
}

async function createPrivateInvocationRoot(invocationId: string) {
  const rootStatus = await lstat(SCRATCH_ROOT).catch(() => null)
  if (!rootStatus?.isDirectory() || rootStatus.isSymbolicLink()) {
    throw notReady('sam31_source_preparation_scratch_not_mounted')
  }
  if (await realpath(SCRATCH_ROOT) !== SCRATCH_ROOT) {
    throw notReady('sam31_source_preparation_scratch_not_canonical')
  }
  const invocationRoot = join(SCRATCH_ROOT, invocationId)
  await mkdir(invocationRoot, { recursive: false, mode: 0o700 })
  if (await realpath(invocationRoot) !== invocationRoot) {
    throw conflict('sam31_source_preparation_invocation_path_changed')
  }
  for (const directory of ['home', 'tmp', 'cache']) {
    await mkdir(join(invocationRoot, directory), {
      recursive: false,
      mode: 0o700,
    })
  }
  return invocationRoot
}

async function stageExactSource(input: {
  storage: Storage
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  targetPath: string
}): Promise<void> {
  const coordinate = input.plan.exactSourceCoordinate
  const file = input.storage.bucket(coordinate.bucketName).file(
    coordinate.objectName,
    { generation: coordinate.generation },
  )
  const [before] = await file.getMetadata()
  assertSourceMetadata(before, input.plan)
  const handle = await open(input.targetPath, 'wx', 0o600)
  const digest = createHash('sha256')
  let bytes = 0
  try {
    for await (const value of file.createReadStream({ validation: 'crc32c' })) {
      const chunk = Buffer.isBuffer(value)
        ? value : Buffer.from(value as Uint8Array)
      bytes += chunk.byteLength
      if (bytes > input.plan.sourceObjectByteLength) {
        throw conflict('sam31_source_stream_exceeded_bound')
      }
      digest.update(chunk)
      await writeAll(handle, chunk)
    }
    await handle.sync()
  } finally {
    await handle.close()
  }
  if (bytes !== input.plan.sourceObjectByteLength
    || digest.digest('hex') !== input.plan.sourceObjectSha256) {
    throw conflict('sam31_source_exact_bytes_changed')
  }
  const [after] = await file.getMetadata()
  assertSourceMetadata(after, input.plan)
  if (stableAuthorityStringify(sourceIdentity(before)) !==
    stableAuthorityStringify(sourceIdentity(after))) {
    throw conflict('sam31_source_changed_during_reread')
  }
}

function assertSourceMetadata(
  metadata: Record<string, unknown>,
  plan: CanonicalSam31EightMinuteQualificationSourcePlan,
): void {
  const expected = plan.exactSourceCoordinate
  if (metadata.generation !== expected.generation
    || metadata.etag !== expected.etag
    || metadata.crc32c !== expected.crc32c
    || metadata.md5Hash !== expected.md5Hash
    || metadata.contentType !== expected.contentType
    || metadata.size !== String(plan.sourceObjectByteLength)) {
    throw conflict('sam31_source_gcs_identity_changed')
  }
}

function sourceIdentity(metadata: Record<string, unknown>) {
  return {
    generation: metadata.generation,
    etag: metadata.etag,
    crc32c: metadata.crc32c,
    md5Hash: metadata.md5Hash,
    contentType: metadata.contentType,
    size: metadata.size,
  }
}

async function writeTaskCreateOnly(input: {
  invocationRoot: string
  invocationId: string
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  dispatchAdmissionRef: EvidenceRef
  immutableImageRef: EvidenceRef
  toolchainQualificationRef: EvidenceRef
}) {
  const taskWithoutHash = {
    schemaVersion: TASK_VERSION,
    invocationId: input.invocationId,
    qualificationSourceId: input.plan.qualificationSourceId,
    qualificationSourcePlanRef: ref(
      input.plan.qualificationSourceId,
      input.plan.planHash,
    ),
    dispatchAdmissionRef: input.dispatchAdmissionRef,
    immutableImageRef: input.immutableImageRef,
    toolchainQualificationRef: input.toolchainQualificationRef,
    source: {
      sha256: input.plan.sourceObjectSha256,
      byteLength: input.plan.sourceObjectByteLength,
      width: input.plan.sourceObjectWidth,
      height: input.plan.sourceObjectHeight,
      decodedFrameCount: input.plan.sourceObjectFrameCount,
      fpsNumerator: input.plan.sourceObjectFpsNumerator,
      fpsDenominator: input.plan.sourceObjectFpsDenominator,
      sliceStartFrameInclusive: input.plan.sourceSliceStartFrameInclusive,
      sliceEndFrameInclusive: input.plan.sourceSliceEndFrameInclusive,
    },
    sequence: {
      sourceFrameCount: input.plan.sourceFrameCount,
      sourceDurationMilliseconds: input.plan.sourceDurationMilliseconds,
      repetitionCount: input.plan.repeatedSequenceCount,
    },
    chunks: deriveChunks(),
    policy: {
      acceleratorClass: 'nvidia_l4',
      allocatedGpuCount: 1,
      ffprobeMetadataOnly: true,
      ffmpegNvdecAndNvencRequired: true,
      sourceAudioRemoved: true,
      sourceResolutionReductionAllowed: false,
      fullSourceResolutionPreserved: true,
      hardwareEncodedQualificationProxy: true,
      sourcePixelExactnessClaimAllowed: false,
      losslessEncodingClaimAllowed: false,
      substantiveCpuMediaProcessingAllowed: false,
      runtimeModelOrToolDownloadAllowed: false,
      callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    },
  } as const
  const task = {
    ...taskWithoutHash,
    taskDigestSha256: sha256AuthorityValue(taskWithoutHash),
  }
  const handle = await open(join(input.invocationRoot, 'task.json'), 'wx', 0o600)
  try {
    await handle.writeFile(stableAuthorityStringify(task), 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  return task
}

async function runFixedProcess(invocationId: string): Promise<unknown> {
  const result = await new Promise<{
    exitCode: number
    stdout: Buffer
    timedOut: boolean
    overflow: boolean
  }>((resolve, reject) => {
    const child = spawn(PYTHON, ['-I', '-B', RUNNER], {
      cwd: '/nonexistent',
      env: fixedEnvironment(invocationId),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    let overflow = false
    let timedOut = false
    let settled = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, 7_200_000)
    timer.unref()
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes > MAXIMUM_STDOUT_BYTES) {
        overflow = true
        child.kill('SIGKILL')
      } else stdout.push(Buffer.from(chunk))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > MAXIMUM_STDERR_BYTES) {
        overflow = true
        child.kill('SIGKILL')
      }
    })
    child.once('error', () => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      reject(notReady('sam31_source_preparation_process_unavailable'))
    })
    child.once('close', (exitCode) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout),
        timedOut,
        overflow,
      })
    })
  })
  if (result.exitCode !== 0 || result.timedOut || result.overflow) {
    throw notReady('sam31_source_preparation_fixed_process_failed')
  }
  if (result.stdout.byteLength < 2) {
    throw conflict('sam31_source_preparation_result_missing')
  }
  try {
    return JSON.parse(result.stdout.toString('utf8')) as unknown
  } catch {
    throw conflict('sam31_source_preparation_result_json_invalid')
  }
}

function fixedEnvironment(invocationId: string): NodeJS.ProcessEnv {
  const root = `${SCRATCH_ROOT}/${invocationId}`
  return {
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: `${root}/home`,
    TMPDIR: `${root}/tmp`,
    XDG_CACHE_HOME: `${root}/cache`,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    PYTHONHASHSEED: '0',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    PIP_NO_INDEX: '1',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    CUDA_VISIBLE_DEVICES: '0',
    NVIDIA_VISIBLE_DEVICES: '0',
    NVIDIA_DRIVER_CAPABILITIES: 'compute,utility,video',
    LD_LIBRARY_PATH:
      '/usr/local/cuda/lib64:/usr/local/cuda/compat:'
      + '/usr/local/nvidia/lib64:/usr/local/nvidia/lib',
    WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID: invocationId,
  }
}

function parseOutput(value: unknown, expected: {
  invocationId: string
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  taskDigestSha256: string
  dispatchAdmissionRef: EvidenceRef
  immutableImageRef: EvidenceRef
  toolchainQualificationRef: EvidenceRef
}) {
  const output = parseCanonicalSam31EightMinuteSourceGpuOutput(value)
  if (output.invocationId !== expected.invocationId
    || output.qualificationSourceId !== expected.plan.qualificationSourceId
    || output.qualificationSourcePlanRef.contentHash !==
      `sha256:${expected.plan.planHash}`
    || output.taskDigestSha256 !== expected.taskDigestSha256
    || !sameRef(output.dispatchAdmissionRef, expected.dispatchAdmissionRef)
    || !sameRef(output.immutableImageRef, expected.immutableImageRef)
    || !sameRef(output.toolchainQualificationRef,
      expected.toolchainQualificationRef)
    || output.sourceObjectSha256 !== expected.plan.sourceObjectSha256
    || output.sourceObjectByteLength !== expected.plan.sourceObjectByteLength) {
    throw conflict('sam31_source_preparation_output_lineage_changed')
  }
  return output
}

async function assertExactLocalChunk(
  path: string,
  chunk: z.infer<typeof chunkOutputSchema>,
): Promise<void> {
  const before = await lstat(path)
  if (!before.isFile() || before.isSymbolicLink()
    || before.size !== chunk.byteLength) {
    throw conflict('sam31_source_preparation_local_chunk_invalid')
  }
  const reread = await hashReadable(createReadStream(path), chunk.byteLength)
  const after = await lstat(path)
  if (reread.byteLength !== chunk.byteLength || reread.sha256 !== chunk.sha256
    || after.dev !== before.dev || after.ino !== before.ino
    || after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
    throw conflict('sam31_source_preparation_local_chunk_changed')
  }
}

function deriveChunks() {
  return Array.from({ length: CHUNK_COUNT }, (_, index) => {
    const start = index * CHUNK_STRIDE_FRAME_COUNT
    return {
      chunkOrdinal: index + 1,
      canonicalStartFrameInclusive: start,
      canonicalEndFrameInclusive: Math.min(
        SOURCE_FRAME_COUNT - 1,
        start + CHUNK_FRAME_COUNT - 1,
      ),
      overlapWithPreviousFrames: index === 0 ? 0 as const : 1 as const,
    }
  })
}

function exactOutputGeometry(
  chunks: ReadonlyArray<z.infer<typeof chunkOutputSchema>>,
): boolean {
  return chunks.length === CHUNK_COUNT && chunks.every((chunk, index) => {
    const start = index * CHUNK_STRIDE_FRAME_COUNT
    const end = Math.min(SOURCE_FRAME_COUNT - 1,
      start + CHUNK_FRAME_COUNT - 1)
    return chunk.chunkOrdinal === index + 1
      && chunk.fileName === `chunk-${String(index + 1).padStart(3, '0')}.mp4`
      && chunk.canonicalStartFrameInclusive === start
      && chunk.canonicalEndFrameInclusive === end
      && chunk.overlapWithPreviousFrames === (index === 0 ? 0 : 1)
      && chunk.decodedFrameCount === end - start + 1
      && chunk.sourceModuloStartFrameInclusive ===
        start % SOURCE_SLICE_FRAME_COUNT
      && chunk.sourceModuloEndFrameInclusive ===
        end % SOURCE_SLICE_FRAME_COUNT
      && chunk.wrapsSourceSliceBoundary ===
        (Math.floor(start / SOURCE_SLICE_FRAME_COUNT) !==
          Math.floor(end / SOURCE_SLICE_FRAME_COUNT))
      && chunk.ffprobe.decodedFrameCount === chunk.decodedFrameCount
  })
}

async function hashReadable(stream: Readable, bound: number) {
  const digest = createHash('sha256')
  let byteLength = 0
  for await (const value of stream) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    byteLength += chunk.byteLength
    if (byteLength > bound) {
      throw conflict('sam31_source_chunk_reread_exceeded_bound')
    }
    digest.update(chunk)
  }
  return { byteLength, sha256: digest.digest('hex') }
}

async function writeAll(handle: FileHandle, bytes: Buffer): Promise<void> {
  let offset = 0
  while (offset < bytes.byteLength) {
    const result = await handle.write(
      bytes,
      offset,
      bytes.byteLength - offset,
    )
    if (result.bytesWritten < 1) {
      throw conflict('sam31_source_private_write_failed')
    }
    offset += result.bytesWritten
  }
}

function assertDistinctRefs(refs: EvidenceRef[]): void {
  if (new Set(refs.map((value) => stableAuthorityStringify(value))).size !==
    refs.length) {
    throw conflict('sam31_source_preparation_refs_aliased')
  }
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

function cloudErrorCode(error: unknown): number | string | undefined {
  if (!error || typeof error !== 'object') return undefined
  return (error as { code?: number | string }).code
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The fixed L4 SAM 3.1 source preparation conflicts with canonical authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The fixed L4 SAM 3.1 source preparation is not ready.',
    503,
    { requiredGate },
  )
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
