import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog'
import type { CaptionsSupportedJobType } from './captions-specialist'
import type { SkillQualificationSnapshot } from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_RECORD_VERSION =
  'canonical-caption-private-internal-qualification-record-v1' as const
export const CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_REPOSITORY_VERSION =
  'canonical-caption-private-internal-qualification-repository-v1' as const
export const CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION =
  'canonical-caption-private-internal-qualification-service-v1' as const

export interface CanonicalCaptionPrivateInternalQualifiedJob {
  jobType: CaptionsSupportedJobType
  sourceCatalogJobEvidenceRef: CaptionDomainRef
  sourceApprovedRunEvidenceRef: CaptionDomainRef
  sourceReviewedOutputEvidenceRef: CaptionDomainRef
  status: 'qualified'
  qualifiedModes: ['planning', 'private_internal']
  exactApprovedRunEvidenceReread: true
  exactOwnerEvidenceReread: true
  exactRenderedOutputAndQaReread: true
  actualCompleteTimeVisualReviewPassed: true
  actualIndependentFinalQaPassed: true
  actualPrivateReviewAccepted: true
  planningOnlyEvidenceAcceptedAsQualification: false
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  blockerCodes: []
}

export interface CanonicalCaptionPrivateInternalQualificationRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  requestRef: CaptionDomainRef
  catalogRef: CaptionDomainRef
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  privateInternalQualificationSnapshot: SkillQualificationSnapshot
  privateInternalQualificationSnapshotRef: CaptionDomainRef
  qualifiedAt: string
  qualificationScope: {
    ownerUserId: string
    workspaceId: string
    suiteId: string
  }
  qualifiedJobs: CanonicalCaptionPrivateInternalQualifiedJob[]
  counts: {
    approvedRuns: number
    qualifiedCaptionJobs: 41
    blockedCaptionJobs: 0
    excludedSupportedCaptionJobs: 0
    qualifiedOwnerClasses: 5
    qualifiedReviewedOutputs: number
  }
  currentStatus: 'caption_specialist_private_internal_qualified'
  privateInternalSpecialistQualified: true
  allRequiredSupportedCaptionJobsQualified: true
  realApprovedRunsAggregated: true
  actualRenderedOutputsReread: true
  actualCompleteTimeVisualReviewConsumed: true
  actualIndependentFinalQaAndPrivateReviewConsumed: true
  finalPerJobQualificationProjectionPublished: true
  documentationAndFutureOrchestraMountStillSeparate: true
  publicProductionRequiredForThisStatus: false
  centralOrchestraRequiredForThisStatus: false
  centralOrchestraImplemented: false
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  oneAllFeatureEditFabricated: false
  planningOnlyEvidenceAcceptedAsQualification: false
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  directPeerDispatchPerformedByCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPrivateInternalQualificationRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_REPOSITORY_VERSION
  persistRecordCreateOnly(input: {
    readonly record: CanonicalCaptionPrivateInternalQualificationRecord
  }): Promise<'created' | 'identical_replay'>
  rereadRecord(input: {
    readonly requestRef: CaptionDomainRef
  }): Promise<CanonicalCaptionPrivateInternalQualificationRecord | null>
}

export interface CanonicalCaptionPrivateInternalQualificationOutcome {
  disposition:
    | 'blocked_missing_canonical_private_evidence'
    | 'qualified_private_internal'
  request: CanonicalCaptionPrivateQualificationCatalogRequest
  record: CanonicalCaptionPrivateInternalQualificationRecord | null
  currentProductStatusChanged: false
  centralOrchestraImplemented: false
  publicOrProductionAuthorityGranted: false
}

export interface CanonicalCaptionPrivateInternalQualificationService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION
  qualifyPrivateInternal(
    request: CanonicalCaptionPrivateQualificationCatalogRequest,
  ): Promise<CanonicalCaptionPrivateInternalQualificationOutcome>
}
