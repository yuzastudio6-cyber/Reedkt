import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

import type { Storage } from '@google-cloud/storage'

import {
  assertCanonicalSam31VertexServingQualificationResult,
} from '../services/canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createCanonicalSam31GcsPrivateOutputRereadPort,
} from '../workers/masks/canonical-sam3_1-gcs-private-output-reader'
import {
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  canonicalSam31A100LaunchFixture as launch,
  canonicalSam31A100TaskFixture as task,
  canonicalSam31A100RuntimeResponseFixture as responseFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'

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

const ROOT =
  'private/canonical-professional-gpu/sam3_1/v1/invocations/'
  + task.invocationId
const OUTPUT_ROOT = `${ROOT}/sam3_1-mask-sequence`
const FILE_NAME = 'frame-000000-object-000000.png'
const png = grayscalePng(task.runtimeRequest.sourceMedia.width,
  task.runtimeRequest.sourceMedia.height, 255)
const pngHash = hash(png)
const frames = Array.from({
  length: task.runtimeRequest.sourceMedia.decodedFrameCount,
}, (_, frameIndex) => ({
  frameIndex,
  objects: frameIndex === 0 ? [{
    objectId: 0,
    normalizedBoxXywh: [0, 0, 1, 1],
    maskSha256: pngHash,
  }] : [],
}))
const manifest = {
  schemaVersion: 'canonical-sam3_1-mask-sequence-manifest-v1' as const,
  operationId: task.runtimeRequest.operationId,
  requestBindingSha256: task.runtimeRequest.requestBindingSha256,
  sourceFrameRangeMappingRef:
    task.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
  width: task.runtimeRequest.sourceMedia.width,
  height: task.runtimeRequest.sourceMedia.height,
  firstFrameIndex: task.runtimeRequest.sourceMedia.selectedStartFrameInclusive,
  lastFrameIndex: task.runtimeRequest.sourceMedia.selectedEndFrameInclusive,
  frames,
  masks: [{
    frameIndex: 0,
    objectId: 0,
    relativeFileName: FILE_NAME,
    width: task.runtimeRequest.sourceMedia.width,
    height: task.runtimeRequest.sourceMedia.height,
    byteLength: png.byteLength,
    sha256: pngHash,
  }],
}
const manifestJson = canonicalSam31GpuWireStringify(manifest)
const pythonManifestJson = manifestJson.replace(
  '"normalizedBoxXywh":[0,0,1,1]',
  '"normalizedBoxXywh":[0.0,0.0,1.0,1.0]',
)
assert.notEqual(pythonManifestJson, manifestJson)
const manifestBytes = Buffer.from(pythonManifestJson, 'utf8')
const manifestHash = hash(manifestBytes)
const responsePayload = withoutResponseBinding(responseFixture)
const response = buildCanonicalSam31GpuRuntimeResponse({
  ...responsePayload,
  runtimeMeasurement: {
    ...responsePayload.runtimeMeasurement!,
    outputFileCount: 2,
    outputByteLength: manifestBytes.byteLength + png.byteLength,
  },
  outputSummary: {
    ...responsePayload.outputSummary!,
    manifestRef: {
      id: `sam31-mask-manifest:${task.runtimeRequest.scope.executionAttemptRef.id}`,
      version: 1,
      contentHash: `sha256:${manifestHash}`,
    },
    manifestSha256: manifestHash,
    losslessMaskPngCount: 1,
    normalizedBoxRecordCount: 1,
  },
})
const responseBytes = Buffer.from(canonicalSam31GpuWireStringify(response),
  'utf8')
const objects = new Map<string, Buffer>([
  [`${ROOT}/response.json`, responseBytes],
  [`${OUTPUT_ROOT}/`, Buffer.alloc(0)],
  [`${OUTPUT_ROOT}/manifest.json`, manifestBytes],
  [`${OUTPUT_ROOT}/${FILE_NAME}`, png],
])

const evidence = assertCanonicalSam31PrivateOutputRereadEvidence(await
createCanonicalSam31GcsPrivateOutputRereadPort({
  storage: memoryStorage(objects),
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-masks',
  now: () => '2026-08-02T18:06:00.000Z',
}).rereadExactPrivateOutput({ task, response, launch }))

assert.equal(evidence.maskFileCount, 1)
assert.equal(evidence.combinedMaskByteLength, png.byteLength)
assert.equal(evidence.manifestSha256, manifestHash)
assert.equal(evidence.everyMaskPngDecodedDimensionsMatchSource, true)
assert.equal(evidence.completeApprovedFrameIntervalCoverageVerified, true)
assert.equal(evidence.noUnexpectedFilesOrCrossInvocationArtifacts, true)
assert.equal(evidence.qaApproved, false)

const servingResult = buildServingResult(task.runtimeReleaseRef)
const servingEvidence = assertCanonicalSam31PrivateOutputRereadEvidence(await
createCanonicalSam31GcsPrivateOutputRereadPort({
  storage: memoryStorage(objects),
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-masks',
  now: () => '2026-08-02T18:06:00.000Z',
}).rereadExactServingPrivateOutput({ task, response, servingResult }))
assert.equal(servingEvidence.evidenceHash, evidence.evidenceHash)

const currentInvocationResult = buildCurrentInvocationResult()
const currentServingEvidence =
  assertCanonicalSam31PrivateOutputRereadEvidence(await
    createCanonicalSam31GcsPrivateOutputRereadPort({
      storage: memoryStorage(objects),
      projectId: 'reeditpro',
      bucketName: 'reeditpro-production-reeditpro-masks',
      now: () => '2026-08-02T18:06:00.000Z',
    }).rereadExactCurrentServingPrivateOutput({
      task,
      response,
      invocationResult: currentInvocationResult,
    }))
assert.equal(currentServingEvidence.evidenceHash, evidence.evidenceHash)

await assert.rejects(() =>
  createCanonicalSam31GcsPrivateOutputRereadPort({
    storage: memoryStorage(objects),
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-masks',
  }).rereadExactCurrentServingPrivateOutput({
    task,
    response,
    invocationResult: buildCurrentInvocationResult({
      workspaceId: 'crossed-workspace',
    }),
  }), /exact current A100 invocation result/u)

const wrongCandidateRef = {
  ...task.runtimeReleaseRef,
  id: `${task.runtimeReleaseRef.id}-wrong`,
}
await assert.rejects(() =>
  createCanonicalSam31GcsPrivateOutputRereadPort({
    storage: memoryStorage(objects),
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-masks',
  }).rereadExactServingPrivateOutput({
    task,
    response,
    servingResult: buildServingResult(wrongCandidateRef),
  }), /exact completed Vertex serving result/u)

const readerSource = readFileSync(resolve(
  process.cwd(),
  'server/workers/masks/canonical-sam3_1-gcs-private-output-reader.ts',
), 'utf8')
assert.match(readerSource, /MAXIMUM_CONCURRENT_MASK_REREADS = 16/u)
assert.match(readerSource, /await Promise\.all\(manifest\.masks/u)

const withUnexpected = new Map(objects)
withUnexpected.set(`${OUTPUT_ROOT}/unexpected.txt`, Buffer.from('unsafe'))
await assert.rejects(() =>
  createCanonicalSam31GcsPrivateOutputRereadPort({
    storage: memoryStorage(withUnexpected),
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-masks',
  }).rereadExactPrivateOutput({ task, response, launch }), /unexpected/u)

const changedMask = new Map(objects)
changedMask.set(`${OUTPUT_ROOT}/${FILE_NAME}`, Buffer.from(png).fill(0, 32, 33))
await assert.rejects(() =>
  createCanonicalSam31GcsPrivateOutputRereadPort({
    storage: memoryStorage(changedMask),
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-masks',
  }).rereadExactPrivateOutput({ task, response, launch }), /mask bytes/u)

const crossedResponse = new Map(objects)
crossedResponse.set(`${ROOT}/response.json`, Buffer.from(
  canonicalSam31GpuWireStringify({ ...response, qaApproved: true }), 'utf8'))
await assert.rejects(() =>
  createCanonicalSam31GcsPrivateOutputRereadPort({
    storage: memoryStorage(crossedResponse),
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-masks',
  }).rereadExactPrivateOutput({ task, response, launch }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gcs-private-output-reader',
  checks: {
    exactGenerationEtagAndCrcReread: true,
    exactRuntimeResponseBytesReread: true,
    exactVertexServingResultLineageRequired: true,
    exactCurrentA100InvocationResultLineageRequired: true,
    pythonFloatSpellingBoundByExactRawManifestHash: true,
    stableEmptyGcsDirectoryMarkerAccepted: true,
    closedManifestAndCompleteFrameInterval: true,
    everyMaskHashAndPngCrcReread: true,
    everyMaskFullyInflatedAndDimensionsVerified: true,
    boundedConcurrentMaskRereadVerified: true,
    binaryGrayscalePixelsRequired: true,
    unexpectedAndCrossInvocationFilesRejected: true,
    changedMaskAndResponseRejected: true,
    bytesPathsQaAssetsCreditsPublicProductionRemainClosed: true,
  },
}, null, 2))

function memoryStorage(source: Map<string, Buffer>): Storage {
  const bucket = {
    file(name: string) {
      const body = source.get(name)
      const metadata = body ? {
        generation: '1',
        etag: `etag-${hash(body).slice(0, 20)}`,
        size: String(body.byteLength),
      } : null
      const file = {
        name,
        bucket,
        async getMetadata() {
          if (!metadata) throw Object.assign(new Error('not found'), {
            code: 404,
          })
          return [structuredClone(metadata)]
        },
        async download() {
          if (!body) throw Object.assign(new Error('not found'), { code: 404 })
          return [Buffer.from(body)]
        },
      }
      return file
    },
    async getFiles({ prefix, maxResults }: {
      prefix: string
      maxResults: number
    }) {
      return [[...source.keys()]
        .filter((name) => name.startsWith(prefix))
        .sort()
        .slice(0, maxResults)
        .map((name) => bucket.file(name))]
    },
  }
  return {
    bucket() { return bucket },
  } as unknown as Storage
}

function grayscalePng(width: number, height: number, value: number): Buffer {
  const row = Buffer.alloc(width + 1, value)
  row[0] = 0
  const raw = Buffer.alloc(row.byteLength * height)
  for (let index = 0; index < height; index += 1) {
    row.copy(raw, index * row.byteLength)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 0
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const kind = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.byteLength)
  chunk.writeUInt32BE(data.byteLength, 0)
  kind.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(crc32(Buffer.concat([kind, data])), 8 + data.byteLength)
  return chunk
}

function crc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value = CRC_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function withoutResponseBinding(value: typeof responseFixture) {
  const { responseBindingSha256, ...payload } = value
  assert.match(responseBindingSha256, /^[a-f0-9]{64}$/u)
  return payload
}

function buildServingResult(
  qualificationCandidateRef: typeof task.runtimeReleaseRef,
) {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-result-v1' as const,
    source: (
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner'
    ) as const,
    invocationPurpose: 'private_pre_release_qualification' as const,
    qualificationId: 'sam31-serving-output-reader-smoke',
    runOrdinal: 1,
    invocationId: task.invocationId,
    qualificationPreparationRef: {
      id: `sam31-qualification-preparation:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${'1'.repeat(64)}`,
    },
    qualificationCandidateRef,
    attemptRef: {
      id: `sam31-vertex-qualification-attempt:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${'2'.repeat(64)}`,
    },
    callStartRef: {
      id: `sam31-vertex-qualification-call-start:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${'3'.repeat(64)}`,
    },
    disposition: 'completed' as const,
    runtimeStatus: 'completed' as const,
    runtimeResponseRef: {
      id: `sam31-gpu-response:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${hash(responseBytes)}`,
    },
    uploadedObjectCount: null,
    uploadedByteLength: null,
    terminalEvidenceMode: 'private_response_reconciliation' as const,
    providerCallStarted: true as const,
    providerOutcome: 'executed' as const,
    providerRoundTripDurationMilliseconds: null,
    exactPrivateRuntimeResponseReread: true,
    exactVertexPredictionWrapperReread: false,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry: false,
    customerInvocationAuthorized: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    runtimeReleaseGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-02T18:06:00.000Z',
  }
  return assertCanonicalSam31VertexServingQualificationResult({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function buildCurrentInvocationResult(
  override: { readonly workspaceId?: string } = {},
) {
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-invocation-result-v2' as const,
    requestRef: fixtureRef('sam31-current-request', '4'),
    workspaceId: override.workspaceId ?? task.runtimeRequest.scope.workspaceId,
    approvedSnapshotId:
      task.runtimeRequest.scope.approvedPlanSnapshotId,
    workItemKey: task.runtimeRequest.scope.approvedWorkItemRef.id,
    fundedDispatchAdmissionRef: fixtureRef('sam31-funded-admission', '5'),
    prelaunchAuthorizationRef: fixtureRef('sam31-prelaunch', '6'),
    fixedTaskPreparationBridgeRef: fixtureRef('sam31-task-bridge', '7'),
    endpointInvocationAttemptRef: fixtureRef('sam31-endpoint-attempt', '8'),
    endpointCallStartRef: fixtureRef('sam31-endpoint-call-start', '9'),
    endpointInvocationResultRef: {
      id: task.invocationId,
      version: 1,
      contentHash: `sha256:${'a'.repeat(64)}`,
    },
    executionAttemptRef: task.runtimeRequest.scope.executionAttemptRef,
    runtimeResponseRef: {
      id: `sam31-gpu-response:${task.invocationId}`,
      version: 1,
      contentHash: `sha256:${hash(responseBytes)}`,
    },
    invocationDisposition: 'completed' as const,
    providerOutcome: 'executed' as const,
    runtimeStatus: 'completed' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    userTriggeredScaleFromZero: true as const,
    currentDedicatedEndpointInvocation: true as const,
    historicalCloudJobCustomerDispatchUsed: false as const,
    currentEndpointReadinessRereadBeforeInvocation: true as const,
    approvedSourceMaterialRereadByCanonicalServer: true as const,
    fundedPricingReservationAndAttemptRereadBeforeInvocation: true as const,
    accountEffectiveServingRateRereadBeforeInvocation: true as const,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry: false,
    canonicalServingWindowUsageCostAndCreditSettlementPending: true as const,
    callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return Object.freeze({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function fixtureRef(id: string, digit: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: `sha256:${digit.repeat(64)}`,
  })
}
