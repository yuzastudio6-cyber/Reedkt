import type {
  CanonicalCaptionApprovedExecutionCoverage,
} from './canonical-caption-approved-execution-coverage'
import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_VERSION =
  'canonical-caption-approved-execution-campaign-v1' as const
export const CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_REPOSITORY_VERSION =
  'canonical-caption-approved-execution-campaign-repository-v1' as const

export interface CanonicalCaptionApprovedExecutionCampaignRun {
  ordinal: number
  observedAt: string
  coverageRef: CaptionDomainRef
  canonicalScope:
    CanonicalCaptionApprovedExecutionCoverage['canonicalScope']
  executionPackageRef: CaptionDomainRef
  workGraphRef: CaptionDomainRef
  captionPlanningProjectionRef: CaptionDomainRef
  outputIds: string[]
  coveredCaptionJobTypes: CaptionsSupportedJobType[]
  occurrenceCount: number
  exactCoverageRecordReread: true
  exactApprovedSnapshotAndExecutionPackageLineageVerified: true
  preterminalApprovedExecutionEvidenceOnly: true
  terminalQualificationClaimed: false
}

/**
 * Create-only union of multiple exact approved Caption execution records.
 * It proves catalog execution breadth without fabricating one all-feature edit
 * and without substituting for media inspection, owner evidence, final QA, or
 * private-review qualification.
 */
export interface CanonicalCaptionApprovedExecutionCampaign {
  schemaVersion: typeof CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_VERSION
  campaignId: string
  campaignDigestSha256: string
  observedAt: string
  canonicalOwnerScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
  captionCapabilityManifestRef: CaptionDomainRef
  runs: CanonicalCaptionApprovedExecutionCampaignRun[]
  declaredCaptionJobTypes: CaptionsSupportedJobType[]
  coveredCaptionJobTypes: CaptionsSupportedJobType[]
  missingCaptionJobTypes: CaptionsSupportedJobType[]
  counts: {
    approvedRuns: number
    distinctEditSessions: number
    distinctApprovedSnapshots: number
    distinctExecutionPackages: number
    executedCaptionJobOccurrences: number
    uniqueCoveredCaptionJobTypes: number
    missingCaptionJobTypes: number
  }
  disposition:
    | 'partial_multi_snapshot_execution_coverage'
    | 'complete_multi_snapshot_execution_coverage_terminal_evidence_still_required'
  completeCatalogExecutionCoverage: boolean
  requiresAdditionalApprovedRuns: boolean
  multipleApprovedSnapshotsRequired: true
  distinctApprovedSnapshotsAndExecutionPackagesVerified: true
  oneAllFeatureEditFabricated: false
  allCoverageRecordsPersistedCreateOnlyAndReread: true
  allRunCoveragePreterminalOnly: true
  structuralOwnerFixtureRelabeledAsPrivateQualification: false
  acceptedByTerminalQualificationRunRepository: false
  actualArtifactBytesIndependentlyRereadForThisCampaign: false
  actualRequiredOwnerEvidenceRereadForThisCampaign: false
  qualifiedCompleteTimeVisualReviewRereadForThisCampaign: false
  independentFinalQaRereadForThisCampaign: false
  privateReviewAcceptanceRereadForThisCampaign: false
  terminalQualificationClaimed: false
  callerSuppliedCoverageAccepted: false
  browserLocalCompletionAccepted: false
  directPeerDispatchPerformedByCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionApprovedExecutionCampaignRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly campaign: CanonicalCaptionApprovedExecutionCampaign
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly campaignRef: CaptionDomainRef
  }): Promise<CanonicalCaptionApprovedExecutionCampaign | null>
}
