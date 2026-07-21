import type { EditReferenceLongFormStudyPlan } from './edit-reference-long-form-study-contract'

export const EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS = [
  'speech_transcript',
  'caption_ocr',
  'semantic_chunk_synthesis',
  'global_reconciliation',
  'coverage_qa',
] as const

export type EditReferenceLongFormSpecialistStageId =
  typeof EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS[number]

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS = [
  'visual_language',
  'story_editorial',
  'speech_pacing',
  'caption_design',
  'color_treatment',
  'audio_sound_design',
  'graphics_motion',
] as const

export type EditReferenceLongFormSemanticSpecialistId =
  typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS[number]

export type EditReferenceLongFormSemanticFindingCategory =
  | 'visual_language'
  | 'story_structure'
  | 'speech_pacing'
  | 'caption_design'
  | 'color_treatment'
  | 'audio_sound_design'
  | 'graphics_motion'
  | 'broll_pattern'
  | 'do_not_copy'

export interface EditReferenceLongFormSpeechTranscriptSegmentTimingRange {
  readonly segmentOrdinal: number
  readonly sourceStartSeconds: number
  readonly sourceEndSeconds: number
  readonly wordCount: number
}

export interface EditReferenceLongFormSpeechTranscriptResult {
  readonly kind: 'speech_transcript'
  readonly sourceAudioOutputDigestSha256: string
  readonly privateTranscriptArtifactId: string
  readonly transcriptArtifactChecksumSha256: string
  readonly speechPresent: boolean
  readonly segmentCount: number
  readonly wordCount: number
  /**
   * Timing-only durable authority used to keep bounded semantic windows from
   * splitting exact spoken segments. Transcript text and provider segment IDs
   * remain private and are never copied into the work output.
   */
  readonly segmentTimingRanges: readonly EditReferenceLongFormSpeechTranscriptSegmentTimingRange[]
  readonly languageCode: string | null
  readonly confidence: number
  readonly segmentTimingCoverageRatio: 1
  readonly wordTimingMode: 'exact' | 'not_available'
  readonly speakerSegmentationMode: 'verified' | 'not_requested'
  readonly fullCoreCoverage: true
  readonly transcriptTextPersistedInWorkOutput: false
  readonly rawAudioPersisted: false
  readonly interpolatedWordTimingUsed: false
}

export interface EditReferenceLongFormCaptionOcrResult {
  readonly kind: 'caption_ocr'
  readonly framePlanDigestSha256: string
  readonly requestedFrameTimesSeconds: readonly number[]
  readonly analyzedFrameTimesSeconds: readonly number[]
  readonly failedFrameTimesSeconds: readonly number[]
  readonly framesWithVisibleText: number
  readonly textRegionCount: number
  readonly averageRegionConfidence: number
  readonly ocrToolId: 'paddleocr' | 'tesseract' | 'controlled_specialist_fixture'
  readonly ocrEngineExecuted: boolean
  readonly fullPlannedFrameCoverage: true
  readonly rawOcrOutputPersisted: false
  readonly recognizedTextPersisted: false
  readonly exactCaptionWordingRetained: false
}

export interface EditReferenceLongFormSemanticSpecialistCoverage {
  readonly specialistId: EditReferenceLongFormSemanticSpecialistId
  readonly status: 'analyzed' | 'not_applicable'
  readonly confidence: number
  readonly runtimeSource: 'verified_local' | 'verified_live' | 'not_applicable'
  readonly semanticResultDigestSha256: string | null
  readonly evidenceOutputDigestsSha256: readonly string[]
}

export interface EditReferenceLongFormSemanticSynthesisRuntime {
  readonly runtimeSource: 'verified_local' | 'verified_live' | 'verified_mock'
  readonly adapterId: string
  readonly adapterVersion: string
  readonly providerId: string | null
  readonly modelId: string
  readonly modelRevision: string
  readonly modelAggregateSha256: string
  readonly modelRoutingPolicyVersion: string
  readonly synthesisInstructionDigestSha256: string
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
}

export interface EditReferenceLongFormSemanticFinding {
  readonly findingId: string
  readonly category: EditReferenceLongFormSemanticFindingCategory
  readonly summary: string
  readonly confidence: number
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly transferable: boolean
  readonly targetAdaptationRequired: true
  readonly exactCopyInstructionCreated: false
}

export interface EditReferenceLongFormSemanticChunkSynthesisResult {
  readonly kind: 'semantic_chunk_synthesis'
  readonly inputOutputDigestsSha256: readonly string[]
  readonly semanticWindowPlanDigestSha256: string
  readonly specialistCoverage: readonly EditReferenceLongFormSemanticSpecialistCoverage[]
  readonly synthesisRuntime: EditReferenceLongFormSemanticSynthesisRuntime
  readonly findings: readonly EditReferenceLongFormSemanticFinding[]
  readonly chunkSummary: string
  readonly fullChunkEvidenceReconciled: true
  readonly rawProviderPayloadPersisted: false
  readonly rawTranscriptPersistedInWorkOutput: false
  readonly referenceMediaCopiedToTarget: false
  readonly executableTargetInstructionsCreated: false
}

export interface EditReferenceLongFormReconciledChunkManifestItem {
  readonly chunkId: string
  readonly coreStartSeconds: number
  readonly coreEndSeconds: number
  readonly semanticOutputDigestSha256: string
}

export interface EditReferenceLongFormGlobalPattern {
  readonly patternId: string
  readonly category: EditReferenceLongFormSemanticFindingCategory
  readonly summary: string
  readonly confidence: number
  readonly evidenceChunkIds: readonly string[]
  readonly targetAdaptationRequired: true
  readonly exactSequenceTransferAllowed: false
}

export interface EditReferenceLongFormGlobalReconciliationResult {
  readonly kind: 'global_reconciliation'
  readonly chunks: readonly EditReferenceLongFormReconciledChunkManifestItem[]
  readonly sourceStorySummary: string
  readonly globalPatterns: readonly EditReferenceLongFormGlobalPattern[]
  readonly unresolvedContradictions: readonly string[]
  readonly allChunkSynthesisOutputsVerified: true
  readonly fullSourceCoverage: true
  readonly crossChunkContinuityReconciled: true
  readonly exactReferenceSequenceTransferAllowed: false
  readonly referenceIdentityTransferAllowed: false
  readonly copyrightedAssetTransferAllowed: false
}

export interface EditReferenceLongFormCoverageQaResult {
  readonly kind: 'coverage_qa'
  readonly requiredOutputManifestDigestSha256: string
  readonly expectedPriorRequiredWorkItemCount: number
  readonly verifiedPriorRequiredWorkItemCount: number
  readonly verifiedOutputRecordCount: number
  readonly temporalCoverageRatio: 1
  readonly chunkStageCoverageRatio: 1
  readonly continuousAudioCoverageRatio: 0 | 1
  readonly globalReconciliationVerified: true
  readonly everyRequiredOutputVerified: true
  readonly everySemanticRuntimeAuthoritative: boolean
  readonly everyRequiredOutputCostAuthoritySatisfied: boolean
  readonly qaPassed: boolean
  readonly fullyStudiedEligible: boolean
  readonly blockers: readonly string[]
  readonly partialSamplingClaimedAsFullStudy: false
}

export type EditReferenceLongFormSpecialistStageResult =
  | EditReferenceLongFormSpeechTranscriptResult
  | EditReferenceLongFormCaptionOcrResult
  | EditReferenceLongFormSemanticChunkSynthesisResult
  | EditReferenceLongFormGlobalReconciliationResult
  | EditReferenceLongFormCoverageQaResult

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
// One specialist may reconcile up to eight semantic windows. Each window can
// contribute its prepared-evidence, technical-evidence, and bounded-result
// digest in addition to the section dependencies. Keep that complete lineage
// bounded without imposing the old single-window ceiling.
const MAX_SEMANTIC_WINDOW_EVIDENCE_DIGESTS = 64
const LANGUAGE_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/

export function validateEditReferenceLongFormSpecialistStageResult(input: {
  readonly result: EditReferenceLongFormSpecialistStageResult
  readonly plan: EditReferenceLongFormStudyPlan
  readonly chunkId: string | null
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
}): void {
  const { result, plan } = input
  assertNoForbiddenSpecialistFields(result)
  if (result.kind === 'speech_transcript') validateSpeechTranscript(result, input)
  else if (result.kind === 'caption_ocr') validateCaptionOcr(result, input)
  else if (result.kind === 'semantic_chunk_synthesis') validateSemanticChunk(result)
  else if (result.kind === 'global_reconciliation') validateGlobalReconciliation(result, plan)
  else validateCoverageQa(result, plan)

  const chunkScoped = ['speech_transcript', 'caption_ocr', 'semantic_chunk_synthesis'].includes(result.kind)
  if (chunkScoped !== Boolean(input.chunkId)) {
    throw new Error('Long-form specialist output scope does not match its planned chunk/final stage.')
  }
  if (
    !Number.isFinite(input.sourceCoverageStartSeconds)
    || !Number.isFinite(input.sourceCoverageEndSeconds)
    || input.sourceCoverageEndSeconds <= input.sourceCoverageStartSeconds
  ) throw new Error('Long-form specialist output coverage is invalid.')
}

function validateSpeechTranscript(
  result: EditReferenceLongFormSpeechTranscriptResult,
  context: { readonly sourceCoverageStartSeconds: number; readonly sourceCoverageEndSeconds: number },
): void {
  assertExactKeys(result, [
    'kind',
    'sourceAudioOutputDigestSha256',
    'privateTranscriptArtifactId',
    'transcriptArtifactChecksumSha256',
    'speechPresent',
    'segmentCount',
    'wordCount',
    'segmentTimingRanges',
    'languageCode',
    'confidence',
    'segmentTimingCoverageRatio',
    'wordTimingMode',
    'speakerSegmentationMode',
    'fullCoreCoverage',
    'transcriptTextPersistedInWorkOutput',
    'rawAudioPersisted',
    'interpolatedWordTimingUsed',
  ], 'speech transcript result')
  assertSha(result.sourceAudioOutputDigestSha256, 'speech source audio output digest')
  assertId(result.privateTranscriptArtifactId, 'private transcript artifact id')
  assertSha(result.transcriptArtifactChecksumSha256, 'private transcript checksum')
  const timingWordCount = result.segmentTimingRanges.reduce((sum, range) => sum + range.wordCount, 0)
  let previousEnd = context.sourceCoverageStartSeconds
  for (const [index, range] of result.segmentTimingRanges.entries()) {
    assertExactKeys(range, [
      'segmentOrdinal',
      'sourceStartSeconds',
      'sourceEndSeconds',
      'wordCount',
    ], 'speech transcript segment timing range')
    if (
      range.segmentOrdinal !== index + 1
      || !Number.isFinite(range.sourceStartSeconds)
      || !Number.isFinite(range.sourceEndSeconds)
      || range.sourceStartSeconds < context.sourceCoverageStartSeconds
      || range.sourceEndSeconds > context.sourceCoverageEndSeconds
      || range.sourceEndSeconds <= range.sourceStartSeconds
      || range.sourceStartSeconds < previousEnd
      || !Number.isSafeInteger(range.wordCount)
      || range.wordCount < 1
      || range.wordCount > 1_000
    ) throw new Error('Long-form speech transcript segment timing authority is invalid.')
    previousEnd = range.sourceEndSeconds
  }
  if (
    typeof result.speechPresent !== 'boolean'
    || !Number.isSafeInteger(result.segmentCount)
    || result.segmentCount < 0
    || result.segmentCount > 1_000
    || !Number.isSafeInteger(result.wordCount)
    || result.wordCount < 0
    || result.wordCount > 1_000_000
    || (result.speechPresent && (result.segmentCount < 1 || result.wordCount < 1))
    || (!result.speechPresent && (result.segmentCount !== 0 || result.wordCount !== 0))
    || (result.wordTimingMode === 'exact' && (
      !result.speechPresent
      || result.segmentTimingRanges.length !== result.segmentCount
      || timingWordCount !== result.wordCount
    ))
    || (result.wordTimingMode === 'not_available' && result.segmentTimingRanges.length !== 0)
    || (result.languageCode !== null && !LANGUAGE_PATTERN.test(result.languageCode))
    || !validConfidence(result.confidence)
    || result.segmentTimingCoverageRatio !== 1
    || !['exact', 'not_available'].includes(result.wordTimingMode)
    || !['verified', 'not_requested'].includes(result.speakerSegmentationMode)
    || result.fullCoreCoverage !== true
    || result.transcriptTextPersistedInWorkOutput !== false
    || result.rawAudioPersisted !== false
    || result.interpolatedWordTimingUsed !== false
  ) throw new Error('Long-form speech transcript result is invalid or incomplete.')
}

function validateCaptionOcr(
  result: EditReferenceLongFormCaptionOcrResult,
  context: { readonly sourceCoverageStartSeconds: number; readonly sourceCoverageEndSeconds: number },
): void {
  assertExactKeys(result, [
    'kind',
    'framePlanDigestSha256',
    'requestedFrameTimesSeconds',
    'analyzedFrameTimesSeconds',
    'failedFrameTimesSeconds',
    'framesWithVisibleText',
    'textRegionCount',
    'averageRegionConfidence',
    'ocrToolId',
    'ocrEngineExecuted',
    'fullPlannedFrameCoverage',
    'rawOcrOutputPersisted',
    'recognizedTextPersisted',
    'exactCaptionWordingRetained',
  ], 'caption OCR result')
  assertSha(result.framePlanDigestSha256, 'caption OCR frame-plan digest')
  assertOrderedTimes(result.requestedFrameTimesSeconds, context)
  assertOrderedTimes(result.analyzedFrameTimesSeconds, context)
  assertOrderedTimes(result.failedFrameTimesSeconds, context, true)
  if (
    result.requestedFrameTimesSeconds.length < 1
    || stableJson(result.requestedFrameTimesSeconds) !== stableJson(result.analyzedFrameTimesSeconds)
    || result.failedFrameTimesSeconds.length !== 0
    || !Number.isSafeInteger(result.framesWithVisibleText)
    || result.framesWithVisibleText < 0
    || result.framesWithVisibleText > result.analyzedFrameTimesSeconds.length
    || !Number.isSafeInteger(result.textRegionCount)
    || result.textRegionCount < 0
    || !validConfidence(result.averageRegionConfidence)
    || (result.textRegionCount === 0 && (result.framesWithVisibleText !== 0 || result.averageRegionConfidence !== 0))
    || (result.textRegionCount > 0 && (result.framesWithVisibleText < 1 || result.averageRegionConfidence <= 0))
    || !['paddleocr', 'tesseract', 'controlled_specialist_fixture'].includes(result.ocrToolId)
    || typeof result.ocrEngineExecuted !== 'boolean'
    || result.fullPlannedFrameCoverage !== true
    || result.rawOcrOutputPersisted !== false
    || result.recognizedTextPersisted !== false
    || result.exactCaptionWordingRetained !== false
  ) throw new Error('Long-form caption OCR result is invalid or incomplete.')
}

function validateSemanticChunk(result: EditReferenceLongFormSemanticChunkSynthesisResult): void {
  assertExactKeys(result, [
    'kind',
    'inputOutputDigestsSha256',
    'semanticWindowPlanDigestSha256',
    'specialistCoverage',
    'synthesisRuntime',
    'findings',
    'chunkSummary',
    'fullChunkEvidenceReconciled',
    'rawProviderPayloadPersisted',
    'rawTranscriptPersistedInWorkOutput',
    'referenceMediaCopiedToTarget',
    'executableTargetInstructionsCreated',
  ], 'semantic chunk result')
  assertUniqueHashes(result.inputOutputDigestsSha256, 16, false, 'semantic input outputs')
  assertSha(result.semanticWindowPlanDigestSha256, 'semantic window plan digest')
  if (
    result.specialistCoverage.length !== EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.length
    || new Set(result.specialistCoverage.map((entry) => entry.specialistId)).size !== result.specialistCoverage.length
  ) throw new Error('Long-form semantic specialist coverage is incomplete.')
  for (const specialist of result.specialistCoverage) {
    if (
      !EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.includes(specialist.specialistId)
      || !['analyzed', 'not_applicable'].includes(specialist.status)
      || !validConfidence(specialist.confidence)
      || !['verified_local', 'verified_live', 'not_applicable'].includes(specialist.runtimeSource)
      || (specialist.status === 'analyzed' && specialist.runtimeSource === 'not_applicable')
      || (specialist.status === 'not_applicable' && specialist.runtimeSource !== 'not_applicable')
      || (specialist.status === 'analyzed' && !SHA256_PATTERN.test(specialist.semanticResultDigestSha256 ?? ''))
      || (specialist.status === 'not_applicable' && specialist.semanticResultDigestSha256 !== null)
    ) throw new Error('Long-form semantic specialist coverage is invalid.')
    assertUniqueHashes(
      specialist.evidenceOutputDigestsSha256,
      MAX_SEMANTIC_WINDOW_EVIDENCE_DIGESTS,
      specialist.status === 'not_applicable',
      'specialist evidence',
    )
  }
  validateSemanticSynthesisRuntime(result.synthesisRuntime)
  if (result.findings.length < 1 || result.findings.length > 96) {
    throw new Error('Long-form semantic findings are missing or exceed the bounded result.')
  }
  for (const finding of result.findings) {
    assertId(finding.findingId, 'semantic finding id')
    assertCategory(finding.category)
    assertSafeText(finding.summary, 1_000, 'semantic finding summary')
    if (
      !validConfidence(finding.confidence)
      || typeof finding.transferable !== 'boolean'
      || finding.targetAdaptationRequired !== true
      || finding.exactCopyInstructionCreated !== false
    ) throw new Error('Long-form semantic finding safety is invalid.')
    assertUniqueHashes(
      finding.evidenceOutputDigestsSha256,
      MAX_SEMANTIC_WINDOW_EVIDENCE_DIGESTS,
      false,
      'semantic finding evidence',
    )
  }
  assertSafeText(result.chunkSummary, 4_000, 'semantic chunk summary')
  if (
    result.fullChunkEvidenceReconciled !== true
    || result.rawProviderPayloadPersisted !== false
    || result.rawTranscriptPersistedInWorkOutput !== false
    || result.referenceMediaCopiedToTarget !== false
    || result.executableTargetInstructionsCreated !== false
  ) throw new Error('Long-form semantic chunk safety boundary is invalid.')
}

function validateSemanticSynthesisRuntime(
  runtime: EditReferenceLongFormSemanticSynthesisRuntime,
): void {
  assertExactKeys(runtime, [
    'runtimeSource',
    'adapterId',
    'adapterVersion',
    'providerId',
    'modelId',
    'modelRevision',
    'modelAggregateSha256',
    'modelRoutingPolicyVersion',
    'synthesisInstructionDigestSha256',
    'providerCallMade',
    'modelCallMade',
  ], 'semantic synthesis runtime')
  for (const [label, value] of [
    ['semantic adapter id', runtime.adapterId],
    ['semantic adapter version', runtime.adapterVersion],
    ['semantic model id', runtime.modelId],
    ['semantic model revision', runtime.modelRevision],
    ['semantic routing policy', runtime.modelRoutingPolicyVersion],
  ] as const) assertId(value, label)
  assertSha(runtime.modelAggregateSha256, 'semantic model aggregate')
  assertSha(runtime.synthesisInstructionDigestSha256, 'semantic synthesis instruction digest')
  if (
    !['verified_local', 'verified_live', 'verified_mock'].includes(runtime.runtimeSource)
    || typeof runtime.providerCallMade !== 'boolean'
    || typeof runtime.modelCallMade !== 'boolean'
    || (runtime.runtimeSource === 'verified_live' && (
      !runtime.providerId
      || !ID_PATTERN.test(runtime.providerId)
      || runtime.providerCallMade !== true
      || runtime.modelCallMade !== true
    ))
    || (runtime.runtimeSource !== 'verified_live' && (
      runtime.providerId !== null
      || runtime.providerCallMade !== false
    ))
    || (runtime.runtimeSource === 'verified_mock' && runtime.modelCallMade !== false)
    || (runtime.runtimeSource === 'verified_local' && runtime.modelCallMade !== true)
  ) throw new Error('Long-form semantic synthesis runtime provenance is invalid.')
}

function validateGlobalReconciliation(
  result: EditReferenceLongFormGlobalReconciliationResult,
  plan: EditReferenceLongFormStudyPlan,
): void {
  assertExactKeys(result, [
    'kind',
    'chunks',
    'sourceStorySummary',
    'globalPatterns',
    'unresolvedContradictions',
    'allChunkSynthesisOutputsVerified',
    'fullSourceCoverage',
    'crossChunkContinuityReconciled',
    'exactReferenceSequenceTransferAllowed',
    'referenceIdentityTransferAllowed',
    'copyrightedAssetTransferAllowed',
  ], 'global reconciliation result')
  if (result.chunks.length !== plan.chunks.length) throw new Error('Long-form global reconciliation omitted a planned chunk.')
  for (const [index, item] of result.chunks.entries()) {
    const chunk = plan.chunks[index]
    if (
      !chunk
      || item.chunkId !== chunk.chunkId
      || item.coreStartSeconds !== chunk.coreStartSeconds
      || item.coreEndSeconds !== chunk.coreEndSeconds
    ) throw new Error('Long-form global reconciliation chunk lineage is invalid.')
    assertSha(item.semanticOutputDigestSha256, 'global semantic output digest')
  }
  assertSafeText(result.sourceStorySummary, 8_000, 'global source story summary')
  if (result.globalPatterns.length < 1 || result.globalPatterns.length > 128) {
    throw new Error('Long-form global pattern set is missing or too large.')
  }
  for (const pattern of result.globalPatterns) {
    assertId(pattern.patternId, 'global pattern id')
    assertCategory(pattern.category)
    assertSafeText(pattern.summary, 1_500, 'global pattern summary')
    if (!validConfidence(pattern.confidence) || pattern.targetAdaptationRequired !== true || pattern.exactSequenceTransferAllowed !== false) {
      throw new Error('Long-form global pattern safety is invalid.')
    }
    assertUniqueIds(pattern.evidenceChunkIds, plan.chunks.length, false, 'global pattern chunk evidence')
    if (pattern.evidenceChunkIds.some((chunkId) => !plan.chunks.some((chunk) => chunk.chunkId === chunkId))) {
      throw new Error('Long-form global pattern refers to an unknown chunk.')
    }
  }
  for (const contradiction of result.unresolvedContradictions) assertSafeText(contradiction, 1_000, 'global contradiction')
  if (
    result.unresolvedContradictions.length > 64
    || result.allChunkSynthesisOutputsVerified !== true
    || result.fullSourceCoverage !== true
    || result.crossChunkContinuityReconciled !== true
    || result.exactReferenceSequenceTransferAllowed !== false
    || result.referenceIdentityTransferAllowed !== false
    || result.copyrightedAssetTransferAllowed !== false
  ) throw new Error('Long-form global reconciliation safety or coverage is invalid.')
}

function validateCoverageQa(
  result: EditReferenceLongFormCoverageQaResult,
  plan: EditReferenceLongFormStudyPlan,
): void {
  assertExactKeys(result, [
    'kind',
    'requiredOutputManifestDigestSha256',
    'expectedPriorRequiredWorkItemCount',
    'verifiedPriorRequiredWorkItemCount',
    'verifiedOutputRecordCount',
    'temporalCoverageRatio',
    'chunkStageCoverageRatio',
    'continuousAudioCoverageRatio',
    'globalReconciliationVerified',
    'everyRequiredOutputVerified',
    'everySemanticRuntimeAuthoritative',
    'everyRequiredOutputCostAuthoritySatisfied',
    'qaPassed',
    'fullyStudiedEligible',
    'blockers',
    'partialSamplingClaimedAsFullStudy',
  ], 'coverage QA result')
  assertSha(result.requiredOutputManifestDigestSha256, 'coverage QA output manifest digest')
  for (const blocker of result.blockers) assertSafeText(blocker, 1_000, 'coverage QA blocker')
  if (
    !Number.isSafeInteger(result.expectedPriorRequiredWorkItemCount)
    || result.expectedPriorRequiredWorkItemCount < 1
    || result.verifiedPriorRequiredWorkItemCount !== result.expectedPriorRequiredWorkItemCount
    || !Number.isSafeInteger(result.verifiedOutputRecordCount)
    || result.verifiedOutputRecordCount < 1
    || result.verifiedOutputRecordCount > result.expectedPriorRequiredWorkItemCount
    || result.temporalCoverageRatio !== 1
    || result.chunkStageCoverageRatio !== 1
    || result.continuousAudioCoverageRatio !== plan.completionStandard.continuousAudioCoverageRatio
    || result.globalReconciliationVerified !== true
    || result.everyRequiredOutputVerified !== true
    || typeof result.everySemanticRuntimeAuthoritative !== 'boolean'
    || typeof result.everyRequiredOutputCostAuthoritySatisfied !== 'boolean'
    || typeof result.qaPassed !== 'boolean'
    || typeof result.fullyStudiedEligible !== 'boolean'
    || result.partialSamplingClaimedAsFullStudy !== false
    || result.blockers.length > 64
  ) throw new Error('Long-form coverage QA result is invalid or incomplete.')
  const shouldPass = result.everySemanticRuntimeAuthoritative
    && result.everyRequiredOutputCostAuthoritySatisfied
    && result.blockers.length === 0
  if (
    (!result.everySemanticRuntimeAuthoritative || !result.everyRequiredOutputCostAuthoritySatisfied)
    && result.blockers.length === 0
  ) throw new Error('Long-form coverage QA must explain missing semantic or internal-cost authority.')
  if (result.qaPassed !== shouldPass || result.fullyStudiedEligible !== shouldPass) {
    throw new Error('Long-form coverage QA cannot approve controlled, incomplete, or blocked evidence.')
  }
}

function assertCategory(value: string): void {
  if (![
    'visual_language',
    'story_structure',
    'speech_pacing',
    'caption_design',
    'color_treatment',
    'audio_sound_design',
    'graphics_motion',
    'broll_pattern',
    'do_not_copy',
  ].includes(value)) throw new Error('Long-form semantic finding category is invalid.')
}

function assertOrderedTimes(
  values: readonly number[],
  bounds: { readonly sourceCoverageStartSeconds: number; readonly sourceCoverageEndSeconds: number },
  allowEmpty = false,
): void {
  if (!Array.isArray(values) || values.length > 24 || (!allowEmpty && values.length < 1)) {
    throw new Error('Long-form specialist frame times are invalid.')
  }
  for (const [index, value] of values.entries()) {
    if (
      !Number.isFinite(value)
      || value < bounds.sourceCoverageStartSeconds
      || value > bounds.sourceCoverageEndSeconds
      || (index > 0 && value <= (values[index - 1] ?? -1))
    ) throw new Error('Long-form specialist frame times are unordered or outside coverage.')
  }
}

function assertUniqueHashes(values: readonly string[], maximum: number, allowEmpty: boolean, label: string): void {
  if (!Array.isArray(values) || values.length > maximum || (!allowEmpty && values.length < 1) || new Set(values).size !== values.length) {
    throw new Error(`Long-form ${label} are invalid.`)
  }
  for (const value of values) assertSha(value, label)
}

function assertUniqueIds(values: readonly string[], maximum: number, allowEmpty: boolean, label: string): void {
  if (!Array.isArray(values) || values.length > maximum || (!allowEmpty && values.length < 1) || new Set(values).size !== values.length) {
    throw new Error(`Long-form ${label} ids are invalid.`)
  }
  for (const value of values) assertId(value, label)
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertSha(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertSafeText(value: string, maximum: number, label: string): void {
  if (
    typeof value !== 'string'
    || !value.trim()
    || value.length > maximum
    || /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i.test(value)
  ) throw new Error(`Long-form ${label} is invalid or contains private/provider data.`)
}

function validConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

const FORBIDDEN_SPECIALIST_KEYS = new Set([
  'apiKey',
  'api_key',
  'authorization',
  'bytes',
  'filePath',
  'file_path',
  'localPath',
  'local_path',
  'password',
  'payload',
  'rawAudio',
  'rawFrame',
  'rawFrames',
  'rawOcrOutput',
  'rawPayload',
  'rawProviderPayload',
  'rawTranscript',
  'recognizedText',
  'secret',
  'signedUrl',
  'signed_url',
  'text',
  'token',
  'tokens',
  'transcript',
  'url',
  'words',
])

function assertNoForbiddenSpecialistFields(value: unknown, depth = 0): void {
  if (depth > 10) throw new Error('Long-form specialist result nesting is too deep.')
  if (Array.isArray(value)) {
    for (const entry of value) assertNoForbiddenSpecialistFields(entry, depth + 1)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_SPECIALIST_KEYS.has(key)) {
      throw new Error('Long-form specialist result contains forbidden raw, private, or provider fields.')
    }
    assertNoForbiddenSpecialistFields(entry, depth + 1)
  }
}

function assertExactKeys(value: object, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (stableJson(actual) !== stableJson(expected)) throw new Error(`Long-form ${label} fields are invalid.`)
}
