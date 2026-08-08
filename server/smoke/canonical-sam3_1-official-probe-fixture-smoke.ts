import assert from 'node:assert/strict'

import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
  assertCanonicalSam31OfficialProbeFixtureReceipt,
  publishCanonicalSam31OfficialProbeFixture,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'

const coordinate = {
  projectId: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.projectId,
  bucketName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.bucketName,
  objectName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.objectName,
  generation: '1786158000000000',
  etag: 'fixture-etag',
  byteLength: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
  sha256: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256,
  contentType: 'video/mp4' as const,
  kmsKeyName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName,
  kmsKeyVersionName:
    `${CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName}/cryptoKeyVersions/1`,
  metadata: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
}

const receipt = await publishCanonicalSam31OfficialProbeFixture({
  sourcePort: {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
    async openExactPinnedFixture() {
      return {
        contentType: 'application/octet-stream',
        body: (async function* () { yield Uint8Array.from([1]) })(),
        exactPinnedRevisionPathLengthAndSha256Enforced: true,
      }
    },
  },
  publicationPort: {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
    async persistCreateOnlyAndReread() {
      return { disposition: 'created' as const, coordinate }
    },
  },
  publishedAt: '2026-08-08T02:55:00.000Z',
})

assert.equal(receipt.status, 'ready_for_source_checkpoint_qualification')
assert.equal(receipt.fixture.width, 960)
assert.equal(receipt.fixture.height, 540)
assert.equal(receipt.fixture.sourceFrameCount, 200)
assert.equal(receipt.fixture.qualificationFrameCount, 64)
assert.equal(receipt.fixture.fixedTextPrompt, 'person')
assert.equal(receipt.sourceMediaDecodedOrTranscodedDuringIngest, false)
assert.equal(receipt.gpuOrModelRuntimeStarted, false)
assert.equal(receipt.customerMediaUsed, false)
assert.equal(receipt.customerCreditsMutated, false)
assert.equal(receipt.productionAuthorityGranted, false)
assert.deepEqual(
  assertCanonicalSam31OfficialProbeFixtureReceipt(receipt),
  receipt,
)

for (const mutation of [
  { fixture: { ...receipt.fixture, qualificationFrameCount: 65 } },
  { sourceMediaDecodedOrTranscodedDuringIngest: true },
  { gpuOrModelRuntimeStarted: true },
  { customerMediaUsed: true },
  { customerCreditsMutated: true },
  { productionAuthorityGranted: true },
  {
    fixture: {
      ...receipt.fixture,
      coordinate: {
        ...receipt.fixture.coordinate,
        kmsKeyVersionName:
          CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName,
      },
    },
  },
  { receiptHash: '0'.repeat(64) },
] as const) {
  assert.throws(() => assertCanonicalSam31OfficialProbeFixtureReceipt({
    ...receipt,
    ...mutation,
  }))
}

await assert.rejects(() => publishCanonicalSam31OfficialProbeFixture({
  sourcePort: {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
    async openExactPinnedFixture() {
      return {
        contentType: 'video/mp4' as never,
        body: (async function* () { yield Uint8Array.from([1]) })(),
        exactPinnedRevisionPathLengthAndSha256Enforced: true,
      }
    },
  },
  publicationPort: {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
    async persistCreateOnlyAndReread() {
      return { disposition: 'created' as const, coordinate }
    },
  },
  publishedAt: '2026-08-08T02:55:00.000Z',
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-probe-fixture',
  checks: 21,
  officialPinnedAssetReusedWithoutTranscode: true,
  qualificationFrames: 64,
  customerMediaUsed: false,
  developerMachineArtifactSourceAccepted: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
