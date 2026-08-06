import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionPrivateInternalQualificationRecord,
} from './canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog'
import type {
  CanonicalCaptionPrivateQualificationRunControllerInput,
} from './canonical-caption-private-qualification-run-controller'

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_VERSION =
  'canonical-caption-private-qualification-campaign-controller-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_VERSION =
  'canonical-caption-private-qualification-campaign-outcome-v1' as const

export interface CanonicalCaptionPrivateQualificationCampaignInput {
  catalogRequest: CanonicalCaptionPrivateQualificationCatalogRequest
  approvedRuns: CanonicalCaptionPrivateQualificationRunControllerInput[]
  exactCatalogRunSetRequired: true
  multipleApprovedSnapshotsRequired: true
  oneAllFeatureEditFabricated: false
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

export interface CanonicalCaptionPrivateQualificationCampaignRunOutcome {
  runQualificationRequestRef: CaptionDomainRef
  approvedSnapshotRef: CaptionDomainRef
  outputId: string
  runOutcomeDigestSha256: string
  disposition:
    | 'inspection_projected_waiting_for_complete_run'
    | 'approved_run_recorded'
  inspectionEvidenceRef: CaptionDomainRef
  qualificationRunEvidenceRef: CaptionDomainRef | null
}

export interface CanonicalCaptionPrivateQualificationCampaignOutcome {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_VERSION
  outcomeDigestSha256: string
  disposition:
    | 'waiting_for_complete_approved_runs'
    | 'waiting_for_complete_catalog_coverage'
    | 'qualified_private_internal'
  catalogRequestRef: CaptionDomainRef
  runOutcomes: CanonicalCaptionPrivateQualificationCampaignRunOutcome[]
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

export interface CanonicalCaptionPrivateQualificationCampaignController {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_VERSION
  readonly exactCatalogRunSetRequired: true
  readonly multipleApprovedSnapshotsRequired: true
  readonly oneAllFeatureEditAllowed: false
  readonly incompleteRunOrCatalogPromotionAllowed: false
  readonly privateInternalQualificationHarnessOnly: true
  reconcileCampaign(
    input: CanonicalCaptionPrivateQualificationCampaignInput,
  ): Promise<CanonicalCaptionPrivateQualificationCampaignOutcome>
}
