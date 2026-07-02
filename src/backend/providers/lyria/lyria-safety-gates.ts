import type {
  LyriaSafetyGateInput,
  LyriaSafetyGateResult,
} from './lyria-provider-contracts'

function pass(message = 'Lyria generation safety gates passed.', warnings: string[] = []): LyriaSafetyGateResult {
  return { ok: true, message, warnings }
}

function block(code: string, message: string, warnings: string[] = []): LyriaSafetyGateResult {
  return { ok: false, code, message, warnings }
}

function promptStatus(promptPlan: NonNullable<LyriaSafetyGateInput['promptPlan']>) {
  return (promptPlan as typeof promptPlan & { status?: string }).status
}

function speechCue(input: LyriaSafetyGateInput) {
  const cue = input.musicCue
  if (!cue) return false
  return (
    cue.sectionType === 'dialogue' ||
    cue.speechSafety === 'speech_first' ||
    cue.speechSafety === 'duck_under_voice' ||
    cue.speechSafety === 'no_music_under_key_dialogue' ||
    cue.vocalPolicy === 'instrumental_only' ||
    cue.vocalPolicy === 'no_vocals_under_dialogue' ||
    cue.vocalPolicy === 'voice_first'
  )
}

export function assertMusicPromptApproved(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (!input.promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'Lyria generation blocked: prompt plan is missing.')
  }

  const status = promptStatus(input.promptPlan)
  if (status && status !== 'ready' && status !== 'approved') {
    return block('PROMPT_NOT_READY', 'Lyria generation blocked: prompt plan is not ready or approved.')
  }

  if (!input.promptPlan.styleDnaOnly) {
    return block('PROMPT_STYLE_DNA_REQUIRED', 'Lyria generation blocked: prompt must use reference style DNA only.')
  }

  return pass()
}

export function assertCreditsReserved(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (!input.creditReservation) {
    return block('MISSING_CREDIT_RESERVATION', 'Lyria generation blocked: music credit reservation is missing.')
  }

  if (input.creditReservation.status !== 'reserved') {
    return block('CREDITS_NOT_RESERVED', 'Lyria generation blocked: music credits are not reserved.')
  }

  return pass()
}

export function assertGenerationRequestReady(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (!input.generationRequest) {
    return block('MISSING_GENERATION_REQUEST', 'Lyria generation blocked: generation request is missing.')
  }

  if (input.generationRequest.status !== 'approved' && input.generationRequest.status !== 'queued') {
    return block('GENERATION_REQUEST_NOT_READY', 'Lyria generation blocked: generation request must be approved or queued.')
  }

  return pass()
}

export function assertSpeechSafetyBeforeGeneration(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (!input.musicCue) {
    return block('MISSING_MUSIC_CUE', 'Lyria generation blocked: music cue is missing.')
  }

  if (!input.promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'Lyria generation blocked: prompt plan is missing.')
  }

  if (speechCue(input) && input.promptPlan.vocalPolicy === 'lyrics_allowed_no_speech') {
    return block('LYRICS_UNDER_SPEECH_BLOCKED', 'Lyria generation blocked: lyrics are not allowed for speech-safe cues.')
  }

  return pass()
}

export function assertNoUnsafeReferenceCopying(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (!input.promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'Lyria generation blocked: prompt plan is missing.')
  }

  const prompt = input.promptPlan.prompt.toLowerCase()
  const copyRiskPatterns = [
    /copy the same/,
    /use the same song/,
    /same track/,
    /same melody/,
    /copy reference music/,
    /imitate .*artist/,
    /exact cue timing/,
    /copyrighted lyrics/,
  ]

  if (copyRiskPatterns.some((pattern) => pattern.test(prompt))) {
    return block('REFERENCE_COPY_RISK_BLOCKED', 'Lyria generation blocked: prompt appears to request copying reference music.')
  }

  return pass()
}

export function assertLyriaGenerationAllowed(input: LyriaSafetyGateInput): LyriaSafetyGateResult {
  if (input.mode === 'disabled') {
    return block('LYRIA_INTEGRATION_DISABLED', 'Lyria integration disabled.')
  }

  const checks = [
    assertMusicPromptApproved(input),
    input.musicCue ? pass() : block('MISSING_MUSIC_CUE', 'Lyria generation blocked: music cue is missing.'),
    assertCreditsReserved(input),
    assertGenerationRequestReady(input),
    assertSpeechSafetyBeforeGeneration(input),
    assertNoUnsafeReferenceCopying(input),
  ]
  const warnings = checks.flatMap((check) => check.warnings)
  const failed = checks.find((check) => !check.ok)

  if (failed) {
    return {
      ...failed,
      warnings,
    }
  }

  return pass('Lyria generation safety gates passed.', warnings)
}
