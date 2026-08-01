import assert from 'node:assert/strict'

import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSetV2,
  verifyLivingFrameRepresentativeMediaSourceCandidateSetV2,
} from '../living-frame/living-frame-representative-media-source-candidates-v2'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'

const v1 = compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenance = compileLivingFrameRepresentativeSourceProvenanceAudit()
const routing = compileLivingFrameRepresentativeSemanticSourceRouting(
  v1,
  provenance,
)
const v2 = compileLivingFrameRepresentativeMediaSourceCandidateSetV2(
  v1,
  provenance,
  routing,
)

assert.equal(
  verifyLivingFrameRepresentativeMediaSourceCandidateSetV2(
    v2,
    v1,
    provenance,
    routing,
  ),
  true,
)
assert.equal(v2.sourceCandidateCount, 8)
assert.equal(v2.sources.length, 8)
assert.equal(new Set(v2.sources.map((source) => source.sourceCandidateId)).size, 8)
assert.equal(v2.sources.filter((source) => source.expectedContentType === 'video/mp4').length, 2)
assert.equal(v2.sources.some((source) => String(source.expectedContentType) === 'video/webm'), false)
assert.equal(v2.sources.filter((source) => source.officialSourceMp4VariantSelected).length, 2)
assert.equal(v2.sources.every((source, order) =>
  source.order === order
  && source.legacyWebmVariantMayDriveRuntime === false
  && source.exactSourceByteLengthPending
  && source.exactSourceSha256Pending
  && source.immutablePrivateIngestPending
  && source.canonicalReaderRereadPending
  && source.callerSelectedVariantPermitted === false
  && source.externalMediaBytesFetched === false), true)
assert.equal(v2.webmConversionLaneRequired, false)
assert.equal(v2.webmSubstitutionPermitted, false)
assert.equal(v2.nonVideoCanonicalSourceReaderExtensionPending, true)
assert.equal(v2.canonicalStructuredDataSnapshotPending, true)
assert.equal(v2.characterAndMechanicalAnimationPausePreserved, true)
assert.equal(v2.runtimeExecuted, false)
assert.equal(v2.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeMediaSourceCandidateSetV2(
      candidate,
      v1,
      provenance,
      routing,
    ),
    false,
  )
  adversarialChecks += 1
}

reject({ ...v2, sourceCandidateCount: 7 })
reject({ ...v2, webmConversionLaneRequired: true })
reject({ ...v2, webmSubstitutionPermitted: true })
reject({ ...v2, nonVideoCanonicalSourceReaderExtensionPending: false })
reject({ ...v2, characterAndMechanicalAnimationPausePreserved: false })
reject({ ...v2, externalMediaBytesFetched: true })
reject({ ...v2, runtimeExecuted: true })
reject({ ...v2, productionReady: true })
reject({ ...v2, sourceSetDigestSha256: '0'.repeat(64) })
reject({
  ...v2,
  sources: v2.sources.map((source, order) => order === 0
    ? { ...source, expectedContentType: 'video/webm' }
    : source),
})
reject({
  ...v2,
  sources: v2.sources.map((source, order) => order === 1
    ? { ...source, officialSourceMp4VariantSelected: false }
    : source),
})
reject({
  ...v2,
  sources: v2.sources.map((source, order) => order === 2
    ? { ...source, sourceReaderDisposition: 'canonical_approved_mp4_stream_reader' }
    : source),
})
reject({
  ...v2,
  sources: v2.sources.map((source, order) => order === 5
    ? { ...source, sourceReaderDisposition: 'canonical_uploaded_visual_source_reader_extension_pending' }
    : source),
})
reject({
  ...v2,
  sources: v2.sources.map((source, order) => order === 0
    ? { ...source, callerSelectedVariantPermitted: true }
    : source),
})

assert.equal(adversarialChecks, 14)

console.info(JSON.stringify({
  status: 'living_frame_representative_media_source_candidates_v2_verified',
  sourceCandidateCount: v2.sourceCandidateCount,
  officialNasaMp4VariantCount: v2.officialNasaMp4VariantCount,
  webmConversionLaneRequired: v2.webmConversionLaneRequired,
  nonVideoCanonicalSourceReaderExtensionPending:
    v2.nonVideoCanonicalSourceReaderExtensionPending,
  adversarialChecks,
  operationRegistered: v2.operationRegistered,
  runtimeExecuted: v2.runtimeExecuted,
  productionReady: v2.productionReady,
}, null, 2))
