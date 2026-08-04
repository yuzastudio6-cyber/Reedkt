import type { ISODateString } from '../shared'
import type { MotionStudioAudioFrameRange } from './audio'
import type {
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'

export const MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION =
  'motion-studio.audio-selection-manifest.v1' as const
export const MOTION_STUDIO_NARRATION_ASSEMBLY_MANIFEST_VERSION =
  'motion-studio.narration-assembly-manifest.v1' as const
export const MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION =
  'motion-studio.narration-assembly-artifact.v1' as const
export const MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION =
  'motion-studio.narration-assembly-quality-report.v1' as const
export const MOTION_STUDIO_INTEGRATED_MIX_REQUEST_VERSION =
  'motion-studio.integrated-audio-mix-request.v1' as const
export const MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION =
  'motion-studio.integrated-audio-mix-artifact.v1' as const
export const MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION =
  'motion-studio.integrated-audio-mix-quality-report.v1' as const
export const MOTION_STUDIO_AUDIO_ACCEPTANCE_RECORD_VERSION =
  'motion-studio.audio-acceptance-record.v1' as const
export const MOTION_STUDIO_AUDIO_INVALIDATION_RECORD_VERSION =
  'motion-studio.audio-invalidation-record.v1' as const
export const MOTION_STUDIO_AUDIO_ACCEPTANCE_CHAIN_VERSION =
  'motion-studio.audio-acceptance-chain.v1' as const

export const MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES = Object.freeze([
  'manifest_integrity',
  'source_asset_integrity',
  'segment_order_coverage',
  'frame_sample_clock',
  'alignment',
  'pronunciation_voice_continuity',
  'silence_gap_overlap',
  'media_decode',
  'loudness_clipping',
  'private_readback_identity',
] as const)

export type MotionStudioNarrationAssemblyQaGate =
  typeof MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES[number]

export const MOTION_STUDIO_INTEGRATED_MIX_QA_GATES = Object.freeze([
  'input_manifest_integrity',
  'narration_assembly_integrity',
  'output_media_integrity',
  'duration_sample_clock',
  'narration_completeness_alignment',
  'pronunciation_voice_continuity',
  'speech_intelligibility_ducking',
  'foley_ambience_sync_scope',
  'exact_sfx_timing_rights',
  'loudness_true_peak',
  'clipping_silence_contamination',
  'rights_consent_disclosure_provenance',
  'picture_timing_compatibility',
  'private_readback_identity',
] as const)

export type MotionStudioIntegratedMixQaGate =
  typeof MOTION_STUDIO_INTEGRATED_MIX_QA_GATES[number]

export type MotionStudioSelectableAudioOrigin =
  | 'verified_uploaded_narration'
  | 'provider_generated_speech'
  | 'verified_uploaded_music'
  | 'verified_uploaded_stem'
  | 'provider_generated_music'
  | 'provider_synchronized_foley'
  | 'licensed_or_user_owned_exact_sfx'

export type MotionStudioOptionalAudioRole =
  | 'music'
  | 'foley'
  | 'ambience'
  | 'exact_sfx'

export interface MotionStudioAudioEvidenceReferenceV1 {
  evidenceId: string
  evidenceDigest: string
  evidenceKind:
    | 'approved_dependency'
    | 'candidate'
    | 'candidate_review'
    | 'objective_qa'
    | 'alignment'
    | 'rights'
    | 'consent'
    | 'disclosure'
    | 'provenance'
    | 'cost'
    | 'private_readback'
  immutable: true
}

export interface MotionStudioAudioDependencyAcceptanceV1 {
  milestone: 'MS-012C' | 'MS-012D'
  verdict: 'accepted'
  acceptedCommitSha: string
  acceptedTreeSha: string
  acceptanceEvidenceDigest: string
}

export interface MotionStudioPrivateAudioAssetVersionV1 {
  assetId: string
  assetVersionId: string
  contentDigest: string
  checksumSha256: string
  byteLength: number
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 1 | 2
  sampleCountPerChannel: number
  durationMilliseconds: number
  privateAsset: true
  createOnly: true
  checksumVerified: true
  privateReadbackVerified: true
  providerUrlPersisted: false
  localPathProjected: false
}

export interface MotionStudioAudioCandidateAuthorityV1 {
  candidateId: string
  origin: MotionStudioSelectableAudioOrigin
  evidenceClass:
    | 'verified_private_upload'
    | 'persisted_private_provider_c3_readback'
    | 'canonical_backend_verified_provider_candidate'
  candidateEvidence: MotionStudioAudioEvidenceReferenceV1
  reviewEvidence: MotionStudioAudioEvidenceReferenceV1
  qaEvidence: MotionStudioAudioEvidenceReferenceV1
  rightsEvidence: readonly MotionStudioAudioEvidenceReferenceV1[]
  consentEvidence: readonly MotionStudioAudioEvidenceReferenceV1[]
  disclosureEvidence: readonly MotionStudioAudioEvidenceReferenceV1[]
  provenanceEvidence: readonly MotionStudioAudioEvidenceReferenceV1[]
  costEvidence: MotionStudioAudioEvidenceReferenceV1
  reviewDecision: 'pass_for_selection_review'
  providerOutcome: 'not_applicable_verified_upload' | 'completed_reconciled'
  fixtureOrSynthetic: false
  stale: false
  unknownOutcome: false
  selectionEligible: true
  immutable: true
}

export interface MotionStudioAudioCostLineageItemV1 {
  costEvidenceId: string
  costEvidenceDigest: string
  candidateId: string
  currency: 'USD'
  inheritedInternalCostMicros: number
  providerCostIncluded: boolean
  workerInfrastructureCostIncluded: boolean
  failedAttemptCostRetained: true
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
}

export interface MotionStudioAudioSourceSampleRangeV1 {
  startSampleInclusive: number
  endSampleExclusive: number
}

export interface MotionStudioAudioDestinationRangeV1 {
  frameRange: MotionStudioAudioFrameRange
  startSampleInclusive: number
  endSampleExclusive: number
}

export interface MotionStudioSelectedNarrationTakeV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.selected-narration-take.v1'
  moduleId: 'storytelling'
  productionId: string
  selectedNarrationId: string
  voiceSegmentId: string
  preparedScriptSegmentId: string
  selectedTakeId: string
  candidateTakeIds: readonly string[]
  voiceBibleArtifactVersion: MotionStudioVersionReference
  spokenTextDigest: string
  pronunciationAuthorityDigest: string
  performanceAuthorityDigest: string
  assetVersion: MotionStudioPrivateAudioAssetVersionV1
  sourceSampleRange: MotionStudioAudioSourceSampleRangeV1
  destination: MotionStudioAudioDestinationRangeV1
  alignmentEvidence: MotionStudioAudioEvidenceReferenceV1
  candidateAuthority: MotionStudioAudioCandidateAuthorityV1
  selectionMethod: 'explicit_human_review'
  firstOrOnlyTakeAutoSelected: false
  selectedByActorId: string
  selectedAt: ISODateString
  decisionReason: string
  immutable: true
}

export interface MotionStudioSelectedAudioStemV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.selected-audio-stem.v1'
  moduleId: 'storytelling'
  productionId: string
  selectedStemId: string
  role: MotionStudioOptionalAudioRole
  stemId: string
  candidateId: string
  assetVersion: MotionStudioPrivateAudioAssetVersionV1
  placement: MotionStudioAudioDestinationRangeV1
  cueAuthorityIds: readonly string[]
  soundEventAuthorityIds: readonly string[]
  trimAuthorityDigest: string
  gainAndDuckingAuthorityDigest: string
  candidateAuthority: MotionStudioAudioCandidateAuthorityV1
  selectionMethod: 'explicit_human_review'
  autoSelected: false
  selectedByActorId: string
  selectedAt: ISODateString
  decisionReason: string
  immutable: true
}

export type MotionStudioOptionalAudioRoleDecisionV1 =
  | {
      role: MotionStudioOptionalAudioRole
      decision: 'selected'
      selections: readonly MotionStudioSelectedAudioStemV1[]
      decisionEvidenceId: string
      decidedByActorId: string
      decidedAt: ISODateString
      reason: string
    }
  | {
      role: MotionStudioOptionalAudioRole
      decision: 'not_selected' | 'not_needed'
      selections: readonly never[]
      decisionEvidenceId: string
      decidedByActorId: string
      decidedAt: ISODateString
      reason: string
    }

export interface MotionStudioAudioSelectionManifestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION
  moduleId: 'storytelling'
  productionId: string
  selectionManifestId: string
  selectionManifestVersion: number
  supersedesSelectionManifestId?: string
  dependencyAcceptance: readonly MotionStudioAudioDependencyAcceptanceV1[]
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedPlanReviewId: string
  approvedCreditEstimateId: string
  activeNoncommercialTestReservationId: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  musicBibleArtifactVersion: MotionStudioVersionReference
  pictureLockArtifactVersion: MotionStudioVersionReference
  timingAuthority: MotionStudioTimingAuthority
  approvedVoiceSegmentIds: readonly string[]
  selectedNarration: readonly MotionStudioSelectedNarrationTakeV1[]
  optionalRoleDecisions: readonly MotionStudioOptionalAudioRoleDecisionV1[]
  musicCueAuthorityIds: readonly string[]
  soundEventAuthorityIds: readonly string[]
  costLineage: readonly MotionStudioAudioCostLineageItemV1[]
  inheritedInternalCostMicros: number
  incrementalSelectionCostMicros: 0
  totalInternalCostMicros: number
  currency: 'USD'
  selectionMethod: 'explicit_human_review'
  firstOrOnlyTakeAutoSelected: false
  mixEligible: true
  mixEligibilityDerivedBy: 'motion_studio_audio_selection_compiler_v1'
  selectedByActorId: string
  selectedAt: ISODateString
  decisionReason: string
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
  timelineMutationAllowed: false
  renderAllowed: false
  exportAllowed: false
  productReady: false
  immutable: true
}

export interface MotionStudioNarrationAssemblySegmentV1 {
  order: number
  selectedNarrationId: string
  voiceSegmentId: string
  selectedTakeId: string
  sourceAssetVersionId: string
  sourceChecksumSha256: string
  sourceSampleRange: MotionStudioAudioSourceSampleRangeV1
  destination: MotionStudioAudioDestinationRangeV1
  spokenTextDigest: string
  alignmentEvidenceId: string
  alignmentEvidenceDigest: string
}

export interface MotionStudioNarrationAssemblyManifestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_NARRATION_ASSEMBLY_MANIFEST_VERSION
  moduleId: 'storytelling'
  productionId: string
  narrationAssemblyManifestId: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  timingAuthority: MotionStudioTimingAuthority
  profileId: 'motion_studio_storytelling_narration_assembly_v1'
  profileDigest: string
  sampleRateHertz: 48_000
  channelCount: 1
  codec: 'pcm_s16le'
  durationFrames: number
  sampleCountPerChannel: number
  segments: readonly MotionStudioNarrationAssemblySegmentV1[]
  preserveApprovedSilence: true
  timeScaleAllowed: false
  hiddenCrossfadeAllowed: false
  overlappingNarrationAllowed: false
  callerProvidedFfmpegArgumentsAllowed: false
  immutable: true
}

export interface MotionStudioNarrationAssemblyArtifactV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION
  moduleId: 'storytelling'
  productionId: string
  artifactId: string
  artifactVersionId: string
  narrationAssemblyManifestId: string
  narrationAssemblyManifestDigest: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  executionAttemptId: string
  profileId: 'motion_studio_storytelling_narration_assembly_v1'
  profileDigest: string
  segmentMapDigest: string
  contentDigest: string
  checksumSha256: string
  byteLength: number
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 1
  sampleCountPerChannel: number
  durationFrames: number
  frameRate: number
  timingAuthorityDigest: string
  privateAsset: true
  createOnly: true
  checksumVerified: true
  privateReadbackVerified: true
  providerUrlPersisted: false
  localPathProjected: false
  qaStatus: 'pending_independent_qa'
  integratedMixInputEligible: false
  timelineReady: false
  renderReady: false
  exportReady: false
  productReady: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioNarrationAssemblyQaGateResultV1 {
  gate: MotionStudioNarrationAssemblyQaGate
  result: 'passed' | 'failed' | 'not_run'
  blocking: true
  evidenceId?: string
  evidenceDigest?: string
  note: string
}

export interface MotionStudioNarrationAssemblyQualityReportV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION
  moduleId: 'storytelling'
  productionId: string
  qualityReportId: string
  narrationAssemblyManifestId: string
  narrationAssemblyManifestDigest: string
  narrationAssemblyArtifactId: string
  narrationAssemblyArtifactVersionId: string
  narrationAssemblyChecksumSha256: string
  selectionManifestId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  timingAuthorityDigest: string
  gateResults: readonly MotionStudioNarrationAssemblyQaGateResultV1[]
  allBlockingGatesPassed: boolean
  integratedMixInputEligible: boolean
  manualOverrideAllowed: false
  timelineReady: false
  renderReady: false
  exportReady: false
  productReady: false
  reviewedAt: ISODateString
  immutable: true
}

export interface MotionStudioAudioExecutionAuthorityV1 {
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedPlanReviewId: string
  approvedCreditEstimateId: string
  activeNoncommercialTestReservationId: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  idempotencyKeyHash: string
  costBudgetId: string
  maximumAuthorizedInternalCostMicros: number
  currency: 'USD'
  maximumAttempts: 1
  automaticRetry: false
  automaticFallback: false
  automaticSubstitution: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationAllowed: false
  billingMutationAllowed: false
}

export interface MotionStudioIntegratedMixInputV1 {
  role: 'narration' | MotionStudioOptionalAudioRole
  sourceKind: 'narration_assembly' | 'selected_stem'
  sourceId: string
  assetVersionId: string
  checksumSha256: string
  placement: MotionStudioAudioDestinationRangeV1
  cueAuthorityIds: readonly string[]
  soundEventAuthorityIds: readonly string[]
  rightsEvidenceIds: readonly string[]
}

export interface MotionStudioIntegratedMixRequestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_INTEGRATED_MIX_REQUEST_VERSION
  moduleId: 'storytelling'
  productionId: string
  integratedMixRequestId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  narrationAssemblyManifestId: string
  narrationAssemblyManifestDigest: string
  narrationAssemblyArtifactId: string
  narrationAssemblyArtifactVersionId: string
  narrationAssemblyArtifactChecksumSha256: string
  narrationAssemblyQualityReportId: string
  narrationAssemblyQualityReportDigest: string
  narrationAssemblyAllBlockingGatesPassed: true
  timingAuthority: MotionStudioTimingAuthority
  profileId: 'motion_studio_storytelling_speech_safe_mix_v1'
  profileDigest: string
  execution: MotionStudioAudioExecutionAuthorityV1
  inputs: readonly MotionStudioIntegratedMixInputV1[]
  output: {
    mimeType: 'audio/wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
    durationFrames: number
    sampleCountPerChannel: number
  }
  speechPriority: true
  providerNativeAudioIsolatedUnlessSelected: true
  callerProvidedFiltersAllowed: false
  callerProvidedFfmpegArgumentsAllowed: false
  timelineMutationAllowed: false
  videoMuxAllowed: false
  renderAllowed: false
  exportAllowed: false
  immutable: true
}

export interface MotionStudioIntegratedMixArtifactV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION
  moduleId: 'storytelling'
  productionId: string
  artifactId: string
  artifactVersionId: string
  integratedMixRequestId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  selectionManifestId: string
  selectionManifestDigest: string
  narrationAssemblyArtifactId: string
  narrationAssemblyArtifactVersionId: string
  narrationAssemblyArtifactChecksumSha256: string
  inputManifestDigest: string
  executionAttemptId: string
  profileId: 'motion_studio_storytelling_speech_safe_mix_v1'
  profileDigest: string
  contentDigest: string
  checksumSha256: string
  byteLength: number
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 2
  sampleCountPerChannel: number
  durationFrames: number
  frameRate: number
  timingAuthorityDigest: string
  privateAsset: true
  createOnly: true
  checksumVerified: true
  privateReadbackVerified: true
  providerUrlPersisted: false
  localPathProjected: false
  privateReviewOnly: true
  finalVideoReady: false
  timelineReady: false
  exportReady: false
  productReady: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioIntegratedMixQaGateResultV1 {
  gate: MotionStudioIntegratedMixQaGate
  result: 'passed' | 'failed' | 'not_run'
  blocking: true
  evidenceId?: string
  evidenceDigest?: string
  note: string
}

export interface MotionStudioIntegratedMixQualityReportV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION
  moduleId: 'storytelling'
  productionId: string
  qualityReportId: string
  integratedMixRequestId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  integratedMixArtifactId: string
  integratedMixArtifactVersionId: string
  integratedMixChecksumSha256: string
  selectionManifestId: string
  narrationAssemblyManifestId: string
  timingAuthorityDigest: string
  integratedLufs: number
  truePeakDbtp: number
  samplePeakDbfs: number
  speechPriorityRatio: number
  gateResults: readonly MotionStudioIntegratedMixQaGateResultV1[]
  allBlockingGatesPassed: boolean
  readyForHumanReview: boolean
  manualOverrideAllowed: false
  timelineReady: false
  finalVideoReady: false
  exportReady: false
  productReady: false
  reviewedAt: ISODateString
  immutable: true
}

export interface MotionStudioAudioAcceptanceRecordV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_ACCEPTANCE_RECORD_VERSION
  moduleId: 'storytelling'
  productionId: string
  audioAcceptanceRecordId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  timingAuthorityDigest: string
  integratedMixRequestId: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  narrationAssemblyManifestId: string
  narrationAssemblyManifestDigest: string
  integratedMixArtifactId: string
  integratedMixArtifactVersionId: string
  integratedMixChecksumSha256: string
  qualityReportId: string
  qualityReportDigest: string
  qaAllBlockingGatesPassed: boolean
  reviewerActorId: string
  decision: 'accepted' | 'changes_requested' | 'rejected'
  decisionReason: string
  reviewedAt: ISODateString
  fineCutHandoffEligible: boolean
  manualQaOverridePerformed: false
  timelineMutationPerformed: false
  videoMuxPerformed: false
  renderPerformed: false
  exportPerformed: false
  publicDeliveryPerformed: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
  productReady: false
  immutable: true
}

export type MotionStudioAudioInvalidationCauseV1 =
  | 'approved_snapshot_changed'
  | 'prepared_script_changed'
  | 'voice_bible_changed'
  | 'music_bible_changed'
  | 'picture_lock_changed'
  | 'master_timing_changed'
  | 'selected_take_changed'
  | 'selected_stem_changed'
  | 'cue_or_event_changed'
  | 'rights_or_consent_changed'
  | 'review_or_qa_changed'
  | 'mix_profile_changed'
  | 'cost_or_execution_authority_changed'

export interface MotionStudioAudioInvalidationRecordV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_INVALIDATION_RECORD_VERSION
  moduleId: 'storytelling'
  productionId: string
  invalidationId: string
  previousSelectionManifestId: string
  previousSelectionManifestVersion: number
  previousSelectionManifestDigest: string
  previousAudioAcceptanceRecordId?: string
  cause: MotionStudioAudioInvalidationCauseV1
  causeAuthorityId: string
  previousCauseDigest: string
  currentCauseDigest: string
  affectedRecords: readonly (
    | 'selection_manifest'
    | 'narration_assembly'
    | 'integrated_mix'
    | 'quality_report'
    | 'audio_acceptance'
  )[]
  recoveryAction:
    | 'replanning_required'
    | 'reselection_required'
    | 'remix_required'
    | 're_review_required'
  unaffectedCandidateIds: readonly string[]
  affectedRecordsStale: true
  approvedHistoryMutated: false
  existingPlanReviewBypassed: false
  timelineMutationPerformed: false
  renderPerformed: false
  exportPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioAudioAcceptanceChainV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_ACCEPTANCE_CHAIN_VERSION
  moduleId: 'storytelling'
  productionId: string
  selectionManifest: MotionStudioAudioSelectionManifestV1
  narrationAssemblyManifest: MotionStudioNarrationAssemblyManifestV1
  narrationAssemblyArtifact: MotionStudioNarrationAssemblyArtifactV1
  narrationAssemblyQualityReport: MotionStudioNarrationAssemblyQualityReportV1
  integratedMixRequest: MotionStudioIntegratedMixRequestV1
  integratedMixArtifact: MotionStudioIntegratedMixArtifactV1
  integratedMixQualityReport: MotionStudioIntegratedMixQualityReportV1
  audioAcceptanceRecord: MotionStudioAudioAcceptanceRecordV1
  immutable: true
}

/**
 * Browser-authored intent for one explicit post-review narration choice.
 * Candidate evidence, media identity, cost, timing, and snapshot authority are
 * deliberately absent; the server re-reads and compiles those fields.
 */
export interface MotionStudioExplicitNarrationChoiceRequestV1 {
  voiceSegmentId: string
  selectedTakeId: string
  decisionReason: string
}

export type MotionStudioExplicitOptionalAudioRoleDecisionRequestV1 =
  | {
      role: MotionStudioOptionalAudioRole
      decision: 'selected'
      candidateIds: readonly string[]
      decisionReason: string
    }
  | {
      role: MotionStudioOptionalAudioRole
      decision: 'not_selected' | 'not_needed'
      candidateIds: readonly never[]
      decisionReason: string
    }

export type MotionStudioExpectedCurrentAudioSelectionV1 =
  | {
      state: 'none'
      nextSelectionManifestVersion: 1
    }
  | {
      state: 'current'
      selectionManifestId: string
      selectionManifestVersion: number
      selectionManifestDigest: string
      nextSelectionManifestVersion: number
    }

export interface CreateMotionStudioAudioSelectionRequestV1 {
  expectedCurrentSelection: MotionStudioExpectedCurrentAudioSelectionV1
  narrationChoices: readonly MotionStudioExplicitNarrationChoiceRequestV1[]
  optionalRoleDecisions: readonly MotionStudioExplicitOptionalAudioRoleDecisionRequestV1[]
  decisionReason: string
}

export interface MotionStudioAudioSelectionCommitReceiptDtoV1 {
  schemaVersion: 'motion-studio.audio-selection-commit-receipt.dto.v1'
  productionId: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  state: 'selected_pending_integration'
  selectedNarrationSegmentCount: number
  selectedOptionalStemCount: number
  optionalRoleDecisions: readonly {
    role: MotionStudioOptionalAudioRole
    decision: 'selected' | 'not_selected' | 'not_needed'
    selectedCandidateCount: number
  }[]
  idempotencyStatus: 'inserted' | 'exact_replay'
  immutable: true
  selectionExplicit: true
  firstOrOnlyCandidateAutoSelected: false
  mixStarted: false
  timelineMutationPerformed: false
  renderPerformed: false
  exportPerformed: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
}

export interface CreateMotionStudioAudioIntegrationBindingRequestV1 {
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
}

export interface MotionStudioAudioIntegrationJobDtoV1 {
  stage: 'narration_assembly' | 'integrated_audio_mix'
  jobId: string
  status: 'blocked' | 'queued' | 'ready' | 'running' | 'succeeded' | 'failed' |
    'reconciliation_required' | 'cancelled'
  dependencyJobIds: readonly string[]
}

export interface MotionStudioAudioIntegrationBindingReceiptDtoV1 {
  schemaVersion: 'motion-studio.audio-integration-binding-receipt.dto.v1'
  productionId: string
  bindingId: string
  selectionManifestId: string
  selectionManifestVersion: number
  selectionManifestDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  state: 'queued_private_audio_integration' | 'resumable_private_audio_integration'
  jobs: readonly [
    MotionStudioAudioIntegrationJobDtoV1,
    MotionStudioAudioIntegrationJobDtoV1,
  ]
  idempotencyStatus: 'inserted' | 'exact_replay'
  canonicalPackageQueue: true
  selectionRevalidated: true
  existingReservationReused: true
  graphCreatedAtomically: true
  automaticCandidateSelectionPerformed: false
  providerCallPerformed: false
  timelineMutationPerformed: false
  videoMuxPerformed: false
  renderPerformed: false
  exportPerformed: false
  publicDeliveryPerformed: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
}
