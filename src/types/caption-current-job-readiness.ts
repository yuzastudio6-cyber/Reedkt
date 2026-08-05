import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionSharedOwnerKey } from
  './caption-shared-owner-integration'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION =
  'caption-current-job-readiness-ledger-v1' as const

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
