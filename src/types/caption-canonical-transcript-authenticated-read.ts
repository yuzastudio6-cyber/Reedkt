import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionCanonicalTranscript } from './caption-transcript-lineage'

export const CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION =
  'caption-canonical-transcript-authenticated-read-binding-v1' as const
export const CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_VERSION =
  'caption-canonical-transcript-authenticated-read-adapter-v1' as const

export interface CaptionCanonicalTranscriptReadScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: CaptionDomainRef
}

export interface CaptionCanonicalTranscriptAuthenticatedReadBinding {
  schemaVersion:
    typeof CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  ownerKey: 'canonical_transcript'
  consumerSkillKey: 'captions'
  artifactType: 'canonical_transcript'
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  canonicalTranscriptRef: CaptionDomainRef
  sourceSpeechEvidencePackageRef: CaptionDomainRef
  alignmentQualificationRef: CaptionDomainRef
  diarizationArtifactRefs: CaptionDomainRef[]
  speakerDiarizationState: 'not_present' | 'complete'
  persistenceReadReceiptRef: CaptionDomainRef
  authenticatedOwnerEvidenceRef: CaptionDomainRef
  exactPrivateArtifactRereadVerified: true
  exactTranscriptDigestRecomputed: true
  exactTenantScopeVerified: true
  exactApprovedSnapshotVerified: true
  exactSourceAndAlignmentLineageVerified: true
  exactDiarizationLineageVerified: true
  immutableTranscriptVerified: true
  singleCanonicalTranscriptVerified: true
  privateArtifact: true
  byteFreeBinding: true
  canonicalTranscriptPayloadEmbedded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  rawChatIncluded: false
  credentialsIncluded: false
  browserLocalCompletionAccepted: false
  transcriptMutationAuthorityGranted: false
  timingAuthorityGranted: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt {
  schemaVersion:
    typeof CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  transcriptContractVersion: CaptionCanonicalTranscript['schemaVersion']
  bindingContractVersion:
    CaptionCanonicalTranscriptAuthenticatedReadBinding['schemaVersion']
  captionParserEntrypointId: 'parseCaptionCanonicalTranscript'
  authenticatedReadParserEntrypointId:
    'parseCaptionCanonicalTranscriptAuthenticatedReadBinding'
  admissionEntrypointId:
    'admitCaptionCanonicalTranscriptFromAuthenticatedRead'
  initialCallArtifactType: 'canonical_transcript'
  authenticatedReadEvidenceArtifactType:
    'canonical_transcript_authenticated_read_binding'
  initialCallPrerequisite: true
  directPeerDispatchAllowed: false
  transcriptOwnerImplementedByCaption: false
  persistenceReaderImplementedByCaption: false
  authenticatedPrivateResultIntegrated: false
  browserLocalCompletionAccepted: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
