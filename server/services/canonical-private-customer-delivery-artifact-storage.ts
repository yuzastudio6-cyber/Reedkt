import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  createPrivateReadStreamWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-customer-delivery-mux-protocol'

export const CANONICAL_PRIVATE_CUSTOMER_DELIVERY_MASTER_MAXIMUM_BYTES =
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES

const SHA256 = /^[a-f0-9]{64}$/u

export interface CanonicalPrivateCustomerDeliveryArtifactInspection {
  mediaFormat: 'mp4'
  byteLength: number
  sha256: string
  openStream(): Promise<Readable>
}

export async function persistCanonicalPrivateCustomerDeliveryArtifactStream(
  input: {
    localStorageRoot: string
    privateObjectIdentityHash: string
    stream: Readable
    expectedByteLength: number
    expectedSha256: string
  },
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  assertStreamingCommitment(input)
  const existing = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (existing) {
    if (
      existing.byteLength !== input.expectedByteLength ||
      existing.sha256 !== input.expectedSha256
    ) throw invalid(
      'Private customer-delivery identity collides with another artifact.',
    )
    await verifyCommittedMp4Stream(input.stream, {
      byteLength: input.expectedByteLength,
      sha256: input.expectedSha256,
    })
    return {
      byteLength: existing.byteLength,
      sha256: existing.sha256,
      replayed: true,
    }
  }
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedStream = Readable.from((async function* () {
    let byteLength = 0
    const checksum = createHash('sha256')
    for await (const chunk of input.stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > input.expectedByteLength) {
        throw invalid(
          'Private customer-delivery stream exceeded its exact commitment.',
        )
      }
      checksum.update(bytes)
      if (signatureByteLength < 8) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, 8 - signatureByteLength),
        )
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (
      byteLength !== input.expectedByteLength ||
      checksum.digest('hex') !== input.expectedSha256 ||
      !isMp4(signature)
    ) throw invalid(
      'Private customer-delivery stream failed its exact MP4 commitment.',
    )
  })())
  const written = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    stream: verifiedStream,
    maximumBytes:
      CANONICAL_PRIVATE_CUSTOMER_DELIVERY_MASTER_MAXIMUM_BYTES,
  })
  if (
    written.byteLength !== input.expectedByteLength ||
    written.checksumSha256 !== input.expectedSha256 ||
    !isMp4(Buffer.concat(signatureChunks, signatureByteLength))
  ) throw invalid(
    'Private customer-delivery artifact changed during persistence.',
  )
  const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored || stored.byteLength !== input.expectedByteLength ||
    stored.sha256 !== input.expectedSha256
  ) throw invalid(
    'Private customer-delivery artifact changed during create-only readback.',
  )
  return {
    byteLength: stored.byteLength,
    sha256: stored.sha256,
    replayed: false,
  }
}

export async function inspectCanonicalPrivateCustomerDeliveryArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateCustomerDeliveryArtifactInspection | undefined> {
  if (!SHA256.test(input.privateObjectIdentityHash)) {
    throw invalid('Private customer-delivery object identity is invalid.')
  }
  let stream: Readable
  try {
    stream = await createPrivateReadStreamWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: relativePath(input.privateObjectIdentityHash),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
  const commitment = await inspectMp4Stream(stream)
  return {
    mediaFormat: 'mp4',
    ...commitment,
    async openStream() {
      return createPrivateReadStreamWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(input.privateObjectIdentityHash),
      })
    },
  }
}

function assertStreamingCommitment(input: {
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): void {
  if (
    !SHA256.test(input.privateObjectIdentityHash) ||
    !SHA256.test(input.expectedSha256) ||
    !Number.isSafeInteger(input.expectedByteLength) ||
    input.expectedByteLength < 1_024 ||
    input.expectedByteLength >
      CANONICAL_PRIVATE_CUSTOMER_DELIVERY_MASTER_MAXIMUM_BYTES ||
    !input.stream || typeof input.stream.pipe !== 'function'
  ) throw invalid(
    'Private customer-delivery streaming commitment is invalid.',
  )
}

async function inspectMp4Stream(
  stream: Readable,
): Promise<{ byteLength: number; sha256: string }> {
  const checksum = createHash('sha256')
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (
      byteLength > CANONICAL_PRIVATE_CUSTOMER_DELIVERY_MASTER_MAXIMUM_BYTES
    ) throw invalid('Stored customer-delivery artifact exceeds its ceiling.')
    checksum.update(bytes)
    if (signatureByteLength < 8) {
      const part = bytes.subarray(
        0,
        Math.min(bytes.byteLength, 8 - signatureByteLength),
      )
      signatureChunks.push(Buffer.from(part))
      signatureByteLength += part.byteLength
    }
  }
  if (
    byteLength < 1_024 ||
    !isMp4(Buffer.concat(signatureChunks, signatureByteLength))
  ) throw invalid('Stored customer-delivery artifact is not an MP4.')
  return { byteLength, sha256: checksum.digest('hex') }
}

async function verifyCommittedMp4Stream(
  stream: Readable,
  expected: { byteLength: number; sha256: string },
): Promise<void> {
  const actual = await inspectMp4Stream(stream)
  if (
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) throw invalid('Replayed customer-delivery stream changed its commitment.')
}

function isMp4(bytes: Buffer): boolean {
  return bytes.byteLength >= 8 &&
    bytes.subarray(4, 8).toString('ascii') === 'ftyp'
}

function relativePath(identity: string): string {
  return `canonical-customer-delivery-results/private-v1/${
    identity.slice(0, 2)
  }/${identity}.mp4`
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_customer_delivery_artifact_integrity',
  })
}
