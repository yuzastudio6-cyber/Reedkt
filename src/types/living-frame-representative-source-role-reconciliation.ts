import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION,
} from './living-frame-representative-case-source-admission-v2'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
} from './living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeAssetRoleV2,
} from './living-frame-representative-visual-fixture-v2'

export const LIVING_FRAME_REPRESENTATIVE_SOURCE_ROLE_RECONCILIATION_VERSION =
  'living-frame-representative-source-role-reconciliation-v1' as const

export interface LivingFrameRepresentativeCaseSourceAdmissionV2Ref {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly refVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION
  readonly digestSha256: string
  readonly canonicalRereadRequired: true
}

export interface LivingFrameRepresentativeCaseSourceRoleReconciliation {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly fixtureCaseDigestSha256: string
  readonly sourceRouteDigestSha256: string
  readonly caseSourceAdmissionRef:
    LivingFrameRepresentativeCaseSourceAdmissionV2Ref
  readonly effectiveSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly requiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly sourceDerivedAssetRolesCovered:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly nonSourceDependencyRoles:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly missingSourceDerivedAssetRoles:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly everyRequiredSourceDerivedRoleCovered: true
  readonly caseSourceAdmissionCanonicalRereadPending: true
  readonly runtimeAdmissionPermitted: false
  readonly caseDigestSha256: string
}

export interface LivingFrameRepresentativeSourceRoleReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_SOURCE_ROLE_RECONCILIATION_VERSION
  readonly reconciliationClass:
    'byte_free_source_only_visual_fixture_v2_role_coverage_projection'
  readonly visualFixtureVersion:
    'living-frame-representative-visual-fixture-v2'
  readonly visualFixtureDigestSha256: string
  readonly semanticRoutingVersion:
    'living-frame-representative-semantic-source-routing-v1'
  readonly semanticRoutingDigestSha256: string
  readonly cases:
    readonly LivingFrameRepresentativeCaseSourceRoleReconciliation[]
  readonly activeCaseCount: 12
  readonly sourceDerivedRolesCompleteCaseCount: 12
  readonly topicMatchedBrollRoleCoverageCount: 2
  readonly automaticDerivedStillCount: 0
  readonly allCaseSourceAdmissionRereadsPending: true
  readonly canonicalConsumptionPending: true
  readonly createsSourceFixtureAdmissionWorkAssetTimingRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeSourceRoleReconciliation
  extends LivingFrameRepresentativeSourceRoleReconciliationDraft {
  readonly caseSetDigestSha256: string
  readonly reconciliationDigestSha256: string
}
