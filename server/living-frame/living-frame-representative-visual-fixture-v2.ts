import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import type {
  LivingFrameRepresentativeSemanticSourceRouting,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeVisualFixtureManifest,
} from '../../src/types/living-frame-representative-visual-fixture'
import {
  LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_V2_VERSION,
  type LivingFrameRepresentativeAssetRoleV2,
  type LivingFrameRepresentativeBrollRequirementV2,
  type LivingFrameRepresentativeVisualFixtureCaseV2,
  type LivingFrameRepresentativeVisualFixtureManifestV2,
  type LivingFrameRepresentativeVisualFixtureManifestV2Draft,
} from '../../src/types/living-frame-representative-visual-fixture-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'
import {
  verifyLivingFrameRepresentativeSemanticSourceRouting,
} from './living-frame-representative-semantic-source-routing'
import {
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from './living-frame-representative-source-provenance-audit'
import {
  verifyLivingFrameRepresentativeVisualFixtureManifest,
} from './living-frame-representative-visual-fixture'

const BROLL_SOURCE_ID =
  'nasa_earth_day_cut_broll_public_domain_candidate' as const
const V2_BROLL_ROLE = 'approved_topic_matched_source_broll_video' as const
const BROLL_CASE_ORDERS = [5, 7] as const

export interface CompileLivingFrameRepresentativeVisualFixtureManifestV2Input {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly v1VisualFixture: LivingFrameRepresentativeVisualFixtureManifest
  readonly sourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit
  readonly semanticRouting: LivingFrameRepresentativeSemanticSourceRouting
}

export function compileLivingFrameRepresentativeVisualFixtureManifestV2(
  input: CompileLivingFrameRepresentativeVisualFixtureManifestV2Input,
): LivingFrameRepresentativeVisualFixtureManifestV2 {
  assertInput(input)
  const cases = input.v1VisualFixture.cases.map(
    (v1Case, order): LivingFrameRepresentativeVisualFixtureCaseV2 => {
      const route = input.semanticRouting.routes[order]!
      const isHybrid = order === 5
      const usesDirectBroll = BROLL_CASE_ORDERS.includes(
        order as typeof BROLL_CASE_ORDERS[number],
      )
      const requiredAssetRoles: LivingFrameRepresentativeAssetRoleV2[] =
        usesDirectBroll
          ? v1Case.requiredAssetRoles.map((role) =>
            role === 'approved_non_character_still' ? V2_BROLL_ROLE : role)
          : [...v1Case.requiredAssetRoles]
      const brollRequirement = usesDirectBroll
        ? requiredBroll(isHybrid)
        : noBroll()
      const base = {
        caseId: v1Case.caseId,
        order,
        activeScope: v1Case.activeScope,
        contentKind: v1Case.contentKind,
        semanticTopic: route.semanticTopic,
        effectiveSourceCandidateIds: [
          ...route.effectiveSourceCandidateIds,
        ],
        v1RequiredAssetRoles: [...v1Case.requiredAssetRoles],
        requiredAssetRoles,
        removedV1AssetRoles: usesDirectBroll
          ? ['approved_non_character_still' as const]
          : [],
        addedV2AssetRoles: usesDirectBroll ? [V2_BROLL_ROLE] : [],
        brollRequirement,
        motionPolicy: v1Case.motionPolicy,
        sourceRequirements: structuredClone(v1Case.sourceRequirements),
        reviewRequirements: structuredClone(v1Case.reviewRequirements),
        ownerScopeAmendmentDigestSha256:
          v1Case.ownerScopeAmendmentDigestSha256,
        semanticSourceRouteDigestSha256: route.sourceRouteDigestSha256,
        v1VisualCaseDigestSha256: v1Case.caseDigestSha256,
        caseSourceAdmissionV2Required: true as const,
        caseSourceAdmissionV2DigestPending: true as const,
        representativeRuntimePermitted: false as const,
      }
      return deepFreeze({
        ...base,
        caseDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const draft: LivingFrameRepresentativeVisualFixtureManifestV2Draft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_V2_VERSION,
    fixtureClass:
      'source_only_semantic_route_aligned_representative_media_acceptance_candidate',
    state:
      'v2_fixture_contract_complete_canonical_owner_reconciliation_pending',
    supersedesRuntimeUseOfContractVersion:
      'living-frame-representative-visual-fixture-v1',
    ownerScopeAmendmentVersion: input.ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      input.ownerScopeAmendment.amendmentDigestSha256,
    semanticRoutingVersion: input.semanticRouting.contractVersion,
    semanticRoutingDigestSha256:
      input.semanticRouting.routingDigestSha256,
    v1VisualFixtureDigestSha256:
      input.v1VisualFixture.manifestDigestSha256,
    cases,
    activeCaseCount: 12,
    directTopicMatchedBrollCaseCount: 2,
    hybridAndAttentionV1StillRoleRemoved: true,
    automaticDerivedStillSubstitutionPermitted: false,
    v1FixtureMayDriveRepresentativeRuntime: false,
    sharedCanonicalFixtureMutated: false,
    pausedScopesRejected: [...input.ownerScopeAmendment.pausedScope],
    pausedScopeCount: 7,
    representativeMediaRuntimeExecuted: false,
    qwenProviderCallMade: false,
    headQaRecommendationMade: false,
    canonicalPrivateReviewApproved: false,
    canonicalConsumptionPending: true,
    createsPlannerSnapshotTimingWorkAssetRendererQaOrReviewOwner: false,
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
      cases.map((entry) => entry.caseDigestSha256),
    ),
    manifestDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeVisualFixtureManifestV2(
  value: unknown,
  input: CompileLivingFrameRepresentativeVisualFixtureManifestV2Input,
): value is LivingFrameRepresentativeVisualFixtureManifestV2 {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeVisualFixtureManifestV2(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeVisualFixtureManifestV2Input,
): void {
  if (
    !exactKeys(input, [
      'ownerScopeAmendment', 'v1VisualFixture', 'sourceCandidateSet',
      'provenanceAudit', 'semanticRouting',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)
    || !verifyLivingFrameRepresentativeVisualFixtureManifest(
      input.v1VisualFixture,
      input.ownerScopeAmendment,
    )
    || !verifyLivingFrameRepresentativeMediaSourceCandidateSet(
      input.sourceCandidateSet,
    )
    || !verifyLivingFrameRepresentativeSourceProvenanceAudit(
      input.provenanceAudit,
    )
    || !verifyLivingFrameRepresentativeSemanticSourceRouting(
      input.semanticRouting,
      input.sourceCandidateSet,
      input.provenanceAudit,
    )
    || input.v1VisualFixture.cases.length
      !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.length
    || BROLL_CASE_ORDERS.some((order) =>
      !input.v1VisualFixture.cases[order]!.requiredAssetRoles.includes(
        'approved_non_character_still',
      )
      || !input.semanticRouting.routes[order]!
        .effectiveSourceCandidateIds.includes(BROLL_SOURCE_ID))
  ) throw new Error('Invalid Living Frame v2 visual fixture input.')
}

function requiredBroll(
  exactNonCharacterRequired: boolean,
): LivingFrameRepresentativeBrollRequirementV2 {
  return {
    selectionPolicy: exactNonCharacterRequired
      ? 'exact_non_character_source_segment_required'
      : 'exact_topic_matched_source_segment_required',
    sourceCandidateId: BROLL_SOURCE_ID,
    exactPrivateSourceBindingV2Required: true,
    canonicalContentAnalysisRereadRequired: true,
    generatedLivingOrOrganicSubjectAnimationPermitted: false,
    livingOrOrganicSubjectRiggingPermitted: false,
    mechanicalRiggingPermitted: false,
    originalApprovedSourceMotionPermitted: true,
    derivedStillMaySubstituteAutomatically: false,
    optionalFreezeFrameRequiresSeparateHeadDecisionWorkAssetQaAndManifest:
      true,
  }
}

function noBroll(): LivingFrameRepresentativeBrollRequirementV2 {
  return {
    selectionPolicy: 'not_required',
    sourceCandidateId: null,
    exactPrivateSourceBindingV2Required: false,
    canonicalContentAnalysisRereadRequired: false,
    generatedLivingOrOrganicSubjectAnimationPermitted: false,
    livingOrOrganicSubjectRiggingPermitted: false,
    mechanicalRiggingPermitted: false,
    originalApprovedSourceMotionPermitted: false,
    derivedStillMaySubstituteAutomatically: false,
    optionalFreezeFrameRequiresSeparateHeadDecisionWorkAssetQaAndManifest:
      true,
  }
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
