import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeDirectionAcceptance,
} from '../living-frame/living-frame-representative-direction-acceptance'
import {
  compileLivingFrameRepresentativeDirectionAcceptanceV2,
  verifyLivingFrameRepresentativeDirectionAcceptanceV2,
} from '../living-frame/living-frame-representative-direction-acceptance-v2'
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
  compileLivingFrameRepresentativeSourceRoleReconciliation,
} from '../living-frame/living-frame-representative-source-role-reconciliation'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'
import {
  compileLivingFrameRepresentativeVisualFixtureManifestV2,
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
const visualFixtureCompileInput = {
  ownerScopeAmendment,
  v1VisualFixture,
  sourceCandidateSet,
  provenanceAudit,
  semanticRouting,
}
const visualFixture =
  compileLivingFrameRepresentativeVisualFixtureManifestV2(
    visualFixtureCompileInput,
  )
const v1CaseSourceAdmissionRefs =
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map((caseId) => ({
    caseId,
    refVersion:
      'living-frame-representative-case-source-admission-v1' as const,
    digestSha256: sha(`v1-case-source-admission:${caseId}`),
  }))
const v1DirectionAcceptanceCompileInput = {
  ownerScopeAmendment,
  representativeVisualFixture: v1VisualFixture,
  representativeSourceCandidateSet: sourceCandidateSet,
  caseSourceAdmissionRefs: v1CaseSourceAdmissionRefs,
}
const v1DirectionAcceptance =
  compileLivingFrameRepresentativeDirectionAcceptance(
    v1DirectionAcceptanceCompileInput,
  )
const v2CaseSourceAdmissionRefs =
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map((caseId) => ({
    caseId,
    refVersion:
      'living-frame-representative-case-source-admission-v2' as const,
    digestSha256: sha(`v2-case-source-admission:${caseId}`),
    canonicalRereadRequired: true as const,
  }))
const sourceRoleReconciliationCompileInput = {
  visualFixture,
  visualFixtureCompileInput,
  caseSourceAdmissionRefs: v2CaseSourceAdmissionRefs,
}
const sourceRoleReconciliation =
  compileLivingFrameRepresentativeSourceRoleReconciliation(
    sourceRoleReconciliationCompileInput,
  )
const input = {
  v1DirectionAcceptance,
  v1DirectionAcceptanceCompileInput,
  visualFixture,
  visualFixtureCompileInput,
  sourceRoleReconciliation,
  sourceRoleReconciliationCompileInput,
}
const manifest =
  compileLivingFrameRepresentativeDirectionAcceptanceV2(input)

assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptanceV2(manifest, input),
  true,
)
assert.equal(Object.isFrozen(manifest), true)
assert.equal(manifest.activeCaseCount, 12)
assert.deepEqual(
  manifest.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(
  manifest.cases.every((entry, order) =>
    entry.v1DirectionDigestSha256
      === v1DirectionAcceptance.cases[order]!.directionDigestSha256
    && entry.phasePlan.length === 5
    && entry.phasePlan.reduce(
      (sum, phase) => sum + phase.relativeWeightBasisPoints,
      0,
    ) === 10_000
    && entry.directionMode
      === v1DirectionAcceptance.cases[order]!.directionMode
    && entry.demonstrationAction
      === v1DirectionAcceptance.cases[order]!.demonstrationAction
    && entry.caseSourceAdmissionRef.refVersion
      === 'living-frame-representative-case-source-admission-v2'
    && entry.v1DirectionProfileReusedWithoutRuntimeAuthority
    && !entry.v1DirectionMayDriveRepresentativeRuntime
    && entry.exactV2SourceRoleCoverageRequired
    && entry.caseSourceAdmissionCanonicalRereadPending
    && entry.headRefineSimplifyOrRefuseDecisionPending
    && entry.exactStoryTimingPhaseFramesPending
    && !entry.runtimeAdmissionPermitted),
  true,
)
for (const order of [5, 7] as const) {
  assert.equal(
    manifest.cases[order]!.sourceCandidateIds.includes(
      'nasa_earth_day_cut_broll_public_domain_candidate',
    ),
    true,
  )
}
assert.equal(manifest.directTopicMatchedBrollDirectionCaseCount, 2)
assert.equal(manifest.automaticDerivedStillDirectionCount, 0)
assert.equal(manifest.everyCaseUsesV2EffectiveSources, true)
assert.equal(manifest.everyCaseUsesV2SourceRoleCoverage, true)
assert.equal(manifest.exactFivePhaseActionSpecificProfilesPreserved, true)
assert.equal(manifest.exactFramesStillOwnedByStoryTiming, true)
assert.equal(manifest.headDecisionPendingForEveryCase, true)
assert.equal(manifest.canonicalConsumptionPending, true)
assert.equal(manifest.runtimeExecuted, false)
assert.equal(manifest.productionReady, false)

let adversarialChecks = 0
const rejectInput = (candidate: typeof input) => {
  assert.throws(() =>
    compileLivingFrameRepresentativeDirectionAcceptanceV2(candidate))
  adversarialChecks += 1
}
rejectInput({
  ...input,
  v1DirectionAcceptance: {
    ...v1DirectionAcceptance,
    manifestDigestSha256: 'invalid',
  },
})
rejectInput({
  ...input,
  visualFixture: {
    ...visualFixture,
    semanticRoutingDigestSha256: 'invalid',
  },
})
rejectInput({
  ...input,
  sourceRoleReconciliation: {
    ...sourceRoleReconciliation,
    visualFixtureDigestSha256: 'invalid',
  },
})
rejectInput({
  ...input,
  sourceRoleReconciliationCompileInput: {
    ...sourceRoleReconciliationCompileInput,
    caseSourceAdmissionRefs:
      [...v2CaseSourceAdmissionRefs].reverse(),
  },
})
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptanceV2(
    { ...manifest, automaticDerivedStillDirectionCount: 1 },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptanceV2(
    {
      ...manifest,
      cases: manifest.cases.map((entry, order) => order === 5
        ? { ...entry, runtimeAdmissionPermitted: true }
        : entry),
    },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptanceV2(
    {
      ...manifest,
      cases: manifest.cases.map((entry, order) => order === 7
        ? {
            ...entry,
            sourceCandidateIds: entry.sourceCandidateIds.filter((sourceId) =>
              sourceId
                !== 'nasa_earth_day_cut_broll_public_domain_candidate'),
          }
        : entry),
    },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeDirectionAcceptanceV2(
    { ...manifest, exactFramesStillOwnedByStoryTiming: false },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(adversarialChecks, 8)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_direction_acceptance_v2',
  status: 'passed_source_only_v2_source_bound_direction_profiles',
  contractVersion: manifest.contractVersion,
  activeCaseCount: manifest.activeCaseCount,
  actionSpecificFivePhaseProfileCount: manifest.cases.length,
  directTopicMatchedBrollDirectionCaseCount:
    manifest.directTopicMatchedBrollDirectionCaseCount,
  automaticDerivedStillDirectionCount:
    manifest.automaticDerivedStillDirectionCount,
  headDecisionPendingForEveryCase:
    manifest.headDecisionPendingForEveryCase,
  exactFramesStillOwnedByStoryTiming:
    manifest.exactFramesStillOwnedByStoryTiming,
  caseSourceAdmissionCanonicalRereadPending: true,
  adversarialChecks,
  canonicalConsumptionPending: true,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
