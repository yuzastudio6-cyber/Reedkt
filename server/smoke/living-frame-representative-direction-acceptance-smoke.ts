import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativeDirectionAcceptance,
  verifyLivingFrameRepresentativeDirectionAcceptance,
} from '../living-frame/living-frame-representative-direction-acceptance'

const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
const representativeVisualFixture =
  compileLivingFrameRepresentativeVisualFixtureManifest(ownerScopeAmendment)
const representativeSourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const caseSourceAdmissionRefs =
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map((caseId) => ({
    caseId,
    refVersion:
      'living-frame-representative-case-source-admission-v1' as const,
    digestSha256: sha(`case-source-admission:${caseId}`),
  }))
const input = {
  ownerScopeAmendment,
  representativeVisualFixture,
  representativeSourceCandidateSet,
  caseSourceAdmissionRefs,
}
const manifest =
  compileLivingFrameRepresentativeDirectionAcceptance(input)

assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptance(manifest, input),
  true,
)
assert.equal(manifest.activeCaseCount, 12)
assert.deepEqual(
  manifest.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(
  manifest.cases.every((entry) =>
    entry.phasePlan.length === 5
    && entry.phasePlan.reduce(
      (sum, phase) => sum + phase.relativeWeightBasisPoints,
      0,
    ) === 10_000
    && entry.phasePlan.every((phase, order) =>
      phase.order === order && !phase.exactFramesProvided)
    && entry.motionBudget.maximumConcurrentMeaningfulMotions === 2
    && entry.motionBudget.secondaryChannels.length <= 2
    && entry.motionBudget.ambientMotionMustRemainSubordinate
    && entry.motionBudget.cameraMotionMustBeNarrativelyMotivated
    && !entry.illustratedOrLivingSubjectAnimationPermitted
    && !entry.mechanicalRiggingOrPartAnimationPermitted
    && entry.captionsRemainAboveLivingFrame
    && entry.focusHandoffRequiresRestoreOrPlannedTransition
    && entry.actionSpecificTimingRequired
    && entry.storyTimingOwnsExactFrames
    && entry.soundSyncOwnsExactCueAndMix
    && entry.headIntelligenceMustChooseRefineSimplifyOrRefuse
    && !entry.geometryOrMetricsOnlyAcceptancePermitted
    && entry.completePlaybackAndCompleteTimeVisualReviewRequired
    && entry.exactProfessionalCheckIds.length
      === LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.length),
  true,
)
assert.equal(manifest.cases[1]!.staticIllustrationMustRemainStatic, true)
assert.equal(manifest.cases[1]!.styleProfile.depthStyle, 'flat')
assert.equal(manifest.cases[2]!.motionBudget.primaryChannel, 'environmental')
assert.equal(manifest.cases[2]!.motionBudget.secondaryChannels.includes('mechanical' as never), false)
assert.equal(manifest.cases[3]!.styleProfile.depthStyle, 'deep_multiplane')
assert.equal(manifest.cases[6]!.semanticScalePolicy, 'data_proportional_only')
assert.equal(manifest.cases[7]!.motionBudget.primaryChannel, 'attention')
assert.equal(manifest.cases[11]!.motionBudget.primaryChannel, 'none')
assert.equal(manifest.noUniversalAnimationTimingPreset, true)
assert.equal(manifest.noUniversalStyleOrDepthTreatment, true)
assert.equal(manifest.headIntelligenceCreativeDecisionRequired, true)
assert.equal(manifest.canonicalSemanticPlannerMustRemainOwner, true)
assert.equal(manifest.masterTimingAndStoryTimingRemainExactFrameOwners, true)
assert.equal(manifest.canonicalConsumptionPending, true)
assert.equal(manifest.runtimeExecuted, false)
assert.equal(manifest.productionReady, false)

let adversarialChecks = 0
const rejectInput = (candidate: typeof input) => {
  assert.throws(() =>
    compileLivingFrameRepresentativeDirectionAcceptance(candidate))
  adversarialChecks += 1
}
rejectInput({ ...input, caseSourceAdmissionRefs: caseSourceAdmissionRefs.slice(1) })
rejectInput({
  ...input,
  caseSourceAdmissionRefs: [...caseSourceAdmissionRefs].reverse(),
})
rejectInput({
  ...input,
  caseSourceAdmissionRefs: caseSourceAdmissionRefs.map((entry, order) =>
    order === 0
      ? { ...entry, digestSha256: 'invalid' }
      : entry),
})
rejectInput({
  ...input,
  caseSourceAdmissionRefs: caseSourceAdmissionRefs.map((entry, order) =>
    order === 0
      ? {
          ...entry,
          refVersion: 'caller-direction-v1' as typeof entry.refVersion,
        }
      : entry),
})
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptance(
    { ...manifest, noUniversalAnimationTimingPreset: false },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptance(
    {
      ...manifest,
      cases: manifest.cases.map((entry, order) => order === 1
        ? { ...entry, staticIllustrationMustRemainStatic: false }
        : entry),
    },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptance(
    {
      ...manifest,
      cases: manifest.cases.map((entry, order) => order === 6
        ? {
            ...entry,
            semanticScalePolicy: 'editorial_symbolic_with_disclosure',
          }
        : entry),
    },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(adversarialChecks, 7)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_direction_acceptance',
  status: 'passed_source_only',
  contractVersion: manifest.contractVersion,
  activeCaseCount: manifest.activeCaseCount,
  exactActionSpecificFivePhasePlanCount: manifest.cases.length,
  uniquePhaseWeightProfileCount: new Set(
    manifest.cases.map((entry) => entry.phasePlan.map((phase) =>
      phase.relativeWeightBasisPoints).join(':')),
  ).size,
  uniqueStyleDepthProfileCount: new Set(
    manifest.cases.map((entry) => [
      entry.styleProfile.assetTreatments.join('+'),
      entry.styleProfile.depthStyle,
      entry.styleProfile.compositionStrategy,
    ].join(':')),
  ).size,
  livingOrMechanicalAnimationPermitted: false,
  headIntelligenceDecisionRequired: true,
  storyTimingOwnsExactFrames: true,
  geometryOrMetricsOnlyAcceptancePermitted: false,
  adversarialChecks,
  canonicalConsumptionPending: true,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
