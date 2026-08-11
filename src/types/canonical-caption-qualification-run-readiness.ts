import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_QUALIFICATION_RUN_READINESS_VERSION =
  'canonical-caption-qualification-run-readiness-v1' as const
export const CANONICAL_CAPTION_QUALIFICATION_RUN_READINESS_SERVICE_VERSION =
  'canonical-caption-qualification-run-readiness-service-v1' as const

export const CANONICAL_CAPTION_QUALIFICATION_RUN_BLOCKER_CODES = [
  'caption_planning_projection_or_binding_missing',
  'postrender_visual_intelligence_evidence_repository_missing',
  'postrender_visual_intelligence_evidence_missing',
  'caption_private_review_projection_missing',
  'caption_private_review_not_terminal_eligible',
  'caption_direct_visual_inspection_missing',
  'approved_source_media_binding_missing',
  'private_artifact_qa_aggregate_missing',
  'caption_job_adapter_completion_missing',
  'caption_artifact_qa_selection_missing',
  'current_specialist_call_result_pair_missing',
  'specialist_support_resume_chain_incomplete',
  'canonical_transcript_authenticated_read_missing',
  'visual_intelligence_authenticated_evidence_missing',
  'track_all_authenticated_evidence_missing',
  'soundsync_authenticated_evidence_missing',
  'broll_authenticated_evidence_missing',
  'private_job_dependency_not_ready',
] as const

export type CanonicalCaptionQualificationRunBlockerCode =
  typeof CANONICAL_CAPTION_QUALIFICATION_RUN_BLOCKER_CODES[number]

export interface CanonicalCaptionQualificationRunReadiness {
  schemaVersion:
    typeof CANONICAL_CAPTION_QUALIFICATION_RUN_READINESS_VERSION
  readinessId: string
  readinessDigestSha256: string
  requestRef: CaptionDomainRef
  disposition:
    | 'blocked_missing_canonical_evidence'
    | 'ready_for_create_only_run_evidence_persistence'
  firstBlockerCode: CanonicalCaptionQualificationRunBlockerCode | null
  runEvidenceRef: CaptionDomainRef | null
  canonicalRunEvidenceReadAttempted: true
  allRequiredCanonicalEvidenceReread: boolean
  firstMissingEvidenceReportedWithoutCallerSubstitution: true
  readinessOnlyNoQualificationClaim: true
  qualificationRecordCreated: false
  terminalStatusClaimed: false
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  sourceFixtureRelabeledAsRuntimeEvidence: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionQualificationRunReadinessService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_QUALIFICATION_RUN_READINESS_SERVICE_VERSION
  readonly exactApprovedRunSourcesReread: true
  readonly callerSuppliedEvidenceAccepted: false
  readonly qualificationOrAuthorityPromotionAllowed: false
  inspectExact(input: {
    readonly request: unknown
  }): Promise<CanonicalCaptionQualificationRunReadiness>
}
