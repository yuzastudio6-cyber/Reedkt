import type {
  CaptionTrackAllAdmission,
  CaptionTrackAllEvidencePacket,
  CaptionTrackAllSubjectEvidence,
  CaptionTrackAllSupportPayload,
} from './caption-track-all-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
} from './canonical-specialist-support-resume'
import type {
  SkillContractRef,
  SkillSupportRequest,
} from './orchestra-skill-contracts'

export const CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_VERSION =
  'canonical-track-all-sam3_1-caption-scene-evidence-v1' as const
export const CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION =
  'canonical-caption-track-all-authenticated-evidence-record-v2' as const

/**
 * Immutable task-level evidence emitted by the Track All owner after the
 * create-only SAM 3.1 result, deterministic mask measurements, and independent
 * private review have all been reread. It grants no Caption or final-QA
 * authority and contains no mask/media bytes or locators.
 */
export interface CanonicalTrackAllSam31CaptionSceneEvidence {
  schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  invocationId: string
  taskRef: CaptionDomainRef
  runtimeResultAdmissionRef: CaptionDomainRef
  trackAllResultRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  sourcePrivateArtifactRef: CaptionDomainRef
  sourceFrameMappingRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  requestedRange: CaptionDomainFrameRange
  subjectEvidence: CaptionTrackAllSubjectEvidence[]
  independentMaskArtifactQaRef: CaptionDomainRef
  privateVisualReviewRef: CaptionDomainRef
  cache: {
    cacheIdentityDigestSha256: string
    disposition: 'new_result' | 'exact_cache_reuse'
    originalResultRef: CaptionDomainRef | null
    exactSourceRangeSubjectFrameAndPolicyMatch: true
    staleArtifactReused: false
  }
  exactTaskResultAndPrivateArtifactReread: true
  exactApprovedSnapshotOutputSceneRangeAndSourceBindingVerified: true
  actualSam31GpuExecutionObserved: true
  actualOpenCvExecutionObserved: true
  actualKorniaExecutionObserved: boolean
  independentMaskArtifactQaCompleted: true
  privateVisualReviewCompleted: true
  completeRequestedRangeCoverageVerified: true
  browserOrCallerQaClaimsAccepted: false
  rawMaskMediaBytesPathsUrlsOrCredentialsIncluded: false
  customerCreditsMutated: false
  qaApprovalGranted: false
  assetManifestMutated: false
  renderAuthorized: false
  publicDeliveryAuthorized: false
  productionAuthorityGranted: false
  recordedAt: string
}

/**
 * Backend-owned bridge from one frozen Caption support request to one exact
 * Track All/SAM 3.1 task/result/scene-QA tuple. The embedded Caption packet and
 * admission are projections; the Track All owner retains all runtime and asset
 * ownership.
 */
export interface CanonicalCaptionTrackAllAuthenticatedEvidenceRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  originalCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  supportRequest: SkillSupportRequest
  supportPayload: CaptionTrackAllSupportPayload
  backendTrackAllCallRef: CaptionDomainRef
  backendTrackAllSupportRequestRef: CaptionDomainRef
  sam31TaskRef: CaptionDomainRef
  sam31RuntimeResultAdmissionRef: CaptionDomainRef
  trackAllSceneQaAuthorityRef: CaptionDomainRef
  trackAllSceneEvidenceRef: CaptionDomainRef
  captionEvidencePacket: CaptionTrackAllEvidencePacket
  captionAdmission: CaptionTrackAllAdmission
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
  authenticatedPrincipalVerified: true
  priorCallAndSupportRequestExactReread: true
  backendTrackAllCallAndSupportRequestExactReread: true
  distinctCaptionAndBackendSupportWireIdentitiesPreserved: true
  sam31TaskAndResultExactReread: true
  taskLevelSceneQaAuthorityExactReread: true
  independentSceneEvidenceExactReread: true
  exactCaptionScopeOutputSceneRangeSourceAndFrameBindingVerified: true
  ownerProjectionCreateOnlyPersisted: true
  evidenceRecordCreateOnlyPersisted: true
  browserLocalStateUsed: false
  rawMaskMediaBytesPathsUrlsOrCredentialsAccepted: false
  directPeerDispatchPerformed: false
  runtimeExecutionPerformedByBridge: false
  timelineMutationPerformed: false
  runtimeExecutionAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  costOrBillingAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
