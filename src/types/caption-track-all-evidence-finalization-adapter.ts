export const CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_VERSION =
  'caption-track-all-evidence-finalization-adapter-v1' as const

export interface CaptionTrackAllEvidenceFinalizationAdapterReceipt {
  schemaVersion:
    typeof CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_VERSION
  receiptId: string
  receiptDigestSha256: string
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/backend-workflow-pipeline-continuation'
    sourceCommit: string
    sourceTree: string
    publicTypeFileSha256: string
  }
  routeId: 'trackAll.sam31.captionEvidence.finalize'
  routePath:
    '/internal/v1/workspaces/:workspaceId/track-all/sam3_1/caption-evidence/finalize'
  requestVersion:
    'track-all-sam3_1-caption-evidence-finalization-request-v1'
  resultVersion:
    'track-all-sam3_1-caption-evidence-finalization-result-v1'
  evidenceRecordVersion:
    'canonical-caption-track-all-authenticated-evidence-record-v2'
  parserEntrypointId: 'parseCaptionTrackAllEvidenceFinalizationHandoff'
  exactRequestResultRecordAndProjectionLineageRequired: true
  byteFreeReferencesOnly: true
  backendImplementationImported: false
  directPeerDispatchAdded: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
