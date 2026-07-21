import {
  createReviewedLocalEditReferenceLongFormCaptionOcrStageExecutor,
  type ExecuteReviewedLocalEditReferenceLongFormCaptionOcrStageOptions,
} from './edit-reference-long-form-caption-ocr-stage'
import {
  createReviewedLocalEditReferenceLongFormSpeechTranscriptStageExecutor,
  type ExecuteReviewedLocalEditReferenceLongFormSpeechTranscriptStageOptions,
} from './edit-reference-long-form-speech-transcript-stage'
import type { EditReferenceLongFormSpecialistStageExecutor } from './edit-reference-long-form-specialist-pipeline-stage-executor'

export const EDIT_REFERENCE_REVIEWED_LOCAL_EVIDENCE_STAGE_IDS = [
  'speech_transcript',
  'caption_ocr',
] as const

export interface CreateEditReferenceReviewedLocalLongFormEvidenceExecutorOptions {
  readonly speechTranscript: ExecuteReviewedLocalEditReferenceLongFormSpeechTranscriptStageOptions
  readonly captionOcr: ExecuteReviewedLocalEditReferenceLongFormCaptionOcrStageOptions
}

/**
 * Composes only the two reviewed SD-local evidence runtimes. Semantic Qwen,
 * reconciliation, and final coverage QA remain outside this executor and keep
 * zero attempts until their separately approved authorities exist.
 */
export function createEditReferenceReviewedLocalLongFormEvidenceExecutor(
  options: CreateEditReferenceReviewedLocalLongFormEvidenceExecutorOptions,
): EditReferenceLongFormSpecialistStageExecutor {
  const executeSpeech = createReviewedLocalEditReferenceLongFormSpeechTranscriptStageExecutor(
    options.speechTranscript,
  )
  const executeOcr = createReviewedLocalEditReferenceLongFormCaptionOcrStageExecutor(options.captionOcr)
  return async (input) => {
    if (input.workItem.stageId === 'speech_transcript') return executeSpeech(input)
    if (input.workItem.stageId === 'caption_ocr') return executeOcr(input)
    throw new Error('The reviewed local evidence executor owns only speech_transcript and caption_ocr work.')
  }
}
