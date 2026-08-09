export const CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION =
  'caption-canonical-track-all-evidence-read-adapter-v2' as const
export const CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_V3_VERSION =
  'caption-canonical-track-all-evidence-read-adapter-v3' as const

export interface CaptionCanonicalTrackAllEvidenceReadAdapterReceipt {
  schemaVersion:
    typeof CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/backend-workflow-pipeline-continuation'
    sourceCommit: string
    sourceTree: string
    publicTypeFileSha256: string
    captionTrackAllPublicTypeFileSha256: string
  }
  consumedRecordVersion:
    'canonical-caption-track-all-authenticated-evidence-record-v2'
  captionParserEntrypointId:
    'parseCaptionCanonicalTrackAllEvidenceRecord'
  sourcePublicTypeCopiedByteForByte: true
  backendImplementationImported: false
  exactSupportPayloadRequestPacketAdmissionAndProjectionBindingRequired: true
  exactTaskLevelSceneQaAuthorityRefRequired: true
  exactCreateOnlyPersistenceRereadClaimsRequired: true
  sourceFixtureExercised: true
  actualCanonicalEvidenceRecordConsumed: false
  directPeerDispatchAdded: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

/**
 * Additive foreground-depth consumer receipt. The historical backend V2 read
 * receipt remains immutable; this receipt only admits the Caption-owned V2
 * request/packet/admission surface inside a V3 canonical owner envelope.
 */
export interface CaptionCanonicalTrackAllEvidenceReadAdapterReceiptV3 {
  schemaVersion:
    typeof CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_V3_VERSION
  adapterId: string
  adapterDigestSha256: string
  priorAdapterReceiptRef: {
    id: string
    version: typeof CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION
    contentHash: string
  }
  consumedRecordVersion:
    'canonical-caption-track-all-authenticated-evidence-record-v3'
  captionParserEntrypointId:
    'parseCaptionCanonicalTrackAllEvidenceRecordV3'
  frozenV2ReceiptPreserved: true
  frozenTrackAllV1WirePreserved: true
  foregroundPurposeRequiresCaptionTrackAllV2: true
  exactForegroundDepthAndAdmissionBindingRequired: true
  backendImplementationImported: false
  structuralSourceFixtureExercised: true
  actualCanonicalEvidenceRecordConsumed: false
  canonicalTrackAllProducerMounted: false
  canonicalTrackAllRuntimeRequiredForQualification: true
  directPeerDispatchAdded: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
