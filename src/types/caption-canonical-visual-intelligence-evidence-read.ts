export const CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_ADAPTER_VERSION =
  'caption-canonical-visual-intelligence-evidence-read-adapter-v1' as const

export interface CaptionCanonicalVisualIntelligenceEvidenceReadAdapterReceipt {
  schemaVersion:
    typeof CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/backend-workflow-pipeline-continuation'
    sourceCommit: string
    sourceTree: string
    publicTypeFileSha256: string
  }
  consumedRecordVersion:
    'canonical-caption-visual-intelligence-authenticated-evidence-record-v1'
  captionParserEntrypointId:
    'parseCaptionCanonicalVisualIntelligenceEvidenceRecord'
  sourcePublicTypeCopiedByteForByte: true
  backendImplementationImported: false
  exactSupportPayloadRequestPacketAndProjectionBindingRequired: true
  exactCreateOnlyPersistenceRereadClaimsRequired: true
  semanticGeometryDoesNotAuthorizeFinalPlacement: true
  actualCanonicalEvidenceRecordConsumed: false
  directPeerDispatchAdded: false
  providerCallAuthorityGranted: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
