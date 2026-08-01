import assert from 'node:assert/strict'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import {
  LIVING_FRAME_REPRESENTATIVE_CONTENT_KINDS,
} from '../../src/types/living-frame-representative-visual-fixture'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
  verifyLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const manifest =
  compileLivingFrameRepresentativeVisualFixtureManifest(
    ownerScopeAmendment,
  )

assert.equal(
  verifyLivingFrameRepresentativeVisualFixtureManifest(
    manifest,
    ownerScopeAmendment,
  ),
  true,
)
assert.equal(manifest.activeCaseCount, 12)
assert.equal(manifest.cases.length, 12)
assert.equal(manifest.pausedScopeCount, 7)
assert.deepEqual(
  manifest.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.deepEqual(
  manifest.cases.map((entry) => entry.activeScope),
  ownerScopeAmendment.activeScope,
)
assert.deepEqual(
  manifest.cases.map((entry) => entry.contentKind),
  LIVING_FRAME_REPRESENTATIVE_CONTENT_KINDS,
)
assert.equal(
  manifest.cases.every((entry) =>
    entry.requiredAssetRoles.length >= 2
    && entry.sourceRequirements.realOrSourceVerifiedRepresentativeMediaRequired
    && !entry.sourceRequirements.geometryOnlyProbeMayCountAsProfessionalEvidence
    && !entry.sourceRequirements.syntheticRectanglesMayCountAsProfessionalEvidence
    && !entry.sourceRequirements.placeholderMayReachFinalReview
    && entry.sourceRequirements.exactSourceProvenanceRequired
    && entry.sourceRequirements.immutableSourceRereadRequired
    && !entry.sourceRequirements.generatedVideoFallbackPermitted
    && entry.reviewRequirements.exactProfessionalCheckIds.length
      === LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.length
    && entry.reviewRequirements.completePlaybackInspectionRequired
    && entry.reviewRequirements.completeTimeQwenVisualEvidenceRequired
    && entry.reviewRequirements.separateVerifiedAudioEvidenceRequired
    && entry.reviewRequirements.kimiPrimaryTerraFallbackRecommendationRequired
    && !entry.reviewRequirements.metricsOnlyAcceptancePermitted
    && !entry.reviewRequirements.callerAssertionAcceptancePermitted
    && !entry.reviewRequirements.failedArtifactMayBeReusedAfterRepair
    && entry.reviewRequirements.nPlusOneRepairAndCompleteReinspectionRequired),
  true,
)
assert.equal(
  manifest.cases[1]!.motionPolicy,
  'no_illustrated_subject_animation',
)
assert.equal(
  manifest.cases[6]!.motionPolicy,
  'literal_map_route_or_data_reveal_only',
)
assert.equal(
  manifest.cases[9]!.motionPolicy,
  'preapproved_rigid_transform_without_rig_inference',
)
assert.equal(
  manifest.engineeringGeometryProbeMayApproveProfessionalQuality,
  false,
)
assert.equal(
  manifest.currentEngineeringAggregateMayApproveProfessionalQuality,
  false,
)
assert.equal(manifest.representativeMediaRuntimeExecuted, false)
assert.equal(manifest.canonicalConsumptionPending, true)
assert.equal(manifest.runtimeExecuted, false)
assert.equal(manifest.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeVisualFixtureManifest(
      candidate,
      ownerScopeAmendment,
    ),
    false,
  )
  adversarialChecks += 1
}

reject({
  ...manifest,
  engineeringGeometryProbeMayApproveProfessionalQuality: true,
})
reject({
  ...manifest,
  currentEngineeringAggregateMayApproveProfessionalQuality: true,
})
reject({ ...manifest, representativeMediaRuntimeExecuted: true })
reject({ ...manifest, canonicalConsumptionPending: false })
reject({
  ...manifest,
  cases: manifest.cases.slice(1),
})
reject({
  ...manifest,
  cases: manifest.cases.map((entry, index) => index === 0
    ? {
        ...entry,
        sourceRequirements: {
          ...entry.sourceRequirements,
          geometryOnlyProbeMayCountAsProfessionalEvidence: true,
        },
      }
    : entry),
})
reject({
  ...manifest,
  cases: manifest.cases.map((entry, index) => index === 1
    ? { ...entry, motionPolicy: 'character_rigging' }
    : entry),
})
reject({
  ...manifest,
  cases: manifest.cases.map((entry, index) => index === 6
    ? {
        ...entry,
        sourceRequirements: {
          ...entry.sourceRequirements,
          exactSourceProvenanceRequired: false,
        },
      }
    : entry),
})
reject({
  ...manifest,
  cases: manifest.cases.map((entry, index) => index === 11
    ? {
        ...entry,
        reviewRequirements: {
          ...entry.reviewRequirements,
          metricsOnlyAcceptancePermitted: true,
        },
      }
    : entry),
})

assert.equal(adversarialChecks, 9)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_visual_fixture',
  status: 'passed_source_only',
  contractVersion: manifest.contractVersion,
  manifestDigestSha256: manifest.manifestDigestSha256,
  activeCaseCount: manifest.activeCaseCount,
  pausedScopeCount: manifest.pausedScopeCount,
  professionalCheckCount:
    LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.length,
  adversarialChecks,
  representativeMediaRequiredForEveryCase: true,
  geometryOnlyProbeMayApproveProfessionalQuality: false,
  syntheticRectanglesMayApproveProfessionalQuality: false,
  metricsOnlyAcceptancePermitted: false,
  callerAssertionAcceptancePermitted: false,
  representativeMediaRuntimeExecuted: false,
  canonicalConsumptionPending: true,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)
