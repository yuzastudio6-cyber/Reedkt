import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'
import { Transform, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  canonicalSam31GpuSourceMediaSchema,
} from './canonical-sam3_1-gpu-runtime-contract'

export const CANONICAL_SAM3_1_GPU_PRIVATE_INPUT_STAGING_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-private-input-staging-evidence-v1' as const
export const CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION =
  'canonical-sam3_1-gpu-private-binary-object-port-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_MASK_PROXY_BYTES = 2 * 1024 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const bucketName = z.string().trim().min(3).max(222).regex(
  /^[a-z0-9][a-z0-9._-]+[a-z0-9]$/u,
)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  approvedSnapshotRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
}).strict()

const stagingEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_PRIVATE_INPUT_STAGING_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_server_sam3_1_private_input_staging_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  stagingId: safeId,
  invocationId: safeId,
  scope: scopeSchema,
  dispatchAdmissionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  sourceBindingRef: evidenceRefSchema,
  finalizedSourceArtifactRef: evidenceRefSchema,
  gpuPreparedMaskProxyArtifactRef: evidenceRefSchema,
  exactSourceReadEvidenceRef: evidenceRefSchema,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  proxyPixelGeometryQaRef: evidenceRefSchema,
  privateTaskInputTransportRef: evidenceRefSchema,
  privateInvocationObjectRef: evidenceRefSchema,
  contentType: z.literal('video/mp4'),
  byteLength: positiveInteger.max(MAXIMUM_MASK_PROXY_BYTES),
  sha256,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  decodedFrameCount: positiveInteger.max(240),
  selectedStartFrameInclusive: z.number().int().nonnegative().safe(),
  selectedEndFrameInclusive: z.number().int().nonnegative().safe(),
  storageGeneration: generation,
  storageEtagSha256: sha256,
  sourceArtifactOpenedThroughCanonicalReadPort: z.literal(true),
  exactSourceStreamByteLengthAndSha256Verified: z.literal(true),
  targetCreatedWithIfGenerationMatchZero: z.literal(true),
  exactCreatedGenerationMetadataReread: z.literal(true),
  exactCreatedGenerationBytesRereadAndHashed: z.literal(true),
  sourceAndTargetBytesIdentical: z.literal(true),
  taskAndSourceShareExactInvocationPrefix: z.literal(true),
  callerPathUrlBucketObjectGenerationOrBytesAccepted: z.literal(false),
  signedUrlOrPublicObjectUsed: z.literal(false),
  sourceOrTargetMutationAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  stagedAt: timestamp,
}).strict().superRefine((record, context) => {
  if (
    record.executionEnvelopeRef.id !== record.invocationId
    || record.privateInvocationObjectRef.contentHash !==
      `sha256:${record.sha256}`
    || record.selectedEndFrameInclusive < record.selectedStartFrameInclusive
    || record.decodedFrameCount !== record.selectedEndFrameInclusive
      - record.selectedStartFrameInclusive + 1
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 staged private input lost invocation or byte lineage.',
  })
})

export const canonicalSam31GpuPrivateInputStagingEvidenceSchema =
  stagingEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31GpuPrivateInputStagingEvidence = z.infer<
  typeof canonicalSam31GpuPrivateInputStagingEvidenceSchema
>

export interface CanonicalSam31GpuPreparedMaskProxyReadPort {
  rereadExactApprovedMaskProxy(input: {
    readonly scope: z.infer<typeof scopeSchema>
    readonly sourceBindingRef: z.infer<typeof evidenceRefSchema>
    readonly finalizedSourceArtifactRef: z.infer<typeof evidenceRefSchema>
    readonly gpuPreparedMaskProxyArtifactRef:
      z.infer<typeof evidenceRefSchema>
    readonly exactSourceReadEvidenceRef: z.infer<typeof evidenceRefSchema>
    readonly sourceFrameRangeMappingRef: z.infer<typeof evidenceRefSchema>
    readonly proxyPixelGeometryQaRef: z.infer<typeof evidenceRefSchema>
    readonly expectedByteLength: number
    readonly expectedSha256: string
  }): Promise<{
    readonly contentType: 'video/mp4'
    readonly byteLength: number
    readonly sha256: string
    readonly sourceBindingRef: z.infer<typeof evidenceRefSchema>
    readonly finalizedSourceArtifactRef: z.infer<typeof evidenceRefSchema>
    readonly gpuPreparedMaskProxyArtifactRef:
      z.infer<typeof evidenceRefSchema>
    readonly exactSourceReadEvidenceRef: z.infer<typeof evidenceRefSchema>
    readonly sourceFrameRangeMappingRef: z.infer<typeof evidenceRefSchema>
    readonly proxyPixelGeometryQaRef: z.infer<typeof evidenceRefSchema>
    readonly exactApprovedSnapshotWorkLeaseAndSourceReread: true
    readonly sourcePathUrlBucketObjectGenerationOrBytesExposed: false
    openStream(): Promise<Readable>
  }>
}

export interface CanonicalSam31GpuPrivateBinaryObjectPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION
  stageCreateOnlyAndReread(input: {
    readonly invocationId: string
    readonly expectedByteLength: number
    readonly expectedSha256: string
    openSourceStream(): Promise<Readable>
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly contentType: 'video/mp4'
    readonly byteLength: number
    readonly sha256: string
    readonly storageGeneration: string
    readonly storageEtagSha256: string
    readonly createdWithIfGenerationMatchZero: true
    readonly exactGenerationMetadataReread: true
    readonly exactGenerationBytesRereadAndHashed: true
  }>
}

export interface CanonicalSam31GpuPrivateInputStagingPort {
  stageAndRereadExactMaskProxy(input: {
    readonly invocationId: string
    readonly scope: z.input<typeof scopeSchema>
    readonly dispatchAdmissionRef: z.input<typeof evidenceRefSchema>
    readonly executionEnvelopeRef: z.input<typeof evidenceRefSchema>
    readonly sourceBindingRef: z.input<typeof evidenceRefSchema>
    readonly sourceMedia: unknown
    readonly privateTaskInputTransportRef:
      z.input<typeof evidenceRefSchema>
    readonly stagedAt: string
  }): Promise<unknown>
}

export function createCanonicalSam31GpuPrivateInputStagingPort(input: {
  readonly sourceReadPort: CanonicalSam31GpuPreparedMaskProxyReadPort
  readonly binaryObjectPort: CanonicalSam31GpuPrivateBinaryObjectPort
}): CanonicalSam31GpuPrivateInputStagingPort {
  if (!input.sourceReadPort
    || typeof input.sourceReadPort.rereadExactApprovedMaskProxy !== 'function'
    || !input.binaryObjectPort
    || input.binaryObjectPort.schemaVersion !==
      CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION
    || typeof input.binaryObjectPort.stageCreateOnlyAndReread !== 'function') {
    throw new Error('SAM 3.1 private input staging dependencies are absent.')
  }
  const port: CanonicalSam31GpuPrivateInputStagingPort = {
    async stageAndRereadExactMaskProxy(value) {
      assertPlainSerializedData({
        ...value,
        sourceMedia: value.sourceMedia,
      }, 'sam3_1_private_input_staging_request')
      const invocationId = safeId.parse(value.invocationId)
      const scope = scopeSchema.parse(value.scope)
      const dispatchAdmissionRef = evidenceRefSchema.parse(
        value.dispatchAdmissionRef,
      )
      const executionEnvelopeRef = evidenceRefSchema.parse(
        value.executionEnvelopeRef,
      )
      const sourceBindingRef = evidenceRefSchema.parse(value.sourceBindingRef)
      const privateTaskInputTransportRef = evidenceRefSchema.parse(
        value.privateTaskInputTransportRef,
      )
      const sourceMedia = canonicalSam31GpuSourceMediaSchema.parse(
        value.sourceMedia,
      )
      const stagedAt = timestamp.parse(value.stagedAt)
      if (executionEnvelopeRef.id !== invocationId) {
        throw new Error('SAM 3.1 staging invocation differs from envelope.')
      }
      const source = await input.sourceReadPort.rereadExactApprovedMaskProxy({
        scope,
        sourceBindingRef,
        finalizedSourceArtifactRef: sourceMedia.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          sourceMedia.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: sourceMedia.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef:
          sourceMedia.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: sourceMedia.proxyPixelGeometryQaRef,
        expectedByteLength: sourceMedia.byteLength,
        expectedSha256: sourceMedia.sha256,
      })
      assertPreparedSourceMatches({ source, sourceBindingRef, sourceMedia })
      const stored = await input.binaryObjectPort.stageCreateOnlyAndReread({
        invocationId,
        expectedByteLength: sourceMedia.byteLength,
        expectedSha256: sourceMedia.sha256,
        openSourceStream: source.openStream,
      })
      if (
        stored.contentType !== 'video/mp4'
        || stored.byteLength !== sourceMedia.byteLength
        || stored.sha256 !== sourceMedia.sha256
      ) throw new Error('SAM 3.1 staged object differs from approved proxy.')
      const payload = stagingEvidenceWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_GPU_PRIVATE_INPUT_STAGING_EVIDENCE_VERSION,
        source: 'canonical_server_sam3_1_private_input_staging_owner',
        evidenceClass: 'canonical_private_reread',
        stagingId: `sam31-input-staging:${invocationId}`,
        invocationId,
        scope,
        dispatchAdmissionRef,
        executionEnvelopeRef,
        sourceBindingRef,
        finalizedSourceArtifactRef: sourceMedia.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          sourceMedia.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: sourceMedia.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef:
          sourceMedia.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: sourceMedia.proxyPixelGeometryQaRef,
        privateTaskInputTransportRef,
        privateInvocationObjectRef: {
          id: `sam31-mask-proxy:${invocationId}`,
          version: 1,
          contentHash: `sha256:${stored.sha256}`,
        },
        contentType: 'video/mp4',
        byteLength: stored.byteLength,
        sha256: stored.sha256,
        width: sourceMedia.width,
        height: sourceMedia.height,
        decodedFrameCount: sourceMedia.decodedFrameCount,
        selectedStartFrameInclusive:
          sourceMedia.selectedStartFrameInclusive,
        selectedEndFrameInclusive: sourceMedia.selectedEndFrameInclusive,
        storageGeneration: stored.storageGeneration,
        storageEtagSha256: stored.storageEtagSha256,
        sourceArtifactOpenedThroughCanonicalReadPort: true,
        exactSourceStreamByteLengthAndSha256Verified: true,
        targetCreatedWithIfGenerationMatchZero: true,
        exactCreatedGenerationMetadataReread: true,
        exactCreatedGenerationBytesRereadAndHashed: true,
        sourceAndTargetBytesIdentical: true,
        taskAndSourceShareExactInvocationPrefix: true,
        callerPathUrlBucketObjectGenerationOrBytesAccepted: false,
        signedUrlOrPublicObjectUsed: false,
        sourceOrTargetMutationAllowed: false,
        runtimeDownloadAllowed: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        stagedAt,
      })
      return canonicalSam31GpuPrivateInputStagingEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
    },
  }
  return Object.freeze(port)
}

export function createCanonicalSam31GcsPrivateBinaryObjectPort(input: {
  readonly projectId: 'reeditpro'
  readonly bucketName: string
  readonly prefix?: string
  readonly storage?: Storage
}): CanonicalSam31GpuPrivateBinaryObjectPort {
  if (input.projectId !== 'reeditpro') {
    throw new Error('SAM 3.1 private object port requires project reeditpro.')
  }
  const privateBucketName = bucketName.parse(input.bucketName)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const port: CanonicalSam31GpuPrivateBinaryObjectPort = {
    schemaVersion:
      CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION,
    async stageCreateOnlyAndReread(value) {
      const invocationId = safeId.parse(value.invocationId)
      const expectedByteLength = positiveInteger.max(
        MAXIMUM_MASK_PROXY_BYTES,
      ).parse(value.expectedByteLength)
      const expectedSha256 = sha256.parse(value.expectedSha256)
      const objectPath = `${prefix}/${invocationId}/mask-proxy.mp4`
      const bucket = storage.bucket(privateBucketName)
      const liveFile = bucket.file(objectPath)
      const invocationDigest = createHash('sha256')
        .update(invocationId, 'utf8').digest('hex')
      const canonicalMetadata = {
        'reeditpro-sam31-contract':
          CANONICAL_SAM3_1_GPU_PRIVATE_INPUT_STAGING_EVIDENCE_VERSION,
        'reeditpro-invocation-sha256': invocationDigest,
        'reeditpro-content-sha256': expectedSha256,
      }
      let disposition: 'created' | 'identical_replay' = 'created'
      try {
        await writeVerifiedSourceStream({
          openSourceStream: value.openSourceStream,
          expectedByteLength,
          expectedSha256,
          output: liveFile.createWriteStream({
            resumable: true,
            validation: 'crc32c',
            preconditionOpts: { ifGenerationMatch: 0 },
            metadata: {
              contentType: 'video/mp4',
              metadata: canonicalMetadata,
            },
          }),
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw error
        disposition = 'identical_replay'
        await verifyReadableFactory({
          openSourceStream: value.openSourceStream,
          expectedByteLength,
          expectedSha256,
        })
      }
      const [metadata] = await liveFile.getMetadata()
      const storageGeneration = generation.parse(String(
        metadata.generation ?? '',
      ))
      const etag = String(metadata.etag ?? '')
      const observedByteLength = Number(metadata.size ?? -1)
      const observedCustomMetadata = metadata.metadata as
        Record<string, unknown> | undefined
      if (
        !etag
        || !Number.isSafeInteger(observedByteLength)
        || observedByteLength !== expectedByteLength
        || String(metadata.contentType ?? '') !== 'video/mp4'
        || stableAuthorityStringify(observedCustomMetadata ?? {}) !==
          stableAuthorityStringify(canonicalMetadata)
      ) throw new Error('SAM 3.1 staged GCS metadata is invalid.')
      const exactFile = bucket.file(objectPath, {
        generation: storageGeneration,
      })
      const reread = await hashReadable(
        exactFile.createReadStream({ decompress: false, validation: 'crc32c' }),
        expectedByteLength,
      )
      const [stableMetadata] = await exactFile.getMetadata()
      if (
        reread.byteLength !== expectedByteLength
        || reread.sha256 !== expectedSha256
        || String(stableMetadata.generation ?? '') !== storageGeneration
        || String(stableMetadata.etag ?? '') !== etag
        || stableAuthorityStringify(stableMetadata.metadata ?? {}) !==
          stableAuthorityStringify(canonicalMetadata)
      ) throw new Error('SAM 3.1 staged GCS generation changed on reread.')
      return {
        disposition,
        contentType: 'video/mp4',
        byteLength: reread.byteLength,
        sha256: reread.sha256,
        storageGeneration,
        storageEtagSha256: createHash('sha256').update(etag, 'utf8')
          .digest('hex'),
        createdWithIfGenerationMatchZero: true,
        exactGenerationMetadataReread: true,
        exactGenerationBytesRereadAndHashed: true,
      }
    },
  }
  return Object.freeze(port)
}

export function assertCanonicalSam31GpuPrivateInputStagingEvidence(
  value: unknown,
): CanonicalSam31GpuPrivateInputStagingEvidence {
  assertPlainSerializedData(value, 'sam3_1_private_input_staging_evidence')
  const evidence = canonicalSam31GpuPrivateInputStagingEvidenceSchema.parse(
    value,
  )
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 private input staging evidence hash is invalid.')
  }
  return evidence
}

function assertPreparedSourceMatches(input: {
  source: Awaited<ReturnType<
    CanonicalSam31GpuPreparedMaskProxyReadPort[
      'rereadExactApprovedMaskProxy'
    ]
  >>
  sourceBindingRef: z.infer<typeof evidenceRefSchema>
  sourceMedia: z.infer<typeof canonicalSam31GpuSourceMediaSchema>
}): void {
  const source = input.source
  if (
    source.contentType !== 'video/mp4'
    || source.byteLength !== input.sourceMedia.byteLength
    || source.sha256 !== input.sourceMedia.sha256
    || !sameRef(source.sourceBindingRef, input.sourceBindingRef)
    || !sameRef(source.finalizedSourceArtifactRef,
      input.sourceMedia.finalizedSourceArtifactRef)
    || !sameRef(source.gpuPreparedMaskProxyArtifactRef,
      input.sourceMedia.gpuPreparedMaskProxyArtifactRef)
    || !sameRef(source.exactSourceReadEvidenceRef,
      input.sourceMedia.exactSourceReadEvidenceRef)
    || !sameRef(source.sourceFrameRangeMappingRef,
      input.sourceMedia.sourceFrameRangeMappingRef)
    || !sameRef(source.proxyPixelGeometryQaRef,
      input.sourceMedia.proxyPixelGeometryQaRef)
    || source.exactApprovedSnapshotWorkLeaseAndSourceReread !== true
    || source.sourcePathUrlBucketObjectGenerationOrBytesExposed !== false
    || typeof source.openStream !== 'function'
  ) throw new Error('SAM 3.1 canonical proxy reread differs from task context.')
}

async function writeVerifiedSourceStream(input: {
  openSourceStream(): Promise<Readable>
  expectedByteLength: number
  expectedSha256: string
  output: Writable
}): Promise<void> {
  const meter = createVerificationTransform(
    input.expectedByteLength,
    input.expectedSha256,
  )
  await pipeline(await input.openSourceStream(), meter.transform, input.output)
  meter.assertComplete()
}

async function verifyReadableFactory(input: {
  openSourceStream(): Promise<Readable>
  expectedByteLength: number
  expectedSha256: string
}): Promise<void> {
  const observed = await hashReadable(
    await input.openSourceStream(),
    input.expectedByteLength,
  )
  if (observed.byteLength !== input.expectedByteLength
    || observed.sha256 !== input.expectedSha256) {
    throw new Error('SAM 3.1 replay source stream changed.')
  }
}

function createVerificationTransform(
  expectedByteLength: number,
  expectedSha256: string,
) {
  let byteLength = 0
  const digest = createHash('sha256')
  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > expectedByteLength) {
        callback(new Error('SAM 3.1 source stream exceeded byte commitment.'))
        return
      }
      digest.update(bytes)
      callback(null, bytes)
    },
  })
  return {
    transform,
    assertComplete() {
      if (byteLength !== expectedByteLength
        || digest.digest('hex') !== expectedSha256) {
        throw new Error('SAM 3.1 source stream failed byte commitment.')
      }
    },
  }
}

async function hashReadable(
  stream: Readable,
  maximumBytes: number,
): Promise<{ byteLength: number; sha256: string }> {
  let byteLength = 0
  const digest = createHash('sha256')
  await pipeline(stream, new Writable({
    write(chunk, _encoding, callback) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > maximumBytes) {
        callback(new Error('SAM 3.1 private object exceeded byte bound.'))
        return
      }
      digest.update(bytes)
      callback()
    },
  }))
  return { byteLength, sha256: digest.digest('hex') }
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !safeId.safeParse(part).success)) {
    throw new Error('SAM 3.1 private object prefix is invalid.')
  }
  return normalized
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}
