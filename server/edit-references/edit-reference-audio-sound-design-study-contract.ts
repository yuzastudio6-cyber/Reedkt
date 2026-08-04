import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_REQUEST_VERSION =
  'edit-reference-audio-sound-design-study-request-v1' as const
export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION =
  'edit-reference-audio-sound-design-study-result-v1' as const

export type EditReferenceAudioSoundDesignFindingCategory =
  | 'music_mood'
  | 'music_energy'
  | 'tempo_character'
  | 'voice_music_balance'
  | 'ducking_behavior'
  | 'sfx_density'
  | 'sfx_timing'
  | 'ambience'
  | 'silence_breathing_room'
  | 'beat_alignment'
  | 'speech_protection'

export type EditReferenceAudioSoundDesignTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceAudioSoundDesignEvidenceMode =
  | 'bounded_audio_and_technical_signals'
  | 'technical_signals_only'

export type EditReferenceAudioRightsBasis =
  | 'user_owned'
  | 'licensed_or_authorized'
  | 'reference_only'
  | 'unknown'

export interface EditReferenceAudioSoundDesignAudioSample {
  readonly role: 'reference_mix'
  readonly audioEvidenceId: string
  readonly privateAudioArtifactId: string
  readonly audioChecksumSha256: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly durationSeconds: number
  readonly sampleRate: number
  readonly channels: number
  readonly privateAccessVerified: true
  readonly boundedWindowOnly: true
  readonly ephemeral: true
  readonly cleanupRequired: true
}

export interface EditReferenceAudioSoundDesignEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly privateAudioEvidenceIds: readonly string[]
  readonly technicalLoudnessEvidenceIds: readonly string[]
  readonly technicalLowLevelIntervalEvidenceIds: readonly string[]
  readonly transcriptTimingEvidenceIds: readonly string[]
  readonly beatGridEvidenceIds: readonly string[]
  readonly visualCueTimingEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly rightsAndAssetEvidenceIds: readonly string[]
}

export interface EditReferenceAudioSoundDesignTechnicalLoudnessAuthority {
  readonly schemaVersion: 'edit-reference-technical-audio-loudness-v1'
  readonly evidenceId: string
  readonly resultDigestSha256: string
  readonly runtimeSource: 'verified_local'
  readonly executionId: string
  readonly toolIds: readonly ['ffmpeg']
  readonly status: 'verified_local'
  readonly scannedDurationSeconds: number
  readonly integratedLufs: number
  readonly truePeakDb: number
  readonly semanticAudioAnalysisRan: false
  readonly musicMoodOrEnergyAnalysisRan: false
  readonly tempoOrBeatAnalysisRan: false
  readonly voiceMusicBalanceAnalysisRan: false
  readonly duckingAnalysisRan: false
  readonly sfxOrAmbienceAnalysisRan: false
  readonly rawAudioPersisted: false
  readonly rawProcessOutputPersisted: false
}

export interface EditReferenceAudioSoundDesignTechnicalLowLevelInterval {
  readonly startSeconds: number
  readonly endSeconds: number
  readonly durationSeconds: number
}

export interface EditReferenceAudioSoundDesignTechnicalLowLevelAuthority {
  readonly schemaVersion: 'edit-reference-technical-audio-low-level-v1'
  readonly evidenceId: string
  readonly resultDigestSha256: string
  readonly runtimeSource: 'verified_local'
  readonly executionId: string
  readonly toolIds: readonly ['ffmpeg']
  readonly status: 'verified_local_bounded'
  readonly coverage: 'full' | 'partial'
  readonly thresholdDb: number
  readonly minimumDurationSeconds: number
  readonly detectedIntervalCount: number
  readonly intervals: readonly EditReferenceAudioSoundDesignTechnicalLowLevelInterval[]
  readonly intervalsTruncated: boolean
  readonly scannedDurationSeconds: number
  readonly totalLowLevelDurationSeconds: number
  readonly longestLowLevelDurationSeconds: number
  readonly semanticAudioAnalysisRan: false
  readonly speechPauseClassificationRan: false
  readonly musicOrSfxAnalysisRan: false
  readonly trimRecommendationRan: false
  readonly rawAudioPersisted: false
  readonly rawProcessOutputPersisted: false
}

export interface EditReferenceAudioSoundDesignStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly audioManifestDigestSha256: string
  readonly technicalLoudnessResultDigestSha256: string
  readonly technicalLowLevelResultDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly audioAuthorityVerified: boolean
  readonly technicalLoudnessAuthorityVerified: true
  readonly technicalLowLevelAuthorityVerified: true
  readonly evidenceMode: EditReferenceAudioSoundDesignEvidenceMode
  readonly audioSamples: readonly EditReferenceAudioSoundDesignAudioSample[]
  readonly evidence: EditReferenceAudioSoundDesignEvidenceManifest
  readonly technicalLoudnessAuthority: EditReferenceAudioSoundDesignTechnicalLoudnessAuthority
  readonly technicalLowLevelAuthority: EditReferenceAudioSoundDesignTechnicalLowLevelAuthority
  readonly sourceDurationSeconds: number
  readonly analysisWindowStartSeconds: number
  readonly analysisWindowEndSeconds: number
  readonly verifiedSpeechTimingAvailable: boolean
  readonly verifiedBeatGridAvailable: boolean
  readonly verifiedVisualCueTimingAvailable: boolean
  readonly sourceAudioRightsBasis: EditReferenceAudioRightsBasis
  readonly maxAudioSampleCount: number
  readonly maxEvidenceItems: number
  readonly maxStructuredContextCharacters: number
  readonly maxScanDurationSeconds: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly boundedPrivateAudioInputAllowed: true
  readonly rawFullMediaInputAllowed: false
  readonly rawAudioPersistenceAllowed: false
  readonly rawWaveformOrSpectrogramPersistenceAllowed: false
  readonly rawProviderPayloadPersistenceAllowed: false
  readonly technicalSignalsMayEstablishSemanticAudioIntent: false
  readonly lowLevelIntervalsMayEstablishSpeechPauseMeaning: false
  readonly exactMusicAssetTransferAllowed: false
  readonly exactSfxAssetTransferAllowed: false
  readonly exactMelodyLyricsOrHarmonyTransferAllowed: false
  readonly exactAudioFingerprintRetentionAllowed: false
  readonly exactBpmOrBeatGridTransferAllowed: false
  readonly exactCueTimingMapTransferAllowed: false
  readonly exactDuckingCurveOrGainTransferAllowed: false
  readonly exactMixSettingTransferAllowed: false
  readonly referenceAudioLibraryPromotionAllowed: false
  readonly referenceDerivedAudioGenerationAllowed: false
  readonly userOwnedOrLicensedAudioHandledBySeparateTargetAssetWorkflow: true
  readonly executableTargetAudioOperationAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceAudioSoundDesignSourceRange {
  readonly rangeId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly evidenceIds: readonly string[]
  readonly sourceEvidenceOnly: true
  readonly targetCueMapCreated: false
  readonly targetMixAutomationCreated: false
  readonly audioAssetSegmentCopied: false
  readonly executableAudioOperationCreated: false
}

export interface EditReferenceAudioSoundDesignFinding {
  readonly findingId: string
  readonly category: EditReferenceAudioSoundDesignFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly sourceRanges: readonly EditReferenceAudioSoundDesignSourceRange[]
  readonly confidence: number
  readonly transferability: EditReferenceAudioSoundDesignTransferability
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly speechRelated: boolean
  readonly beatRelated: boolean
  readonly sfxRelated: boolean
  readonly nonTransferableAssetWarning: boolean
  readonly observedAudioCharacterOnly: true
  readonly generalizedPrincipleOnly: true
  readonly technicalSignalsContextOnly: true
  readonly exactMusicOrSfxAssetIdentityRetained: false
  readonly exactMelodyLyricsOrHarmonyRetained: false
  readonly exactAudioFingerprintRetained: false
  readonly exactBpmOrBeatGridRetained: false
  readonly exactCueTimingMapRetained: false
  readonly exactDuckingCurveOrGainValuesRetained: false
  readonly exactMixSettingsRetained: false
  readonly sourceAudioPromotedToLibrary: false
  readonly referenceDerivedGenerationInstructionCreated: false
  readonly executableTargetAudioOperationCreated: false
}

export interface EditReferenceAnalyzedAudioSoundDesignStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'analyzed'
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly audioManifestDigestSha256: string
  readonly technicalLoudnessResultDigestSha256: string
  readonly technicalLowLevelResultDigestSha256: string
  readonly consumedAudioEvidenceIds: readonly string[]
  readonly evidence: EditReferenceAudioSoundDesignEvidenceManifest
  readonly technicalLoudnessAuthority: EditReferenceAudioSoundDesignTechnicalLoudnessAuthority
  readonly technicalLowLevelAuthority: EditReferenceAudioSoundDesignTechnicalLowLevelAuthority
  readonly findings: readonly EditReferenceAudioSoundDesignFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly audioSampleCount: number
    readonly technicalLowLevelIntervalCount: number
    readonly sourceDurationSeconds: number
    readonly analysisWindowStartSeconds: number
    readonly analysisWindowEndSeconds: number
    readonly analyzedDurationSeconds: number
    readonly evidenceMode: 'bounded_audio_and_technical_signals'
    readonly speechTimingAvailable: boolean
    readonly beatGridAvailable: boolean
    readonly visualCueTimingAvailable: boolean
    readonly partial: boolean
    readonly missingEvidenceKinds: readonly string[]
  }
  readonly summary: {
    readonly findingCount: number
    readonly categoryCount: number
    readonly transferablePrincipleCount: number
    readonly contextOnlyCount: number
    readonly nonTransferableCount: number
    readonly assetWarningCount: number
    readonly averageConfidence: number
  }
  readonly execution: {
    readonly boundedPrivateAudioRead: true
    readonly technicalLoudnessResultRead: true
    readonly technicalLowLevelResultRead: true
    readonly semanticAudioSoundDesignModelExecuted: true
    readonly rawFullMediaRead: false
    readonly rawWaveformOrSpectrogramRead: false
    readonly externalUrlFetched: false
    readonly providerCallMade: boolean
    readonly modelCallMade: true
    readonly workerJobCreated: boolean
    readonly temporaryAudioCleaned: true
    readonly remoteMutationMade: false
  }
  readonly analyzer: {
    readonly adapterId: string
    readonly adapterVersion: string
    readonly providerId: string | null
    readonly modelId: string
    readonly modelRevision: string
    readonly modelAggregateSha256: string
    readonly modelRoutingPolicyVersion: string
    readonly analysisInstructionDigestSha256: string
  }
  readonly provenance: {
    readonly executionId: string
    readonly startedAt: string
    readonly completedAt: string
  }
  readonly usage: {
    readonly mode: 'controlled_test_unmetered' | 'production_metered'
    readonly approvedUsageEstimateId: string | null
    readonly internalCostBudgetId: string | null
    readonly immutableRateCardSnapshotId: string | null
    readonly maximumAuthorizedInternalCostMicros: string | null
    readonly meteredInternalCostMicros: string
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly privacy: {
    readonly rawFullMediaPersisted: false
    readonly rawAudioPersisted: false
    readonly rawWaveformOrSpectrogramPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryAudioCleaned: true
  }
  readonly copySafety: {
    readonly exactMusicAssetTransferInstructionCreated: false
    readonly exactSfxAssetTransferInstructionCreated: false
    readonly exactMelodyLyricsOrHarmonyRetained: false
    readonly exactAudioFingerprintRetained: false
    readonly exactBpmOrBeatGridTransferInstructionCreated: false
    readonly exactCueTimingMapTransferInstructionCreated: false
    readonly exactDuckingCurveOrGainTransferInstructionCreated: false
    readonly exactMixSettingTransferInstructionCreated: false
    readonly sourceAudioPromotedToInternalLibrary: false
    readonly referenceDerivedAudioGenerationInstructionCreated: false
  }
  readonly audioSafety: {
    readonly technicalSignalsTreatedAsSemanticIntent: false
    readonly lowLevelIntervalsTreatedAsSpeechPauses: false
    readonly speechMeaningInferredWithoutVerifiedTiming: false
    readonly beatAlignmentClaimedWithoutBeatAuthority: false
    readonly sfxTimingClaimedWithoutVisualCueAuthority: false
    readonly speechFirstPriorityRequired: true
    readonly targetVoiceClarityQaRequired: true
    readonly targetMusicOverVoiceQaRequired: true
    readonly targetSfxJustificationQaRequired: true
    readonly targetTimingValidationRequired: true
    readonly randomSfxInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly targetAudioAnalysisRequired: true
    readonly targetSpeechPresenceAndTimingReviewRequired: true
    readonly targetBeatAndOnsetAnalysisRequiredForBeatAlignment: true
    readonly targetVisualCueLinkageRequiredForSfx: true
    readonly masterTimingPlanRequired: true
    readonly soundSyncTransitionTimingPlanRequired: true
    readonly timingValidationRequired: true
    readonly userApprovalRequired: true
    readonly userOwnedOrLicensedAudioRequiresSeparateTargetAssetApproval: true
    readonly exactReferenceMusicOrSfxTransferAllowed: false
  }
}

export interface EditReferenceAudioSoundDesignNeedsMoreEvidenceResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'needs_more_evidence'
  readonly evidenceMode: 'technical_signals_only'
  readonly missingEvidenceKinds: readonly ['bounded_private_audio_authority']
  readonly findings: readonly []
  readonly retryAvailable: true
  readonly retryReason: string
  readonly technicalSignalsTreatedAsSemanticIntent: false
  readonly lowLevelIntervalsTreatedAsSpeechPauses: false
  readonly providerCallMade: false
  readonly modelCallMade: false
  readonly workerJobCreated: false
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export type EditReferenceAudioSoundDesignStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'audio_authority_unverified'
  | 'bounded_private_audio_unavailable'
  | 'technical_loudness_result_unavailable'
  | 'technical_loudness_authority_unverified'
  | 'technical_low_level_result_unavailable'
  | 'technical_low_level_authority_unverified'
  | 'evidence_authority_unverified'
  | 'speech_timing_evidence_required'
  | 'beat_grid_evidence_required'
  | 'visual_cue_timing_evidence_required'
  | 'rights_or_asset_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'semantic_audio_runtime_unavailable'
  | 'runtime_response_invalid'
  | 'ephemeral_cleanup_failed'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedAudioSoundDesignStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceAudioSoundDesignStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly boundedPrivateAudioRead: boolean
  readonly technicalLoudnessResultRead: boolean
  readonly technicalLowLevelResultRead: boolean
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly temporaryAudioCleaned: boolean
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceAudioSoundDesignStudyResult =
  | EditReferenceAnalyzedAudioSoundDesignStudyResult
  | EditReferenceAudioSoundDesignNeedsMoreEvidenceResult
  | EditReferenceBlockedAudioSoundDesignStudyResult

export interface EditReferenceAudioSoundDesignStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceAudioSoundDesignStudyRequest): Promise<EditReferenceAudioSoundDesignStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_AUDIO_SAMPLE_COUNT = 1
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_LOW_LEVEL_INTERVAL_COUNT = 24
const MAX_FINDINGS = 64
const MAX_SOURCE_RANGES_PER_FINDING = 8

const FINDING_CATEGORIES = new Set<EditReferenceAudioSoundDesignFindingCategory>([
  'music_mood', 'music_energy', 'tempo_character', 'voice_music_balance',
  'ducking_behavior', 'sfx_density', 'sfx_timing', 'ambience',
  'silence_breathing_room', 'beat_alignment', 'speech_protection',
])
const TRANSFERABILITIES = new Set<EditReferenceAudioSoundDesignTransferability>([
  'transferable_principle', 'context_only', 'non_transferable',
])
const EVIDENCE_MODES = new Set<EditReferenceAudioSoundDesignEvidenceMode>([
  'bounded_audio_and_technical_signals', 'technical_signals_only',
])
const RIGHTS_BASES = new Set<EditReferenceAudioRightsBasis>([
  'user_owned', 'licensed_or_authorized', 'reference_only', 'unknown',
])
const BLOCKER_CODES = new Set<EditReferenceAudioSoundDesignStudyBlockerCode>([
  'adapter_unavailable', 'private_artifact_unavailable', 'audio_authority_unverified',
  'bounded_private_audio_unavailable', 'technical_loudness_result_unavailable',
  'technical_loudness_authority_unverified', 'technical_low_level_result_unavailable',
  'technical_low_level_authority_unverified', 'evidence_authority_unverified',
  'speech_timing_evidence_required', 'beat_grid_evidence_required',
  'visual_cue_timing_evidence_required', 'rights_or_asset_evidence_required',
  'cost_authority_unavailable', 'model_routing_unavailable', 'privacy_policy_denied',
  'semantic_audio_runtime_unavailable', 'runtime_response_invalid',
  'ephemeral_cleanup_failed', 'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const SPEECH_CATEGORIES = new Set<EditReferenceAudioSoundDesignFindingCategory>([
  'voice_music_balance', 'ducking_behavior', 'silence_breathing_room', 'speech_protection',
])
const SFX_CATEGORIES = new Set<EditReferenceAudioSoundDesignFindingCategory>([
  'sfx_density', 'sfx_timing',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey', 'api_key', 'authorization', 'audioBytes', 'audioFingerprint', 'bpm', 'bytes',
  'chainOfThought', 'chain_of_thought', 'duckingCurve', 'exactBeatGrid', 'exactCueMap',
  'exactLyrics', 'exactMelody', 'filePath', 'file_path', 'hiddenReasoning', 'localPath',
  'local_path', 'lyrics', 'mixAutomation', 'password', 'payload', 'prompt', 'rawAudio',
  'rawMedia', 'rawPayload', 'rawProviderPayload', 'rawSpectrogram', 'rawWaveform',
  'secret', 'signedUrl', 'signed_url', 'songTitle', 'sfxAsset', 'token', 'tokens', 'url',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function computeEditReferenceAudioSoundDesignStudyRequestDigest(
  request: EditReferenceAudioSoundDesignStudyRequest,
): string {
  assertEditReferenceAudioSoundDesignStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function assertEditReferenceAudioSoundDesignStudyRequest(
  value: unknown,
): asserts value is EditReferenceAudioSoundDesignStudyRequest {
  assertNoForbiddenContent(value, 'request')
  if (!isRecord(value)) throw new Error('Audio/Sound Design request must be an object.')
  assertExactKeys(value, [
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'audioManifestDigestSha256', 'technicalLoudnessResultDigestSha256',
    'technicalLowLevelResultDigestSha256', 'privateArtifactAccessVerified',
    'privateArtifactFinalized', 'mediaChecksumVerified', 'evidenceAuthorityVerified',
    'audioAuthorityVerified', 'technicalLoudnessAuthorityVerified',
    'technicalLowLevelAuthorityVerified', 'evidenceMode', 'audioSamples', 'evidence',
    'technicalLoudnessAuthority', 'technicalLowLevelAuthority', 'sourceDurationSeconds',
    'analysisWindowStartSeconds', 'analysisWindowEndSeconds', 'verifiedSpeechTimingAvailable',
    'verifiedBeatGridAvailable', 'verifiedVisualCueTimingAvailable', 'sourceAudioRightsBasis',
    'maxAudioSampleCount', 'maxEvidenceItems', 'maxStructuredContextCharacters',
    'maxScanDurationSeconds', 'executionScope', 'approvedUsageEstimateId',
    'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'boundedPrivateAudioInputAllowed',
    'rawFullMediaInputAllowed', 'rawAudioPersistenceAllowed',
    'rawWaveformOrSpectrogramPersistenceAllowed', 'rawProviderPayloadPersistenceAllowed',
    'technicalSignalsMayEstablishSemanticAudioIntent',
    'lowLevelIntervalsMayEstablishSpeechPauseMeaning', 'exactMusicAssetTransferAllowed',
    'exactSfxAssetTransferAllowed', 'exactMelodyLyricsOrHarmonyTransferAllowed',
    'exactAudioFingerprintRetentionAllowed', 'exactBpmOrBeatGridTransferAllowed',
    'exactCueTimingMapTransferAllowed', 'exactDuckingCurveOrGainTransferAllowed',
    'exactMixSettingTransferAllowed', 'referenceAudioLibraryPromotionAllowed',
    'referenceDerivedAudioGenerationAllowed',
    'userOwnedOrLicensedAudioHandledBySeparateTargetAssetWorkflow',
    'executableTargetAudioOperationAllowed', 'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_REQUEST_VERSION) {
    throw new Error('Audio/Sound Design request version is unsupported.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId',
  ] as const) assertId(value[key], `Audio/Sound Design ${key} is invalid.`)
  for (const key of [
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'audioManifestDigestSha256',
    'technicalLoudnessResultDigestSha256', 'technicalLowLevelResultDigestSha256',
  ] as const) assertSha256(value[key], `Audio/Sound Design ${key} is invalid.`)
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
    || value.technicalLoudnessAuthorityVerified !== true
    || value.technicalLowLevelAuthorityVerified !== true
  ) throw new Error('Audio/Sound Design private artifact and evidence authority must be verified.')
  if (!EVIDENCE_MODES.has(value.evidenceMode as EditReferenceAudioSoundDesignEvidenceMode)) {
    throw new Error('Audio/Sound Design evidence mode is invalid.')
  }
  validateAudioSamples(value)
  validateEvidenceManifest(value.evidence, value)
  validateTechnicalLoudnessAuthority(value.technicalLoudnessAuthority, value)
  validateTechnicalLowLevelAuthority(value.technicalLowLevelAuthority, value)
  validateWindowAndBounds(value)
  validateRequestCostAuthority(value)
  validateRequestSafetyFlags(value)
}

export function assertEditReferenceAudioSoundDesignStudyResult(
  request: EditReferenceAudioSoundDesignStudyRequest,
  value: unknown,
): asserts value is EditReferenceAudioSoundDesignStudyResult {
  assertEditReferenceAudioSoundDesignStudyRequest(request)
  assertNoForbiddenContent(value, 'result')
  if (!isRecord(value)) throw new Error('Audio/Sound Design result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION) {
    throw new Error('Audio/Sound Design result version is unsupported.')
  }
  const digest = computeEditReferenceAudioSoundDesignStudyRequestDigest(request)
  if (value.requestDigestSha256 !== digest) throw new Error('Audio/Sound Design result request digest does not match.')
  if (value.status === 'blocked') return validateBlockedResult(request, value)
  if (value.status === 'needs_more_evidence') return validateNeedsMoreEvidenceResult(request, value)
  if (value.status !== 'analyzed') throw new Error('Audio/Sound Design result status is invalid.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceAudioSoundDesignStudyResult(input: {
  request: EditReferenceAudioSoundDesignStudyRequest
  blockerCode: EditReferenceAudioSoundDesignStudyBlockerCode
  blockerMessage: string
  retryAvailable: boolean
  retryReason?: string
  execution?: {
    readonly boundedPrivateAudioRead?: boolean
    readonly technicalLoudnessResultRead?: boolean
    readonly technicalLowLevelResultRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
    readonly temporaryAudioCleaned?: boolean
  }
  usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedAudioSoundDesignStudyResult {
  assertEditReferenceAudioSoundDesignStudyRequest(input.request)
  if (!BLOCKER_CODES.has(input.blockerCode)) throw new Error('Audio/Sound Design blocker code is invalid.')
  assertSafeText(input.blockerMessage, 500, 'Audio/Sound Design blocker message is invalid.')
  if (input.retryReason !== undefined) assertSafeText(input.retryReason, 500, 'Audio/Sound Design retry reason is invalid.')
  if (input.retryAvailable !== (input.retryReason !== undefined)) {
    throw new Error('Audio/Sound Design retry reason must match retry availability.')
  }
  const result: EditReferenceBlockedAudioSoundDesignStudyResult = {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceAudioSoundDesignStudyRequestDigest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryReason ?? null,
    findings: [],
    boundedPrivateAudioRead: input.execution?.boundedPrivateAudioRead ?? false,
    technicalLoudnessResultRead: input.execution?.technicalLoudnessResultRead ?? false,
    technicalLowLevelResultRead: input.execution?.technicalLowLevelResultRead ?? false,
    providerCallMade: input.execution?.providerCallMade ?? false,
    modelCallMade: input.execution?.modelCallMade ?? false,
    workerJobCreated: input.execution?.workerJobCreated ?? false,
    temporaryAudioCleaned: input.execution?.temporaryAudioCleaned ?? true,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  assertEditReferenceAudioSoundDesignStudyResult(input.request, result)
  return result
}

export function createNeedsMoreEvidenceAudioSoundDesignStudyResult(
  request: EditReferenceAudioSoundDesignStudyRequest,
  retryReason: string,
): EditReferenceAudioSoundDesignNeedsMoreEvidenceResult {
  assertEditReferenceAudioSoundDesignStudyRequest(request)
  if (request.evidenceMode !== 'technical_signals_only') {
    throw new Error('Only technical-signals-only Audio/Sound Design requests use the partial-evidence result.')
  }
  assertSafeText(retryReason, 500, 'Audio/Sound Design retry reason is invalid.')
  return {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceAudioSoundDesignStudyRequestDigest(request),
    status: 'needs_more_evidence',
    evidenceMode: 'technical_signals_only',
    missingEvidenceKinds: ['bounded_private_audio_authority'],
    findings: [],
    retryAvailable: true,
    retryReason,
    technicalSignalsTreatedAsSemanticIntent: false,
    lowLevelIntervalsTreatedAsSpeechPauses: false,
    providerCallMade: false,
    modelCallMade: false,
    workerJobCreated: false,
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

function stableRequestPayload(request: EditReferenceAudioSoundDesignStudyRequest): string {
  return JSON.stringify({
    ...request,
    audioSamples: [...request.audioSamples]
      .sort((left, right) => left.audioEvidenceId.localeCompare(right.audioEvidenceId)),
    evidence: normalizedEvidenceManifest(request.evidence),
    technicalLoudnessAuthority: {
      ...request.technicalLoudnessAuthority,
      toolIds: [...request.technicalLoudnessAuthority.toolIds].sort(),
    },
    technicalLowLevelAuthority: {
      ...request.technicalLowLevelAuthority,
      toolIds: [...request.technicalLowLevelAuthority.toolIds].sort(),
      intervals: [...request.technicalLowLevelAuthority.intervals]
        .sort((left, right) => left.startSeconds - right.startSeconds),
    },
  })
}

function validateAudioSamples(request: Record<string, unknown>): void {
  if (!Array.isArray(request.audioSamples)) throw new Error('Audio/Sound Design samples are invalid.')
  const samples = request.audioSamples as unknown[]
  if (request.evidenceMode === 'bounded_audio_and_technical_signals') {
    if (request.audioAuthorityVerified !== true || samples.length !== MAX_AUDIO_SAMPLE_COUNT) {
      throw new Error('Audio/Sound Design semantic analysis requires one bounded verified private-audio sample.')
    }
  } else if (request.audioAuthorityVerified !== false || samples.length !== 0) {
    throw new Error('Technical-signals-only Audio/Sound Design requests cannot claim private-audio authority.')
  }
  for (const sample of samples) {
    if (!isRecord(sample)) throw new Error('Audio/Sound Design audio sample is invalid.')
    assertExactKeys(sample, [
      'role', 'audioEvidenceId', 'privateAudioArtifactId', 'audioChecksumSha256',
      'startSeconds', 'endSeconds', 'durationSeconds', 'sampleRate', 'channels',
      'privateAccessVerified', 'boundedWindowOnly', 'ephemeral', 'cleanupRequired',
    ], 'audio sample')
    if (sample.role !== 'reference_mix') throw new Error('Audio/Sound Design audio-sample role is invalid.')
    assertId(sample.audioEvidenceId, 'Audio/Sound Design audio evidence ID is invalid.')
    assertId(sample.privateAudioArtifactId, 'Audio/Sound Design private audio artifact ID is invalid.')
    assertSha256(sample.audioChecksumSha256, 'Audio/Sound Design audio checksum is invalid.')
    if (
      typeof sample.startSeconds !== 'number'
      || !Number.isFinite(sample.startSeconds)
      || sample.startSeconds < 0
      || typeof sample.endSeconds !== 'number'
      || !Number.isFinite(sample.endSeconds)
      || sample.endSeconds <= sample.startSeconds
      || typeof sample.durationSeconds !== 'number'
      || !Number.isFinite(sample.durationSeconds)
      || Math.abs(sample.durationSeconds - (sample.endSeconds - sample.startSeconds)) > 0.001
      || typeof sample.sampleRate !== 'number'
      || !Number.isSafeInteger(sample.sampleRate)
      || sample.sampleRate < 8_000
      || sample.sampleRate > 192_000
      || typeof sample.channels !== 'number'
      || !Number.isSafeInteger(sample.channels)
      || sample.channels < 1
      || sample.channels > 8
      || sample.privateAccessVerified !== true
      || sample.boundedWindowOnly !== true
      || sample.ephemeral !== true
      || sample.cleanupRequired !== true
    ) throw new Error('Audio/Sound Design audio sample is outside the approved boundary.')
  }
}

function validateEvidenceManifest(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'privateAudioEvidenceIds', 'technicalLoudnessEvidenceIds',
    'technicalLowLevelIntervalEvidenceIds', 'transcriptTimingEvidenceIds',
    'beatGridEvidenceIds', 'visualCueTimingEvidenceIds', 'studyChatGoalEvidenceIds',
    'rightsAndAssetEvidenceIds',
  ] as const
  assertExactKeys(value, [...keys], 'evidence manifest')
  for (const key of keys) assertIdArray(value[key], MAX_EVIDENCE_ITEMS, true, `Audio/Sound Design ${key} are invalid.`)
  const evidence = value as unknown as EditReferenceAudioSoundDesignEvidenceManifest
  if (
    evidence.mediaStructureEvidenceIds.length < 1
    || evidence.technicalLoudnessEvidenceIds.length < 1
    || evidence.technicalLowLevelIntervalEvidenceIds.length < 1
    || evidence.studyChatGoalEvidenceIds.length < 1
    || evidence.rightsAndAssetEvidenceIds.length < 1
  ) throw new Error('Audio/Sound Design requires media, technical, goal, and rights evidence.')
  const samples = request.audioSamples as EditReferenceAudioSoundDesignAudioSample[]
  if (!sameStringSet(evidence.privateAudioEvidenceIds, samples.map((sample) => sample.audioEvidenceId))) {
    throw new Error('Audio/Sound Design private-audio evidence does not match its sample authority.')
  }
  validateOptionalEvidenceAuthority(
    request.verifiedSpeechTimingAvailable,
    evidence.transcriptTimingEvidenceIds,
    'Audio/Sound Design speech-timing evidence contradicts its authority flag.',
  )
  validateOptionalEvidenceAuthority(
    request.verifiedBeatGridAvailable,
    evidence.beatGridEvidenceIds,
    'Audio/Sound Design beat-grid evidence contradicts its authority flag.',
  )
  validateOptionalEvidenceAuthority(
    request.verifiedVisualCueTimingAvailable,
    evidence.visualCueTimingEvidenceIds,
    'Audio/Sound Design visual-cue evidence contradicts its authority flag.',
  )
  const all = allEvidence(evidence)
  if (all.length < 5 || all.length > MAX_EVIDENCE_ITEMS || new Set(all).size !== all.length) {
    throw new Error('Audio/Sound Design evidence IDs must be unique and bounded.')
  }
}

function validateOptionalEvidenceAuthority(flag: unknown, ids: readonly string[], message: string): void {
  if (typeof flag !== 'boolean' || (flag && ids.length < 1) || (!flag && ids.length > 0)) throw new Error(message)
}

function validateTechnicalLoudnessAuthority(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design technical loudness authority is invalid.')
  assertExactKeys(value, [
    'schemaVersion', 'evidenceId', 'resultDigestSha256', 'runtimeSource', 'executionId',
    'toolIds', 'status', 'scannedDurationSeconds', 'integratedLufs', 'truePeakDb',
    'semanticAudioAnalysisRan',
    'musicMoodOrEnergyAnalysisRan', 'tempoOrBeatAnalysisRan',
    'voiceMusicBalanceAnalysisRan', 'duckingAnalysisRan', 'sfxOrAmbienceAnalysisRan',
    'rawAudioPersisted', 'rawProcessOutputPersisted',
  ], 'technical loudness authority')
  assertId(value.evidenceId, 'Audio/Sound Design technical loudness evidence ID is invalid.')
  assertId(value.executionId, 'Audio/Sound Design technical loudness execution ID is invalid.')
  assertSha256(value.resultDigestSha256, 'Audio/Sound Design technical loudness digest is invalid.')
  const evidence = (request.evidence as EditReferenceAudioSoundDesignEvidenceManifest).technicalLoudnessEvidenceIds
  if (
    value.schemaVersion !== 'edit-reference-technical-audio-loudness-v1'
    || value.resultDigestSha256 !== request.technicalLoudnessResultDigestSha256
    || !evidence.includes(value.evidenceId as string)
    || value.runtimeSource !== 'verified_local'
    || value.status !== 'verified_local'
    || !Array.isArray(value.toolIds)
    || !sameStringSet(value.toolIds as string[], ['ffmpeg'])
    || typeof value.scannedDurationSeconds !== 'number'
    || !Number.isFinite(value.scannedDurationSeconds)
    || value.scannedDurationSeconds <= 0
    || value.scannedDurationSeconds > MAX_SCAN_DURATION_SECONDS
    || typeof value.integratedLufs !== 'number'
    || !Number.isFinite(value.integratedLufs)
    || value.integratedLufs < -100
    || value.integratedLufs > 20
    || typeof value.truePeakDb !== 'number'
    || !Number.isFinite(value.truePeakDb)
    || value.truePeakDb < -100
    || value.truePeakDb > 20
  ) throw new Error('Audio/Sound Design technical loudness authority is not exact or verified.')
  for (const key of [
    'semanticAudioAnalysisRan', 'musicMoodOrEnergyAnalysisRan', 'tempoOrBeatAnalysisRan',
    'voiceMusicBalanceAnalysisRan', 'duckingAnalysisRan', 'sfxOrAmbienceAnalysisRan',
    'rawAudioPersisted', 'rawProcessOutputPersisted',
  ] as const) if (value[key] !== false) throw new Error('Audio/Sound Design loudness authority overclaims semantic or retained data.')
}

function validateTechnicalLowLevelAuthority(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design technical low-level authority is invalid.')
  assertExactKeys(value, [
    'schemaVersion', 'evidenceId', 'resultDigestSha256', 'runtimeSource', 'executionId',
    'toolIds', 'status', 'coverage', 'thresholdDb', 'minimumDurationSeconds',
    'detectedIntervalCount', 'intervals', 'intervalsTruncated', 'scannedDurationSeconds',
    'totalLowLevelDurationSeconds', 'longestLowLevelDurationSeconds',
    'semanticAudioAnalysisRan', 'speechPauseClassificationRan', 'musicOrSfxAnalysisRan',
    'trimRecommendationRan', 'rawAudioPersisted', 'rawProcessOutputPersisted',
  ], 'technical low-level authority')
  assertId(value.evidenceId, 'Audio/Sound Design low-level evidence ID is invalid.')
  assertId(value.executionId, 'Audio/Sound Design low-level execution ID is invalid.')
  assertSha256(value.resultDigestSha256, 'Audio/Sound Design low-level digest is invalid.')
  const evidence = (request.evidence as EditReferenceAudioSoundDesignEvidenceManifest).technicalLowLevelIntervalEvidenceIds
  if (
    value.schemaVersion !== 'edit-reference-technical-audio-low-level-v1'
    || value.resultDigestSha256 !== request.technicalLowLevelResultDigestSha256
    || !evidence.includes(value.evidenceId as string)
    || value.runtimeSource !== 'verified_local'
    || value.status !== 'verified_local_bounded'
    || !['full', 'partial'].includes(String(value.coverage))
    || !Array.isArray(value.toolIds)
    || !sameStringSet(value.toolIds as string[], ['ffmpeg'])
    || typeof value.thresholdDb !== 'number'
    || !Number.isFinite(value.thresholdDb)
    || value.thresholdDb < -90
    || value.thresholdDb > -20
    || typeof value.minimumDurationSeconds !== 'number'
    || !Number.isFinite(value.minimumDurationSeconds)
    || value.minimumDurationSeconds < 0.25
    || value.minimumDurationSeconds > 10
    || typeof value.detectedIntervalCount !== 'number'
    || !Number.isSafeInteger(value.detectedIntervalCount)
    || value.detectedIntervalCount < 0
    || value.detectedIntervalCount > 50
    || typeof value.intervalsTruncated !== 'boolean'
  ) throw new Error('Audio/Sound Design technical low-level authority is not exact or verified.')
  assertPositiveFinite(value.scannedDurationSeconds, MAX_SCAN_DURATION_SECONDS, 'Audio/Sound Design low-level scan duration is invalid.')
  validateLowLevelIntervals(value)
  for (const key of [
    'semanticAudioAnalysisRan', 'speechPauseClassificationRan', 'musicOrSfxAnalysisRan',
    'trimRecommendationRan', 'rawAudioPersisted', 'rawProcessOutputPersisted',
  ] as const) if (value[key] !== false) throw new Error('Audio/Sound Design low-level authority overclaims semantic or retained data.')
}

function validateLowLevelIntervals(value: Record<string, unknown>): void {
  if (!Array.isArray(value.intervals) || value.intervals.length > MAX_LOW_LEVEL_INTERVAL_COUNT) {
    throw new Error('Audio/Sound Design low-level intervals are outside the approved bound.')
  }
  const intervals = value.intervals as Array<Record<string, unknown>>
  for (const interval of intervals) {
    if (!isRecord(interval)) throw new Error('Audio/Sound Design low-level interval is invalid.')
    assertExactKeys(interval, ['startSeconds', 'endSeconds', 'durationSeconds'], 'technical low-level interval')
    if (
      typeof interval.startSeconds !== 'number'
      || !Number.isFinite(interval.startSeconds)
      || interval.startSeconds < 0
      || typeof interval.endSeconds !== 'number'
      || !Number.isFinite(interval.endSeconds)
      || interval.endSeconds <= interval.startSeconds
      || interval.endSeconds > (value.scannedDurationSeconds as number) + 0.001
      || typeof interval.durationSeconds !== 'number'
      || !Number.isFinite(interval.durationSeconds)
      || Math.abs(interval.durationSeconds - (interval.endSeconds - interval.startSeconds)) > 0.001
      || interval.durationSeconds + 0.01 < (value.minimumDurationSeconds as number)
    ) throw new Error('Audio/Sound Design low-level interval is invalid.')
  }
  const orderedIntervals = [...intervals].sort(
    (left, right) => (left.startSeconds as number) - (right.startSeconds as number),
  )
  let total = 0
  let longest = 0
  let previousEnd = -1
  for (const interval of orderedIntervals) {
    if ((interval.startSeconds as number) < previousEnd - 0.001) {
      throw new Error('Audio/Sound Design low-level intervals overlap.')
    }
    previousEnd = interval.endSeconds as number
    total += interval.durationSeconds as number
    longest = Math.max(longest, interval.durationSeconds as number)
  }
  if (
    (value.detectedIntervalCount as number) < intervals.length
    || value.intervalsTruncated !== ((value.detectedIntervalCount as number) > intervals.length)
    || typeof value.totalLowLevelDurationSeconds !== 'number'
    || !Number.isFinite(value.totalLowLevelDurationSeconds)
    || Math.abs(value.totalLowLevelDurationSeconds - total) > 0.001
    || typeof value.longestLowLevelDurationSeconds !== 'number'
    || !Number.isFinite(value.longestLowLevelDurationSeconds)
    || Math.abs(value.longestLowLevelDurationSeconds - longest) > 0.001
  ) throw new Error('Audio/Sound Design low-level interval summary is inconsistent.')
}

function validateWindowAndBounds(value: Record<string, unknown>): void {
  assertPositiveFinite(value.sourceDurationSeconds, 86_400, 'Audio/Sound Design source duration is invalid.')
  if (
    typeof value.analysisWindowStartSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowStartSeconds)
    || value.analysisWindowStartSeconds !== 0
    || typeof value.analysisWindowEndSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowEndSeconds)
    || value.analysisWindowEndSeconds <= value.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds > (value.sourceDurationSeconds as number)
    || value.analysisWindowEndSeconds - value.analysisWindowStartSeconds > MAX_SCAN_DURATION_SECONDS
  ) throw new Error('Audio/Sound Design analysis window is invalid.')
  if (
    value.maxAudioSampleCount !== MAX_AUDIO_SAMPLE_COUNT
    || value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS
    || value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS
    || value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS
    || typeof value.verifiedSpeechTimingAvailable !== 'boolean'
    || typeof value.verifiedBeatGridAvailable !== 'boolean'
    || typeof value.verifiedVisualCueTimingAvailable !== 'boolean'
    || !RIGHTS_BASES.has(value.sourceAudioRightsBasis as EditReferenceAudioRightsBasis)
  ) throw new Error('Audio/Sound Design bounds, evidence flags, or rights basis are invalid.')
  const samples = value.audioSamples as EditReferenceAudioSoundDesignAudioSample[]
  for (const sample of samples) {
    if (
      Math.abs(sample.startSeconds - (value.analysisWindowStartSeconds as number)) > 0.001
      || Math.abs(sample.endSeconds - (value.analysisWindowEndSeconds as number)) > 0.001
    ) throw new Error('Audio/Sound Design sample must match the approved bounded analysis window.')
  }
  if ((value.technicalLowLevelAuthority as EditReferenceAudioSoundDesignTechnicalLowLevelAuthority).scannedDurationSeconds
    > (value.analysisWindowEndSeconds as number) - (value.analysisWindowStartSeconds as number) + 0.001) {
    throw new Error('Audio/Sound Design technical low-level coverage exceeds its analysis window.')
  }
}

function validateRequestCostAuthority(value: Record<string, unknown>): void {
  if (value.executionScope === 'controlled_test') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) throw new Error('Controlled Audio/Sound Design requests cannot claim production cost authority.')
    return
  }
  if (value.executionScope !== 'production') throw new Error('Audio/Sound Design execution scope is invalid.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    assertId(value[key], `Audio/Sound Design ${key} is invalid.`)
  }
  assertPositiveMoneyMicros(value.maximumAuthorizedInternalCostMicros, 'Audio/Sound Design maximum cost is invalid.')
}

function validateRequestSafetyFlags(value: Record<string, unknown>): void {
  if (
    value.boundedPrivateAudioInputAllowed !== true
    || value.userOwnedOrLicensedAudioHandledBySeparateTargetAssetWorkflow !== true
  ) throw new Error('Audio/Sound Design required safety flags are invalid.')
  for (const key of [
    'rawFullMediaInputAllowed', 'rawAudioPersistenceAllowed',
    'rawWaveformOrSpectrogramPersistenceAllowed', 'rawProviderPayloadPersistenceAllowed',
    'technicalSignalsMayEstablishSemanticAudioIntent',
    'lowLevelIntervalsMayEstablishSpeechPauseMeaning', 'exactMusicAssetTransferAllowed',
    'exactSfxAssetTransferAllowed', 'exactMelodyLyricsOrHarmonyTransferAllowed',
    'exactAudioFingerprintRetentionAllowed', 'exactBpmOrBeatGridTransferAllowed',
    'exactCueTimingMapTransferAllowed', 'exactDuckingCurveOrGainTransferAllowed',
    'exactMixSettingTransferAllowed', 'referenceAudioLibraryPromotionAllowed',
    'referenceDerivedAudioGenerationAllowed', 'executableTargetAudioOperationAllowed',
    'externalUrlFetchAllowed', 'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ] as const) if (value[key] !== false) throw new Error('Audio/Sound Design request crossed a safety boundary.')
}

function validateBlockedResult(
  request: EditReferenceAudioSoundDesignStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', 'retryReason', 'findings', 'boundedPrivateAudioRead',
    'technicalLoudnessResultRead', 'technicalLowLevelResultRead', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryAudioCleaned', 'internalCostStatus',
    'meteredInternalCostMicros', 'usageEventIds', 'internalCostRecordIds',
    'remoteMutationMade', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceAudioSoundDesignStudyBlockerCode)) {
    throw new Error('Audio/Sound Design blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 500, 'Audio/Sound Design blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Audio/Sound Design retry availability is invalid.')
  if (value.retryReason !== null) assertSafeText(value.retryReason, 500, 'Audio/Sound Design retry reason is invalid.')
  if (value.retryAvailable !== (value.retryReason !== null)) throw new Error('Audio/Sound Design retry state is inconsistent.')
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Audio/Sound Design results cannot contain findings.')
  }
  for (const key of [
    'boundedPrivateAudioRead', 'technicalLoudnessResultRead', 'technicalLowLevelResultRead',
    'providerCallMade', 'modelCallMade', 'workerJobCreated', 'temporaryAudioCleaned',
  ] as const) if (typeof value[key] !== 'boolean') {
    throw new Error('Blocked Audio/Sound Design execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Blocked Audio/Sound Design result crossed a remote or customer-charging boundary.')
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Audio/Sound Design internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Audio/Sound Design internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Audio/Sound Design usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Audio/Sound Design internal-cost IDs are invalid.')
  const paidExecution = value.providerCallMade === true
    || value.modelCallMade === true
    || value.workerJobCreated === true
  if (request.executionScope === 'controlled_test') {
    if (
      value.providerCallMade === true
      || value.workerJobCreated === true
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Audio/Sound Design blockers cannot claim paid execution or cost.')
  } else if (paidExecution) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Audio/Sound Design execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Audio/Sound Design execution cannot claim no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Audio/Sound Design cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Audio/Sound Design execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Audio/Sound Design execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) throw new Error('Unstarted Audio/Sound Design blockers cannot claim internal-cost usage.')
}

function validateNeedsMoreEvidenceResult(
  request: EditReferenceAudioSoundDesignStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'evidenceMode', 'missingEvidenceKinds',
    'findings', 'retryAvailable', 'retryReason', 'technicalSignalsTreatedAsSemanticIntent',
    'lowLevelIntervalsTreatedAsSpeechPauses', 'providerCallMade', 'modelCallMade',
    'workerJobCreated', 'remoteMutationMade', 'customerPriceCalculated',
    'customerCreditsMutated',
  ], 'needs-more-evidence result')
  if (
    request.evidenceMode !== 'technical_signals_only'
    || value.evidenceMode !== 'technical_signals_only'
    || !Array.isArray(value.missingEvidenceKinds)
    || !sameStringSet(value.missingEvidenceKinds as string[], ['bounded_private_audio_authority'])
    || value.retryAvailable !== true
    || value.technicalSignalsTreatedAsSemanticIntent !== false
    || value.lowLevelIntervalsTreatedAsSpeechPauses !== false
  ) throw new Error('Audio/Sound Design partial-evidence result is invalid.')
  assertSafeText(value.retryReason, 500, 'Audio/Sound Design retry reason is invalid.')
  assertNoEffectResult(value)
}

function assertNoEffectResult(value: Record<string, unknown>): void {
  if (
    !Array.isArray(value.findings)
    || value.findings.length !== 0
    || value.providerCallMade !== false
    || value.modelCallMade !== false
    || value.workerJobCreated !== false
    || value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
  ) throw new Error('Audio/Sound Design blocked or partial result cannot claim effects or findings.')
}

function validateAnalyzedResult(
  request: EditReferenceAudioSoundDesignStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId',
    'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId',
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'audioManifestDigestSha256',
    'technicalLoudnessResultDigestSha256', 'technicalLowLevelResultDigestSha256',
    'consumedAudioEvidenceIds', 'evidence', 'technicalLoudnessAuthority',
    'technicalLowLevelAuthority', 'findings', 'coverage', 'summary', 'execution',
    'analyzer', 'provenance', 'usage', 'privacy', 'copySafety', 'audioSafety',
    'transferBoundary',
  ], 'analyzed result')
  if (request.evidenceMode !== 'bounded_audio_and_technical_signals') {
    throw new Error('Technical signals alone cannot create analyzed Audio/Sound Design findings.')
  }
  if (!['verified_local', 'verified_live'].includes(String(value.runtimeSource))) {
    throw new Error('Audio/Sound Design runtime source is invalid.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'audioManifestDigestSha256', 'technicalLoudnessResultDigestSha256',
    'technicalLowLevelResultDigestSha256',
  ] as const) if (value[key] !== request[key]) throw new Error(`Audio/Sound Design ${key} does not match the request.`)
  assertMatchingIdSet(
    value.consumedAudioEvidenceIds,
    request.audioSamples.map((sample) => sample.audioEvidenceId),
    'Audio/Sound Design consumed audio IDs do not match.',
  )
  validateMatchingEvidenceManifest(value.evidence, request.evidence)
  if (JSON.stringify(value.technicalLoudnessAuthority) !== JSON.stringify(request.technicalLoudnessAuthority)) {
    throw new Error('Audio/Sound Design technical loudness authority does not match the request.')
  }
  if (JSON.stringify(value.technicalLowLevelAuthority) !== JSON.stringify(request.technicalLowLevelAuthority)) {
    throw new Error('Audio/Sound Design technical low-level authority does not match the request.')
  }
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(request, value.runtimeSource, value.execution)
  validateAnalyzer(value.runtimeSource, value.analyzer)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validatePrivacy(value.privacy)
  validateCopySafety(value.copySafety)
  validateAudioSafety(value.audioSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateFindings(
  request: EditReferenceAudioSoundDesignStudyRequest,
  value: unknown,
): EditReferenceAudioSoundDesignFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Audio/Sound Design findings are outside the approved bound.')
  }
  const findings = value as EditReferenceAudioSoundDesignFinding[]
  const findingIds = new Set<string>()
  const rangeIds = new Set<string>()
  const allowedEvidence = new Set(allEvidence(request.evidence))
  for (const finding of findings) {
    if (!isRecord(finding)) throw new Error('Audio/Sound Design finding is invalid.')
    assertExactKeys(finding, [
      'findingId', 'category', 'summary', 'evidenceIds', 'sourceRanges', 'confidence',
      'transferability', 'targetAdaptationRequired', 'requiresUserReview', 'speechRelated',
      'beatRelated', 'sfxRelated', 'nonTransferableAssetWarning',
      'observedAudioCharacterOnly', 'generalizedPrincipleOnly',
      'technicalSignalsContextOnly', 'exactMusicOrSfxAssetIdentityRetained',
      'exactMelodyLyricsOrHarmonyRetained', 'exactAudioFingerprintRetained',
      'exactBpmOrBeatGridRetained', 'exactCueTimingMapRetained',
      'exactDuckingCurveOrGainValuesRetained', 'exactMixSettingsRetained',
      'sourceAudioPromotedToLibrary', 'referenceDerivedGenerationInstructionCreated',
      'executableTargetAudioOperationCreated',
    ], 'finding')
    assertId(finding.findingId, 'Audio/Sound Design finding ID is invalid.')
    if (findingIds.has(finding.findingId)) throw new Error('Audio/Sound Design finding IDs must be unique.')
    findingIds.add(finding.findingId)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceAudioSoundDesignFindingCategory)) {
      throw new Error('Audio/Sound Design finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Audio/Sound Design finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Audio/Sound Design finding evidence is invalid.')
    if ((finding.evidenceIds as string[]).some((id) => !allowedEvidence.has(id))) {
      throw new Error('Audio/Sound Design finding cites unapproved evidence.')
    }
    assertUnitInterval(finding.confidence, 'Audio/Sound Design finding confidence is invalid.')
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceAudioSoundDesignTransferability)) {
      throw new Error('Audio/Sound Design transferability is invalid.')
    }
    if (
      typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.speechRelated !== 'boolean'
      || typeof finding.beatRelated !== 'boolean'
      || typeof finding.sfxRelated !== 'boolean'
      || typeof finding.nonTransferableAssetWarning !== 'boolean'
      || finding.targetAdaptationRequired !== true
      || finding.observedAudioCharacterOnly !== true
      || finding.generalizedPrincipleOnly !== true
      || finding.technicalSignalsContextOnly !== true
    ) throw new Error('Audio/Sound Design finding safety metadata is invalid.')
    for (const key of [
      'exactMusicOrSfxAssetIdentityRetained', 'exactMelodyLyricsOrHarmonyRetained',
      'exactAudioFingerprintRetained', 'exactBpmOrBeatGridRetained',
      'exactCueTimingMapRetained', 'exactDuckingCurveOrGainValuesRetained',
      'exactMixSettingsRetained', 'sourceAudioPromotedToLibrary',
      'referenceDerivedGenerationInstructionCreated', 'executableTargetAudioOperationCreated',
    ] as const) if (finding[key] !== false) throw new Error('Audio/Sound Design finding retained exact or executable audio data.')
    validateFindingAuthority(request, finding)
    validateSourceRanges(request, finding, rangeIds)
  }
  if (
    ['reference_only', 'unknown'].includes(request.sourceAudioRightsBasis)
    && !findings.some((finding) => finding.nonTransferableAssetWarning)
  ) throw new Error('Reference-only or unknown audio requires a non-transferable asset warning.')
  return findings
}

function validateFindingAuthority(
  request: EditReferenceAudioSoundDesignStudyRequest,
  finding: EditReferenceAudioSoundDesignFinding,
): void {
  const speechCategory = SPEECH_CATEGORIES.has(finding.category)
  if (finding.speechRelated !== speechCategory) {
    throw new Error('Audio/Sound Design speech-related metadata does not match its category.')
  }
  if (speechCategory) {
    if (!request.verifiedSpeechTimingAvailable) throw new Error('Speech-related audio findings require verified speech timing.')
    if (!finding.evidenceIds.some((id) => request.evidence.transcriptTimingEvidenceIds.includes(id))) {
      throw new Error('Speech-related audio finding lacks verified transcript/timing evidence.')
    }
  }
  const beatCategory = finding.category === 'beat_alignment'
  if (finding.beatRelated !== beatCategory) {
    throw new Error('Audio/Sound Design beat-related metadata does not match its category.')
  }
  if (beatCategory) {
    if (!request.verifiedBeatGridAvailable) throw new Error('Beat-alignment findings require verified beat-grid authority.')
    if (!finding.evidenceIds.some((id) => request.evidence.beatGridEvidenceIds.includes(id))) {
      throw new Error('Beat-alignment finding lacks verified beat-grid evidence.')
    }
  }
  const sfxCategory = SFX_CATEGORIES.has(finding.category)
  if (finding.sfxRelated !== sfxCategory) {
    throw new Error('Audio/Sound Design SFX metadata does not match its category.')
  }
  if (finding.category === 'sfx_timing') {
    if (!request.verifiedVisualCueTimingAvailable) throw new Error('SFX-timing findings require verified visual-cue authority.')
    if (!finding.evidenceIds.some((id) => request.evidence.visualCueTimingEvidenceIds.includes(id))) {
      throw new Error('SFX-timing finding lacks verified visual-cue evidence.')
    }
  }
  if (finding.nonTransferableAssetWarning) {
    if (finding.transferability !== 'non_transferable' || !finding.requiresUserReview) {
      throw new Error('Audio/Sound Design asset warnings must be non-transferable and reviewable.')
    }
    if (!finding.evidenceIds.some((id) => request.evidence.rightsAndAssetEvidenceIds.includes(id))) {
      throw new Error('Audio/Sound Design asset warning lacks rights evidence.')
    }
  }
}

function validateSourceRanges(
  request: EditReferenceAudioSoundDesignStudyRequest,
  finding: EditReferenceAudioSoundDesignFinding,
  rangeIds: Set<string>,
): void {
  if (!Array.isArray(finding.sourceRanges) || finding.sourceRanges.length < 1 || finding.sourceRanges.length > MAX_SOURCE_RANGES_PER_FINDING) {
    throw new Error('Audio/Sound Design source ranges are outside the approved bound.')
  }
  for (const range of finding.sourceRanges) {
    if (!isRecord(range)) throw new Error('Audio/Sound Design source range is invalid.')
    assertExactKeys(range, [
      'rangeId', 'startSeconds', 'endSeconds', 'evidenceIds', 'sourceEvidenceOnly',
      'targetCueMapCreated', 'targetMixAutomationCreated', 'audioAssetSegmentCopied',
      'executableAudioOperationCreated',
    ], 'source range')
    assertId(range.rangeId, 'Audio/Sound Design source range ID is invalid.')
    if (rangeIds.has(range.rangeId)) throw new Error('Audio/Sound Design source-range IDs must be unique.')
    rangeIds.add(range.rangeId)
    if (
      typeof range.startSeconds !== 'number'
      || !Number.isFinite(range.startSeconds)
      || typeof range.endSeconds !== 'number'
      || !Number.isFinite(range.endSeconds)
      || range.startSeconds < request.analysisWindowStartSeconds
      || range.endSeconds <= range.startSeconds
      || range.endSeconds > request.analysisWindowEndSeconds
    ) throw new Error('Audio/Sound Design source range is outside the approved window.')
    assertIdArray(range.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Audio/Sound Design source-range evidence is invalid.')
    if ((range.evidenceIds as string[]).some((id) => !finding.evidenceIds.includes(id))) {
      throw new Error('Audio/Sound Design source range cites evidence outside its finding.')
    }
    if (
      range.sourceEvidenceOnly !== true
      || range.targetCueMapCreated !== false
      || range.targetMixAutomationCreated !== false
      || range.audioAssetSegmentCopied !== false
      || range.executableAudioOperationCreated !== false
    ) throw new Error('Audio/Sound Design source ranges cannot create target audio operations.')
  }
}

function validateCoverage(request: EditReferenceAudioSoundDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount', 'audioSampleCount', 'technicalLowLevelIntervalCount',
    'sourceDurationSeconds', 'analysisWindowStartSeconds', 'analysisWindowEndSeconds',
    'analyzedDurationSeconds', 'evidenceMode', 'speechTimingAvailable', 'beatGridAvailable',
    'visualCueTimingAvailable', 'partial', 'missingEvidenceKinds',
  ], 'coverage')
  const expectedMissing = request.technicalLowLevelAuthority.coverage === 'partial'
    ? ['technical_low_level_partial_coverage']
    : []
  if (
    value.evidenceItemCount !== allEvidence(request.evidence).length
    || value.audioSampleCount !== request.audioSamples.length
    || value.technicalLowLevelIntervalCount !== request.technicalLowLevelAuthority.intervals.length
    || value.sourceDurationSeconds !== request.sourceDurationSeconds
    || value.analysisWindowStartSeconds !== request.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds !== request.analysisWindowEndSeconds
    || value.analyzedDurationSeconds !== request.analysisWindowEndSeconds - request.analysisWindowStartSeconds
    || value.evidenceMode !== 'bounded_audio_and_technical_signals'
    || value.speechTimingAvailable !== request.verifiedSpeechTimingAvailable
    || value.beatGridAvailable !== request.verifiedBeatGridAvailable
    || value.visualCueTimingAvailable !== request.verifiedVisualCueTimingAvailable
    || value.partial !== (expectedMissing.length > 0)
  ) throw new Error('Audio/Sound Design coverage does not match the request.')
  assertSafeStringArray(value.missingEvidenceKinds, 16, true, 100, 'Audio/Sound Design missing-evidence kinds are invalid.')
  if (!sameStringSet(value.missingEvidenceKinds as string[], expectedMissing)) {
    throw new Error('Audio/Sound Design missing-evidence kinds do not match coverage.')
  }
}

function validateSummary(findings: readonly EditReferenceAudioSoundDesignFinding[], value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design summary is invalid.')
  assertExactKeys(value, [
    'findingCount', 'categoryCount', 'transferablePrincipleCount', 'contextOnlyCount',
    'nonTransferableCount', 'assetWarningCount', 'averageConfidence',
  ], 'summary')
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (
    value.findingCount !== findings.length
    || value.categoryCount !== new Set(findings.map((finding) => finding.category)).size
    || value.transferablePrincipleCount !== findings.filter((finding) => finding.transferability === 'transferable_principle').length
    || value.contextOnlyCount !== findings.filter((finding) => finding.transferability === 'context_only').length
    || value.nonTransferableCount !== findings.filter((finding) => finding.transferability === 'non_transferable').length
    || value.assetWarningCount !== findings.filter((finding) => finding.nonTransferableAssetWarning).length
    || typeof value.averageConfidence !== 'number'
    || !Number.isFinite(value.averageConfidence)
    || Math.abs(value.averageConfidence - average) > 0.000_001
  ) throw new Error('Audio/Sound Design summary does not match its findings.')
}

function validateExecution(
  request: EditReferenceAudioSoundDesignStudyRequest,
  runtimeSource: unknown,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design execution proof is invalid.')
  assertExactKeys(value, [
    'boundedPrivateAudioRead', 'technicalLoudnessResultRead', 'technicalLowLevelResultRead',
    'semanticAudioSoundDesignModelExecuted', 'rawFullMediaRead',
    'rawWaveformOrSpectrogramRead', 'externalUrlFetched', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryAudioCleaned', 'remoteMutationMade',
  ], 'execution proof')
  if (
    value.boundedPrivateAudioRead !== true
    || value.technicalLoudnessResultRead !== true
    || value.technicalLowLevelResultRead !== true
    || value.semanticAudioSoundDesignModelExecuted !== true
    || value.rawFullMediaRead !== false
    || value.rawWaveformOrSpectrogramRead !== false
    || value.externalUrlFetched !== false
    || value.modelCallMade !== true
    || typeof value.workerJobCreated !== 'boolean'
    || value.temporaryAudioCleaned !== true
    || value.remoteMutationMade !== false
    || request.audioSamples.length !== MAX_AUDIO_SAMPLE_COUNT
  ) throw new Error('Audio/Sound Design analyzed result lacks bounded execution proof.')
  if (runtimeSource === 'verified_local' && value.providerCallMade !== false) {
    throw new Error('Local Audio/Sound Design execution cannot claim a provider call.')
  }
  if (runtimeSource === 'verified_live' && value.providerCallMade !== true) {
    throw new Error('Live Audio/Sound Design execution requires provider-call proof.')
  }
}

function validateAnalyzer(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design analyzer provenance is invalid.')
  assertExactKeys(value, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRoutingPolicyVersion',
    'modelRevision', 'modelAggregateSha256', 'analysisInstructionDigestSha256',
  ], 'analyzer provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], 'Audio/Sound Design analyzer provenance ID is invalid.')
  }
  assertSha256(value.modelAggregateSha256, 'Audio/Sound Design model checksum is invalid.')
  assertSha256(value.analysisInstructionDigestSha256, 'Audio/Sound Design instruction digest is invalid.')
  if (runtimeSource === 'verified_local') {
    if (value.providerId !== null) throw new Error('Local Audio/Sound Design analyzer cannot claim a provider.')
  } else assertId(value.providerId, 'Live Audio/Sound Design analyzer requires a provider ID.')
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Audio/Sound Design execution ID is invalid.')
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt)
    || Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Audio/Sound Design provenance timestamps are invalid.')
  }
}

function validateUsage(request: EditReferenceAudioSoundDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design usage evidence is invalid.')
  assertExactKeys(value, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage evidence')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Audio/Sound Design metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 32, true, 'Audio/Sound Design usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 32, true, 'Audio/Sound Design internal-cost record IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.mode !== 'controlled_test_unmetered'
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as unknown[]).length !== 0
      || (value.internalCostRecordIds as unknown[]).length !== 0
    ) throw new Error('Controlled Audio/Sound Design tests cannot claim production cost records.')
  } else {
    if (
      value.mode !== 'production_metered'
      || value.approvedUsageEstimateId !== request.approvedUsageEstimateId
      || value.internalCostBudgetId !== request.internalCostBudgetId
      || value.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
      || value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
      || (value.usageEventIds as unknown[]).length < 1
      || (value.internalCostRecordIds as unknown[]).length < 1
    ) throw new Error('Production Audio/Sound Design execution requires exact internal-cost authority.')
    if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
      throw new Error('Audio/Sound Design execution exceeded its maximum authorized internal cost.')
    }
  }
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Audio/Sound Design usage crossed the customer-pricing boundary.')
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design privacy evidence is invalid.')
  assertExactKeys(value, [
    'rawFullMediaPersisted', 'rawAudioPersisted', 'rawWaveformOrSpectrogramPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
    'temporaryAudioCleaned',
  ], 'privacy evidence')
  for (const key of [
    'rawFullMediaPersisted', 'rawAudioPersisted', 'rawWaveformOrSpectrogramPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
  ] as const) if (value[key] !== false) throw new Error('Audio/Sound Design privacy boundary is invalid.')
  if (value.temporaryAudioCleaned !== true) throw new Error('Audio/Sound Design temporary audio must be cleaned.')
}

function validateCopySafety(value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design copy-safety evidence is invalid.')
  assertExactKeys(value, [
    'exactMusicAssetTransferInstructionCreated', 'exactSfxAssetTransferInstructionCreated',
    'exactMelodyLyricsOrHarmonyRetained', 'exactAudioFingerprintRetained',
    'exactBpmOrBeatGridTransferInstructionCreated', 'exactCueTimingMapTransferInstructionCreated',
    'exactDuckingCurveOrGainTransferInstructionCreated', 'exactMixSettingTransferInstructionCreated',
    'sourceAudioPromotedToInternalLibrary', 'referenceDerivedAudioGenerationInstructionCreated',
  ], 'copy-safety evidence')
  if (Object.values(value).some((entry) => entry !== false)) {
    throw new Error('Audio/Sound Design copy-safety boundary is invalid.')
  }
}

function validateAudioSafety(value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design safety evidence is invalid.')
  assertExactKeys(value, [
    'technicalSignalsTreatedAsSemanticIntent', 'lowLevelIntervalsTreatedAsSpeechPauses',
    'speechMeaningInferredWithoutVerifiedTiming', 'beatAlignmentClaimedWithoutBeatAuthority',
    'sfxTimingClaimedWithoutVisualCueAuthority', 'speechFirstPriorityRequired',
    'targetVoiceClarityQaRequired', 'targetMusicOverVoiceQaRequired',
    'targetSfxJustificationQaRequired', 'targetTimingValidationRequired',
    'randomSfxInstructionCreated',
  ], 'audio safety')
  for (const key of [
    'technicalSignalsTreatedAsSemanticIntent', 'lowLevelIntervalsTreatedAsSpeechPauses',
    'speechMeaningInferredWithoutVerifiedTiming', 'beatAlignmentClaimedWithoutBeatAuthority',
    'sfxTimingClaimedWithoutVisualCueAuthority', 'randomSfxInstructionCreated',
  ] as const) if (value[key] !== false) throw new Error('Audio/Sound Design safety boundary is invalid.')
  for (const key of [
    'speechFirstPriorityRequired', 'targetVoiceClarityQaRequired',
    'targetMusicOverVoiceQaRequired', 'targetSfxJustificationQaRequired',
    'targetTimingValidationRequired',
  ] as const) if (value[key] !== true) throw new Error('Audio/Sound Design target QA boundary is invalid.')
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design transfer boundary is invalid.')
  assertExactKeys(value, [
    'findingsMayBecomeTargetInstructionsWithoutApplication', 'targetEvidenceRequired',
    'targetAudioAnalysisRequired', 'targetSpeechPresenceAndTimingReviewRequired',
    'targetBeatAndOnsetAnalysisRequiredForBeatAlignment',
    'targetVisualCueLinkageRequiredForSfx', 'masterTimingPlanRequired',
    'soundSyncTransitionTimingPlanRequired', 'timingValidationRequired',
    'userApprovalRequired', 'userOwnedOrLicensedAudioRequiresSeparateTargetAssetApproval',
    'exactReferenceMusicOrSfxTransferAllowed',
  ], 'transfer boundary')
  if (
    value.findingsMayBecomeTargetInstructionsWithoutApplication !== false
    || value.targetEvidenceRequired !== true
    || value.targetAudioAnalysisRequired !== true
    || value.targetSpeechPresenceAndTimingReviewRequired !== true
    || value.targetBeatAndOnsetAnalysisRequiredForBeatAlignment !== true
    || value.targetVisualCueLinkageRequiredForSfx !== true
    || value.masterTimingPlanRequired !== true
    || value.soundSyncTransitionTimingPlanRequired !== true
    || value.timingValidationRequired !== true
    || value.userApprovalRequired !== true
    || value.userOwnedOrLicensedAudioRequiresSeparateTargetAssetApproval !== true
    || value.exactReferenceMusicOrSfxTransferAllowed !== false
  ) throw new Error('Audio/Sound Design transfer boundary is invalid.')
}

function normalizedEvidenceManifest(
  evidence: EditReferenceAudioSoundDesignEvidenceManifest,
): EditReferenceAudioSoundDesignEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...evidence.mediaStructureEvidenceIds].sort(),
    privateAudioEvidenceIds: [...evidence.privateAudioEvidenceIds].sort(),
    technicalLoudnessEvidenceIds: [...evidence.technicalLoudnessEvidenceIds].sort(),
    technicalLowLevelIntervalEvidenceIds: [...evidence.technicalLowLevelIntervalEvidenceIds].sort(),
    transcriptTimingEvidenceIds: [...evidence.transcriptTimingEvidenceIds].sort(),
    beatGridEvidenceIds: [...evidence.beatGridEvidenceIds].sort(),
    visualCueTimingEvidenceIds: [...evidence.visualCueTimingEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...evidence.studyChatGoalEvidenceIds].sort(),
    rightsAndAssetEvidenceIds: [...evidence.rightsAndAssetEvidenceIds].sort(),
  }
}

function validateMatchingEvidenceManifest(
  value: unknown,
  expected: EditReferenceAudioSoundDesignEvidenceManifest,
): void {
  if (!isRecord(value)) throw new Error('Audio/Sound Design result evidence manifest is invalid.')
  const normalized = normalizedEvidenceManifest(value as unknown as EditReferenceAudioSoundDesignEvidenceManifest)
  if (JSON.stringify(normalized) !== JSON.stringify(normalizedEvidenceManifest(expected))) {
    throw new Error('Audio/Sound Design result evidence manifest does not match the request.')
  }
}

function allEvidence(evidence: EditReferenceAudioSoundDesignEvidenceManifest): string[] {
  return Object.values(normalizedEvidenceManifest(evidence)).flat()
}

function assertNoForbiddenContent(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenContent(entry, `${path}[${index}]`))
    return
  }
  if (!isRecord(value)) {
    if (typeof value === 'string' && UNSAFE_STRING_PATTERN.test(value)) {
      throw new Error(`Audio/Sound Design ${path} contains unsafe content.`)
    }
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Audio/Sound Design ${path}.${key} is forbidden.`)
    assertNoForbiddenContent(entry, `${path}.${key}`)
  }
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`Audio/Sound Design ${label} fields are invalid.`)
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
}

function assertSha256(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new Error(message)
}

function assertMoneyMicros(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoneyMicros(value: unknown, message: string): asserts value is string {
  assertMoneyMicros(value, message)
  if (value === '0') throw new Error(message)
}

function assertIdArray(
  value: unknown,
  maxLength: number,
  allowEmpty: boolean,
  message: string,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length < 1)
    || value.length > maxLength
    || new Set(value).size !== value.length
    || value.some((entry) => typeof entry !== 'string' || !ID_PATTERN.test(entry))
  ) throw new Error(message)
}

function assertMatchingIdSet(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, MAX_EVIDENCE_ITEMS, expected.length === 0, message)
  if (!sameStringSet(value, expected)) throw new Error(message)
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function assertSafeStringArray(
  value: unknown,
  maxLength: number,
  allowEmpty: boolean,
  maxItemLength: number,
  message: string,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length < 1)
    || value.length > maxLength
    || new Set(value).size !== value.length
    || value.some((entry) => typeof entry !== 'string' || !entry.trim()
      || entry.length > maxItemLength || UNSAFE_STRING_PATTERN.test(entry))
  ) throw new Error(message)
}

function assertUnitInterval(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(message)
}

function assertPositiveFinite(value: unknown, max: number, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max) throw new Error(message)
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.length === sortedRight.length
    && sortedLeft.every((entry, index) => entry === sortedRight[index])
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
