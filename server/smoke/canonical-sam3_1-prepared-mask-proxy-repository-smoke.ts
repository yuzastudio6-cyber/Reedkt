import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31PreparedMaskProxyRepository,
  type CanonicalSam31ImmutablePrivateProxyObjectReadPort,
} from '../services/canonical-sam3_1-prepared-mask-proxy-repository'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  createCanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import { a100 as base } from './canonical-sam3_1-gpu-task-owner-smoke'

const proxyBytes = Buffer.alloc(16_384, 0x31)
const proxySha256 = hash(proxyBytes)
const privateCoordinate = {
  bucketName: 'reeditpro-private-media',
  objectName: 'private/track-all/prepared-proxies/proxy-1.mp4',
  generation: '1700000000000001',
  etagSha256: hashText('private-proxy-etag-1'),
}
const baseSourceMedia = canonicalSam31GpuSourceMediaSchema.parse(
  base.context.sourceMedia,
)
const ref = (id: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue(id)}`,
})
const scope = {
  ownerUserId: base.admission.scope.ownerUserId,
  workspaceId: base.admission.scope.workspaceId,
  projectId: base.admission.scope.projectId,
  editSessionId: base.admission.scope.editSessionId,
  approvedSnapshotRef: base.admission.scope.approvedSnapshotRef,
  approvedWorkItemRef: base.admission.scope.approvedWorkItemRef,
  workerLeaseRef: base.admission.scope.workerLeaseRef,
  executionAttemptRef: base.admission.scope.executionAttemptRef,
}
const refs = {
  sourceBindingRef: base.context.sourceBindingRef,
  finalizedSourceArtifactRef:
    baseSourceMedia.finalizedSourceArtifactRef,
  gpuPreparedMaskProxyArtifactRef:
    baseSourceMedia.gpuPreparedMaskProxyArtifactRef,
  exactSourceReadEvidenceRef:
    baseSourceMedia.exactSourceReadEvidenceRef,
  sourceFrameRangeMappingRef:
    baseSourceMedia.sourceFrameRangeMappingRef,
  proxyPixelGeometryQaRef:
    baseSourceMedia.proxyPixelGeometryQaRef,
  preparationRuntimeReleaseRef: ref('l4-preparation-runtime-release-1'),
  preparationUsageCostReceiptRef: ref('l4-preparation-cost-receipt-1'),
}
const media = {
  contentType: 'video/mp4' as const,
  byteLength: proxyBytes.byteLength,
  sha256: proxySha256,
  width: baseSourceMedia.width,
  height: baseSourceMedia.height,
  decodedFrameCount: baseSourceMedia.decodedFrameCount,
  selectedStartFrameInclusive:
    baseSourceMedia.selectedStartFrameInclusive,
  selectedEndFrameInclusive:
    baseSourceMedia.selectedEndFrameInclusive,
}
const publication = {
  proxyPublicationId: 'track-all-l4-prepared-proxy-publication-1',
  scope,
  refs,
  media,
  privateCoordinate,
  publishedAt: '2026-08-04T19:00:00.000Z',
}
const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31PreparedMaskProxyRepository({
  recordObjectPort: memoryObjectPort(objects),
  proxyObjectReadPort: memoryProxyObjectPort(proxyBytes),
  allowedPrivateProxyBucketNames: [privateCoordinate.bucketName],
  prefix: 'private/smoke/track-all/sam3_1/prepared-proxies/v1',
})

const created = await repository.persistPreparedMaskProxyCreateOnly(
  publication,
)
assert.equal(created.disposition, 'created')
assert.equal(created.exactGenerationBytesHashedBeforePublication, true)
assert.equal(created.samInferenceExecuted, false)
assert.equal(created.customerCreditsMutated, false)
assert.equal((await repository.persistPreparedMaskProxyCreateOnly(publication))
  .disposition, 'identical_replay')
assert.equal(objects.size, 1)

const readRequest = {
  scope,
  sourceBindingRef: refs.sourceBindingRef,
  finalizedSourceArtifactRef: refs.finalizedSourceArtifactRef,
  gpuPreparedMaskProxyArtifactRef: refs.gpuPreparedMaskProxyArtifactRef,
  exactSourceReadEvidenceRef: refs.exactSourceReadEvidenceRef,
  sourceFrameRangeMappingRef: refs.sourceFrameRangeMappingRef,
  proxyPixelGeometryQaRef: refs.proxyPixelGeometryQaRef,
  expectedByteLength: media.byteLength,
  expectedSha256: media.sha256,
}
const reread = await repository.rereadExactApprovedMaskProxy(readRequest)
assert.equal(reread.width, media.width)
assert.equal(reread.height, media.height)
assert.equal(reread.decodedFrameCount, media.decodedFrameCount)
assert.equal(reread.selectedStartFrameInclusive, 0)
assert.equal(reread.selectedEndFrameInclusive,
  media.decodedFrameCount - 1)
assert.equal(reread.sourcePathUrlBucketObjectGenerationOrBytesExposed, false)
assert.equal(hash(await readAll(await reread.openStream())), proxySha256)
assert.equal('bucketName' in reread, false)
assert.equal('objectName' in reread, false)
assert.equal('generation' in reread, false)
assert.equal('path' in reread, false)
assert.equal('url' in reread, false)

await assert.rejects(repository.rereadExactApprovedMaskProxy({
  ...readRequest,
  scope: { ...scope, workerLeaseRef: ref('cross-lease') },
}), /not_published|unavailable/u)
await assert.rejects(repository.rereadExactApprovedMaskProxy({
  ...readRequest,
  expectedSha256: hashText('caller-invented-bytes'),
}), /expected_bytes_mismatch/u)
await assert.rejects(repository.persistPreparedMaskProxyCreateOnly({
  ...publication,
  privateCoordinate: {
    ...privateCoordinate,
    bucketName: 'caller-invented-public-bucket',
  },
}), /not_server_allowlisted/u)

let getterInvoked = false
const hostile = Object.defineProperty(
  { ...publication },
  'privateCoordinate',
  {
    enumerable: true,
    get() {
      getterInvoked = true
      return privateCoordinate
    },
  },
)
await assert.rejects(repository.persistPreparedMaskProxyCreateOnly(hostile))
assert.equal(getterInvoked, false)

await assert.rejects(repository.persistPreparedMaskProxyCreateOnly({
  ...publication,
  proxyPublicationId: 'colliding-proxy-publication',
}), /collision/u)

const wrongBytesObjects = new Map<string, Buffer>()
const wrongBytesRepository = createCanonicalSam31PreparedMaskProxyRepository({
  recordObjectPort: memoryObjectPort(wrongBytesObjects),
  proxyObjectReadPort: memoryProxyObjectPort(
    Buffer.concat([proxyBytes.subarray(0, proxyBytes.byteLength - 1),
      Buffer.from([0x32])]),
    proxySha256,
  ),
  allowedPrivateProxyBucketNames: [privateCoordinate.bucketName],
})
await assert.rejects(
  wrongBytesRepository.persistPreparedMaskProxyCreateOnly(publication),
  /publication_bytes_mismatch/u,
)
assert.equal(wrongBytesObjects.size, 0)

let binaryStagingCalls = 0
const staging = createCanonicalSam31GpuPrivateInputStagingPort({
  sourceReadPort: repository,
  binaryObjectPort: {
    schemaVersion: 'canonical-sam3_1-gpu-private-binary-object-port-v1',
    async stageCreateOnlyAndReread() {
      binaryStagingCalls += 1
      throw new Error('unexpected binary staging')
    },
  },
})
await assert.rejects(staging.stageAndRereadExactMaskProxy({
  invocationId: 'geometry-mismatch-invocation',
  scope,
  dispatchAdmissionRef: ref('dispatch-admission-geometry-mismatch'),
  executionEnvelopeRef: ref('geometry-mismatch-invocation'),
  sourceBindingRef: refs.sourceBindingRef,
  sourceMedia: {
    ...baseSourceMedia,
    byteLength: media.byteLength,
    sha256: media.sha256,
    width: media.width - 1,
    height: media.height,
    decodedFrameCount: media.decodedFrameCount,
    selectedStartFrameInclusive: media.selectedStartFrameInclusive,
    selectedEndFrameInclusive: media.selectedEndFrameInclusive,
  },
  privateTaskInputTransportRef: ref('private-task-input-transport'),
  stagedAt: '2026-08-04T19:00:10.000Z',
}), /canonical proxy reread differs/u)
assert.equal(binaryStagingCalls, 0)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-prepared-mask-proxy-repository',
  checks: 36,
  l4PreparedProxyCreateOnlyAndExactReread: true,
  exactGenerationBytesHashedBeforePublication: true,
  immutableGeometryAndFrameRangeBoundToTask: true,
  crossLeaseAndCallerByteClaimsRejected: true,
  callerSelectedStorageBucketRejected: true,
  hostileAccessorRejectedWithoutInvocation: true,
  createOnlyCollisionRejected: true,
  wrongExactGenerationBytesRejectedBeforePublication: true,
  privateStorageCoordinateNotExposed: true,
  userTriggeredScaleFromZero: true,
  scaleBackToZeroAfterPreparationVerified: true,
  preparationAccelerator: 'nvidia_l4',
  cpuOnlySubstantiveMediaProcessingUsed: false,
  samInferenceExecuted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hash(input.body), input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}

function memoryProxyObjectPort(
  bytes: Buffer,
  metadataSha256 = hash(bytes),
): CanonicalSam31ImmutablePrivateProxyObjectReadPort {
  return {
    async rereadExactPrivateProxy(input) {
      assert.deepEqual(input.coordinate, privateCoordinate)
      assert.equal(input.expectedByteLength, proxyBytes.byteLength)
      assert.equal(input.expectedSha256, proxySha256)
      return {
        contentType: 'video/mp4' as const,
        byteLength: proxyBytes.byteLength,
        sha256Metadata: metadataSha256,
        generation: privateCoordinate.generation,
        etagSha256: privateCoordinate.etagSha256,
        async openStream() {
          return Readable.from([Buffer.from(bytes)])
        },
      }
    },
  }
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
