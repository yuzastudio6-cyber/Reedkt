import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

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
  compileLivingFrameRepresentativeSourceRoleReconciliation,
  verifyLivingFrameRepresentativeSourceRoleReconciliation,
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
const caseSourceAdmissionRefs =
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map((caseId) => ({
    caseId,
    refVersion:
      'living-frame-representative-case-source-admission-v2' as const,
    digestSha256: sha(`case-source-admission-v2:${caseId}`),
    canonicalRereadRequired: true as const,
  }))
const input = {
  visualFixture,
  visualFixtureCompileInput,
  caseSourceAdmissionRefs,
}
const reconciliation =
  compileLivingFrameRepresentativeSourceRoleReconciliation(input)

assert.equal(
  verifyLivingFrameRepresentativeSourceRoleReconciliation(
    reconciliation,
    input,
  ),
  true,
)
assert.equal(Object.isFrozen(reconciliation), true)
assert.deepEqual(
  reconciliation.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(reconciliation.activeCaseCount, 12)
assert.equal(reconciliation.sourceDerivedRolesCompleteCaseCount, 12)
assert.equal(reconciliation.topicMatchedBrollRoleCoverageCount, 2)
assert.equal(reconciliation.automaticDerivedStillCount, 0)
assert.equal(reconciliation.allCaseSourceAdmissionRereadsPending, true)
assert.equal(
  reconciliation.cases.every((entry) =>
    entry.missingSourceDerivedAssetRoles.length === 0
    && entry.everyRequiredSourceDerivedRoleCovered
    && entry.caseSourceAdmissionCanonicalRereadPending
    && !entry.runtimeAdmissionPermitted),
  true,
)
for (const order of [5, 7] as const) {
  assert.equal(
    reconciliation.cases[order]!.sourceDerivedAssetRolesCovered.includes(
      'approved_topic_matched_source_broll_video',
    ),
    true,
  )
  assert.equal(
    reconciliation.cases[order]!.nonSourceDependencyRoles.includes(
      'approved_topic_matched_source_broll_video',
    ),
    false,
  )
}
assert.deepEqual(
  reconciliation.cases[0]!.nonSourceDependencyRoles,
  [
    'approved_temporal_mask_or_safe_space_fallback',
    'approved_caption_projection',
  ],
)
assert.deepEqual(
  reconciliation.cases[11]!.nonSourceDependencyRoles,
  [
    'approved_remotion_final_artifact',
    'approved_caption_projection',
    'approved_soundsync_mix',
  ],
)
assert.equal(reconciliation.canonicalConsumptionPending, true)
assert.equal(reconciliation.runtimeExecuted, false)
assert.equal(reconciliation.productionReady, false)

let adversarialChecks = 0
const rejectInput = (candidate: typeof input) => {
  assert.throws(() =>
    compileLivingFrameRepresentativeSourceRoleReconciliation(candidate))
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
    order === 0 ? { ...entry, digestSha256: 'invalid' } : entry),
})
rejectInput({
  ...input,
  caseSourceAdmissionRefs: caseSourceAdmissionRefs.map((entry, order) =>
    order === 0
      ? {
          ...entry,
          refVersion: 'living-frame-representative-case-source-admission-v1' as
            'living-frame-representative-case-source-admission-v2',
        }
      : entry),
})
assert.equal(
  verifyLivingFrameRepresentativeSourceRoleReconciliation(
    { ...reconciliation, automaticDerivedStillCount: 1 },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(
  verifyLivingFrameRepresentativeSourceRoleReconciliation(
    {
      ...reconciliation,
      cases: reconciliation.cases.map((entry, order) => order === 5
        ? { ...entry, runtimeAdmissionPermitted: true }
        : entry),
    },
    input,
  ),
  false,
)
adversarialChecks += 1
assert.equal(adversarialChecks, 6)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_source_role_reconciliation',
  status: 'passed_source_only_all_v2_source_roles_covered',
  contractVersion: reconciliation.contractVersion,
  activeCaseCount: reconciliation.activeCaseCount,
  sourceDerivedRolesCompleteCaseCount:
    reconciliation.sourceDerivedRolesCompleteCaseCount,
  topicMatchedBrollRoleCoverageCount:
    reconciliation.topicMatchedBrollRoleCoverageCount,
  automaticDerivedStillCount: reconciliation.automaticDerivedStillCount,
  canonicalCaseSourceAdmissionRereadPending: true,
  nonSourceOwnersPreserved: true,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
