import type {
  AudioPipelinePlan,
  AdaptiveEditStrategyPlan,
  BeatSnapDecision,
  BeatSnapDecisionPlan,
  CaptionVisualCueTimingPlan,
  CompiledEditingIntent,
  MasterTimingPlan,
  PlannerInput,
  ProfessionalEditingDirective,
  RefinedSfxTimingItem,
  RefinedTransitionTimingItem,
  SegmentEditPlan,
  SoundSyncAnalysisStatus,
  SoundSyncTransitionTimingPlan,
  SoundSyncTransitionTimingQaCheck,
  TransitionTimingItem,
  TransitionTimingType,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import {
  createMockSoundSyncBeatGrid,
  shouldUseBeatSync,
} from './soundsync-beat-grid-policy'
import {
  chooseFallbackTransitionType,
  chooseTransitionTimingType,
  estimateTransitionDurationFrames,
  isTransitionSpeechSafe,
} from './transition-timing-policy'
import {
  createMusicDuckingTimingForSpeech,
  createSfxTimingForCue,
  getSfxDensityLevel,
} from './sfx-ducking-timing-policy'
import { createFrameTimeRangeFromFrames } from './timing-utils'

type CreateSoundSyncTransitionTimingPlanParams = {
  input: PlannerInput
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  audioPipelinePlan?: AudioPipelinePlan
  compiledIntent?: CompiledEditingIntent
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  professionalDirective?: ProfessionalEditingDirective
  videoUnderstandingReport?: VideoUnderstandingReport
  segmentEditPlans?: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
}

function statusForPlan(params: CreateSoundSyncTransitionTimingPlanParams): SoundSyncAnalysisStatus {
  if (!params.masterTimingPlan) return 'blocked'
  if (params.masterTimingPlan.status === 'blocked' || params.captionVisualCueTimingPlan?.status === 'blocked') return 'blocked'
  if (params.audioPipelinePlan?.musicBedPlan.policy === 'none' || params.audioPipelinePlan?.soundStyle === 'clean_voice_only') return 'not_needed'
  if (shouldUseBeatSync({ audioPipelinePlan: params.audioPipelinePlan, input: params.input })) return 'needs_audioflux_analysis'
  return params.input.editLevel === 'premium' ? 'ready_mock' : 'mock_planned'
}

function nearestBeat(params: {
  frame: number
  beatGridPlan: ReturnType<typeof createMockSoundSyncBeatGrid>
}) {
  if (!params.beatGridPlan.beatItems.length) return undefined

  return params.beatGridPlan.beatItems.reduce((best, item) => {
    if (!best) return item
    return Math.abs(item.frame - params.frame) < Math.abs(best.frame - params.frame) ? item : best
  }, params.beatGridPlan.beatItems[0])
}

function nearestPhraseBoundary(params: {
  frame: number
  masterTimingPlan: MasterTimingPlan
}) {
  const boundaries = params.masterTimingPlan.transcriptTimingPlan.lines.flatMap((line) => [
    line.timeRange.startFrame,
    line.timeRange.endFrame,
  ])
  if (!boundaries.length) return params.frame

  return boundaries.reduce((best, frame) =>
    Math.abs(frame - params.frame) < Math.abs(best - params.frame) ? frame : best,
  boundaries[0])
}

function speechSafeForFrame(params: {
  frame: number
  masterTimingPlan: MasterTimingPlan
  linkedTranscriptLineId?: string
}) {
  const line = params.linkedTranscriptLineId
    ? params.masterTimingPlan.transcriptTimingPlan.lines.find((item) => item.id === params.linkedTranscriptLineId)
    : params.masterTimingPlan.transcriptTimingPlan.lines.find((item) =>
      params.frame >= item.timeRange.startFrame && params.frame <= item.timeRange.endFrame,
    )

  if (!line) return true
  const nearStart = Math.abs(params.frame - line.timeRange.startFrame) <= Math.max(2, Math.round(line.timeRange.fps * 0.12))
  const nearEnd = Math.abs(params.frame - line.timeRange.endFrame) <= Math.max(2, Math.round(line.timeRange.fps * 0.12))
  return nearStart || nearEnd
}

function createBeatSnapDecision(params: {
  id: string
  targetCueId?: string
  requestedFrame: number
  beatGridPlan: ReturnType<typeof createMockSoundSyncBeatGrid>
  masterTimingPlan: MasterTimingPlan
  input: PlannerInput
  linkedTranscriptLineId?: string
  preferBeat?: boolean
}): BeatSnapDecisionPlan {
  const beat = nearestBeat({ beatGridPlan: params.beatGridPlan, frame: params.requestedFrame })
  const speechSafe = speechSafeForFrame({
    frame: beat?.frame ?? params.requestedFrame,
    linkedTranscriptLineId: params.linkedTranscriptLineId,
    masterTimingPlan: params.masterTimingPlan,
  })
  const beatWithinTolerance = Boolean(
    beat && Math.abs(beat.frame - params.requestedFrame) <= params.beatGridPlan.snapToleranceFrames,
  )
  const phraseBoundaryFrame = nearestPhraseBoundary({
    frame: params.requestedFrame,
    masterTimingPlan: params.masterTimingPlan,
  })
  const shouldSnapToBeat =
    params.preferBeat &&
    beatWithinTolerance &&
    speechSafe &&
    params.beatGridPlan.status !== 'not_needed' &&
    params.input.editLevel !== 'basic'

  let snapDecision: BeatSnapDecision = 'snap_to_phrase_boundary'
  let snappedFrame = phraseBoundaryFrame
  if (shouldSnapToBeat && beat?.isDownbeat) {
    snapDecision = 'snap_to_downbeat'
    snappedFrame = beat.frame
  } else if (shouldSnapToBeat && beat?.isOnset) {
    snapDecision = 'snap_to_onset'
    snappedFrame = beat.frame
  } else if (shouldSnapToBeat && beat) {
    snapDecision = 'snap_to_beat'
    snappedFrame = beat.frame
  } else if (!params.preferBeat) {
    snapDecision = 'do_not_snap'
    snappedFrame = params.requestedFrame
  }

  return {
    id: params.id,
    targetCueId: params.targetCueId,
    requestedFrame: params.requestedFrame,
    snappedFrame,
    snapDecision,
    linkedBeatId: snapDecision.startsWith('snap_to_') ? beat?.id : undefined,
    linkedPhraseBoundaryCueId: snapDecision === 'snap_to_phrase_boundary'
      ? params.masterTimingPlan.transcriptTimingPlan.phraseBoundaryCueIds[0]
      : undefined,
    speechSafe: snapDecision === 'snap_to_phrase_boundary' ? true : speechSafe,
    reason: snapDecision === 'snap_to_phrase_boundary'
      ? 'Phrase boundary wins because speech clarity is higher priority than beat alignment.'
      : snapDecision === 'do_not_snap'
        ? 'Cue keeps its requested frame because beat sync is not useful here.'
        : 'Beat snap is used only because the target frame is speech-safe.',
    qaChecks: [
      'Beat snap decision is frame-based.',
      'Speech safety is checked before beat alignment.',
      'Fallback phrase boundary exists when beat alignment is risky.',
    ],
  }
}

function transitionSources(masterTimingPlan: MasterTimingPlan): TransitionTimingItem[] {
  if (masterTimingPlan.transitionTimingItems.length) return masterTimingPlan.transitionTimingItems

  return masterTimingPlan.finalTimelineSegments.slice(1).map((segment, index) => ({
    id: `master-transition-derived-${index + 1}`,
    transitionType: 'hard_cut',
    timeRange: createFrameTimeRangeFromFrames(segment.finalRange.startFrame, segment.finalRange.startFrame, segment.finalRange.fps),
    fromSegmentId: masterTimingPlan.finalTimelineSegments[index]?.id,
    toSegmentId: segment.id,
    beatAligned: false,
    phraseBoundaryAligned: true,
    reason: 'Derived fallback transition from final timeline segment boundary.',
    qaChecks: ['Transition boundary is derived from MasterTimingPlan.'],
  }))
}

function riskForTransition(params: {
  input: PlannerInput
  transitionType: TransitionTimingType
  speechSafe: boolean
  beatAligned: boolean
}) {
  if (!params.speechSafe) return 'blocking' as const
  if (params.input.editingCategory === 'documentary_case_study' && params.beatAligned) return 'high' as const
  if (params.input.editLevel === 'basic' && (params.beatAligned || params.transitionType === 'whip_or_push')) return 'medium' as const
  return 'low' as const
}

function createRefinedTransitions(params: {
  input: PlannerInput
  masterTimingPlan: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  beatGridPlan: ReturnType<typeof createMockSoundSyncBeatGrid>
}) {
  const sources = transitionSources(params.masterTimingPlan)

  return sources.map((transition, index) => {
    const nearbyCue = params.captionVisualCueTimingPlan?.visualCueTimings.find((cue) =>
      Math.abs(cue.timeRange.endFrame - transition.timeRange.startFrame) <= params.masterTimingPlan.timingBase.fps,
    )
    const snapDecision = createBeatSnapDecision({
      beatGridPlan: params.beatGridPlan,
      id: `beat-snap-transition-${index + 1}`,
      input: params.input,
      masterTimingPlan: params.masterTimingPlan,
      preferBeat: transition.beatAligned || nearbyCue?.triggerType === 'beat',
      requestedFrame: transition.timeRange.startFrame,
      targetCueId: transition.id,
      linkedTranscriptLineId: nearbyCue?.linkedTranscriptLineId,
    })
    const transitionType = chooseTransitionTimingType({
      beatSnapDecision: snapDecision,
      input: params.input,
      masterTransition: transition,
      visualMotivated: Boolean(nearbyCue),
    })
    const durationFrames = estimateTransitionDurationFrames({
      fps: transition.timeRange.fps,
      input: params.input,
      transitionType,
    })
    const startFrame = Math.min(params.masterTimingPlan.timingBase.totalFrames, snapDecision.snappedFrame)
    const endFrame = Math.min(params.masterTimingPlan.timingBase.totalFrames, startFrame + durationFrames)
    const beatAligned = snapDecision.snapDecision === 'snap_to_beat' || snapDecision.snapDecision === 'snap_to_onset'
    const downbeatAligned = snapDecision.snapDecision === 'snap_to_downbeat'
    const phraseBoundaryAligned = transition.phraseBoundaryAligned || snapDecision.snapDecision === 'snap_to_phrase_boundary'
    const shell = {
      phraseBoundaryAligned,
      beatSnapDecision: snapDecision,
      transitionType,
    }
    const speechSafe = isTransitionSpeechSafe({ transition: shell })
    const riskLevel = riskForTransition({
      beatAligned: beatAligned || downbeatAligned,
      input: params.input,
      speechSafe,
      transitionType,
    })

    return {
      id: `refined-transition-${index + 1}`,
      transitionType,
      timeRange: createFrameTimeRangeFromFrames(startFrame, endFrame, transition.timeRange.fps),
      fromSegmentId: transition.fromSegmentId,
      toSegmentId: transition.toSegmentId,
      linkedMasterTransitionTimingItemId: transition.id,
      beatSnapDecision: snapDecision,
      phraseBoundaryAligned,
      beatAligned,
      downbeatAligned,
      visualMotivated: Boolean(nearbyCue),
      audioMotivated: beatAligned || downbeatAligned,
      durationFrames,
      riskLevel,
      reason: speechSafe
        ? `Transition is ${transitionType.replaceAll('_', ' ')} with speech-safe timing.`
        : 'Transition needs fallback because speech safety is not satisfied.',
      fallbackTransitionType: chooseFallbackTransitionType({ input: params.input, riskLevel, transitionType }),
      qaChecks: [
        'Transition is frame-accurate.',
        'Speech boundary safety is checked before beat snap.',
        'Fallback transition is available if timing risk rises.',
      ],
    } satisfies RefinedTransitionTimingItem
  })
}

function visualCueSfxCandidates(params: {
  input: PlannerInput
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
}) {
  const cues = params.captionVisualCueTimingPlan?.visualCueTimings ?? []
  const max =
    params.input.editLevel === 'premium'
      ? 6
      : params.input.editLevel === 'pro'
        ? 4
        : 2

  return cues
    .filter((cue) => cue.cueType.includes('card') || cue.cueType.includes('map') || cue.cueType.includes('chart') || cue.cueType.includes('browser') || cue.cueType.includes('transition'))
    .slice(0, max)
}

function createRefinedSfx(params: {
  input: PlannerInput
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  refinedTransitions: RefinedTransitionTimingItem[]
}) {
  const densityLevel = getSfxDensityLevel({ input: params.input })
  const visualSfx = visualCueSfxCandidates(params)
    .map((cue, index) => createSfxTimingForCue({
      cue,
      densityLevel,
      index,
      input: params.input,
    }))
    .filter(Boolean) as RefinedSfxTimingItem[]
  const transitionSfx = params.refinedTransitions
    .filter((transition) => transition.riskLevel !== 'high' && transition.riskLevel !== 'blocking')
    .slice(0, params.input.editLevel === 'premium' ? 4 : params.input.editLevel === 'pro' ? 2 : 1)
    .map((transition, index) => createSfxTimingForCue({
      densityLevel,
      index: visualSfx.length + index,
      input: params.input,
      transition,
    }))
    .filter(Boolean) as RefinedSfxTimingItem[]

  return [...visualSfx, ...transitionSfx]
}

function createQaChecks(params: {
  status: SoundSyncAnalysisStatus
  refinedTransitions: RefinedTransitionTimingItem[]
  refinedSfx: RefinedSfxTimingItem[]
  duckingCount: number
  input: PlannerInput
}): SoundSyncTransitionTimingQaCheck[] {
  const speechSafeTransitions = params.refinedTransitions.every((item) => item.riskLevel !== 'blocking' && item.phraseBoundaryAligned || item.transitionType === 'hard_cut')
  const noRandomSfx = params.refinedSfx.every((item) => Boolean(item.linkedVisualCueTimingItemId || item.linkedTransitionTimingItemId) && item.reason.length > 0)

  return [
    {
      id: 'soundsync-qa-speech-first',
      label: 'Speech-first transition timing',
      riskLevel: speechSafeTransitions ? 'low' : 'blocking',
      passedMock: speechSafeTransitions,
      message: speechSafeTransitions
        ? 'Transitions are phrase-aware or hard-cut safe before beat alignment.'
        : 'A transition needs speech-safe fallback before approval.',
      recommendation: speechSafeTransitions ? undefined : 'Use phrase cut or hard cut fallback.',
      linkedTransitionTimingItemIds: params.refinedTransitions.map((item) => item.id),
      linkedSfxTimingItemIds: [],
      linkedDuckingTimingItemIds: [],
    },
    {
      id: 'soundsync-qa-no-random-sfx',
      label: 'Cue-linked SFX',
      riskLevel: noRandomSfx ? 'low' : 'high',
      passedMock: noRandomSfx,
      message: noRandomSfx ? 'SFX are tied to planned visual/transition cues.' : 'SFX must link to a cue and reason.',
      recommendation: noRandomSfx ? undefined : 'Remove random SFX or link it to a planned cue.',
      linkedTransitionTimingItemIds: [],
      linkedSfxTimingItemIds: params.refinedSfx.map((item) => item.id),
      linkedDuckingTimingItemIds: [],
    },
    {
      id: 'soundsync-qa-audioflux-future',
      label: 'AudioFlux future-only analysis',
      riskLevel: params.status === 'blocked' ? 'blocking' : 'medium',
      passedMock: params.status !== 'blocked',
      message: params.status === 'needs_audioflux_analysis'
        ? 'AudioFlux analysis is planned for future workers and has not run.'
        : 'No real audio analysis is implied by this mock plan.',
      recommendation: 'Keep beat grid confidence mock-only until future AudioFlux worker results exist.',
      linkedTransitionTimingItemIds: [],
      linkedSfxTimingItemIds: [],
      linkedDuckingTimingItemIds: [],
    },
    {
      id: 'soundsync-qa-voice-ducking',
      label: 'Voice-protective ducking',
      riskLevel: params.duckingCount > 0 || params.status === 'not_needed' ? 'low' : 'medium',
      passedMock: params.duckingCount > 0 || params.status === 'not_needed',
      message: params.duckingCount > 0
        ? `${params.duckingCount} ducking range(s) protect speech.`
        : 'No ducking needed when no music bed is planned.',
      linkedTransitionTimingItemIds: [],
      linkedSfxTimingItemIds: [],
      linkedDuckingTimingItemIds: [],
    },
  ]
}

export function createSoundSyncTransitionTimingPlan(params: CreateSoundSyncTransitionTimingPlanParams): SoundSyncTransitionTimingPlan {
  if (!params.masterTimingPlan) {
    const fps = 30
    const emptyBeatGrid = createMockSoundSyncBeatGrid({
      audioPipelinePlan: params.audioPipelinePlan,
      fps,
      input: params.input,
      totalFrames: 0,
    })

    return {
      id: `soundsync-transition-timing-${params.input.editingCategory}-${params.input.editLevel}`,
      status: 'blocked',
      summary: 'SoundSync transition timing is blocked until MasterTimingPlan exists.',
      beatGridPlan: emptyBeatGrid,
      beatSnapDecisions: [],
      refinedTransitionTimings: [],
      refinedSfxTimings: [],
      refinedMusicDuckingTimings: [],
      sfxDensityLevel: getSfxDensityLevel({ input: params.input }),
      globalRules: ['MasterTimingPlan is required before SoundSync transition timing can be approved.'],
      qaChecks: createQaChecks({
        duckingCount: 0,
        input: params.input,
        refinedSfx: [],
        refinedTransitions: [],
        status: 'blocked',
      }),
      limitations: [
        'Blocked because MasterTimingPlan is missing.',
        'No real audio analysis, AudioFlux, FFmpeg, Signalsmith Stretch, SFX generation, media processing, providers, or rendering ran.',
      ],
      notes: [],
    }
  }

  const status = statusForPlan(params)
  const beatGridPlan = createMockSoundSyncBeatGrid({
    audioPipelinePlan: params.audioPipelinePlan,
    fps: params.masterTimingPlan.timingBase.fps,
    input: params.input,
    totalFrames: params.masterTimingPlan.timingBase.totalFrames,
  })
  const refinedTransitionsBase = createRefinedTransitions({
    beatGridPlan,
    captionVisualCueTimingPlan: params.captionVisualCueTimingPlan,
    input: params.input,
    masterTimingPlan: params.masterTimingPlan,
  })
  const refinedSfxTimings = createRefinedSfx({
    captionVisualCueTimingPlan: params.captionVisualCueTimingPlan,
    input: params.input,
    refinedTransitions: refinedTransitionsBase,
  })
  const refinedTransitionTimings = refinedTransitionsBase.map((transition) => ({
    ...transition,
    sfxCueId: refinedSfxTimings.find((sfx) => sfx.linkedTransitionTimingItemId === transition.id)?.id,
  }))
  const musicEnabled = params.audioPipelinePlan?.musicBedPlan.policy !== 'none' && params.audioPipelinePlan?.soundStyle !== 'clean_voice_only'
  const refinedMusicDuckingTimings = musicEnabled
    ? params.masterTimingPlan.transcriptTimingPlan.lines
      .slice(0, params.input.editLevel === 'premium' ? 8 : params.input.editLevel === 'pro' ? 5 : 3)
      .map((speechLine, index) => createMusicDuckingTimingForSpeech({
        captionVisualCueTimingPlan: params.captionVisualCueTimingPlan,
        index,
        input: params.input,
        speechLine,
      }))
    : []
  const beatSnapDecisions = [
    ...refinedTransitionTimings.flatMap((item) => item.beatSnapDecision ? [item.beatSnapDecision] : []),
    ...(params.captionVisualCueTimingPlan?.visualCueTimings.slice(0, 6).map((cue, index) => createBeatSnapDecision({
      beatGridPlan,
      id: `beat-snap-visual-${index + 1}`,
      input: params.input,
      linkedTranscriptLineId: cue.linkedTranscriptLineId,
      masterTimingPlan: params.masterTimingPlan!,
      preferBeat: cue.triggerType === 'beat' || cue.triggerType === 'downbeat' || cue.triggerType === 'onset',
      requestedFrame: cue.timeRange.startFrame,
      targetCueId: cue.id,
    })) ?? []),
  ]
  const qaChecks = createQaChecks({
    duckingCount: refinedMusicDuckingTimings.length,
    input: params.input,
    refinedSfx: refinedSfxTimings,
    refinedTransitions: refinedTransitionTimings,
    status,
  })
  const visualCueCount = params.captionVisualCueTimingPlan?.visualCueTimings.length ?? 0

  return {
    id: `soundsync-transition-timing-${params.masterTimingPlan.id}`,
    status,
    summary: status === 'not_needed'
      ? 'Voice-led SoundSync timing planned without beat grid; transitions remain phrase-aware.'
      : `Mock SoundSync transition timing planned with ${beatGridPlan.beatItems.length} beat marker(s), ${refinedTransitionTimings.length} transition(s), ${refinedSfxTimings.length} cue-linked SFX item(s), and ${refinedMusicDuckingTimings.length} ducking range(s).`,
    beatGridPlan,
    beatSnapDecisions,
    refinedTransitionTimings,
    refinedSfxTimings,
    refinedMusicDuckingTimings,
    sfxDensityLevel: getSfxDensityLevel({ input: params.input }),
    globalRules: [
      'Speech clarity beats beat alignment.',
      'Beat cuts must not cut important words.',
      'Transitions are phrase-aware and frame-accurate.',
      'SFX must be tied to planned visual/transition cues.',
      'Music ducking protects voice clarity.',
      'Documentary/case-study timing stays restrained unless requested.',
      'AudioFlux is planned for future beat analysis only and is not executed.',
    ],
    qaChecks,
    limitations: [
      'Mock-only SoundSync + Transition Timing; no real AudioFlux analysis has run.',
      'No real beat detection, onset detection, BPM detection, audio analysis, SFX generation, FFmpeg, Signalsmith Stretch, media processing, provider calls, backend, Supabase, or rendering is executed.',
      'AudioFlux is the future beat/rhythm analysis candidate; Essentia is not the launch default.',
      'Signalsmith Stretch is stretch/pitch-only; Rubber Band is not the launch default.',
      params.captionVisualCueTimingPlan
        ? `Caption + Visual Cue Timing provided ${visualCueCount} visual cue(s) for SFX/transition sync.`
        : 'Caption + Visual Cue Timing is not attached; visual cue SFX sync is broad.',
    ],
    notes: [
      params.compiledIntent ? `Compiled intent: ${params.compiledIntent.goalSummary}` : 'Compiled intent not attached.',
      params.professionalDirective ? `Sound style: ${params.professionalDirective.soundStyle.replaceAll('_', ' ')}.` : 'Professional directive not attached.',
      params.videoUnderstandingReport ? `Video understanding audio note: ${params.videoUnderstandingReport.audioUnderstanding.voiceClarity} voice clarity.` : 'Video understanding not attached.',
      `${params.segmentEditPlans?.length ?? 0} segment plan(s) and ${params.visualAssetPlan?.length ?? 0} visual asset(s) informed this mock plan.`,
    ],
  }
}
