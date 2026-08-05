import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'
import type {
  SkillArtifactRef,
  SkillContractRef,
  SkillSupportTarget,
} from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_VERSION =
  'canonical-caption-qualification-run-evidence-v1' as const
export const CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_READ_PORT_VERSION =
  'canonical-caption-qualification-run-evidence-read-port-v1' as const
export const CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-qualification-run-evidence-repository-v1' as const
export const CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_ASSEMBLY_VERSION =
  'canonical-caption-qualification-run-evidence-assembly-v1' as const

export type CanonicalCaptionQualificationOwnerKey =
  | 'canonical_transcript'
  | SkillSupportTarget

export interface CanonicalCaptionQualificationOwnerEvidence {
  ownerKey: CanonicalCaptionQualificationOwnerKey
  supportRequestRef: SkillContractRef | null
  ownerEvidenceRef: CaptionDomainRef
  authenticatedOwnerProjectionRef: SkillContractRef | null
  resumeRecordRef: SkillContractRef | null
  evidenceClass:
    | 'canonical_transcript_authenticated_read'
    | 'canonical_owner_record'
    | 'authenticated_projection_only'
  exactPersistedOwnerEvidenceReread: true
  directPeerDispatchPerformedByCaption: false
  runtimeOrProviderAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionQualificationJobOccurrenceEvidence {
  occurrenceId: string
  jobType: CaptionsSupportedJobType
  outputId: string
  sceneId: string | null
  boundaryId: string | null
  approvedWorkItemRef: SkillContractRef
  canonicalJobRef: SkillContractRef
  plannedManifestEntryRef: SkillContractRef
  adapterCompletionRef: SkillContractRef
  selectedArtifactRef: CaptionDomainRef
  artifactQaRef: CaptionDomainRef
  artifactReconciliationRef: CaptionDomainRef
  specialistExecutionReceiptRef: CaptionDomainRef
  currentCallResultPairRef: SkillContractRef
  supportResumeChainRef: SkillContractRef
  producedArtifactRefs: SkillArtifactRef[]
  ownerEvidence: CanonicalCaptionQualificationOwnerEvidence[]
  exactApprovedWorkJobManifestAndCostLineageReread: true
  exactArtifactBytesQaAndReconciliationReread: true
  exactCurrentSpecialistResultHeadReread: true
  resultDisposition: 'completed'
  planningOnly: true
  renderedMediaClaimedByPlanningJob: false
  finalQaClaimedByPlanningJob: false
  unresolvedBlockerCodes: []
}

/**
 * One exact approved Caption execution run. A normal edit contains only the
 * Caption jobs selected for its scenes, so terminal per-job qualification must
 * aggregate several such records rather than invent one all-purpose snapshot.
 */
export interface CanonicalCaptionQualificationRunEvidence {
  schemaVersion: typeof CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_VERSION
  recordId: string
  recordDigestSha256: string
  requestRef: CaptionDomainRef
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
  assetManifestRef: CaptionDomainRef
  estimateRef: CaptionDomainRef
  approvalRef: CaptionDomainRef
  creditReservationRef: CaptionDomainRef
  captionPlanningProjectionRef: CaptionDomainRef
  captionPrivateReviewProjectionRef: CaptionDomainRef
  privateReviewAssemblyRef: CaptionDomainRef
  outputEvidence: {
    outputId: string
    confirmedOutputFrameRef: CaptionDomainRef
    renderedArtifactRef: CaptionDomainRef
    deterministicQaRef: CaptionDomainRef
    qualifiedCompleteTimeVisualReviewRef: CaptionDomainRef
    independentFinalQaRef: CaptionDomainRef
    privateReviewDecisionRef: CaptionDomainRef
    actualCompleteTimeVisualReviewPassed: true
    independentFinalQaPassed: true
    privateReviewAccepted: true
  }
  jobOccurrences: CanonicalCaptionQualificationJobOccurrenceEvidence[]
  exactRequestScopePackageAndOutputSetBound: true
  exactApprovedSnapshotAndExecutionPackageReread: true
  exactAllProjectedCaptionJobsReread: true
  allProjectedCaptionJobsCompleted: true
  allProjectedCaptionArtifactsPersistedQaPassedAndReconciled: true
  actualRequiredOwnerEvidenceReread: true
  approvedCaptionRunEvidenceOnly: true
  terminalJobQualificationClaimed: false
  requiresMultiRunEvidenceCatalogForTerminalQualification: true
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  sourceFixtureRelabeledAsRuntimeEvidence: false
  syntheticEngineeringFixtureClaimedProfessionalAppearance: false
  directPeerDispatchPerformedByCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionQualificationRunEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_persisted_caption_qualification_run_evidence'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: {
    readonly request: unknown
  }): Promise<CanonicalCaptionQualificationRunEvidence | null>
}

export interface CanonicalCaptionQualificationRunEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_REPOSITORY_VERSION
  persistRecordCreateOnly(input: {
    readonly record: CanonicalCaptionQualificationRunEvidence
  }): Promise<'created' | 'identical_replay'>
  rereadRecord(input: {
    readonly requestRef: CaptionDomainRef
  }): Promise<CanonicalCaptionQualificationRunEvidence | null>
}

export interface CanonicalCaptionQualificationRunEvidenceAssembly {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_ASSEMBLY_VERSION
  readonly evidenceReadPort: CanonicalCaptionQualificationRunEvidenceReadPort
  readonly repository: CanonicalCaptionQualificationRunEvidenceRepository
  readonly exactSourceRereadBeforePersistence: true
  readonly createOnlyPersistenceAndExactReread: true
  readonly approvedCaptionRunEvidenceOnly: true
  readonly terminalJobQualificationClaimed: false
  readonly requiresMultiRunEvidenceCatalogForTerminalQualification: true
  readonly callerSuppliedEvidenceAccepted: false
  readonly browserLocalCompletionAccepted: false
  readonly directPeerDispatchPerformedByCaption: false
  readonly operationOrRuntimeAuthorityGrantedToCaption: false
  readonly providerOrModelAuthorityGrantedToCaption: false
  readonly assetMutationAuthorityGrantedToCaption: false
  readonly finalQaApprovalAuthorityGrantedToCaption: false
  readonly creditOrBillingAuthorityGrantedToCaption: false
  readonly publicDeliveryAuthorityGrantedToCaption: false
  readonly productionAuthorityGrantedToCaption: false
}
