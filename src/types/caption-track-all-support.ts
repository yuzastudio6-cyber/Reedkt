import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { SkillContractRef, SkillSupportRequest } from './orchestra-skill-contracts'

export const CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION =
  'caption-track-all-support-payload-v1' as const
export const CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION =
  'caption-track-all-evidence-packet-v1' as const
export const CAPTION_TRACK_ALL_ADMISSION_VERSION =
  'caption-track-all-admission-v1' as const

export type CaptionTrackAllPurpose =
  | 'subject_occlusion'
  | 'object_anchor'
  | 'environmental_anchor'

export interface CaptionTrackAllSupportPayload {
  schemaVersion: typeof CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION
  payloadId: string
  payloadDigestSha256: string
  purpose: CaptionTrackAllPurpose
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  visualOccupancyManifestRef: CaptionDomainRef
  confirmedOutputFrameDigestSha256: string
  sourcePrivateArtifactRef: CaptionDomainRef
  sourceFrameMappingRef: CaptionDomainRef
  requestedSceneId: string
  requestedRange: CaptionDomainFrameRange
  subjectRequests: Array<{
    subjectRequestId: string
    subjectRole:
      | 'primary_speaker'
      | 'secondary_speaker'
      | 'hand'
      | 'product'
      | 'important_object'
      | 'environmental_surface'
    visualObservationRefs: CaptionDomainRef[]
    sourcePhraseRefs: CaptionDomainRef[]
    maskRequired: boolean
    trackRequired: true
    anchorRequired: boolean
    preserveHairAndFineEdges: boolean
    preserveContactObjects: boolean
  }>
  depthIntent:
    | 'behind_subject'
    | 'in_front_of_subject'
    | 'object_attached'
    | 'environmental_surface'
  qaThresholds: {
    minimumBinaryIntersectionOverUnionBasisPoints: number
    maximumNormalizedCentroidShiftBasisPoints: number
    maximumBoundaryDisagreementBasisPoints: number
    maximumAlphaFlickerBasisPoints: number
    minimumEdgeQualityBasisPoints: number
    minimumSubjectCoverageBasisPoints: number
    emptyMaskFrameCountAllowed: 0
    fullFrameMaskCountAllowed: 0
    identitySwapCountAllowed: 0
    lostAnchorFrameCountAllowed: 0
  }
  refinementPolicy: {
    opencvMaskQaRequired: true
    korniaRefinementAllowed: boolean
    korniaCannotReplacePrimarySegmentation: true
    deterministicOperations: Array<
      | 'morphological_cleanup'
      | 'hole_fill'
      | 'edge_feather_measurement'
      | 'temporal_median_check'
      | 'connected_component_filter'
    >
  }
  cachePolicy: {
    cacheIdentityDigestSha256: string
    exactSourceRangeSubjectFrameAndPolicyBound: true
    crossSceneReuseAllowed: false
    crossOutputReuseAllowed: false
    staleReuseAllowed: false
  }
  fallbackLadder: [
    'retry_track_all_same_approved_input',
    'opencv_kornia_refine',
    'safe_top_plane',
    'stable_libass',
    'user_review',
  ]
  expectedArtifactTypes: Array<'mask_sequence' | 'track_manifest' | 'anchor_manifest'>
  byteFreeRequest: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  modelPromptIncluded: false
  providerCredentialIncluded: false
  samRuntimeSelectedOrDispatchedByCaption: false
  directPeerDispatchRequested: false
  trackAllRemainsArtifactOwner: true
}

export interface CaptionTrackAllSubjectEvidence {
  subjectRequestId: string
  subjectEvidenceId: string
  subjectRole: CaptionTrackAllSupportPayload['subjectRequests'][number]['subjectRole']
  frameRange: CaptionDomainFrameRange
  maskSequenceRef: CaptionDomainRef | null
  trackManifestRef: CaptionDomainRef
  anchorManifestRef: CaptionDomainRef | null
  sourceFrameMappingRef: CaptionDomainRef
  outputFrameDigestSha256: string
  temporalQa: {
    measuredFrameCount: number
    expectedFrameCount: number
    emptyMaskFrameCount: number
    fullFrameMaskCount: number
    minimumBinaryIntersectionOverUnionBasisPoints: number
    maximumNormalizedCentroidShiftBasisPoints: number
    maximumBoundaryDisagreementBasisPoints: number
    maximumAlphaFlickerBasisPoints: number
    minimumEdgeQualityBasisPoints: number
    minimumSubjectCoverageBasisPoints: number
    identitySwapCount: number
    lostAnchorFrameCount: number
    completeRequestedRangeCoverage: boolean
  }
  refinementEvidence: Array<{
    refinementId: string
    tool: 'opencv' | 'kornia'
    operation: CaptionTrackAllSupportPayload['refinementPolicy']['deterministicOperations'][number]
    inputArtifactRef: CaptionDomainRef
    outputArtifactRef: CaptionDomainRef
    executionEvidenceRef: CaptionDomainRef
    actualExecutionObserved: boolean
  }>
  evidenceRefs: CaptionDomainRef[]
}

export interface CaptionTrackAllEvidencePacket {
  schemaVersion: typeof CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION
  packetId: string
  packetDigestSha256: string
  supportRequestRef: SkillContractRef
  supportPayloadRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  purpose: CaptionTrackAllPurpose
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  visualOccupancyManifestRef: CaptionDomainRef
  sourcePrivateArtifactRef: CaptionDomainRef
  sourceFrameMappingRef: CaptionDomainRef
  confirmedOutputFrameDigestSha256: string
  requestedSceneId: string
  requestedRange: CaptionDomainFrameRange
  producerSkillKey: 'track_all'
  selectedSegmentationRoute: 'sam3_1'
  canonicalSam31OperationId: 'tool.sam3_1.segment_and_track_subject.v1'
  trackAllResultRef: CaptionDomainRef
  authenticatedReadResultRef: CaptionDomainRef | null
  canonicalSam31RuntimeResultAdmissionRef: CaptionDomainRef | null
  subjectEvidence: CaptionTrackAllSubjectEvidence[]
  cache: {
    cacheIdentityDigestSha256: string
    disposition: 'new_result' | 'exact_cache_reuse'
    originalResultRef: CaptionDomainRef | null
    exactSourceRangeSubjectFrameAndPolicyMatch: boolean
    staleArtifactReused: false
  }
  evidenceMode: 'contract_fixture' | 'authenticated_private_runtime'
  exactCanonicalScopeReread: boolean
  exactPrivateArtifactsReread: boolean
  exactSam31ResultLineageVerified: boolean
  actualSam31GpuExecutionObserved: boolean
  actualOpenCvExecutionObserved: boolean
  actualKorniaExecutionObserved: boolean
  independentMaskArtifactQaCompleted: boolean
  privateVisualReviewCompleted: boolean
  browserLocalStateUsed: false
  rawMaskBytesIncluded: false
  pathsOrUrlsIncluded: false
  providerCredentialIncluded: false
  runtimeOrDispatchAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionTrackAllAdmission {
  schemaVersion: typeof CAPTION_TRACK_ALL_ADMISSION_VERSION
  admissionId: string
  admissionDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  supportRequestRef: SkillContractRef
  evidencePacketRef: CaptionDomainRef
  requestedSceneId: string
  subjectAdmissions: Array<{
    subjectRequestId: string
    subjectEvidenceId: string
    qaPassed: boolean
    maskSequenceRef: CaptionDomainRef | null
    trackManifestRef: CaptionDomainRef
    anchorManifestRef: CaptionDomainRef | null
    blockerCodes: string[]
  }>
  disposition:
    | 'admitted_for_caption_scene_graph'
    | 'blocked_private_runtime_evidence'
    | 'blocked_temporal_qa'
  textBehindSubjectAllowed: boolean
  objectAnchorAllowed: boolean
  selectedFallback: 'none' | 'safe_top_plane' | 'stable_libass' | 'user_review'
  cacheReuseAccepted: boolean
  trackAllRemainsArtifactOwner: true
  sam31RemainsCanonicalRuntimeOwner: true
  captionExecutedSam31: false
  captionSelectedGpuRoute: false
  captionCreatedMaskAsset: false
  captionGrantedFinalQa: false
  finalCanvasAuthorityClaimed: false
  productionAuthorityClaimed: false
}

export interface CaptionTrackAllSupportBundle {
  payload: CaptionTrackAllSupportPayload
  supportRequest: SkillSupportRequest
}
