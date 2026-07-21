import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_SPEECH_PACING_STUDY_REQUEST_VERSION =
  'edit-reference-speech-pacing-study-request-v1' as const
export const EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION =
  'edit-reference-speech-pacing-study-result-v1' as const

export type EditReferenceSpeechPacingFindingCategory =
  | 'transcript_structure'
  | 'segment_timing'
  | 'word_timing'
  | 'speaker_turn_pattern'
  | 'pause_pattern'
  | 'sentence_rhythm'
  | 'hook_phrasing_function'
  | 'speech_density'
  | 'safe_cut_opportunity'
  | 'caption_timing_evidence'

export type EditReferenceSpeechPacingTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceSpeechPacingTimingBasis =
  | 'segment'
  | 'word'
  | 'speaker_turn'
  | 'mixed'

export type EditReferenceSpeechPacingSegmentTimingMode =
  | 'model_reported'
  | 'forced_alignment_verified'

export type EditReferenceSpeechPacingWordTimingMode =
  | 'not_available'
  | 'model_aligned'
  | 'forced_alignment_verified'

export type EditReferenceSpeechPacingSpeakerSegmentationMode =
  | 'not_requested'
  | 'verified_diarization'

export interface EditReferenceSpeechPacingEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly privateAudioEvidenceIds: readonly string[]
  readonly transcriptEvidenceIds: readonly string[]
  readonly segmentTimingEvidenceIds: readonly string[]
  readonly wordTimingEvidenceIds: readonly string[]
  readonly speakerSegmentationEvidenceIds: readonly string[]
  readonly technicalLowLevelIntervalEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly factSafetyEvidenceIds: readonly string[]
}

export interface EditReferenceSpeechPacingStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_SPEECH_PACING_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly privateAudioArtifactId: string
  readonly audioChecksumSha256: string
  readonly privateTranscriptArtifactId: string
  readonly transcriptChecksumSha256: string
  readonly privateWordTimingArtifactId: string | null
  readonly wordTimingChecksumSha256: string | null
  readonly privateSpeakerSegmentationArtifactId: string | null
  readonly speakerSegmentationChecksumSha256: string | null
  readonly evidenceManifestDigestSha256: string
  readonly privateMediaAccessVerified: true
  readonly privateMediaFinalized: true
  readonly mediaChecksumVerified: true
  readonly privateAudioAccessVerified: true
  readonly privateAudioFinalized: true
  readonly audioChecksumVerified: true
  readonly privateTranscriptAccessVerified: true
  readonly privateTranscriptFinalized: true
  readonly transcriptChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly transcriptRuntimeExecuted: true
  readonly transcriptQaStatus: 'passed' | 'warning'
  readonly transcriptRuntimeSource: 'verified_local' | 'verified_live'
  readonly transcriptRuntimeId: string
  readonly transcriptRuntimeVersion: string
  readonly transcriptModelManifestId: string
  readonly transcriptExecutionId: string
  readonly transcriptLanguage: string
  readonly transcriptConfidence: number
  readonly segmentTimingMode: EditReferenceSpeechPacingSegmentTimingMode
  readonly segmentTimingAuthorityVerified: true
  readonly wordTimingMode: EditReferenceSpeechPacingWordTimingMode
  readonly wordTimingAuthorityVerified: boolean
  readonly speakerSegmentationMode: EditReferenceSpeechPacingSpeakerSegmentationMode
  readonly speakerSegmentationAuthorityVerified: boolean
  readonly sourceDurationSeconds: number
  readonly analysisWindowStartSeconds: number
  readonly analysisWindowEndSeconds: number
  readonly transcriptSegmentCount: number
  readonly alignedWordCount: number
  readonly speakerSegmentCount: number
  readonly evidence: EditReferenceSpeechPacingEvidenceManifest
  readonly sourceClaimsPresent: boolean
  readonly maxEvidenceItems: number
  readonly maxStructuredContextCharacters: number
  readonly maxScanDurationSeconds: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly boundedPrivateTranscriptInputAllowed: true
  readonly rawMediaInputAllowed: false
  readonly rawAudioInputAllowed: false
  readonly rawTranscriptInRequestAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly mockTranscriptInputAllowed: false
  readonly interpolatedWordTimingAllowed: false
  readonly exactReferenceWordingTransferAllowed: false
  readonly exactReferenceTimingTransferAllowed: false
  readonly referenceVoiceIdentityTransferAllowed: false
  readonly executableCutInstructionAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceSpeechPacingSourceRange {
  readonly rangeId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly timingBasis: EditReferenceSpeechPacingTimingBasis
  readonly evidenceIds: readonly string[]
  readonly sourceEvidenceOnly: true
  readonly executableCutBoundaryCreated: false
  readonly targetTimingInstructionCreated: false
}

export interface EditReferenceSpeechPacingFinding {
  readonly findingId: string
  readonly category: EditReferenceSpeechPacingFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly sourceRanges: readonly EditReferenceSpeechPacingSourceRange[]
  readonly confidence: number
  readonly transferability: EditReferenceSpeechPacingTransferability
  readonly timingBasis: EditReferenceSpeechPacingTimingBasis
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly meaningPreservationRequired: boolean
  readonly claimRelated: boolean
  readonly factSafetyStatus: 'not_applicable' | 'bounded_by_evidence' | 'requires_review'
  readonly exactReferenceWordingRetained: false
  readonly exactReferenceTimingTransferInstructionCreated: false
  readonly exactReferenceSentenceStructureCopyInstructionCreated: false
  readonly executableCutInstructionCreated: false
  readonly captionTextCopied: false
  readonly voiceIdentityOrImitationInstructionCreated: false
}

export interface EditReferenceAnalyzedSpeechPacingStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'analyzed'
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly privateAudioArtifactId: string
  readonly audioChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly evidence: EditReferenceSpeechPacingEvidenceManifest
  readonly transcriptAuthority: {
    readonly privateTranscriptArtifactId: string
    readonly transcriptChecksumSha256: string
    readonly privateWordTimingArtifactId: string | null
    readonly wordTimingChecksumSha256: string | null
    readonly privateSpeakerSegmentationArtifactId: string | null
    readonly speakerSegmentationChecksumSha256: string | null
    readonly transcriptRuntimeSource: 'verified_local' | 'verified_live'
    readonly transcriptRuntimeId: string
    readonly transcriptRuntimeVersion: string
    readonly transcriptModelManifestId: string
    readonly transcriptExecutionId: string
    readonly transcriptLanguage: string
    readonly transcriptConfidence: number
    readonly transcriptQaStatus: 'passed' | 'warning'
    readonly segmentTimingMode: EditReferenceSpeechPacingSegmentTimingMode
    readonly segmentTimingAuthorityVerified: true
    readonly wordTimingMode: EditReferenceSpeechPacingWordTimingMode
    readonly wordTimingAuthorityVerified: boolean
    readonly speakerSegmentationMode: EditReferenceSpeechPacingSpeakerSegmentationMode
    readonly speakerSegmentationAuthorityVerified: boolean
    readonly transcriptSegmentCount: number
    readonly alignedWordCount: number
    readonly speakerSegmentCount: number
    readonly mockTranscriptUsed: false
    readonly interpolatedWordTimingUsed: false
    readonly transcriptTextEmbeddedInResult: false
  }
  readonly findings: readonly EditReferenceSpeechPacingFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly sourceDurationSeconds: number
    readonly analysisWindowStartSeconds: number
    readonly analysisWindowEndSeconds: number
    readonly analyzedDurationSeconds: number
    readonly transcriptSegmentCount: number
    readonly alignedWordCount: number
    readonly speakerSegmentCount: number
    readonly transcriptLanguage: string
    readonly segmentTimingMode: EditReferenceSpeechPacingSegmentTimingMode
    readonly wordTimingMode: EditReferenceSpeechPacingWordTimingMode
    readonly speakerSegmentationMode: EditReferenceSpeechPacingSpeakerSegmentationMode
    readonly captionTimingPrecision: 'segment' | 'word'
    readonly partial: boolean
    readonly missingEvidenceKinds: readonly string[]
  }
  readonly summary: {
    readonly findingCount: number
    readonly categoryCount: number
    readonly transferablePrincipleCount: number
    readonly contextOnlyCount: number
    readonly nonTransferableCount: number
    readonly averageConfidence: number
  }
  readonly execution: {
    readonly privateTranscriptArtifactRead: true
    readonly structuredTimingEvidenceRead: true
    readonly semanticSpeechPacingModelExecuted: true
    readonly rawMediaRead: false
    readonly rawAudioRead: false
    readonly mockTranscriptUsed: false
    readonly interpolatedWordTimingUsed: false
    readonly rawTranscriptPersistedInStudyResult: false
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
    readonly rawMediaPersisted: false
    readonly rawAudioPersisted: false
    readonly rawTranscriptEmbeddedInStudyResult: false
    readonly transcriptTextPersistedByStudyAnalyzer: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryAudioCleaned: true
  }
  readonly copySafety: {
    readonly exactHookWordingRetained: false
    readonly exactSentenceStructureCopyInstructionCreated: false
    readonly exactPauseMapCopyInstructionCreated: false
    readonly exactCutMapCopyInstructionCreated: false
    readonly exactCaptionTextRetained: false
    readonly voiceIdentityOrImitationInstructionCreated: false
    readonly exactReferenceTimingTransferInstructionCreated: false
  }
  readonly factSafety: {
    readonly claimEvidenceRequired: boolean
    readonly claimEvidenceIds: readonly string[]
    readonly unverifiedClaimPresentedAsFact: false
    readonly sourceAttributionRemoved: false
    readonly guiltImplyingInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly technicalLowLevelIntervalsTreatedAsSemanticPauses: false
    readonly interpolatedTimingTreatedAsAligned: false
    readonly sourceTranscriptTreatedAsTargetScript: false
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly sourceCutOpportunityMayExecuteWithoutTargetMeaningReview: false
    readonly targetEvidenceRequired: true
    readonly meaningPreservationReviewRequired: true
    readonly userApprovalRequired: true
    readonly exactWordingOrTimingTransferAllowed: false
  }
}

export type EditReferenceSpeechPacingStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'private_audio_unavailable'
  | 'transcript_artifact_unavailable'
  | 'transcript_authority_unverified'
  | 'transcript_runtime_unavailable'
  | 'segment_timing_unavailable'
  | 'word_timing_authority_unverified'
  | 'speaker_segmentation_authority_unverified'
  | 'evidence_authority_unverified'
  | 'fact_safety_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedSpeechPacingStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceSpeechPacingStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly privateTranscriptArtifactRead: boolean
  readonly structuredTimingEvidenceRead: boolean
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly temporaryAudioCleaned: true
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceSpeechPacingStudyResult =
  | EditReferenceAnalyzedSpeechPacingStudyResult
  | EditReferenceBlockedSpeechPacingStudyResult

export interface EditReferenceSpeechPacingStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceSpeechPacingStudyRequest): Promise<EditReferenceSpeechPacingStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const LANGUAGE_PATTERN = /^(?:und|[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*)$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_TRANSCRIPT_SEGMENTS = 1_000
const MAX_ALIGNED_WORDS = 10_000
const MAX_SPEAKER_SEGMENTS = 1_000
const MAX_FINDINGS = 64
const MAX_SOURCE_RANGES_PER_FINDING = 8
const FINDING_CATEGORIES = new Set<EditReferenceSpeechPacingFindingCategory>([
  'transcript_structure',
  'segment_timing',
  'word_timing',
  'speaker_turn_pattern',
  'pause_pattern',
  'sentence_rhythm',
  'hook_phrasing_function',
  'speech_density',
  'safe_cut_opportunity',
  'caption_timing_evidence',
])
const TRANSFERABILITIES = new Set<EditReferenceSpeechPacingTransferability>([
  'transferable_principle',
  'context_only',
  'non_transferable',
])
const TIMING_BASES = new Set<EditReferenceSpeechPacingTimingBasis>([
  'segment',
  'word',
  'speaker_turn',
  'mixed',
])
const SEGMENT_TIMING_MODES = new Set<EditReferenceSpeechPacingSegmentTimingMode>([
  'model_reported',
  'forced_alignment_verified',
])
const WORD_TIMING_MODES = new Set<EditReferenceSpeechPacingWordTimingMode>([
  'not_available',
  'model_aligned',
  'forced_alignment_verified',
])
const SPEAKER_MODES = new Set<EditReferenceSpeechPacingSpeakerSegmentationMode>([
  'not_requested',
  'verified_diarization',
])
const BLOCKER_CODES = new Set<EditReferenceSpeechPacingStudyBlockerCode>([
  'adapter_unavailable',
  'private_artifact_unavailable',
  'private_audio_unavailable',
  'transcript_artifact_unavailable',
  'transcript_authority_unverified',
  'transcript_runtime_unavailable',
  'segment_timing_unavailable',
  'word_timing_authority_unverified',
  'speaker_segmentation_authority_unverified',
  'evidence_authority_unverified',
  'fact_safety_evidence_required',
  'cost_authority_unavailable',
  'model_routing_unavailable',
  'privacy_policy_denied',
  'runtime_response_invalid',
  'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey',
  'api_key',
  'authorization',
  'audioBytes',
  'audioPath',
  'bytes',
  'chainOfThought',
  'chain_of_thought',
  'filePath',
  'file_path',
  'fullText',
  'hiddenReasoning',
  'localPath',
  'local_path',
  'password',
  'payload',
  'prompt',
  'rawAudio',
  'rawMedia',
  'rawPayload',
  'rawProviderPayload',
  'rawTranscript',
  'secret',
  'segments',
  'signedUrl',
  'signed_url',
  'token',
  'tokens',
  'transcriptText',
  'url',
  'words',
])
const UNSAFE_STRING_PATTERN =
  /https?:\/\/|file:\/\/|(?:^|[\s"'\x60])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

function stableRequestPayload(request: EditReferenceSpeechPacingStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    privateAudioArtifactId: request.privateAudioArtifactId,
    audioChecksumSha256: request.audioChecksumSha256,
    privateTranscriptArtifactId: request.privateTranscriptArtifactId,
    transcriptChecksumSha256: request.transcriptChecksumSha256,
    privateWordTimingArtifactId: request.privateWordTimingArtifactId,
    wordTimingChecksumSha256: request.wordTimingChecksumSha256,
    privateSpeakerSegmentationArtifactId: request.privateSpeakerSegmentationArtifactId,
    speakerSegmentationChecksumSha256: request.speakerSegmentationChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    privateMediaAccessVerified: request.privateMediaAccessVerified,
    privateMediaFinalized: request.privateMediaFinalized,
    mediaChecksumVerified: request.mediaChecksumVerified,
    privateAudioAccessVerified: request.privateAudioAccessVerified,
    privateAudioFinalized: request.privateAudioFinalized,
    audioChecksumVerified: request.audioChecksumVerified,
    privateTranscriptAccessVerified: request.privateTranscriptAccessVerified,
    privateTranscriptFinalized: request.privateTranscriptFinalized,
    transcriptChecksumVerified: request.transcriptChecksumVerified,
    evidenceAuthorityVerified: request.evidenceAuthorityVerified,
    transcriptRuntimeExecuted: request.transcriptRuntimeExecuted,
    transcriptQaStatus: request.transcriptQaStatus,
    transcriptRuntimeSource: request.transcriptRuntimeSource,
    transcriptRuntimeId: request.transcriptRuntimeId,
    transcriptRuntimeVersion: request.transcriptRuntimeVersion,
    transcriptModelManifestId: request.transcriptModelManifestId,
    transcriptExecutionId: request.transcriptExecutionId,
    transcriptLanguage: request.transcriptLanguage,
    transcriptConfidence: request.transcriptConfidence,
    segmentTimingMode: request.segmentTimingMode,
    segmentTimingAuthorityVerified: request.segmentTimingAuthorityVerified,
    wordTimingMode: request.wordTimingMode,
    wordTimingAuthorityVerified: request.wordTimingAuthorityVerified,
    speakerSegmentationMode: request.speakerSegmentationMode,
    speakerSegmentationAuthorityVerified: request.speakerSegmentationAuthorityVerified,
    sourceDurationSeconds: request.sourceDurationSeconds,
    analysisWindowStartSeconds: request.analysisWindowStartSeconds,
    analysisWindowEndSeconds: request.analysisWindowEndSeconds,
    transcriptSegmentCount: request.transcriptSegmentCount,
    alignedWordCount: request.alignedWordCount,
    speakerSegmentCount: request.speakerSegmentCount,
    evidence: normalizedEvidenceManifest(request.evidence),
    sourceClaimsPresent: request.sourceClaimsPresent,
    maxEvidenceItems: request.maxEvidenceItems,
    maxStructuredContextCharacters: request.maxStructuredContextCharacters,
    maxScanDurationSeconds: request.maxScanDurationSeconds,
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    boundedPrivateTranscriptInputAllowed: request.boundedPrivateTranscriptInputAllowed,
    rawMediaInputAllowed: request.rawMediaInputAllowed,
    rawAudioInputAllowed: request.rawAudioInputAllowed,
    rawTranscriptInRequestAllowed: request.rawTranscriptInRequestAllowed,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    mockTranscriptInputAllowed: request.mockTranscriptInputAllowed,
    interpolatedWordTimingAllowed: request.interpolatedWordTimingAllowed,
    exactReferenceWordingTransferAllowed: request.exactReferenceWordingTransferAllowed,
    exactReferenceTimingTransferAllowed: request.exactReferenceTimingTransferAllowed,
    referenceVoiceIdentityTransferAllowed: request.referenceVoiceIdentityTransferAllowed,
    executableCutInstructionAllowed: request.executableCutInstructionAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
    serviceFeeCalculationAllowed: request.serviceFeeCalculationAllowed,
  })
}

export function hashEditReferenceSpeechPacingStudyRequest(
  request: EditReferenceSpeechPacingStudyRequest,
): string {
  validateEditReferenceSpeechPacingStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceSpeechPacingStudyRequest(
  value: unknown,
): asserts value is EditReferenceSpeechPacingStudyRequest {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Speech/Pacing study request must be an object.')
  assertExactKeys(value, [
    'schemaVersion',
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'privateAudioArtifactId',
    'audioChecksumSha256',
    'privateTranscriptArtifactId',
    'transcriptChecksumSha256',
    'privateWordTimingArtifactId',
    'wordTimingChecksumSha256',
    'privateSpeakerSegmentationArtifactId',
    'speakerSegmentationChecksumSha256',
    'evidenceManifestDigestSha256',
    'privateMediaAccessVerified',
    'privateMediaFinalized',
    'mediaChecksumVerified',
    'privateAudioAccessVerified',
    'privateAudioFinalized',
    'audioChecksumVerified',
    'privateTranscriptAccessVerified',
    'privateTranscriptFinalized',
    'transcriptChecksumVerified',
    'evidenceAuthorityVerified',
    'transcriptRuntimeExecuted',
    'transcriptQaStatus',
    'transcriptRuntimeSource',
    'transcriptRuntimeId',
    'transcriptRuntimeVersion',
    'transcriptModelManifestId',
    'transcriptExecutionId',
    'transcriptLanguage',
    'transcriptConfidence',
    'segmentTimingMode',
    'segmentTimingAuthorityVerified',
    'wordTimingMode',
    'wordTimingAuthorityVerified',
    'speakerSegmentationMode',
    'speakerSegmentationAuthorityVerified',
    'sourceDurationSeconds',
    'analysisWindowStartSeconds',
    'analysisWindowEndSeconds',
    'transcriptSegmentCount',
    'alignedWordCount',
    'speakerSegmentCount',
    'evidence',
    'sourceClaimsPresent',
    'maxEvidenceItems',
    'maxStructuredContextCharacters',
    'maxScanDurationSeconds',
    'executionScope',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros',
    'boundedPrivateTranscriptInputAllowed',
    'rawMediaInputAllowed',
    'rawAudioInputAllowed',
    'rawTranscriptInRequestAllowed',
    'externalUrlFetchAllowed',
    'mockTranscriptInputAllowed',
    'interpolatedWordTimingAllowed',
    'exactReferenceWordingTransferAllowed',
    'exactReferenceTimingTransferAllowed',
    'referenceVoiceIdentityTransferAllowed',
    'executableCutInstructionAllowed',
    'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_SPEECH_PACING_STUDY_REQUEST_VERSION) {
    throw new Error('Speech/Pacing study request version is unsupported.')
  }
  for (const key of [
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'privateAudioArtifactId',
    'privateTranscriptArtifactId',
    'transcriptRuntimeId',
    'transcriptRuntimeVersion',
    'transcriptModelManifestId',
    'transcriptExecutionId',
  ] as const) {
    assertId(value[key], 'Speech/Pacing ' + key + ' is invalid.')
  }
  for (const key of [
    'mediaChecksumSha256',
    'audioChecksumSha256',
    'transcriptChecksumSha256',
    'evidenceManifestDigestSha256',
  ] as const) {
    assertSha256(value[key], 'Speech/Pacing ' + key + ' is invalid.')
  }
  for (const key of [
    'privateMediaAccessVerified',
    'privateMediaFinalized',
    'mediaChecksumVerified',
    'privateAudioAccessVerified',
    'privateAudioFinalized',
    'audioChecksumVerified',
    'privateTranscriptAccessVerified',
    'privateTranscriptFinalized',
    'transcriptChecksumVerified',
    'evidenceAuthorityVerified',
    'transcriptRuntimeExecuted',
  ] as const) {
    if (value[key] !== true) throw new Error('Speech/Pacing artifact, evidence, or transcript authority is incomplete.')
  }
  if (value.transcriptQaStatus !== 'passed' && value.transcriptQaStatus !== 'warning') {
    throw new Error('Speech/Pacing transcript QA status is invalid.')
  }
  if (value.transcriptRuntimeSource !== 'verified_local' && value.transcriptRuntimeSource !== 'verified_live') {
    throw new Error('Speech/Pacing transcript runtime source is invalid.')
  }
  if (typeof value.transcriptLanguage !== 'string' || !LANGUAGE_PATTERN.test(value.transcriptLanguage)) {
    throw new Error('Speech/Pacing transcript language is invalid.')
  }
  assertUnitInterval(value.transcriptConfidence, 'Speech/Pacing transcript confidence is invalid.', true)
  if (!SEGMENT_TIMING_MODES.has(value.segmentTimingMode as EditReferenceSpeechPacingSegmentTimingMode)) {
    throw new Error('Speech/Pacing segment-timing mode is invalid.')
  }
  if (value.segmentTimingAuthorityVerified !== true) {
    throw new Error('Speech/Pacing segment-timing authority must be verified.')
  }
  if (!WORD_TIMING_MODES.has(value.wordTimingMode as EditReferenceSpeechPacingWordTimingMode)) {
    throw new Error('Speech/Pacing word-timing mode is invalid.')
  }
  if (!SPEAKER_MODES.has(value.speakerSegmentationMode as EditReferenceSpeechPacingSpeakerSegmentationMode)) {
    throw new Error('Speech/Pacing speaker-segmentation mode is invalid.')
  }
  if (value.wordTimingAuthorityVerified !== (value.wordTimingMode !== 'not_available')) {
    throw new Error('Speech/Pacing word-timing authority does not match its mode.')
  }
  if (value.speakerSegmentationAuthorityVerified !== (value.speakerSegmentationMode !== 'not_requested')) {
    throw new Error('Speech/Pacing speaker-segmentation authority does not match its mode.')
  }
  validateArtifactMode(
    value.wordTimingMode,
    value.privateWordTimingArtifactId,
    value.wordTimingChecksumSha256,
    value.alignedWordCount,
    'word timing',
    MAX_ALIGNED_WORDS,
  )
  validateArtifactMode(
    value.speakerSegmentationMode,
    value.privateSpeakerSegmentationArtifactId,
    value.speakerSegmentationChecksumSha256,
    value.speakerSegmentCount,
    'speaker segmentation',
    MAX_SPEAKER_SEGMENTS,
  )
  assertPositiveFinite(value.sourceDurationSeconds, 'Speech/Pacing source duration is invalid.')
  assertNonNegativeFinite(value.analysisWindowStartSeconds, 'Speech/Pacing analysis-window start is invalid.')
  assertPositiveFinite(value.analysisWindowEndSeconds, 'Speech/Pacing analysis-window end is invalid.')
  const windowDuration = Number(value.analysisWindowEndSeconds) - Number(value.analysisWindowStartSeconds)
  if (
    windowDuration <= 0
    || Number(value.analysisWindowEndSeconds) > Number(value.sourceDurationSeconds) + 0.001
    || windowDuration > MAX_SCAN_DURATION_SECONDS + 0.001
  ) {
    throw new Error('Speech/Pacing analysis window is outside the approved source or duration bound.')
  }
  assertBoundedInteger(value.transcriptSegmentCount, 1, MAX_TRANSCRIPT_SEGMENTS, 'Speech/Pacing transcript segment count is invalid.')
  if (value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS) throw new Error('Speech/Pacing evidence-item bound is invalid.')
  if (value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS) {
    throw new Error('Speech/Pacing structured-context bound is invalid.')
  }
  if (value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS) {
    throw new Error('Speech/Pacing scan-duration bound is invalid.')
  }
  if (typeof value.sourceClaimsPresent !== 'boolean') throw new Error('Speech/Pacing claim-presence flag is invalid.')
  const request = value as unknown as EditReferenceSpeechPacingStudyRequest
  validateEvidenceManifest(request)
  validateCostAuthority(request)
  if (value.boundedPrivateTranscriptInputAllowed !== true) {
    throw new Error('Speech/Pacing bounded private transcript input must remain explicitly allowed.')
  }
  for (const key of [
    'rawMediaInputAllowed',
    'rawAudioInputAllowed',
    'rawTranscriptInRequestAllowed',
    'externalUrlFetchAllowed',
    'mockTranscriptInputAllowed',
    'interpolatedWordTimingAllowed',
    'exactReferenceWordingTransferAllowed',
    'exactReferenceTimingTransferAllowed',
    'referenceVoiceIdentityTransferAllowed',
    'executableCutInstructionAllowed',
    'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing safety boundary ' + key + ' must remain false.')
  }
}

export function validateEditReferenceSpeechPacingStudyResult(
  request: EditReferenceSpeechPacingStudyRequest,
  value: unknown,
): asserts value is EditReferenceSpeechPacingStudyResult {
  validateEditReferenceSpeechPacingStudyRequest(request)
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Speech/Pacing study result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION) {
    throw new Error('Speech/Pacing study result version is unsupported.')
  }
  if (value.requestDigestSha256 !== hashEditReferenceSpeechPacingStudyRequest(request)) {
    throw new Error('Speech/Pacing study result does not match the exact request.')
  }
  if (value.status === 'blocked') {
    validateBlockedResult(request, value)
    return
  }
  if (value.status !== 'analyzed') throw new Error('Speech/Pacing study result status is unsupported.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceSpeechPacingStudyResult(input: {
  readonly request: EditReferenceSpeechPacingStudyRequest
  readonly blockerCode: EditReferenceSpeechPacingStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly privateTranscriptArtifactRead?: boolean
    readonly structuredTimingEvidenceRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
  }
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedSpeechPacingStudyResult {
  const result: EditReferenceBlockedSpeechPacingStudyResult = {
    schemaVersion: EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceSpeechPacingStudyRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryAvailable ? (input.retryReason ?? null) : null,
    findings: [],
    privateTranscriptArtifactRead: input.execution?.privateTranscriptArtifactRead ?? false,
    structuredTimingEvidenceRead: input.execution?.structuredTimingEvidenceRead ?? false,
    providerCallMade: input.execution?.providerCallMade ?? false,
    modelCallMade: input.execution?.modelCallMade ?? false,
    workerJobCreated: input.execution?.workerJobCreated ?? false,
    temporaryAudioCleaned: true,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceSpeechPacingStudyResult(input.request, result)
  return result
}

function validateArtifactMode(
  mode: unknown,
  artifactId: unknown,
  checksum: unknown,
  count: unknown,
  label: string,
  maxCount: number,
): void {
  const unavailable = mode === 'not_available' || mode === 'not_requested'
  if (unavailable) {
    if (artifactId !== null || checksum !== null || count !== 0) {
      throw new Error('Speech/Pacing unavailable ' + label + ' cannot claim an artifact, checksum, or count.')
    }
    return
  }
  assertId(artifactId, 'Speech/Pacing ' + label + ' artifact ID is invalid.')
  assertSha256(checksum, 'Speech/Pacing ' + label + ' checksum is invalid.')
  assertBoundedInteger(count, 1, maxCount, 'Speech/Pacing ' + label + ' count is invalid.')
}

function validateEvidenceManifest(request: EditReferenceSpeechPacingStudyRequest): void {
  const value = request.evidence
  if (!isRecord(value)) throw new Error('Speech/Pacing evidence manifest is invalid.')
  const keys = evidenceManifestKeys()
  assertExactKeys(value, keys, 'evidence manifest')
  for (const key of keys) {
    assertIdArray(value[key], request.maxEvidenceItems, true, 'Speech/Pacing ' + key + ' is invalid.')
  }
  for (const key of [
    'mediaStructureEvidenceIds',
    'privateAudioEvidenceIds',
    'transcriptEvidenceIds',
    'segmentTimingEvidenceIds',
    'studyChatGoalEvidenceIds',
  ] as const) {
    if ((value[key] as string[]).length < 1) throw new Error('Speech/Pacing ' + key + ' requires approved evidence.')
  }
  const wordEvidence = value.wordTimingEvidenceIds as string[]
  if ((request.wordTimingMode === 'not_available') !== (wordEvidence.length === 0)) {
    throw new Error('Speech/Pacing word-timing evidence does not match its authority mode.')
  }
  const speakerEvidence = value.speakerSegmentationEvidenceIds as string[]
  if ((request.speakerSegmentationMode === 'not_requested') !== (speakerEvidence.length === 0)) {
    throw new Error('Speech/Pacing speaker evidence does not match its authority mode.')
  }
  if (request.sourceClaimsPresent && (value.factSafetyEvidenceIds as string[]).length < 1) {
    throw new Error('Speech/Pacing claim-bearing source requires fact-safety evidence.')
  }
  const allIds = evidenceIds(value as unknown as EditReferenceSpeechPacingEvidenceManifest)
  if (allIds.length > request.maxEvidenceItems || new Set(allIds).size !== allIds.length) {
    throw new Error('Speech/Pacing evidence manifest exceeds its bound or repeats evidence IDs.')
  }
}

function validateCostAuthority(request: EditReferenceSpeechPacingStudyRequest): void {
  if (request.executionScope !== 'controlled_test' && request.executionScope !== 'production') {
    throw new Error('Speech/Pacing execution scope is invalid.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      request.approvedUsageEstimateId !== null
      || request.internalCostBudgetId !== null
      || request.immutableRateCardSnapshotId !== null
      || request.maximumAuthorizedInternalCostMicros !== null
    ) {
      throw new Error('Controlled Speech/Pacing tests cannot claim production cost authority.')
    }
    return
  }
  assertId(request.approvedUsageEstimateId, 'Production Speech/Pacing study requires an approved usage estimate.')
  assertId(request.internalCostBudgetId, 'Production Speech/Pacing study requires an internal cost budget.')
  assertId(request.immutableRateCardSnapshotId, 'Production Speech/Pacing study requires an immutable rate-card snapshot.')
  assertPositiveMoneyMicros(
    request.maximumAuthorizedInternalCostMicros,
    'Production Speech/Pacing study requires a positive maximum authorized internal cost.',
  )
}

function validateBlockedResult(
  request: EditReferenceSpeechPacingStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'blockerCode',
    'blockerMessage',
    'retryAvailable',
    'retryReason',
    'findings',
    'privateTranscriptArtifactRead',
    'structuredTimingEvidenceRead',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
    'temporaryAudioCleaned',
    'internalCostStatus',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'remoteMutationMade',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceSpeechPacingStudyBlockerCode)) {
    throw new Error('Speech/Pacing blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 600, 'Speech/Pacing blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Speech/Pacing retry flag is invalid.')
  if (value.retryAvailable) {
    assertSafeText(value.retryReason, 600, 'Retryable Speech/Pacing blockers require a safe reason.')
  } else if (value.retryReason !== null) {
    throw new Error('Non-retryable Speech/Pacing blockers cannot include a retry reason.')
  }
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Speech/Pacing results cannot contain findings.')
  }
  for (const key of [
    'privateTranscriptArtifactRead',
    'structuredTimingEvidenceRead',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
  ] as const) {
    if (typeof value[key] !== 'boolean') throw new Error('Blocked Speech/Pacing execution evidence is invalid.')
  }
  if (
    value.temporaryAudioCleaned !== true
    || value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Blocked Speech/Pacing result crossed a cleanup, remote, or customer-charging boundary.')
  }
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Speech/Pacing internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Speech/Pacing internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Speech/Pacing usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Speech/Pacing internal-cost record IDs are invalid.')
  const executionStarted = value.providerCallMade === true || value.modelCallMade === true || value.workerJobCreated === true
  if (request.executionScope === 'controlled_test') {
    if (
      value.providerCallMade === true
      || value.workerJobCreated === true
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Speech/Pacing blockers cannot claim paid execution or cost.')
  } else if (executionStarted) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Speech/Pacing execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Speech/Pacing execution cannot claim that no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Speech/Pacing cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Speech/Pacing execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Speech/Pacing execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) {
    throw new Error('Unstarted Speech/Pacing blockers cannot claim internal-cost usage.')
  }
}

function validateAnalyzedResult(
  request: EditReferenceSpeechPacingStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'runtimeSource',
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'privateAudioArtifactId',
    'audioChecksumSha256',
    'evidenceManifestDigestSha256',
    'evidence',
    'transcriptAuthority',
    'findings',
    'coverage',
    'summary',
    'execution',
    'analyzer',
    'provenance',
    'usage',
    'privacy',
    'copySafety',
    'factSafety',
    'transferBoundary',
  ], 'analyzed result')
  if (value.runtimeSource !== 'verified_local' && value.runtimeSource !== 'verified_live') {
    throw new Error('Speech/Pacing analyzed runtime source is invalid.')
  }
  for (const key of [
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'privateAudioArtifactId',
    'audioChecksumSha256',
    'evidenceManifestDigestSha256',
  ] as const) {
    if (value[key] !== request[key]) throw new Error('Speech/Pacing analyzed identity or lineage does not match the request.')
  }
  validateMatchingEvidenceManifest(request.evidence, value.evidence)
  validateTranscriptAuthority(request, value.transcriptAuthority)
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(value.runtimeSource, value.execution)
  validateAnalyzer(value.runtimeSource, value.analyzer)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validatePrivacy(value.privacy)
  validateAllFalseObject(value.copySafety, [
    'exactHookWordingRetained',
    'exactSentenceStructureCopyInstructionCreated',
    'exactPauseMapCopyInstructionCreated',
    'exactCutMapCopyInstructionCreated',
    'exactCaptionTextRetained',
    'voiceIdentityOrImitationInstructionCreated',
    'exactReferenceTimingTransferInstructionCreated',
  ], 'Speech/Pacing copy-safety boundary is invalid.')
  validateFactSafety(request, value.factSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateTranscriptAuthority(request: EditReferenceSpeechPacingStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing transcript authority is invalid.')
  assertExactKeys(value, [
    'privateTranscriptArtifactId',
    'transcriptChecksumSha256',
    'privateWordTimingArtifactId',
    'wordTimingChecksumSha256',
    'privateSpeakerSegmentationArtifactId',
    'speakerSegmentationChecksumSha256',
    'transcriptRuntimeSource',
    'transcriptRuntimeId',
    'transcriptRuntimeVersion',
    'transcriptModelManifestId',
    'transcriptExecutionId',
    'transcriptLanguage',
    'transcriptConfidence',
    'transcriptQaStatus',
    'segmentTimingMode',
    'segmentTimingAuthorityVerified',
    'wordTimingMode',
    'wordTimingAuthorityVerified',
    'speakerSegmentationMode',
    'speakerSegmentationAuthorityVerified',
    'transcriptSegmentCount',
    'alignedWordCount',
    'speakerSegmentCount',
    'mockTranscriptUsed',
    'interpolatedWordTimingUsed',
    'transcriptTextEmbeddedInResult',
  ], 'transcript authority')
  for (const key of [
    'privateTranscriptArtifactId',
    'transcriptChecksumSha256',
    'privateWordTimingArtifactId',
    'wordTimingChecksumSha256',
    'privateSpeakerSegmentationArtifactId',
    'speakerSegmentationChecksumSha256',
    'transcriptRuntimeSource',
    'transcriptRuntimeId',
    'transcriptRuntimeVersion',
    'transcriptModelManifestId',
    'transcriptExecutionId',
    'transcriptLanguage',
    'transcriptConfidence',
    'transcriptQaStatus',
    'segmentTimingMode',
    'segmentTimingAuthorityVerified',
    'wordTimingMode',
    'wordTimingAuthorityVerified',
    'speakerSegmentationMode',
    'speakerSegmentationAuthorityVerified',
    'transcriptSegmentCount',
    'alignedWordCount',
    'speakerSegmentCount',
  ] as const) {
    if (value[key] !== request[key]) throw new Error('Speech/Pacing transcript authority does not match the request.')
  }
  for (const key of ['mockTranscriptUsed', 'interpolatedWordTimingUsed', 'transcriptTextEmbeddedInResult'] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing transcript authority permits mock, interpolated, or embedded text.')
  }
}

function validateFindings(
  request: EditReferenceSpeechPacingStudyRequest,
  value: unknown,
): readonly EditReferenceSpeechPacingFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Speech/Pacing findings are outside the approved bound.')
  }
  const allowedEvidence = new Set(evidenceIds(request.evidence))
  const transcriptEvidence = new Set(request.evidence.transcriptEvidenceIds)
  const segmentTimingEvidence = new Set(request.evidence.segmentTimingEvidenceIds)
  const wordTimingEvidence = new Set(request.evidence.wordTimingEvidenceIds)
  const speakerEvidence = new Set(request.evidence.speakerSegmentationEvidenceIds)
  const factEvidence = new Set(request.evidence.factSafetyEvidenceIds)
  const findingIds = new Set<string>()
  for (const finding of value) {
    if (!isRecord(finding)) throw new Error('Speech/Pacing finding is invalid.')
    assertExactKeys(finding, [
      'findingId',
      'category',
      'summary',
      'evidenceIds',
      'sourceRanges',
      'confidence',
      'transferability',
      'timingBasis',
      'targetAdaptationRequired',
      'requiresUserReview',
      'meaningPreservationRequired',
      'claimRelated',
      'factSafetyStatus',
      'exactReferenceWordingRetained',
      'exactReferenceTimingTransferInstructionCreated',
      'exactReferenceSentenceStructureCopyInstructionCreated',
      'executableCutInstructionCreated',
      'captionTextCopied',
      'voiceIdentityOrImitationInstructionCreated',
    ], 'finding')
    assertId(finding.findingId, 'Speech/Pacing finding ID is invalid.')
    if (findingIds.has(finding.findingId as string)) throw new Error('Speech/Pacing finding IDs must be unique.')
    findingIds.add(finding.findingId as string)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceSpeechPacingFindingCategory)) {
      throw new Error('Speech/Pacing finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Speech/Pacing finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Speech/Pacing finding evidence IDs are invalid.')
    const findingEvidence = finding.evidenceIds as string[]
    if (!findingEvidence.every((id) => allowedEvidence.has(id))) {
      throw new Error('Speech/Pacing finding references evidence outside the exact request.')
    }
    if (!findingEvidence.some((id) => transcriptEvidence.has(id))) {
      throw new Error('Speech/Pacing findings require approved transcript evidence.')
    }
    if (!findingEvidence.some((id) => segmentTimingEvidence.has(id))) {
      throw new Error('Speech/Pacing findings require approved segment-timing evidence.')
    }
    assertUnitInterval(finding.confidence, 'Speech/Pacing finding confidence is invalid.', true)
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceSpeechPacingTransferability)) {
      throw new Error('Speech/Pacing finding transferability is invalid.')
    }
    if (!TIMING_BASES.has(finding.timingBasis as EditReferenceSpeechPacingTimingBasis)) {
      throw new Error('Speech/Pacing finding timing basis is invalid.')
    }
    validateTimingBasisAuthority(request, finding.timingBasis, findingEvidence, wordTimingEvidence, speakerEvidence)
    validateSourceRanges(request, finding, allowedEvidence, wordTimingEvidence, speakerEvidence)
    if (
      finding.targetAdaptationRequired !== true
      || typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.meaningPreservationRequired !== 'boolean'
      || typeof finding.claimRelated !== 'boolean'
    ) {
      throw new Error('Speech/Pacing finding review or adaptation boundary is invalid.')
    }
    if (!['not_applicable', 'bounded_by_evidence', 'requires_review'].includes(String(finding.factSafetyStatus))) {
      throw new Error('Speech/Pacing finding fact-safety status is invalid.')
    }
    for (const key of [
      'exactReferenceWordingRetained',
      'exactReferenceTimingTransferInstructionCreated',
      'exactReferenceSentenceStructureCopyInstructionCreated',
      'executableCutInstructionCreated',
      'captionTextCopied',
      'voiceIdentityOrImitationInstructionCreated',
    ] as const) {
      if (finding[key] !== false) throw new Error('Speech/Pacing finding violates the no-copy or no-execution boundary.')
    }
    if (finding.category === 'word_timing' && request.wordTimingMode === 'not_available') {
      throw new Error('Speech/Pacing cannot report word timing without verified word-timing authority.')
    }
    if (finding.category === 'speaker_turn_pattern' && request.speakerSegmentationMode === 'not_requested') {
      throw new Error('Speech/Pacing cannot report speaker turns without verified diarization.')
    }
    if (finding.category === 'safe_cut_opportunity') {
      if (
        finding.requiresUserReview !== true
        || finding.meaningPreservationRequired !== true
        || finding.transferability === 'transferable_principle'
      ) {
        throw new Error('Speech/Pacing cut opportunities must stay source-specific, reviewable, and meaning-preserving.')
      }
    }
    if (finding.category === 'pause_pattern') {
      const semanticTimingEvidence = findingEvidence.some(
        (id) => segmentTimingEvidence.has(id) || wordTimingEvidence.has(id),
      )
      if (!semanticTimingEvidence) {
        throw new Error('Speech/Pacing low-level intervals cannot independently establish semantic pauses.')
      }
    }
    if (finding.transferability === 'non_transferable' && finding.requiresUserReview !== true) {
      throw new Error('Speech/Pacing non-transferable findings require user review.')
    }
    if (finding.claimRelated) {
      if (
        !request.sourceClaimsPresent
        || finding.factSafetyStatus === 'not_applicable'
        || !findingEvidence.some((id) => factEvidence.has(id))
      ) {
        throw new Error('Speech/Pacing claim-related findings require approved fact-safety evidence.')
      }
    } else if (finding.factSafetyStatus !== 'not_applicable') {
      throw new Error('Speech/Pacing non-claim findings must use not-applicable fact safety.')
    }
  }
  return value as EditReferenceSpeechPacingFinding[]
}

function validateTimingBasisAuthority(
  request: EditReferenceSpeechPacingStudyRequest,
  timingBasis: unknown,
  findingEvidence: readonly string[],
  wordTimingEvidence: ReadonlySet<string>,
  speakerEvidence: ReadonlySet<string>,
): void {
  if (timingBasis === 'word') {
    if (request.wordTimingMode === 'not_available' || !findingEvidence.some((id) => wordTimingEvidence.has(id))) {
      throw new Error('Speech/Pacing word timing basis lacks verified word alignment.')
    }
  }
  if (timingBasis === 'speaker_turn') {
    if (
      request.speakerSegmentationMode === 'not_requested'
      || !findingEvidence.some((id) => speakerEvidence.has(id))
    ) {
      throw new Error('Speech/Pacing speaker-turn timing basis lacks verified diarization.')
    }
  }
  if (timingBasis === 'mixed') {
    const hasAdditionalTiming =
      findingEvidence.some((id) => wordTimingEvidence.has(id))
      || findingEvidence.some((id) => speakerEvidence.has(id))
    if (!hasAdditionalTiming) throw new Error('Speech/Pacing mixed timing basis lacks additional verified timing.')
  }
}

function validateSourceRanges(
  request: EditReferenceSpeechPacingStudyRequest,
  finding: Record<string, unknown>,
  allowedEvidence: ReadonlySet<string>,
  wordTimingEvidence: ReadonlySet<string>,
  speakerEvidence: ReadonlySet<string>,
): void {
  if (
    !Array.isArray(finding.sourceRanges)
    || finding.sourceRanges.length < 1
    || finding.sourceRanges.length > MAX_SOURCE_RANGES_PER_FINDING
  ) {
    throw new Error('Speech/Pacing findings require bounded source ranges.')
  }
  const rangeIds = new Set<string>()
  for (const range of finding.sourceRanges) {
    if (!isRecord(range)) throw new Error('Speech/Pacing source range is invalid.')
    assertExactKeys(range, [
      'rangeId',
      'startSeconds',
      'endSeconds',
      'timingBasis',
      'evidenceIds',
      'sourceEvidenceOnly',
      'executableCutBoundaryCreated',
      'targetTimingInstructionCreated',
    ], 'source range')
    assertId(range.rangeId, 'Speech/Pacing source-range ID is invalid.')
    if (rangeIds.has(range.rangeId as string)) throw new Error('Speech/Pacing source-range IDs must be unique per finding.')
    rangeIds.add(range.rangeId as string)
    assertNonNegativeFinite(range.startSeconds, 'Speech/Pacing source-range start is invalid.')
    assertPositiveFinite(range.endSeconds, 'Speech/Pacing source-range end is invalid.')
    if (
      Number(range.endSeconds) <= Number(range.startSeconds)
      || Number(range.startSeconds) < request.analysisWindowStartSeconds - 0.001
      || Number(range.endSeconds) > request.analysisWindowEndSeconds + 0.001
    ) {
      throw new Error('Speech/Pacing source range is outside the approved analysis window.')
    }
    if (!TIMING_BASES.has(range.timingBasis as EditReferenceSpeechPacingTimingBasis)) {
      throw new Error('Speech/Pacing source-range timing basis is invalid.')
    }
    assertIdArray(range.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Speech/Pacing source-range evidence is invalid.')
    const rangeEvidence = range.evidenceIds as string[]
    if (
      !rangeEvidence.every((id) => allowedEvidence.has(id))
      || !rangeEvidence.every((id) => (finding.evidenceIds as string[]).includes(id))
    ) {
      throw new Error('Speech/Pacing source-range evidence must be a subset of the finding and request.')
    }
    validateTimingBasisAuthority(request, range.timingBasis, rangeEvidence, wordTimingEvidence, speakerEvidence)
    if (
      range.sourceEvidenceOnly !== true
      || range.executableCutBoundaryCreated !== false
      || range.targetTimingInstructionCreated !== false
    ) {
      throw new Error('Speech/Pacing source range crossed the evidence-only timing boundary.')
    }
  }
}

function validateCoverage(request: EditReferenceSpeechPacingStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount',
    'sourceDurationSeconds',
    'analysisWindowStartSeconds',
    'analysisWindowEndSeconds',
    'analyzedDurationSeconds',
    'transcriptSegmentCount',
    'alignedWordCount',
    'speakerSegmentCount',
    'transcriptLanguage',
    'segmentTimingMode',
    'wordTimingMode',
    'speakerSegmentationMode',
    'captionTimingPrecision',
    'partial',
    'missingEvidenceKinds',
  ], 'coverage')
  const exactMatches = [
    'sourceDurationSeconds',
    'analysisWindowStartSeconds',
    'analysisWindowEndSeconds',
    'transcriptSegmentCount',
    'alignedWordCount',
    'speakerSegmentCount',
    'transcriptLanguage',
    'segmentTimingMode',
    'wordTimingMode',
    'speakerSegmentationMode',
  ] as const
  for (const key of exactMatches) {
    if (value[key] !== request[key]) throw new Error('Speech/Pacing coverage does not match the request.')
  }
  if (value.evidenceItemCount !== evidenceIds(request.evidence).length) {
    throw new Error('Speech/Pacing evidence coverage count does not match the request.')
  }
  const expectedDuration = roundSeconds(request.analysisWindowEndSeconds - request.analysisWindowStartSeconds)
  if (value.analyzedDurationSeconds !== expectedDuration) {
    throw new Error('Speech/Pacing analyzed duration does not match the request window.')
  }
  const expectedCaptionPrecision = request.wordTimingMode === 'not_available' ? 'segment' : 'word'
  if (value.captionTimingPrecision !== expectedCaptionPrecision) {
    throw new Error('Speech/Pacing caption timing precision overstates its timing authority.')
  }
  if (typeof value.partial !== 'boolean') throw new Error('Speech/Pacing partial-coverage flag is invalid.')
  assertIdArray(value.missingEvidenceKinds, 16, true, 'Speech/Pacing missing-evidence kinds are invalid.')
  const missing = value.missingEvidenceKinds as string[]
  if (request.wordTimingMode === 'not_available' && !missing.includes('word_timing')) {
    throw new Error('Speech/Pacing coverage must disclose unavailable word timing.')
  }
  if (request.wordTimingMode !== 'not_available' && missing.includes('word_timing')) {
    throw new Error('Speech/Pacing coverage cannot report verified word timing as missing.')
  }
  const windowPartial =
    request.analysisWindowStartSeconds > 0.001
    || request.analysisWindowEndSeconds < request.sourceDurationSeconds - 0.001
  if (value.partial !== (windowPartial || missing.length > 0)) {
    throw new Error('Speech/Pacing partial coverage does not match its window or missing evidence.')
  }
}

function validateSummary(
  findings: readonly EditReferenceSpeechPacingFinding[],
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing summary is invalid.')
  assertExactKeys(value, [
    'findingCount',
    'categoryCount',
    'transferablePrincipleCount',
    'contextOnlyCount',
    'nonTransferableCount',
    'averageConfidence',
  ], 'summary')
  const categoryCount = new Set(findings.map((finding) => finding.category)).size
  const transferable = findings.filter((finding) => finding.transferability === 'transferable_principle').length
  const contextOnly = findings.filter((finding) => finding.transferability === 'context_only').length
  const nonTransferable = findings.filter((finding) => finding.transferability === 'non_transferable').length
  if (
    value.findingCount !== findings.length
    || value.categoryCount !== categoryCount
    || value.transferablePrincipleCount !== transferable
    || value.contextOnlyCount !== contextOnly
    || value.nonTransferableCount !== nonTransferable
  ) {
    throw new Error('Speech/Pacing summary counts do not match findings.')
  }
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (typeof value.averageConfidence !== 'number' || Math.abs(value.averageConfidence - average) > 0.000_001) {
    throw new Error('Speech/Pacing average confidence does not match findings.')
  }
}

function validateExecution(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing execution evidence is invalid.')
  assertExactKeys(value, [
    'privateTranscriptArtifactRead',
    'structuredTimingEvidenceRead',
    'semanticSpeechPacingModelExecuted',
    'rawMediaRead',
    'rawAudioRead',
    'mockTranscriptUsed',
    'interpolatedWordTimingUsed',
    'rawTranscriptPersistedInStudyResult',
    'externalUrlFetched',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
    'temporaryAudioCleaned',
    'remoteMutationMade',
  ], 'execution')
  for (const key of [
    'privateTranscriptArtifactRead',
    'structuredTimingEvidenceRead',
    'semanticSpeechPacingModelExecuted',
    'modelCallMade',
    'temporaryAudioCleaned',
  ] as const) {
    if (value[key] !== true) throw new Error('Speech/Pacing analyzed result lacks execution or cleanup proof.')
  }
  for (const key of [
    'rawMediaRead',
    'rawAudioRead',
    'mockTranscriptUsed',
    'interpolatedWordTimingUsed',
    'rawTranscriptPersistedInStudyResult',
    'externalUrlFetched',
    'remoteMutationMade',
  ] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing execution crossed a privacy or evidence boundary.')
  }
  if (typeof value.providerCallMade !== 'boolean' || typeof value.workerJobCreated !== 'boolean') {
    throw new Error('Speech/Pacing execution flags are invalid.')
  }
  if ((runtimeSource === 'verified_live') !== value.providerCallMade) {
    throw new Error('Speech/Pacing provider execution does not match the runtime source.')
  }
}

function validateAnalyzer(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing analyzer provenance is invalid.')
  assertExactKeys(value, [
    'adapterId',
    'adapterVersion',
    'providerId',
    'modelId',
    'modelRevision',
    'modelAggregateSha256',
    'modelRoutingPolicyVersion',
    'analysisInstructionDigestSha256',
  ], 'analyzer provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], 'Speech/Pacing ' + key + ' is invalid.')
  }
  assertSha256(value.modelAggregateSha256, 'Speech/Pacing model aggregate checksum is invalid.')
  assertSha256(value.analysisInstructionDigestSha256, 'Speech/Pacing analysis-instruction digest is invalid.')
  if (runtimeSource === 'verified_live') {
    assertId(value.providerId, 'Live Speech/Pacing results require provider identity.')
  } else if (value.providerId !== null) {
    throw new Error('Local Speech/Pacing results cannot claim provider identity.')
  }
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Speech/Pacing execution ID is invalid.')
  assertTimestamp(value.startedAt, 'Speech/Pacing start timestamp is invalid.')
  assertTimestamp(value.completedAt, 'Speech/Pacing completion timestamp is invalid.')
  if (Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Speech/Pacing completion precedes its start.')
  }
}

function validateUsage(request: EditReferenceSpeechPacingStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing usage is invalid.')
  assertExactKeys(value, [
    'mode',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage')
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Speech/Pacing usage must not calculate customer price, credits, or service fees.')
  }
  assertMoneyMicros(value.meteredInternalCostMicros, 'Speech/Pacing metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 64, true, 'Speech/Pacing usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Speech/Pacing internal-cost record IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.mode !== 'controlled_test_unmetered'
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) {
      throw new Error('Controlled Speech/Pacing usage cannot claim production metering.')
    }
    return
  }
  if (value.mode !== 'production_metered') throw new Error('Production Speech/Pacing usage must be metered.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    if (value[key] !== request[key]) throw new Error('Speech/Pacing production cost authority does not match the request.')
  }
  if (value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros) {
    throw new Error('Speech/Pacing maximum authorized internal cost does not match the request.')
  }
  assertPositiveMoneyMicros(value.meteredInternalCostMicros, 'Production Speech/Pacing study requires positive internal cost.')
  if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Speech/Pacing metered internal cost exceeds the authorized maximum.')
  }
  if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
    throw new Error('Production Speech/Pacing usage requires usage and internal-cost records.')
  }
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing privacy boundary is invalid.')
  assertExactKeys(value, [
    'rawMediaPersisted',
    'rawAudioPersisted',
    'rawTranscriptEmbeddedInStudyResult',
    'transcriptTextPersistedByStudyAnalyzer',
    'rawProviderPayloadPersisted',
    'signedUrlPersisted',
    'hiddenChainOfThoughtPersisted',
    'temporaryAudioCleaned',
  ], 'privacy')
  for (const key of [
    'rawMediaPersisted',
    'rawAudioPersisted',
    'rawTranscriptEmbeddedInStudyResult',
    'transcriptTextPersistedByStudyAnalyzer',
    'rawProviderPayloadPersisted',
    'signedUrlPersisted',
    'hiddenChainOfThoughtPersisted',
  ] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing privacy boundary permits unsafe persistence.')
  }
  if (value.temporaryAudioCleaned !== true) throw new Error('Speech/Pacing temporary-audio cleanup is required.')
}

function validateFactSafety(request: EditReferenceSpeechPacingStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing fact-safety result is invalid.')
  assertExactKeys(value, [
    'claimEvidenceRequired',
    'claimEvidenceIds',
    'unverifiedClaimPresentedAsFact',
    'sourceAttributionRemoved',
    'guiltImplyingInstructionCreated',
  ], 'fact safety')
  if (value.claimEvidenceRequired !== request.sourceClaimsPresent) {
    throw new Error('Speech/Pacing fact-safety requirement does not match the request.')
  }
  assertMatchingIdArray(
    value.claimEvidenceIds,
    request.evidence.factSafetyEvidenceIds,
    'Speech/Pacing fact-safety evidence does not match the request.',
  )
  for (const key of [
    'unverifiedClaimPresentedAsFact',
    'sourceAttributionRemoved',
    'guiltImplyingInstructionCreated',
  ] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing fact-safety result is unsafe.')
  }
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing transfer boundary is invalid.')
  assertExactKeys(value, [
    'technicalLowLevelIntervalsTreatedAsSemanticPauses',
    'interpolatedTimingTreatedAsAligned',
    'sourceTranscriptTreatedAsTargetScript',
    'findingsMayBecomeTargetInstructionsWithoutApplication',
    'sourceCutOpportunityMayExecuteWithoutTargetMeaningReview',
    'targetEvidenceRequired',
    'meaningPreservationReviewRequired',
    'userApprovalRequired',
    'exactWordingOrTimingTransferAllowed',
  ], 'transfer boundary')
  for (const key of [
    'technicalLowLevelIntervalsTreatedAsSemanticPauses',
    'interpolatedTimingTreatedAsAligned',
    'sourceTranscriptTreatedAsTargetScript',
    'findingsMayBecomeTargetInstructionsWithoutApplication',
    'sourceCutOpportunityMayExecuteWithoutTargetMeaningReview',
    'exactWordingOrTimingTransferAllowed',
  ] as const) {
    if (value[key] !== false) throw new Error('Speech/Pacing transfer boundary permits unsafe inference, copying, or execution.')
  }
  for (const key of ['targetEvidenceRequired', 'meaningPreservationReviewRequired', 'userApprovalRequired'] as const) {
    if (value[key] !== true) throw new Error('Speech/Pacing target evidence, meaning review, and approval are required.')
  }
}

function validateMatchingEvidenceManifest(
  expected: EditReferenceSpeechPacingEvidenceManifest,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Speech/Pacing result evidence manifest is invalid.')
  const keys = evidenceManifestKeys()
  assertExactKeys(value, keys, 'result evidence manifest')
  for (const key of keys) {
    assertMatchingIdSet(value[key], expected[key], 'Speech/Pacing result ' + key + ' does not match the request.')
  }
}

function evidenceManifestKeys(): readonly (keyof EditReferenceSpeechPacingEvidenceManifest)[] {
  return [
    'mediaStructureEvidenceIds',
    'privateAudioEvidenceIds',
    'transcriptEvidenceIds',
    'segmentTimingEvidenceIds',
    'wordTimingEvidenceIds',
    'speakerSegmentationEvidenceIds',
    'technicalLowLevelIntervalEvidenceIds',
    'studyChatGoalEvidenceIds',
    'factSafetyEvidenceIds',
  ]
}

function evidenceIds(manifest: EditReferenceSpeechPacingEvidenceManifest): string[] {
  return evidenceManifestKeys().flatMap((key) => [...manifest[key]])
}

function normalizedEvidenceManifest(
  manifest: EditReferenceSpeechPacingEvidenceManifest,
): EditReferenceSpeechPacingEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...manifest.mediaStructureEvidenceIds].sort(),
    privateAudioEvidenceIds: [...manifest.privateAudioEvidenceIds].sort(),
    transcriptEvidenceIds: [...manifest.transcriptEvidenceIds].sort(),
    segmentTimingEvidenceIds: [...manifest.segmentTimingEvidenceIds].sort(),
    wordTimingEvidenceIds: [...manifest.wordTimingEvidenceIds].sort(),
    speakerSegmentationEvidenceIds: [...manifest.speakerSegmentationEvidenceIds].sort(),
    technicalLowLevelIntervalEvidenceIds: [...manifest.technicalLowLevelIntervalEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...manifest.studyChatGoalEvidenceIds].sort(),
    factSafetyEvidenceIds: [...manifest.factSafetyEvidenceIds].sort(),
  }
}

function assertNoUnsafeContent(value: unknown, path = 'root'): void {
  if (typeof value === 'string') {
    if (UNSAFE_STRING_PATTERN.test(value)) throw new Error('Speech/Pacing unsafe string at ' + path + '.')
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoUnsafeContent(entry, path + '[' + index + ']'))
    return
  }
  if (!isRecord(value)) return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('Speech/Pacing forbidden field ' + key + '.')
    assertNoUnsafeContent(entry, path + '.' + key)
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actualKeys = Object.keys(value).sort()
  const expectedKeys = [...expected].sort()
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error('Speech/Pacing ' + label + ' fields are invalid.')
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
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
  ) {
    throw new Error(message)
  }
}

function assertMatchingIdArray(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, MAX_EVIDENCE_ITEMS, expected.length === 0, message)
  if ((value as string[]).length !== expected.length || (value as string[]).some((entry, index) => entry !== expected[index])) {
    throw new Error(message)
  }
}

function assertMatchingIdSet(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, MAX_EVIDENCE_ITEMS, expected.length === 0, message)
  const actual = [...(value as string[])].sort()
  const approved = [...expected].sort()
  if (actual.length !== approved.length || actual.some((entry, index) => entry !== approved[index])) {
    throw new Error(message)
  }
}

function assertSha256(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new Error(message)
}

function assertMoneyMicros(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoneyMicros(value: unknown, message: string): asserts value is string {
  assertMoneyMicros(value, message)
  if (BigInt(value) <= 0n) throw new Error(message)
}

function assertUnitInterval(value: unknown, message: string, positive = false): asserts value is number {
  if (
    typeof value !== 'number'
    || !Number.isFinite(value)
    || value < (positive ? Number.EPSILON : 0)
    || value > 1
  ) {
    throw new Error(message)
  }
}

function assertPositiveFinite(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(message)
}

function assertNonNegativeFinite(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(message)
}

function assertBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  message: string,
): asserts value is number {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) throw new Error(message)
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function assertTimestamp(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error(message)
}

function validateAllFalseObject(value: unknown, keys: readonly string[], message: string): void {
  if (!isRecord(value)) throw new Error(message)
  assertExactKeys(value, keys, 'false-only boundary')
  for (const key of keys) if (value[key] !== false) throw new Error(message)
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
