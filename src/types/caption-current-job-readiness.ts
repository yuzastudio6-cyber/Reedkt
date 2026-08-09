import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionSharedOwnerKey } from
  './caption-shared-owner-integration'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION =
  'caption-current-job-readiness-ledger-v1' as const
export const CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION_V2 =
  'caption-current-job-readiness-ledger-v2' as const

export type CaptionCurrentJobSourceReadiness =
  | 'ready_for_private_internal_evidence_run'
  | 'waiting_on_canonical_owner_mount'

export interface CaptionCurrentJobReadinessItem {
  jobType: CaptionsSupportedJobType
  requiredSharedOwnerKeys: CaptionSharedOwnerKey[]
  missingCanonicalOwnerMountKeys: CaptionSharedOwnerKey[]
  sourceReadiness: CaptionCurrentJobSourceReadiness
  captionOwnedImplementationComplete: true
  planningModeQualified: true
  actualPrivateEvidenceAccepted: false
  terminalPrivateInternalQualified: false
  excludedFromSupportedCapabilitySurface: false
  duplicateSharedOwnerCreated: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CaptionCurrentOwnerMountReadiness {
  ownerKey: CaptionSharedOwnerKey
  canonicalCompositionMountImplemented: boolean
  affectedJobTypes: CaptionsSupportedJobType[]
  captionBridgeImplementationComplete: true
  actualAuthenticatedPrivateEvidenceConsumed: false
  captionMayImplementDuplicateOwner: false
}

/**
 * Current per-job source readiness for the private internal qualification run.
 * This is not the terminal qualification projection and cannot be used as
 * runtime, QA, delivery, or production evidence.
 */
export interface CaptionCurrentJobReadinessLedger {
  schemaVersion: typeof CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION
  ledgerId: string
  ledgerDigestSha256: string
  observedAt: string
  sourceCurrentIntegrationReadinessRef: CaptionDomainRef
  sourceIntegrationManifestRef: CaptionDomainRef
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  ownerMounts: CaptionCurrentOwnerMountReadiness[]
  jobs: CaptionCurrentJobReadinessItem[]
  counts: {
    declaredSupportedJobs: 41
    captionOwnedImplementationsComplete: 41
    sourcePathsReadyForPrivateEvidenceRun: 37
    jobsWaitingOnCanonicalOwnerMount: 4
    terminalPrivateInternalQualifiedJobs: 0
    excludedSupportedJobs: 0
  }
  currentStatus:
    'caption_37_of_41_source_paths_ready_two_owner_mounts_pending'
  terminalTargetStatus: 'caption_specialist_private_internal_qualified'
  terminalStatusClaimed: false
  actualCanonicalPrivateEvidenceConsumed: false
  sourceFixtureRelabeledAsActualRuntimeEvidence: false
  publicProductionRequiredForInternalQualification: false
  centralOrchestraRequiredForInternalQualification: false
  centralOrchestraImplemented: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

/**
 * Additive source-mount closure. V1 remains the historical pre-merge record;
 * V2 reports that all 41 paths can now enter private internal evidence runs,
 * without claiming that any new runtime evidence has passed.
 */
export interface CaptionCurrentJobReadinessLedgerV2 {
  schemaVersion: typeof CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION_V2
  ledgerId: string
  ledgerDigestSha256: string
  observedAt: string
  supersedesReadinessRef: CaptionDomainRef
  sourceCurrentIntegrationReadinessRef: CaptionDomainRef
  sourceOwnerCompositionRef: CaptionDomainRef
  soundOwnerServiceRef: CaptionDomainRef
  brollOwnerServiceRef: CaptionDomainRef
  ownerMounts: CaptionCurrentOwnerMountReadiness[]
  jobs: CaptionCurrentJobReadinessItem[]
  counts: {
    declaredSupportedJobs: 41
    captionOwnedImplementationsComplete: 41
    canonicalOwnerCompositionMounts: 5
    sourcePathsReadyForPrivateEvidenceRun: 41
    jobsWaitingOnCanonicalOwnerMount: 0
    terminalPrivateInternalQualifiedJobs: 0
    excludedSupportedJobs: 0
  }
  currentStatus:
    'caption_41_of_41_source_paths_ready_for_private_internal_evidence'
  actualSoundPrivateEvidenceConsumed: false
  actualBrollPrivateEvidenceConsumed: false
  directCaptionVisualInspectionCompletedForThisLedger: false
  independentFinalQaCompletedForThisLedger: false
  terminalTargetStatus: 'caption_specialist_private_internal_qualified'
  terminalStatusClaimed: false
  sourceFixtureRelabeledAsActualRuntimeEvidence: false
  publicProductionRequiredForInternalQualification: false
  centralOrchestraRequiredForInternalQualification: false
  centralOrchestraImplemented: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}
