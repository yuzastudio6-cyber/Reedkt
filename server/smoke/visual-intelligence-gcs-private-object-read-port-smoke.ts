import assert from 'node:assert/strict'

import type { Storage } from '@google-cloud/storage'

import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'

const bucketName = 'reeditpro-control-plane'
const objectName =
  'private/visual-intelligence/releases/gemini-pro-high/v1/release.json'
const body = Buffer.from('{"release":"qualified"}', 'utf8')
let stored = {
  generation: '101',
  etag: 'etag-101',
  contentType: 'application/json',
  size: String(body.byteLength),
}
let changeAfterDownload = false
let signedUrlCalls = 0
let downloadCalls = 0

const storage = {
  bucket(requestedBucket: string) {
    assert.equal(requestedBucket, bucketName)
    return {
      file(requestedObject: string, options?: { generation?: string }) {
        assert.equal(requestedObject, objectName)
        const requestedGeneration = options?.generation
        return {
          async getMetadata() {
            if (
              requestedGeneration
              && requestedGeneration !== stored.generation
            ) throw cloudError(404)
            if (changeAfterDownload && downloadCalls > 0) {
              return [{ ...stored, etag: 'etag-changed-after-download' }]
            }
            return [{ ...stored }]
          },
          async download() {
            downloadCalls += 1
            return [Buffer.from(body)]
          },
          async getSignedUrl() {
            signedUrlCalls += 1
            return ['https://forbidden.example']
          },
        }
      },
    }
  },
} as unknown as Storage

const port = createVisualIntelligenceGcsPrivateObjectReadPort({
  projectId: 'reeditpro',
  storage,
  maximumObjectBytes: 1_024,
})
const exact = await port.readExact({
  bucketName,
  objectName,
  generation: stored.generation,
  etag: stored.etag,
})
assert.ok(exact)
assert.deepEqual(exact.body, body)
assert.equal(exact.generation, stored.generation)
assert.equal(exact.etag, stored.etag)
assert.equal(exact.contentType, stored.contentType)
assert.equal(signedUrlCalls, 0)

const liveThenPinned = await port.readExact({ bucketName, objectName })
assert.ok(liveThenPinned)
assert.equal(liveThenPinned.generation, stored.generation)
assert.equal(signedUrlCalls, 0)

let adversarialRefusals = 0
async function rejects(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  adversarialRefusals += 1
}

assert.equal(await port.readExact({
  bucketName,
  objectName,
  generation: '999',
  etag: stored.etag,
}), null)
adversarialRefusals += 1
await rejects(() => port.readExact({
  bucketName,
  objectName,
  generation: stored.generation,
  etag: 'wrong-etag',
}))
await rejects(() => port.readExact({
  bucketName,
  objectName: '../release.json',
}))
await rejects(() => port.readExact({
  bucketName: 'INVALID_BUCKET',
  objectName,
}))
await rejects(() => port.readExact({
  bucketName,
  objectName,
  generation: '0',
}))

stored = { ...stored, size: '2048' }
await rejects(() => port.readExact({
  bucketName,
  objectName,
  generation: stored.generation,
  etag: stored.etag,
}))
stored = { ...stored, size: String(body.byteLength) }

changeAfterDownload = true
downloadCalls = 0
await rejects(() => port.readExact({
  bucketName,
  objectName,
  generation: stored.generation,
  etag: stored.etag,
}))
changeAfterDownload = false

assert.throws(() => createVisualIntelligenceGcsPrivateObjectReadPort({
  projectId: '../caller-project',
  storage,
}))
adversarialRefusals += 1
assert.throws(() => createVisualIntelligenceGcsPrivateObjectReadPort({
  projectId: 'reeditpro',
  storage,
  maximumObjectBytes: 128 * 1024 * 1024,
}))
adversarialRefusals += 1

assert.equal(adversarialRefusals, 9)
assert.equal(signedUrlCalls, 0)
console.log(JSON.stringify({
  status: 'visual_intelligence_gcs_private_object_read_port_smoke_passed',
  liveGenerationPinnedBeforeDownload: true,
  exactGenerationAndEtagVerified: true,
  metadataStabilityVerifiedAfterDownload: true,
  signedUrlCreated: false,
  publicObjectAccepted: false,
  adversarialRefusals,
}))

function cloudError(code: number): Error & { code: number } {
  return Object.assign(new Error(`controlled-cloud-error-${code}`), { code })
}
