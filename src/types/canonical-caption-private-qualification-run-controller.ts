import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionQualificationRunEvidence,
} from './canonical-caption-qualification-run-evidence'
import type {
  CanonicalCaptionRealSourceInspectionBundle,
  CanonicalCaptionRealSourceInspectionProjectionOutcome,
  CanonicalCaptionRealSourceInspectionProjectionRequest,
} from './canonical-caption-real-source-inspection-projection'
import type {
  CanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification'

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION =
  'canonical-caption-private-qualification-run-controller-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION =
  'canonical-caption-private-qualification-run-outcome-v1' as const

export interface CanonicalCaptionPrivateQualificationRunControllerInput {
  inspectionRequest: CanonicalCaptionRealSourceInspectionProjectionRequest
  inspectionBundle: CanonicalCaptionRealSourceInspectionBundle
  qualificationRequest: CanonicalCaptionTerminalQualificationRequest
  captionOwnedClosedDirectInspectionReceiptProvided: true
  exactApprovedRunRereadRequired: true
  callerSuppliedCanonicalAuthorityAccepted: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPrivateQualificationRunOutcome {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION
  outcomeDigestSha256: string
  disposition:
    | 'inspection_projected_waiting_for_complete_run'
    | 'approved_run_recorded'
  inspectionProjection:
    CanonicalCaptionRealSourceInspectionProjectionOutcome
  inspectionEvidenceRef: CaptionDomainRef
  qualificationRunEvidence:
    CanonicalCaptionQualificationRunEvidence | null
  qualificationRunEvidenceRef: CaptionDomainRef | null
  inspectionBundlePersistedCreateOnlyAndReread: true
  canonicalInspectionAuthorityRereadTwice: true
  canonicalRunEvidenceSourceReadAttempted: true
  qualificationRunEvidencePersistedAndExactReread: boolean
  incompleteRunPromoted: false
  callerSuppliedCanonicalAuthorityAccepted: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPrivateQualificationRunController {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION
  readonly closedCaptionDirectInspectionReceiptRequired: true
  readonly exactApprovedRunRereadRequired: true
  readonly incompleteRunPromotionAllowed: false
  reconcileApprovedRun(
    input: CanonicalCaptionPrivateQualificationRunControllerInput,
  ): Promise<CanonicalCaptionPrivateQualificationRunOutcome>
}
