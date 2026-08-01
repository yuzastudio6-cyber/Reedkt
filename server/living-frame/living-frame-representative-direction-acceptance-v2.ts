import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativeDirectionAcceptanceManifest,
} from '../../src/types/living-frame-representative-direction-acceptance'
import {
  LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_V2_VERSION,
  type LivingFrameRepresentativeCaseDirectionAcceptanceV2,
  type LivingFrameRepresentativeDirectionAcceptanceManifestV2,
  type LivingFrameRepresentativeDirectionAcceptanceManifestV2Draft,
} from '../../src/types/living-frame-representative-direction-acceptance-v2'
import type {
  LivingFrameRepresentativeSourceRoleReconciliation,
} from '../../src/types/living-frame-representative-source-role-reconciliation'
import type {
  LivingFrameRepresentativeVisualFixtureManifestV2,
} from '../../src/types/living-frame-representative-visual-fixture-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CompileLivingFrameRepresentativeDirectionAcceptanceInput,
  verifyLivingFrameRepresentativeDirectionAcceptance,
} from './living-frame-representative-direction-acceptance'
import {
  type CompileLivingFrameRepresentativeSourceRoleReconciliationInput,
  verifyLivingFrameRepresentativeSourceRoleReconciliation,
} from './living-frame-representative-source-role-reconciliation'
import {
  type CompileLivingFrameRepresentativeVisualFixtureManifestV2Input,
  verifyLivingFrameRepresentativeVisualFixtureManifestV2,
} from './living-frame-representative-visual-fixture-v2'

export interface CompileLivingFrameRepresentativeDirectionAcceptanceV2Input {
  readonly v1DirectionAcceptance:
    LivingFrameRepresentativeDirectionAcceptanceManifest
  readonly v1DirectionAcceptanceCompileInput:
    CompileLivingFrameRepresentativeDirectionAcceptanceInput
  readonly visualFixture: LivingFrameRepresentativeVisualFixtureManifestV2
  readonly visualFixtureCompileInput:
    CompileLivingFrameRepresentativeVisualFixtureManifestV2Input
  readonly sourceRoleReconciliation:
    LivingFrameRepresentativeSourceRoleReconciliation
  readonly sourceRoleReconciliationCompileInput:
    CompileLivingFrameRepresentativeSourceRoleReconciliationInput
}

export function compileLivingFrameRepresentativeDirectionAcceptanceV2(
  input: CompileLivingFrameRepresentativeDirectionAcceptanceV2Input,
): LivingFrameRepresentativeDirectionAcceptanceManifestV2 {
  assertInput(input)
  const cases = input.v1DirectionAcceptance.cases.map(
    (v1Case, order): LivingFrameRepresentativeCaseDirectionAcceptanceV2 => {
      const fixtureCase = input.visualFixture.cases[order]!
      const sourceRoleCase = input.sourceRoleReconciliation.cases[order]!
      const {
        sourceCandidateIds: supersededV1SourceCandidateIds,
        caseSourceAdmissionRef: supersededV1AdmissionRef,
        directionDigestSha256: v1DirectionDigestSha256,
        ...v1Profile
      } = structuredClone(v1Case)
      const base = {
        ...v1Profile,
        directionProfileClass:
          'v1_professional_direction_profile_with_v2_semantic_source_lineage' as const,
        sourceCandidateIds: [...fixtureCase.effectiveSourceCandidateIds],
        caseSourceAdmissionRef:
          structuredClone(sourceRoleCase.caseSourceAdmissionRef),
        semanticSourceRouteDigestSha256:
          fixtureCase.semanticSourceRouteDigestSha256,
        visualFixtureV2CaseDigestSha256: fixtureCase.caseDigestSha256,
        sourceRoleReconciliationCaseDigestSha256:
          sourceRoleCase.caseDigestSha256,
        v1DirectionDigestSha256,
        supersededV1SourceCandidateIds,
        supersededV1CaseSourceAdmissionDigestSha256:
          supersededV1AdmissionRef.digestSha256,
        v1DirectionProfileReusedWithoutRuntimeAuthority: true as const,
        v1DirectionMayDriveRepresentativeRuntime: false as const,
        exactV2SourceRoleCoverageRequired: true as const,
        caseSourceAdmissionCanonicalRereadPending: true as const,
        headRefineSimplifyOrRefuseDecisionPending: true as const,
        exactStoryTimingPhaseFramesPending: true as const,
        runtimeAdmissionPermitted: false as const,
      }
      return deepFreeze({
        ...base,
        directionDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const directTopicMatchedBrollDirectionCaseCount =
    input.sourceRoleReconciliation.cases.filter((entry) =>
      entry.sourceDerivedAssetRolesCovered.includes(
        'approved_topic_matched_source_broll_video',
      )).length
  if (
    cases.length !== 12
    || directTopicMatchedBrollDirectionCaseCount !== 2
    || cases.some((entry) =>
      entry.phasePlan.length !== 5
      || entry.phasePlan.reduce(
        (sum, phase) => sum + phase.relativeWeightBasisPoints,
        0,
      ) !== 10_000)
  ) throw new Error('Invalid Living Frame v2 direction case set.')

  const draft: LivingFrameRepresentativeDirectionAcceptanceManifestV2Draft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_V2_VERSION,
    manifestClass:
      'source_only_v2_semantic_source_bound_professional_direction_profile',
    state:
      'v2_direction_source_lineage_complete_canonical_head_and_timing_decisions_pending',
    supersedesRuntimeUseOfContractVersion:
      'living-frame-representative-direction-acceptance-v1',
    v1DirectionAcceptanceDigestSha256:
      input.v1DirectionAcceptance.manifestDigestSha256,
    visualFixtureVersion: input.visualFixture.contractVersion,
    visualFixtureDigestSha256: input.visualFixture.manifestDigestSha256,
    sourceRoleReconciliationVersion:
      input.sourceRoleReconciliation.contractVersion,
    sourceRoleReconciliationDigestSha256:
      input.sourceRoleReconciliation.reconciliationDigestSha256,
    semanticRoutingVersion:
      input.visualFixtureCompileInput.semanticRouting.contractVersion,
    semanticRoutingDigestSha256:
      input.visualFixtureCompileInput.semanticRouting.routingDigestSha256,
    cases,
    activeCaseCount: 12,
    everyCaseUsesV2EffectiveSources: true,
    everyCaseUsesV2SourceRoleCoverage: true,
    directTopicMatchedBrollDirectionCaseCount,
    automaticDerivedStillDirectionCount: 0,
    exactFivePhaseActionSpecificProfilesPreserved: true,
    exactFramesStillOwnedByStoryTiming: true,
    headDecisionPendingForEveryCase: true,
    v1DirectionMayDriveRepresentativeRuntime: false,
    noUniversalAnimationTimingPreset: true,
    noUniversalStyleOrDepthTreatment: true,
    canonicalSemanticPlannerMustRemainOwner: true,
    masterTimingStoryTimingAndSoundSyncRemainCanonicalOwners: true,
    pausedScopesRejected: [
      ...input.visualFixtureCompileInput.ownerScopeAmendment.pausedScope,
    ],
    pausedScopeCount: 7,
    allCaseSourceAdmissionRereadsPending: true,
    canonicalConsumptionPending: true,
    createsPlannerTimingSoundWorkAssetRendererQaOrReviewOwner: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    caseSetDigestSha256: sha256AuthorityValue(
      cases.map((entry) => entry.directionDigestSha256),
    ),
    manifestDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeDirectionAcceptanceV2(
  value: unknown,
  input: CompileLivingFrameRepresentativeDirectionAcceptanceV2Input,
): value is LivingFrameRepresentativeDirectionAcceptanceManifestV2 {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeDirectionAcceptanceV2(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeDirectionAcceptanceV2Input,
): void {
  if (
    !exactKeys(input, [
      'v1DirectionAcceptance', 'v1DirectionAcceptanceCompileInput',
      'visualFixture', 'visualFixtureCompileInput',
      'sourceRoleReconciliation', 'sourceRoleReconciliationCompileInput',
    ])
    || !verifyLivingFrameRepresentativeDirectionAcceptance(
      input.v1DirectionAcceptance,
      input.v1DirectionAcceptanceCompileInput,
    )
    || !verifyLivingFrameRepresentativeVisualFixtureManifestV2(
      input.visualFixture,
      input.visualFixtureCompileInput,
    )
    || !verifyLivingFrameRepresentativeSourceRoleReconciliation(
      input.sourceRoleReconciliation,
      input.sourceRoleReconciliationCompileInput,
    )
    || input.v1DirectionAcceptance.ownerScopeAmendmentDigestSha256
      !== input.visualFixture.ownerScopeAmendmentDigestSha256
    || input.v1DirectionAcceptance.representativeVisualFixtureDigestSha256
      !== input.visualFixture.v1VisualFixtureDigestSha256
    || input.sourceRoleReconciliation.visualFixtureDigestSha256
      !== input.visualFixture.manifestDigestSha256
    || input.sourceRoleReconciliation.semanticRoutingDigestSha256
      !== input.visualFixture.semanticRoutingDigestSha256
    || input.sourceRoleReconciliation.cases.some((entry, order) =>
      entry.caseId !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]
      || entry.caseId !== input.visualFixture.cases[order]!.caseId
      || entry.caseId !== input.v1DirectionAcceptance.cases[order]!.caseId
      || entry.fixtureCaseDigestSha256
        !== input.visualFixture.cases[order]!.caseDigestSha256
      || entry.sourceRouteDigestSha256
        !== input.visualFixture.cases[order]!
          .semanticSourceRouteDigestSha256
      || stableAuthorityStringify(entry.effectiveSourceCandidateIds)
        !== stableAuthorityStringify(
          input.visualFixture.cases[order]!.effectiveSourceCandidateIds,
        )
      || !entry.everyRequiredSourceDerivedRoleCovered
      || !entry.caseSourceAdmissionCanonicalRereadPending
      || entry.runtimeAdmissionPermitted)
  ) throw new Error('Invalid Living Frame v2 direction acceptance input.')
}

function exactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
