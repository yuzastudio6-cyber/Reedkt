import type {
  AdaptiveEditStrategyPlan,
  AspectRatioFramePlan,
  AudioPipelinePlan,
  BeatGridItem,
  BeatGridPlan,
  CaptionTimingItem,
  CompiledEditingIntent,
  DataVizPlan,
  EditSegmentRole,
  FinalTimelineSegmentTiming,
  MapAnimationPlan,
  MasterTimingPlan,
  MusicDuckingTimingItem,
  PlannerInput,
  ProfessionalEditingDirective,
  ProviderClipTimingItem,
  RemotionLayerTimingItem,
  SegmentEditPlan,
  SfxTimingItem,
  TimingCue,
  TimingPlanStatus,
  TimingQaCheck,
  TimingRiskLevel,
  TranscriptTimingLine,
  TranscriptTimingPlan,
  TransitionTimingItem,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualTimingItem,
} from '../types/reeditpro'
import { getDefaultTimingPresetForCategory } from './timing-presets'
import {
  createFrameTimeRange,
  createFrameTimeRangeFromFrames,
  createTimingCue,
  getDefaultTimingFps,
  getMinimumReadFrames,
  secondsToFrames,
} from './timing-utils'

type CreateMasterTimingPlanParams = {
  input: PlannerInput
  aspectRatioFramePlan?: AspectRatioFramePlan
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  professionalDirective?: ProfessionalEditingDirective
  segmentEditPlans?: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}

function parseDurationSeconds(duration: string | undefined) {
  if (!duration) return 8

  const parts = duration.split(':').map(Number)

  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1]
  }

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  return 8
}

function segmentSeeds(input: PlannerInput): Array<{ role: EditSegmentRole; label: string; summary: string; duration: number }> {
  if (input.editingCategory === 'education_explainer') {
    return [
      { role: 'title_card', label: 'Concept setup', summary: 'Name the concept.', duration: 4 },
      { role: 'explanation', label: 'Step explanation', summary: 'Explain the key step.', duration: 6 },
      { role: 'visual_explainer', label: 'Visual example', summary: 'Show the visual example.', duration: 6 },
      { role: 'recap', label: 'Recap', summary: 'Reinforce the takeaway.', duration: 4 },
    ]
  }

  if (input.editingCategory === 'documentary_case_study') {
    return [
      { role: 'hook', label: 'Case setup', summary: 'Set up the case question safely.', duration: 5 },
      { role: 'evidence_card', label: 'Evidence context', summary: 'Hold evidence context long enough.', duration: 6 },
      { role: 'proof', label: 'Proof moment', summary: 'Present proof with restraint.', duration: 6 },
      { role: 'ending', label: 'Outcome', summary: 'Close with known outcome or uncertainty.', duration: 5 },
    ]
  }

  if (input.editingCategory === 'business_brand') {
    return [
      { role: 'hook', label: 'Problem opener', summary: 'Open on the audience problem.', duration: 4 },
      { role: 'explanation', label: 'Feature explanation', summary: 'Explain the feature.', duration: 5 },
      { role: 'proof', label: 'Benefit proof', summary: 'Make the value concrete.', duration: 5 },
      { role: 'call_to_action', label: 'CTA', summary: 'Close with a clear next step.', duration: 3 },
    ]
  }

  return [
    { role: 'hook', label: 'Hook', summary: 'Open with the strongest line.', duration: 4 },
    { role: 'setup', label: 'Setup', summary: 'Give context.', duration: 5 },
    { role: 'reveal', label: 'Reveal', summary: 'Land the turning point.', duration: 5 },
    { role: 'ending', label: 'Ending', summary: 'Close cleanly.', duration: 4 },
  ]
}

function finalRangesFromSegments(input: PlannerInput, segmentEditPlans: SegmentEditPlan[] | undefined, fps: number) {
  if (segmentEditPlans?.length) {
    return segmentEditPlans.map((segment) => ({
      id: segment.id,
      label: segment.label,
      role: segment.role,
      spokenTextSummary: segment.spokenTextSummary ?? segment.storyPurpose,
      range: createFrameTimeRange(segment.finalTimeRange.startSeconds, segment.finalTimeRange.endSeconds, fps),
      sourceClipIds: segment.sourceClipIds,
      visualAssetPlanItemIds: segment.visualAssetPlanItemIds,
      pacingNotes: [
        `Segment timing inherits ${segment.pacingStyle.replaceAll('_', ' ')} pacing.`,
        `Cut intensity: ${segment.cutIntensity.replaceAll('_', ' ')}.`,
      ],
    }))
  }

  let cursor = 0

  return segmentSeeds(input).map((seed, index) => {
    const range = createFrameTimeRange(cursor, cursor + seed.duration, fps)
    cursor += seed.duration

    return {
      id: `timing-segment-${index + 1}`,
      label: seed.label,
      role: seed.role,
      spokenTextSummary: seed.summary,
      range,
      sourceClipIds: input.clips[index] ? [input.clips[index].id] : [],
      visualAssetPlanItemIds: [] as string[],
      pacingNotes: ['Mock fallback segment timing because no segment edit plan was provided.'],
    }
  })
}

function createSourceTimingItems(input: PlannerInput, fps: number) {
  return input.clips.map((clip) => {
    const trimDecision = input.sourceCleanupPlan?.decisions.find((decision) => decision.clipId === clip.id)
    const blockingMeaningCheck = trimDecision
      ? input.trimReviewPlan?.meaningPreservationValidationPlan.checks.find((check) =>
          check.relatedTrimDecisionItemIds.includes(trimDecision.id) && (check.status === 'blocking' || check.userReviewRequired),
        )
      : undefined
    const sourceDuration = parseDurationSeconds(clip.duration)
    const selectedDuration = blockingMeaningCheck
      ? sourceDuration
      : trimDecision?.decision === 'cut'
      ? 0
      : trimDecision?.decision === 'tighten'
        ? Math.max(2, Math.min(sourceDuration, sourceDuration * 0.75))
        : trimDecision?.decision === 'move_to_broll'
          ? Math.max(2, Math.min(sourceDuration, 4))
          : clip.isOptional
      ? Math.max(2, Math.min(sourceDuration, 4))
      : clip.isImportant
        ? sourceDuration
        : Math.max(3, Math.min(sourceDuration, 8))

    return {
      id: `source-timing-${clip.id}`,
      clipId: clip.id,
      uploadedOrder: clip.uploadedOrder,
      sourceRange: createFrameTimeRange(0, sourceDuration, fps),
      selectedRange: createFrameTimeRange(0, selectedDuration, fps),
      trimDecisionItemId: trimDecision?.id,
      role: clip.sourceRole ?? 'unknown',
      reason: trimDecision
        ? `Source cleanup decision ${trimDecision.decision.replaceAll('_', ' ')}: ${trimDecision.reason}`
        : clip.isImportant
        ? 'Important clip keeps more selected duration.'
        : clip.isOptional
          ? 'Optional clip receives a shorter selected range unless it improves story timing.'
          : 'Selected range preserves source order while trimming weak pauses in mock planning.',
      trimNotes: [
        'Mock trim only; no media has been inspected.',
        'Source order remains context until the user approves the plan.',
        ...(trimDecision ? [`Linked source cleanup decision: ${trimDecision.id}.`] : []),
        ...(blockingMeaningCheck
          ? [`TrimReviewPlan check ${blockingMeaningCheck.id} prevents finalizing this cut until user review.`]
          : []),
        ...(input.sourceCleanupPlan && input.sourceCleanupPlan.status !== 'confirmed'
          ? ['Cleanup preference is not confirmed; source trim timing remains draft for approval.']
          : []),
      ],
      qaChecks: [
        'Selected range has non-negative frames.',
        'Trim reason is documented.',
        ...(blockingMeaningCheck ? ['Blocking/user-review meaning preservation check keeps the source range conservative.'] : []),
        ...(trimDecision ? trimDecision.qaChecks.slice(0, 2) : []),
      ],
    }
  })
}

function lineTypeForRole(role?: EditSegmentRole): TranscriptTimingLine['lineType'] {
  if (role === 'hook') return 'hook'
  if (role === 'proof' || role === 'evidence_card') return 'proof'
  if (role === 'emotional_beat' || role === 'reveal') return 'emotion'
  if (role === 'call_to_action' || role === 'ending') return 'cta'
  if (role === 'explanation' || role === 'visual_explainer' || role === 'recap') return 'explanation'
  return 'unknown'
}

function createTranscriptTimingPlan(params: {
  segmentRanges: ReturnType<typeof finalRangesFromSegments>
  fps: number
}): TranscriptTimingPlan {
  const lines = params.segmentRanges.map<TranscriptTimingLine>((segment) => {
    const text = segment.spokenTextSummary || `${segment.label} speech line`

    return {
      id: `transcript-line-${segment.id}`,
      text,
      timeRange: segment.range,
      lineType: lineTypeForRole(segment.role),
      emphasisWords: text.split(/\s+/).filter((word) => word.length > 5).slice(0, 2),
      captionCueIds: [`caption-cue-${segment.id}`],
      visualCueIds: segment.visualAssetPlanItemIds.map((assetId) => `visual-cue-${assetId}`),
      qaChecks: [
        'Mock transcript line has frame timing.',
        'Real transcript alignment is still a future worker step.',
      ],
    }
  })

  return {
    id: 'master-transcript-timing-plan',
    status: 'needs_transcript_alignment',
    lines,
    phraseBoundaryCueIds: lines.map((line) => `speech-cue-${line.id}`),
    emotionalPauseCueIds: lines.filter((line) => line.lineType === 'emotion').map((line) => `pause-cue-${line.id}`),
    limitations: ['No real transcript alignment has run; these lines are deterministic mock timing from the edit plan.'],
    qaChecks: ['Speech timing must be verified by future transcript alignment before production execution.'],
  }
}

function bpmForInput(input: PlannerInput) {
  if (input.editingCategory === 'documentary_case_study') return 84
  if (input.editingCategory === 'lifestyle') return 96
  if (input.editLevel === 'premium') return 112
  if (input.workflowType === 'social_short_viral_clip' || input.customInstructions.toLowerCase().includes('high retention')) return 132
  return 108
}

function createBeatGridPlan(params: {
  audioPipelinePlan?: AudioPipelinePlan
  finalDurationSeconds: number
  fps: number
  input: PlannerInput
}): BeatGridPlan {
  const beatStrategy = params.audioPipelinePlan?.beatSyncPlan.strategy ?? 'none'
  const needsBeatGrid = beatStrategy !== 'none'
  const bpm = needsBeatGrid ? bpmForInput(params.input) : undefined
  const beatItems: BeatGridItem[] = []

  if (bpm) {
    const beatStep = 60 / bpm
    const maxBeats = Math.min(48, Math.floor(params.finalDurationSeconds / beatStep))

    for (let index = 0; index < maxBeats; index += 1) {
      const timeSeconds = index * beatStep
      beatItems.push({
        id: `beat-${index + 1}`,
        beatIndex: index + 1,
        timeSeconds,
        frame: secondsToFrames(timeSeconds, params.fps),
        isDownbeat: index % 4 === 0,
        confidence: 'low',
        energy: index % 8 === 0 ? 'high' : 'medium',
        notes: ['Mock beat only; no AudioFlux analysis has run.'],
      })
    }
  }

  return {
    id: 'master-beat-grid-plan',
    status: needsBeatGrid ? 'needs_audio_analysis' : 'draft',
    bpm,
    beatItems,
    dropCueIds: beatItems.filter((beat) => beat.beatIndex % 16 === 1).map((beat) => beat.id),
    onsetCueIds: beatItems.filter((beat) => beat.beatIndex % 4 === 1).map((beat) => beat.id),
    confidence: needsBeatGrid ? 'low' : 'medium',
    limitations: needsBeatGrid
      ? ['Mock beat grid only; no AudioFlux beat detection has run.']
      : ['Voice-led timing: no beat grid is needed in the current mock plan.'],
    qaChecks: needsBeatGrid
      ? ['Beat alignment must not override speech clarity.', 'Future AudioFlux analysis must verify beat grid before production execution.']
      : ['Voice-led timing protects speech clarity.'],
  }
}

function createFinalTimeline(params: {
  segmentRanges: ReturnType<typeof finalRangesFromSegments>
  sourceTimingItems: ReturnType<typeof createSourceTimingItems>
}): FinalTimelineSegmentTiming[] {
  return params.segmentRanges.map((segment, index) => {
    const sourceTimingItemIds = segment.sourceClipIds.map((clipId) => `source-timing-${clipId}`)
    const timingCue = createTimingCue({
      id: `final-segment-cue-${segment.id}`,
      cueType: 'final_segment',
      label: segment.label,
      timeRange: segment.range,
      priority: segment.role === 'emotional_beat' ? 'story_meaning' : 'speech_clarity',
      snapMode: 'speech_boundary',
      linkedSegmentId: segment.id,
      linkedClipId: segment.sourceClipIds[0],
      reason: `${segment.label} is timed as final timeline segment ${index + 1}.`,
      qaChecks: ['Final segment has frame range.', 'Timing avoids negative duration.'],
      notes: segment.pacingNotes,
    })

    return {
      id: `final-timing-${segment.id}`,
      segmentId: segment.id,
      label: segment.label,
      role: segment.role,
      finalRange: segment.range,
      sourceTimingItemIds,
      timingCues: [timingCue],
      pacingNotes: segment.pacingNotes,
      qaChecks: ['Segment frame range is planned.', 'Speech clarity outranks beat cuts.'],
    }
  })
}

function createCaptionTimingItems(params: {
  transcriptTimingPlan: TranscriptTimingPlan
  fps: number
  input: PlannerInput
}): CaptionTimingItem[] {
  return params.transcriptTimingPlan.lines.map((line) => {
    const minimumReadFrames = getMinimumReadFrames(line.text, params.fps)
    const range = line.timeRange.durationFrames >= minimumReadFrames
      ? line.timeRange
      : createFrameTimeRangeFromFrames(line.timeRange.startFrame, line.timeRange.startFrame + minimumReadFrames, params.fps)

    return {
      id: `caption-timing-${line.id}`,
      captionText: line.text,
      timeRange: range,
      linkedTranscriptLineId: line.id,
      animationInFrames: params.input.editLevel === 'basic' ? 4 : 6,
      holdFrames: Math.max(0, range.durationFrames - (params.input.editLevel === 'basic' ? 8 : 12)),
      animationOutFrames: params.input.editLevel === 'basic' ? 4 : 6,
      emphasisWord: params.input.editLevel === 'basic' ? undefined : line.emphasisWords[0],
      readabilityScore: range.durationFrames >= minimumReadFrames ? 'high' : 'medium',
      qaChecks: ['Caption has frame range.', 'Caption duration is checked for readable hold time.'],
    }
  })
}

function segmentForAsset(segmentRanges: ReturnType<typeof finalRangesFromSegments>, asset: VisualAssetPlanItem, index: number) {
  return segmentRanges.find((segment) => segment.visualAssetPlanItemIds.includes(asset.id)) ?? segmentRanges[index % Math.max(1, segmentRanges.length)]
}

function createVisualTimingItems(params: {
  visualAssetPlan: VisualAssetPlanItem[]
  segmentRanges: ReturnType<typeof finalRangesFromSegments>
  fps: number
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}): VisualTimingItem[] {
  return params.visualAssetPlan.map((asset, index) => {
    const segment = segmentForAsset(params.segmentRanges, asset, index)
    const revealFrames = asset.assetType === 'fact_card' || asset.assetType === 'timeline_card' ? 10 : 8
    const exitFrames = asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene' ? 8 : 6
    const preferredFrames = Math.max(secondsToFrames(asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds || 2, params.fps), 45)
    const availableStart = segment.range.startFrame + Math.min(12, Math.max(0, segment.range.durationFrames - 30))
    const availableEnd = Math.min(segment.range.endFrame, availableStart + Math.min(preferredFrames, Math.max(45, segment.range.durationFrames - 12)))
    const range = createFrameTimeRangeFromFrames(availableStart, availableEnd, params.fps)

    return {
      id: `visual-timing-${asset.id}`,
      label: asset.beatLabel,
      visualType: asset.assetType,
      timeRange: range,
      linkedSegmentId: segment.id,
      linkedVisualAssetPlanItemId: asset.id,
      linkedLayoutItemId: asset.speakerVisualLayoutItemId,
      revealFrames,
      holdFrames: Math.max(0, range.durationFrames - revealFrames - exitFrames),
      exitFrames,
      readTimeFrames: getMinimumReadFrames(asset.beatLabel, params.fps),
      reason: `${asset.beatLabel} appears when its segment meaning is active.`,
      qaChecks: [
        'Visual timing is linked to spoken meaning.',
        'Visual holds long enough for planned label/card readability.',
        params.mapAnimationPlan?.active ? 'Map timing must be verified against location wording.' : 'No active map timing dependency.',
        params.dataVizPlan?.active ? 'Chart timing must hold labels long enough.' : 'No active dataviz timing dependency.',
      ],
    }
  })
}

function createTransitionTimingItems(params: {
  finalTimelineSegments: FinalTimelineSegmentTiming[]
  beatGridPlan: BeatGridPlan
  fps: number
  input: PlannerInput
}): TransitionTimingItem[] {
  return params.finalTimelineSegments.slice(1).map((segment, index) => {
    const previous = params.finalTimelineSegments[index]
    const cutFrame = segment.finalRange.startFrame
    const range = createFrameTimeRangeFromFrames(Math.max(0, cutFrame - 3), cutFrame + 3, params.fps)
    const beatAligned = params.beatGridPlan.beatItems.some((beat) => Math.abs(beat.frame - cutFrame) <= 4)

    return {
      id: `transition-timing-${previous.id}-to-${segment.id}`,
      transitionType: params.input.editLevel === 'basic' ? 'hard_cut' : 'clean_cut_transitions',
      timeRange: range,
      fromSegmentId: previous.segmentId,
      toSegmentId: segment.segmentId,
      beatAligned,
      phraseBoundaryAligned: true,
      reason: beatAligned
        ? 'Transition is near a mock beat, but speech boundary still controls approval.'
        : 'Transition is phrase-boundary aligned and does not require beat sync.',
      qaChecks: ['Transition avoids cutting important words.', 'Transition frame range is non-negative.'],
    }
  })
}

function createSfxTimingItems(params: {
  audioPipelinePlan?: AudioPipelinePlan
  visualTimingItems: VisualTimingItem[]
  transitionTimingItems: TransitionTimingItem[]
  fps: number
  input: PlannerInput
}): SfxTimingItem[] {
  if (params.input.editLevel === 'basic' && params.audioPipelinePlan?.sfxPlan.policy === 'none') {
    return []
  }

  const visualSfx = params.visualTimingItems
    .filter((_item, index) => index < (params.input.editLevel === 'premium' ? 4 : 2))
    .map<SfxTimingItem>((item) => ({
      id: `sfx-timing-${item.id}`,
      cueType: item.visualType === 'fact_card' || item.visualType === 'timeline_card' ? 'card_reveal' : 'visual_reveal',
      label: `${item.label} cue`,
      timeRange: createFrameTimeRangeFromFrames(item.timeRange.startFrame, item.timeRange.startFrame + 6, params.fps),
      linkedVisualTimingItemId: item.id,
      intensity: params.input.editLevel === 'premium' ? 'balanced' : 'subtle',
      reason: 'SFX is tied to a justified visual reveal, not random decoration.',
      avoidRules: ['Do not cover speech.', 'Do not add random impact hits.'],
      qaChecks: ['SFX cue is justified.', 'Voice remains clear.'],
    }))

  const transitionSfx = params.transitionTimingItems
    .filter((_item, index) => params.input.editLevel !== 'basic' && index < 2)
    .map<SfxTimingItem>((item) => ({
      id: `sfx-timing-${item.id}`,
      cueType: 'transition',
      label: 'Transition support',
      timeRange: item.timeRange,
      linkedTransitionTimingItemId: item.id,
      intensity: 'subtle',
      reason: 'Subtle transition support only where the transition is planned.',
      avoidRules: ['Do not cover speech.', 'No random whooshes.'],
      qaChecks: ['Transition SFX is restrained.', 'SFX aligns with transition timing.'],
    }))

  return [...visualSfx, ...transitionSfx]
}

function createMusicDuckingTimingItems(params: {
  transcriptTimingPlan: TranscriptTimingPlan
  audioPipelinePlan?: AudioPipelinePlan
  fps: number
}): MusicDuckingTimingItem[] {
  if (!params.audioPipelinePlan?.musicBedPlan.duckingEnabled) {
    return []
  }

  return params.transcriptTimingPlan.lines.map((line) => ({
    id: `music-duck-${line.id}`,
    timeRange: line.timeRange,
    duckingStrength: params.audioPipelinePlan?.musicBedPlan.duckingStrength ?? 'light',
    linkedSpeechLineId: line.id,
    attackFrames: Math.round(params.fps * 0.2),
    releaseFrames: Math.round(params.fps * 0.35),
    reason: 'Music ducks under speech so voice clarity stays highest priority.',
    qaChecks: ['Music does not overpower voice.', 'Emotional pauses are preserved.'],
  }))
}

function createProviderClipTimingItems(params: {
  visualTimingItems: VisualTimingItem[]
  visualAssetPlan: VisualAssetPlanItem[]
  fps: number
}): ProviderClipTimingItem[] {
  return params.visualAssetPlan
    .filter((asset) => asset.providerRoute.durationSeconds > 0 || asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene')
    .map((asset) => {
      const visualTiming = params.visualTimingItems.find((item) => item.linkedVisualAssetPlanItemId === asset.id)
      const durationSeconds = asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds || visualTiming?.timeRange.durationSeconds || 2
      const durationFrames = secondsToFrames(durationSeconds, params.fps)
      const placementRange = visualTiming?.timeRange ?? createFrameTimeRange(0, durationSeconds, params.fps)

      return {
        id: `provider-clip-timing-${asset.id}`,
        providerModel: asset.providerRoute.primaryModel,
        visualAssetPlanItemId: asset.id,
        expectedDurationSeconds: durationSeconds,
        expectedDurationFrames: durationFrames,
        placementRange,
        startFramePurpose: 'Start frame establishes the assigned visual panel or story beat.',
        endFramePurpose: asset.needsEndFrame ? 'End frame preserves continuity for the next beat.' : 'End frame can resolve naturally inside Remotion placement.',
        reason: 'Provider clip is an asset placed by Remotion, not the final canvas.',
        qaChecks: ['Provider clip duration matches plan.', 'Basic/Pro no-Veo and Premium final-fallback-only rules still apply.'],
      }
    })
}

function createRemotionLayerTimingItems(params: {
  finalTimelineSegments: FinalTimelineSegmentTiming[]
  captionTimingItems: CaptionTimingItem[]
  visualTimingItems: VisualTimingItem[]
  transitionTimingItems: TransitionTimingItem[]
  fps: number
}): RemotionLayerTimingItem[] {
  const sourceLayers = params.finalTimelineSegments.map<RemotionLayerTimingItem>((segment, index) => ({
    id: `remotion-layer-source-${segment.id}`,
    label: `${segment.label} source layer`,
    layerType: 'source_video',
    timeRange: segment.finalRange,
    zIndex: 10 + index,
    reason: 'Source layer timing follows final timeline segment timing.',
    qaChecks: ['Source layer has start/end frames.', 'No black gap planned between segments.'],
  }))
  const captionLayerRange = params.captionTimingItems.length
    ? createFrameTimeRangeFromFrames(
        Math.min(...params.captionTimingItems.map((item) => item.timeRange.startFrame)),
        Math.max(...params.captionTimingItems.map((item) => item.timeRange.endFrame)),
        params.fps,
      )
    : createFrameTimeRangeFromFrames(0, 0, params.fps)

  return [
    ...sourceLayers,
    ...params.visualTimingItems.map<RemotionLayerTimingItem>((item, index) => ({
      id: `remotion-layer-${item.id}`,
      label: item.label,
      layerType: 'visual_panel',
      timeRange: item.timeRange,
      zIndex: 40 + index,
      linkedVisualTimingItemId: item.id,
      reason: 'Visual layer timing comes from MasterTimingPlan visual cue timing.',
      qaChecks: ['Visual layer respects safe zones.', 'Visual layer has frame timing.'],
    })),
    {
      id: 'remotion-layer-captions',
      label: 'Captions',
      layerType: 'captions',
      timeRange: captionLayerRange,
      zIndex: 90,
      reason: 'Captions stay above visuals and masks.',
      qaChecks: ['Captions above visual layers.', 'Caption timing derives from transcript mock timing.'],
    },
    ...params.transitionTimingItems.map<RemotionLayerTimingItem>((item, index) => ({
      id: `remotion-layer-${item.id}`,
      label: 'Transition',
      layerType: 'transition',
      timeRange: item.timeRange,
      zIndex: 80 + index,
      reason: item.reason,
      qaChecks: item.qaChecks,
    })),
  ]
}

function createTimingQaChecks(params: {
  status: TimingPlanStatus
  finalTimelineSegments: FinalTimelineSegmentTiming[]
  captionTimingItems: CaptionTimingItem[]
  visualTimingItems: VisualTimingItem[]
  transitionTimingItems: TransitionTimingItem[]
  sfxTimingItems: SfxTimingItem[]
  providerClipTimingItems: ProviderClipTimingItem[]
  remotionLayerTimingItems: RemotionLayerTimingItem[]
  aspectRatioConfirmed: boolean
}): TimingQaCheck[] {
  const check = (id: string, label: string, riskLevel: TimingRiskLevel, passedMock: boolean, message: string, linkedCueIds: string[] = [], recommendation?: string): TimingQaCheck => ({
    id,
    label,
    riskLevel,
    passedMock,
    message,
    recommendation,
    linkedCueIds,
  })

  return [
    check(
      'timing-qa-frame-confirmed',
      'Output frame confirmed for timing',
      params.aspectRatioConfirmed ? 'low' : 'blocking',
      params.aspectRatioConfirmed,
      params.aspectRatioConfirmed ? 'Timing base can be planned from the confirmed frame.' : 'Timing remains blocked until output frame is confirmed.',
      [],
      'Confirm output frame before approval.',
    ),
    check('timing-qa-final-segments', 'Final segments have frame ranges', 'high', params.finalTimelineSegments.every((segment) => segment.finalRange.durationFrames >= 0), 'Every final segment has non-negative frame timing.'),
    check('timing-qa-caption-readable', 'Caption readability timing', 'medium', params.captionTimingItems.every((item) => item.timeRange.durationFrames >= 30), 'Caption cues have readable mock duration.'),
    check('timing-qa-visual-read-time', 'Visual read time', 'medium', params.visualTimingItems.every((item) => item.timeRange.durationFrames >= item.revealFrames + item.exitFrames), 'Visual cues have reveal, hold, and exit timing.'),
    check('timing-qa-transitions', 'Transitions avoid negative ranges', 'medium', params.transitionTimingItems.every((item) => item.timeRange.durationFrames >= 0), 'Transition ranges are frame-safe.'),
    check('timing-qa-sfx-justified', 'SFX justified', 'medium', params.sfxTimingItems.every((item) => item.reason.toLowerCase().includes('justified') || item.reason.toLowerCase().includes('transition')), 'SFX cues are tied to visual or transition cues.'),
    check('timing-qa-provider-duration', 'Provider clip duration planned', 'high', params.providerClipTimingItems.every((item) => item.expectedDurationFrames >= 0), 'Provider clips have expected duration and placement.'),
    check('timing-qa-remotion-layers', 'Remotion layer timing planned', 'high', params.remotionLayerTimingItems.length > 0, 'Remotion layer sequence timing comes from MasterTimingPlan.'),
  ]
}

export function createMasterTimingPlan(params: CreateMasterTimingPlanParams): MasterTimingPlan {
  const aspectRatioFramePlan = params.aspectRatioFramePlan ?? params.input.aspectRatioFramePlan
  const aspectRatioConfirmed = aspectRatioFramePlan?.status === 'confirmed'
  const fps = getDefaultTimingFps({ aspectRatioFramePlan })
  const sourceTimingItems = createSourceTimingItems(params.input, fps)
  const segmentRanges = finalRangesFromSegments(params.input, params.segmentEditPlans, fps)
  const finalDurationSeconds = Math.max(
    3,
    segmentRanges.length ? Math.max(...segmentRanges.map((segment) => segment.range.endSeconds)) : 18,
  )
  const finalFrames = secondsToFrames(finalDurationSeconds, fps)
  const sourceDurationSeconds = sourceTimingItems.reduce((sum, item) => sum + item.sourceRange.durationSeconds, 0)
  const transcriptTimingPlan = createTranscriptTimingPlan({ fps, segmentRanges })
  const beatGridPlan = createBeatGridPlan({
    audioPipelinePlan: params.audioPipelinePlan,
    finalDurationSeconds,
    fps,
    input: params.input,
  })
  const finalTimelineSegments = createFinalTimeline({ segmentRanges, sourceTimingItems })
  const captionTimingItems = createCaptionTimingItems({ fps, input: params.input, transcriptTimingPlan })
  const visualTimingItems = createVisualTimingItems({
    dataVizPlan: params.dataVizPlan,
    fps,
    mapAnimationPlan: params.mapAnimationPlan,
    segmentRanges,
    visualAssetPlan: params.visualAssetPlan ?? [],
  })
  const transitionTimingItems = createTransitionTimingItems({
    beatGridPlan,
    finalTimelineSegments,
    fps,
    input: params.input,
  })
  const sfxTimingItems = createSfxTimingItems({
    audioPipelinePlan: params.audioPipelinePlan,
    fps,
    input: params.input,
    transitionTimingItems,
    visualTimingItems,
  })
  const musicDuckingTimingItems = createMusicDuckingTimingItems({
    audioPipelinePlan: params.audioPipelinePlan,
    fps,
    transcriptTimingPlan,
  })
  const providerClipTimingItems = createProviderClipTimingItems({
    fps,
    visualAssetPlan: params.visualAssetPlan ?? [],
    visualTimingItems,
  })
  const remotionLayerTimingItems = createRemotionLayerTimingItems({
    captionTimingItems,
    finalTimelineSegments,
    fps,
    transitionTimingItems,
    visualTimingItems,
  })
  const trimReviewBlocked = Boolean(params.input.trimReviewPlan?.approvalBlocked)
  const status: TimingPlanStatus = !aspectRatioConfirmed ? 'needs_frame_confirmation' : trimReviewBlocked ? 'blocked' : 'ready'
  const preset = getDefaultTimingPresetForCategory({
    editLevel: params.input.editLevel,
    editingCategory: params.input.editingCategory,
    highRetention: params.input.customInstructions.toLowerCase().includes('high retention'),
  })
  const qaChecks = createTimingQaChecks({
    aspectRatioConfirmed,
    captionTimingItems,
    finalTimelineSegments,
    providerClipTimingItems,
    remotionLayerTimingItems,
    sfxTimingItems,
    status,
    transitionTimingItems,
    visualTimingItems,
  })
  const allCues: TimingCue[] = [
    ...finalTimelineSegments.flatMap((segment) => segment.timingCues),
    ...captionTimingItems.map((item) => createTimingCue({
      id: `caption-cue-${item.id}`,
      cueType: 'caption_chunk',
      label: item.captionText,
      timeRange: item.timeRange,
      priority: 'speech_clarity',
      snapMode: 'speech_boundary',
      linkedTranscriptLineId: item.linkedTranscriptLineId,
      reason: 'Caption cue follows mock transcript line timing.',
      qaChecks: item.qaChecks,
    })),
    ...visualTimingItems.map((item) => createTimingCue({
      id: `visual-cue-${item.linkedVisualAssetPlanItemId ?? item.id}`,
      cueType: 'visual_reveal',
      label: item.label,
      timeRange: item.timeRange,
      priority: 'visual_readability',
      snapMode: 'visual_cue',
      linkedSegmentId: item.linkedSegmentId,
      linkedVisualAssetPlanItemId: item.linkedVisualAssetPlanItemId,
      reason: item.reason,
      qaChecks: item.qaChecks,
    })),
  ]

  return {
    id: `master-timing-${params.input.editingCategory}-${params.input.editLevel}`,
    status,
    summary: !aspectRatioConfirmed
      ? 'Timing is draft until the output frame is confirmed; approval remains blocked.'
      : trimReviewBlocked
        ? 'Timing is blocked until TrimReviewPlan resolves retake/meaning preservation review.'
        : `Frame-accurate mock timing is planned at ${fps}fps with ${finalFrames} final frames.`,
    sourceCleanupPlanId: params.input.sourceCleanupPlan?.id,
    timingBase: {
      fps,
      totalDurationSeconds: finalDurationSeconds,
      totalFrames: finalFrames,
      sourceDurationSeconds,
      finalDurationSeconds,
      frameRoundingMode: 'round',
      derivedFromAspectRatioFramePlan: Boolean(aspectRatioFramePlan),
      aspectRatioConfirmed,
      notes: [
        aspectRatioConfirmed
          ? 'Timing base is derived from the confirmed output frame and mock planning defaults.'
          : 'Output frame is not confirmed; 30fps is a mock planning default only.',
        `Timing preset: ${preset.label}.`,
      ],
    },
    sourceTimingItems,
    finalTimelineSegments: finalTimelineSegments.map((segment) => ({
      ...segment,
      timingCues: [
        ...segment.timingCues,
        ...allCues.filter((cue) => cue.linkedSegmentId === segment.segmentId && cue.cueType !== 'final_segment'),
      ],
    })),
    transcriptTimingPlan,
    beatGridPlan,
    captionTimingItems,
    visualTimingItems,
    transitionTimingItems,
    sfxTimingItems,
    musicDuckingTimingItems,
    remotionLayerTimingItems,
    providerClipTimingItems,
    globalRules: [
      'Frames are the execution unit; seconds are display values.',
      'Speech clarity outranks beat alignment.',
      'Visuals are timed to meaning, not random moments.',
      'SFX must be justified and must not cover speech.',
      'Music ducking protects voice clarity.',
      'Provider clips are assets placed by Remotion, not final canvases.',
      'No real transcript alignment, beat detection, audio analysis, rendering, provider call, or worker execution has run.',
    ],
    qaChecks,
    limitations: [
      'No real transcript alignment has run.',
      'No real beat detection or AudioFlux analysis has run.',
      'No FFmpeg, Signalsmith Stretch, Remotion rendering, provider call, backend worker, or media processing has run.',
      status === 'needs_frame_confirmation'
        ? 'Timing cannot be approved until the output frame is confirmed.'
        : 'Timing is ready as mock planning metadata, but production timing still needs future media/transcript/audio workers.',
      ...(params.input.sourceCleanupPlan?.status !== 'confirmed'
        ? ['Source cleanup preference is not confirmed; final trim timing remains approval-blocked by downstream validation.']
        : []),
      ...(trimReviewBlocked
        ? ['TrimReviewPlan is blocking; final trim timing must stay draft until review is resolved.']
        : []),
    ],
    notes: [
      `Preset pacing notes: ${preset.pacingNotes.join(' ')}`,
      params.professionalDirective ? `Professional directive pacing: ${params.professionalDirective.pacingStyle.replaceAll('_', ' ')}.` : 'Professional directive unavailable.',
      params.compiledIntent ? `Compiled goal: ${params.compiledIntent.goalSummary}` : 'Compiled intent not supplied.',
      params.videoUnderstandingReport ? 'Video understanding informs mock transcript and visual timing.' : 'No video understanding report supplied.',
      params.adaptiveEditStrategyPlan ? 'Adaptive segment strategy informs visual and segment timing.' : 'No adaptive strategy supplied.',
      params.input.sourceCleanupPlan
        ? `Source cleanup plan ${params.input.sourceCleanupPlan.id} informs source timing and trim decision links.`
        : 'No source cleanup plan supplied.',
      params.input.trimReviewPlan
        ? `Trim review plan ${params.input.trimReviewPlan.id} informs retake and meaning-preservation timing safety.`
        : 'No trim review plan supplied.',
    ],
  }
}
