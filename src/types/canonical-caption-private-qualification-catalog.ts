import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionSharedOwnerKey } from
  './caption-shared-owner-integration'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REQUEST_VERSION =
  'canonical-caption-private-qualification-catalog-request-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_VERSION =
  'canonical-caption-private-qualification-catalog-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_READ_PORT_VERSION =
  'canonical-caption-private-qualification-catalog-read-port-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REPOSITORY_VERSION =
  'canonical-caption-private-qualification-catalog-repository-v1' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_ASSEMBLY_VERSION =
  'canonical-caption-private-qualification-catalog-assembly-v1' as const

export type CanonicalCaptionQualificationCatalogOwnerKey =
  | 'canonical_transcript'
  | CaptionSharedOwnerKey

export interface CanonicalCaptionPrivateQualificationCatalogRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  qualificationScope: {
    ownerUserId: string
    workspaceId: string
    suiteId: string
  }
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  runEvidenceRequestRefs: CaptionDomainRef[]
  requiredJobTypes: CaptionsSupportedJobType[]
  privateInternalQualificationRun: true
  multipleApprovedRunsExpected: true
  oneAllFeatureEditRequired: false
  callerSuppliedRunEvidenceAccepted: false
  planningOnlyEvidenceAcceptedAsQualification: false
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  browserLocalCompletionAccepted: false
  centralOrchestraImplemented: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionCatalogOwnerEvidenceRef {
  ownerKey: CanonicalCaptionQualificationCatalogOwnerKey
  evidenceRef: CaptionDomainRef
  evidenceClass:
    | 'canonical_transcript_authenticated_read'
    | 'canonical_owner_record'
  exactPersistedOwnerEvidenceReread: true
}

export interface CanonicalCaptionCatalogJobQualificationEvidence {
  jobType: CaptionsSupportedJobType
  sourceRunEvidenceRef: CaptionDomainRef
  sourceRunRequestRef: CaptionDomainRef
  sourceOccurrenceRef: CaptionDomainRef
  sourceOutputEvidenceRef: CaptionDomainRef
  requiredOwnerKeys: CanonicalCaptionQualificationCatalogOwnerKey[]
  ownerEvidenceRefs: CanonicalCaptionCatalogOwnerEvidenceRef[]
  qualificationBasis:
    'approved_run_completed_job_plus_accepted_output_review'
  actualApprovedRunCompleted: true
  actualPersistedPlanningArtifactReread: true
  actualRenderedOutputReread: true
  actualCompleteTimeVisualReviewPassed: true
  actualIndependentFinalQaPassed: true
  actualPrivateReviewAccepted: true
  planningOnlyEvidenceAcceptedAsQualification: false
  sourceFixtureRelabeledAsRuntimeEvidence: false
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  unresolvedBlockerCodes: []
  privateInternalQualified: true
}

export interface CanonicalCaptionCatalogOwnerCoverage {
  ownerKey: CanonicalCaptionQualificationCatalogOwnerKey
  requiredJobCount: number
  coveredJobCount: number
  evidenceRefs: CaptionDomainRef[]
  exactPersistedEvidenceReread: true
  allRequiredJobsCovered: true
}

export interface CanonicalCaptionPrivateQualificationCatalog {
  schemaVersion: typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_VERSION
  catalogId: string
  catalogDigestSha256: string
  requestRef: CaptionDomainRef
  observedAt: string
  qualificationScope: {
    ownerUserId: string
    workspaceId: string
    suiteId: string
  }
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  sourceRunEvidenceRefs: CaptionDomainRef[]
  sourceApprovedSnapshotRefs: CaptionDomainRef[]
  jobQualificationEvidence:
    CanonicalCaptionCatalogJobQualificationEvidence[]
  ownerCoverage: CanonicalCaptionCatalogOwnerCoverage[]
  counts: {
    approvedRuns: number
    distinctApprovedSnapshots: number
    distinctReviewedOutputs: number
    declaredCaptionJobs: 41
    privateInternalQualifiedJobs: 41
    requiredOwnerClasses: 5
    requiredOwnerClassesCovered: 5
    unresolvedJobBlockers: 0
  }
  gates: {
    canonicalTranscriptEvidenceComplete: true
    visualIntelligenceEvidenceComplete: true
    trackAllEvidenceComplete: true
    soundSyncEvidenceComplete: true
    brollOwnerEvidenceComplete: true
    canonicalApprovedRunEvidenceComplete: true
    qualifiedCompleteTimeVisualReviewComplete: true
    independentFinalQaAndPrivateReviewComplete: true
    terminalPerJobProjectionReady: true
    terminalPerJobProjectionPublished: false
  }
  currentStatus: 'ready_for_caption_private_internal_terminal_projection'
  terminalStatusClaimed: false
  multipleApprovedRunsAggregated: true
  oneAllFeatureEditFabricated: false
  callerSuppliedRunEvidenceAccepted: false
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

export interface CanonicalCaptionPrivateQualificationCatalogReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_persisted_caption_qualification_runs'
  readonly callerSuppliedRunEvidenceAccepted: false
  readExact(input: {
    readonly request: CanonicalCaptionPrivateQualificationCatalogRequest
  }): Promise<CanonicalCaptionPrivateQualificationCatalog | null>
}

export interface CanonicalCaptionPrivateQualificationCatalogRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REPOSITORY_VERSION
  persistCatalogCreateOnly(input: {
    readonly catalog: CanonicalCaptionPrivateQualificationCatalog
  }): Promise<'created' | 'identical_replay'>
  rereadCatalog(input: {
    readonly requestRef: CaptionDomainRef
  }): Promise<CanonicalCaptionPrivateQualificationCatalog | null>
}

export interface CanonicalCaptionPrivateQualificationCatalogAssembly {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_ASSEMBLY_VERSION
  readonly evidenceReadPort:
    CanonicalCaptionPrivateQualificationCatalogReadPort
  readonly repository: CanonicalCaptionPrivateQualificationCatalogRepository
  readonly exactRunRecordsRereadBeforeAssembly: true
  readonly createOnlyPersistenceAndExactReread: true
  readonly callerSuppliedRunEvidenceAccepted: false
  readonly planningOnlyEvidenceAcceptedAsQualification: false
  readonly syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  readonly terminalStatusClaimed: false
  readonly operationOrRuntimeAuthorityGrantedToCaption: false
  readonly finalQaApprovalAuthorityGrantedToCaption: false
  readonly publicDeliveryAuthorityGrantedToCaption: false
  readonly productionAuthorityGrantedToCaption: false
}
