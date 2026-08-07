import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_VERSION =
  'canonical-caption-approved-execution-coverage-v1' as const
export const CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_REPOSITORY_VERSION =
  'canonical-caption-approved-execution-coverage-repository-v1' as const

export interface CanonicalCaptionApprovedExecutionCoverageOccurrence {
  occurrenceId: string
  canonicalCatalogOrder: number
  captionJobType: CaptionsSupportedJobType
  scopeLevel: 'video' | 'scene' | 'boundary'
  outputId: string
  sceneId: string | null
  boundaryId: string | null
  authorizedFrameRanges: Array<{
    startFrame: number
    endFrameExclusive: number
  }>
  approvedWorkItemRef: CaptionDomainRef
  canonicalJobRef: CaptionDomainRef
  plannedManifestEntryRef: CaptionDomainRef
  adapterCompletionRef: CaptionDomainRef
  resultArtifactRef: CaptionDomainRef
  adapterCompletedAt: string
  exactApprovedWorkJobAndManifestReread: true
  exactPersistedAdapterCompletionReread: true
  idempotentAdapterReplayVerified: true
  privateArtifactPersistenceClaimReread: true
  deterministicArtifactQaClaimReread: true
  reconciliationClaimReread: true
  artifactBytesIndependentlyRereadForThisRecord: false
  requiredOwnerEvidenceRereadForThisRecord: false
  qualifiedCompleteTimeVisualReviewRereadForThisRecord: false
  independentFinalQaRereadForThisRecord: false
  terminalJobQualificationClaimed: false
}

/**
 * Exact preterminal observation of one approved Caption execution package.
 * It records canonical adapter completions without weakening or replacing the
 * stricter qualification-run reader that later requires owner evidence,
 * rendered-output review, independent final QA, and private-review acceptance.
 */
export interface CanonicalCaptionApprovedExecutionCoverage {
  schemaVersion: typeof CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_VERSION
  coverageId: string
  coverageDigestSha256: string
  observedAt: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotRef: CaptionDomainRef
  }
  executionPackageRef: CaptionDomainRef
  workGraphRef: CaptionDomainRef
  captionPlanningProjectionRef: CaptionDomainRef
  captionCapabilityManifestRef: CaptionDomainRef
  declaredCaptionJobTypes: CaptionsSupportedJobType[]
  coveredCaptionJobTypes: CaptionsSupportedJobType[]
  missingCaptionJobTypes: CaptionsSupportedJobType[]
  outputIds: string[]
  jobOccurrences: CanonicalCaptionApprovedExecutionCoverageOccurrence[]
  counts: {
    declaredCaptionJobTypes: 41
    projectedCaptionJobOccurrences: number
    executedCaptionJobOccurrences: number
    uniqueCoveredCaptionJobTypes: number
    missingCaptionJobTypes: number
  }
  disposition:
    | 'partial_catalog_execution_coverage'
    | 'complete_catalog_execution_coverage_terminal_evidence_still_required'
  allProjectedCaptionWorkItemsExecuted: true
  allProjectedAdapterCompletionsPersistedAndReread: true
  allProjectedAdapterResultsQaPassedAndReconciled: true
  completeCatalogExecutionCoverage: boolean
  requiresAdditionalApprovedRuns: boolean
  preterminalApprovedExecutionEvidenceOnly: true
  acceptedByTerminalQualificationRunRepository: false
  actualArtifactBytesIndependentlyRereadForThisRecord: false
  actualRequiredOwnerEvidenceRereadForThisRecord: false
  qualifiedCompleteTimeVisualReviewRereadForThisRecord: false
  independentFinalQaRereadForThisRecord: false
  terminalQualificationClaimed: false
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  sourceFixtureRelabeledAsTerminalEvidence: false
  directPeerDispatchPerformedByCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionApprovedExecutionCoverageRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly coverage: CanonicalCaptionApprovedExecutionCoverage
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly executionPackageRef: CaptionDomainRef
  }): Promise<CanonicalCaptionApprovedExecutionCoverage | null>
}
