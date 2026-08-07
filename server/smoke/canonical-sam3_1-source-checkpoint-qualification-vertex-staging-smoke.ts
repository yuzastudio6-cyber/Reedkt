import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31QualificationStagingSourceSet,
  type CanonicalSam31QualificationPrivateStagingPort,
  type CanonicalSam31QualificationStagedObject,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import {
  createCanonicalSam31VertexQualificationStagingOwner,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-staging-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalIngest,
  candidate,
} from './canonical-sam3_1-source-checkpoint-qualification-smoke'
import {
  createCanonicalSam31QualificationWorkerEvidenceFixture,
} from './fixtures/canonical-sam3_1-qualification-worker-fixture'

const historical = createCanonicalSam31QualificationWorkerEvidenceFixture({
  candidate,
  ingestReceipt: canonicalIngest,
  qualificationId: 'sam31-vertex-staging',
  qualifiedAt: '2026-08-07T20:00:00.000Z',
}).request
const attemptId = 'sam31-vertex-staging-attempt-001'
const request = createCanonicalSam31VertexSourceCheckpointWorkerRequest({
  historicalPackageRequest: historical,
  attemptId,
  issuedAt: '2026-08-07T20:00:00.000Z',
})
const sourceSet = createCanonicalSam31QualificationStagingSourceSet({
  workerRequest: historical,
  checkpoint: {
    bucketName: 'reeditpro-production-reeditpro-model-artifacts',
    objectName: 'private/model-artifacts/sam3_1/checkpoint/sam3.1_multiplex.pt',
    generation: '123',
    etag: 'checkpoint-etag',
    byteLength: historical.checkpoint.byteLength,
    sha256: historical.checkpoint.sha256,
    contentType: 'application/octet-stream',
    artifactRef: historical.checkpoint.artifactRef,
    canonicalSourceAuthorityRef: {
      id: historical.ingestReceiptRef.id,
      version: historical.ingestReceiptRef.version,
      contentHash: historical.ingestReceiptRef.contentHash,
    },
    exactGenerationEtagLengthSha256AndContentTypeReread: true,
    publicOrSignedUrlUsed: false,
  },
  probeFixture: {
    bucketName: 'reeditpro-production-sam31-qualification-fixtures',
    objectName: 'private/fixtures/sam31/probe-person-v1.mp4',
    generation: '456',
    etag: 'fixture-etag',
    byteLength: historical.deterministicProbeFixture.byteLength,
    sha256: historical.deterministicProbeFixture.sha256,
    contentType: 'video/mp4',
    artifactRef: historical.deterministicProbeFixture.artifactRef,
    canonicalSourceAuthorityRef:
      historical.deterministicProbeFixture.artifactRef,
    exactGenerationEtagLengthSha256AndContentTypeReread: true,
    publicOrSignedUrlUsed: false,
  },
  observedAt: '2026-08-07T19:59:00.000Z',
})
const jsonObjects = new Map<string, Buffer>()
const staged = new Map<string, CanonicalSam31QualificationStagedObject>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(value) {
    const prior = jsonObjects.get(value.objectPath)
    if (prior) {
      assert.equal(digest(prior), value.contentSha256)
      return 'already_exists'
    }
    assert.equal(digest(value.body), value.contentSha256)
    jsonObjects.set(value.objectPath, Buffer.from(value.body))
    return 'created'
  },
  async readExact(path) {
    const value = jsonObjects.get(path)
    return value ? Buffer.from(value) : null
  },
}
const stagingPort: CanonicalSam31QualificationPrivateStagingPort = {
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-qualification-gcs-staging-port-v1',
  async createRequestJsonOnly(value) {
    staged.set(`${value.remoteSubdirectory}/request/request.json`,
      stagedObject('request/request.json', value.body.byteLength,
        value.sha256, 'application/json', false, null))
    return staged.get(`${value.remoteSubdirectory}/request/request.json`)
  },
  async copySourceObjectCreateOnly(value) {
    const contentType = value.targetObjectName.startsWith('checkpoint/')
      ? 'application/octet-stream' as const : 'video/mp4' as const
    staged.set(`${value.remoteSubdirectory}/${value.targetObjectName}`,
      stagedObject(value.targetObjectName, value.source.byteLength,
        value.source.sha256, contentType, true,
        sha256AuthorityValue(value.source)))
    return staged.get(`${value.remoteSubdirectory}/${value.targetObjectName}`)
  },
  async rereadStagedObject(value) {
    return staged.get(`${value.remoteSubdirectory}/${value.objectName}`) ?? null
  },
  async resultObjectExists() { return false },
  async listAttemptObjectNames(value) {
    return [...staged.keys()].filter((key) =>
      key.startsWith(`${value.remoteSubdirectory}/`)).sort()
  },
}
const owner = createCanonicalSam31VertexQualificationStagingOwner({
  historicalWorkerRequestReadPort: {
    async rereadExactWorkerRequest() { return structuredClone(historical) },
  },
  historicalSourceReadPort: {
    async rereadExactSources() { return structuredClone(sourceSet) },
  },
  stagingPort,
  observationObjectPort: objectPort,
  now: () => '2026-08-07T20:01:00.000Z',
})
const observation = await owner.stageOne({ workerRequest: request })
assert.equal(observation.attemptDigestSha256,
  sha256AuthorityValue(attemptId))
assert.equal(observation.remoteSubdirectory,
  `private/sam3_1/source-checkpoint-qualification/v2/attempts/${request.attemptDigestSha256}`)
assert.equal(observation.vertexCloudStorageFuseRoot,
  `/gcs/reeditpro-production-sam31-qualification-private/${observation.remoteSubdirectory}`)
assert.equal(observation.requestObject.sha256,
  digest(Buffer.from(stableAuthorityStringify(request), 'utf8')))
assert.equal(observation.checkpointObject.sha256, request.checkpoint.sha256)
assert.equal(observation.probeFixtureObject.sha256,
  request.deterministicProbeFixture.sha256)
assert.equal(observation.modelOrGpuRuntimeStarted, false)
assert.equal(observation.customerCreditsMutated, false)
assert.deepEqual(await owner.rereadExact({ workerRequest: request }), observation)

const crossed = structuredClone(request)
crossed.attemptId = 'other-attempt'
await assert.rejects(() => owner.stageOne({ workerRequest: crossed }))
const callerPath = structuredClone(request) as unknown as Record<string, unknown>
callerPath.path = '/gcs/caller'
await assert.rejects(() => owner.stageOne({ workerRequest: callerPath }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-qualification-staging',
  checks: 17,
  observationHash: observation.observationHash,
  modelOrGpuRuntimeStarted: false,
  customerCreditsMutated: false,
}, null, 2))

function stagedObject(
  objectName: 'request/request.json' | 'checkpoint/sam3.1_multiplex.pt'
    | 'fixture/probe-person.mp4',
  byteLength: number,
  sha: string,
  contentType: 'application/json' | 'application/octet-stream' | 'video/mp4',
  sourceCopy: boolean,
  sourceDigest: string | null,
): CanonicalSam31QualificationStagedObject {
  return {
    objectName,
    generation: String(staged.size + 1),
    etag: `etag-${staged.size + 1}`,
    byteLength,
    sha256: sha,
    contentType,
    destinationKmsKeyName:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const,
    exactDestinationGenerationEtagLengthSha256AndContentTypeReread:
      true as const,
    sourceGenerationBoundServerSideCopy: sourceCopy,
    sourceCoordinateDigestSha256: sourceDigest,
    createOnly: true as const,
  }
}

function digest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
