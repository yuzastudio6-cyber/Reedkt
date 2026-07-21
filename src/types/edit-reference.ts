import type { PreferenceDNAConfidenceBand, PreferenceDNALayerId } from './preference-dna-builder'
import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionPlatformTarget,
} from './project-edit-session'
import type { UserFacingEditLevel } from './reeditpro'

export const EDIT_REFERENCE_STUDY_GOALS = [
  'visual_language',
  'story_and_pacing',
  'captions',
  'color',
  'b_roll',
  'audio_and_sfx',
  'graphics',
] as const

export type EditReferenceStudyGoal = typeof EDIT_REFERENCE_STUDY_GOALS[number]

export const EDIT_REFERENCE_EVIDENCE_CATEGORIES = [
  'all_goals',
  'media_structure',
  ...EDIT_REFERENCE_STUDY_GOALS,
  'copy_safety',
] as const

export type PreferenceEvidenceCategory = typeof EDIT_REFERENCE_EVIDENCE_CATEGORIES[number]

export const EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES = [
  'all_goals',
  ...EDIT_REFERENCE_STUDY_GOALS,
] as const

export const EDIT_REFERENCE_EVIDENCE_SOURCE_TYPES = [
  'manual_user_evidence',
  'reference_video_metadata',
  'previous_approved_edit_snapshot',
  'derived_skill_evidence',
] as const

export type PreferenceEvidenceSourceType = typeof EDIT_REFERENCE_EVIDENCE_SOURCE_TYPES[number]

export const EDIT_REFERENCE_RIGHTS_BASES = [
  'user_owned',
  'licensed_or_authorized',
  'reference_only',
  'workspace_approved_edit',
] as const

export type PreferenceEvidenceRightsBasis = typeof EDIT_REFERENCE_RIGHTS_BASES[number]
export const EDIT_REFERENCE_MEDIA_RIGHTS_BASES = [
  'user_owned',
  'licensed_or_authorized',
  'reference_only',
] as const
export type PreferenceEvidenceTransferability = 'transferable' | 'non_transferable' | 'do_not_copy' | 'requires_user_review' | 'unknown'
export type PreferenceEvidenceConfidenceBasis = 'user_asserted' | 'metadata_verified' | 'deterministic_derived' | 'blocked'
export type PreferenceEvidenceMediaStudyStatus =
  | 'not_applicable'
  | 'media_not_studied'
  | 'media_studied_local_partial'
  | 'media_study_blocked'
  | 'approved_edit_identity_not_verified'
  | 'approved_edit_verified'
export type PreferenceEvidenceStatus = 'not_complete' | 'ready_to_study' | 'evidence_ready' | 'needs_clarification'
export type EditReferenceDNAStatus = 'not_generated' | 'review_required' | 'approved'
export type EditReferenceDNAQAStatus = 'not_run' | 'passed' | 'blocked' | 'requires_user_review'

export const EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES = [
  'draft',
  'collecting_evidence',
  'ready_to_study',
  'studying',
  'needs_clarification',
  'evidence_ready',
  'dna_ready',
  'qa_blocked',
  'needs_user_review',
  'approved',
  'applied',
  'archived',
  'failed',
] as const

export type EditReferenceStudyLifecycleStatus = typeof EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES[number]
export type EditReferenceStatus = 'active' | 'archived'
export type PreferenceStudyMessageRole = 'user' | 'assistant' | 'system'
export type PreferenceStudyMessageRuntimeSource =
  | 'user_input'
  | 'deterministic_setup'
  | 'deterministic_evidence'
  | 'deterministic_dna'
  | 'deterministic_dna_qa'
  | 'deterministic_dna_approval'
  | 'deterministic_dna_application'
  | 'model_reasoning'
  | 'qwen_reasoning'

export type EditReferenceStudyChatReasoningPublicState =
  | 'queued'
  | 'thinking'
  | 'waiting'
  | 'answered'
  | 'needs_review'
  | 'failed'
  | 'cancelled'

/**
 * Browser-safe projection of one private Study Chat reasoning attempt. It
 * deliberately excludes provider request identifiers, route/model details,
 * prompts, cost values, credentials, lease tokens, and raw provider payloads.
 */
export interface EditReferenceStudyChatReasoningStatus {
  attemptId: string
  userMessageId: string
  assistantMessageId?: string
  state: EditReferenceStudyChatReasoningPublicState
  statusText: string
  retryAvailable: boolean
  providerCallMayHaveOccurred: boolean
  createdAt: string
  updatedAt: string
}

export interface EditReferenceSafetyFlags {
  providerCallMade: boolean
  modelCallMade: boolean
  fileBytesRead: boolean
  externalUrlFetched: false
  mediaProcessingStarted: boolean
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseReadMade: false
  supabaseWriteMade: false
  rawFramesPersisted: false
  rawProviderPayloadPersisted: false
}

export const EDIT_REFERENCE_GATE_1_SAFETY_FLAGS: EditReferenceSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  rawFramesPersisted: false,
  rawProviderPayloadPersisted: false,
}

export const EDIT_REFERENCE_SAFETY_FLAGS = EDIT_REFERENCE_GATE_1_SAFETY_FLAGS

export interface EditReferenceRecord {
  id: string
  workspaceId: string
  name: string
  description?: string
  status: EditReferenceStatus
  initialGoals: EditReferenceStudyGoal[]
  currentStudyId: string
  revision: number
  createdAt: string
  updatedAt: string
  runtimeSource: 'backend_local_private'
  evidenceStatus: PreferenceEvidenceStatus
  dnaStatus: EditReferenceDNAStatus
  qaStatus: EditReferenceDNAQAStatus
}

export interface PreferenceStudySessionRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  title: string
  status: EditReferenceStudyLifecycleStatus
  initialGoals: EditReferenceStudyGoal[]
  revision: number
  createdAt: string
  updatedAt: string
  runtimeSource: 'backend_local_private'
  evidenceStatus: PreferenceEvidenceStatus
  dnaStatus: EditReferenceDNAStatus
  qaStatus: EditReferenceDNAQAStatus
}

export interface PreferenceStudyMessageRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  role: PreferenceStudyMessageRole
  content: string
  sequence: number
  clientMessageId?: string
  reasoningAttemptId?: string
  runtimeSource: PreferenceStudyMessageRuntimeSource
  createdAt: string
}

export interface PreferenceEvidenceRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  orchestrationId?: string
  supersedesEvidenceId?: string
  sourceType: PreferenceEvidenceSourceType
  category: PreferenceEvidenceCategory
  title: string
  summary: string
  revision: number
  confidence: number
  confidenceBasis: PreferenceEvidenceConfidenceBasis
  transferability: PreferenceEvidenceTransferability
  mediaMetadata?: PreferenceEvidenceMediaMetadata
  provenance: PreferenceEvidenceProvenance
  createdAt: string
  updatedAt: string
}

export interface PreferenceEvidenceMediaMetadata {
  durationSeconds?: number
  width?: number
  height?: number
  hasAudio?: boolean
  orientation: 'portrait' | 'landscape' | 'square' | 'unknown'
}

export interface PreferenceEvidenceProvenance {
  runtimeSource: 'user_input' | 'verified_local' | 'verified_live' | 'verified_mock' | 'fallback' | 'blocked'
  sourceEvidenceIds: string[]
  skillRunId?: string
  privateAssetId?: string
  analysisArtifactIds?: string[]
  sourceLabel?: string
  projectId?: string
  editSessionId?: string
  approvedSnapshotId?: string
  rightsBasis?: PreferenceEvidenceRightsBasis
  mediaStudyStatus: PreferenceEvidenceMediaStudyStatus
  toolIds: string[]
  skillIds: string[]
  fallbackUsed: boolean
  semanticRuntime?: PreferenceSemanticRuntimeProvenance
  notes: string[]
}

export interface PreferenceSemanticRuntimeProvenance {
  schemaVersion: 'edit-reference-semantic-runtime-provenance-v1'
  adapterId: string
  adapterVersion: string
  providerId: string | null
  modelId: string
  modelRevision: string
  modelAggregateSha256: string
  modelRoutingPolicyVersion: string
  instructionDigestSha256: string
  executionId: string
  startedAt: string
  completedAt: string
  providerCallMade: boolean
  modelCallMade: boolean
  workerJobCreated: boolean
  temporaryInputsCleaned: boolean
  meteredInternalCostMicros: string
  usageEventIds: string[]
  internalCostRecordIds: string[]
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
}

export interface PreferenceTechnicalAudioLowLevelInterval {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
}

export interface PreferenceTechnicalAudioLowLevelEvidence {
  status: 'verified_local_bounded' | 'blocked' | 'not_applicable' | 'not_run'
  thresholdDb: number
  minimumDurationSeconds: number
  maxIntervalCount: number
  detectedIntervalCount: number
  intervals: PreferenceTechnicalAudioLowLevelInterval[]
  intervalsTruncated: boolean
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  totalLowLevelDurationSeconds: number
  longestLowLevelDurationSeconds: number
  blockerCode?: string
  blockerMessage?: string
  semanticAudioAnalysisRan: false
  speechPauseClassificationRan: false
  musicOrSfxAnalysisRan: false
  trimRecommendationRan: false
  rawAudioPersisted: false
  rawProcessOutputPersisted: false
}

export interface PreferenceTechnicalSourceConditionInterval {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  endedAtScanBoundary: boolean
}

export interface PreferenceTechnicalSourceConditionEvidence {
  schemaVersion: 'edit-reference-technical-source-condition-v1'
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  maxIntervalCountPerType: number
  analysisFrameRate: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  blackMinimumDurationSeconds: number
  blackPictureRatioThreshold: number
  blackPixelThreshold: number
  freezeMinimumDurationSeconds: number
  freezeNoiseTolerance: number
  blackDetectedIntervalCount: number
  blackIntervals: PreferenceTechnicalSourceConditionInterval[]
  blackIntervalsTruncated: boolean
  blackTotalDurationSeconds: number
  blackLongestDurationSeconds: number
  freezeDetectedIntervalCount: number
  freezeIntervals: PreferenceTechnicalSourceConditionInterval[]
  freezeIntervalsTruncated: boolean
  freezeTotalDurationSeconds: number
  freezeLongestDurationSeconds: number
  blockerCode?: string
  blockerMessage?: string
  technicalSourceConditionAnalysisRan: boolean
  semanticSourceQualityAnalysisRan: false
  intentionalStillnessClassificationRan: false
  cameraObstructionInferenceRan: false
  blurAnalysisRan: false
  trimRecommendationRan: false
  editDecisionMade: false
  rawFramePixelsPersisted: false
  rawProcessOutputPersisted: false
}

export interface PreferenceTechnicalEdgeWidthSignalSample {
  timeSeconds: number
  score: number
}

export interface PreferenceTechnicalEdgeWidthSignalEvidence {
  schemaVersion: 'edit-reference-technical-edge-width-signal-v1'
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  maxSampleCount: number
  attemptedSampleCount: number
  sampleCount: number
  unmeasurableSampleCount: number
  samples: PreferenceTechnicalEdgeWidthSignalSample[]
  sampleIntervalSeconds?: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  outputMaxDimension: number
  highThreshold: number
  lowThreshold: number
  radius: number
  blockPercentile: number
  blockWidth: number
  blockHeight: number
  scoreAverage?: number
  scoreMedian?: number
  scoreMinimum?: number
  scoreMaximum?: number
  scoreSpread?: number
  blockerCode?: string
  blockerMessage?: string
  technicalEdgeWidthAnalysisRan: boolean
  semanticSourceQualityAnalysisRan: false
  semanticBlurClassificationRan: false
  focusQualityClassificationRan: false
  intentionalDepthOfFieldInferenceRan: false
  cameraObstructionInferenceRan: false
  trimRecommendationRan: false
  editDecisionMade: false
  rawFramePixelsPersisted: false
  rawProcessOutputPersisted: false
}

export interface PreferenceTechnicalColorSignalEvidence {
  schemaVersion: 'edit-reference-technical-color-signal-v2'
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  maxSampleCount: number
  sampleCount: number
  sampleTimesSeconds: number[]
  sampleIntervalSeconds?: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  pixelFormat?: string
  colorSpace?: string
  colorTransfer?: string
  colorPrimaries?: string
  colorRange?: string
  hdrTransfer: 'pq' | 'hlg' | 'not_hdr_signaled' | 'unknown'
  lumaAverage8Bit?: number
  lumaObservedMinimum8Bit?: number
  lumaObservedMaximum8Bit?: number
  lumaAverageSpread8Bit?: number
  lumaLowAverage8Bit?: number
  lumaHighAverage8Bit?: number
  lumaRobustRangeAverage8Bit?: number
  lumaRobustRangeSpread8Bit?: number
  saturationAverage8Bit?: number
  saturationAverageSpread8Bit?: number
  saturationLowAverage8Bit?: number
  saturationHighAverage8Bit?: number
  saturationRobustRangeAverage8Bit?: number
  chromaUAverage8Bit?: number
  chromaUAverageSpread8Bit?: number
  chromaVAverage8Bit?: number
  chromaVAverageSpread8Bit?: number
  temporalLumaDifferenceAverage8Bit?: number
  temporalChromaDifferenceAverage8Bit?: number
  outOfRangePixelRatioAverage?: number
  outOfRangePixelRatioMaximum?: number
  blockerCode?: string
  blockerMessage?: string
  technicalDistributionAnalysisRan: boolean
  colorRangeViolationScanRan: boolean
  semanticColorAnalysisRan: false
  whiteBalanceInferenceRan: false
  temperatureInferenceRan: false
  skinToneAnalysisRan: false
  shotMatchAnalysisRan: false
  lutReconstructionRan: false
  rawFramePixelsPersisted: false
  rawHistogramPersisted: false
  rawProcessOutputPersisted: false
}

export interface PreferenceTechnicalMotionSignalPeak {
  sampleTimeSeconds: number
  lumaDifferenceAverage8Bit: number
}

export interface PreferenceTechnicalMotionSignalEvidence {
  schemaVersion: 'edit-reference-technical-motion-signal-v1'
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  maxSampleCount: number
  maxPeakCount: number
  sampleCount: number
  sampleTimesSeconds: number[]
  sampleIntervalSeconds?: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  activityThreshold8Bit: number
  highActivityThreshold8Bit: number
  lumaDifferenceAverage8Bit?: number
  lumaDifferenceMaximum8Bit?: number
  lumaDifferenceSpread8Bit?: number
  lumaDifferenceMedian8Bit?: number
  lumaDifference90thPercentile8Bit?: number
  chromaDifferenceAverage8Bit?: number
  chromaDifferenceMaximum8Bit?: number
  activeSampleCount: number
  activeSampleRatio: number
  highActivitySampleCount: number
  highActivitySampleRatio: number
  peakSamples: PreferenceTechnicalMotionSignalPeak[]
  blockerCode?: string
  blockerMessage?: string
  technicalFrameDifferenceAnalysisRan: boolean
  semanticMotionAnalysisRan: false
  cameraMotionInferenceRan: false
  objectTrackingRan: false
  transitionClassificationRan: false
  graphicsEntryExitAnalysisRan: false
  opticalFlowAnalysisRan: false
  rawFramePixelsPersisted: false
  rawDifferenceFramesPersisted: false
  rawHistogramPersisted: false
  rawProcessOutputPersisted: false
}

export interface PreferenceTechnicalCaptionRegionBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface PreferenceTechnicalCaptionRegionCandidate {
  regionId: string
  bounds: PreferenceTechnicalCaptionRegionBounds
  lineCount: number
  textLikeComponentCount: number
  candidatePixelRatio: number
  technicalTextLikelihood: number
  lowerFrameRegion: boolean
}

export interface PreferenceTechnicalCaptionRegionFrameObservation {
  sampleTimeSeconds: number
  frameWidth: number
  frameHeight: number
  candidateRegions: PreferenceTechnicalCaptionRegionCandidate[]
}

export interface PreferenceTechnicalCaptionRegionSignalEvidence {
  schemaVersion: 'edit-reference-technical-caption-region-signal-v1'
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  maxSampleCount: number
  maxRegionCountPerFrame: number
  outputMaxDimension: number
  brightnessThreshold8Bit: number
  localContrastThreshold8Bit: number
  sampleCount: number
  sampleTimesSeconds: number[]
  sampleIntervalSeconds?: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  observations: PreferenceTechnicalCaptionRegionFrameObservation[]
  framesWithCandidates: number
  candidateFrameRatio: number
  totalCandidateRegionCount: number
  lowerRegionCandidateCount: number
  lowerRegionCandidateRatio: number
  singleLineCandidateCount: number
  multiLineCandidateCount: number
  blockerCode?: string
  blockerMessage?: string
  technicalTextRegionCandidateAnalysisRan: boolean
  ocrEngineExecuted: false
  exactTextRecognitionRan: false
  transcriptAlignmentRan: false
  semanticCaptionDesignAnalysisRan: false
  fontInferenceRan: false
  captionAnimationInferenceRan: false
  rawFramePixelsPersisted: false
  rawRecognizedTextPersisted: false
  rawProcessOutputPersisted: false
}

export type PreferenceTechnicalStudyStageId =
  | 'media_foundation'
  | 'technical_scene_boundary'
  | 'technical_source_condition_signal'
  | 'technical_edge_width_signal'
  | 'technical_caption_region_signal'
  | 'technical_color_signal'
  | 'technical_audio_loudness'
  | 'technical_audio_low_level'
  | 'technical_motion_signal'

export interface PreferenceTechnicalStudyUsageEvidence {
  schemaVersion: 'edit-reference-technical-study-usage-v1'
  mode: 'backend_local_unmetered' | 'production_metered'
  measurementScope: 'aggregate_process_wall_clock'
  startedAt: string
  completedAt: string
  wallClockMs: number
  inputMediaSeconds: number
  trackedStageIds: PreferenceTechnicalStudyStageId[]
  toolIds: Array<'ffprobe' | 'ffmpeg'>
  approvedUsageEstimateId: string | null
  internalCostBudgetId: string | null
  maximumAuthorizedInternalCostMicros: string | null
  rateCardSnapshotId: string | null
  meteredInternalCostMicros: string | null
  usageEventIds: string[]
  internalCostRecordIds: string[]
  internalComputeUsageMetered: boolean
  productionCostAuthoritySatisfied: boolean
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  providerCallMade: false
  remoteMutationMade: false
}

export const EDIT_REFERENCE_LONG_FORM_STUDY_SUMMARY_VERSION =
  'edit-reference-long-form-study-summary-v1' as const

export interface PreferenceLongFormStudySummary {
  schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_SUMMARY_VERSION
  runId: string
  runRevision: number
  planId: string
  planDigestSha256: string
  sourceBindingDigestSha256: string
  referenceAssetId: string
  state: 'queued' | 'running' | 'paused' | 'needs_operator_review' | 'completed' | 'cancelled'
  durationClass: 'short' | 'standard' | 'long' | 'extended'
  sourceDurationSeconds: number
  sourceSizeBytes: number
  sourceHasAudio: boolean
  chunkCount: number
  completedWorkItemCount: number
  totalWorkItemCount: number
  runningWorkItemCount: number
  retryWaitWorkItemCount: number
  blockedWorkItemCount: number
  progressPercent: number
  temporalCoverageRatio: number
  fullyStudied: boolean
  phaseLabel: string
  etaLowerRemainingSeconds: number
  etaUpperRemainingSeconds: number
  etaConfidence: 'planning' | 'observed_low' | 'observed_medium'
  operatorReviewRequired: boolean
  controls: {
    canPause: boolean
    canResume: boolean
    canCancel: boolean
    canRecover: boolean
    pauseCompletesCurrentBoundedStep: true
    completedCheckpointsPreserved: true
  }
  originalRemainsImmutable: true
  analysisProxyProfile: 'reeditpro-analysis-proxy-v1'
  fullTemporalCoverageRequired: true
  globalReconciliationRequired: true
  coverageQaRequired: true
  providerCallMade: false
  customerPriceCalculated: false
  customerCreditsMutated: false
  remoteMutationMade: false
  updatedAt: string
}

export interface PreferenceAssetRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  privateAssetId: string
  storageObjectRecordId?: string
  mediaAssetId?: string
  assetKind: 'reference_video_metadata' | 'previous_approved_edit_snapshot'
  label: string
  rightsBasis: PreferenceEvidenceRightsBasis
  mediaStudyStatus: Exclude<PreferenceEvidenceMediaStudyStatus, 'not_applicable'>
  mediaMetadata?: PreferenceEvidenceMediaMetadata
  projectId?: string
  editSessionId?: string
  approvedSnapshotId?: string
  representativeFrameCount?: number
  keyframeSampleCount?: number
  mediaAnalysisReportId?: string
  technicalAudioStatus?: 'verified_local' | 'blocked' | 'not_applicable'
  technicalAudioLowLevel?: PreferenceTechnicalAudioLowLevelEvidence
  technicalSceneBoundaryStatus?: 'verified_local_bounded' | 'blocked' | 'not_run'
  technicalSceneBoundaryCount?: number
  technicalSceneBoundaryTimesSeconds?: number[]
  technicalSceneBoundaryCoverage?: 'full' | 'partial' | 'not_run'
  technicalSceneBoundaryThreshold?: number
  technicalSceneBoundaryScannedDurationSeconds?: number
  technicalSourceConditionSignal?: PreferenceTechnicalSourceConditionEvidence
  technicalEdgeWidthSignal?: PreferenceTechnicalEdgeWidthSignalEvidence
  technicalCaptionRegionSignal?: PreferenceTechnicalCaptionRegionSignalEvidence
  technicalColorSignal?: PreferenceTechnicalColorSignalEvidence
  technicalMotionSignal?: PreferenceTechnicalMotionSignalEvidence
  technicalStudyUsage?: PreferenceTechnicalStudyUsageEvidence
  longFormStudy?: PreferenceLongFormStudySummary
  lastStudyAt?: string
  lastStudyBlocker?: string
  createdAt: string
}

export type PreferenceSkillRunResultState =
  | 'analyzed'
  | 'manual_evidence'
  | 'fallback'
  | 'blocked'
  | 'needs_more_evidence'

export type PreferenceSkillRunRetryReasonCode =
  | 'rerun_same_inputs'
  | 'reconnect_source_then_retry'
  | 'add_evidence_then_retry'
  | 'runtime_recovery_then_retry'

export interface PreferenceSkillRunRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  orchestrationId: string
  skillId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked'
  runtimeSource: 'not_started' | 'verified_mock' | 'verified_local' | 'verified_live' | 'fallback'
  readinessAtRun: 'verified_live' | 'verified_local' | 'verified_mock' | 'degraded' | 'blocked' | 'not_implemented'
  inputEvidenceIds: string[]
  outputEvidenceIds: string[]
  toolIds: string[]
  fallbackUsed: boolean
  /**
   * Additive result-state contract. Fields remain optional only so persisted
   * private-v2 records created before this contract can still be read safely.
   * Every newly created skill run must write all three core fields.
   */
  resultContractVersion?: 'edit-reference-skill-result-v1'
  resultState?: PreferenceSkillRunResultState
  retryAvailable?: boolean
  retryReasonCode?: PreferenceSkillRunRetryReasonCode
  resultSummary: string
  warnings: string[]
  blockedReasons: string[]
  providerCallMade: boolean
  modelCallMade: boolean
  runtimeAttempt?: PreferenceSkillRuntimeAttemptProvenance
  fileBytesRead: boolean
  externalUrlFetched: false
  mediaProcessingStarted: boolean
  workerJobCreated: false
  createdAt: string
  updatedAt: string
}

export interface PreferenceSkillRuntimeAttemptProvenance {
  schemaVersion: 'edit-reference-skill-runtime-attempt-v1'
  adapterId: string
  requestDigestSha256: string
  providerCallMade: boolean
  modelCallMade: boolean
  workerJobCreated: boolean
  temporaryInputsCleaned: boolean
  internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  meteredInternalCostMicros: string | null
  usageEventIds: string[]
  internalCostRecordIds: string[]
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
}

export interface PreferenceDNAVersionRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  version: number
  status: 'draft' | 'review_required' | 'approved' | 'superseded'
  synthesisVersion: 'edit-reference-dna-synthesis-v1' | 'edit-reference-qwen-dna-synthesis-v1'
  runtimeSource: 'verified_mock' | 'verified_controlled' | 'verified_live'
  inputEvidenceRevisions: Array<{ evidenceId: string; revision: number }>
  inputEvidenceDigest: string
  layers: PreferenceDNALayerSnapshot[]
  rules: PreferenceDNARuleRecord[]
  conflicts: PreferenceDNAConflictSnapshot[]
  overallConfidence: number
  overallConfidenceBand: PreferenceDNAConfidenceBand
  adaptedNotCopied: true
  doNotCopyRuleCount: number
  qaStatus: EditReferenceDNAQAStatus
  qaResultId?: string
  reasoningProvenance?: PreferenceDNAReasoningProvenance
  reasoningReview?: PreferenceDNAReasoningReviewSummary
  approval?: PreferenceDNAApprovalSnapshot
  supersededAt?: string
  contentDigest: string
  providerCallMade: boolean
  modelCallMade: boolean
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  createdAt: string
}

export interface PreferenceDNAReasoningProvenance {
  schemaVersion: 'edit-reference-qwen-dna-provenance-v1'
  reasoningAttemptId: string
  requestDigestSha256: string
  resultDigestSha256: string
  structuredContextDigestSha256: string
  inputEvidenceDigestSha256: string
  runtimeSource: 'verified_controlled' | 'verified_live'
  adapterId: string
  adapterVersion: string
  providerId: string
  modelId: string
  modelRevision: string
  modelAggregateSha256: string
  modelRoutingPolicyVersion: string
  reasoningInstructionDigestSha256: string
  executionId: string
  startedAt: string
  completedAt: string
  usageMode: 'controlled_not_incurred' | 'production_metered'
  approvedUsageEstimateId: string | null
  internalCostBudgetId: string | null
  immutableRateCardSnapshotId: string | null
  maximumAuthorizedInternalCostMicros: string | null
  meteredInternalCostMicros: string
  usageEventIds: string[]
  internalCostRecordIds: string[]
  missingEvidenceKinds: string[]
  limitations: string[]
  candidateRequiresUserReview: boolean
  candidateResultValidated: true
  deterministicQaRequired: true
  approvalAuthorityGranted: false
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
}

export interface PreferenceDNAApprovalSnapshot {
  id: string
  qaResultId: string
  acknowledgedAdaptNotCopy: true
  acknowledgedQAReview: boolean
  reasoningReview?: PreferenceDNAReasoningApprovalSnapshot
  approvedBy: 'authenticated_user'
  approvedAt: string
}

export interface PreferenceDNAReasoningReviewSummary {
  schemaVersion: 'edit-reference-qwen-dna-review-v1'
  sourceLabel: 'AI-assisted synthesis'
  overallConfidence: number
  overallConfidenceBand: PreferenceDNAConfidenceBand
  missingEvidenceKinds: string[]
  limitations: string[]
  requiresUserReview: boolean
  approvalBindingDigestSha256: string
}

export interface PreferenceDNAReasoningReviewAcknowledgementRequest {
  schemaVersion: 'edit-reference-qwen-dna-approval-request-v1'
  expectedApprovalBindingDigestSha256: string
  acknowledgeAiAssistedSynthesis: true
  acknowledgeConfidenceAndLimitations: true
}

export interface PreferenceDNAReasoningApprovalSnapshot {
  schemaVersion: 'edit-reference-qwen-dna-approval-v1'
  approvalBindingDigestSha256: string
  sourceLabel: 'AI-assisted synthesis'
  confidenceAtApproval: number
  confidenceBandAtApproval: PreferenceDNAConfidenceBand
  missingEvidenceCount: number
  limitationCount: number
  acknowledgedAiAssistedSynthesis: true
  acknowledgedConfidenceAndLimitations: true
  acknowledgedDeterministicQA: true
  contentDigestSha256: string
}

export interface PreferenceDNALayerSnapshot {
  layerId: PreferenceDNALayerId
  title: string
  summary: string
  evidenceIds: string[]
  ruleIds: string[]
  confidence: number
  confidenceBand: PreferenceDNAConfidenceBand
  transferability: PreferenceEvidenceTransferability
  coverage: 'covered' | 'review_required'
}

export interface PreferenceDNARuleRecord {
  id: string
  layerId: PreferenceDNALayerId
  kind: 'must_follow' | 'avoid' | 'do_not_copy' | 'context_only'
  statement: string
  evidenceIds: string[]
  confidence: number
  transferability: PreferenceEvidenceTransferability
  source: 'evidence_synthesis' | 'qwen_reasoning_candidate' | 'deterministic_safety_rule'
  targetConditions: string[]
}

export interface PreferenceDNAConflictSnapshot {
  id: string
  kind:
    | 'review_required_evidence'
    | 'non_transferable_evidence'
    | 'reasoning_contradiction'
    | 'reasoning_non_transferable_detail'
  title: string
  summary: string
  evidenceIds: string[]
  severity: 'medium' | 'high'
  requiresUserReview: true
}

export interface PreferenceDNAQAResultRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  dnaVersionId: string
  dnaVersionNumber: number
  qaVersion: 'edit-reference-dna-qa-v1' | 'edit-reference-dna-qa-v2'
  runtimeSource: 'verified_mock'
  status: Exclude<EditReferenceDNAQAStatus, 'not_run'>
  dnaContentDigest: string
  inputEvidenceDigest: string
  checks: EditReferenceDNAQACheckRecord[]
  blockingCheckIds: EditReferenceDNAQACheckId[]
  reviewCheckIds: EditReferenceDNAQACheckId[]
  summary: string
  contentDigest: string
  providerCallMade: false
  modelCallMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  createdAt: string
}

export const EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS = [
  'version_integrity',
  'evidence_integrity',
  'goal_layer_coverage',
  'layer_evidence_coverage',
  'confidence_threshold',
  'conflict_review',
  'transferability_consistency',
  'do_not_copy_coverage',
  'copy_risk',
  'identity_source_safety',
  'side_effect_safety',
  'approval_readiness',
] as const

export const EDIT_REFERENCE_DNA_QA_CHECK_IDS = [
  ...EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS.slice(0, -2),
  'provider_provenance',
  ...EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS.slice(-2),
] as const

export type EditReferenceDNAQACheckId = typeof EDIT_REFERENCE_DNA_QA_CHECK_IDS[number]
export type EditReferenceDNAQACheckStatus = 'passed' | 'blocked' | 'requires_user_review'
export type EditReferenceDNAQASeverity = 'info' | 'medium' | 'high' | 'critical'

export interface EditReferenceDNAQACheckRecord {
  id: string
  checkId: EditReferenceDNAQACheckId
  status: EditReferenceDNAQACheckStatus
  severity: EditReferenceDNAQASeverity
  title: string
  summary: string
  recommendation: string
  evidenceIds: string[]
  layerIds: PreferenceDNALayerId[]
  ruleIds: string[]
  blocksApproval: boolean
  requiresUserReview: boolean
}

export const EDIT_REFERENCE_TARGET_SOURCE_MODES = [
  'voice_first',
  'mixed',
  'silent_visual',
] as const

export type PreferenceApplicationTargetSourceMode = typeof EDIT_REFERENCE_TARGET_SOURCE_MODES[number]

export const EDIT_REFERENCE_TARGET_CONTENT_TYPES = [
  'tutorial',
  'documentary',
  'lifestyle_montage',
  'talking_head',
  'product_demo',
  'custom',
] as const

export type PreferenceApplicationTargetContentType = typeof EDIT_REFERENCE_TARGET_CONTENT_TYPES[number]

export const EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES = [
  'efficient',
  'balanced',
  'cinematic',
] as const

export type PreferenceApplicationTargetBudgetPreference = typeof EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES[number]

export const EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES = ['adapt', 'required', 'avoid'] as const
export type PreferenceApplicationTargetDirectiveValue = typeof EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES[number]

export interface PreferenceApplicationTargetDirectives {
  captions: PreferenceApplicationTargetDirectiveValue
  music: PreferenceApplicationTargetDirectiveValue
  sfx: PreferenceApplicationTargetDirectiveValue
  sourceOrder: 'adapt' | 'preserve'
}

export interface PreferenceApplicationTargetContextSnapshot {
  projectId: string
  editSessionId: string
  projectName: string
  editName: string
  sourceMode: PreferenceApplicationTargetSourceMode
  contentType: PreferenceApplicationTargetContentType
  sourceSummary: string
  currentUserInstruction: string
  selectedEditLevel: UserFacingEditLevel
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>
  outputFrameConfirmed: true
  platformTarget: ProjectEditSessionPlatformTarget
  storyRole: string
  budgetPreference: PreferenceApplicationTargetBudgetPreference
  directives: PreferenceApplicationTargetDirectives
  approvedConstraints: string[]
}

export type PreferenceApplicationAdaptationDecision = 'applied' | 'adapted' | 'ignored' | 'blocked' | 'needs_clarification'
export type PreferenceApplicationLegacyAdaptationDecision = 'adapted' | 'context_only' | 'blocked_from_transfer'
export type PreferenceApplicationSource = 'setup_selector' | 'chat_tag' | 'session_panel'
export type PreferenceApplicationPrecedence =
  | 'safety_platform_tier_frame_credit_or_approved_constraint'
  | 'current_user_instruction'
  | 'target_context'
  | 'approved_preference_dna'

export interface PreferenceApplicationAdaptedDecisionRecord {
  id: string
  sourceRuleId: string
  layerId: PreferenceDNALayerId
  decision: PreferenceApplicationAdaptationDecision | PreferenceApplicationLegacyAdaptationDecision
  precedence: PreferenceApplicationPrecedence
  targetInstruction: string
  reason: string
  heldBackReason?: string | null
  confidence: number
  targetUnderstandingPackageId?: string
  targetEvidenceIds?: string[]
  targetEvidenceConfidence?: number
}

export interface PreferenceApplicationTargetUnderstandingBinding {
  packageId: string
  packageDigestSha256: string
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
  editBriefId: string
  editBriefRevision: number
  editBriefDigestSha256: string
  studyRunId: string
  studyPlanDigestSha256: string
  contextDigestSha256: string
  evidenceIds: string[]
  confidence: number
  runtimeSources: Array<'verified_local' | 'verified_live' | 'verified_mock' | 'not_run'>
  everyRequiredOutputVerified: true
  everySemanticRuntimeAuthoritative: true
  everyRequiredOutputCostAuthoritySatisfied: true
  coverageQaPassed: true
  callerSourceSummaryUsedAsStudyEvidence: false
}

export interface PreferenceApplicationHintGroupRecord {
  id: string
  layerId: PreferenceDNALayerId
  title: string
  summary: string
  decisionIds: string[]
  sourceRuleIds: string[]
}

export interface PreferenceApplicationRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  editReferenceName: string
  studySessionId: string
  dnaVersionId: string
  dnaVersionNumber: number
  dnaContentDigest: string
  dnaApprovalId: string
  dnaQaResultId: string
  projectId: string
  editSessionId: string
  version: number
  status: 'prepared' | 'replaced' | 'cleared'
  applicationSource: PreferenceApplicationSource
  applicationVersion: 'edit-reference-target-application-v1' | 'edit-reference-target-application-v2'
  runtimeSource: 'verified_mock' | 'verified_local' | 'verified_live'
  targetContext: PreferenceApplicationTargetContextSnapshot
  targetContextDigest: string
  targetUnderstanding?: PreferenceApplicationTargetUnderstandingBinding
  decisions: PreferenceApplicationAdaptedDecisionRecord[]
  hintGroups: PreferenceApplicationHintGroupRecord[]
  doNotCopyRules: string[]
  precedencePolicy: readonly [
    'safety_platform_tier_frame_credit_or_approved_constraint',
    'current_user_instruction',
    'target_context',
    'approved_preference_dna',
  ]
  summary: string
  targetIdentityStatus: 'caller_confirmed_unverified' | 'verified_mock_project_edit_session' | 'verified_project_edit_session' | 'verified_target_video_understanding'
  targetIntegrationStatus: 'not_connected' | 'connected' | 'invalidated'
  downstreamInvalidationStatus: 'not_required' | 'pending' | 'completed'
  replacesApplicationId?: string
  replacedByApplicationId?: string
  clearedAt?: string
  contentDigest: string
  targetEditMutationMade: boolean
  approvedPlanMutationMade: false
  downstreamContextWritten: boolean
  downstreamContext?: import('./edit-reference-integration').PreferenceApplicationDownstreamContext
  targetSessionReceipt?: import('./edit-reference-integration').PreferenceApplicationTargetSessionReceipt
  connectedAt?: string
  invalidatedAt?: string
  invalidationReason?: import('./edit-reference-integration').PreferenceApplicationInvalidationReason
  downstreamInvalidationReceipt?: import('./edit-reference-integration').PreferenceApplicationDownstreamInvalidationReceipt
  providerCallMade: false
  modelCallMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  createdAt: string
  updatedAt: string
}

export interface PreferenceUsageLogRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  eventType: 'created' | 'study_created' | 'message_appended' | 'evidence_added' | 'evidence_study_completed' | 'dna_version_created' | 'dna_qa_completed' | 'dna_version_approved' | 'application_prepared' | 'updated' | 'archived' | 'applied' | 'replaced' | 'cleared'
  createdAt: string
}

export interface EditReferenceListItem {
  reference: EditReferenceRecord
  currentStudy: PreferenceStudySessionRecord
  messageCount: number
  applicationCount: number
}

export interface EditReferenceDetail {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  messages: PreferenceStudyMessageRecord[]
  studyChatReasoning: EditReferenceStudyChatReasoningStatus[]
  evidence: PreferenceEvidenceRecord[]
  assets: PreferenceAssetRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  dnaVersions: PreferenceDNAVersionRecord[]
  dnaQaResults: PreferenceDNAQAResultRecord[]
  applications: PreferenceApplicationRecord[]
  usageLogs: PreferenceUsageLogRecord[]
  nextAction:
    | 'answer_setup_questions'
    | 'add_reference_evidence'
    | 'run_evidence_study'
    | 'monitor_evidence_study'
    | 'review_study_findings'
    | 'add_missing_evidence'
    | 'generate_preference_dna'
    | 'review_preference_dna'
    | 'run_preference_dna_qa'
    | 'correct_preference_dna'
    | 'approve_preference_dna'
    | 'prepare_target_application'
    | 'archived'
  safety: EditReferenceSafetyFlags
}

export interface EditReferenceListData {
  references: EditReferenceListItem[]
  persistence: 'backend_local_private'
  productionPersistence: 'blocked_by_migration_baseline'
  safety: EditReferenceSafetyFlags
}

export interface PreferenceApplicationListData {
  applications: PreferenceApplicationRecord[]
  persistence: 'backend_local_private'
  productionPersistence: 'blocked_by_migration_baseline'
  safety: EditReferenceSafetyFlags
}

export interface EditReferenceDetailData {
  detail: EditReferenceDetail
  replayed: boolean
}

export interface EditReferenceMessageData extends EditReferenceDetailData {
  appendedMessageIds: string[]
}

export interface PreferenceStudyData {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  messages: PreferenceStudyMessageRecord[]
  safety: EditReferenceSafetyFlags
}

export interface PreferenceStudyMessageListData {
  studyId: string
  messages: PreferenceStudyMessageRecord[]
  safety: EditReferenceSafetyFlags
}

export interface CreateEditReferenceRequest {
  workspaceId: string
  name: string
  description?: string
  initialGoals: EditReferenceStudyGoal[]
}

export interface UpdateEditReferenceRequest {
  workspaceId: string
  expectedReferenceRevision: number
  name?: string
  description?: string
  status?: 'archived'
}

export interface CreatePreferenceStudyRequest {
  workspaceId: string
  expectedReferenceRevision: number
  title: string
}

export interface UpdatePreferenceStudyRequest {
  workspaceId: string
  expectedStudyRevision: number
  title?: string
  status?: EditReferenceStudyLifecycleStatus
}

export interface AppendPreferenceStudyMessageRequest {
  workspaceId: string
  expectedStudyRevision: number
  clientMessageId: string
  content: string
  findingCorrectionEvidenceId?: string
}

interface CreatePreferenceEvidenceBaseRequest {
  workspaceId: string
  expectedStudyRevision: number
  sourceType: Exclude<PreferenceEvidenceSourceType, 'derived_skill_evidence'>
  title: string
}

export interface CreateManualPreferenceEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'manual_user_evidence'
  category: Exclude<PreferenceEvidenceCategory, 'media_structure' | 'copy_safety'>
  summary: string
  intendedUse: Exclude<PreferenceEvidenceTransferability, 'unknown'>
  supersedesEvidenceId?: string
}

export interface CreateReferenceVideoMetadataEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'reference_video_metadata'
  sourceLabel: string
  rightsBasis: Exclude<PreferenceEvidenceRightsBasis, 'workspace_approved_edit'>
  durationSeconds?: number
  width?: number
  height?: number
  hasAudio?: boolean
  storageObjectRecordId?: string
  mediaAssetId?: string
}

export interface CreatePreviousApprovedEditEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'previous_approved_edit_snapshot'
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  summary?: string
  rightsBasis: 'workspace_approved_edit'
}

export type CreatePreferenceEvidenceRequest =
  | CreateManualPreferenceEvidenceRequest
  | CreateReferenceVideoMetadataEvidenceRequest
  | CreatePreviousApprovedEditEvidenceRequest

export interface RunPreferenceEvidenceStudyRequest {
  workspaceId: string
  expectedStudyRevision: number
  retryBlockedSkills?: true
}

export interface StartEditReferenceLongFormStudyRequest {
  workspaceId: string
  expectedStudyRevision: number
}

export const EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS = [
  'pause',
  'resume',
  'cancel',
  'recover',
] as const

export type EditReferenceLongFormStudyControlAction =
  typeof EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS[number]

export interface ControlEditReferenceLongFormStudyRequest {
  workspaceId: string
  expectedRunRevision: number
  action: EditReferenceLongFormStudyControlAction
}

export interface EditReferenceLongFormStudyStatusData {
  editReferenceId: string
  studySessionId: string
  referenceAssetId: string
  sourceLabel: string
  study: PreferenceLongFormStudySummary
  persistence: 'backend_local_private_segmented'
  productionPersistence: 'blocked_by_migration_baseline'
  safety: {
    providerCallMade: false
    customerPriceCalculated: false
    customerCreditsMutated: false
    remoteMutationMade: false
  }
}

export interface EditReferenceLongFormStudyControlData
  extends EditReferenceLongFormStudyStatusData {
  control: {
    action: EditReferenceLongFormStudyControlAction
    disposition: 'applied' | 'idempotent_replay'
    activeWorkFinishesBeforePause: boolean
    recoveredWorkItemCount: number
    completedCheckpointsPreserved: true
  }
}

export interface SynthesizePreferenceDNARequest {
  workspaceId: string
  expectedStudyRevision: number
}

export interface RunEditReferenceDNAQARequest {
  workspaceId: string
  expectedStudyRevision: number
  expectedDNAContentDigest: string
}

export interface ApproveEditReferenceDNAVersionRequest {
  workspaceId: string
  expectedStudyRevision: number
  expectedDNAContentDigest: string
  qaResultId: string
  acknowledgeAdaptNotCopy: true
  acknowledgeQAReview: boolean
  reasoningReviewAcknowledgement?: PreferenceDNAReasoningReviewAcknowledgementRequest
}

export interface CreatePreferenceApplicationRequest {
  workspaceId: string
  expectedReferenceRevision: number
  expectedDNAContentDigest: string
  acknowledgeAdaptNotCopy: true
  applicationSource?: PreferenceApplicationSource
  targetContext: PreferenceApplicationTargetContextSnapshot
  targetUnderstandingPackageId: string
  targetUnderstandingPackageDigestSha256: string
  targetUnderstandingSourceStorageObjectRecordId: string
  targetUnderstandingSourceMediaAssetId: string
  targetUnderstandingEditBriefDigestSha256: string
  replacesApplicationId?: string
  expectedReplacedReferenceRevision?: number
  invalidationReceipt?: import('./edit-reference-integration').PreferenceApplicationDownstreamInvalidationReceipt
}

export type ConnectPreferenceApplicationRequest =
  import('./edit-reference-integration').ConnectPreferenceApplicationRequest

export type ClearPreferenceApplicationRequest =
  import('./edit-reference-integration').ClearPreferenceApplicationRequest

export interface EditReferenceApiSuccess<T> {
  ok: true
  data: T
  warnings: string[]
}

export interface EditReferenceApiFailure {
  ok: false
  status: number
  code: string
  message: string
  details?: unknown
}

export type EditReferenceApiResult<T> = EditReferenceApiSuccess<T> | EditReferenceApiFailure
