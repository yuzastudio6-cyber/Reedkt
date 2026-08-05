export const CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_VERSION =
  'caption-canonical-visual-intelligence-resume-admission-v1' as const

export interface CaptionCanonicalVisualIntelligenceResumeAdmissionReceipt {
  schemaVersion:
    typeof CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_VERSION
  receiptId: string
  receiptDigestSha256: string
  canonicalEvidenceRecordVersion:
    'canonical-caption-visual-intelligence-authenticated-evidence-record-v1'
  canonicalResumeRecordVersion:
    'canonical-specialist-support-resume-record-v1'
  captionEntrypointId:
    'runCaptionCanonicalVisualIntelligenceResumeAdmission'
  exactCallRequestProjectionArtifactAndResultReplayRequired: true
  onlyCurrentVisualIntelligenceResultInjected: true
  priorOwnerResultsRemainCanonicalInputs: true
  runtimeResultMustMatchPersistedResultDigest: true
  sourceFixtureExercised: true
  actualBackendRecordPairConsumed: false
  directPeerDispatchAdded: false
  providerCallAuthorityGranted: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
