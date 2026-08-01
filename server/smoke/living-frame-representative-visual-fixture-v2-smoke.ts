import assert from 'node:assert/strict'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'
import {
  compileLivingFrameRepresentativeVisualFixtureManifestV2,
  verifyLivingFrameRepresentativeVisualFixtureManifestV2,
} from '../living-frame/living-frame-representative-visual-fixture-v2'

const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
const v1VisualFixture =
  compileLivingFrameRepresentativeVisualFixtureManifest(ownerScopeAmendment)
const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenanceAudit =
  compileLivingFrameRepresentativeSourceProvenanceAudit()
const semanticRouting =
  compileLivingFrameRepresentativeSemanticSourceRouting(
    sourceCandidateSet,
    provenanceAudit,
  )
const input = {
  ownerScopeAmendment,
  v1VisualFixture,
  sourceCandidateSet,
  provenanceAudit,
  semanticRouting,
}
const fixture =
  compileLivingFrameRepresentativeVisualFixtureManifestV2(input)

assert.equal(
  verifyLivingFrameRepresentativeVisualFixtureManifestV2(fixture, input),
  true,
)
assert.equal(Object.isFrozen(fixture), true)
assert.deepEqual(
  fixture.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(fixture.activeCaseCount, 12)
assert.equal(fixture.directTopicMatchedBrollCaseCount, 2)
assert.equal(fixture.hybridAndAttentionV1StillRoleRemoved, true)
assert.equal(fixture.automaticDerivedStillSubstitutionPermitted, false)
assert.equal(fixture.v1FixtureMayDriveRepresentativeRuntime, false)
assert.equal(fixture.sharedCanonicalFixtureMutated, false)
for (const order of [5, 7] as const) {
  const caseFixture = fixture.cases[order]!
  assert.equal(
    caseFixture.v1RequiredAssetRoles.includes(
      'approved_non_character_still',
    ),
    true,
  )
  assert.equal(
    caseFixture.requiredAssetRoles.includes(
      'approved_non_character_still',
    ),
    false,
  )
  assert.equal(
    caseFixture.requiredAssetRoles.includes(
      'approved_topic_matched_source_broll_video',
    ),
    true,
  )
  assert.deepEqual(
    caseFixture.removedV1AssetRoles,
    ['approved_non_character_still'],
  )
  assert.deepEqual(
    caseFixture.addedV2AssetRoles,
    ['approved_topic_matched_source_broll_video'],
  )
  assert.equal(
    caseFixture.brollRequirement.sourceCandidateId,
    'nasa_earth_day_cut_broll_public_domain_candidate',
  )
  assert.equal(
    caseFixture.brollRequirement.exactPrivateSourceBindingV2Required,
    true,
  )
  assert.equal(
    caseFixture.brollRequirement.canonicalContentAnalysisRereadRequired,
    true,
  )
  assert.equal(
    caseFixture.brollRequirement.originalApprovedSourceMotionPermitted,
    true,
  )
  assert.equal(
    caseFixture.brollRequirement.derivedStillMaySubstituteAutomatically,
    false,
  )
  assert.equal(caseFixture.representativeRuntimePermitted, false)
}
assert.equal(
  fixture.cases[5]!.brollRequirement.selectionPolicy,
  'exact_non_character_source_segment_required',
)
assert.equal(
  fixture.cases[7]!.brollRequirement.selectionPolicy,
  'exact_topic_matched_source_segment_required',
)
assert.equal(
  fixture.cases.filter((entry) =>
    entry.brollRequirement.selectionPolicy !== 'not_required').length,
  2,
)
assert.equal(
  fixture.cases.every((entry) =>
    !entry.brollRequirement.generatedLivingOrOrganicSubjectAnimationPermitted
    && !entry.brollRequirement.livingOrOrganicSubjectRiggingPermitted
    && !entry.brollRequirement.mechanicalRiggingPermitted
    && !entry.brollRequirement.derivedStillMaySubstituteAutomatically
    && entry.brollRequirement
      .optionalFreezeFrameRequiresSeparateHeadDecisionWorkAssetQaAndManifest
    && entry.caseSourceAdmissionV2Required
    && entry.caseSourceAdmissionV2DigestPending
    && !entry.representativeRuntimePermitted),
  true,
)
assert.equal(fixture.representativeMediaRuntimeExecuted, false)
assert.equal(fixture.qwenProviderCallMade, false)
assert.equal(fixture.headQaRecommendationMade, false)
assert.equal(fixture.canonicalPrivateReviewApproved, false)
assert.equal(fixture.canonicalConsumptionPending, true)
assert.equal(fixture.runtimeExecuted, false)
assert.equal(fixture.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeVisualFixtureManifestV2(candidate, input),
    false,
  )
  adversarialChecks += 1
}
reject({ ...fixture, hybridAndAttentionV1StillRoleRemoved: false })
reject({ ...fixture, automaticDerivedStillSubstitutionPermitted: true })
reject({ ...fixture, v1FixtureMayDriveRepresentativeRuntime: true })
reject({ ...fixture, sharedCanonicalFixtureMutated: true })
reject({ ...fixture, runtimeExecuted: true })
reject({ ...fixture, productionReady: true })
reject({
  ...fixture,
  cases: fixture.cases.map((entry, order) => order === 5
    ? {
        ...entry,
        requiredAssetRoles: [
          ...entry.requiredAssetRoles,
          'approved_non_character_still',
        ],
      }
    : entry),
})
reject({
  ...fixture,
  cases: fixture.cases.map((entry, order) => order === 5
    ? {
        ...entry,
        brollRequirement: {
          ...entry.brollRequirement,
          selectionPolicy: 'exact_topic_matched_source_segment_required',
        },
      }
    : entry),
})
reject({
  ...fixture,
  cases: fixture.cases.map((entry, order) => order === 7
    ? {
        ...entry,
        brollRequirement: {
          ...entry.brollRequirement,
          derivedStillMaySubstituteAutomatically: true,
        },
      }
    : entry),
})
reject({
  ...fixture,
  cases: fixture.cases.map((entry, order) => order === 7
    ? { ...entry, representativeRuntimePermitted: true }
    : entry),
})
assert.equal(adversarialChecks, 10)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_visual_fixture_v2',
  status: 'passed_source_only_topic_matched_broll_direct_role_candidate',
  contractVersion: fixture.contractVersion,
  activeCaseCount: fixture.activeCaseCount,
  directTopicMatchedBrollCaseCount: fixture.directTopicMatchedBrollCaseCount,
  hybridRequiresNonCharacterBrollSegment: true,
  attentionRequiresTopicMatchedBrollSegment: true,
  automaticDerivedStillSubstitutionPermitted: false,
  optionalFreezeFrameRequiresSeparateAdmission: true,
  v1FixtureRuntimeBlocked: true,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)
