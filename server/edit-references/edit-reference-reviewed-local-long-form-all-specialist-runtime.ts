import type { QwenSpeechPacingReasoningProvider } from '../services/qwen-speech-pacing-provider'
import type {
  EditReferenceAudioSoundDesignRuntimeInput,
  EditReferenceSpeechPacingAuthorityEvidenceItem,
  EditReferenceStoryEditorialAuthorityEvidenceItem,
  EditReferenceStoryEditorialEvidenceAuthority,
} from './edit-reference-media-study'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceLongFormSemanticWindowEvidenceBundle } from './edit-reference-long-form-semantic-window-evidence'
import type { EditReferenceLongFormSemanticWindowSpecialistRequest } from './edit-reference-long-form-semantic-window-dispatcher'
import {
  EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SKILL_ID,
  EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SUMMARY,
  type EditReferenceLongFormSemanticWindowResolvedRuntime,
} from './edit-reference-long-form-semantic-window-specialist-executor'
import {
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import {
  resolveEditReferenceReviewedLocalLongFormCaptionDesignRuntime,
} from './edit-reference-reviewed-local-long-form-caption-design-runtime'
import {
  resolveEditReferenceReviewedLocalLongFormSpeechPacingRuntime,
} from './edit-reference-reviewed-local-long-form-speech-pacing-runtime'
import {
  resolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntime,
  type EditReferenceReviewedLocalLongFormQwenRuntimeConfiguration,
} from './edit-reference-reviewed-local-long-form-visual-style-story-runtime'
import type {
  EditReferenceReviewedLocalPaddleOcrRunValidationBinding,
} from './edit-reference-reviewed-local-paddleocr-runtime'

export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_ALL_SPECIALIST_RUNTIME_ID =
  'edit_reference_reviewed_local_long_form_all_specialist_runtime' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_ALL_SPECIALIST_RUNTIME_VERSION =
  'v1' as const

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAX_STORY_EVIDENCE_SUMMARY_CHARACTERS = 800

export interface EditReferenceReviewedLocalLongFormAllSpecialistStudyGoals {
  readonly visualLanguageEvidenceId: string
  readonly colorTreatmentEvidenceId: string
  readonly graphicsMotionEvidenceId: string
  readonly captionDesignEvidenceId: string
  readonly speechPacingEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly audioSoundDesignEvidenceId: string
  readonly storyEditorialEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
  readonly sourceClaimsPresent: boolean
  readonly factSafetyEvidence?: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
}

export interface ResolveEditReferenceReviewedLocalLongFormAllSpecialistRuntimeInput {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
  readonly qwen: EditReferenceReviewedLocalLongFormQwenRuntimeConfiguration & {
    readonly captionDesignRunnerScriptPath?: string
  }
  readonly paddleOcr: {
    readonly manifestPath: string
    readonly detectionModelPath: string
    readonly recognitionModelPath: string
    readonly pythonCommand: string
    readonly runValidation?: EditReferenceReviewedLocalPaddleOcrRunValidationBinding
    readonly runnerScriptPath?: string
    readonly timeoutMs?: number
  }
  readonly speechPacingProvider: QwenSpeechPacingReasoningProvider
  readonly astAudioSet: {
    readonly manifestPath: string
    readonly modelPath: string
    readonly pythonCommand: string
    readonly runnerScriptPath?: string
    readonly timeoutMs?: number
    readonly sourceAudioRightsBasis: EditReferenceAudioSoundDesignRuntimeInput['sourceAudioRightsBasis']
  }
  readonly studyGoals: EditReferenceReviewedLocalLongFormAllSpecialistStudyGoals
}

/**
 * Resolves one exact <=120-second long-form semantic-window request through
 * the already-reviewed local specialist authorities. It is deliberately an
 * adapter, not a second dispatcher, repository, model router, or cost owner.
 *
 * Story/Editorial receives only the generalized, durable Visual Language and
 * Speech/Pacing prerequisite results. Raw transcript text, media bytes, local
 * paths, OCR text, provider payloads, and executable target operations never
 * cross this resolver.
 */
export async function resolveEditReferenceReviewedLocalLongFormAllSpecialistRuntime(
  input: ResolveEditReferenceReviewedLocalLongFormAllSpecialistRuntimeInput,
): Promise<EditReferenceLongFormSemanticWindowResolvedRuntime> {
  validateCommonBinding(input)

  if (input.request.specialistId === 'caption_design') {
    return resolveEditReferenceReviewedLocalLongFormCaptionDesignRuntime({
      stageInput: input.stageInput,
      request: input.request,
      evidence: input.evidence,
      studyGoalEvidenceId: input.studyGoals.captionDesignEvidenceId,
      qwen: {
        manifestPath: input.qwen.manifestPath,
        modelPath: input.qwen.modelPath,
        pythonCommand: input.qwen.pythonCommand,
        ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
        ...(input.qwen.captionDesignRunnerScriptPath
          ? { runnerScriptPath: input.qwen.captionDesignRunnerScriptPath }
          : {}),
        ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      },
      paddleOcr: input.paddleOcr,
    })
  }

  if (input.request.specialistId === 'speech_pacing') {
    return resolveEditReferenceReviewedLocalLongFormSpeechPacingRuntime({
      stageInput: input.stageInput,
      request: input.request,
      evidence: input.evidence,
      provider: input.speechPacingProvider,
      studyGoalEvidence: input.studyGoals.speechPacingEvidence,
      sourceClaimsPresent: input.studyGoals.sourceClaimsPresent,
      factSafetyEvidence: input.studyGoals.factSafetyEvidence,
    })
  }

  if (input.request.specialistId === 'audio_sound_design') {
    return resolveAudioSoundDesignRuntime(input)
  }

  return resolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntime({
    stageInput: input.stageInput,
    request: input.request,
    evidence: input.evidence,
    qwen: input.qwen,
    studyGoals: {
      visualLanguageEvidenceId: input.studyGoals.visualLanguageEvidenceId,
      colorTreatmentEvidenceId: input.studyGoals.colorTreatmentEvidenceId,
      graphicsMotionEvidenceId: input.studyGoals.graphicsMotionEvidenceId,
      storyEditorialEvidence: input.studyGoals.storyEditorialEvidence,
    },
    storyEvidenceAuthority: input.request.specialistId === 'story_editorial'
      ? deriveStoryEvidenceAuthority(input)
      : emptyStoryEvidenceAuthority(input.studyGoals.sourceClaimsPresent),
  })
}

function resolveAudioSoundDesignRuntime(
  input: ResolveEditReferenceReviewedLocalLongFormAllSpecialistRuntimeInput,
): Extract<EditReferenceLongFormSemanticWindowResolvedRuntime, { specialistId: 'audio_sound_design' }> {
  const audio = input.evidence.privateAudioArtifact
  if (
    input.request.specialistId !== 'audio_sound_design'
    || !input.request.sourceHasAudio
    || !input.stageInput.plan.source.hasAudio
    || !audio
    || !audio.localFilePath
    || audio.isPrivate !== true
    || audio.sourceOfTruth !== true
    || input.evidence.technicalAudioLowLevel.status !== 'verified_local_bounded'
  ) throw new Error('Reviewed local all-specialist Audio/Sound Design lacks exact private-audio authority.')

  return {
    specialistId: 'audio_sound_design',
    runtime: {
      runtimeKind: 'reviewed_local_ast_audioset',
      orchestrationId: `long-form-audio:${input.request.runId}:${input.request.semanticWindowOrdinal}`,
      studySessionId: input.stageInput.plan.studySessionId,
      studyGoalEvidenceId: input.studyGoals.audioSoundDesignEvidenceId,
      sourceAudioRightsBasis: input.astAudioSet.sourceAudioRightsBasis,
      manifestPath: input.astAudioSet.manifestPath,
      modelPath: input.astAudioSet.modelPath,
      pythonCommand: input.astAudioSet.pythonCommand,
      ...(input.astAudioSet.runnerScriptPath
        ? { runnerScriptPath: input.astAudioSet.runnerScriptPath }
        : {}),
      ...(input.astAudioSet.timeoutMs ? { timeoutMs: input.astAudioSet.timeoutMs } : {}),
    },
  }
}

function deriveStoryEvidenceAuthority(
  input: ResolveEditReferenceReviewedLocalLongFormAllSpecialistRuntimeInput,
): EditReferenceStoryEditorialEvidenceAuthority {
  const speechIndex = input.request.prerequisiteSemanticResults.findIndex((result) => (
    result.specialistId === 'speech_pacing'
  ))
  const speech = input.request.prerequisiteSemanticResults[speechIndex]
  const speechDigest = input.request.prerequisiteSemanticResultDigestsSha256[speechIndex]
  if (
    input.request.sourceHasAudio
    && (
      !speech
      || !speechDigest
      || !SHA256_PATTERN.test(speechDigest)
      || speech.status !== 'completed'
      || speech.resultState !== 'analyzed'
      || speech.runtimeSource !== 'verified_local'
      || speech.execution.providerCallMade
      || speech.execution.externalUrlFetched
      || speech.confidence <= 0
      || !speech.summary.trim()
    )
  ) throw new Error('Reviewed local Story/Editorial lacks generalized Speech/Pacing prerequisite authority.')

  return deriveEditReferenceReviewedLocalStoryEvidenceAuthority({
    semanticWindowId: input.request.semanticWindowId,
    sourceHasAudio: input.request.sourceHasAudio,
    sourceClaimsPresent: input.studyGoals.sourceClaimsPresent,
    ...(speech ? { speech } : {}),
    ...(speechDigest ? { speechDigestSha256: speechDigest } : {}),
    factSafetyEvidence: input.studyGoals.factSafetyEvidence,
  })
}

export interface DeriveEditReferenceReviewedLocalStoryEvidenceAuthorityInput {
  readonly semanticWindowId: string
  readonly sourceHasAudio: boolean
  readonly sourceClaimsPresent: boolean
  readonly speech?: EditReferenceSemanticStudyResult
  readonly speechDigestSha256?: string
  readonly factSafetyEvidence?: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
}

/**
 * Converts one durable Speech/Pacing prerequisite into bounded Story evidence.
 * A model-backed speech result may contribute only its generalized summary.
 * A transcript-proven silent result contributes explicit absence authority and
 * must never be described as if segment or word timings existed.
 */
export function deriveEditReferenceReviewedLocalStoryEvidenceAuthority(
  input: DeriveEditReferenceReviewedLocalStoryEvidenceAuthorityInput,
): EditReferenceStoryEditorialEvidenceAuthority {
  assertSafeId(input.semanticWindowId)
  const factSafetyEvidence = (input.factSafetyEvidence ?? []).map((item) => ({ ...item }))
  const speech = input.speech
  const speechDigest = input.speechDigestSha256
  if (!input.sourceHasAudio) {
    if (speech || speechDigest) {
      throw new Error('Audio-absent Story/Editorial cannot claim Speech/Pacing prerequisite authority.')
    }
    return {
      sourceClaimsPresent: input.sourceClaimsPresent,
      transcriptEvidence: [],
      speechTimingEvidence: [],
      factSafetyEvidence,
    }
  }
  if (speech) assertEditReferenceSemanticStudyResult(speech)
  if (
    !speech
    || !speechDigest
    || !SHA256_PATTERN.test(speechDigest)
    || speech.specialistId !== 'speech_pacing'
    || speech.status !== 'completed'
    || speech.resultState !== 'analyzed'
    || speech.runtimeSource !== 'verified_local'
    || speech.execution.providerCallMade
    || speech.execution.externalUrlFetched
    || speech.confidence <= 0
    || !speech.summary.trim()
  ) throw new Error('Reviewed local Story/Editorial lacks generalized Speech/Pacing prerequisite authority.')

  const digestPrefix = speechDigest.slice(0, 20)
  const requiresUserReview = speech.warnings.length > 0
  if (speech.execution.modelCallMade === false) {
    if (!isTranscriptProvenSpeechAbsence(speech)) {
      throw new Error('Model-free Speech/Pacing authority is not exact transcript-proven absence.')
    }
    return {
      sourceClaimsPresent: input.sourceClaimsPresent,
      transcriptEvidence: [{
        evidenceId: `${input.semanticWindowId}:story-transcript-absence:${digestPrefix}`,
        summary: 'Canonical private transcript coverage spans this exact source window and contains zero spoken segments and zero words. No transcript-derived story meaning is available.',
        confidence: speech.confidence,
        requiresUserReview: true,
      }],
      speechTimingEvidence: [{
        evidenceId: `${input.semanticWindowId}:story-speech-timing-absence:${digestPrefix}`,
        summary: 'This exact window has complete transcript coverage with no segment or word-timing entries. Story/Editorial must not infer dialogue, cadence, delivery, pauses, or voice identity and may reason only from authorized nonverbal evidence.',
        confidence: speech.confidence,
        requiresUserReview: true,
      }],
      factSafetyEvidence,
    }
  }

  const boundedSpeechSummary = boundedSafeSummary(speech.summary)
  return {
    sourceClaimsPresent: input.sourceClaimsPresent,
    transcriptEvidence: [{
      evidenceId: `${input.semanticWindowId}:story-transcript:${digestPrefix}`,
      summary: `Verified local Speech/Pacing evidence for this exact source window: ${boundedSpeechSummary}`,
      confidence: speech.confidence,
      requiresUserReview,
    }],
    speechTimingEvidence: [{
      evidenceId: `${input.semanticWindowId}:story-speech-timing:${digestPrefix}`,
      summary: 'The exact semantic window is bound to the authoritative local transcript segment and word-timing lineage used by Speech/Pacing; Story/Editorial may use only its generalized timing principles.',
      confidence: speech.confidence,
      requiresUserReview,
    }],
    factSafetyEvidence,
  }
}

function isTranscriptProvenSpeechAbsence(value: EditReferenceSemanticStudyResult): boolean {
  return (
    value.skillId === EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SKILL_ID
    && value.summary === EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SUMMARY
    && value.execution.modelCallMade === false
    && value.execution.fileBytesRead === true
    && value.execution.mediaProcessingStarted === true
    && value.inputEvidenceIds.length === 1
    && value.inputEvidenceIds[0]?.startsWith('speech-absence-') === true
    && value.analysisArtifactIds.length === 1
    && value.toolIds.length > 0
    && value.warnings.some((warning) => /speech absence applies to this exact section/i.test(warning))
  )
}

function emptyStoryEvidenceAuthority(
  sourceClaimsPresent: boolean,
): EditReferenceStoryEditorialEvidenceAuthority {
  return {
    sourceClaimsPresent,
    transcriptEvidence: [],
    speechTimingEvidence: [],
    factSafetyEvidence: [],
  }
}

function validateCommonBinding(
  input: ResolveEditReferenceReviewedLocalLongFormAllSpecialistRuntimeInput,
): void {
  const { request, evidence, stageInput } = input
  if (
    request.executionScope !== 'controlled_test'
    || stageInput.workItem.stageId !== 'semantic_chunk_synthesis'
    || request.runId !== stageInput.runId
    || request.planId !== stageInput.plan.planId
    || request.planDigestSha256 !== stageInput.plan.planDigestSha256
    || request.workItemId !== stageInput.workItem.workItemId
    || request.chunkId !== stageInput.workItem.chunkId
    || request.privateMediaArtifactId !== stageInput.plan.source.privateMediaArtifactId
    || request.mediaChecksumSha256 !== stageInput.plan.source.mediaChecksumSha256
    || request.sourceHasAudio !== stageInput.plan.source.hasAudio
    || request.semanticWindowId !== evidence.semanticWindowId
    || request.sourceStartSeconds !== evidence.sourceStartSeconds
    || request.sourceEndSeconds !== evidence.sourceEndSeconds
    || request.providerLocalStartSeconds !== 0
    || request.providerLocalEndSeconds !== evidence.durationSeconds
    || request.sourceTimeOffsetSeconds !== evidence.sourceTimeOffsetSeconds
    || (input.qwen.runValidation && input.qwen.runValidation.runId !== request.runId)
    || (input.paddleOcr.runValidation && input.paddleOcr.runValidation.runId !== request.runId)
    || evidence.exactProviderLocalEvidencePrepared !== true
    || request.boundaries.rawReferenceMediaPersistenceAllowed
    || request.boundaries.rawProviderPayloadPersistenceAllowed
    || request.boundaries.rawTranscriptPersistenceAllowed
    || request.boundaries.recognizedOcrTextPersistenceAllowed
    || request.boundaries.externalUrlFetchAllowed
    || request.boundaries.customerPriceCalculationAllowed
    || request.boundaries.customerCreditMutationAllowed
    || request.boundaries.serviceFeeCalculationAllowed
    || !request.boundaries.originalMustRemainImmutable
    || !request.boundaries.targetAdaptationRequired
  ) throw new Error('Reviewed local all-specialist runtime binding is incomplete or exceeds controlled authority.')

  for (const id of [
    input.studyGoals.visualLanguageEvidenceId,
    input.studyGoals.colorTreatmentEvidenceId,
    input.studyGoals.graphicsMotionEvidenceId,
    input.studyGoals.captionDesignEvidenceId,
    input.studyGoals.audioSoundDesignEvidenceId,
  ]) assertSafeId(id)
  if (
    input.speechPacingProvider.executionMode !== 'controlled_local'
    || typeof input.studyGoals.sourceClaimsPresent !== 'boolean'
    || input.studyGoals.speechPacingEvidence.length < 1
    || input.studyGoals.storyEditorialEvidence.length < 1
    || (input.studyGoals.sourceClaimsPresent && (input.studyGoals.factSafetyEvidence?.length ?? 0) < 1)
  ) throw new Error('Reviewed local all-specialist study-goal or provider authority is incomplete.')
  for (const value of [
    input.qwen.manifestPath,
    input.qwen.modelPath,
    input.qwen.pythonCommand,
    input.paddleOcr.manifestPath,
    input.paddleOcr.detectionModelPath,
    input.paddleOcr.recognitionModelPath,
    input.paddleOcr.pythonCommand,
    input.astAudioSet.manifestPath,
    input.astAudioSet.modelPath,
    input.astAudioSet.pythonCommand,
  ]) {
    if (!value.trim()) throw new Error('Reviewed local all-specialist runtime configuration is incomplete.')
  }
}

function boundedSafeSummary(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (
    normalized.length < 8
    || containsUnsafeControlCharacters(normalized)
    || /(?:https?:\/\/|file:\/\/|\/Volumes\/|\/Users\/|signed[-_ ]?url|api[-_ ]?key|authorization:|service[-_ ]?role)/i.test(normalized)
  ) throw new Error('Reviewed local Speech/Pacing summary is unsafe for Story/Editorial evidence.')
  if (normalized.length <= MAX_STORY_EVIDENCE_SUMMARY_CHARACTERS - 80) return normalized
  return `${normalized.slice(0, MAX_STORY_EVIDENCE_SUMMARY_CHARACTERS - 81).trimEnd()}…`
}

function assertSafeId(value: string): void {
  if (!SAFE_ID_PATTERN.test(value)) {
    throw new Error('Reviewed local all-specialist evidence identifier is invalid.')
  }
}

function containsUnsafeControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 && ![9, 10, 13].includes(code)
  })
}
