import type {
  CanonicalCaptionIncomingSupportRequestReadPort,
} from './canonical-caption-specialist-execution'
import type {
  OrchestraSkillCall,
  SkillContractRef,
} from './orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  './orchestra-skill-support-request-v2'

export const CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_ADMISSION_VERSION =
  'canonical-caption-incoming-support-request-admission-v1' as const
export const CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_REPOSITORY_VERSION =
  'canonical-caption-incoming-support-request-repository-v1' as const

/**
 * Create-only backend admission for one exact HQ-mediated request targeting
 * Caption. The request may be authored before approval, so its nullable
 * approvedSnapshotRef is never rewritten. The later immutable Caption work
 * item supplies and binds the actual approved snapshot authority.
 */
export interface CanonicalCaptionIncomingSupportRequestAdmission {
  schemaVersion:
    typeof CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_ADMISSION_VERSION
  admissionId: string
  admissionDigestSha256: string
  requestRef: SkillContractRef
  originalCallRef: SkillContractRef
  request: SkillSupportRequestV2
  originalCall: OrchestraSkillCall
  admittedAt: string
  exactRequestAndOriginalCallRereadRequired: true
  requestIsHqMediatedAndTargetsCaption: true
  requestScopeMayOnlyGainApprovedSnapshotFromCanonicalWork: true
  callerSuppliedExecutionEvidenceAccepted: false
  directPeerDispatchPerformed: false
  timelineMutationPerformed: false
  providerCallPerformed: false
  runtimeExecutionPerformed: false
  assetMutationPerformed: false
  costOrBillingMutationPerformed: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionIncomingSupportRequestRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_REPOSITORY_VERSION
  readonly readPort: CanonicalCaptionIncomingSupportRequestReadPort
  persistCreateOnly(input: {
    readonly admission: CanonicalCaptionIncomingSupportRequestAdmission
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly requestRef: SkillContractRef
  }): Promise<CanonicalCaptionIncomingSupportRequestAdmission | null>
}
