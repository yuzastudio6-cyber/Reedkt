import assert from 'node:assert/strict'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
  verifyLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'

const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenanceAudit =
  compileLivingFrameRepresentativeSourceProvenanceAudit()
const routing = compileLivingFrameRepresentativeSemanticSourceRouting(
  sourceCandidateSet,
  provenanceAudit,
)

assert.equal(
  verifyLivingFrameRepresentativeSemanticSourceRouting(
    routing,
    sourceCandidateSet,
    provenanceAudit,
  ),
  true,
)
assert.equal(routing.routeCount, 12)
assert.deepEqual(
  routing.routes.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(
  routing.routes.every((entry, order) =>
    entry.order === order
    && entry.effectiveSourceCandidateIds.length >= 1
    && new Set(entry.effectiveSourceCandidateIds).size
      === entry.effectiveSourceCandidateIds.length
    && entry.sourceTopicsMustMatchCanonicalNarrativeIntent
    && entry.transcriptOrClaimEvidenceMustSupportEverySource
    && !entry.semanticallyUnrelatedSourceCombinationPermitted
    && !entry.existingV1AdmissionMayDriveRepresentativeRender
    && entry.canonicalV2CandidateSetAndAdmissionRequired),
  true,
)
assert.deepEqual(
  routing.routes[0]!.effectiveSourceCandidateIds,
  [
    'nasa_earth_day_expert_interview_public_domain_candidate',
    LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
  ],
)
assert.equal(
  routing.routes[0]!.removedSourceCandidateIds.includes(
    'scientific_method_diagram_public_domain_candidate',
  ),
  true,
)
assert.deepEqual(
  routing.routes[4]!.effectiveSourceCandidateIds,
  ['scientific_method_diagram_public_domain_candidate'],
)
assert.equal(
  routing.routes[4]!.removedSourceCandidateIds.includes(
    'eia_world_oil_chokepoint_data_official_source_candidate',
  ),
  true,
)
assert.deepEqual(
  routing.routes[6]!.effectiveSourceCandidateIds,
  [
    'nasa_strait_of_hormuz_satellite_public_domain_candidate',
    'historical_strait_of_hormuz_map_public_domain_candidate',
    'eia_world_oil_chokepoint_data_official_source_candidate',
  ],
)
assert.equal(
  routing.routes[7]!.effectiveSourceCandidateIds.includes(
    'eia_world_oil_chokepoint_data_official_source_candidate',
  ),
  false,
)

const broll = routing.additionalSourceCandidate
assert.equal(
  broll.sourceCandidateId,
  LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
)
assert.equal(broll.sourceReportedWidthPixels, 1920)
assert.equal(broll.sourceReportedHeightPixels, 1080)
assert.equal(broll.sourceReportedDurationSeconds, 331)
assert.equal(broll.sourceReportedAudioPolicy, 'no_audio')
assert.equal(broll.sourceMotionOnlyNoGeneratedLivingSubjectAnimation, true)
assert.equal(broll.identifiablePersonsMayBePresent, true)
assert.equal(broll.publicityOrPersonUseReviewRequired, true)
assert.equal(broll.externalMediaBytesFetched, false)

assert.equal(routing.semanticMismatchDetectedInV1CaseBindings, true)
assert.equal(
  routing.currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime,
  true,
)
assert.equal(
  routing.canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired,
  true,
)
assert.equal(routing.characterAndMechanicalAnimationPausePreserved, true)
assert.equal(routing.externalMediaBytesFetched, false)
assert.equal(routing.runtimeExecuted, false)
assert.equal(routing.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeSemanticSourceRouting(
      candidate,
      sourceCandidateSet,
      provenanceAudit,
    ),
    false,
  )
  adversarialChecks += 1
}

reject({ ...routing, semanticMismatchDetectedInV1CaseBindings: false })
reject({ ...routing, currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime: false })
reject({ ...routing, canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired: false })
reject({ ...routing, characterAndMechanicalAnimationPausePreserved: false })
reject({ ...routing, externalMediaBytesFetched: true })
reject({ ...routing, runtimeExecuted: true })
reject({ ...routing, productionReady: true })
reject({
  ...routing,
  additionalSourceCandidate: {
    ...routing.additionalSourceCandidate,
    publicOrCustomerUsePermitted: true,
  },
})
reject({
  ...routing,
  additionalSourceCandidate: {
    ...routing.additionalSourceCandidate,
    sourceMotionOnlyNoGeneratedLivingSubjectAnimation: false,
  },
})
reject({
  ...routing,
  routes: routing.routes.map((entry, order) => order === 0
    ? { ...entry, existingV1AdmissionMayDriveRepresentativeRender: true }
    : entry),
})
reject({
  ...routing,
  routes: routing.routes.map((entry, order) => order === 7
    ? {
        ...entry,
        effectiveSourceCandidateIds: [
          ...entry.effectiveSourceCandidateIds,
          'eia_world_oil_chokepoint_data_official_source_candidate',
        ],
      }
    : entry),
})
reject({
  ...routing,
  routes: routing.routes.map((entry, order) => order === 4
    ? {
        ...entry,
        effectiveSourceCandidateIds: [
          ...entry.effectiveSourceCandidateIds,
          'eia_world_oil_chokepoint_data_official_source_candidate',
        ],
      }
    : entry),
})
assert.equal(adversarialChecks, 12)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_semantic_source_routing',
  status: 'passed_source_only_v1_admission_invalidated_v2_required',
  contractVersion: routing.contractVersion,
  routingDigestSha256: routing.routingDigestSha256,
  routeCount: routing.routeCount,
  addedTopicMatchedNasaBrollCandidate: true,
  unrelatedNasaHormuzCombinationRemoved: true,
  unrelatedDiagramEiaCombinationRemoved: true,
  currentV1RuntimeAdmissionInvalidated: true,
  externalMediaBytesFetched: false,
  runtimeExecuted: false,
  adversarialChecks,
  productionReady: false,
})}\n`)
