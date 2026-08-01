import assert from 'node:assert/strict'

import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSetV2,
} from '../living-frame/living-frame-representative-media-source-candidates-v2'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'
import {
  compileLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate,
  verifyLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate,
} from '../living-frame/living-frame-representative-still-data-source-read-admission-candidate'

const sourceCandidateSetV1 =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenanceAudit =
  compileLivingFrameRepresentativeSourceProvenanceAudit()
const semanticRouting = compileLivingFrameRepresentativeSemanticSourceRouting(
  sourceCandidateSetV1,
  provenanceAudit,
)
const sourceCandidateSetV2 =
  compileLivingFrameRepresentativeMediaSourceCandidateSetV2(
    sourceCandidateSetV1,
    provenanceAudit,
    semanticRouting,
  )
const input = {
  sourceCandidateSetV1,
  provenanceAudit,
  semanticRouting,
  sourceCandidateSetV2,
}
const admission =
  compileLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(input)

assert.equal(
  verifyLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
    admission,
    input,
  ),
  true,
)
assert.equal(admission.nonVideoSourceCount, 6)
assert.equal(admission.rasterSourceCount, 4)
assert.equal(admission.svgSourceCount, 1)
assert.equal(admission.structuredJsonSourceCount, 1)
assert.equal(admission.excludedExistingMp4VideoSourceCount, 2)
assert.deepEqual(admission.requiredFutureClosedSourceKindUnion, [
  'video',
  'raster',
  'svg',
  'structured_json',
])
assert.equal(admission.profiles.every((profile, order) =>
  profile.order === order
  && profile.finalizedUploadAuthorityRereadRequired
  && profile.approvedSnapshotWorkAndSourceManifestRereadRequired
  && profile.storageGenerationEtagShaAndLengthRereadRequired
  && profile.mimeSignatureOrSchemaValidationRequired
  && profile.callerBytesPathUrlOrStorageIdentityPermitted === false
  && profile.workerPayloadContainsBytesPathUrlOrStorageIdentity === false
  && profile.dependencyArtifactReaderRepurposedAsUploadReader === false
  && profile.canonicalReaderExtensionAvailable === false
  && profile.canonicalRereadPending
  && profile.admissionGranted === false), true)
assert.equal(admission.profiles.every((profile) =>
  profile.rasterDecodeAndDimensionValidationRequired
    === (profile.sourceKind === 'raster')
  && profile.svgUtf8RootActiveContentAndExternalReferenceValidationRequired
    === (profile.sourceKind === 'svg')
  && profile.structuredJsonClosedSchemaAndCitationValidationRequired
    === (profile.sourceKind === 'structured_json')), true)
assert.equal(admission.canonicalConsumptionPending, true)
assert.equal(admission.operationRegistered, false)
assert.equal(admission.runtimeExecuted, false)
assert.equal(admission.sourceReadExecuted, false)
assert.equal(admission.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
      candidate,
      input,
    ),
    false,
  )
  adversarialChecks += 1
}

reject({ ...admission, nonVideoSourceCount: 5 })
reject({ ...admission, currentExecutableUploadedSourceReadConstraint: 'all_media' })
reject({ ...admission, requiredFutureManifestAndReaderVersioningPending: false })
reject({ ...admission, canonicalDependencyArtifactReaderMustRemainDependencyOnly: false })
reject({ ...admission, characterAndMechanicalAnimationPausePreserved: false })
reject({ ...admission, canonicalConsumptionPending: false })
reject({ ...admission, runtimeExecuted: true })
reject({ ...admission, sourceReadExecuted: true })
reject({ ...admission, productionReady: true })
reject({ ...admission, admissionCandidateDigestSha256: '0'.repeat(64) })
reject({
  ...admission,
  profiles: admission.profiles.map((profile, order) => order === 0
    ? { ...profile, admissionGranted: true }
    : profile),
})
reject({
  ...admission,
  profiles: admission.profiles.map((profile, order) => order === 1
    ? { ...profile, callerBytesPathUrlOrStorageIdentityPermitted: true }
    : profile),
})
reject({
  ...admission,
  profiles: admission.profiles.map((profile, order) => order === 2
    ? { ...profile, dependencyArtifactReaderRepurposedAsUploadReader: true }
    : profile),
})
reject({
  ...admission,
  profiles: admission.profiles.map((profile, order) => order === 3
    ? { ...profile, proposedMaximumBufferedBytes: 1024 * 1024 * 1024 }
    : profile),
})
reject({
  ...admission,
  profiles: admission.profiles.map((profile, order) => order === 4
    ? { ...profile, workerPayloadContainsBytesPathUrlOrStorageIdentity: true }
    : profile),
})
assert.equal(
  verifyLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
    admission,
    {
      ...input,
      sourceUrl: 'https://example.invalid/source.png',
    } as unknown as typeof input,
  ),
  false,
)
adversarialChecks += 1

assert.equal(adversarialChecks, 16)

console.info(JSON.stringify({
  status: 'living_frame_representative_still_data_source_read_admission_candidate_verified',
  nonVideoSourceCount: admission.nonVideoSourceCount,
  rasterSourceCount: admission.rasterSourceCount,
  svgSourceCount: admission.svgSourceCount,
  structuredJsonSourceCount: admission.structuredJsonSourceCount,
  canonicalConsumptionPending: admission.canonicalConsumptionPending,
  adversarialChecks,
  operationRegistered: admission.operationRegistered,
  runtimeExecuted: admission.runtimeExecuted,
  productionReady: admission.productionReady,
}, null, 2))
