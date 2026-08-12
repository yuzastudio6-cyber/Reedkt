import { createHash } from 'node:crypto'

import { Storage, type File, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31PrivateOutputRereadEvidence,
} from './canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  type CanonicalSam31GpuRuntimeResponse,
} from './canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskRecord,
} from './canonical-sam3_1-gpu-task-owner-service'
import {
  decodeCanonicalSam31ExactGrayscaleMaskPng,
} from './canonical-sam3_1-gcs-private-output-reader'

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_MANIFEST_BYTES = 64 * 1024 * 1024
const MAXIMUM_MASK_FILES = 240 * 16
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const integer = z.number().int().nonnegative().safe()
const positive = z.number().int().positive().safe()
const normalized = z.number().finite().min(0).max(1)
const refSchema = z.object({
  id: safeId,
  version: positive,
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const frameSchema = z.object({
  frameIndex: integer,
  objects: z.array(z.object({
    objectId: integer,
    normalizedBoxXywh: z.tuple([
      normalized, normalized, normalized, normalized,
    ]),
    maskSha256: sha256,
  }).strict()).max(16),
}).strict()
const maskSchema = z.object({
  frameIndex: integer,
  objectId: integer,
  relativeFileName: z.string().regex(
    /^frame-[0-9]{6}-object-[0-9]{6}\.png$/u,
  ),
  width: positive.max(16_384),
  height: positive.max(16_384),
  byteLength: positive.max(512 * 1024 * 1024),
  sha256,
}).strict()
const manifestSchema = z.object({
  schemaVersion: z.literal('canonical-sam3_1-mask-sequence-manifest-v1'),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  requestBindingSha256: sha256,
  sourceFrameRangeMappingRef: refSchema,
  width: positive.max(16_384),
  height: positive.max(16_384),
  firstFrameIndex: integer,
  lastFrameIndex: integer,
  frames: z.array(frameSchema).min(1).max(240),
  masks: z.array(maskSchema).min(1).max(MAXIMUM_MASK_FILES),
}).strict()

export interface CanonicalSam31ServingSemanticManifestEvidence {
  readonly schemaVersion:
    'canonical-sam3_1-serving-semantic-manifest-evidence-v1'
  readonly taskRef: AuthorityRef
  readonly manifestRef: AuthorityRef
  readonly semanticMaskSetDigestSha256: string
  readonly propagatedFrameCount: number
  readonly maskFileCount: number
  readonly exactManifestBytesReread: true
  readonly exactCompletedServingOutputEvidenceBound: true
}

interface AuthorityRef {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}

export interface CanonicalSam31ServingSemanticManifestRereadPort {
  rereadExactServingSemanticManifest(input: {
    readonly task: CanonicalSam31GpuTaskRecord
    readonly response: CanonicalSam31GpuRuntimeResponse
    readonly outputEvidence: CanonicalSam31PrivateOutputRereadEvidence
  }): Promise<CanonicalSam31ServingSemanticManifestEvidence>
}

export interface CanonicalSam31DecodedSemanticMaskSet {
  readonly invocationId: string
  readonly manifestRef: AuthorityRef
  readonly semanticMaskSetDigestSha256: string
  readonly geometryProjection: CanonicalSam31SemanticGeometryProjection
  readonly masks: readonly {
    readonly frameIndex: number
    readonly objectId: number
    readonly width: number
    readonly height: number
    readonly sha256: string
    readonly pixels: Buffer
  }[]
}

export interface CanonicalSam31SemanticGeometryProjection {
  readonly width: number
  readonly height: number
  readonly firstFrameIndex: number
  readonly lastFrameIndex: number
  readonly frames: readonly {
    readonly frameIndex: number
    readonly objects: readonly {
      readonly objectId: number
      readonly normalizedBoxXywh: readonly [number, number, number, number]
    }[]
  }[]
  readonly masks: readonly {
    readonly frameIndex: number
    readonly objectId: number
    readonly width: number
    readonly height: number
  }[]
}

export async function rereadCanonicalSam31DecodedSemanticMaskSet(input: {
  readonly storage: Storage
  readonly bucketName: string
  readonly invocationId: string
  readonly expectedManifestRef: AuthorityRef
  readonly expectedSemanticMaskSetDigestSha256: string
  readonly prefix?: string
}): Promise<CanonicalSam31DecodedSemanticMaskSet> {
  const invocationId = safeId.parse(input.invocationId)
  const manifestRef = refSchema.parse(input.expectedManifestRef)
  const expectedSemanticDigest = sha256.parse(
    input.expectedSemanticMaskSetDigestSha256,
  )
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const bucket = input.storage.bucket(input.bucketName)
  const outputRoot = `${prefix}/${invocationId}/sam3_1-mask-sequence`
  const manifestBytes = await readStableObject({
    file: bucket.file(`${outputRoot}/manifest.json`),
    minimumBytes: 2,
    maximumBytes: MAXIMUM_MANIFEST_BYTES,
  })
  const manifest = manifestSchema.parse(parseJson(manifestBytes))
  const manifestSha256 = rawSha256(manifestBytes)
  const semanticProjection = {
    width: manifest.width,
    height: manifest.height,
    firstFrameIndex: manifest.firstFrameIndex,
    lastFrameIndex: manifest.lastFrameIndex,
    frames: manifest.frames,
    masks: manifest.masks.map((mask) => ({
      frameIndex: mask.frameIndex,
      objectId: mask.objectId,
      width: mask.width,
      height: mask.height,
      sha256: mask.sha256,
    })),
  }
  const semanticDigest = rawSha256(Buffer.from(
    stableAuthorityStringify(semanticProjection),
    'utf8',
  ))
  if (manifestRef.contentHash !== `sha256:${manifestSha256}`
    || semanticDigest !== expectedSemanticDigest) {
    throw new Error('SAM 3.1 decoded mask-set authority changed.')
  }
  const decoded: CanonicalSam31DecodedSemanticMaskSet['masks'][number][] = []
  for (let offset = 0; offset < manifest.masks.length; offset += 16) {
    decoded.push(...await Promise.all(manifest.masks
      .slice(offset, offset + 16)
      .map(async (mask) => {
        const bytes = await readStableObject({
          file: bucket.file(`${outputRoot}/${mask.relativeFileName}`),
          minimumBytes: 1,
          maximumBytes: 512 * 1024 * 1024,
        })
        if (bytes.byteLength !== mask.byteLength
          || rawSha256(bytes) !== mask.sha256) {
          throw new Error('SAM 3.1 decoded mask bytes changed.')
        }
        return {
          frameIndex: mask.frameIndex,
          objectId: mask.objectId,
          width: mask.width,
          height: mask.height,
          sha256: mask.sha256,
          pixels: decodeCanonicalSam31ExactGrayscaleMaskPng(
            bytes,
            mask.width,
            mask.height,
          ),
        }
      })))
  }
  return Object.freeze({
    invocationId,
    manifestRef,
    semanticMaskSetDigestSha256: semanticDigest,
    geometryProjection: {
      width: manifest.width,
      height: manifest.height,
      firstFrameIndex: manifest.firstFrameIndex,
      lastFrameIndex: manifest.lastFrameIndex,
      frames: manifest.frames.map((frame) => ({
        frameIndex: frame.frameIndex,
        objects: frame.objects.map((object) => ({
          objectId: object.objectId,
          normalizedBoxXywh: object.normalizedBoxXywh,
        })),
      })),
      masks: manifest.masks.map((mask) => ({
        frameIndex: mask.frameIndex,
        objectId: mask.objectId,
        width: mask.width,
        height: mask.height,
      })),
    },
    masks: decoded,
  })
}

export function createCanonicalSam31GcsServingSemanticManifestRereadPort(
  input: {
    readonly storage?: Storage
    readonly projectId: string
    readonly bucketName: string
    readonly prefix?: string
  },
): CanonicalSam31ServingSemanticManifestRereadPort {
  const projectId = safeId.parse(input.projectId)
  const bucketName = z.string().regex(
    /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u,
  ).parse(input.bucketName)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const storage = input.storage ?? new Storage({ projectId })
  const bucket = storage.bucket(bucketName)
  return Object.freeze({
    async rereadExactServingSemanticManifest(untrusted: {
      readonly task: CanonicalSam31GpuTaskRecord
      readonly response: CanonicalSam31GpuRuntimeResponse
      readonly outputEvidence: CanonicalSam31PrivateOutputRereadEvidence
    }) {
      const task = assertCanonicalSam31GpuTaskRecord(untrusted.task)
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: untrusted.response,
      })
      const outputEvidence = assertCanonicalSam31PrivateOutputRereadEvidence(
        untrusted.outputEvidence,
      )
      const manifestObject = await readStableObject({
        file: bucket.file(`${prefix}/${task.invocationId}`
          + '/sam3_1-mask-sequence/manifest.json'),
        minimumBytes: 2,
        maximumBytes: MAXIMUM_MANIFEST_BYTES,
      })
      const manifest = manifestSchema.parse(parseJson(manifestObject))
      const manifestSha256 = rawSha256(manifestObject)
      if (response.status !== 'completed'
        || !response.outputSummary
        || response.outputSummary.exactPrivateRereadPending !== true
        || manifest.operationId !== task.runtimeRequest.operationId
        || manifest.requestBindingSha256 !==
          task.runtimeRequest.requestBindingSha256
        || manifestSha256 !== response.outputSummary.manifestSha256
        || outputEvidence.manifestSha256 !== manifestSha256
        || stableAuthorityStringify(outputEvidence.manifestRef) !==
          stableAuthorityStringify(response.outputSummary.manifestRef)
        || outputEvidence.evidenceClass !== 'canonical_private_reread'
        || !outputEvidence.everyMaskPngByteHashReread
        || !outputEvidence.everyMaskPngDecodedDimensionsMatchSource
        || outputEvidence.maskFileCount !== manifest.masks.length
        || outputEvidence.propagatedFrameCount !== manifest.frames.length) {
        throw new Error('SAM 3.1 semantic manifest lacks exact output evidence.')
      }
      const semanticProjection = {
        width: manifest.width,
        height: manifest.height,
        firstFrameIndex: manifest.firstFrameIndex,
        lastFrameIndex: manifest.lastFrameIndex,
        frames: manifest.frames,
        masks: manifest.masks.map((mask) => ({
          frameIndex: mask.frameIndex,
          objectId: mask.objectId,
          width: mask.width,
          height: mask.height,
          sha256: mask.sha256,
        })),
      }
      return Object.freeze({
        schemaVersion:
          'canonical-sam3_1-serving-semantic-manifest-evidence-v1',
        taskRef: outputEvidence.taskRef,
        manifestRef: outputEvidence.manifestRef,
        semanticMaskSetDigestSha256: rawSha256(Buffer.from(
          stableAuthorityStringify(semanticProjection),
          'utf8',
        )),
        propagatedFrameCount: manifest.frames.length,
        maskFileCount: manifest.masks.length,
        exactManifestBytesReread: true,
        exactCompletedServingOutputEvidenceBound: true,
      })
    },
  })
}

async function readStableObject(input: {
  readonly file: File
  readonly minimumBytes: number
  readonly maximumBytes: number
}): Promise<Buffer> {
  let before: FileMetadata
  try { [before] = await input.file.getMetadata() } catch (error) {
    if (cloudErrorCode(error) === 404) {
      throw new Error('GCS semantic manifest is missing.', { cause: error })
    }
    throw error
  }
  const generation = String(before.generation ?? '')
  const etag = String(before.etag ?? '')
  const size = Number(before.size ?? -1)
  if (!/^[1-9][0-9]{0,30}$/u.test(generation) || !etag
    || !Number.isSafeInteger(size) || size < input.minimumBytes
    || size > input.maximumBytes) {
    throw new Error('GCS semantic manifest metadata is invalid.')
  }
  const exact = input.file.bucket.file(input.file.name, { generation })
  const [body] = await exact.download({ validation: 'crc32c' })
  const [after] = await exact.getMetadata()
  if (body.byteLength !== size
    || String(after.generation ?? '') !== generation
    || String(after.etag ?? '') !== etag) {
    throw new Error('GCS semantic manifest identity changed during reread.')
  }
  return body
}

function parseJson(body: Buffer): unknown {
  try { return JSON.parse(body.toString('utf8')) as unknown } catch (error) {
    throw new Error('SAM 3.1 semantic manifest JSON is invalid.', {
      cause: error,
    })
  }
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('SAM 3.1 semantic manifest prefix is unsafe.')
  }
  return prefix
}

function cloudErrorCode(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null
  const code = (error as { code?: unknown }).code
  const numeric = typeof code === 'string' ? Number(code) : code
  return typeof numeric === 'number' && Number.isInteger(numeric)
    ? numeric : null
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
