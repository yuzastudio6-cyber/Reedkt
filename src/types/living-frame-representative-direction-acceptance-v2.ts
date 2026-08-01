import type {
  LivingFramePausedOwnerSpecificationScope,
} from './living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeCaseDirectionAcceptance,
} from './living-frame-representative-direction-acceptance'
import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
} from './living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeCaseSourceAdmissionV2Ref,
} from './living-frame-representative-source-role-reconciliation'

export const LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_V2_VERSION =
  'living-frame-representative-direction-acceptance-v2' as const

export interface LivingFrameRepresentativeCaseDirectionAcceptanceV2
  extends Omit<
    LivingFrameRepresentativeCaseDirectionAcceptance,
    'sourceCandidateIds' | 'caseSourceAdmissionRef' | 'directionDigestSha256'
  > {
  readonly directionProfileClass:
    'v1_professional_direction_profile_with_v2_semantic_source_lineage'
  readonly sourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly caseSourceAdmissionRef:
    LivingFrameRepresentativeCaseSourceAdmissionV2Ref
  readonly semanticSourceRouteDigestSha256: string
  readonly visualFixtureV2CaseDigestSha256: string
  readonly sourceRoleReconciliationCaseDigestSha256: string
  readonly v1DirectionDigestSha256: string
  readonly supersededV1SourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly supersededV1CaseSourceAdmissionDigestSha256: string
  readonly v1DirectionProfileReusedWithoutRuntimeAuthority: true
  readonly v1DirectionMayDriveRepresentativeRuntime: false
  readonly exactV2SourceRoleCoverageRequired: true
  readonly caseSourceAdmissionCanonicalRereadPending: true
  readonly headRefineSimplifyOrRefuseDecisionPending: true
  readonly exactStoryTimingPhaseFramesPending: true
  readonly runtimeAdmissionPermitted: false
  readonly directionDigestSha256: string
}

export interface LivingFrameRepresentativeDirectionAcceptanceManifestV2Draft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_V2_VERSION
  readonly manifestClass:
    'source_only_v2_semantic_source_bound_professional_direction_profile'
  readonly state:
    'v2_direction_source_lineage_complete_canonical_head_and_timing_decisions_pending'
  readonly supersedesRuntimeUseOfContractVersion:
    'living-frame-representative-direction-acceptance-v1'
  readonly v1DirectionAcceptanceDigestSha256: string
  readonly visualFixtureVersion:
    'living-frame-representative-visual-fixture-v2'
  readonly visualFixtureDigestSha256: string
  readonly sourceRoleReconciliationVersion:
    'living-frame-representative-source-role-reconciliation-v1'
  readonly sourceRoleReconciliationDigestSha256: string
  readonly semanticRoutingVersion:
    'living-frame-representative-semantic-source-routing-v1'
  readonly semanticRoutingDigestSha256: string
  readonly cases:
    readonly LivingFrameRepresentativeCaseDirectionAcceptanceV2[]
  readonly activeCaseCount: 12
  readonly everyCaseUsesV2EffectiveSources: true
  readonly everyCaseUsesV2SourceRoleCoverage: true
  readonly directTopicMatchedBrollDirectionCaseCount: 2
  readonly automaticDerivedStillDirectionCount: 0
  readonly exactFivePhaseActionSpecificProfilesPreserved: true
  readonly exactFramesStillOwnedByStoryTiming: true
  readonly headDecisionPendingForEveryCase: true
  readonly v1DirectionMayDriveRepresentativeRuntime: false
  readonly noUniversalAnimationTimingPreset: true
  readonly noUniversalStyleOrDepthTreatment: true
  readonly canonicalSemanticPlannerMustRemainOwner: true
  readonly masterTimingStoryTimingAndSoundSyncRemainCanonicalOwners: true
  readonly pausedScopesRejected:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly pausedScopeCount: 7
  readonly allCaseSourceAdmissionRereadsPending: true
  readonly canonicalConsumptionPending: true
  readonly createsPlannerTimingSoundWorkAssetRendererQaOrReviewOwner: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeDirectionAcceptanceManifestV2
  extends LivingFrameRepresentativeDirectionAcceptanceManifestV2Draft {
  readonly caseSetDigestSha256: string
  readonly manifestDigestSha256: string
}
