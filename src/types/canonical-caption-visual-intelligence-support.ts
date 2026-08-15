import type {
  CaptionVisualIntelligenceEvidencePacket,
  CaptionVisualIntelligenceSupportPayload,
} from './caption-visual-intelligence-support'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
} from './canonical-specialist-support-resume'
import type {
  SkillContractRef,
  SkillSupportRequest,
} from './orchestra-skill-contracts'
import type {
  VisualIntelligenceEvidenceRef,
} from './visual-intelligence'

export const CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION =
  'canonical-caption-visual-intelligence-authenticated-evidence-record-v1' as const

/**
 * Backend-owned immutable bridge from one exact Caption support request to one
 * exact Visual Intelligence request/report/spatial-evidence tuple. Caption
 * validates and consumes the projected packet; it does not dispatch Gemini or
 * become an evidence, runtime, billing, or QA owner.
 */
export interface CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  originalCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  supportRequest: SkillSupportRequest
  supportPayload: CaptionVisualIntelligenceSupportPayload
  visualIntelligenceRequestRef: VisualIntelligenceEvidenceRef
  visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  visualIntelligenceSpatialEvidenceRef: VisualIntelligenceEvidenceRef
  authenticatedReadResultRef: SkillContractRef
  captionEvidencePacket: CaptionVisualIntelligenceEvidencePacket
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
  authenticatedPrincipalVerified: true
  priorCallAndSupportRequestExactReread: true
  canonicalVisualIntelligenceRequestExactReread: true
  immutableReportExactReread: true
  immutableSpatialEvidenceExactReread: true
  exactCaptionScopeOutputSceneRangeAndArtifactBindingVerified: true
  exactExpectedOutcomeLineageVerified: true
  exactRequiredObservationRoleCoverageVerified: true
  ownerProjectionCreateOnlyPersisted: true
  evidenceRecordCreateOnlyPersisted: true
  browserLocalStateUsed: false
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false
  directPeerDispatchPerformed: false
  providerCallPerformedByBridge: false
  timelineMutationPerformed: false
  runtimeExecutionAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  costOrBillingAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
