import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionGoalCompletionGapId } from
  './caption-goal-completion-audit'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION =
  'caption-terminal-qualification-evidence-input-v1' as const
export const CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION =
  'caption-terminal-per-job-qualification-projection-v1' as const
export const CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION =
  'caption-terminal-qualification-preflight-v1' as const
export const CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2 =
  'caption-terminal-qualification-evidence-input-v2' as const
export const CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2 =
  'caption-terminal-per-job-qualification-projection-v2' as const
export const CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2 =
  'caption-terminal-qualification-preflight-v2' as const

export interface CaptionTerminalQualificationCanonicalScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: CaptionDomainRef
}

export interface CaptionTerminalJobEvidenceInput {
  jobType: CaptionsSupportedJobType
  outputIds: string[]
  persistedCaptionJobResultRef: CaptionDomainRef
  executionBundleRef: CaptionDomainRef
  workItemRef: CaptionDomainRef
  plannedAssetManifestEntryRefs: CaptionDomainRef[]
  estimateCostBindingRefs: CaptionDomainRef[]
  producedArtifactRefs: CaptionDomainRef[]
  sharedOwnerEvidenceRefs: CaptionDomainRef[]
  deterministicQaEvidenceRefs: CaptionDomainRef[]
  renderedVisualReviewEvidenceRefs: CaptionDomainRef[]
  independentFinalQaEvidenceRefs: CaptionDomainRef[]
  exactApprovedSnapshotReread: true
  exactJobResultReread: true
  allRequiredOwnerEvidenceReread: true
  allRequiredArtifactsPersistedAndReread: true
  deterministicQaPassed: true
  qualifiedVisualReviewPassedWhereRequired: true
  independentFinalQaPassed: true
  blockerCodes: []
}

export interface CaptionTerminalOutputEvidenceInput {
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  qualifiedCompleteTimeVisualReviewRef: CaptionDomainRef
  independentFinalQaRef: CaptionDomainRef
  privateReviewDecisionRef: CaptionDomainRef
  repairGeneration: number
  exactConfirmedFrameReread: true
  exactRenderedArtifactReread: true
  completeTimeVisualReviewPassed: true
  independentFinalQaPassed: true
  privateReviewAccepted: true
  unresolvedBlockerCodes: []
}

export interface CaptionTerminalQualificationEvidenceInput {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION
  inputId: string
  inputDigestSha256: string
  observedAt: string
  canonicalScope: CaptionTerminalQualificationCanonicalScope
  sourceCurrentReadinessRef: CaptionDomainRef
  sourcePrivateReleaseRef: CaptionDomainRef
  integrationManifestRef: CaptionDomainRef
  integrationQualificationRef: CaptionDomainRef
  canonicalExecution: {
    executionPackageRef: CaptionDomainRef
    workGraphRef: CaptionDomainRef
    assetManifestRef: CaptionDomainRef
    masterTimingRef: CaptionDomainRef
    storyTimingRef: CaptionDomainRef
    estimateApprovalRef: CaptionDomainRef
    creditReservationRef: CaptionDomainRef
    costBindingRef: CaptionDomainRef
    exactApprovedSnapshotReread: true
    exactExecutionPackageReread: true
    allCaptionWorkItemsCompleted: true
    allCaptionArtifactsPersistedAndReread: true
    allCaptionJobResultsPersistedAndReread: true
    unresolvedRequiredWorkItemCount: 0
    unresolvedRequiredAssetCount: 0
  }
  canonicalSharedOwnerEvidence: {
    canonicalTranscriptReadRef: CaptionDomainRef
    visualIntelligenceEvidenceRef: CaptionDomainRef
    trackAllEvidenceRef: CaptionDomainRef
    soundSyncEvidenceRef: CaptionDomainRef
    brollOwnerEvidenceRef: CaptionDomainRef
    actualCanonicalRecordsReread: true
    sourceFixtureUsedAsRuntimeEvidence: false
    referenceOnlyEvidenceAccepted: false
  }
  jobEvidence: CaptionTerminalJobEvidenceInput[]
  outputEvidence: CaptionTerminalOutputEvidenceInput[]
  evidenceSourceClass: 'canonical_private_persisted_evidence'
  privateInternalQualificationRun: true
  allDeclaredCaptionJobsCovered: true
  everyConfirmedOutputCoveredExactlyOnce: true
  browserLocalCompletionAccepted: false
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformedByCaption: false
  runtimeExecutionAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CaptionTerminalJobQualificationProjectionItem {
  jobType: CaptionsSupportedJobType
  outputIds: string[]
  qualificationStatus: 'qualified_private_internal'
  sourceJobResultRef: CaptionDomainRef
  evidenceRefs: CaptionDomainRef[]
  blockerCodes: []
  captionOwnedImplementationComplete: true
  requiredCanonicalEvidenceComplete: true
  runtimeOwnershipTransferredToCaption: false
  duplicateSharedOwnerCreated: false
}

export interface CaptionTerminalOutputQualificationProjectionItem {
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  qualifiedCompleteTimeVisualReviewRef: CaptionDomainRef
  independentFinalQaRef: CaptionDomainRef
  privateReviewDecisionRef: CaptionDomainRef
  repairGeneration: number
  qualificationStatus: 'qualified_private_internal'
  unresolvedBlockerCodes: []
}

export interface CaptionTerminalQualificationProjection {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  observedAt: string
  canonicalScope: CaptionTerminalQualificationCanonicalScope
  sourceInputRef: CaptionDomainRef
  sourceCurrentReadinessRef: CaptionDomainRef
  sourcePrivateReleaseRef: CaptionDomainRef
  jobs: CaptionTerminalJobQualificationProjectionItem[]
  outputs: CaptionTerminalOutputQualificationProjectionItem[]
  counts: {
    declaredCaptionJobs: 41
    qualifiedPrivateInternalJobs: 41
    blockedJobs: 0
    confirmedOutputs: number
    qualifiedOutputs: number
  }
  allCaptionJobsQualified: true
  allConfirmedOutputsQualified: true
  canonicalBackendPrivateExecutionMounted: true
  authenticatedPrivateSharedOwnerEvidenceIntegrated: true
  qualifiedAiCompleteTimeVisualReviewIntegrated: true
  independentFinalQaRereadIntegrated: true
  actualCanonicalEvidenceConsumed: true
  currentStatus: 'caption_specialist_private_internal_qualified'
  terminalStatusClaimed: true
  privateInternalOnly: true
  publicProductionRequiredForTerminalStatus: false
  centralOrchestraRequiredForTerminalStatus: false
  centralOrchestraImplemented: false
  browserLocalCompletionAccepted: false
  sourceFixtureRelabeledAsActualOwnerRuntime: false
  directPeerDispatchPerformedByCaption: false
  operationDispatchAuthority: false
  providerOrModelRuntimeAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionTerminalQualificationPreflight {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION
  preflightId: string
  preflightDigestSha256: string
  sourceCurrentReadinessRef: CaptionDomainRef
  sourceQualificationInputRef: CaptionDomainRef | null
  disposition:
    | 'blocked_missing_canonical_evidence'
    | 'ready_for_terminal_projection'
  blockingGapIds: CaptionGoalCompletionGapId[]
  canonicalEvidenceAccepted: boolean
  terminalProjectionContractImplemented: true
  terminalProjectionCreated: false
  terminalStatusClaimed: false
  duplicateOwnerCreated: false
  operationDispatchAuthority: false
  providerOrModelRuntimeAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

/**
 * Version-safe terminal lane bound to the mount-audited V3 readiness record.
 * The evidence fields remain structurally identical to V1; only the exact
 * contract and readiness lineage advance.
 */
export interface CaptionTerminalQualificationEvidenceInputV2
  extends Omit<CaptionTerminalQualificationEvidenceInput, 'schemaVersion'> {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2
}

export interface CaptionTerminalQualificationProjectionV2
  extends Omit<CaptionTerminalQualificationProjection, 'schemaVersion'> {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2
}

export interface CaptionTerminalQualificationPreflightV2
  extends Omit<CaptionTerminalQualificationPreflight, 'schemaVersion'> {
  schemaVersion: typeof CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2
}
