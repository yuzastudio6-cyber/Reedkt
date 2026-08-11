import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionGoalCompletionGapId } from
  './caption-goal-completion-audit'

export const CAPTION_PRIVATE_INTERNAL_EVIDENCE_PROGRESS_VERSION =
  'caption-private-internal-evidence-progress-v1' as const

export type CaptionPrivateInternalEvidenceGateStatus =
  | 'actual_evidence_rejected'
  | 'source_ready_missing_actual_evidence'
  | 'actual_evidence_incomplete'
  | 'actual_evidence_accepted_outside_terminal_scope'
  | 'blocked_by_upstream_gates'

export interface CaptionPrivateInternalEvidenceGateProgress {
  gapId: CaptionGoalCompletionGapId
  status: CaptionPrivateInternalEvidenceGateStatus
  evidenceRefs: CaptionDomainRef[]
  nextRequiredEvidenceCodes: string[]
  actualPrivateEvidenceObserved: boolean
  sameCanonicalTerminalRunBound: false
  terminalGateSatisfied: false
  historicalOrSeparateFixtureRelabeledAsTerminalEvidence: false
}

/**
 * Current byte-free truth record for the private Caption qualification run.
 * It reports independently observed evidence without pretending that evidence
 * from different scopes, packages, or fixtures forms one terminal edit.
 */
export interface CaptionPrivateInternalEvidenceProgress {
  schemaVersion: typeof CAPTION_PRIVATE_INTERNAL_EVIDENCE_PROGRESS_VERSION
  progressId: string
  progressDigestSha256: string
  observedAt: string
  sourceCurrentJobReadinessRef: CaptionDomainRef
  counts: {
    declaredCaptionJobs: 41
    captionOwnedImplementationsComplete: 41
    sourcePathsReadyForPrivateEvidenceRun: 41
    canonicalOwnerCompositionMountsComplete: 5
    terminalPrivateInternalQualifiedJobs: 0
    terminalEvidenceGates: 9
    terminalEvidenceGatesSatisfied: 0
    gatesWithActualPrivateEvidenceObserved: 5
    acceptedEvidenceOutsideTerminalScope: 1
    incompleteOrRejectedEvidenceGates: 4
    missingActualEvidenceGates: 3
    gatesBlockedByUpstreamEvidence: 1
  }
  gates: CaptionPrivateInternalEvidenceGateProgress[]
  professionalAppearanceEvidence: {
    realTalkingHeadPixelsInspected: true
    fullMotionRenderRef: CaptionDomainRef
    reducedMotionRenderRef: CaptionDomainRef
    directInspectionReceiptRef: CaptionDomainRef
    acceptedForCaptionOwnedProfessionalAppearance: true
    syntheticEngineeringFixtureUsed: false
    qualifiedSharedPostrenderAiReviewClaimed: false
    independentFinalQaClaimed: false
  }
  terminalStatus:
    'caption_private_internal_evidence_in_progress'
  targetTerminalStatus: 'caption_specialist_private_internal_qualified'
  oneExactCanonicalRunCompleted: false
  terminalStatusClaimed: false
  publicProductionRequiredForTarget: false
  centralOrchestraRequiredForTarget: false
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}
