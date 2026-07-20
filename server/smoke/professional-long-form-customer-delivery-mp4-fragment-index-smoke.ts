import assert from 'node:assert/strict'

import {
  createProfessionalLongFormCustomerDeliveryMp4FragmentIndex,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MP4_FRAGMENT_INDEX_VERSION,
} from '../../src/lib/professional-long-form-customer-delivery-mp4-fragment-index'
import {
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture,
} from './professional-long-form-customer-delivery-fragmented-mp4-fixture'

const fixture =
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture({
    fragmentCount: 5,
    mediaPayloadBytesPerFragment: 128 * 1024,
    extendedFtyp: true,
  })
const index = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
const chunkPattern = [8, 3, 5, 17, 64 * 1024, 11, 7, 31 * 1024]
let offset = 0
let patternIndex = 0
while (offset < fixture.bytes.byteLength) {
  const end = Math.min(
    fixture.bytes.byteLength,
    offset + chunkPattern[patternIndex % chunkPattern.length]!,
  )
  index.push({ start: offset, bytes: fixture.bytes.slice(offset, end) })
  offset = end
  patternIndex += 1
}
const snapshot = index.finish({
  totalByteSize: fixture.bytes.byteLength,
  totalDurationSeconds: fixture.durationSeconds,
})
assert.equal(
  snapshot.schemaVersion,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MP4_FRAGMENT_INDEX_VERSION,
)
assert.equal(snapshot.fileTypeIndexed, true)
assert.equal(snapshot.initializationSegmentIndexed, true)
assert.equal(snapshot.videoTrackId, 1)
assert.deepEqual(snapshot.audioTrackIds, [2])
assert.equal(snapshot.fragmentCount, 5)
assert.equal(snapshot.complete, true)
assert.equal(snapshot.totalByteSize, fixture.bytes.byteLength)
assert.equal(snapshot.totalDurationSeconds, 5)
assert.deepEqual(
  snapshot.fragments.map((fragment) => ({
    ordinal: fragment.ordinal,
    sequenceNumber: fragment.sequenceNumber,
    byteStart: fragment.byteStart,
    byteEndExclusive: fragment.byteEndExclusive,
    decodeStartSeconds: fragment.decodeStartSeconds,
    containsVideoTrack: fragment.containsVideoTrack,
    containsAudioTrack: fragment.containsAudioTrack,
    containsMediaData: fragment.containsMediaData,
  })),
  fixture.fragmentByteRanges.map((fragment) => ({
    ordinal: fragment.ordinal,
    sequenceNumber: fragment.ordinal + 1,
    byteStart: fragment.byteStart,
    byteEndExclusive: fragment.byteEndExclusive,
    decodeStartSeconds: fragment.decodeStartSeconds,
    containsVideoTrack: true,
    containsAudioTrack: true,
    containsMediaData: true,
  })),
)

const recovery = index.resolveRecoveryWindow(2.4)
assert.deepEqual(recovery, {
  targetTimeSeconds: 2.4,
  byteStart: fixture.fragmentByteRanges[1]!.byteStart,
  byteEndExclusive: fixture.fragmentByteRanges[3]!.byteEndExclusive,
  firstFragmentOrdinal: 1,
  lastFragmentOrdinal: 3,
  targetFragmentOrdinal: 2,
  targetFragmentDecodeStartSeconds: 2,
  indexedFragmentCount: 5,
  indexComplete: true,
})
assert.equal(index.resolveRecoveryWindow(5.1), undefined)
assert.equal(
  JSON.stringify(snapshot).length < fixture.bytes.byteLength / 100,
  true,
)
assert.deepEqual(index.progress(), {
  contiguousByteCount: fixture.bytes.byteLength,
  initializationSegmentIndexed: true,
  fragmentCount: 5,
})

const discontinuous = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => discontinuous.push({ start: 1, bytes: new Uint8Array([0]) }),
  /lost contiguous byte authority/u,
)

const missingAudioFixture =
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture({
    fragmentCount: 1,
    mediaPayloadBytesPerFragment: 32,
    includeAudio: false,
  })
const missingAudio = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => missingAudio.push({ start: 0, bytes: missingAudioFixture.bytes }),
  /lacks AAC audio authority/u,
)

const oversizedMoof = Buffer.alloc(8)
oversizedMoof.writeUInt32BE((1024 * 1024) + 1, 0)
oversizedMoof.write('moof', 4, 4, 'ascii')
const oversized = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => oversized.push({ start: 0, bytes: oversizedMoof }),
  /moof metadata exceeds its bound/u,
)

const unsafeExtended = Buffer.alloc(16)
unsafeExtended.writeUInt32BE(1, 0)
unsafeExtended.write('free', 4, 4, 'ascii')
unsafeExtended.writeUInt32BE(0x20_0000, 8)
const unsafe = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => unsafe.push({ start: 0, bytes: unsafeExtended }),
  /browser-safe precision/u,
)

const nonMonotonicFixture =
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture({
    fragmentCount: 2,
    mediaPayloadBytesPerFragment: 32,
    decodeStartSeconds: [1, 0],
  })
const nonMonotonic =
  createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => nonMonotonic.push({ start: 0, bytes: nonMonotonicFixture.bytes }),
  /decode order is not monotonic/u,
)

const repeatedSequenceFixture =
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture({
    fragmentCount: 2,
    mediaPayloadBytesPerFragment: 32,
    sequenceNumbers: [1, 1],
  })
const repeatedSequence =
  createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => repeatedSequence.push({
    start: 0,
    bytes: repeatedSequenceFixture.bytes,
  }),
  /sequence authority is not monotonic/u,
)

const payloadlessFixture =
  createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture({
    fragmentCount: 2,
    mediaPayloadBytesPerFragment: 32,
    omitMediaPayloadOrdinals: [0],
  })
const payloadless = createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
assert.throws(
  () => payloadless.push({ start: 0, bytes: payloadlessFixture.bytes }),
  /fragment lacks bounded media payload/u,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion:
    'professional-long-form-customer-delivery-mp4-fragment-index-smoke-v1',
  exactInitializationAuthorityIndexed: true,
  exactVideoAndAudioTrackAuthorityIndexed: true,
  exactFragmentCount: snapshot.fragmentCount,
  splitExtendedHeaderAccepted: true,
  exactBackwardRecoveryWindowResolved: true,
  mediaPayloadBytesRetainedByIndex: 0,
  discontinuousInputRejected: true,
  missingAudioAuthorityRejected: true,
  oversizedMetadataRejected: true,
  unsafeIntegerRejected: true,
  nonMonotonicDecodeOrderRejected: true,
  nonMonotonicSequenceAuthorityRejected: true,
  payloadlessFragmentRejected: true,
  providerCalls: 0,
  cloudMutations: 0,
  billingActions: 0,
  productionReady: false,
}, null, 2))
