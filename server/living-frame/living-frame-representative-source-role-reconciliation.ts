import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_SOURCE_ROLE_RECONCILIATION_VERSION,
  type LivingFrameRepresentativeCaseSourceAdmissionV2Ref,
  type LivingFrameRepresentativeCaseSourceRoleReconciliation,
  type LivingFrameRepresentativeSourceRoleReconciliation,
  type LivingFrameRepresentativeSourceRoleReconciliationDraft,
} from '../../src/types/living-frame-representative-source-role-reconciliation'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeAssetRoleV2,
  LivingFrameRepresentativeVisualFixtureManifestV2,
} from '../../src/types/living-frame-representative-visual-fixture-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CompileLivingFrameRepresentativeVisualFixtureManifestV2Input,
  verifyLivingFrameRepresentativeVisualFixtureManifestV2,
} from './living-frame-representative-visual-fixture-v2'

const SHA256 = /^[a-f0-9]{64}$/u
const SOURCE_DERIVED_ROLES = new Set<LivingFrameRepresentativeAssetRoleV2>([
  'approved_source_video',
  'approved_topic_matched_source_broll_video',
  'approved_static_illustration',
  'approved_non_character_still',
  'approved_archive_source',
  'approved_document_source',
  'approved_map_source',
  'approved_data_source',
  'approved_diagram_source',
])

export interface CompileLivingFrameRepresentativeSourceRoleReconciliationInput {
  readonly visualFixture:
    LivingFrameRepresentativeVisualFixtureManifestV2
  readonly visualFixtureCompileInput:
    CompileLivingFrameRepresentativeVisualFixtureManifestV2Input
  readonly caseSourceAdmissionRefs:
    readonly LivingFrameRepresentativeCaseSourceAdmissionV2Ref[]
}

export function compileLivingFrameRepresentativeSourceRoleReconciliation(
  input: CompileLivingFrameRepresentativeSourceRoleReconciliationInput,
): LivingFrameRepresentativeSourceRoleReconciliation {
  assertInput(input)
  const cases = input.visualFixture.cases.map(
    (fixtureCase, order): LivingFrameRepresentativeCaseSourceRoleReconciliation => {
      const admissionRef = input.caseSourceAdmissionRefs[order]!
      const covered = sourceDerivedRoleCoverage(
        fixtureCase.effectiveSourceCandidateIds,
        fixtureCase.requiredAssetRoles,
      )
      const requiredSourceRoles = fixtureCase.requiredAssetRoles.filter(
        (role) => SOURCE_DERIVED_ROLES.has(role),
      )
      const missingSourceDerivedAssetRoles = requiredSourceRoles.filter(
        (role) => !covered.includes(role),
      )
      if (missingSourceDerivedAssetRoles.length !== 0) {
        throw new Error('Living Frame v2 fixture has an uncovered source role.')
      }
      const base = {
        caseId: fixtureCase.caseId,
        order,
        fixtureCaseDigestSha256: fixtureCase.caseDigestSha256,
        sourceRouteDigestSha256:
          fixtureCase.semanticSourceRouteDigestSha256,
        caseSourceAdmissionRef: structuredClone(admissionRef),
        effectiveSourceCandidateIds: [
          ...fixtureCase.effectiveSourceCandidateIds,
        ],
        requiredAssetRoles: [...fixtureCase.requiredAssetRoles],
        sourceDerivedAssetRolesCovered: covered,
        nonSourceDependencyRoles: fixtureCase.requiredAssetRoles.filter(
          (role) => !SOURCE_DERIVED_ROLES.has(role),
        ),
        missingSourceDerivedAssetRoles,
        everyRequiredSourceDerivedRoleCovered: true as const,
        caseSourceAdmissionCanonicalRereadPending: true as const,
        runtimeAdmissionPermitted: false as const,
      }
      return deepFreeze({
        ...base,
        caseDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const sourceDerivedRolesCompleteCaseCount = cases.filter(
    (entry) => entry.everyRequiredSourceDerivedRoleCovered,
  ).length
  const topicMatchedBrollRoleCoverageCount = cases.filter((entry) =>
    entry.sourceDerivedAssetRolesCovered.includes(
      'approved_topic_matched_source_broll_video',
    )).length
  if (
    sourceDerivedRolesCompleteCaseCount !== 12
    || topicMatchedBrollRoleCoverageCount !== 2
  ) {
    throw new Error('Living Frame v2 source-role coverage is incomplete.')
  }
  const draft: LivingFrameRepresentativeSourceRoleReconciliationDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_SOURCE_ROLE_RECONCILIATION_VERSION,
    reconciliationClass:
      'byte_free_source_only_visual_fixture_v2_role_coverage_projection',
    visualFixtureVersion: input.visualFixture.contractVersion,
    visualFixtureDigestSha256: input.visualFixture.manifestDigestSha256,
    semanticRoutingVersion:
      input.visualFixtureCompileInput.semanticRouting.contractVersion,
    semanticRoutingDigestSha256:
      input.visualFixtureCompileInput.semanticRouting.routingDigestSha256,
    cases,
    activeCaseCount: 12,
    sourceDerivedRolesCompleteCaseCount,
    topicMatchedBrollRoleCoverageCount,
    automaticDerivedStillCount: 0,
    allCaseSourceAdmissionRereadsPending: true,
    canonicalConsumptionPending: true,
    createsSourceFixtureAdmissionWorkAssetTimingRendererQaOrReviewOwner: false,
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
    reconciliationDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeSourceRoleReconciliation(
  value: unknown,
  input: CompileLivingFrameRepresentativeSourceRoleReconciliationInput,
): value is LivingFrameRepresentativeSourceRoleReconciliation {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeSourceRoleReconciliation(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeSourceRoleReconciliationInput,
): void {
  if (
    !exactKeys(input, [
      'visualFixture', 'visualFixtureCompileInput',
      'caseSourceAdmissionRefs',
    ])
    || !verifyLivingFrameRepresentativeVisualFixtureManifestV2(
      input.visualFixture,
      input.visualFixtureCompileInput,
    )
    || input.caseSourceAdmissionRefs.length
      !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.length
    || input.caseSourceAdmissionRefs.some((entry, order) =>
      !exactKeys(entry, [
        'caseId', 'refVersion', 'digestSha256',
        'canonicalRereadRequired',
      ])
      || entry.caseId !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]
      || entry.refVersion
        !== 'living-frame-representative-case-source-admission-v2'
      || !SHA256.test(entry.digestSha256)
      || !entry.canonicalRereadRequired)
  ) throw new Error('Invalid Living Frame source-role reconciliation input.')
}

function sourceDerivedRoleCoverage(
  sourceIds: readonly LivingFrameRepresentativeEffectiveSourceCandidateId[],
  requiredRoles: readonly LivingFrameRepresentativeAssetRoleV2[],
): readonly LivingFrameRepresentativeAssetRoleV2[] {
  const covered = new Set<LivingFrameRepresentativeAssetRoleV2>()
  for (const sourceId of sourceIds) {
    for (const role of SOURCE_ASSET_ROLE_COVERAGE[sourceId]) {
      if (requiredRoles.includes(role)) covered.add(role)
    }
  }
  return requiredRoles.filter((role) => covered.has(role))
}

const SOURCE_ASSET_ROLE_COVERAGE = {
  nasa_earth_day_expert_interview_public_domain_candidate: [
    'approved_source_video',
  ],
  nasa_earth_day_cut_broll_public_domain_candidate: [
    'approved_source_video',
    'approved_topic_matched_source_broll_video',
  ],
  nasa_strait_of_hormuz_satellite_public_domain_candidate: [
    'approved_non_character_still',
    'approved_map_source',
  ],
  historical_strait_of_hormuz_map_public_domain_candidate: [
    'approved_archive_source',
    'approved_document_source',
    'approved_map_source',
  ],
  scientific_method_diagram_public_domain_candidate: [
    'approved_diagram_source',
    'approved_document_source',
  ],
  eia_world_oil_chokepoint_data_official_source_candidate: [
    'approved_data_source',
  ],
  local_astronomer_static_illustration_candidate: [
    'approved_static_illustration',
  ],
  local_locomotive_non_character_still_candidate: [
    'approved_non_character_still',
  ],
} as const satisfies Record<
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  readonly LivingFrameRepresentativeAssetRoleV2[]
>

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
