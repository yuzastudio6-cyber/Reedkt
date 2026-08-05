export const CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_VERSION =
  'caption-canonical-track-all-resume-admission-v2' as const

export interface CaptionCanonicalTrackAllResumeAdmissionReceipt {
  schemaVersion: typeof CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_VERSION
  receiptId: string
  receiptDigestSha256: string
  canonicalEvidenceRecordVersion:
    'canonical-caption-track-all-authenticated-evidence-record-v2'
  canonicalResumeRecordVersion: 'canonical-specialist-support-resume-record-v1'
  captionEntrypointId: 'runCaptionCanonicalTrackAllResumeAdmission'
  exactCallRequestProjectionArtifactAndResultReplayRequired: true
  exactTaskLevelSceneQaAuthorityRefRequired: true
  onlyCurrentTrackAllResultInjected: true
  priorOwnerResultsRemainCanonicalInputs: true
  runtimeResultMustMatchPersistedResultDigest: true
  sourceFixtureExercised: true
  actualBackendRecordPairConsumed: false
  directPeerDispatchAdded: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
