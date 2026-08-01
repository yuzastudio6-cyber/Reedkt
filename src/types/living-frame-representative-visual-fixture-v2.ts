import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
  LivingFramePausedOwnerSpecificationScope,
} from './living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  LivingFrameRepresentativeSemanticTopic,
} from './living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeAssetRole,
  LivingFrameRepresentativeContentKind,
  LivingFrameRepresentativeFixtureReviewRequirements,
  LivingFrameRepresentativeFixtureSourceRequirements,
  LivingFrameRepresentativeMotionPolicy,
} from './living-frame-representative-visual-fixture'

export const LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_V2_VERSION =
  'living-frame-representative-visual-fixture-v2' as const

export type LivingFrameRepresentativeAssetRoleV2 =
  | LivingFrameRepresentativeAssetRole
  | 'approved_topic_matched_source_broll_video'

export type LivingFrameRepresentativeBrollSelectionPolicy =
  | 'not_required'
  | 'exact_non_character_source_segment_required'
  | 'exact_topic_matched_source_segment_required'

export interface LivingFrameRepresentativeBrollRequirementV2 {
  readonly selectionPolicy: LivingFrameRepresentativeBrollSelectionPolicy
  readonly sourceCandidateId:
    | 'nasa_earth_day_cut_broll_public_domain_candidate'
    | null
  readonly exactPrivateSourceBindingV2Required: boolean
  readonly canonicalContentAnalysisRereadRequired: boolean
  readonly generatedLivingOrOrganicSubjectAnimationPermitted: false
  readonly livingOrOrganicSubjectRiggingPermitted: false
  readonly mechanicalRiggingPermitted: false
  readonly originalApprovedSourceMotionPermitted: boolean
  readonly derivedStillMaySubstituteAutomatically: false
  readonly optionalFreezeFrameRequiresSeparateHeadDecisionWorkAssetQaAndManifest:
    true
}

export interface LivingFrameRepresentativeVisualFixtureCaseV2 {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly contentKind: LivingFrameRepresentativeContentKind
  readonly semanticTopic: LivingFrameRepresentativeSemanticTopic
  readonly effectiveSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly v1RequiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly requiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly removedV1AssetRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly addedV2AssetRoles:
    readonly LivingFrameRepresentativeAssetRoleV2[]
  readonly brollRequirement: LivingFrameRepresentativeBrollRequirementV2
  readonly motionPolicy: LivingFrameRepresentativeMotionPolicy
  readonly sourceRequirements:
    LivingFrameRepresentativeFixtureSourceRequirements
  readonly reviewRequirements:
    LivingFrameRepresentativeFixtureReviewRequirements
  readonly ownerScopeAmendmentDigestSha256: string
  readonly semanticSourceRouteDigestSha256: string
  readonly v1VisualCaseDigestSha256: string
  readonly caseSourceAdmissionV2Required: true
  readonly caseSourceAdmissionV2DigestPending: true
  readonly representativeRuntimePermitted: false
  readonly caseDigestSha256: string
}

export interface LivingFrameRepresentativeVisualFixtureManifestV2Draft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_V2_VERSION
  readonly fixtureClass:
    'source_only_semantic_route_aligned_representative_media_acceptance_candidate'
  readonly state:
    'v2_fixture_contract_complete_canonical_owner_reconciliation_pending'
  readonly supersedesRuntimeUseOfContractVersion:
    'living-frame-representative-visual-fixture-v1'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly semanticRoutingVersion:
    'living-frame-representative-semantic-source-routing-v1'
  readonly semanticRoutingDigestSha256: string
  readonly v1VisualFixtureDigestSha256: string
  readonly cases: readonly LivingFrameRepresentativeVisualFixtureCaseV2[]
  readonly activeCaseCount: 12
  readonly directTopicMatchedBrollCaseCount: 2
  readonly hybridAndAttentionV1StillRoleRemoved: true
  readonly automaticDerivedStillSubstitutionPermitted: false
  readonly v1FixtureMayDriveRepresentativeRuntime: false
  readonly sharedCanonicalFixtureMutated: false
  readonly pausedScopesRejected:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly pausedScopeCount: 7
  readonly representativeMediaRuntimeExecuted: false
  readonly qwenProviderCallMade: false
  readonly headQaRecommendationMade: false
  readonly canonicalPrivateReviewApproved: false
  readonly canonicalConsumptionPending: true
  readonly createsPlannerSnapshotTimingWorkAssetRendererQaOrReviewOwner: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeVisualFixtureManifestV2
  extends LivingFrameRepresentativeVisualFixtureManifestV2Draft {
  readonly caseSetDigestSha256: string
  readonly manifestDigestSha256: string
}
