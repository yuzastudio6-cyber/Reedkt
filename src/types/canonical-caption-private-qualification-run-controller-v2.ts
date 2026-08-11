import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionBrollOwnerInspectionBundle,
  CanonicalCaptionBrollOwnerInspectionProjectionOutcome,
  CanonicalCaptionBrollOwnerInspectionProjectionRequest,
} from './canonical-caption-broll-owner-inspection-projection'
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

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_V2_VERSION =
  'canonical-caption-private-qualification-run-controller-v2' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_V2_VERSION =
  'canonical-caption-private-qualification-run-outcome-v2' as const

interface CanonicalCaptionPrivateQualificationRunControllerCommonInput {
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

export type CanonicalCaptionPrivateQualificationRunControllerInputV2 =
  CanonicalCaptionPrivateQualificationRunControllerCommonInput & (
    | {
      inspectionLane: 'uploaded_source'
      inspectionRequest:
        CanonicalCaptionRealSourceInspectionProjectionRequest
      inspectionBundle: CanonicalCaptionRealSourceInspectionBundle
    }
    | {
      inspectionLane: 'broll_owner'
      inspectionRequest:
        CanonicalCaptionBrollOwnerInspectionProjectionRequest
      inspectionBundle: CanonicalCaptionBrollOwnerInspectionBundle
    }
  )

export type CanonicalCaptionPrivateQualificationInspectionProjectionV2 =
  | CanonicalCaptionRealSourceInspectionProjectionOutcome
  | CanonicalCaptionBrollOwnerInspectionProjectionOutcome

export interface CanonicalCaptionPrivateQualificationRunOutcomeV2 {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_V2_VERSION
  outcomeDigestSha256: string
  disposition:
    | 'inspection_projected_waiting_for_complete_run'
    | 'approved_run_recorded'
  inspectionLane: 'uploaded_source' | 'broll_owner'
  inspectionProjection:
    CanonicalCaptionPrivateQualificationInspectionProjectionV2
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

export interface CanonicalCaptionPrivateQualificationRunControllerV2 {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_V2_VERSION
  readonly supportedInspectionLanes:
    readonly ['uploaded_source', 'broll_owner']
  readonly closedCaptionDirectInspectionReceiptRequired: true
  readonly exactApprovedRunRereadRequired: true
  readonly incompleteRunPromotionAllowed: false
  reconcileApprovedRun(
    input: CanonicalCaptionPrivateQualificationRunControllerInputV2,
  ): Promise<CanonicalCaptionPrivateQualificationRunOutcomeV2>
}
