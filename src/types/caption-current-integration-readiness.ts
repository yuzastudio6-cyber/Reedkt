import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CaptionGoalCompletionGapId,
  CaptionGoalCompletionOwnerKey,
} from './caption-goal-completion-audit'

export const CAPTION_CURRENT_INTEGRATION_READINESS_VERSION =
  'caption-current-integration-readiness-v1' as const

export type CaptionCurrentCanonicalOwnerState =
  | 'canonical_mount_missing'
  | 'actual_owner_evidence_missing'
  | 'canonical_adapter_and_owner_result_missing'
  | 'authenticated_owner_result_missing'
  | 'canonical_execution_mount_missing'
  | 'qualified_complete_time_review_missing'
  | 'independent_final_qa_missing'
  | 'deferred_until_terminal_dependencies'

export interface CaptionCurrentIntegrationGapState {
  gapId: CaptionGoalCompletionGapId
  ownerKeys: CaptionGoalCompletionOwnerKey[]
  captionImplementationState:
    | 'caption_consumer_source_complete'
    | 'caption_contract_source_complete'
    | 'caption_terminal_projection_deferred'
    | 'external_owner_only'
  canonicalOwnerState: CaptionCurrentCanonicalOwnerState
  sourceEvidenceRefs: CaptionDomainRef[]
  captionSourceImplementationComplete: boolean
  actualCanonicalOwnerRecordConsumed: false
  liveOwnerRuntimeEvidenceConsumed: false
  blocksTerminalStatus: true
  captionMayImplementDuplicateOwner: false
  runtimeOrDispatchAuthorityGrantedByReadiness: false
}

export interface CaptionCurrentIntegrationReadiness {
  schemaVersion: typeof CAPTION_CURRENT_INTEGRATION_READINESS_VERSION
  readinessId: string
  readinessDigestSha256: string
  observedAt: string
  supersedesFrozenAudit: false
  sourceFrozenGoalAuditRef: CaptionDomainRef
  sourceIntegrationManifestRef: CaptionDomainRef
  sourceIntegrationQualificationRef: CaptionDomainRef
  sourceCanonicalResumeAdapterRef: CaptionDomainRef
  counts: {
    declaredCaptionJobs: 41
    captionOwnedSharedOwnerBoundariesComplete: 5
    strictAuthenticatedMultiOwnerSourceFixturePaths: 1
    actualAuthenticatedPrivateSharedOwnerIntegrations: 0
    canonicalBackendExecutionMounts: 0
    remainingTerminalGaps: 9
  }
  currentEvidence: {
    captionOwnedFeatureSurfaceComplete: true
    captionOwnedSharedOwnerContractsComplete: true
    strictTypedOwnerAdmissionImplemented: true
    priorOwnerCanonicalRereadImplemented: true
    referenceOnlyOwnerEvidenceRejected: true
    strictMultiOwnerSourceFixtureCompleted: true
    liveProviderOrGpuRuntimeRelabeledFromFixture: false
    actualCanonicalResumeRecordConsumed: false
    canonicalBackendPrivateExecutionMounted: false
    qualifiedAiCompleteTimeVisualReviewIntegrated: false
    independentFinalQaRereadIntegrated: false
    terminalPerJobProjectionPublished: false
  }
  gapStates: CaptionCurrentIntegrationGapState[]
  currentStatus:
    'caption_owned_integration_surface_complete_waiting_on_canonical_mounts'
  targetTerminalStatus: 'caption_specialist_private_internal_qualified'
  terminalStatusClaimed: false
  publicProductionRequiredForTerminalStatus: false
  centralOrchestraRequiredForTerminalStatus: false
  centralOrchestraImplemented: false
  browserLocalCompletionAccepted: false
  sourceFixtureRelabeledAsActualOwnerRuntime: false
  technicalQaRelabeledAsVisualAiReview: false
  operationDispatchAuthority: false
  providerOrModelRuntimeAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
