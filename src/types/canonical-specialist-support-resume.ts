import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
} from './orchestra-skill-contracts'

export const CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION =
  'canonical-authenticated-specialist-support-artifact-projection-v1' as const
export const CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION =
  'canonical-specialist-support-resume-record-v1' as const
export const CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION =
  'canonical-specialist-call-result-pair-v1' as const

export interface CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  schemaVersion:
    typeof CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  originalCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  ownerResultRef: SkillContractRef
  ownerKey: SkillSupportRequest['targetSkillKey']
  canonicalScope: SkillCanonicalScope
  artifactRefs: SkillArtifactRef[]
  authenticatedPrincipalVerified: true
  exactApprovedSnapshotReread: true
  exactCanonicalScopeReread: true
  exactOwnerResultReread: true
  ownerResultPersistedBeforeProjection: true
  browserLocalStateUsed: false
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false
  directPeerDispatchPerformed: false
  timelineMutationPerformed: false
  runtimeExecutionAuthorityGrantedToSpecialist: false
  assetMutationAuthorityGrantedToSpecialist: false
  costOrBillingAuthorityGrantedToSpecialist: false
  finalQaApprovalGrantedToSpecialist: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalSpecialistSupportResumeRecord {
  schemaVersion: typeof CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  stepOrdinal: number
  priorCall: OrchestraSkillCall
  priorResult: OrchestraSkillJobResult
  selectedSupportRequest: SkillSupportRequest
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
  resumedCall: OrchestraSkillCall
  resumedResult: OrchestraSkillJobResult
  promotedPriorSupportArtifactRefs: SkillArtifactRef[]
  persistedAt: string
  priorCallAndResultExactReread: true
  selectedRequestExactResultMember: true
  authenticatedOwnerProjectionExactReread: true
  onlyCurrentOwnerResultInjected: true
  priorOwnerResultsPromotedAsCanonicalInputs: true
  exactImmediateCallAndRequestLineage: true
  directPeerDispatchPerformed: false
  timelineMutationPerformed: false
  providerCallPerformedByResumeOwner: false
  runtimeExecutionPerformedByResumeOwner: false
  assetMutationPerformedByResumeOwner: false
  costOrBillingMutationPerformedByResumeOwner: false
  finalQaApprovalGrantedByResumeOwner: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalSpecialistCallResultPair {
  schemaVersion: typeof CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION
  pairId: string
  pairDigestSha256: string
  call: OrchestraSkillCall
  result: OrchestraSkillJobResult
  persistedAt: string
  exactCallResultScopeManifestQualificationAndReplayBinding: true
  directPeerDispatchPerformed: false
  providerCallPerformedByRepository: false
  runtimeExecutionPerformedByRepository: false
  assetMutationPerformedByRepository: false
  costOrBillingMutationPerformedByRepository: false
  finalQaApprovalGrantedByRepository: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
