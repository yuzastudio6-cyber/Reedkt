import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_CAPTION_DESIGN_STUDY_REQUEST_VERSION =
  'edit-reference-caption-design-study-request-v1' as const
export const EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION =
  'edit-reference-caption-design-study-result-v1' as const

export type EditReferenceCaptionDesignFindingCategory =
  | 'font_character'
  | 'weight_treatment'
  | 'size_hierarchy'
  | 'placement'
  | 'safe_zone_behavior'
  | 'line_break_pattern'
  | 'highlighted_word_treatment'
  | 'color_treatment'
  | 'stroke_shadow_background'
  | 'animation_style'
  | 'entry_exit_timing'
  | 'caption_density'
  | 'spacing'
  | 'speech_alignment'
  | 'readability'

export type EditReferenceCaptionDesignTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceCaptionDesignEvidenceMode =
  | 'visual_ocr'
  | 'visual_ocr_segment_timing'
  | 'visual_ocr_word_timing'

export type EditReferenceCaptionDesignTimingBasis =
  | 'frame_sequence'
  | 'segment'
  | 'word'

export interface EditReferenceCaptionDesignFrameEvidence {
  readonly role: 'representative' | 'caption_detail'
  readonly frameEvidenceId: string
  readonly privateFrameArtifactId: string
  readonly frameChecksumSha256: string
  readonly sourceTimeSeconds: number
  readonly width: number
  readonly height: number
  readonly privateAccessVerified: true
  readonly ephemeral: true
  readonly cleanupRequired: true
}

export interface EditReferenceCaptionDesignEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly representativeFrameEvidenceIds: readonly string[]
  readonly technicalCaptionRegionEvidenceIds: readonly string[]
  readonly captionOcrEvidenceIds: readonly string[]
  readonly visualLanguageEvidenceIds: readonly string[]
  readonly transcriptEvidenceIds: readonly string[]
  readonly segmentTimingEvidenceIds: readonly string[]
  readonly wordTimingEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly factSafetyEvidenceIds: readonly string[]
}

export interface EditReferenceCaptionDesignStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_DESIGN_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly frameManifestDigestSha256: string
  readonly captionOcrResultDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly frameAuthorityVerified: true
  readonly captionOcrResultAuthorityVerified: true
  readonly frameSamples: readonly EditReferenceCaptionDesignFrameEvidence[]
  readonly evidence: EditReferenceCaptionDesignEvidenceManifest
  readonly captionOcrRuntimeSource: 'verified_local'
  readonly captionOcrAdapterId: string
  readonly captionOcrAdapterVersion: string
  readonly captionOcrExecutionId: string
  readonly captionOcrCoverage: 'full' | 'partial'
  readonly captionOcrAnalyzedFrameCount: number
  readonly captionOcrRegionCount: number
  readonly captionOcrRuntimeExecuted: true
  readonly captionOcrExactTextPersisted: false
  readonly captionOcrRawOutputPersisted: false
  readonly evidenceMode: EditReferenceCaptionDesignEvidenceMode
  readonly privateTranscriptArtifactId: string | null
  readonly transcriptChecksumSha256: string | null
  readonly privateWordTimingArtifactId: string | null
  readonly wordTimingChecksumSha256: string | null
  readonly privateTranscriptAccessVerified: boolean
  readonly privateTranscriptFinalized: boolean
  readonly transcriptChecksumVerified: boolean
  readonly transcriptRuntimeExecuted: boolean
  readonly transcriptRuntimeSource: 'verified_local' | 'verified_live' | null
  readonly transcriptRuntimeId: string | null
  readonly transcriptRuntimeVersion: string | null
  readonly transcriptModelManifestId: string | null
  readonly transcriptExecutionId: string | null
  readonly transcriptQaStatus: 'passed' | 'warning' | null
  readonly segmentTimingAuthorityVerified: boolean
  readonly wordTimingAuthorityVerified: boolean
  readonly transcriptSegmentCount: number
  readonly alignedWordCount: number
  readonly sourceDurationSeconds: number
  readonly analysisWindowStartSeconds: number
  readonly analysisWindowEndSeconds: number
  readonly sourceClaimsPresent: boolean
  readonly maxFrameCount: number
  readonly maxEvidenceItems: number
  readonly maxStructuredContextCharacters: number
  readonly maxScanDurationSeconds: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly boundedPrivateFrameInputAllowed: true
  readonly boundedPrivateTranscriptInputAllowed: true
  readonly rawFullMediaInputAllowed: false
  readonly rawRecognizedTextInputAllowed: false
  readonly rawTranscriptInRequestAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly mockTranscriptInputAllowed: false
  readonly interpolatedWordTimingAllowed: false
  readonly rawFramePersistenceAllowed: false
  readonly rawOcrOutputPersistenceAllowed: false
  readonly rawProviderPayloadPersistenceAllowed: false
  readonly exactReferenceCaptionWordingTransferAllowed: false
  readonly exactReferenceFontIdentityTransferAllowed: false
  readonly exactReferenceLineBreakTransferAllowed: false
  readonly exactReferenceHighlightWordTransferAllowed: false
  readonly exactReferenceColorValueTransferAllowed: false
  readonly exactReferenceLayoutTransferAllowed: false
  readonly exactReferenceAnimationCurveTransferAllowed: false
  readonly exactReferenceTimingTransferAllowed: false
  readonly copyrightedFontOrBrandAssetTransferAllowed: false
  readonly executableCaptionPlanAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceCaptionDesignSourceRange {
  readonly rangeId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly timingBasis: EditReferenceCaptionDesignTimingBasis
  readonly evidenceIds: readonly string[]
  readonly sourceEvidenceOnly: true
  readonly targetTimingInstructionCreated: false
  readonly executableCaptionTimingCreated: false
}

export interface EditReferenceCaptionDesignFinding {
  readonly findingId: string
  readonly category: EditReferenceCaptionDesignFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly frameEvidenceIds: readonly string[]
  readonly sourceRanges: readonly EditReferenceCaptionDesignSourceRange[]
  readonly confidence: number
  readonly transferability: EditReferenceCaptionDesignTransferability
  readonly evidenceMode: EditReferenceCaptionDesignEvidenceMode
  readonly timingBasis: EditReferenceCaptionDesignTimingBasis
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly safeZoneRelated: boolean
  readonly speechTimingRelated: boolean
  readonly fontOrBrandRelated: boolean
  readonly claimRelated: boolean
  readonly factSafetyStatus: 'not_applicable' | 'bounded_by_evidence' | 'requires_review'
  readonly observedDesignOnly: true
  readonly generalizedNonVerbatimSummary: true
  readonly exactReferenceCaptionWordingRetained: false
  readonly exactFontIdentityClaimCreated: false
  readonly exactLineBreakCopyInstructionCreated: false
  readonly exactHighlightWordCopyInstructionCreated: false
  readonly exactColorValueCopyInstructionCreated: false
  readonly exactLayoutCopyInstructionCreated: false
  readonly exactAnimationCurveCopyInstructionCreated: false
  readonly exactTimingMapCopyInstructionCreated: false
  readonly copyrightedFontOrBrandAssetTransferInstructionCreated: false
  readonly executableCaptionPlanCreated: false
  readonly sourceCaptionTextCopied: false
}

export interface EditReferenceAnalyzedCaptionDesignStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION
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
  readonly frameManifestDigestSha256: string
  readonly captionOcrResultDigestSha256: string
  readonly consumedFrameEvidenceIds: readonly string[]
  readonly evidence: EditReferenceCaptionDesignEvidenceManifest
  readonly findings: readonly EditReferenceCaptionDesignFinding[]
  readonly captionOcrAuthority: {
    readonly runtimeSource: 'verified_local'
    readonly adapterId: string
    readonly adapterVersion: string
    readonly executionId: string
    readonly coverage: 'full' | 'partial'
    readonly analyzedFrameCount: number
    readonly regionCount: number
    readonly exactTextPersisted: false
    readonly rawOutputPersisted: false
  }
  readonly transcriptTimingAuthority: {
    readonly evidenceMode: EditReferenceCaptionDesignEvidenceMode
    readonly privateTranscriptArtifactId: string | null
    readonly transcriptChecksumSha256: string | null
    readonly privateWordTimingArtifactId: string | null
    readonly wordTimingChecksumSha256: string | null
    readonly transcriptRuntimeSource: 'verified_local' | 'verified_live' | null
    readonly transcriptRuntimeId: string | null
    readonly transcriptRuntimeVersion: string | null
    readonly transcriptModelManifestId: string | null
    readonly transcriptExecutionId: string | null
    readonly transcriptQaStatus: 'passed' | 'warning' | null
    readonly segmentTimingAuthorityVerified: boolean
    readonly wordTimingAuthorityVerified: boolean
    readonly transcriptSegmentCount: number
    readonly alignedWordCount: number
    readonly mockTranscriptUsed: false
    readonly interpolatedWordTimingUsed: false
    readonly transcriptTextEmbeddedInResult: false
  }
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly frameCount: number
    readonly captionDetailFrameCount: number
    readonly captionOcrAnalyzedFrameCount: number
    readonly captionOcrRegionCount: number
    readonly captionOcrCoverage: 'full' | 'partial'
    readonly sourceDurationSeconds: number
    readonly analysisWindowStartSeconds: number
    readonly analysisWindowEndSeconds: number
    readonly analyzedDurationSeconds: number
    readonly evidenceMode: EditReferenceCaptionDesignEvidenceMode
    readonly transcriptSegmentCount: number
    readonly alignedWordCount: number
    readonly timingPrecision: 'visual_only' | 'segment' | 'word'
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
    readonly boundedPrivateFramesRead: true
    readonly captionOcrResultRead: true
    readonly privateTranscriptTimingRead: boolean
    readonly semanticCaptionDesignModelExecuted: true
    readonly ocrEngineExecutedByCaptionDesignAnalyzer: false
    readonly rawFullMediaRead: false
    readonly rawRecognizedTextRead: false
    readonly rawTranscriptRead: false
    readonly externalUrlFetched: false
    readonly providerCallMade: boolean
    readonly modelCallMade: true
    readonly workerJobCreated: boolean
    readonly temporaryFramesCleaned: true
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
    readonly rawFramesPersisted: false
    readonly rawOcrOutputPersisted: false
    readonly recognizedCaptionTextPersisted: false
    readonly rawTranscriptEmbeddedInStudyResult: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryFramesCleaned: true
  }
  readonly copySafety: {
    readonly exactCaptionWordingRetained: false
    readonly exactFontIdentityTransferInstructionCreated: false
    readonly exactLineBreakCopyInstructionCreated: false
    readonly exactHighlightWordCopyInstructionCreated: false
    readonly exactColorValueCopyInstructionCreated: false
    readonly exactLayoutCopyInstructionCreated: false
    readonly exactAnimationCurveCopyInstructionCreated: false
    readonly exactTimingMapCopyInstructionCreated: false
    readonly copyrightedFontOrBrandAssetTransferInstructionCreated: false
  }
  readonly factSafety: {
    readonly claimEvidenceRequired: boolean
    readonly claimEvidenceIds: readonly string[]
    readonly unverifiedClaimPresentedAsFact: false
    readonly sourceAttributionRemoved: false
    readonly misleadingCaptionInstructionCreated: false
  }
  readonly readabilitySafety: {
    readonly speechClarityPriorityPreserved: true
    readonly targetSafeZoneReviewRequired: true
    readonly targetCollisionReviewRequired: true
    readonly targetAspectRatioRequired: true
    readonly foregroundMaskCollisionAllowed: false
    readonly importantVisualOcclusionAllowed: false
  }
  readonly transferBoundary: {
    readonly technicalTextLikeRegionsTreatedAsConfirmedCaptions: false
    readonly ocrGeometryTreatedAsSemanticCaptionDesignWithoutModel: false
    readonly segmentTimingTreatedAsWordAlignment: false
    readonly exactFontIdentityInferred: false
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly targetTranscriptTimingRequiredForSpeechAlignment: true
    readonly targetLayoutAndSafeZoneValidationRequired: true
    readonly userApprovalRequired: true
    readonly exactWordingFontLayoutAnimationOrTimingTransferAllowed: false
  }
}

export type EditReferenceCaptionDesignStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'frame_authority_unverified'
  | 'representative_frames_unavailable'
  | 'caption_ocr_result_unavailable'
  | 'caption_ocr_authority_unverified'
  | 'transcript_timing_unavailable'
  | 'transcript_timing_authority_unverified'
  | 'word_timing_authority_unverified'
  | 'evidence_authority_unverified'
  | 'fact_safety_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'ephemeral_cleanup_failed'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedCaptionDesignStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceCaptionDesignStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly boundedPrivateFramesRead: boolean
  readonly captionOcrResultRead: boolean
  readonly privateTranscriptTimingRead: boolean
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly temporaryFramesCleaned: boolean
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceCaptionDesignStudyResult =
  | EditReferenceAnalyzedCaptionDesignStudyResult
  | EditReferenceBlockedCaptionDesignStudyResult

export interface EditReferenceCaptionDesignStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceCaptionDesignStudyRequest): Promise<EditReferenceCaptionDesignStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_FRAME_COUNT = 8
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_FINDINGS = 64
const MAX_SOURCE_RANGES_PER_FINDING = 8

const FINDING_CATEGORIES = new Set<EditReferenceCaptionDesignFindingCategory>([
  'font_character',
  'weight_treatment',
  'size_hierarchy',
  'placement',
  'safe_zone_behavior',
  'line_break_pattern',
  'highlighted_word_treatment',
  'color_treatment',
  'stroke_shadow_background',
  'animation_style',
  'entry_exit_timing',
  'caption_density',
  'spacing',
  'speech_alignment',
  'readability',
])
const TRANSFERABILITIES = new Set<EditReferenceCaptionDesignTransferability>([
  'transferable_principle',
  'context_only',
  'non_transferable',
])
const EVIDENCE_MODES = new Set<EditReferenceCaptionDesignEvidenceMode>([
  'visual_ocr',
  'visual_ocr_segment_timing',
  'visual_ocr_word_timing',
])
const TIMING_BASES = new Set<EditReferenceCaptionDesignTimingBasis>([
  'frame_sequence',
  'segment',
  'word',
])
const BLOCKER_CODES = new Set<EditReferenceCaptionDesignStudyBlockerCode>([
  'adapter_unavailable',
  'private_artifact_unavailable',
  'frame_authority_unverified',
  'representative_frames_unavailable',
  'caption_ocr_result_unavailable',
  'caption_ocr_authority_unverified',
  'transcript_timing_unavailable',
  'transcript_timing_authority_unverified',
  'word_timing_authority_unverified',
  'evidence_authority_unverified',
  'fact_safety_evidence_required',
  'cost_authority_unavailable',
  'model_routing_unavailable',
  'privacy_policy_denied',
  'runtime_response_invalid',
  'ephemeral_cleanup_failed',
  'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey', 'api_key', 'authorization', 'bytes', 'captionText', 'chainOfThought',
  'chain_of_thought', 'exactCaptionWording', 'exactFontName', 'exactHighlightWord',
  'filePath', 'file_path', 'hiddenReasoning', 'localPath', 'local_path', 'password',
  'payload', 'prompt', 'rawFrame', 'rawFrames', 'rawMedia', 'rawOcrOutput',
  'rawPayload', 'rawProviderPayload', 'rawTranscript', 'recognizedText', 'secret',
  'signedUrl', 'signed_url', 'token', 'tokens', 'transcriptText', 'url', 'words',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

function stableRequestPayload(request: EditReferenceCaptionDesignStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    frameManifestDigestSha256: request.frameManifestDigestSha256,
    captionOcrResultDigestSha256: request.captionOcrResultDigestSha256,
    privateArtifactAccessVerified: request.privateArtifactAccessVerified,
    privateArtifactFinalized: request.privateArtifactFinalized,
    mediaChecksumVerified: request.mediaChecksumVerified,
    evidenceAuthorityVerified: request.evidenceAuthorityVerified,
    frameAuthorityVerified: request.frameAuthorityVerified,
    captionOcrResultAuthorityVerified: request.captionOcrResultAuthorityVerified,
    frameSamples: [...request.frameSamples]
      .sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds || left.frameEvidenceId.localeCompare(right.frameEvidenceId))
      .map((sample) => ({ ...sample })),
    evidence: normalizedEvidenceManifest(request.evidence),
    captionOcrRuntimeSource: request.captionOcrRuntimeSource,
    captionOcrAdapterId: request.captionOcrAdapterId,
    captionOcrAdapterVersion: request.captionOcrAdapterVersion,
    captionOcrExecutionId: request.captionOcrExecutionId,
    captionOcrCoverage: request.captionOcrCoverage,
    captionOcrAnalyzedFrameCount: request.captionOcrAnalyzedFrameCount,
    captionOcrRegionCount: request.captionOcrRegionCount,
    captionOcrRuntimeExecuted: request.captionOcrRuntimeExecuted,
    captionOcrExactTextPersisted: request.captionOcrExactTextPersisted,
    captionOcrRawOutputPersisted: request.captionOcrRawOutputPersisted,
    evidenceMode: request.evidenceMode,
    privateTranscriptArtifactId: request.privateTranscriptArtifactId,
    transcriptChecksumSha256: request.transcriptChecksumSha256,
    privateWordTimingArtifactId: request.privateWordTimingArtifactId,
    wordTimingChecksumSha256: request.wordTimingChecksumSha256,
    privateTranscriptAccessVerified: request.privateTranscriptAccessVerified,
    privateTranscriptFinalized: request.privateTranscriptFinalized,
    transcriptChecksumVerified: request.transcriptChecksumVerified,
    transcriptRuntimeExecuted: request.transcriptRuntimeExecuted,
    transcriptRuntimeSource: request.transcriptRuntimeSource,
    transcriptRuntimeId: request.transcriptRuntimeId,
    transcriptRuntimeVersion: request.transcriptRuntimeVersion,
    transcriptModelManifestId: request.transcriptModelManifestId,
    transcriptExecutionId: request.transcriptExecutionId,
    transcriptQaStatus: request.transcriptQaStatus,
    segmentTimingAuthorityVerified: request.segmentTimingAuthorityVerified,
    wordTimingAuthorityVerified: request.wordTimingAuthorityVerified,
    transcriptSegmentCount: request.transcriptSegmentCount,
    alignedWordCount: request.alignedWordCount,
    sourceDurationSeconds: request.sourceDurationSeconds,
    analysisWindowStartSeconds: request.analysisWindowStartSeconds,
    analysisWindowEndSeconds: request.analysisWindowEndSeconds,
    sourceClaimsPresent: request.sourceClaimsPresent,
    maxFrameCount: request.maxFrameCount,
    maxEvidenceItems: request.maxEvidenceItems,
    maxStructuredContextCharacters: request.maxStructuredContextCharacters,
    maxScanDurationSeconds: request.maxScanDurationSeconds,
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    boundedPrivateFrameInputAllowed: request.boundedPrivateFrameInputAllowed,
    boundedPrivateTranscriptInputAllowed: request.boundedPrivateTranscriptInputAllowed,
    rawFullMediaInputAllowed: request.rawFullMediaInputAllowed,
    rawRecognizedTextInputAllowed: request.rawRecognizedTextInputAllowed,
    rawTranscriptInRequestAllowed: request.rawTranscriptInRequestAllowed,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    mockTranscriptInputAllowed: request.mockTranscriptInputAllowed,
    interpolatedWordTimingAllowed: request.interpolatedWordTimingAllowed,
    rawFramePersistenceAllowed: request.rawFramePersistenceAllowed,
    rawOcrOutputPersistenceAllowed: request.rawOcrOutputPersistenceAllowed,
    rawProviderPayloadPersistenceAllowed: request.rawProviderPayloadPersistenceAllowed,
    exactReferenceCaptionWordingTransferAllowed: request.exactReferenceCaptionWordingTransferAllowed,
    exactReferenceFontIdentityTransferAllowed: request.exactReferenceFontIdentityTransferAllowed,
    exactReferenceLineBreakTransferAllowed: request.exactReferenceLineBreakTransferAllowed,
    exactReferenceHighlightWordTransferAllowed: request.exactReferenceHighlightWordTransferAllowed,
    exactReferenceColorValueTransferAllowed: request.exactReferenceColorValueTransferAllowed,
    exactReferenceLayoutTransferAllowed: request.exactReferenceLayoutTransferAllowed,
    exactReferenceAnimationCurveTransferAllowed: request.exactReferenceAnimationCurveTransferAllowed,
    exactReferenceTimingTransferAllowed: request.exactReferenceTimingTransferAllowed,
    copyrightedFontOrBrandAssetTransferAllowed: request.copyrightedFontOrBrandAssetTransferAllowed,
    executableCaptionPlanAllowed: request.executableCaptionPlanAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
    serviceFeeCalculationAllowed: request.serviceFeeCalculationAllowed,
  })
}

export function hashEditReferenceCaptionDesignStudyRequest(
  request: EditReferenceCaptionDesignStudyRequest,
): string {
  validateEditReferenceCaptionDesignStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceCaptionDesignStudyRequest(
  value: unknown,
): asserts value is EditReferenceCaptionDesignStudyRequest {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Caption Design study request must be an object.')
  assertExactKeys(value, [
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'captionOcrResultDigestSha256', 'privateArtifactAccessVerified',
    'privateArtifactFinalized', 'mediaChecksumVerified', 'evidenceAuthorityVerified',
    'frameAuthorityVerified', 'captionOcrResultAuthorityVerified', 'frameSamples', 'evidence',
    'captionOcrRuntimeSource', 'captionOcrAdapterId', 'captionOcrAdapterVersion',
    'captionOcrExecutionId', 'captionOcrCoverage', 'captionOcrAnalyzedFrameCount',
    'captionOcrRegionCount', 'captionOcrRuntimeExecuted', 'captionOcrExactTextPersisted',
    'captionOcrRawOutputPersisted', 'evidenceMode', 'privateTranscriptArtifactId',
    'transcriptChecksumSha256', 'privateWordTimingArtifactId', 'wordTimingChecksumSha256',
    'privateTranscriptAccessVerified', 'privateTranscriptFinalized', 'transcriptChecksumVerified',
    'transcriptRuntimeExecuted', 'transcriptRuntimeSource', 'transcriptRuntimeId',
    'transcriptRuntimeVersion', 'transcriptModelManifestId', 'transcriptExecutionId',
    'transcriptQaStatus', 'segmentTimingAuthorityVerified', 'wordTimingAuthorityVerified',
    'transcriptSegmentCount', 'alignedWordCount', 'sourceDurationSeconds',
    'analysisWindowStartSeconds', 'analysisWindowEndSeconds', 'sourceClaimsPresent',
    'maxFrameCount', 'maxEvidenceItems', 'maxStructuredContextCharacters',
    'maxScanDurationSeconds', 'executionScope', 'approvedUsageEstimateId',
    'internalCostBudgetId', 'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros',
    'boundedPrivateFrameInputAllowed', 'boundedPrivateTranscriptInputAllowed',
    'rawFullMediaInputAllowed', 'rawRecognizedTextInputAllowed', 'rawTranscriptInRequestAllowed',
    'externalUrlFetchAllowed', 'mockTranscriptInputAllowed', 'interpolatedWordTimingAllowed',
    'rawFramePersistenceAllowed', 'rawOcrOutputPersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'exactReferenceCaptionWordingTransferAllowed',
    'exactReferenceFontIdentityTransferAllowed', 'exactReferenceLineBreakTransferAllowed',
    'exactReferenceHighlightWordTransferAllowed', 'exactReferenceColorValueTransferAllowed',
    'exactReferenceLayoutTransferAllowed', 'exactReferenceAnimationCurveTransferAllowed',
    'exactReferenceTimingTransferAllowed', 'copyrightedFontOrBrandAssetTransferAllowed',
    'executableCaptionPlanAllowed', 'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_CAPTION_DESIGN_STUDY_REQUEST_VERSION) {
    throw new Error('Caption Design study request version is unsupported.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    assertId(value[key], `Caption Design study ${key} is invalid.`)
  }
  for (const key of ['mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256', 'captionOcrResultDigestSha256'] as const) {
    assertSha256(value[key], `Caption Design study ${key} is invalid.`)
  }
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
    || value.frameAuthorityVerified !== true
    || value.captionOcrResultAuthorityVerified !== true
  ) throw new Error('Caption Design private media, frame, OCR, or evidence authority is incomplete.')
  if (value.maxFrameCount !== MAX_FRAME_COUNT) throw new Error('Caption Design frame bound is invalid.')
  if (value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS) throw new Error('Caption Design evidence bound is invalid.')
  if (value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS) {
    throw new Error('Caption Design structured-context bound is invalid.')
  }
  if (value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS) {
    throw new Error('Caption Design scan-duration bound is invalid.')
  }
  if (!EVIDENCE_MODES.has(value.evidenceMode as EditReferenceCaptionDesignEvidenceMode)) {
    throw new Error('Caption Design evidence mode is invalid.')
  }
  const request = value as unknown as EditReferenceCaptionDesignStudyRequest
  validateSourceWindow(value)
  validateFrameSamples(value)
  validateEvidenceManifest(request)
  validateCaptionOcrAuthority(value)
  validateTranscriptTimingMode(request)
  validateCostAuthority(request)
  if (typeof value.sourceClaimsPresent !== 'boolean') throw new Error('Caption Design source-claims flag is invalid.')
  const requiredTrue = ['boundedPrivateFrameInputAllowed', 'boundedPrivateTranscriptInputAllowed'] as const
  if (requiredTrue.some((key) => value[key] !== true)) throw new Error('Caption Design bounded private-input boundary is invalid.')
  const requiredFalse = [
    'rawFullMediaInputAllowed', 'rawRecognizedTextInputAllowed', 'rawTranscriptInRequestAllowed',
    'externalUrlFetchAllowed', 'mockTranscriptInputAllowed', 'interpolatedWordTimingAllowed',
    'rawFramePersistenceAllowed', 'rawOcrOutputPersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'exactReferenceCaptionWordingTransferAllowed',
    'exactReferenceFontIdentityTransferAllowed', 'exactReferenceLineBreakTransferAllowed',
    'exactReferenceHighlightWordTransferAllowed', 'exactReferenceColorValueTransferAllowed',
    'exactReferenceLayoutTransferAllowed', 'exactReferenceAnimationCurveTransferAllowed',
    'exactReferenceTimingTransferAllowed', 'copyrightedFontOrBrandAssetTransferAllowed',
    'executableCaptionPlanAllowed', 'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ] as const
  if (requiredFalse.some((key) => value[key] !== false)) {
    throw new Error('Caption Design privacy, copy, execution, or customer-cost boundary is invalid.')
  }
}

export function validateEditReferenceCaptionDesignStudyResult(
  request: EditReferenceCaptionDesignStudyRequest,
  value: unknown,
): asserts value is EditReferenceCaptionDesignStudyResult {
  validateEditReferenceCaptionDesignStudyRequest(request)
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Caption Design study result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION) {
    throw new Error('Caption Design study result version is unsupported.')
  }
  if (value.requestDigestSha256 !== hashEditReferenceCaptionDesignStudyRequest(request)) {
    throw new Error('Caption Design study result does not match the exact request.')
  }
  if (value.status === 'blocked') {
    validateBlockedResult(request, value)
    return
  }
  if (value.status !== 'analyzed') throw new Error('Caption Design study result status is unsupported.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceCaptionDesignStudyResult(input: {
  request: EditReferenceCaptionDesignStudyRequest
  blockerCode: EditReferenceCaptionDesignStudyBlockerCode
  blockerMessage: string
  retryAvailable: boolean
  retryReason: string | null
  execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly captionOcrResultRead?: boolean
    readonly privateTranscriptTimingRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
    readonly temporaryFramesCleaned?: boolean
  }
  usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedCaptionDesignStudyResult {
  const result: EditReferenceBlockedCaptionDesignStudyResult = {
    schemaVersion: EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceCaptionDesignStudyRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryReason,
    findings: [],
    boundedPrivateFramesRead: input.execution?.boundedPrivateFramesRead ?? false,
    captionOcrResultRead: input.execution?.captionOcrResultRead ?? false,
    privateTranscriptTimingRead: input.execution?.privateTranscriptTimingRead ?? false,
    providerCallMade: input.execution?.providerCallMade ?? false,
    modelCallMade: input.execution?.modelCallMade ?? false,
    workerJobCreated: input.execution?.workerJobCreated ?? false,
    temporaryFramesCleaned: input.execution?.temporaryFramesCleaned ?? true,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceCaptionDesignStudyResult(input.request, result)
  return result
}

function validateSourceWindow(value: Record<string, unknown>): void {
  for (const key of ['sourceDurationSeconds', 'analysisWindowStartSeconds', 'analysisWindowEndSeconds'] as const) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key])) throw new Error('Caption Design source window is invalid.')
  }
  if (
    (value.sourceDurationSeconds as number) <= 0
    || (value.analysisWindowStartSeconds as number) < 0
    || (value.analysisWindowEndSeconds as number) <= (value.analysisWindowStartSeconds as number)
    || (value.analysisWindowEndSeconds as number) > (value.sourceDurationSeconds as number)
    || (value.analysisWindowEndSeconds as number) - (value.analysisWindowStartSeconds as number) > MAX_SCAN_DURATION_SECONDS
  ) throw new Error('Caption Design source window exceeds the approved bound.')
}

function validateFrameSamples(request: Record<string, unknown>): void {
  if (!Array.isArray(request.frameSamples) || request.frameSamples.length < 1 || request.frameSamples.length > MAX_FRAME_COUNT) {
    throw new Error('Caption Design frame samples are outside the approved bound.')
  }
  const frameIds = new Set<string>()
  const artifactIds = new Set<string>()
  let representativeCount = 0
  for (const sample of request.frameSamples) {
    if (!isRecord(sample)) throw new Error('Caption Design frame sample is invalid.')
    assertExactKeys(sample, [
      'role', 'frameEvidenceId', 'privateFrameArtifactId', 'frameChecksumSha256',
      'sourceTimeSeconds', 'width', 'height', 'privateAccessVerified', 'ephemeral', 'cleanupRequired',
    ], 'frame sample')
    if (!['representative', 'caption_detail'].includes(String(sample.role))) {
      throw new Error('Caption Design frame role is invalid.')
    }
    if (sample.role === 'representative') representativeCount += 1
    assertId(sample.frameEvidenceId, 'Caption Design frame evidence ID is invalid.')
    assertId(sample.privateFrameArtifactId, 'Caption Design private frame artifact ID is invalid.')
    assertSha256(sample.frameChecksumSha256, 'Caption Design frame checksum is invalid.')
    if (frameIds.has(sample.frameEvidenceId as string) || artifactIds.has(sample.privateFrameArtifactId as string)) {
      throw new Error('Caption Design frame identities must be unique.')
    }
    frameIds.add(sample.frameEvidenceId as string)
    artifactIds.add(sample.privateFrameArtifactId as string)
    if (
      typeof sample.sourceTimeSeconds !== 'number'
      || !Number.isFinite(sample.sourceTimeSeconds)
      || sample.sourceTimeSeconds < (request.analysisWindowStartSeconds as number)
      || sample.sourceTimeSeconds > (request.analysisWindowEndSeconds as number)
      || typeof sample.width !== 'number'
      || !Number.isSafeInteger(sample.width)
      || sample.width < 1
      || sample.width > 16_384
      || typeof sample.height !== 'number'
      || !Number.isSafeInteger(sample.height)
      || sample.height < 1
      || sample.height > 16_384
      || sample.privateAccessVerified !== true
      || sample.ephemeral !== true
      || sample.cleanupRequired !== true
    ) throw new Error('Caption Design frame authority or geometry is invalid.')
  }
  if (representativeCount < 1) throw new Error('Caption Design requires a representative frame.')
}

function validateEvidenceManifest(request: EditReferenceCaptionDesignStudyRequest): void {
  if (!isRecord(request.evidence)) throw new Error('Caption Design evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'representativeFrameEvidenceIds',
    'technicalCaptionRegionEvidenceIds', 'captionOcrEvidenceIds', 'visualLanguageEvidenceIds',
    'transcriptEvidenceIds', 'segmentTimingEvidenceIds', 'wordTimingEvidenceIds',
    'studyChatGoalEvidenceIds', 'factSafetyEvidenceIds',
  ] as const
  assertExactKeys(request.evidence as unknown as Record<string, unknown>, keys, 'evidence manifest')
  const all: string[] = []
  for (const key of keys) {
    assertIdArray(request.evidence[key], MAX_EVIDENCE_ITEMS, true, `Caption Design ${key} are invalid.`)
    all.push(...request.evidence[key])
  }
  if (all.length < 1 || all.length > MAX_EVIDENCE_ITEMS || new Set(all).size !== all.length) {
    throw new Error('Caption Design evidence IDs must be bounded and globally unique.')
  }
  if (
    request.evidence.representativeFrameEvidenceIds.length < 1
    || request.evidence.technicalCaptionRegionEvidenceIds.length < 1
    || request.evidence.captionOcrEvidenceIds.length < 1
    || request.evidence.studyChatGoalEvidenceIds.length < 1
  ) throw new Error('Caption Design frame, region, OCR, and study-goal evidence are mandatory.')
  const sampleIds = new Set(request.frameSamples.map((sample) => sample.frameEvidenceId))
  if (
    request.evidence.representativeFrameEvidenceIds.some((id) => !sampleIds.has(id))
    || request.frameSamples.some((sample) => !request.evidence.representativeFrameEvidenceIds.includes(sample.frameEvidenceId))
  ) throw new Error('Caption Design frame samples must match the frame evidence manifest.')
  if (request.sourceClaimsPresent && request.evidence.factSafetyEvidenceIds.length < 1) {
    throw new Error('Caption Design claim context requires fact-safety evidence.')
  }
}

function validateCaptionOcrAuthority(request: Record<string, unknown>): void {
  for (const key of ['captionOcrAdapterId', 'captionOcrAdapterVersion', 'captionOcrExecutionId'] as const) {
    assertId(request[key], 'Caption Design OCR provenance is invalid.')
  }
  if (
    request.captionOcrRuntimeSource !== 'verified_local'
    || !['full', 'partial'].includes(String(request.captionOcrCoverage))
    || typeof request.captionOcrAnalyzedFrameCount !== 'number'
    || !Number.isSafeInteger(request.captionOcrAnalyzedFrameCount)
    || request.captionOcrAnalyzedFrameCount < 1
    || request.captionOcrAnalyzedFrameCount > 24
    || typeof request.captionOcrRegionCount !== 'number'
    || !Number.isSafeInteger(request.captionOcrRegionCount)
    || request.captionOcrRegionCount < 1
    || request.captionOcrRegionCount > 384
    || request.captionOcrRuntimeExecuted !== true
    || request.captionOcrExactTextPersisted !== false
    || request.captionOcrRawOutputPersisted !== false
  ) throw new Error('Caption Design requires exact low-level OCR result authority without retained text.')
}

function validateTranscriptTimingMode(request: EditReferenceCaptionDesignStudyRequest): void {
  assertNonNegativeSafeInteger(request.transcriptSegmentCount, 1_000, 'Caption Design transcript segment count is invalid.')
  assertNonNegativeSafeInteger(request.alignedWordCount, 10_000, 'Caption Design aligned-word count is invalid.')
  if (request.evidenceMode === 'visual_ocr') {
    if (
      request.privateTranscriptArtifactId !== null
      || request.transcriptChecksumSha256 !== null
      || request.privateWordTimingArtifactId !== null
      || request.wordTimingChecksumSha256 !== null
      || request.privateTranscriptAccessVerified !== false
      || request.privateTranscriptFinalized !== false
      || request.transcriptChecksumVerified !== false
      || request.transcriptRuntimeExecuted !== false
      || request.transcriptRuntimeSource !== null
      || request.transcriptRuntimeId !== null
      || request.transcriptRuntimeVersion !== null
      || request.transcriptModelManifestId !== null
      || request.transcriptExecutionId !== null
      || request.transcriptQaStatus !== null
      || request.segmentTimingAuthorityVerified !== false
      || request.wordTimingAuthorityVerified !== false
      || request.transcriptSegmentCount !== 0
      || request.alignedWordCount !== 0
      || request.evidence.transcriptEvidenceIds.length !== 0
      || request.evidence.segmentTimingEvidenceIds.length !== 0
      || request.evidence.wordTimingEvidenceIds.length !== 0
    ) throw new Error('Visual-only Caption Design evidence cannot claim transcript timing authority.')
    return
  }
  assertId(request.privateTranscriptArtifactId, 'Timed Caption Design requires a private transcript artifact.')
  assertSha256(request.transcriptChecksumSha256, 'Timed Caption Design transcript checksum is invalid.')
  for (const key of ['transcriptRuntimeId', 'transcriptRuntimeVersion', 'transcriptModelManifestId', 'transcriptExecutionId'] as const) {
    assertId(request[key], 'Timed Caption Design transcript provenance is invalid.')
  }
  if (
    request.privateTranscriptAccessVerified !== true
    || request.privateTranscriptFinalized !== true
    || request.transcriptChecksumVerified !== true
    || request.transcriptRuntimeExecuted !== true
    || !['verified_local', 'verified_live'].includes(String(request.transcriptRuntimeSource))
    || !['passed', 'warning'].includes(String(request.transcriptQaStatus))
    || request.segmentTimingAuthorityVerified !== true
    || request.transcriptSegmentCount < 1
    || request.evidence.transcriptEvidenceIds.length < 1
    || request.evidence.segmentTimingEvidenceIds.length < 1
  ) throw new Error('Timed Caption Design requires verified transcript and segment timing authority.')
  if (request.evidenceMode === 'visual_ocr_segment_timing') {
    if (
      request.privateWordTimingArtifactId !== null
      || request.wordTimingChecksumSha256 !== null
      || request.wordTimingAuthorityVerified !== false
      || request.alignedWordCount !== 0
      || request.evidence.wordTimingEvidenceIds.length !== 0
    ) throw new Error('Segment-only Caption Design evidence cannot claim word timing.')
    return
  }
  assertId(request.privateWordTimingArtifactId, 'Word-timed Caption Design requires a private word-timing artifact.')
  assertSha256(request.wordTimingChecksumSha256, 'Word-timed Caption Design checksum is invalid.')
  if (
    request.wordTimingAuthorityVerified !== true
    || request.alignedWordCount < 1
    || request.evidence.wordTimingEvidenceIds.length < 1
  ) throw new Error('Word-timed Caption Design requires verified non-interpolated word timing authority.')
}

function validateCostAuthority(request: EditReferenceCaptionDesignStudyRequest): void {
  if (!['controlled_test', 'production'].includes(request.executionScope)) {
    throw new Error('Caption Design execution scope is invalid.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      request.approvedUsageEstimateId !== null
      || request.internalCostBudgetId !== null
      || request.immutableRateCardSnapshotId !== null
      || request.maximumAuthorizedInternalCostMicros !== null
    ) throw new Error('Controlled Caption Design tests cannot claim production cost authority.')
    return
  }
  assertId(request.approvedUsageEstimateId, 'Production Caption Design requires an approved usage estimate.')
  assertId(request.internalCostBudgetId, 'Production Caption Design requires an internal cost budget.')
  assertId(request.immutableRateCardSnapshotId, 'Production Caption Design requires an immutable rate-card snapshot.')
  assertPositiveMoneyMicros(request.maximumAuthorizedInternalCostMicros, 'Production Caption Design requires a positive maximum authorized internal cost.')
}

function validateBlockedResult(
  request: EditReferenceCaptionDesignStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', 'retryReason', 'findings', 'boundedPrivateFramesRead',
    'captionOcrResultRead', 'privateTranscriptTimingRead', 'providerCallMade', 'modelCallMade',
    'workerJobCreated', 'temporaryFramesCleaned', 'internalCostStatus',
    'meteredInternalCostMicros', 'usageEventIds', 'internalCostRecordIds',
    'remoteMutationMade', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceCaptionDesignStudyBlockerCode)) {
    throw new Error('Caption Design blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 500, 'Caption Design blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Caption Design retry flag is invalid.')
  if (value.retryAvailable) assertSafeText(value.retryReason, 500, 'Retryable Caption Design blockers require a safe reason.')
  else if (value.retryReason !== null) throw new Error('Non-retryable Caption Design blockers cannot include a retry reason.')
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Caption Design results cannot contain findings.')
  }
  for (const key of [
    'boundedPrivateFramesRead', 'captionOcrResultRead', 'privateTranscriptTimingRead',
    'providerCallMade', 'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned',
  ] as const) if (typeof value[key] !== 'boolean') {
    throw new Error('Blocked Caption Design execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Blocked Caption Design result crossed a remote or customer-charging boundary.')
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Caption Design internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Caption Design internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Caption Design usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Caption Design internal-cost IDs are invalid.')
  const providerOrWorkerExecution = value.providerCallMade === true
    || value.workerJobCreated === true
  const costBearingExecution = providerOrWorkerExecution || value.modelCallMade === true
  if (request.executionScope === 'controlled_test') {
    if (
      providerOrWorkerExecution
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Caption Design blockers cannot claim provider/worker execution or cost.')
  } else if (costBearingExecution) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked Caption Design execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Caption Design execution cannot claim no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Caption Design cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Caption Design execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Caption Design execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) throw new Error('Unstarted Caption Design blockers cannot claim internal-cost usage.')
}

function validateAnalyzedResult(
  request: EditReferenceCaptionDesignStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId',
    'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId',
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256',
    'captionOcrResultDigestSha256', 'consumedFrameEvidenceIds', 'evidence', 'findings',
    'captionOcrAuthority', 'transcriptTimingAuthority', 'coverage', 'summary', 'execution',
    'analyzer', 'provenance', 'usage', 'privacy', 'copySafety', 'factSafety',
    'readabilitySafety', 'transferBoundary',
  ], 'analyzed result')
  if (!['verified_local', 'verified_live'].includes(String(value.runtimeSource))) {
    throw new Error('Caption Design analyzed runtime source is invalid.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    if (value[key] !== request[key]) throw new Error('Caption Design analyzed result identity does not match the request.')
  }
  for (const key of ['mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256', 'captionOcrResultDigestSha256'] as const) {
    if (value[key] !== request[key]) throw new Error('Caption Design analyzed result lineage does not match the request.')
  }
  assertMatchingIdSet(value.consumedFrameEvidenceIds, request.frameSamples.map((sample) => sample.frameEvidenceId), 'Caption Design consumed-frame evidence is invalid.')
  validateMatchingEvidenceManifest(value.evidence, request.evidence)
  validateCaptionOcrResultAuthority(request, value.captionOcrAuthority)
  validateTranscriptResultAuthority(request, value.transcriptTimingAuthority)
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(request, value.runtimeSource, value.execution)
  validateAnalyzer(value.runtimeSource, value.analyzer)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validatePrivacy(value.privacy)
  validateAllFalseObject(value.copySafety, [
    'exactCaptionWordingRetained', 'exactFontIdentityTransferInstructionCreated',
    'exactLineBreakCopyInstructionCreated', 'exactHighlightWordCopyInstructionCreated',
    'exactColorValueCopyInstructionCreated', 'exactLayoutCopyInstructionCreated',
    'exactAnimationCurveCopyInstructionCreated', 'exactTimingMapCopyInstructionCreated',
    'copyrightedFontOrBrandAssetTransferInstructionCreated',
  ], 'Caption Design copy-safety boundary is invalid.')
  validateFactSafety(request, value.factSafety)
  validateReadabilitySafety(value.readabilitySafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateCaptionOcrResultAuthority(request: EditReferenceCaptionDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design OCR result authority is invalid.')
  assertExactKeys(value, [
    'runtimeSource', 'adapterId', 'adapterVersion', 'executionId', 'coverage',
    'analyzedFrameCount', 'regionCount', 'exactTextPersisted', 'rawOutputPersisted',
  ], 'OCR result authority')
  if (
    value.runtimeSource !== request.captionOcrRuntimeSource
    || value.adapterId !== request.captionOcrAdapterId
    || value.adapterVersion !== request.captionOcrAdapterVersion
    || value.executionId !== request.captionOcrExecutionId
    || value.coverage !== request.captionOcrCoverage
    || value.analyzedFrameCount !== request.captionOcrAnalyzedFrameCount
    || value.regionCount !== request.captionOcrRegionCount
    || value.exactTextPersisted !== false
    || value.rawOutputPersisted !== false
  ) throw new Error('Caption Design OCR result authority does not match the request.')
}

function validateTranscriptResultAuthority(request: EditReferenceCaptionDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design transcript timing authority is invalid.')
  assertExactKeys(value, [
    'evidenceMode', 'privateTranscriptArtifactId', 'transcriptChecksumSha256',
    'privateWordTimingArtifactId', 'wordTimingChecksumSha256', 'transcriptRuntimeSource',
    'transcriptRuntimeId', 'transcriptRuntimeVersion', 'transcriptModelManifestId',
    'transcriptExecutionId', 'transcriptQaStatus', 'segmentTimingAuthorityVerified',
    'wordTimingAuthorityVerified', 'transcriptSegmentCount', 'alignedWordCount',
    'mockTranscriptUsed', 'interpolatedWordTimingUsed', 'transcriptTextEmbeddedInResult',
  ], 'transcript timing authority')
  const matchingKeys = [
    'evidenceMode', 'privateTranscriptArtifactId', 'transcriptChecksumSha256',
    'privateWordTimingArtifactId', 'wordTimingChecksumSha256', 'transcriptRuntimeSource',
    'transcriptRuntimeId', 'transcriptRuntimeVersion', 'transcriptModelManifestId',
    'transcriptExecutionId', 'transcriptQaStatus', 'segmentTimingAuthorityVerified',
    'wordTimingAuthorityVerified', 'transcriptSegmentCount', 'alignedWordCount',
  ] as const
  if (matchingKeys.some((key) => value[key] !== request[key])) {
    throw new Error('Caption Design transcript timing authority does not match the request.')
  }
  if (
    value.mockTranscriptUsed !== false
    || value.interpolatedWordTimingUsed !== false
    || value.transcriptTextEmbeddedInResult !== false
  ) throw new Error('Caption Design transcript timing authority crossed its privacy boundary.')
}

function validateFindings(
  request: EditReferenceCaptionDesignStudyRequest,
  value: unknown,
): readonly EditReferenceCaptionDesignFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Caption Design findings are outside the approved bound.')
  }
  const findings = value as unknown as EditReferenceCaptionDesignFinding[]
  const allEvidenceIds = new Set(allEvidence(request.evidence))
  const frameIds = new Set(request.frameSamples.map((sample) => sample.frameEvidenceId))
  const findingIds = new Set<string>()
  const rangeIds = new Set<string>()
  for (const finding of findings) {
    if (!isRecord(finding)) throw new Error('Caption Design finding is invalid.')
    assertExactKeys(finding, [
      'findingId', 'category', 'summary', 'evidenceIds', 'frameEvidenceIds', 'sourceRanges',
      'confidence', 'transferability', 'evidenceMode', 'timingBasis', 'targetAdaptationRequired',
      'requiresUserReview', 'safeZoneRelated', 'speechTimingRelated', 'fontOrBrandRelated',
      'claimRelated', 'factSafetyStatus', 'observedDesignOnly', 'generalizedNonVerbatimSummary',
      'exactReferenceCaptionWordingRetained', 'exactFontIdentityClaimCreated',
      'exactLineBreakCopyInstructionCreated', 'exactHighlightWordCopyInstructionCreated',
      'exactColorValueCopyInstructionCreated', 'exactLayoutCopyInstructionCreated',
      'exactAnimationCurveCopyInstructionCreated', 'exactTimingMapCopyInstructionCreated',
      'copyrightedFontOrBrandAssetTransferInstructionCreated', 'executableCaptionPlanCreated',
      'sourceCaptionTextCopied',
    ], 'finding')
    assertId(finding.findingId, 'Caption Design finding ID is invalid.')
    if (findingIds.has(finding.findingId)) throw new Error('Caption Design finding IDs must be unique.')
    findingIds.add(finding.findingId)
    if (!FINDING_CATEGORIES.has(finding.category)) throw new Error('Caption Design finding category is invalid.')
    assertSafeText(finding.summary, 2_000, 'Caption Design finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Caption Design finding evidence IDs are invalid.')
    if (finding.evidenceIds.some((id) => !allEvidenceIds.has(id))) {
      throw new Error('Caption Design finding references evidence outside the approved manifest.')
    }
    assertIdArray(finding.frameEvidenceIds, MAX_FRAME_COUNT, false, 'Caption Design finding frame evidence is invalid.')
    if (finding.frameEvidenceIds.some((id) => !frameIds.has(id))) {
      throw new Error('Caption Design finding references an unapproved frame.')
    }
    if (!TRANSFERABILITIES.has(finding.transferability)) throw new Error('Caption Design transferability is invalid.')
    if (finding.evidenceMode !== request.evidenceMode) throw new Error('Caption Design finding evidence mode does not match the request.')
    if (!TIMING_BASES.has(finding.timingBasis)) throw new Error('Caption Design finding timing basis is invalid.')
    assertUnitInterval(finding.confidence, 'Caption Design finding confidence is invalid.')
    for (const key of ['requiresUserReview', 'safeZoneRelated', 'speechTimingRelated', 'fontOrBrandRelated', 'claimRelated'] as const) {
      if (typeof finding[key] !== 'boolean') throw new Error('Caption Design finding review or risk flag is invalid.')
    }
    if (
      finding.targetAdaptationRequired !== true
      || finding.observedDesignOnly !== true
      || finding.generalizedNonVerbatimSummary !== true
    ) throw new Error('Caption Design finding must remain generalized source evidence requiring target adaptation.')
    const falseKeys = [
      'exactReferenceCaptionWordingRetained', 'exactFontIdentityClaimCreated',
      'exactLineBreakCopyInstructionCreated', 'exactHighlightWordCopyInstructionCreated',
      'exactColorValueCopyInstructionCreated', 'exactLayoutCopyInstructionCreated',
      'exactAnimationCurveCopyInstructionCreated', 'exactTimingMapCopyInstructionCreated',
      'copyrightedFontOrBrandAssetTransferInstructionCreated', 'executableCaptionPlanCreated',
      'sourceCaptionTextCopied',
    ] as const
    if (falseKeys.some((key) => finding[key] !== false)) throw new Error('Caption Design finding crossed a copy or execution boundary.')
    validateFindingAuthority(request, finding)
    validateSourceRanges(request, finding, rangeIds)
  }
  return findings
}

function validateFindingAuthority(
  request: EditReferenceCaptionDesignStudyRequest,
  finding: EditReferenceCaptionDesignFinding,
): void {
  if (finding.category === 'safe_zone_behavior' && !finding.safeZoneRelated) {
    throw new Error('Caption Design safe-zone findings must be marked safe-zone related.')
  }
  if (finding.category === 'speech_alignment') {
    if (!finding.speechTimingRelated || request.evidenceMode === 'visual_ocr' || finding.timingBasis === 'frame_sequence') {
      throw new Error('Caption Design speech alignment requires verified segment or word timing evidence.')
    }
  }
  if (finding.timingBasis === 'segment') {
    if (request.evidenceMode === 'visual_ocr' || request.evidence.segmentTimingEvidenceIds.length < 1) {
      throw new Error('Caption Design segment-timed findings lack segment timing authority.')
    }
  }
  if (finding.timingBasis === 'word') {
    if (request.evidenceMode !== 'visual_ocr_word_timing' || request.evidence.wordTimingEvidenceIds.length < 1) {
      throw new Error('Caption Design word-timed findings lack word timing authority.')
    }
  }
  if (finding.claimRelated) {
    if (finding.factSafetyStatus === 'not_applicable' || request.evidence.factSafetyEvidenceIds.length < 1 || !finding.requiresUserReview) {
      throw new Error('Claim-related Caption Design findings require fact-safety evidence and review.')
    }
  } else if (finding.factSafetyStatus !== 'not_applicable') {
    throw new Error('Non-claim Caption Design findings must use not-applicable fact safety.')
  }
  if (finding.fontOrBrandRelated && !finding.requiresUserReview) {
    throw new Error('Font- or brand-related Caption Design findings require user review.')
  }
}

function validateSourceRanges(
  request: EditReferenceCaptionDesignStudyRequest,
  finding: EditReferenceCaptionDesignFinding,
  rangeIds: Set<string>,
): void {
  if (!Array.isArray(finding.sourceRanges) || finding.sourceRanges.length < 1 || finding.sourceRanges.length > MAX_SOURCE_RANGES_PER_FINDING) {
    throw new Error('Caption Design finding source ranges are outside the approved bound.')
  }
  for (const range of finding.sourceRanges) {
    if (!isRecord(range)) throw new Error('Caption Design source range is invalid.')
    assertExactKeys(range, [
      'rangeId', 'startSeconds', 'endSeconds', 'timingBasis', 'evidenceIds',
      'sourceEvidenceOnly', 'targetTimingInstructionCreated', 'executableCaptionTimingCreated',
    ], 'source range')
    assertId(range.rangeId, 'Caption Design source-range ID is invalid.')
    if (rangeIds.has(range.rangeId)) throw new Error('Caption Design source-range IDs must be globally unique.')
    rangeIds.add(range.rangeId)
    if (
      typeof range.startSeconds !== 'number'
      || !Number.isFinite(range.startSeconds)
      || typeof range.endSeconds !== 'number'
      || !Number.isFinite(range.endSeconds)
      || range.startSeconds < request.analysisWindowStartSeconds
      || range.endSeconds <= range.startSeconds
      || range.endSeconds > request.analysisWindowEndSeconds
      || range.timingBasis !== finding.timingBasis
    ) throw new Error('Caption Design source range is outside the approved window or timing basis.')
    assertIdArray(range.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Caption Design source-range evidence is invalid.')
    if (range.evidenceIds.some((id) => !finding.evidenceIds.includes(id))) {
      throw new Error('Caption Design source range references evidence outside its finding.')
    }
    if (
      range.sourceEvidenceOnly !== true
      || range.targetTimingInstructionCreated !== false
      || range.executableCaptionTimingCreated !== false
    ) throw new Error('Caption Design source ranges cannot create target or executable timing.')
  }
}

function validateCoverage(request: EditReferenceCaptionDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount', 'frameCount', 'captionDetailFrameCount', 'captionOcrAnalyzedFrameCount',
    'captionOcrRegionCount', 'captionOcrCoverage', 'sourceDurationSeconds',
    'analysisWindowStartSeconds', 'analysisWindowEndSeconds', 'analyzedDurationSeconds',
    'evidenceMode', 'transcriptSegmentCount', 'alignedWordCount', 'timingPrecision',
    'partial', 'missingEvidenceKinds',
  ], 'coverage')
  const expectedMissing = request.evidenceMode === 'visual_ocr'
    ? ['transcript_timing', 'word_timing']
    : request.evidenceMode === 'visual_ocr_segment_timing'
      ? ['word_timing']
      : []
  const expectedPartial = request.captionOcrCoverage === 'partial' || expectedMissing.length > 0
  if (
    value.evidenceItemCount !== allEvidence(request.evidence).length
    || value.frameCount !== request.frameSamples.length
    || value.captionDetailFrameCount !== request.frameSamples.filter((sample) => sample.role === 'caption_detail').length
    || value.captionOcrAnalyzedFrameCount !== request.captionOcrAnalyzedFrameCount
    || value.captionOcrRegionCount !== request.captionOcrRegionCount
    || value.captionOcrCoverage !== request.captionOcrCoverage
    || value.sourceDurationSeconds !== request.sourceDurationSeconds
    || value.analysisWindowStartSeconds !== request.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds !== request.analysisWindowEndSeconds
    || value.analyzedDurationSeconds !== request.analysisWindowEndSeconds - request.analysisWindowStartSeconds
    || value.evidenceMode !== request.evidenceMode
    || value.transcriptSegmentCount !== request.transcriptSegmentCount
    || value.alignedWordCount !== request.alignedWordCount
    || value.timingPrecision !== timingPrecision(request.evidenceMode)
    || value.partial !== expectedPartial
  ) throw new Error('Caption Design coverage does not match the request.')
  assertSafeStringArray(value.missingEvidenceKinds, 16, true, 100, 'Caption Design missing-evidence kinds are invalid.')
  if (!sameStringSet(value.missingEvidenceKinds as string[], expectedMissing)) {
    throw new Error('Caption Design missing-evidence kinds do not match the evidence mode.')
  }
}

function validateSummary(findings: readonly EditReferenceCaptionDesignFinding[], value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design summary is invalid.')
  assertExactKeys(value, [
    'findingCount', 'categoryCount', 'transferablePrincipleCount', 'contextOnlyCount',
    'nonTransferableCount', 'averageConfidence',
  ], 'summary')
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (
    value.findingCount !== findings.length
    || value.categoryCount !== new Set(findings.map((finding) => finding.category)).size
    || value.transferablePrincipleCount !== findings.filter((finding) => finding.transferability === 'transferable_principle').length
    || value.contextOnlyCount !== findings.filter((finding) => finding.transferability === 'context_only').length
    || value.nonTransferableCount !== findings.filter((finding) => finding.transferability === 'non_transferable').length
    || typeof value.averageConfidence !== 'number'
    || !Number.isFinite(value.averageConfidence)
    || Math.abs(value.averageConfidence - average) > 0.000_001
  ) throw new Error('Caption Design summary does not match the findings.')
}

function validateExecution(
  request: EditReferenceCaptionDesignStudyRequest,
  runtimeSource: unknown,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Caption Design execution proof is invalid.')
  assertExactKeys(value, [
    'boundedPrivateFramesRead', 'captionOcrResultRead', 'privateTranscriptTimingRead',
    'semanticCaptionDesignModelExecuted', 'ocrEngineExecutedByCaptionDesignAnalyzer',
    'rawFullMediaRead', 'rawRecognizedTextRead', 'rawTranscriptRead', 'externalUrlFetched',
    'providerCallMade', 'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned',
    'remoteMutationMade',
  ], 'execution proof')
  if (
    value.boundedPrivateFramesRead !== true
    || value.captionOcrResultRead !== true
    || value.privateTranscriptTimingRead !== (request.evidenceMode !== 'visual_ocr')
    || value.semanticCaptionDesignModelExecuted !== true
    || value.ocrEngineExecutedByCaptionDesignAnalyzer !== false
    || value.rawFullMediaRead !== false
    || value.rawRecognizedTextRead !== false
    || value.rawTranscriptRead !== false
    || value.externalUrlFetched !== false
    || value.modelCallMade !== true
    || typeof value.workerJobCreated !== 'boolean'
    || value.temporaryFramesCleaned !== true
    || value.remoteMutationMade !== false
  ) throw new Error('Caption Design analyzed result lacks exact bounded execution proof.')
  if (runtimeSource === 'verified_local' && value.providerCallMade !== false) {
    throw new Error('Local Caption Design execution cannot claim a provider call.')
  }
  if (runtimeSource === 'verified_live' && value.providerCallMade !== true) {
    throw new Error('Live Caption Design execution requires provider-call proof.')
  }
}

function validateAnalyzer(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design analyzer provenance is invalid.')
  assertExactKeys(value, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion',
    'analysisInstructionDigestSha256',
  ], 'analyzer provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], 'Caption Design analyzer provenance ID is invalid.')
  }
  assertSha256(value.modelAggregateSha256, 'Caption Design analyzer model aggregate is invalid.')
  assertSha256(value.analysisInstructionDigestSha256, 'Caption Design analyzer instruction digest is invalid.')
  if (runtimeSource === 'verified_local') {
    if (value.providerId !== null) throw new Error('Local Caption Design analyzer cannot claim a provider.')
  } else {
    assertId(value.providerId, 'Live Caption Design analyzer requires a provider ID.')
  }
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Caption Design execution ID is invalid.')
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt) || Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
    throw new Error('Caption Design provenance timestamps are invalid.')
  }
}

function validateUsage(request: EditReferenceCaptionDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design usage evidence is invalid.')
  assertExactKeys(value, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'usage evidence')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Caption Design metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 32, true, 'Caption Design usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 32, true, 'Caption Design internal-cost record IDs are invalid.')
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
    ) throw new Error('Controlled Caption Design tests cannot claim production cost records.')
  } else {
    if (
      value.mode !== 'production_metered'
      || value.approvedUsageEstimateId !== request.approvedUsageEstimateId
      || value.internalCostBudgetId !== request.internalCostBudgetId
      || value.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
      || value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
      || (value.usageEventIds as unknown[]).length < 1
      || (value.internalCostRecordIds as unknown[]).length < 1
    ) throw new Error('Production Caption Design execution requires exact internal-cost authority.')
    if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
      throw new Error('Caption Design execution exceeded its maximum authorized internal cost.')
    }
  }
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Caption Design usage crossed the customer-pricing boundary.')
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design privacy evidence is invalid.')
  assertExactKeys(value, [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawOcrOutputPersisted',
    'recognizedCaptionTextPersisted', 'rawTranscriptEmbeddedInStudyResult',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
    'temporaryFramesCleaned',
  ], 'privacy evidence')
  const falseKeys = [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawOcrOutputPersisted',
    'recognizedCaptionTextPersisted', 'rawTranscriptEmbeddedInStudyResult',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
  ]
  if (falseKeys.some((key) => value[key] !== false) || value.temporaryFramesCleaned !== true) {
    throw new Error('Caption Design privacy boundary is invalid.')
  }
}

function validateFactSafety(request: EditReferenceCaptionDesignStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design fact-safety evidence is invalid.')
  assertExactKeys(value, [
    'claimEvidenceRequired', 'claimEvidenceIds', 'unverifiedClaimPresentedAsFact',
    'sourceAttributionRemoved', 'misleadingCaptionInstructionCreated',
  ], 'fact-safety evidence')
  if (value.claimEvidenceRequired !== request.sourceClaimsPresent) {
    throw new Error('Caption Design fact-safety requirement does not match the request.')
  }
  assertMatchingIdSet(value.claimEvidenceIds, request.sourceClaimsPresent ? request.evidence.factSafetyEvidenceIds : [], 'Caption Design fact-safety evidence IDs are invalid.')
  for (const key of ['unverifiedClaimPresentedAsFact', 'sourceAttributionRemoved', 'misleadingCaptionInstructionCreated'] as const) {
    if (value[key] !== false) throw new Error('Caption Design fact-safety boundary is invalid.')
  }
}

function validateReadabilitySafety(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design readability safety is invalid.')
  assertExactKeys(value, [
    'speechClarityPriorityPreserved', 'targetSafeZoneReviewRequired',
    'targetCollisionReviewRequired', 'targetAspectRatioRequired',
    'foregroundMaskCollisionAllowed', 'importantVisualOcclusionAllowed',
  ], 'readability safety')
  if (
    value.speechClarityPriorityPreserved !== true
    || value.targetSafeZoneReviewRequired !== true
    || value.targetCollisionReviewRequired !== true
    || value.targetAspectRatioRequired !== true
    || value.foregroundMaskCollisionAllowed !== false
    || value.importantVisualOcclusionAllowed !== false
  ) throw new Error('Caption Design readability safety boundary is invalid.')
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption Design transfer boundary is invalid.')
  assertExactKeys(value, [
    'technicalTextLikeRegionsTreatedAsConfirmedCaptions',
    'ocrGeometryTreatedAsSemanticCaptionDesignWithoutModel', 'segmentTimingTreatedAsWordAlignment',
    'exactFontIdentityInferred', 'findingsMayBecomeTargetInstructionsWithoutApplication',
    'targetEvidenceRequired', 'targetTranscriptTimingRequiredForSpeechAlignment',
    'targetLayoutAndSafeZoneValidationRequired', 'userApprovalRequired',
    'exactWordingFontLayoutAnimationOrTimingTransferAllowed',
  ], 'transfer boundary')
  const falseKeys = [
    'technicalTextLikeRegionsTreatedAsConfirmedCaptions',
    'ocrGeometryTreatedAsSemanticCaptionDesignWithoutModel', 'segmentTimingTreatedAsWordAlignment',
    'exactFontIdentityInferred', 'findingsMayBecomeTargetInstructionsWithoutApplication',
    'exactWordingFontLayoutAnimationOrTimingTransferAllowed',
  ]
  const trueKeys = [
    'targetEvidenceRequired', 'targetTranscriptTimingRequiredForSpeechAlignment',
    'targetLayoutAndSafeZoneValidationRequired', 'userApprovalRequired',
  ]
  if (falseKeys.some((key) => value[key] !== false) || trueKeys.some((key) => value[key] !== true)) {
    throw new Error('Caption Design transfer boundary is invalid.')
  }
}

function normalizedEvidenceManifest(
  evidence: EditReferenceCaptionDesignEvidenceManifest,
): EditReferenceCaptionDesignEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...evidence.mediaStructureEvidenceIds].sort(),
    representativeFrameEvidenceIds: [...evidence.representativeFrameEvidenceIds].sort(),
    technicalCaptionRegionEvidenceIds: [...evidence.technicalCaptionRegionEvidenceIds].sort(),
    captionOcrEvidenceIds: [...evidence.captionOcrEvidenceIds].sort(),
    visualLanguageEvidenceIds: [...evidence.visualLanguageEvidenceIds].sort(),
    transcriptEvidenceIds: [...evidence.transcriptEvidenceIds].sort(),
    segmentTimingEvidenceIds: [...evidence.segmentTimingEvidenceIds].sort(),
    wordTimingEvidenceIds: [...evidence.wordTimingEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...evidence.studyChatGoalEvidenceIds].sort(),
    factSafetyEvidenceIds: [...evidence.factSafetyEvidenceIds].sort(),
  }
}

function validateMatchingEvidenceManifest(
  value: unknown,
  expected: EditReferenceCaptionDesignEvidenceManifest,
): void {
  if (!isRecord(value)) throw new Error('Caption Design result evidence manifest is invalid.')
  const normalized = normalizedEvidenceManifest(value as unknown as EditReferenceCaptionDesignEvidenceManifest)
  if (JSON.stringify(normalized) !== JSON.stringify(normalizedEvidenceManifest(expected))) {
    throw new Error('Caption Design result evidence manifest does not match the request.')
  }
}

function allEvidence(evidence: EditReferenceCaptionDesignEvidenceManifest): string[] {
  return Object.values(normalizedEvidenceManifest(evidence)).flat()
}

function timingPrecision(mode: EditReferenceCaptionDesignEvidenceMode): 'visual_only' | 'segment' | 'word' {
  if (mode === 'visual_ocr_word_timing') return 'word'
  if (mode === 'visual_ocr_segment_timing') return 'segment'
  return 'visual_only'
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

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().every((entry, index) => entry === [...right].sort()[index])
}

function assertNonNegativeSafeInteger(value: unknown, max: number, message: string): void {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) throw new Error(message)
}

function assertUnitInterval(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(message)
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
    || value.some((entry) => typeof entry !== 'string' || !entry.trim() || entry.length > maxItemLength || UNSAFE_STRING_PATTERN.test(entry))
  ) throw new Error(message)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function validateAllFalseObject(value: unknown, keys: readonly string[], message: string): void {
  if (!isRecord(value)) throw new Error(message)
  assertExactKeys(value, keys, 'false-only boundary')
  if (keys.some((key) => value[key] !== false)) throw new Error(message)
}

function assertNoUnsafeContent(value: unknown, depth = 0): void {
  if (depth > 12) throw new Error('Caption Design contract nesting is too deep.')
  if (typeof value === 'string') {
    if (UNSAFE_STRING_PATTERN.test(value)) throw new Error('Caption Design contract contains unsafe private or credential-like text.')
    return
  }
  if (Array.isArray(value)) {
    for (const entry of value) assertNoUnsafeContent(entry, depth + 1)
    return
  }
  if (!isRecord(value)) return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('Caption Design contract contains a forbidden raw, exact-copy, or private field.')
    assertNoUnsafeContent(entry, depth + 1)
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`Caption Design ${label} contains unsupported fields.`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
