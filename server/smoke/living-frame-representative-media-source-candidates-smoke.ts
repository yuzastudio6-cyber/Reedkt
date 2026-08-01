import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS,
} from '../../src/types/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'

const sourceSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()

assert.equal(
  verifyLivingFrameRepresentativeMediaSourceCandidateSet(sourceSet),
  true,
)
assert.equal(sourceSet.sourceCandidateCount, 7)
assert.equal(sourceSet.caseBindingCount, 12)
assert.deepEqual(
  sourceSet.sources.map((entry) => entry.sourceCandidateId),
  LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS,
)
assert.deepEqual(
  sourceSet.caseBindings.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(
  sourceSet.sources.every((entry, order) =>
    entry.order === order
    && entry.attributionRequiredByInternalPolicy
    && !entry.selectedSegmentOrCropApproved
    && !entry.canonicalAssetIngested
    && !entry.immutableBytesReread
    && !entry.externalNetworkFetchMade
    && !entry.approvedWorkOrManifestEntryCreated
    && !entry.publicOrCustomerUsePermitted),
  true,
)
assert.equal(
  sourceSet.caseBindings.every((entry, order) =>
    entry.order === order
    && entry.requiredSourceCandidateIds.length >= 1
    && entry.selectedSourceSegmentOrCropPending
    && entry.canonicalAssetIngestPending
    && entry.representativeRuntimePending),
  true,
)
assert.equal(
  sourceSet.sources[0]!.publicityOrPersonUseReviewRequired,
  true,
)
assert.equal(
  sourceSet.sources[4]!.sourceOrLicenseClass,
  'official_us_government_analysis_third_party_inputs_review_required',
)
assert.equal(
  sourceSet.currentGeometryProbeReusedAsRepresentativeMedia,
  false,
)
assert.equal(sourceSet.generatedFixturePresentedAsAuthenticArchive, false)
assert.equal(sourceSet.identifiablePersonCustomerUseAuthorized, false)
assert.equal(sourceSet.legalLicensePublicityReviewComplete, false)
assert.equal(sourceSet.canonicalIngestPending, true)
assert.equal(sourceSet.runtimeExecuted, false)
assert.equal(sourceSet.productionReady, false)

const fixtureRoot = join(
  process.cwd(),
  'server',
  'smoke',
  'fixtures',
  'assets',
)
const localFixtures = [
  {
    fileName: 'living-frame-astronomer-flat-editorial-alpha-v1.png',
    expectedByteLength: 1_342_199,
    expectedSha256:
      'b87db6ca3fb2300f361a2e44adae44821507e25a5cdd3832ad37f49d5871c340',
  },
  {
    fileName: 'living-frame-locomotive-paper-collage-alpha-v1.png',
    expectedByteLength: 1_504_845,
    expectedSha256:
      'f8b7c75bd4bec69161af22f113cf09aac3de98231f3457eb40d4c0ee83331ac3',
  },
] as const
for (const fixture of localFixtures) {
  const path = join(fixtureRoot, fixture.fileName)
  assert.equal((await stat(path)).size, fixture.expectedByteLength)
  assert.equal(await sha256File(path), fixture.expectedSha256)
}

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeMediaSourceCandidateSet(candidate),
    false,
  )
  adversarialChecks += 1
}
reject({ ...sourceSet, sourceCandidateCount: 6 })
reject({ ...sourceSet, currentGeometryProbeReusedAsRepresentativeMedia: true })
reject({ ...sourceSet, generatedFixturePresentedAsAuthenticArchive: true })
reject({ ...sourceSet, identifiablePersonCustomerUseAuthorized: true })
reject({ ...sourceSet, legalLicensePublicityReviewComplete: true })
reject({ ...sourceSet, canonicalIngestPending: false })
reject({ ...sourceSet, representativeMediaRuntimeExecuted: true })
reject({
  ...sourceSet,
  sources: sourceSet.sources.map((entry, order) => order === 0
    ? { ...entry, externalNetworkFetchMade: true }
    : entry),
})
reject({
  ...sourceSet,
  caseBindings: sourceSet.caseBindings.map((entry, order) => order === 0
    ? { ...entry, selectedSourceSegmentOrCropPending: false }
    : entry),
})
assert.equal(adversarialChecks, 9)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_media_source_candidates',
  status: 'passed_source_only',
  contractVersion: sourceSet.contractVersion,
  candidateSetDigestSha256: sourceSet.candidateSetDigestSha256,
  sourceCandidateCount: sourceSet.sourceCandidateCount,
  caseBindingCount: sourceSet.caseBindingCount,
  localFixtureDigestAndByteLengthVerified: true,
  externalSourceBytesPresentInRepository: false,
  externalNetworkFetchMade: false,
  canonicalIngestPending: true,
  legalLicensePublicityReviewComplete: false,
  geometryProbeReusedAsRepresentativeMedia: false,
  representativeMediaRuntimeExecuted: false,
  adversarialChecks,
  productionReady: false,
})}\n`)

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
