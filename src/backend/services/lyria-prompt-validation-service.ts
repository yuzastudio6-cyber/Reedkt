import type {
  LyriaPromptPlanRecord,
  LyriaPromptValidationWarning,
  LyriaPromptValidationWarningCode,
  MusicContextAnalysisRecord,
  MusicCueRecord,
  MusicCueSheetRecord,
  MusicLanguageContextRecord,
  ReferenceMusicDNARecord,
} from '../../types'

export interface ValidateLyriaPromptPlanInput {
  promptPlan: LyriaPromptPlanRecord
  cue: MusicCueRecord
  cueSheet?: MusicCueSheetRecord
  musicContextAnalysis?: MusicContextAnalysisRecord
  languageContexts?: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  userInstruction?: string
  avoidInstruction?: string
}

export function validateLyriaPromptPlan(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  return [
    ...checkDurationPolicy(input.promptPlan),
    ...checkLyricsPolicy(input),
    ...checkSpeechSafetyPolicy(input),
    ...checkCulturePolicy(input),
    ...checkReferenceCopyPolicy(input),
    ...checkPromptSpecificity(input.promptPlan),
    ...checkCueRoleAlignment(input),
    ...createPromptWarnings(input),
  ]
}

export function checkLyricsPolicy(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const { promptPlan, cue, userInstruction } = input
  const warnings: LyriaPromptValidationWarning[] = []
  const promptText = promptPlan.prompt.toLowerCase()
  const userAskedInstrumental = userInstruction?.toLowerCase().includes('instrumental')

  if (
    promptPlan.lyricsAllowed
    && (cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking' || cue.duckingRequired)
  ) {
    warnings.push(createWarning(
      'lyrics_under_speech',
      'Prompt allows lyrics on a cue that must remain safe under speech.',
      'high',
      'Use instrumental-only music or limit vocal texture to no-speech moments.',
    ))
  }

  if (cue.vocalPolicy === 'full_lyrical_song' && cue.speechSafety !== 'montage_only' && cue.speechSafety !== 'intro_outro_only') {
    warnings.push(createWarning(
      'lyrics_under_speech',
      'Full lyrical song policy is risky outside montage, intro, or outro sections.',
      'high',
      'Change vocal policy to instrumental-only unless the user explicitly approves lyrics over speech.',
    ))
  }

  if (userAskedInstrumental && (promptPlan.lyricsAllowed || promptText.includes('vocal'))) {
    warnings.push(createWarning(
      'user_instruction_conflict',
      'The user requested instrumental music, but the prompt still allows vocals or lyrics.',
      'medium',
      'Remove vocal language from the prompt and set lyricsAllowed to false.',
    ))
  }

  return warnings
}

export function checkSpeechSafetyPolicy(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const { promptPlan, cue } = input
  const promptText = promptPlan.prompt.toLowerCase()

  if (!promptText.includes('speech') && !promptText.includes('voice') && !promptText.includes('dialogue')) {
    return [createWarning(
      'missing_speech_safety',
      'Prompt does not mention speech, voice, or dialogue safety.',
      cue.speechSafety === 'unknown' ? 'low' : 'medium',
      'Add explicit instructions for voice-first mix space when the cue may sit under speech.',
    )]
  }

  if ((cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking') && promptPlan.instrumentalOnly === false) {
    return [createWarning(
      'lyrics_under_speech',
      'Speech-safe cue is not marked instrumental-only.',
      'high',
      'Set instrumentalOnly to true and remove lyrical/vocal allowances.',
    )]
  }

  return []
}

export function checkCulturePolicy(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const { cue, promptPlan, languageContexts } = input

  if (cue.cultureRegion === 'global' || cue.cultureRegion === 'unknown') {
    return []
  }

  const text = [
    promptPlan.prompt,
    promptPlan.negativePrompt,
    ...promptPlan.cultureContextInstructions,
    ...(languageContexts ?? []).flatMap((context) => context.stereotypeAvoidanceNotes),
  ].join(' ').toLowerCase()

  if (!text.includes('stereotype') && !text.includes('cliche') && !text.includes('tasteful') && !text.includes('modern')) {
    return [createWarning(
      'culture_stereotype_risk',
      'Culture-aware prompt does not include stereotype or tastefulness guardrails.',
      'medium',
      'Add modern, tasteful culture guidance and explicit stereotype avoidance.',
    )]
  }

  return []
}

export function checkReferenceCopyPolicy(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const { promptPlan, cue, referenceMusicDNA } = input

  if (!referenceMusicDNA && cue.referenceInfluence === 'none') {
    return []
  }

  const text = `${promptPlan.prompt} ${promptPlan.negativePrompt}`.toLowerCase()

  if (!text.includes('do not imitate') && !text.includes('do not copy')) {
    return [createWarning(
      'reference_copy_risk',
      'Reference DNA is present, but the prompt does not explicitly prevent copying.',
      'high',
      'Add a do-not-copy instruction for tracks, melodies, lyrics, hooks, and arrangements.',
    )]
  }

  return []
}

export function checkDurationPolicy(promptPlan: LyriaPromptPlanRecord): LyriaPromptValidationWarning[] {
  if (!promptPlan.durationSeconds || promptPlan.durationSeconds <= 0 || !promptPlan.prompt.includes(`${promptPlan.durationSeconds}-second`)) {
    return [createWarning(
      'missing_duration',
      'Prompt is missing a clear duration target.',
      'medium',
      'Include the cue duration in seconds in the prompt.',
    )]
  }

  return []
}

export function checkPromptSpecificity(promptPlan: LyriaPromptPlanRecord): LyriaPromptValidationWarning[] {
  const warnings: LyriaPromptValidationWarning[] = []
  const promptText = promptPlan.prompt.toLowerCase()

  if (promptPlan.prompt.length < 180 || promptText === 'create cinematic music.' || promptText === 'cinematic music') {
    warnings.push(createWarning(
      'prompt_too_vague',
      'Prompt is too short or generic for professional music supervision.',
      'medium',
      'Include role, scene, duration, mood, genre, energy, instrumentation, vocal policy, and timing shape.',
    ))
  }

  if (!promptText.includes('instrumental') && !promptText.includes('vocal') && !promptText.includes('lyrics')) {
    warnings.push(createWarning(
      'missing_vocal_policy',
      'Prompt does not clearly state vocal or lyric policy.',
      'medium',
      'Add explicit no-vocal, instrumental, vocal texture, or lyrics policy wording.',
    ))
  }

  if (!promptPlan.negativePrompt.trim()) {
    warnings.push(createWarning(
      'missing_negative_prompt',
      'Prompt plan is missing a negative prompt.',
      'medium',
      'Create a negative prompt with speech, copy, culture, artifact, and genre-specific restrictions.',
    ))
  }

  if (!promptText.includes(promptPlan.durationSeconds.toString())) {
    warnings.push(createWarning(
      'missing_duration',
      'Prompt does not include the numeric duration.',
      'low',
      'Include the target duration in seconds.',
    ))
  }

  return warnings
}

export function createPromptWarnings(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const warnings: LyriaPromptValidationWarning[] = []
  const promptText = input.promptPlan.prompt.toLowerCase()
  const negativeText = input.promptPlan.negativePrompt.toLowerCase()

  if (input.avoidInstruction?.toLowerCase().includes('no lyrics') && input.promptPlan.lyricsAllowed) {
    warnings.push(createWarning(
      'user_instruction_conflict',
      'Avoid instructions include no lyrics, but the prompt allows lyrics.',
      'high',
      'Set lyricsAllowed to false and remove lyric permission.',
    ))
  }

  if (promptText.includes('artist') || negativeText.includes('artist')) {
    warnings.push(createWarning(
      'reference_copy_risk',
      'Prompt mentions artist imitation language.',
      'high',
      'Remove artist references and describe style in original, generic terms.',
    ))
  }

  return warnings
}

function checkCueRoleAlignment(input: ValidateLyriaPromptPlanInput): LyriaPromptValidationWarning[] {
  const { cue, promptPlan } = input
  const promptText = promptPlan.prompt.toLowerCase()

  if (cue.cueRole === 'dialogue_bed' && (!promptText.includes('under voice') && !promptText.includes('under spoken voice'))) {
    return [createWarning(
      'not_aligned_with_cue_role',
      'Dialogue bed prompt does not clearly say it must sit under voice.',
      'medium',
      'Add explicit voice-first background-bed wording.',
    )]
  }

  if ((cue.cueRole === 'travel_movement' || cue.cueRole === 'montage_driver') && !promptText.includes('montage')) {
    return [createWarning(
      'not_aligned_with_cue_role',
      'Montage cue prompt does not clearly describe montage movement.',
      'low',
      'Add scene movement, pacing, and montage language.',
    )]
  }

  return []
}

function createWarning(
  code: LyriaPromptValidationWarningCode,
  message: string,
  severity: 'low' | 'medium' | 'high',
  recommendation: string,
): LyriaPromptValidationWarning {
  return {
    code,
    message,
    severity,
    recommendation,
  }
}
