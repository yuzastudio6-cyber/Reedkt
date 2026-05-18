import type {
  AdaptiveEditStrategyPlan,
  AspectRatioFramePlan,
  AudioPipelinePlan,
  CaptionPhraseTiming,
  CaptionStyleTimingPolicy,
  CaptionVisualCollisionPlan,
  CaptionVisualCueTimingPlan,
  CaptionWordTiming,
  CompiledEditingIntent,
  DataVizPlan,
  FrameTimeRange,
  MapAnimationPlan,
  MasterTimingPlan,
  PlannerInput,
  ProfessionalEditingDirective,
  RefinedCaptionTimingItem,
  SegmentEditPlan,
  SpeakerVisualLayoutPlan,
  TimingQaCheck,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualCueSyncStatus,
  VisualCueTimingItem,
} from '../types/reeditpro'
import { getCaptionTimingPolicy, estimateCaptionReadability, splitTextIntoCaptionChunks } from './caption-timing-policy'
import { createFrameTimeRangeFromFrames, getMinimumReadFrames } from './timing-utils'
import { createVisualCueFromMasterTiming } from './visual-cue-timing-policy'

type CreateCaptionVisualCueTimingPlanParams = {
  input: PlannerInput
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  segmentEditPlans?: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  audioPipelinePlan?: AudioPipelinePlan
}

function overlapFrames(a: FrameTimeRange, b: FrameTimeRange) {
  return Math.max(0, Math.min(a.endFrame, b.endFrame) - Math.max(a.startFrame, b.startFrame))
}

function clampRange(startFrame: number, endFrame: number, fps: number, totalFrames: number) {
  const start = Math.max(0, Math.min(startFrame, totalFrames))
  const end = Math.max(start, Math.min(endFrame, totalFrames))

  return createFrameTimeRangeFromFrames(start, end, fps)
}

function emphasisWordsForText(text: string, policy: CaptionStyleTimingPolicy, input: PlannerInput) {
  if (!policy.emphasisAllowed) return []

  const stopWords = new Set(['the', 'and', 'that', 'this', 'with', 'from', 'into', 'your', 'you', 'for', 'but', 'are', 'was'])
  const words = text
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()))
  const unique = Array.from(new Set(words))

  if (input.editingCategory === 'documentary_case_study') return []
  return unique.slice(0, policy.maxEmphasisWordsPerCaption)
}

function wordTimingsForChunk(params: {
  phraseId: string
  text: string
  timeRange: FrameTimeRange
  emphasisWords: string[]
}): CaptionWordTiming[] {
  const words = params.text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const framesPerWord = Math.max(1, Math.floor(params.timeRange.durationFrames / words.length))

  return words.map((word, index) => {
    const startFrame = params.timeRange.startFrame + index * framesPerWord
    const endFrame = index === words.length - 1
      ? params.timeRange.endFrame
      : Math.min(params.timeRange.endFrame, startFrame + framesPerWord)

    return {
      id: `${params.phraseId}-word-${index + 1}`,
      word,
      timeRange: createFrameTimeRangeFromFrames(startFrame, endFrame, params.timeRange.fps),
      emphasized: params.emphasisWords.map((item) => item.toLowerCase()).includes(word.replace(/[^\w-]/g, '').toLowerCase()),
      confidence: 'low',
      notes: ['Mock word timing distributed within phrase range; no real transcript alignment has run.'],
    }
  })
}

function createCaptionPhraseTimings(params: {
  masterTimingPlan: MasterTimingPlan
  policy: CaptionStyleTimingPolicy
  input: PlannerInput
}): CaptionPhraseTiming[] {
  return params.masterTimingPlan.transcriptTimingPlan.lines.flatMap((line, lineIndex) => {
    const chunks = splitTextIntoCaptionChunks(line.text, params.policy)
    if (!chunks.length) return []

    const framesPerChunk = Math.max(params.policy.minDurationFrames, Math.floor(line.timeRange.durationFrames / chunks.length))

    return chunks.map((chunk, chunkIndex) => {
      const startFrame = line.timeRange.startFrame + chunkIndex * framesPerChunk
      const endFrame = chunkIndex === chunks.length - 1
        ? line.timeRange.endFrame
        : Math.min(line.timeRange.endFrame, startFrame + framesPerChunk)
      const range = createFrameTimeRangeFromFrames(startFrame, endFrame, line.timeRange.fps)
      const emphasisWords = emphasisWordsForText(chunk, params.policy, params.input)
      const id = `caption-phrase-${lineIndex + 1}-${chunkIndex + 1}`

      return {
        id,
        text: chunk,
        timeRange: range,
        words: wordTimingsForChunk({ emphasisWords, phraseId: id, text: chunk, timeRange: range }),
        linkedTranscriptLineId: line.id,
        phraseRole: line.lineType,
        qaChecks: [
          'Phrase timing is frame-based.',
          'Phrase chunking follows caption policy.',
          'Mock phrase timing must be replaced by transcript alignment in future workers.',
        ],
      }
    })
  })
}

function createRefinedCaptionTimings(params: {
  phraseTimings: CaptionPhraseTiming[]
  masterTimingPlan: MasterTimingPlan
  policy: CaptionStyleTimingPolicy
  aspectRatioFramePlan?: AspectRatioFramePlan
  visualDensity: number
}): RefinedCaptionTimingItem[] {
  return params.phraseTimings.map((phrase, index) => {
    const leadStart = phrase.timeRange.startFrame - params.policy.leadInFrames
    const lagEnd = phrase.timeRange.endFrame + params.policy.lagFrames
    const minEnd = leadStart + Math.max(params.policy.minDurationFrames, getMinimumReadFrames(phrase.text, phrase.timeRange.fps))
    const range = clampRange(
      leadStart,
      Math.min(Math.max(lagEnd, minEnd), leadStart + params.policy.maxDurationFrames),
      phrase.timeRange.fps,
      params.masterTimingPlan.timingBase.totalFrames,
    )
    const masterCaption = params.masterTimingPlan.captionTimingItems.find((item) => item.linkedTranscriptLineId === phrase.linkedTranscriptLineId)
      ?? params.masterTimingPlan.captionTimingItems[index % Math.max(1, params.masterTimingPlan.captionTimingItems.length)]
    const emphasisWords = phrase.words.filter((word) => word.emphasized).map((word) => word.word)
    const readability = estimateCaptionReadability({
      aspectRatioFramePlan: params.aspectRatioFramePlan,
      durationFrames: range.durationFrames,
      policy: params.policy,
      text: phrase.text,
      visualDensity: params.visualDensity,
    })

    return {
      id: `refined-caption-${phrase.id}`,
      captionText: phrase.text,
      phraseTimingId: phrase.id,
      linkedMasterCaptionTimingItemId: masterCaption?.id,
      linkedTranscriptLineId: phrase.linkedTranscriptLineId,
      timeRange: range,
      chunkingMode: params.policy.chunkingMode,
      animationStyle: params.policy.animationStyle,
      emphasisWords,
      readabilityRisk: readability.risk,
      readabilityScore: readability.score,
      safeZoneNotes: [
        'Use confirmed caption safe zone from the output frame.',
        params.aspectRatioFramePlan?.selectedAspectRatio === '9:16'
          ? 'Vertical output: avoid face, mouth, and lower-panel crowding.'
          : 'Avoid covering speaker, product, chart, map, browser highlight, or source labels.',
      ],
      collisionAvoidanceNotes: readability.notes,
      reason: 'Refined caption timing uses phrase timing, readable duration, lead-in/lag frames, and safe-zone policy.',
      qaChecks: [
        'Caption timing is frame-accurate.',
        'Caption stays readable long enough.',
        'Caption animation fits tier and category.',
      ],
    }
  })
}

function nearestCaptionForVisual(captions: RefinedCaptionTimingItem[], visualRange: FrameTimeRange) {
  return captions
    .map((caption) => ({ caption, overlap: overlapFrames(caption.timeRange, visualRange) }))
    .sort((a, b) => b.overlap - a.overlap)[0]?.caption
}

function createVisualCueTimings(params: {
  masterTimingPlan: MasterTimingPlan
  visualAssetPlan: VisualAssetPlanItem[]
  refinedCaptionTimings: RefinedCaptionTimingItem[]
  audioPipelinePlan?: AudioPipelinePlan
}): VisualCueTimingItem[] {
  return params.masterTimingPlan.visualTimingItems.map((item, index) => {
    const asset = params.visualAssetPlan.find((candidate) => candidate.id === item.linkedVisualAssetPlanItemId)
    const caption = nearestCaptionForVisual(params.refinedCaptionTimings, item.timeRange)
    const linkedSoundSyncCue = params.audioPipelinePlan?.soundSyncCues.find((cue) => cue.linkedVisualAssetId === item.linkedVisualAssetPlanItemId)

    return createVisualCueFromMasterTiming({
      asset,
      linkedCaptionTimingItemId: caption?.id,
      linkedSoundSyncCueId: linkedSoundSyncCue?.id,
      linkedTranscriptLineId: caption?.linkedTranscriptLineId ?? params.masterTimingPlan.transcriptTimingPlan.lines[index % Math.max(1, params.masterTimingPlan.transcriptTimingPlan.lines.length)]?.id,
      masterTimingPlan: params.masterTimingPlan,
      visualTimingItem: item,
    })
  })
}

function createCollisionPlans(params: {
  refinedCaptionTimings: RefinedCaptionTimingItem[]
  visualCueTimings: VisualCueTimingItem[]
  visualAssetPlan: VisualAssetPlanItem[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
}): CaptionVisualCollisionPlan[] {
  const plans: CaptionVisualCollisionPlan[] = []

  params.visualCueTimings.forEach((visualCue) => {
    const asset = params.visualAssetPlan.find((item) => item.id === visualCue.linkedVisualAssetPlanItemId)
    const layout = params.speakerVisualLayoutPlan?.items.find((item) => item.assetPlanItemId === asset?.id || item.segmentId === visualCue.linkedSegmentId)
    const riskyLayout = layout?.layoutMode === 'lower_visual_panel' ||
      layout?.layoutMode === 'full_map_takeover' ||
      layout?.layoutMode === 'full_evidence_board' ||
      layout?.layoutMode === 'screen_capture_with_speaker_pip' ||
      visualCue.cueType.includes('chart') ||
      visualCue.cueType.includes('browser') ||
      visualCue.cueType.includes('map')
    const overlappingCaptions = params.refinedCaptionTimings.filter((caption) => overlapFrames(caption.timeRange, visualCue.timeRange) > 0)

    if (!riskyLayout || !overlappingCaptions.length) {
      return
    }

    plans.push({
      id: `caption-visual-collision-${visualCue.id}`,
      label: `${visualCue.label} caption overlap`,
      affectedCaptionTimingItemIds: overlappingCaptions.map((caption) => caption.id),
      affectedVisualCueTimingItemIds: [visualCue.id],
      risk: visualCue.visualReadTimeFrames > visualCue.holdFrames ? 'high' : 'medium',
      issue: 'Caption timing overlaps with a text- or focus-heavy visual cue.',
      recommendation: layout?.layoutMode === 'lower_visual_panel'
        ? 'Move captions above the lower panel, reduce label density, or extend the visual hold.'
        : 'Use the caption safe zone, simplify visual labels, or delay the visual reveal to a phrase boundary.',
      fallbackLayoutMode: layout?.fallbackLayoutMode ?? 'side_by_side_speaker_visual',
      qaChecks: [
        'Caption/visual collision is identified.',
        'Recommendation preserves speech clarity and visual readability.',
      ],
    })
  })

  return plans
}

function statusForPlan(params: {
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  visualCueTimings?: VisualCueTimingItem[]
}): VisualCueSyncStatus {
  if (!params.masterTimingPlan) return 'blocked'
  if (params.aspectRatioFramePlan?.status !== 'confirmed') return 'blocked'
  if (params.masterTimingPlan.transcriptTimingPlan.status === 'needs_transcript_alignment') return 'needs_transcript_alignment'
  if (params.visualCueTimings?.some((item) => item.status === 'needs_audio_analysis')) return 'needs_audio_analysis'
  if (params.masterTimingPlan.status === 'needs_frame_confirmation' || params.masterTimingPlan.status === 'blocked') return 'blocked'

  return 'synced'
}

function qaChecksForPlan(params: {
  status: VisualCueSyncStatus
  refinedCaptionTimings: RefinedCaptionTimingItem[]
  visualCueTimings: VisualCueTimingItem[]
  collisionPlans: CaptionVisualCollisionPlan[]
}): TimingQaCheck[] {
  const check = (
    id: string,
    label: string,
    riskLevel: TimingQaCheck['riskLevel'],
    passedMock: boolean,
    message: string,
    recommendation?: string,
    linkedCueIds: string[] = [],
  ): TimingQaCheck => ({ id, label, riskLevel, passedMock, message, recommendation, linkedCueIds })

  return [
    check(
      'caption-visual-qa-status',
      'Caption/visual timing available',
      params.status === 'blocked' ? 'blocking' : 'medium',
      params.status !== 'blocked',
      `Caption + visual cue timing status: ${params.status.replaceAll('_', ' ')}.`,
      params.status === 'blocked' ? 'Confirm output frame and attach MasterTimingPlan before approval.' : undefined,
    ),
    check(
      'caption-visual-qa-caption-ranges',
      'Refined captions are frame-accurate',
      'high',
      params.refinedCaptionTimings.length > 0 && params.refinedCaptionTimings.every((item) => item.timeRange.durationFrames >= 0),
      `${params.refinedCaptionTimings.length} refined caption timing item(s) planned.`,
    ),
    check(
      'caption-visual-qa-visual-cues',
      'Visual cues are frame-accurate',
      'high',
      params.visualCueTimings.every((item) => item.timeRange.durationFrames >= 0 && item.reason.length > 0),
      `${params.visualCueTimings.length} visual cue timing item(s) tied to speech, meaning, beat support, or planned action.`,
      undefined,
      params.visualCueTimings.map((item) => item.id),
    ),
    check(
      'caption-visual-qa-collisions',
      'Caption/visual collisions planned',
      params.collisionPlans.some((item) => item.risk === 'high') ? 'high' : 'medium',
      params.collisionPlans.every((item) => item.recommendation.length > 0),
      `${params.collisionPlans.length} collision recommendation(s) created for risky layouts.`,
    ),
    check(
      'caption-visual-qa-mock-limit',
      'Mock-only limitation stated',
      'medium',
      true,
      'No real word alignment, beat detection, pixel collision analysis, media processing, or rendering has run.',
    ),
  ]
}

export function createCaptionVisualCueTimingPlan(params: CreateCaptionVisualCueTimingPlanParams): CaptionVisualCueTimingPlan {
  const visualDensity = (params.visualAssetPlan?.length ?? 0) +
    (params.mapAnimationPlan?.active ? params.mapAnimationPlan.items.length : 0) +
    (params.dataVizPlan?.active ? params.dataVizPlan.items.length : 0)
  const captionPolicy = getCaptionTimingPolicy({
    aspectRatioFramePlan: params.aspectRatioFramePlan,
    input: params.input,
    professionalDirective: params.professionalDirective,
    visualDensity,
  })

  if (!params.masterTimingPlan) {
    return {
      id: 'caption-visual-cue-timing-blocked',
      status: 'blocked',
      summary: 'Caption and visual cue timing is blocked until MasterTimingPlan exists.',
      captionPolicy,
      captionPhraseTimings: [],
      refinedCaptionTimings: [],
      visualCueTimings: [],
      collisionPlans: [],
      globalRules: ['MasterTimingPlan is required before refined caption/visual timing.'],
      qaChecks: qaChecksForPlan({ collisionPlans: [], refinedCaptionTimings: [], status: 'blocked', visualCueTimings: [] }),
      limitations: ['No MasterTimingPlan was provided.', 'No real transcript/audio/media analysis has run.'],
      notes: ['This is planning metadata only.'],
    }
  }

  const captionPhraseTimings = createCaptionPhraseTimings({
    input: params.input,
    masterTimingPlan: params.masterTimingPlan,
    policy: captionPolicy,
  })
  const refinedCaptionTimings = createRefinedCaptionTimings({
    aspectRatioFramePlan: params.aspectRatioFramePlan,
    masterTimingPlan: params.masterTimingPlan,
    phraseTimings: captionPhraseTimings,
    policy: captionPolicy,
    visualDensity,
  })
  const visualCueTimings = createVisualCueTimings({
    audioPipelinePlan: params.audioPipelinePlan,
    masterTimingPlan: params.masterTimingPlan,
    refinedCaptionTimings,
    visualAssetPlan: params.visualAssetPlan ?? [],
  })
  const collisionPlans = createCollisionPlans({
    refinedCaptionTimings,
    speakerVisualLayoutPlan: params.speakerVisualLayoutPlan,
    visualAssetPlan: params.visualAssetPlan ?? [],
    visualCueTimings,
  })
  const status = statusForPlan({
    aspectRatioFramePlan: params.aspectRatioFramePlan,
    masterTimingPlan: params.masterTimingPlan,
    visualCueTimings,
  })

  return {
    id: `caption-visual-cue-timing-${params.masterTimingPlan.id}`,
    status,
    summary: status === 'blocked'
      ? 'Caption and visual cue timing is blocked until output frame and Master Timing are approval-ready.'
      : `Caption timing uses ${captionPolicy.chunkingMode.replaceAll('_', ' ')} with ${captionPolicy.animationStyle.replaceAll('_', ' ')} animation; ${visualCueTimings.length} visual cue(s) are tied to speech, meaning, or beat support.`,
    captionPolicy,
    captionPhraseTimings,
    refinedCaptionTimings,
    visualCueTimings,
    collisionPlans,
    globalRules: [
      'Speech clarity and caption readability outrank beat sync.',
      'Visual cues must appear when the viewer needs the concept.',
      'Captions must not cover faces, products, map labels, chart labels, browser highlights, source labels, or fact-safety notes.',
      'SFX must be tied to a planned visual or transition cue.',
      'All caption and visual cue timing is frame-accurate mock metadata.',
    ],
    qaChecks: qaChecksForPlan({ collisionPlans, refinedCaptionTimings, status, visualCueTimings }),
    limitations: [
      'Mock-only timing: no real word-level transcript alignment has run.',
      'No speech-to-text, AudioFlux beat detection, media processing, Remotion rendering, or provider execution has run.',
      params.masterTimingPlan.transcriptTimingPlan.status === 'needs_transcript_alignment'
        ? 'Transcript line and word timing need future alignment workers before production execution.'
        : 'Transcript timing is still review-only until verified against real media.',
      params.masterTimingPlan.beatGridPlan.status === 'needs_audio_analysis'
        ? 'Beat-supported visual cues need future audio analysis before production execution.'
        : 'Beat support remains mock metadata.',
    ],
    notes: [
      params.compiledIntent ? `Compiled intent available: ${params.compiledIntent.goalSummary}.` : 'Compiled intent was not attached to this timing pass.',
      params.videoUnderstandingReport ? 'Video understanding context informed timing notes.' : 'No real video understanding execution occurred.',
      params.adaptiveEditStrategyPlan ? 'Adaptive strategy informed visual cue density.' : 'No adaptive strategy plan attached.',
      params.segmentEditPlans?.length ? `${params.segmentEditPlans.length} segment plan(s) available for cue references.` : 'No segment plans attached.',
    ],
  }
}
