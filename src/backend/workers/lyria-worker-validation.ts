import type {
  LyriaWorkerFailure,
  LyriaWorkerInput,
  LyriaWorkerMockRecordBundle,
  LyriaWorkerValidationResult,
} from './lyria-worker-contracts'
import type {
  CreditReservationRecord,
  GenerationRequestRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
} from '../../types'
import { assertCreditReservationMatchesRequest } from '../services/credit-approval-gate-service'

function pass(warnings: string[] = []): LyriaWorkerValidationResult {
  return { ok: true, warnings }
}

function block(
  code: LyriaWorkerFailure['code'],
  message: string,
  warnings: string[] = [],
  details?: unknown,
): LyriaWorkerValidationResult {
  return {
    ok: false,
    failure: { code, message, details },
    warnings,
  }
}

function mergeValidationResults(results: LyriaWorkerValidationResult[]): LyriaWorkerValidationResult {
  const warnings = results.flatMap((result) => result.warnings)
  const failed = results.find((result) => !result.ok)

  if (!failed || failed.ok) {
    return pass(warnings)
  }

  return {
    ok: false,
    failure: failed.failure,
    warnings,
  }
}

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0)
}

function promptStatus(promptPlan: LyriaPromptPlanRecord) {
  return (promptPlan as LyriaPromptPlanRecord & { status?: string }).status
}

function lyricsConflictWithSpeech(cue: MusicCueSheetItemRecord, promptPlan: LyriaPromptPlanRecord) {
  const cueIsSpeechSafe =
    cue.sectionType === 'dialogue' ||
    cue.speechSafety === 'speech_first' ||
    cue.speechSafety === 'duck_under_voice' ||
    cue.speechSafety === 'no_music_under_key_dialogue' ||
    cue.vocalPolicy === 'instrumental_only' ||
    cue.vocalPolicy === 'no_vocals_under_dialogue' ||
    cue.vocalPolicy === 'voice_first'

  return cueIsSpeechSafe && promptPlan.vocalPolicy === 'lyrics_allowed_no_speech'
}

export function validateLyriaWorkerInput(input: LyriaWorkerInput): LyriaWorkerValidationResult {
  if (!input.mockOnly) {
    return block('MOCK_ONLY', 'Lyria worker skeleton can only run in mock mode.')
  }

  if (!hasValue(input.jobId)) {
    return block('MISSING_JOB', 'Lyria worker input requires a job ID.')
  }

  if (!hasValue(input.generationRequestId)) {
    return block('MISSING_GENERATION_REQUEST', 'Lyria worker input requires a generation request ID.')
  }

  if (!hasValue(input.lyriaPromptPlanId)) {
    return block('MISSING_PROMPT_PLAN', 'Lyria worker input requires a Lyria prompt plan ID.')
  }

  if (!hasValue(input.musicCueId)) {
    return block('MISSING_MUSIC_CUE', 'Lyria worker input requires a music cue ID.')
  }

  if (!hasValue(input.creditReservationId)) {
    return block('MISSING_CREDIT_RESERVATION', 'Lyria worker input requires a credit reservation ID.')
  }

  return pass()
}

export function validatePromptPlanForWorker(
  promptPlan: LyriaPromptPlanRecord | undefined,
  cue?: MusicCueSheetItemRecord,
): LyriaWorkerValidationResult {
  if (!promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'Generation not allowed: Lyria prompt plan is missing.')
  }

  const warnings: string[] = []
  const status = promptStatus(promptPlan)

  if (status && status !== 'ready' && status !== 'approved') {
    return block(
      'PROMPT_VALIDATION_FAILED',
      'Generation not allowed: Lyria prompt plan is not ready or approved.',
      warnings,
      { status },
    )
  }

  if (!promptPlan.styleDnaOnly) {
    warnings.push('Prompt plan should explicitly use reference style DNA only.')
  }

  if (!/copy|imitate|existing song|melody|lyrics/i.test(promptPlan.negativePrompt)) {
    warnings.push('Prompt plan should include explicit do-not-copy negative constraints.')
  }

  if (cue && lyricsConflictWithSpeech(cue, promptPlan)) {
    return block(
      'PROMPT_VALIDATION_FAILED',
      'Generation not allowed: prompt allows lyrics in a speech-safe or dialogue cue.',
      warnings,
      {
        cueId: cue.id,
        cueSpeechSafety: cue.speechSafety,
        promptVocalPolicy: promptPlan.vocalPolicy,
      },
    )
  }

  return pass(warnings)
}

export function validateCreditReservationForWorker(
  reservation: CreditReservationRecord | undefined,
): LyriaWorkerValidationResult {
  if (!reservation) {
    return block(
      'MISSING_CREDIT_RESERVATION',
      'Generation not allowed: music credits are not approved and reserved.',
    )
  }

  if (reservation.status !== 'reserved') {
    return block(
      'CREDITS_NOT_RESERVED',
      'Generation not allowed: music credits are not approved and reserved.',
      [],
      { reservationStatus: reservation.status },
    )
  }

  return pass()
}

export function validateLyriaSharedCreditGateForWorker(
  input: LyriaWorkerInput,
  records: LyriaWorkerMockRecordBundle,
): LyriaWorkerValidationResult {
  const gate = assertCreditReservationMatchesRequest(records.creditReservation, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: records.generationRequest?.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requestedByUserId: input.requestedByUserId,
    purpose: 'music_generation',
    estimatedCredits: records.generationRequest?.estimatedCredits ?? 18,
    requiresApproval: true,
  })

  if (!gate.ok) {
    return block('CREDITS_NOT_RESERVED', gate.message, gate.warnings, gate)
  }

  return pass(gate.warnings)
}

export function validateMusicCueForWorker(
  cue: MusicCueSheetItemRecord | undefined,
): LyriaWorkerValidationResult {
  if (!cue) {
    return block('MISSING_MUSIC_CUE', 'Generation not allowed: music cue is missing.')
  }

  return pass()
}

export function validateGenerationRequestForWorker(
  request: GenerationRequestRecord | undefined,
): LyriaWorkerValidationResult {
  if (!request) {
    return block('MISSING_GENERATION_REQUEST', 'Generation not allowed: generation request is missing.')
  }

  if (request.status !== 'approved' && request.status !== 'queued') {
    return block(
      'PLAN_NOT_APPROVED',
      'Generation not allowed: generation request must be approved or queued.',
      [],
      { generationRequestStatus: request.status },
    )
  }

  const warnings: string[] = []

  if (request.providerType !== 'google_cloud_worker') {
    warnings.push('Generation request should target the future Google Cloud worker boundary.')
  }

  if (request.modelName !== 'lyria-3-pro-preview') {
    warnings.push('Generation request model should be lyria-3-pro-preview.')
  }

  if (request.requestType !== 'music_asset' && request.requestType !== 'soundsync_audio') {
    warnings.push('Generation request should be a music asset or SoundSync audio request.')
  }

  return pass(warnings)
}

export function validateLyriaGenerationGate(
  input: LyriaWorkerInput,
  records: LyriaWorkerMockRecordBundle,
): LyriaWorkerValidationResult {
  return mergeValidationResults([
    validateLyriaWorkerInput(input),
    validateGenerationRequestForWorker(records.generationRequest),
    validateMusicCueForWorker(records.musicCue),
    validatePromptPlanForWorker(records.promptPlan, records.musicCue),
    validateCreditReservationForWorker(records.creditReservation),
    validateLyriaSharedCreditGateForWorker(input, records),
  ])
}
