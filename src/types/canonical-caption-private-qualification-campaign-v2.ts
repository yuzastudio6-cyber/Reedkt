import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionPrivateInternalQualificationRecord,
} from './canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog'
import type {
  CanonicalCaptionPrivateQualificationRunControllerInputV2,
} from './canonical-caption-private-qualification-run-controller-v2'

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_V2_VERSION =
  'canonical-caption-private-qualification-campaign-controller-v2' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_V2_VERSION =
  'canonical-caption-private-qualification-campaign-outcome-v2' as const

export interface CanonicalCaptionPrivateQualificationCampaignInputV2 {
  catalogRequest: CanonicalCaptionPrivateQualificationCatalogRequest
  approvedRuns: CanonicalCaptionPrivateQualificationRunControllerInputV2[]
  exactCatalogRunSetRequired: true
  multipleApprovedSnapshotsRequired: true
  oneAllFeatureEditFabricated: false
  mixedInspectionLanesAllowed: true
  privateInternalQualificationHarnessOnly: true
  callerSuppliedCanonicalAuthorityAccepted: false
  browserLocalCompletionAccepted: false
  centralOrchestraImplemented: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPrivateQualificationCampaignRunOutcomeV2 {
  runQualificationRequestRef: CaptionDomainRef
  approvedSnapshotRef: CaptionDomainRef
  outputId: string
  inspectionLane: 'uploaded_source' | 'broll_owner'
  inspectionRequestRef: CaptionDomainRef
  runOutcomeDigestSha256: string
  disposition:
    | 'inspection_projected_waiting_for_complete_run'
    | 'approved_run_recorded'
  inspectionEvidenceRef: CaptionDomainRef
  qualificationRunEvidenceRef: CaptionDomainRef | null
}

export interface CanonicalCaptionPrivateQualificationCampaignOutcomeV2 {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_V2_VERSION
  outcomeDigestSha256: string
  disposition:
    | 'waiting_for_complete_approved_runs'
    | 'waiting_for_complete_catalog_coverage'
    | 'qualified_private_internal'
  catalogRequestRef: CaptionDomainRef
  runOutcomes: CanonicalCaptionPrivateQualificationCampaignRunOutcomeV2[]
  missingRunRequestRefs: CaptionDomainRef[]
  qualificationRecord:
    CanonicalCaptionPrivateInternalQualificationRecord | null
  qualificationRecordRef: CaptionDomainRef | null
  everyDeclaredRunReconciled: boolean
  catalogAssemblyAndReleaseAttempted: boolean
  qualificationRecordPersistedAndExactReread: boolean
  incompleteRunOrCatalogPromoted: false
  exactCatalogRunSetRequired: true
  multipleApprovedSnapshotsRequired: true
  oneAllFeatureEditFabricated: false
  mixedInspectionLanesAllowed: true
  privateInternalQualificationHarnessOnly: true
  callerSuppliedCanonicalAuthorityAccepted: false
  browserLocalCompletionAccepted: false
  centralOrchestraImplemented: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPrivateQualificationCampaignControllerV2 {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_V2_VERSION
  readonly exactCatalogRunSetRequired: true
  readonly multipleApprovedSnapshotsRequired: true
  readonly oneAllFeatureEditAllowed: false
  readonly mixedInspectionLanesAllowed: true
  readonly incompleteRunOrCatalogPromotionAllowed: false
  readonly privateInternalQualificationHarnessOnly: true
  reconcileCampaign(
    input: CanonicalCaptionPrivateQualificationCampaignInputV2,
  ): Promise<CanonicalCaptionPrivateQualificationCampaignOutcomeV2>
}
