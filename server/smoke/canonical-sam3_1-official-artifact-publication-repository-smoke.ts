import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import {
  CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION,
  createCanonicalSam31GcsPrivateArtifactReadPort,
} from '../model-artifacts/canonical-sam3_1-gcs-official-artifact-publication'
import {
  canonicalSam31OfficialArtifactPublicationRef,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
  createCanonicalSam31GcsOfficialArtifactPublicationRepository,
} from '../services/canonical-sam3_1-official-artifact-publication-repository'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { receipt } from './canonical-sam3_1-official-artifact-publication-smoke'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const MODEL_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const
const publicationRef = canonicalSam31OfficialArtifactPublicationRef(receipt)
const receiptBody = Buffer.from(stableAuthorityStringify(receipt), 'utf8')
let publicationMetadataReads = 0
let publicationDownloads = 0
const repository = createCanonicalSam31GcsOfficialArtifactPublicationRepository({
  storage: publicationStorage({ body: receiptBody }) as never,
})
assert.equal(
  repository.schemaVersion,
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
)
assert.equal(repository.evidenceClass,
  'private_create_only_exact_generation_reread')
const reread = await repository.rereadOfficialArtifactPublication({
  publicationRef,
})
assert.deepEqual(reread, receipt)
assert.notEqual(reread, receipt)
assert.equal(publicationMetadataReads, 2)
assert.equal(publicationDownloads, 1)
assert.equal(await repository.rereadOfficialArtifactPublication({
  publicationRef: {
    ...publicationRef,
    id: 'missing-publication-attempt',
  },
}), null)
await assert.rejects(repository.rereadOfficialArtifactPublication({
  publicationRef,
  objectName: 'caller/path.json',
} as never))
await assert.rejects(
  createCanonicalSam31GcsOfficialArtifactPublicationRepository({
    storage: publicationStorage({
      body: Buffer.from(stableAuthorityStringify({
        ...receipt,
        authority: { ...receipt.authority, productionReady: true },
      })),
    }) as never,
  }).rereadOfficialArtifactPublication({ publicationRef }),
)
await assert.rejects(
  createCanonicalSam31GcsOfficialArtifactPublicationRepository({
    storage: publicationStorage({
      body: receiptBody,
      unstableEtag: true,
    }) as never,
  }).rereadOfficialArtifactPublication({ publicationRef }),
)

const artifactBody = Buffer.from('sam31-private-artifact-stream-fixture')
const coordinate = {
  projectId: PROJECT_ID,
  bucketName: MODEL_BUCKET,
  objectName:
    'private/model-artifacts/sam3_1/source/test/source-fixture.tar',
  generation: '101',
  etag: 'artifact-etag-101',
  byteLength: artifactBody.byteLength,
  sha256: digest(artifactBody),
}
let artifactMetadataReads = 0
let artifactStreams = 0
const artifactReadPort = createCanonicalSam31GcsPrivateArtifactReadPort({
  projectId: PROJECT_ID,
  bucketName: MODEL_BUCKET,
  storage: artifactStorage({ body: artifactBody }) as never,
})
assert.equal(
  artifactReadPort.schemaVersion,
  CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION,
)
const exactArtifact = await artifactReadPort.readExact(coordinate)
assert(exactArtifact)
assert.equal(exactArtifact.generationBeforeRead, coordinate.generation)
assert.equal(exactArtifact.generationAfterRead, coordinate.generation)
assert.equal(exactArtifact.etagBeforeRead, coordinate.etag)
assert.equal(exactArtifact.etagAfterRead, coordinate.etag)
assert.equal(exactArtifact.contentType, 'application/x-tar')
const chunks: Buffer[] = []
if (Buffer.isBuffer(exactArtifact.body)
  || exactArtifact.body instanceof Uint8Array) {
  throw new Error('Private artifact read unexpectedly materialized bytes.')
}
for await (const chunk of exactArtifact.body) chunks.push(Buffer.from(chunk))
assert.deepEqual(Buffer.concat(chunks), artifactBody)
assert.deepEqual(
  await exactArtifact.rereadMetadataAfterBodyConsumed?.(),
  {
    generationAfterRead: coordinate.generation,
    etagAfterRead: coordinate.etag,
  },
)
assert.equal(artifactMetadataReads, 2)
assert.equal(artifactStreams, 1)
assert.equal(await createCanonicalSam31GcsPrivateArtifactReadPort({
  projectId: PROJECT_ID,
  bucketName: MODEL_BUCKET,
  storage: artifactStorage({ body: artifactBody, missing: true }) as never,
}).readExact(coordinate), null)
await assert.rejects(artifactReadPort.readExact({
  ...coordinate,
  objectName: 'private/model-artifacts/sam3_1/../checkpoint.pt',
}))
assert.throws(() => createCanonicalSam31GcsPrivateArtifactReadPort({
  projectId: PROJECT_ID,
  bucketName: 'attacker-bucket' as never,
}))
await assert.rejects(createCanonicalSam31GcsPrivateArtifactReadPort({
  projectId: PROJECT_ID,
  bucketName: MODEL_BUCKET,
  storage: artifactStorage({ body: artifactBody, wrongSize: true }) as never,
}).readExact(coordinate))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-artifact-publication-repository',
  checks: 27,
  publicationReceiptExactGenerationReread: true,
  callerReceiptPathAccepted: false,
  privateArtifactExactGenerationStreamed: true,
  checkpointOrSourceMaterializedOnDeveloperMachine: false,
  signedOrPublicUrlUsed: false,
  modelOrGpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function publicationStorage(input: {
  body: Buffer
  unstableEtag?: boolean
}) {
  let metadataReads = 0
  const hash = publicationRef.contentHash.slice('sha256:'.length)
  const expectedName = `private/sam3_1/official-artifact-publication/v1/${
    publicationRef.id
  }-${hash.slice(0, 24)}.json`
  return {
    bucket(bucketName: string) {
      assert.equal(bucketName, CONTROL_BUCKET)
      return {
        file(objectName: string, options?: { generation?: string }) {
          const missing = objectName !== expectedName
          return {
            async getMetadata() {
              if (missing) throw Object.assign(new Error('missing'), {
                code: 404,
              })
              publicationMetadataReads += 1
              metadataReads += 1
              return [publicationMetadata(
                input.body,
                Boolean(input.unstableEtag && metadataReads > 1),
              )]
            },
            async download() {
              assert.equal(options?.generation, '91')
              publicationDownloads += 1
              return [Buffer.from(input.body)]
            },
          }
        },
      }
    },
  }
}

function publicationMetadata(body: Buffer, changedEtag = false) {
  return {
    generation: '91',
    etag: changedEtag ? 'changed-etag' : 'publication-etag-91',
    size: String(body.byteLength),
    contentType: 'application/json',
  }
}

function artifactStorage(input: {
  body: Buffer
  missing?: boolean
  wrongSize?: boolean
}) {
  return {
    bucket(bucketName: string) {
      assert.equal(bucketName, MODEL_BUCKET)
      return {
        file(objectName: string, options?: { generation?: string }) {
          assert.equal(objectName, coordinate.objectName)
          assert.equal(options?.generation, coordinate.generation)
          return {
            async getMetadata() {
              if (input.missing) throw Object.assign(new Error('missing'), {
                code: 404,
              })
              artifactMetadataReads += 1
              return [{
                generation: coordinate.generation,
                etag: coordinate.etag,
                size: String(input.wrongSize
                  ? coordinate.byteLength + 1
                  : coordinate.byteLength),
                contentType: 'application/x-tar',
              }]
            },
            createReadStream() {
              artifactStreams += 1
              return Readable.from([Buffer.from(input.body)])
            },
          }
        },
      }
    },
  }
}

function digest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
