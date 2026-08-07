import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import type { Storage } from '@google-cloud/storage'

import {
  CANONICAL_SAM3_1_GCS_QUALIFICATION_CAPSULE_READ_PORT_VERSION,
  createCanonicalSam31GcsQualificationCapsuleReadPort,
} from '../services/canonical-sam3_1-qualification-capsule-runtime'

const body = Buffer.from('bounded-private-capsule', 'utf8')
const coordinate = {
  projectId: 'reeditpro' as const,
  bucketName:
    'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    'private/image-build-inputs/sam3_1/qualification/reproducibility/11111111-1111-4111-8111-111111111111/private-capsule-output/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.tar.gz',
  generation: '1786079000000000',
  etag: 'capsule-etag-1',
  byteLength: body.byteLength,
  sha256: 'a'.repeat(64),
}

const stable = fakeStorage({ body })
const port = createCanonicalSam31GcsQualificationCapsuleReadPort({
  storage: stable.storage,
})
assert.equal(
  port.schemaVersion,
  CANONICAL_SAM3_1_GCS_QUALIFICATION_CAPSULE_READ_PORT_VERSION,
)
const observed = await port.readExact(coordinate)
assert(observed)
const chunks: Buffer[] = []
for await (const chunk of observed.body as AsyncIterable<Uint8Array>) {
  chunks.push(Buffer.from(chunk))
}
assert(Buffer.concat(chunks).equals(body))
assert.equal(stable.metadataReads(), 2)

const changed = fakeStorage({ body, mutateAfterRead: true })
const changedPort = createCanonicalSam31GcsQualificationCapsuleReadPort({
  storage: changed.storage,
})
const changedObject = await changedPort.readExact(coordinate)
assert(changedObject)
await assert.rejects(async () => {
  for await (const chunk of changedObject.body as AsyncIterable<Uint8Array>) {
    assert(chunk.byteLength > 0)
  }
})

const missing = createCanonicalSam31GcsQualificationCapsuleReadPort({
  storage: fakeStorage({ body, notFound: true }).storage,
})
assert.equal(await missing.readExact(coordinate), null)

await assert.rejects(() => port.readExact({
  ...coordinate,
  objectName: 'private/model-artifacts/sam3_1/checkpoint.pt',
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-capsule-runtime',
  exactGenerationStreamReread: true,
  metadataStableBeforeAndAfterBody: true,
  missingObjectFailsClosed: true,
  crossPrefixReadRejected: true,
  checkpointReadAuthorized: false,
  developerMachineInstallPerformed: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function fakeStorage(input: {
  readonly body: Buffer
  readonly mutateAfterRead?: boolean
  readonly notFound?: boolean
}): { readonly storage: Storage; readonly metadataReads: () => number } {
  let metadataReads = 0
  const metadata = () => {
    metadataReads += 1
    if (input.notFound) throw Object.assign(new Error('missing'), { code: 404 })
    return [{
      generation: coordinate.generation,
      etag: input.mutateAfterRead && metadataReads > 1
        ? 'changed-etag'
        : coordinate.etag,
      size: String(input.body.byteLength),
      contentType: 'application/gzip',
    }]
  }
  const storage = {
    bucket(bucketName: string) {
      assert.equal(bucketName, coordinate.bucketName)
      return {
        file(objectName: string, options: { generation: number }) {
          assert.equal(objectName, coordinate.objectName)
          assert.equal(options.generation, Number(coordinate.generation))
          return {
            getMetadata: metadata,
            createReadStream() {
              return Readable.from([Buffer.from(input.body)])
            },
          }
        },
      }
    },
  } as unknown as Storage
  return { storage, metadataReads: () => metadataReads }
}
