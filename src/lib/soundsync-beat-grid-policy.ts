import type {
  AudioPipelinePlan,
  MusicPhraseTimingItem,
  OpenSourceToolId,
  PlannerInput,
  SoundStyleId,
  SoundSyncAnalysisStatus,
  SoundSyncBeatGridPlan,
} from '../types/reeditpro'
import { createFrameTimeRangeFromFrames } from './timing-utils'

function textIncludes(input: PlannerInput, pattern: RegExp) {
  return pattern.test(`${input.customInstructions} ${input.workflowType} ${input.moodStyle}`.toLowerCase())
}

function hasMusic(input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan) {
  if (textIncludes(input, /\b(no music|voice only|clean voice|no sfx|no soundtrack)\b/)) return false
  if (audioPipelinePlan?.musicBedPlan.policy === 'none') return false
  if (audioPipelinePlan?.soundStyle === 'clean_voice_only') return false
  return true
}

function soundStyle(input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan): SoundStyleId {
  return audioPipelinePlan?.soundStyle ?? input.professionalEditingDirective?.soundStyle ?? 'subtle_premium_bed'
}

export function getMockBpmForSoundStyle(params: {
  input: PlannerInput
  audioPipelinePlan?: AudioPipelinePlan
}) {
  const style = soundStyle(params.input, params.audioPipelinePlan)

  if (style === 'energetic_social' || style === 'high_retention_impact') return 132
  if (style === 'cinematic_emotional') return params.input.editLevel === 'premium' ? 92 : 84
  if (style === 'documentary_serious') return 78
  if (style === 'lifestyle_warm' || style === 'luxury_soft') return 96
  if (style === 'corporate_clean') return 104
  if (params.input.targetPlatform === 'tiktok_reels_shorts') return 124
  return 108
}

export function shouldUseBeatSync(params: {
  input: PlannerInput
  audioPipelinePlan?: AudioPipelinePlan
}) {
  if (!hasMusic(params.input, params.audioPipelinePlan)) return false
  if (textIncludes(params.input, /\b(calm|natural|no beat|no beat sync|minimal sound|subtle only)\b/)) return false
  if (params.input.editingCategory === 'documentary_case_study' && !textIncludes(params.input, /\b(high energy|music led|beat sync)\b/)) return false
  if (params.input.editLevel === 'basic' && !textIncludes(params.input, /\b(beat sync|high retention|energetic)\b/)) return false
  return params.audioPipelinePlan?.beatSyncPlan.strategy !== 'none' || params.input.editLevel !== 'basic'
}

export function getBeatSnapToleranceFrames(params: {
  input: PlannerInput
  fps: number
}) {
  const base =
    params.input.editLevel === 'premium'
      ? Math.round(params.fps * 0.25)
      : params.input.editLevel === 'pro'
        ? Math.round(params.fps * 0.18)
        : Math.round(params.fps * 0.12)

  return Math.max(3, base)
}

function phraseTypesForPlan(input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan) {
  if (!hasMusic(input, audioPipelinePlan)) return ['voice_only'] as const
  if (input.editLevel === 'premium' || soundStyle(input, audioPipelinePlan) === 'cinematic_emotional') {
    return ['intro', 'build', 'chorus', 'bridge', 'outro'] as const
  }
  if (soundStyle(input, audioPipelinePlan) === 'energetic_social' || soundStyle(input, audioPipelinePlan) === 'high_retention_impact') {
    return ['intro', 'build', 'drop', 'outro'] as const
  }
  if (input.editingCategory === 'documentary_case_study') return ['intro', 'verse', 'outro'] as const
  return ['intro', 'verse', 'outro'] as const
}

export function getMusicPhrasePlan(params: {
  input: PlannerInput
  audioPipelinePlan?: AudioPipelinePlan
  totalFrames: number
  fps: number
}): MusicPhraseTimingItem[] {
  const phraseTypes = phraseTypesForPlan(params.input, params.audioPipelinePlan)
  const safeTotal = Math.max(0, params.totalFrames)
  const segmentFrames = Math.max(params.fps, Math.floor(safeTotal / Math.max(1, phraseTypes.length)))

  return phraseTypes.map((phraseType, index) => {
    const startFrame = Math.min(safeTotal, index * segmentFrames)
    const endFrame = index === phraseTypes.length - 1
      ? safeTotal
      : Math.min(safeTotal, startFrame + segmentFrames)
    const energy =
      phraseType === 'drop' || phraseType === 'chorus'
        ? 'high'
        : phraseType === 'build' || phraseType === 'verse'
          ? 'medium'
          : 'low'

    return {
      id: `music-phrase-${index + 1}-${phraseType}`,
      phraseType,
      label: phraseType.replaceAll('_', ' '),
      timeRange: createFrameTimeRangeFromFrames(startFrame, endFrame, params.fps),
      energy,
      confidence: hasMusic(params.input, params.audioPipelinePlan) ? 'medium' : 'low',
      notes: [
        hasMusic(params.input, params.audioPipelinePlan)
          ? 'Mock music phrase section; no real audio analysis has run.'
          : 'Voice-only section; no beat sync needed.',
      ],
    }
  })
}

export function createMockSoundSyncBeatGrid(params: {
  input: PlannerInput
  audioPipelinePlan?: AudioPipelinePlan
  totalFrames: number
  fps: number
}): SoundSyncBeatGridPlan {
  const useBeatSync = shouldUseBeatSync(params)
  const musicExists = hasMusic(params.input, params.audioPipelinePlan)
  const bpm = musicExists ? getMockBpmForSoundStyle(params) : undefined
  const musicPhrases = getMusicPhrasePlan(params)
  const snapToleranceFrames = getBeatSnapToleranceFrames({ fps: params.fps, input: params.input })
  const beatIntervalFrames = bpm ? Math.max(1, Math.round((60 / bpm) * params.fps)) : 0
  const maxBeats = beatIntervalFrames ? Math.min(240, Math.ceil(params.totalFrames / beatIntervalFrames)) : 0
  const analysisToolPlanned: OpenSourceToolId[] = useBeatSync ? ['audioflux'] : []
  const status: SoundSyncAnalysisStatus = !musicExists
    ? 'not_needed'
    : useBeatSync
      ? 'needs_audioflux_analysis'
      : 'mock_planned'

  const beatItems = Array.from({ length: maxBeats }, (_, index) => {
    const frame = Math.min(params.totalFrames, index * beatIntervalFrames)
    const phrase = musicPhrases.find((item) => frame >= item.timeRange.startFrame && frame <= item.timeRange.endFrame)
    const isDownbeat = index % 4 === 0
    const isDropMoment = Boolean(phrase && (phrase.phraseType === 'drop' || phrase.phraseType === 'chorus') && isDownbeat)
    const isOnset = useBeatSync && (index % 2 === 0 || isDropMoment)

    return {
      id: `soundsync-beat-${index + 1}`,
      beatIndex: index,
      timeSeconds: frame / Math.max(1, params.fps),
      frame,
      isDownbeat,
      isDropMoment,
      isOnset,
      energy: isDropMoment ? 'high' : phrase?.energy ?? 'medium',
      confidence: useBeatSync ? 'medium' as const : 'low' as const,
      linkedMusicPhraseId: phrase?.id,
      notes: [
        'Mock beat marker generated for planning only.',
        isDownbeat ? 'Downbeat candidate.' : 'Regular beat candidate.',
        isDropMoment ? 'Mock drop/chorus moment; requires future AudioFlux confirmation.' : 'No real AudioFlux analysis has run.',
      ],
    }
  })

  return {
    id: `soundsync-beat-grid-${params.input.editingCategory}-${params.input.editLevel}`,
    status,
    bpm,
    confidence: useBeatSync ? 'medium' : 'low',
    beatItems,
    musicPhrases,
    snapToleranceFrames,
    analysisToolPlanned,
    globalRules: [
      'Speech clarity beats beat alignment.',
      'Snap to phrase boundaries when a beat would cut an important word.',
      'AudioFlux is planned for future analysis only and is not executed in this mock.',
      'Essentia is not the launch beat-analysis default.',
    ],
    limitations: [
      musicExists
        ? 'Mock beat grid only; no real AudioFlux analysis, onset detection, BPM detection, or media processing has run.'
        : 'No music bed or beat grid needed for clean voice-led timing.',
      'FFmpeg and Signalsmith Stretch are not executed.',
    ],
    qaChecks: [
      'Beat grid is marked mock/future when AudioFlux analysis is needed.',
      'Downbeat/onset/drop candidates do not override speech boundaries.',
      'AudioFlux is represented as future analysis metadata only.',
    ],
  }
}
