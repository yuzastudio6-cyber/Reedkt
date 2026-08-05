export const CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION =
  'caption-canonical-track-all-evidence-read-adapter-v2' as const

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
