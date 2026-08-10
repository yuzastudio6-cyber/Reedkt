import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { Storage, type File, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuJobLaunch,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  CANONICAL_SAM3_1_PRIVATE_OUTPUT_REREAD_EVIDENCE_VERSION,
  canonicalSam31PrivateOutputRereadEvidenceSchema,
  type CanonicalSam31PrivateOutputRereadPort,
} from './canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
} from './canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
} from './canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_GCS_PRIVATE_OUTPUT_READER_VERSION =
  'canonical-sam3_1-gcs-private-output-reader-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_RESPONSE_BYTES = 64 * 1024
const MAXIMUM_MANIFEST_BYTES = 64 * 1024 * 1024
const MAXIMUM_MASK_BYTES = 512 * 1024 * 1024
const MAXIMUM_MASK_FILES = 240 * 16
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const normalized = z.number().finite().min(0).max(1)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const maskFileName = z.string().regex(
  /^frame-[0-9]{6}-object-[0-9]{6}\.png$/u,
)
const manifestMaskSchema = z.object({
  frameIndex: nonnegativeInteger,
  objectId: nonnegativeInteger,
  relativeFileName: maskFileName,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  byteLength: positiveInteger.max(MAXIMUM_MASK_BYTES),
  sha256,
}).strict()
const manifestObjectSchema = z.object({
  objectId: nonnegativeInteger,
  normalizedBoxXywh: z.tuple([
    normalized, normalized, normalized, normalized,
  ]),
  maskSha256: sha256,
}).strict()
const manifestFrameSchema = z.object({
  frameIndex: nonnegativeInteger,
  objects: z.array(manifestObjectSchema).max(16),
}).strict()
const manifestSchema = z.object({
  schemaVersion: z.literal('canonical-sam3_1-mask-sequence-manifest-v1'),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  requestBindingSha256: sha256,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  firstFrameIndex: nonnegativeInteger,
  lastFrameIndex: nonnegativeInteger,
  frames: z.array(manifestFrameSchema).min(1).max(240),
  masks: z.array(manifestMaskSchema).min(1).max(MAXIMUM_MASK_FILES),
}).strict()

export function createCanonicalSam31GcsPrivateOutputRereadPort(input: {
  readonly storage?: Storage
  readonly projectId: string
  readonly bucketName: string
  readonly prefix?: string
  readonly now?: () => string
}): CanonicalSam31PrivateOutputRereadPort {
  const projectId = safeId.parse(input.projectId)
  const bucketName = z.string().regex(
    /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u,
  ).parse(input.bucketName)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const storage = input.storage ?? new Storage({ projectId })
  const bucket = storage.bucket(bucketName)
  const now = input.now ?? (() => new Date().toISOString())

  return Object.freeze({
    async rereadExactPrivateOutput(untrusted: Parameters<
      CanonicalSam31PrivateOutputRereadPort['rereadExactPrivateOutput']
    >[0]) {
      const task = assertCanonicalSam31GpuTaskRecord(untrusted.task)
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: untrusted.response,
      })
      const launch = assertCanonicalProfessionalGpuJobLaunch(untrusted.launch)
      assertLaunchAndCompletedResponse({ task, response, launch })
      const invocationRoot = `${prefix}/${task.invocationId}`
      const outputRoot = `${invocationRoot}/sam3_1-mask-sequence`

      const responseObject = await readStableObject({
        file: bucket.file(`${invocationRoot}/response.json`),
        minimumBytes: 2,
        maximumBytes: MAXIMUM_RESPONSE_BYTES,
      })
      const decodedResponse = parseJson(responseObject.body,
        'SAM 3.1 runtime response')
      const exactResponse = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: decodedResponse,
      })
      if (stableAuthorityStringify(exactResponse) !==
        stableAuthorityStringify(response)
        || responseObject.body.toString('utf8') !==
          stableAuthorityStringify(response)) {
        throw new Error('SAM 3.1 exact runtime response bytes changed.')
      }

      const manifestObject = await readStableObject({
        file: bucket.file(`${outputRoot}/manifest.json`),
        minimumBytes: 2,
        maximumBytes: MAXIMUM_MANIFEST_BYTES,
      })
      const manifest = manifestSchema.parse(parseJson(
        manifestObject.body,
        'SAM 3.1 mask manifest',
      ))
      assertManifestLineage({ task, response, manifest })
      const manifestHash = rawSha256(manifestObject.body)
      if (manifestHash !== response.outputSummary!.manifestSha256
        || manifestObject.body.byteLength < 1
        || manifestObject.body.toString('utf8') !==
          stableAuthorityStringify(manifest)) {
        throw new Error('SAM 3.1 exact manifest bytes changed.')
      }

      const expectedNames = new Set([
        'manifest.json',
        ...manifest.masks.map((mask) => mask.relativeFileName),
      ])
      const [files] = await bucket.getFiles({
        prefix: `${outputRoot}/`,
        maxResults: MAXIMUM_MASK_FILES + 2,
        autoPaginate: true,
      })
      const observedNames = files.map((file) => exactRelativeName(
        file.name,
        `${outputRoot}/`,
      ))
      if (observedNames.length !== expectedNames.size
        || new Set(observedNames).size !== observedNames.length
        || observedNames.some((name) => !expectedNames.has(name))) {
        throw new Error(
          'SAM 3.1 private output contains missing or unexpected files.',
        )
      }

      let combinedMaskByteLength = 0
      for (const mask of manifest.masks) {
        const object = await readStableObject({
          file: bucket.file(`${outputRoot}/${mask.relativeFileName}`),
          minimumBytes: 1,
          maximumBytes: Math.min(MAXIMUM_MASK_BYTES,
            maximumLosslessMaskBytes(mask.width, mask.height)),
        })
        if (object.body.byteLength !== mask.byteLength
          || rawSha256(object.body) !== mask.sha256) {
          throw new Error('SAM 3.1 mask bytes differ from the manifest.')
        }
        decodeExactGrayscaleMaskPng(object.body, mask.width, mask.height)
        combinedMaskByteLength += object.body.byteLength
        if (!Number.isSafeInteger(combinedMaskByteLength)) {
          throw new Error('SAM 3.1 combined mask byte length overflowed.')
        }
      }

      const distinctObjectIds = [...new Set(
        manifest.masks.map((mask) => mask.objectId),
      )].sort((left, right) => left - right)
      const rereadAt = z.string().datetime({ offset: true }).parse(now())
      const payload = {
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_OUTPUT_REREAD_EVIDENCE_VERSION,
        source: 'canonical_server_sam3_1_private_output_reader' as const,
        evidenceClass: 'canonical_private_reread' as const,
        taskRef: ref(task.taskId, task.taskRecordHash),
        runtimeResponseObjectRef: ref(
          `sam31-runtime-response:${task.invocationId}`,
          rawSha256(responseObject.body),
        ),
        runtimeResponseBindingSha256: response.responseBindingSha256,
        manifestRef: response.outputSummary!.manifestRef,
        manifestSha256: manifestHash,
        manifestByteLength: manifestObject.body.byteLength,
        maskSequenceArtifactRef: ref(
          `sam31-mask-sequence:${task.runtimeRequest.scope.executionAttemptRef.id}`,
          manifestHash,
        ),
        maskFileCount: manifest.masks.length,
        combinedMaskByteLength,
        width: manifest.width,
        height: manifest.height,
        firstFrameIndex: manifest.firstFrameIndex,
        lastFrameIndex: manifest.lastFrameIndex,
        propagatedFrameCount: manifest.frames.length,
        distinctObjectIds,
        responseCreateOnlyPersistenceVerified: true as const,
        exactResponseBytesReread: true as const,
        exactManifestBytesRereadAndParsed: true as const,
        everyMaskPngByteHashReread: true as const,
        everyMaskPngDecodedDimensionsMatchSource: true as const,
        completeApprovedFrameIntervalCoverageVerified: true as const,
        noUnexpectedFilesOrCrossInvocationArtifacts: true as const,
        sourceCheckpointOrTaskBytesMutated: false as const,
        pathsUrlsCredentialsOrMediaBytesIncluded: false as const,
        qaApproved: false as const,
        assetManifestMutated: false as const,
        customerCreditsMutated: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        rereadAt,
      }
      return Object.freeze(canonicalSam31PrivateOutputRereadEvidenceSchema
        .parse({
          ...payload,
          evidenceHash: sha256AuthorityValue(payload),
        }))
    },
  })
}

function assertLaunchAndCompletedResponse(input: {
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  response: ReturnType<typeof assertCanonicalSam31GpuRuntimeResponse>
  launch: ReturnType<typeof assertCanonicalProfessionalGpuJobLaunch>
}): void {
  if (input.response.status !== 'completed'
    || input.response.outputSummary === null
    || input.launch.launchDisposition !== 'job_created'
    || input.launch.cloudJobExecutionRef === null
    || input.launch.toolId !== 'sam3_1'
    || input.launch.operationId !== input.response.operationId
    || input.launch.routeId !== 'a100_80gb_heavy_primary'
    || input.launch.accelerator !== 'nvidia_a100_80gb'
    || input.launch.executionEnvelopeRef.id !== input.task.invocationId) {
    throw new Error('SAM 3.1 output reread lacks its completed A100 launch.')
  }
}

function assertManifestLineage(input: {
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  response: ReturnType<typeof assertCanonicalSam31GpuRuntimeResponse>
  manifest: z.infer<typeof manifestSchema>
}): void {
  const source = input.task.runtimeRequest.sourceMedia
  const output = input.response.outputSummary!
  const frames = input.manifest.frames
  const masks = input.manifest.masks
  const frameIndexes = frames.map((frame) => frame.frameIndex)
  const distinctObjectIds = [...new Set(
    masks.map((mask) => mask.objectId),
  )].sort((left, right) => left - right)
  const maskKeys = masks.map((mask) =>
    `${mask.frameIndex}:${mask.objectId}:${mask.relativeFileName}`)
  const maskByFrameObject = new Map(masks.map((mask) => [
    `${mask.frameIndex}:${mask.objectId}`,
    mask,
  ]))
  const referencedMaskKeys: string[] = []
  for (const frame of frames) {
    for (const object of frame.objects) {
      const mask = maskByFrameObject.get(
        `${frame.frameIndex}:${object.objectId}`,
      )
      if (!mask || mask.sha256 !== object.maskSha256) {
        throw new Error('SAM 3.1 frame-to-mask manifest binding changed.')
      }
      referencedMaskKeys.push(`${frame.frameIndex}:${object.objectId}`)
    }
  }
  if (input.manifest.requestBindingSha256 !==
      input.task.runtimeRequest.requestBindingSha256
    || stableAuthorityStringify(input.manifest.sourceFrameRangeMappingRef) !==
      stableAuthorityStringify(source.sourceFrameRangeMappingRef)
    || input.manifest.width !== source.width
    || input.manifest.height !== source.height
    || input.manifest.firstFrameIndex !== source.selectedStartFrameInclusive
    || input.manifest.lastFrameIndex !== source.selectedEndFrameInclusive
    || frames.length !== source.decodedFrameCount
    || output.propagatedFrameCount !== frames.length
    || output.losslessMaskPngCount !== masks.length
    || output.manifestRef.contentHash !==
      `sha256:${output.manifestSha256}`
    || stableAuthorityStringify(output.distinctObjectIds) !==
      stableAuthorityStringify(distinctObjectIds)
    || frameIndexes.some((frame, index) =>
      frame !== input.manifest.firstFrameIndex + index)
    || new Set(maskKeys).size !== maskKeys.length
    || new Set(referencedMaskKeys).size !== masks.length
    || masks.some((mask, index) => index > 0
      && compareMask(masks[index - 1]!, mask) >= 0)
    || masks.some((mask) => mask.width !== source.width
      || mask.height !== source.height
      || mask.frameIndex < input.manifest.firstFrameIndex
      || mask.frameIndex > input.manifest.lastFrameIndex
      || mask.relativeFileName !==
        `frame-${String(mask.frameIndex).padStart(6, '0')}`
        + `-object-${String(mask.objectId).padStart(6, '0')}.png`)) {
    throw new Error('SAM 3.1 manifest differs from its task or response.')
  }
}

function decodeExactGrayscaleMaskPng(
  bytes: Buffer,
  expectedWidth: number,
  expectedHeight: number,
): void {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (bytes.byteLength < 8 || !bytes.subarray(0, 8).equals(signature)) {
    throw new Error('SAM 3.1 mask is not a PNG.')
  }
  let offset = 8
  let width = 0
  let height = 0
  let ihdrSeen = false
  let iendSeen = false
  const idat: Buffer[] = []
  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) throw new Error('PNG is truncated.')
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > bytes.byteLength) throw new Error('PNG is truncated.')
    const crcExpected = bytes.readUInt32BE(dataEnd)
    const crcActual = crc32(bytes.subarray(offset + 4, dataEnd))
    if (crcActual !== crcExpected) throw new Error('PNG CRC is invalid.')
    const data = bytes.subarray(dataStart, dataEnd)
    if (type === 'IHDR') {
      if (ihdrSeen || offset !== 8 || length !== 13) {
        throw new Error('PNG IHDR is invalid.')
      }
      ihdrSeen = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (width !== expectedWidth || height !== expectedHeight
        || data[8] !== 8 || data[9] !== 0 || data[10] !== 0
        || data[11] !== 0 || data[12] !== 0) {
        throw new Error('PNG is not exact 8-bit non-interlaced grayscale.')
      }
    } else if (type === 'IDAT') {
      if (!ihdrSeen || iendSeen) throw new Error('PNG IDAT order is invalid.')
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (length !== 0 || iendSeen || dataEnd + 4 !== bytes.byteLength) {
        throw new Error('PNG IEND is invalid.')
      }
      iendSeen = true
    } else if ((bytes[offset + 4]! & 0x20) === 0) {
      throw new Error('PNG contains an unsupported critical chunk.')
    }
    offset = dataEnd + 4
  }
  if (!ihdrSeen || !iendSeen || idat.length === 0) {
    throw new Error('PNG required chunks are missing.')
  }
  const scanlineBytes = width + 1
  const maximum = scanlineBytes * height
  if (!Number.isSafeInteger(maximum) || maximum < 1
    || maximum > MAXIMUM_MASK_BYTES) throw new Error('PNG dimensions overflow.')
  const decoded = inflateSync(Buffer.concat(idat), { maxOutputLength: maximum })
  if (decoded.byteLength !== maximum) throw new Error('PNG pixels are partial.')
  const prior = Buffer.alloc(width)
  const row = Buffer.alloc(width)
  for (let y = 0; y < height; y += 1) {
    const start = y * scanlineBytes
    const filter = decoded[start]!
    if (filter > 4) throw new Error('PNG filter is invalid.')
    for (let x = 0; x < width; x += 1) {
      const raw = decoded[start + 1 + x]!
      const left = x === 0 ? 0 : row[x - 1]!
      const up = prior[x]!
      const upperLeft = x === 0 ? 0 : prior[x - 1]!
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
          : filter === 2 ? raw + up
            : filter === 3 ? raw + Math.floor((left + up) / 2)
              : raw + paeth(left, up, upperLeft)
      row[x] = value & 0xff
      if (row[x] !== 0 && row[x] !== 255) {
        throw new Error('SAM 3.1 mask PNG contains a non-binary pixel.')
      }
    }
    row.copy(prior)
  }
}

async function readStableObject(input: {
  file: File
  minimumBytes: number
  maximumBytes: number
}): Promise<{ body: Buffer, metadata: FileMetadata }> {
  let before: FileMetadata
  try { [before] = await input.file.getMetadata() } catch (error) {
    if (cloudErrorCode(error) === 404) {
      throw new Error('GCS object is missing.', { cause: error })
    }
    throw error
  }
  const generation = String(before.generation ?? '')
  const etag = String(before.etag ?? '')
  const size = Number(before.size ?? -1)
  if (!/^[1-9][0-9]{0,30}$/u.test(generation) || !etag
    || !Number.isSafeInteger(size) || size < input.minimumBytes
    || size > input.maximumBytes) throw new Error('GCS object metadata is invalid.')
  const exact = input.file.bucket.file(input.file.name, { generation })
  const [body] = await exact.download({ validation: 'crc32c' })
  const [after] = await exact.getMetadata()
  if (body.byteLength !== size
    || String(after.generation ?? '') !== generation
    || String(after.etag ?? '') !== etag) {
    throw new Error('GCS object identity changed during reread.')
  }
  return { body, metadata: after }
}

function maximumLosslessMaskBytes(width: number, height: number): number {
  const raw = (width + 1) * height
  if (!Number.isSafeInteger(raw) || raw < 1) throw new Error('Mask overflow.')
  return Math.min(MAXIMUM_MASK_BYTES, Math.max(1024, raw + 1024 * 1024))
}

function exactRelativeName(name: string, prefix: string): string {
  if (!name.startsWith(prefix)) throw new Error('GCS output prefix changed.')
  const relative = name.slice(prefix.length)
  if (relative.includes('/') || relative.includes('..') || !relative) {
    throw new Error('GCS output object name is unsafe.')
  }
  return relative
}

function compareMask(
  left: z.infer<typeof manifestMaskSchema>,
  right: z.infer<typeof manifestMaskSchema>,
): number {
  return left.frameIndex - right.frameIndex
    || left.objectId - right.objectId
    || utf16Compare(left.relativeFileName, right.relativeFileName)
}

function utf16Compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function paeth(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  return leftDistance <= upDistance && leftDistance <= upperLeftDistance
    ? left : upDistance <= upperLeftDistance ? up : upperLeft
}

function parseJson(body: Buffer, label: string): unknown {
  try { return JSON.parse(body.toString('utf8')) as unknown } catch (error) {
    throw new Error(`${label} JSON is invalid.`, { cause: error })
  }
}

function normalizePrefix(value: string): string {
  const normalizedValue = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalizedValue || normalizedValue.length > 512
    || normalizedValue.includes('..') || normalizedValue.includes('\\')
    || normalizedValue.includes('//')) throw new Error('GCS prefix is invalid.')
  return normalizedValue
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id, version: 1, contentHash: `sha256:${hash}`,
  })
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}

const CRC_TABLE = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1
      ? 0xedb88320 ^ (value >>> 1)
      : value >>> 1
  }
  CRC_TABLE[index] = value >>> 0
}

function crc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value = CRC_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}
