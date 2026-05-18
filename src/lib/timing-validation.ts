import type {
  AspectRatioFramePlan,
  AudioPipelinePlan,
  CaptionVisualCueTimingPlan,
  FrameTimeRange,
  MasterTimingPlan,
  PlannerInput,
  ProviderPromptPlan,
  RendererCompositionPlan,
  SegmentEditPlan,
  SourceCleanupPlan,
  SoundSyncTransitionTimingPlan,
  TimingComplexityLevel,
  TimingCreditProfile,
  TimingValidationCategory,
  TimingValidationCheck,
  TimingValidationPlan,
  TimingValidationPlanItem,
  TimingValidationStatus,
  TrimReviewPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { createTimingLowerCostRecommendations, getTimingCreditProfile, inferTimingComplexity } from './timing-credit-policy'

type WorkerRuntimePlanLike = {
  status?: string
  runnable?: boolean
  executionReady?: boolean
}

type CreateTimingValidationPlanParams = {
  input: PlannerInput
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  soundSyncTransitionTimingPlan?: SoundSyncTransitionTimingPlan
  audioPipelinePlan?: AudioPipelinePlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  rendererCompositionPlan?: RendererCompositionPlan
  providerPromptPlans?: ProviderPromptPlan[]
  workerRuntimePlan?: WorkerRuntimePlanLike
  sourceCleanupPlan?: SourceCleanupPlan
  trimReviewPlan?: TrimReviewPlan
}

function statusSeverity(status: TimingValidationStatus): TimingValidationCheck['severity'] {
  if (status === 'blocking') return 'blocking'
  if (status === 'failed') return 'error'
  if (status === 'warning') return 'warning'
  return 'info'
}

function check(params: {
  id: string
  category: TimingValidationCategory
  label: string
  passed: boolean
  message: string
  recommendation?: string
  failedStatus?: TimingValidationStatus
  relatedCueIds?: string[]
  relatedSegmentId?: string
  relatedVisualAssetPlanItemId?: string
  relatedCaptionTimingItemId?: string
  relatedTransitionTimingItemId?: string
  relatedSfxTimingItemId?: string
  relatedProviderClipTimingItemId?: string
}): TimingValidationCheck {
  const status = params.passed ? 'passed' : params.failedStatus ?? 'warning'

  return {
    id: params.id,
    category: params.category,
    label: params.label,
    status,
    severity: statusSeverity(status),
    message: params.message,
    recommendation: params.recommendation,
    relatedCueIds: params.relatedCueIds ?? [],
    relatedSegmentId: params.relatedSegmentId,
    relatedVisualAssetPlanItemId: params.relatedVisualAssetPlanItemId,
    relatedCaptionTimingItemId: params.relatedCaptionTimingItemId,
    relatedTransitionTimingItemId: params.relatedTransitionTimingItemId,
    relatedSfxTimingItemId: params.relatedSfxTimingItemId,
    relatedProviderClipTimingItemId: params.relatedProviderClipTimingItemId,
  }
}

function worstStatus(checks: TimingValidationCheck[]): TimingValidationStatus {
  if (checks.some((item) => item.status === 'blocking')) return 'blocking'
  if (checks.some((item) => item.status === 'failed')) return 'failed'
  if (checks.some((item) => item.status === 'warning')) return 'warning'
  return 'passed'
}

function frameRangeIsValid(range: FrameTimeRange | undefined, totalFrames: number | undefined) {
  if (!range) return false

  return Number.isFinite(range.fps) &&
    range.fps > 0 &&
    range.startSeconds >= 0 &&
    range.endSeconds >= range.startSeconds &&
    range.startFrame >= 0 &&
    range.endFrame >= range.startFrame &&
    range.durationFrames >= 0 &&
    (typeof totalFrames !== 'number' || totalFrames <= 0 || range.endFrame <= totalFrames)
}

function frameRangeChecks(params: CreateTimingValidationPlanParams, totalFrames: number | undefined): TimingValidationCheck[] {
  const checks: TimingValidationCheck[] = []

  params.masterTimingPlan?.finalTimelineSegments.forEach((segment) => {
    checks.push(check({
      id: `timing-validation-final-range-${segment.id}`,
      category: 'final_timeline',
      label: `Final timing range: ${segment.label}`,
      passed: frameRangeIsValid(segment.finalRange, totalFrames),
      failedStatus: 'blocking',
      message: 'Final timeline segments must have non-negative frame ranges inside the timing base.',
      recommendation: 'Rebuild Master Timing from the confirmed timing base before approval.',
      relatedCueIds: segment.timingCues.map((cue) => cue.id),
      relatedSegmentId: segment.segmentId ?? segment.id,
    }))
  })

  params.captionVisualCueTimingPlan?.refinedCaptionTimings.forEach((caption) => {
    checks.push(check({
      id: `timing-validation-caption-range-${caption.id}`,
      category: 'caption_readability',
      label: `Caption timing range: ${caption.captionText.slice(0, 36)}`,
      passed: frameRangeIsValid(caption.timeRange, totalFrames),
      failedStatus: 'blocking',
      message: 'Refined captions must have non-negative frame ranges.',
      recommendation: 'Regenerate caption timing from phrase timing before approval.',
      relatedCaptionTimingItemId: caption.id,
    }))
  })

  params.captionVisualCueTimingPlan?.visualCueTimings.forEach((visualCue) => {
    checks.push(check({
      id: `timing-validation-visual-cue-range-${visualCue.id}`,
      category: 'visual_readability',
      label: `Visual cue timing range: ${visualCue.label}`,
      passed: frameRangeIsValid(visualCue.timeRange, totalFrames),
      failedStatus: 'blocking',
      message: 'Visual cues must have non-negative frame ranges.',
      recommendation: 'Re-time the visual cue from a valid transcript/meaning fallback range.',
      relatedCueIds: [visualCue.id],
      relatedSegmentId: visualCue.linkedSegmentId,
      relatedVisualAssetPlanItemId: visualCue.linkedVisualAssetPlanItemId,
    }))
  })

  params.soundSyncTransitionTimingPlan?.refinedTransitionTimings.forEach((transition) => {
    checks.push(check({
      id: `timing-validation-transition-range-${transition.id}`,
      category: 'transition_safety',
      label: `Transition timing range: ${transition.transitionType.replaceAll('_', ' ')}`,
      passed: frameRangeIsValid(transition.timeRange, totalFrames) &&
        transition.durationFrames >= 0 &&
        (transition.transitionType === 'hard_cut' || transition.durationFrames > 0),
      failedStatus: 'blocking',
      message: 'Hard cuts may be 0 frames; other transitions need positive duration and valid frame ranges.',
      recommendation: 'Use a hard cut fallback or re-time the transition to a phrase boundary.',
      relatedTransitionTimingItemId: transition.id,
      relatedSegmentId: transition.toSegmentId,
    }))
  })

  params.soundSyncTransitionTimingPlan?.refinedSfxTimings.forEach((sfx) => {
    checks.push(check({
      id: `timing-validation-sfx-range-${sfx.id}`,
      category: 'sfx_justification',
      label: `SFX timing range: ${sfx.label}`,
      passed: frameRangeIsValid(sfx.timeRange, totalFrames),
      failedStatus: 'blocking',
      message: 'SFX cues must have non-negative frame timing.',
      recommendation: 'Remove or re-time the SFX cue against a planned visual/transition cue.',
      relatedSfxTimingItemId: sfx.id,
    }))
  })

  params.soundSyncTransitionTimingPlan?.refinedMusicDuckingTimings.forEach((ducking) => {
    checks.push(check({
      id: `timing-validation-ducking-range-${ducking.id}`,
      category: 'music_ducking',
      label: `Music ducking range: ${ducking.reasonType.replaceAll('_', ' ')}`,
      passed: frameRangeIsValid(ducking.timeRange, totalFrames),
      failedStatus: 'blocking',
      message: 'Music ducking ranges must have non-negative frame timing.',
      recommendation: 'Recreate ducking from speech line timing and voice-priority rules.',
      relatedCueIds: [ducking.id],
    }))
  })

  params.masterTimingPlan?.providerClipTimingItems.forEach((providerClip) => {
    checks.push(check({
      id: `timing-validation-provider-clip-range-${providerClip.id}`,
      category: 'provider_clip_duration',
      label: `Provider clip timing: ${providerClip.providerModel?.replaceAll('_', ' ') ?? 'asset'}`,
      passed: providerClip.expectedDurationSeconds > 0 &&
        providerClip.expectedDurationFrames > 0 &&
        frameRangeIsValid(providerClip.placementRange, totalFrames),
      failedStatus: 'failed',
      message: 'AI video/provider clips need expected duration and placement frames before prompts can be executable.',
      recommendation: 'Use the Master Timing provider clip item or convert the beat to a still/card alternative.',
      relatedProviderClipTimingItemId: providerClip.id,
      relatedVisualAssetPlanItemId: providerClip.visualAssetPlanItemId,
    }))
  })

  params.masterTimingPlan?.remotionLayerTimingItems.forEach((layer) => {
    checks.push(check({
      id: `timing-validation-remotion-layer-range-${layer.id}`,
      category: 'remotion_layer_timing',
      label: `Remotion layer timing: ${layer.label}`,
      passed: frameRangeIsValid(layer.timeRange, totalFrames),
      failedStatus: 'failed',
      message: 'Remotion layer timing should stay inside the timing base and avoid negative ranges.',
      recommendation: 'Rebuild layer timing from Master/Caption/SoundSync timing plans.',
      relatedCueIds: [layer.id],
    }))
  })

  return checks
}

function captionReadabilityChecks(params: CreateTimingValidationPlanParams): TimingValidationCheck[] {
  const plan = params.captionVisualCueTimingPlan

  if (!plan) return []

  const minDuration = Math.max(12, Math.min(plan.captionPolicy.minDurationFrames, 45))

  return [
    check({
      id: 'timing-validation-caption-readable-duration',
      category: 'caption_readability',
      label: 'Caption durations are readable',
      passed: plan.refinedCaptionTimings.every((caption) =>
        caption.timeRange.durationFrames >= minDuration && caption.readabilityRisk !== 'blocking',
      ),
      failedStatus: plan.refinedCaptionTimings.some((caption) => caption.readabilityRisk === 'blocking') ? 'failed' : 'warning',
      message: 'Captions should remain on screen long enough and should not have blocking readability risk.',
      recommendation: 'Use fewer words per chunk, simpler animation, or longer caption holds.',
      relatedCueIds: plan.refinedCaptionTimings.map((caption) => caption.id),
    }),
    check({
      id: 'timing-validation-caption-word-density',
      category: 'caption_readability',
      label: 'Caption word density fits policy',
      passed: plan.refinedCaptionTimings.every((caption) =>
        caption.captionText.split(/\s+/).filter(Boolean).length <= plan.captionPolicy.maxWordsPerCaption + 2,
      ),
      failedStatus: 'warning',
      message: 'Caption chunks should stay close to the selected policy word count.',
      recommendation: 'Split dense captions into phrase-based chunks.',
      relatedCueIds: plan.refinedCaptionTimings.map((caption) => caption.id),
    }),
    check({
      id: 'timing-validation-caption-basic-restraint',
      category: 'tier_complexity',
      label: 'Basic avoids aggressive captions',
      passed: params.input.editLevel !== 'basic' || !['kinetic_word_pop', 'typewriter'].includes(plan.captionPolicy.animationStyle),
      failedStatus: 'failed',
      message: 'Basic timing should stay professional and restrained, not kinetic by default.',
      recommendation: 'Switch to fade, soft pop, phrase-based captions, or subtitle block timing.',
      relatedCueIds: plan.refinedCaptionTimings.map((caption) => caption.id),
    }),
  ]
}

function visualReadabilityChecks(params: CreateTimingValidationPlanParams): TimingValidationCheck[] {
  const plan = params.captionVisualCueTimingPlan

  if (!plan) return []

  const denseVisuals = plan.visualCueTimings.filter((cue) =>
    /map|chart|browser|evidence|source|card/i.test(`${cue.cueType} ${cue.label}`),
  )

  return [
    check({
      id: 'timing-validation-visual-read-time',
      category: 'visual_readability',
      label: 'Visual cues hold long enough',
      passed: plan.visualCueTimings.every((cue) => cue.visualReadTimeFrames > 0 && cue.holdFrames >= Math.min(cue.visualReadTimeFrames, cue.timeRange.fps * 2)),
      failedStatus: 'warning',
      message: 'Visual cues should hold long enough for the viewer to understand the concept.',
      recommendation: 'Extend hold frames, reduce label density, or use a simpler still/card reveal.',
      relatedCueIds: plan.visualCueTimings.map((cue) => cue.id),
    }),
    check({
      id: 'timing-validation-dense-visual-read-time',
      category: 'visual_readability',
      label: 'Map/chart/browser/evidence visuals get extra read time',
      passed: denseVisuals.every((cue) => cue.visualReadTimeFrames >= cue.timeRange.fps),
      failedStatus: 'warning',
      message: 'Text-heavy visuals need longer read time than a quick decorative reveal.',
      recommendation: 'Use longer holds, fewer labels, or full takeover layout for dense information.',
      relatedCueIds: denseVisuals.map((cue) => cue.id),
    }),
    check({
      id: 'timing-validation-caption-visual-collisions',
      category: 'caption_visual_collision',
      label: 'Collision plans include recommendations',
      passed: plan.collisionPlans.every((collision) =>
        collision.risk !== 'blocking' &&
        collision.recommendation.trim().length > 0,
      ),
      failedStatus: plan.collisionPlans.some((collision) => collision.risk === 'blocking') ? 'failed' : 'warning',
      message: 'Caption/visual collision risks should have recommendations before approval.',
      recommendation: 'Move captions, simplify labels, extend hold time, or choose a safer layout.',
      relatedCueIds: [
        ...plan.collisionPlans.flatMap((collision) => collision.affectedCaptionTimingItemIds),
        ...plan.collisionPlans.flatMap((collision) => collision.affectedVisualCueTimingItemIds),
      ],
    }),
  ]
}

function soundSyncChecks(params: CreateTimingValidationPlanParams): TimingValidationCheck[] {
  const plan = params.soundSyncTransitionTimingPlan

  if (!plan) return []

  const musicExists = Boolean(params.audioPipelinePlan && params.audioPipelinePlan.musicBedPlan.policy !== 'none' && params.audioPipelinePlan.musicBedPlan.duckingStrength !== 'none')
  const speechExists = (params.masterTimingPlan?.transcriptTimingPlan.lines.length ?? 0) > 0
  const documentary = params.input.editingCategory === 'documentary_case_study'

  return [
    check({
      id: 'timing-validation-transition-speech-safe',
      category: 'transition_safety',
      label: 'Transitions are speech-safe',
      passed: plan.refinedTransitionTimings.every((transition) =>
        transition.transitionType === 'hard_cut' ||
        transition.phraseBoundaryAligned ||
        transition.beatSnapDecision?.speechSafe ||
        Boolean(transition.fallbackTransitionType),
      ),
      failedStatus: 'failed',
      message: 'Beat or motion transitions must not cut important speech without a fallback.',
      recommendation: 'Snap to a phrase boundary, use a hard cut, or delay the transition after the phrase.',
      relatedCueIds: plan.refinedTransitionTimings.map((transition) => transition.id),
    }),
    check({
      id: 'timing-validation-beat-alignment-speech-first',
      category: 'beat_alignment',
      label: 'Beat sync stays speech-first',
      passed: plan.beatSnapDecisions.every((decision) => decision.speechSafe || decision.snapDecision === 'snap_to_phrase_boundary' || decision.snapDecision === 'do_not_snap'),
      failedStatus: 'failed',
      message: 'Beat snap decisions must not override speech clarity.',
      recommendation: 'Use phrase-boundary snapping or disable beat sync for that cue.',
      relatedCueIds: plan.beatSnapDecisions.map((decision) => decision.id),
    }),
    check({
      id: 'timing-validation-sfx-justified',
      category: 'sfx_justification',
      label: 'SFX are cue-linked and justified',
      passed: plan.refinedSfxTimings.every((sfx) =>
        Boolean(sfx.linkedVisualCueTimingItemId || sfx.linkedTransitionTimingItemId) &&
        sfx.reason.trim().length > 0 &&
        sfx.avoidRules.length > 0,
      ),
      failedStatus: 'failed',
      message: 'SFX must have a planned visual/transition cue, exact timing, reason, intensity, and avoid rules.',
      recommendation: 'Remove random SFX or link the cue to a planned reveal/transition.',
      relatedCueIds: plan.refinedSfxTimings.map((sfx) => sfx.id),
    }),
    check({
      id: 'timing-validation-ducking-voice-priority',
      category: 'music_ducking',
      label: 'Music ducking protects voice',
      passed: !musicExists || !speechExists || plan.refinedMusicDuckingTimings.some((ducking) => ducking.voicePriority),
      failedStatus: 'failed',
      message: 'Music under speech needs voice-priority ducking before approval.',
      recommendation: 'Create ducking ranges from speech/caption timing or switch to voice-only timing.',
      relatedCueIds: plan.refinedMusicDuckingTimings.map((ducking) => ducking.id),
    }),
    check({
      id: 'timing-validation-documentary-restraint',
      category: 'tier_complexity',
      label: 'Documentary timing remains restrained',
      passed: !documentary || !['high', 'premium_refined'].includes(plan.sfxDensityLevel),
      failedStatus: 'warning',
      message: 'Documentary/case-study edits should avoid sensational SFX/transition density unless requested.',
      recommendation: 'Reduce SFX density and use documentary cuts or restrained crossfades.',
      relatedCueIds: plan.refinedSfxTimings.map((sfx) => sfx.id),
    }),
    check({
      id: 'timing-validation-audioflux-mock-only',
      category: 'beat_alignment',
      label: 'AudioFlux is planned, not executed',
      passed: plan.beatGridPlan.status === 'not_needed' ||
        (plan.beatGridPlan.analysisToolPlanned.includes('audioflux') &&
          plan.beatGridPlan.limitations.some((limitation) => /no real|mock|audioflux/i.test(limitation))),
      failedStatus: 'blocking',
      message: 'Beat grid planning must represent AudioFlux as a future analysis tool and must not imply real audio analysis.',
      recommendation: 'Keep the beat grid as mock/future worker metadata.',
      relatedCueIds: plan.beatGridPlan.beatItems.map((beat) => beat.id),
    }),
  ]
}

function providerRendererChecks(params: CreateTimingValidationPlanParams, timingBaseBlocked: boolean): TimingValidationCheck[] {
  const executablePrompts = params.providerPromptPlans?.filter((prompt) => prompt.tierAllowed) ?? []
  const rendererReady = params.rendererCompositionPlan?.renderReady ?? false
  const workerRunnable = Boolean(params.workerRuntimePlan?.runnable || params.workerRuntimePlan?.executionReady || params.workerRuntimePlan?.status === 'runnable')

  return [
    check({
      id: 'timing-validation-provider-prompts-blocked-when-timing-blocked',
      category: 'approval_gate',
      label: 'Provider prompts do not execute with blocked timing',
      passed: !timingBaseBlocked || executablePrompts.length === 0,
      failedStatus: 'blocking',
      message: 'Provider prompts must remain draft/blocked when timing validation or frame timing is blocked.',
      recommendation: 'Set prompt tierAllowed false until timing validation passes.',
      relatedCueIds: executablePrompts.map((prompt) => prompt.id),
    }),
    check({
      id: 'timing-validation-renderer-not-ready-when-blocked',
      category: 'remotion_layer_timing',
      label: 'Renderer is not render-ready with blocked timing',
      passed: !timingBaseBlocked || !rendererReady,
      failedStatus: 'blocking',
      message: 'Renderer plans cannot claim render-ready while timing is blocked.',
      recommendation: 'Keep renderReady false until output frame and timing validation pass.',
      relatedCueIds: params.rendererCompositionPlan ? [params.rendererCompositionPlan.id] : [],
    }),
    check({
      id: 'timing-validation-worker-not-runnable-when-blocked',
      category: 'worker_readiness',
      label: 'Worker runtime does not run with blocked timing',
      passed: !timingBaseBlocked || !workerRunnable,
      failedStatus: 'blocking',
      message: 'Future workers must use approved timing snapshots and cannot run with blocked timing.',
      recommendation: 'Keep worker runtime waiting for approval and timing validation.',
    }),
  ]
}

function tierComplexityChecks(params: CreateTimingValidationPlanParams, complexity: TimingComplexityLevel, profile: TimingCreditProfile): TimingValidationCheck[] {
  const basicAdvanced = params.input.editLevel === 'basic' && (complexity === 'advanced' || complexity === 'premium')
  const proPremium = params.input.editLevel === 'pro' && complexity === 'premium'
  const highCreditImpact = profile.creditImpact === 'high' || profile.creditImpact === 'premium'

  return [
    check({
      id: 'timing-validation-tier-complexity-fit',
      category: 'tier_complexity',
      label: 'Timing complexity fits edit level',
      passed: !basicAdvanced && !proPremium,
      failedStatus: basicAdvanced ? 'failed' : 'warning',
      message: `Timing complexity is ${complexity}; it should fit the selected ${params.input.editLevel} edit level.`,
      recommendation: basicAdvanced
        ? 'Use lower-cost timing alternatives before Basic approval.'
        : 'Confirm Premium-level timing is intentional or simplify timing complexity.',
    }),
    check({
      id: 'timing-validation-credit-impact-explained',
      category: 'credit_impact',
      label: 'High timing credit impact has alternatives',
      passed: !highCreditImpact || createTimingLowerCostRecommendations({ ...params, complexity }).length > 0,
      failedStatus: 'warning',
      message: 'High timing complexity should explain credit impact and offer lower-cost alternatives.',
      recommendation: 'Show simpler captions, fewer SFX, phrase cuts only, shorter AI clips, or static-card alternatives.',
    }),
  ]
}

function groupItem(params: {
  id: string
  label: string
  checks: TimingValidationCheck[]
  profile: TimingCreditProfile
  complexity: TimingComplexityLevel
  estimatedPlanningCredits?: number
  summary: string
  lowerCostRecommendations: ReturnType<typeof createTimingLowerCostRecommendations>
  developerNotes: string[]
}): TimingValidationPlanItem {
  return {
    id: params.id,
    label: params.label,
    complexity: params.complexity,
    creditProfileId: params.profile.id,
    status: worstStatus(params.checks),
    checks: params.checks,
    creditImpact: params.profile.creditImpact,
    estimatedPlanningCredits: params.estimatedPlanningCredits ?? 0,
    lowerCostRecommendations: params.lowerCostRecommendations,
    userFacingSummary: params.summary,
    developerNotes: params.developerNotes,
  }
}

export function createTimingValidationPlan(params: CreateTimingValidationPlanParams): TimingValidationPlan {
  const aspectRatioFramePlan = params.aspectRatioFramePlan ?? params.input.aspectRatioFramePlan
  const masterTimingPlan = params.masterTimingPlan ?? params.input.masterTimingPlan
  const captionVisualCueTimingPlan = params.captionVisualCueTimingPlan ?? params.input.captionVisualCueTimingPlan
  const soundSyncTransitionTimingPlan = params.soundSyncTransitionTimingPlan ?? params.input.soundSyncTransitionTimingPlan
  const sourceCleanupPlan = params.sourceCleanupPlan ?? params.input.sourceCleanupPlan
  const trimReviewPlan = params.trimReviewPlan ?? params.input.trimReviewPlan
  const totalFrames = masterTimingPlan?.timingBase.totalFrames
  const frameConfirmed = aspectRatioFramePlan?.status === 'confirmed'
  const timingBaseExists = Boolean(masterTimingPlan?.timingBase)
  const timingBaseBlocked = !frameConfirmed ||
    !masterTimingPlan ||
    masterTimingPlan.status === 'needs_frame_confirmation' ||
    masterTimingPlan.status === 'blocked' ||
    !timingBaseExists ||
    !masterTimingPlan?.timingBase.fps ||
    !masterTimingPlan?.timingBase.totalFrames
  const complexity = inferTimingComplexity({
    input: params.input,
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    visualAssetPlan: params.visualAssetPlan,
  })
  const profile = getTimingCreditProfile(complexity)
  const lowerCostRecommendations = createTimingLowerCostRecommendations({
    input: params.input,
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    visualAssetPlan: params.visualAssetPlan,
    complexity,
  })

  const gateChecks = [
    check({
      id: 'timing-validation-frame-confirmed',
      category: 'frame_confirmation',
      label: 'Output frame is confirmed',
      passed: frameConfirmed,
      failedStatus: 'blocking',
      message: 'Aspect ratio/output frame must be confirmed before timing approval.',
      recommendation: 'Confirm the output frame in the chat-native frame gate.',
    }),
    check({
      id: 'timing-validation-master-plan-exists',
      category: 'timing_base',
      label: 'Master Timing Plan exists',
      passed: Boolean(masterTimingPlan),
      failedStatus: 'blocking',
      message: 'MasterTimingPlan is required before timing can be approved.',
      recommendation: 'Create Master Timing from the confirmed frame, source order, and edit strategy.',
    }),
    check({
      id: 'timing-validation-timing-base',
      category: 'timing_base',
      label: 'Timing base has FPS and total frames',
      passed: Boolean(masterTimingPlan?.timingBase.fps && masterTimingPlan.timingBase.fps > 0 && masterTimingPlan.timingBase.totalFrames > 0),
      failedStatus: 'blocking',
      message: 'Timing base must include FPS and total frame count.',
      recommendation: 'Rebuild timing base from confirmed output frame/timing setup.',
    }),
    check({
      id: 'timing-validation-final-timeline-exists',
      category: 'final_timeline',
      label: 'Final timeline has timed segments',
      passed: Boolean(masterTimingPlan?.finalTimelineSegments.length),
      failedStatus: 'blocking',
      message: 'Final timeline segments must exist before timing approval.',
      recommendation: 'Create final timeline segment timing from the edit operation plan.',
    }),
    check({
      id: 'timing-validation-source-cleanup-confirmed',
      category: 'source_timing',
      label: 'Source cleanup preference is confirmed',
      passed: Boolean(sourceCleanupPlan && sourceCleanupPlan.status === 'confirmed' && sourceCleanupPlan.cleanupQuestion.answered),
      failedStatus: 'blocking',
      message: 'Source cleanup preference must be confirmed before final trim timing and approval.',
      recommendation: 'Confirm how clean ReeditPro should make the cut before approving the edit plan.',
    }),
    check({
      id: 'timing-validation-source-cleanup-linked',
      category: 'source_timing',
      label: 'Source cleanup links to source timing',
      passed: Boolean(
        sourceCleanupPlan &&
        masterTimingPlan?.sourceCleanupPlanId === sourceCleanupPlan.id &&
        masterTimingPlan.sourceTimingItems.every((item) => Boolean(item.trimDecisionItemId)),
      ),
      failedStatus: 'failed',
      message: 'Source timing should reference SourceCleanupPlan trim decisions before approval.',
      recommendation: 'Rebuild Master Timing after source cleanup planning so source ranges inherit trim decisions.',
    }),
    check({
      id: 'timing-validation-trim-review-ready',
      category: 'source_timing',
      label: 'Trim review is resolved',
      passed: Boolean(trimReviewPlan && !trimReviewPlan.approvalBlocked),
      failedStatus: 'blocking',
      message: 'Trim review must resolve retake selection and meaning preservation before final timing approval.',
      recommendation: 'Review retake/meaning warnings or preserve risky ranges before approving timing.',
    }),
    check({
      id: 'timing-validation-caption-visual-plan-exists',
      category: 'caption_readability',
      label: 'Caption + Visual Cue Timing exists',
      passed: Boolean(captionVisualCueTimingPlan),
      failedStatus: 'failed',
      message: 'Caption/visual cue timing should refine captions and visuals before approval.',
      recommendation: 'Create CaptionVisualCueTimingPlan from Master Timing and visual plan.',
    }),
    check({
      id: 'timing-validation-soundsync-plan-exists',
      category: 'transition_safety',
      label: 'SoundSync + Transition Timing exists',
      passed: Boolean(soundSyncTransitionTimingPlan),
      failedStatus: 'failed',
      message: 'SoundSync transition timing should refine transitions, SFX, and ducking before approval.',
      recommendation: 'Create SoundSyncTransitionTimingPlan from Master Timing and caption/visual cue timing.',
    }),
  ]

  const checks = [
    ...gateChecks,
    ...frameRangeChecks({ ...params, aspectRatioFramePlan, captionVisualCueTimingPlan, masterTimingPlan, soundSyncTransitionTimingPlan }, totalFrames),
    ...captionReadabilityChecks({ ...params, captionVisualCueTimingPlan }),
    ...visualReadabilityChecks({ ...params, captionVisualCueTimingPlan }),
    ...soundSyncChecks({ ...params, masterTimingPlan, soundSyncTransitionTimingPlan }),
    ...providerRendererChecks(params, timingBaseBlocked),
    ...tierComplexityChecks(params, complexity, profile),
    check({
      id: 'timing-validation-mock-only-boundary',
      category: 'worker_readiness',
      label: 'Timing validation is mock-only',
      passed: true,
      message: 'Timing validation checks structured plans only; it does not run AudioFlux, FFmpeg, transcript alignment, Remotion, or media inspection.',
      recommendation: 'Future workers can verify real media timing after approved snapshots exist.',
    }),
  ]

  const overallStatus = worstStatus(checks)
  const approvalBlocked = overallStatus === 'blocking' || overallStatus === 'failed'
  const approvalBlockReasons = checks
    .filter((item) => item.status === 'blocking' || item.status === 'failed')
    .map((item) => item.message)
  const frameChecks = checks.filter((item) => ['frame_confirmation', 'timing_base', 'final_timeline', 'source_timing'].includes(item.category))
  const captionVisualChecks = checks.filter((item) => ['caption_readability', 'visual_readability', 'caption_visual_collision'].includes(item.category))
  const soundSyncTimingChecks = checks.filter((item) => ['transition_safety', 'beat_alignment', 'sfx_justification', 'music_ducking'].includes(item.category))
  const downstreamChecks = checks.filter((item) => ['provider_clip_duration', 'remotion_layer_timing', 'worker_readiness', 'approval_gate'].includes(item.category))
  const complexityChecks = checks.filter((item) => ['tier_complexity', 'credit_impact'].includes(item.category))
  const active = Boolean(sourceCleanupPlan || trimReviewPlan || masterTimingPlan || captionVisualCueTimingPlan || soundSyncTransitionTimingPlan || params.rendererCompositionPlan || params.providerPromptPlans?.length)

  return {
    id: `timing-validation-${masterTimingPlan?.id ?? 'draft'}`,
    active,
    summary: approvalBlocked
      ? 'Timing validation found approval-blocking issues. Resolve timing/frame validation before approval.'
      : overallStatus === 'warning'
        ? 'Timing validation is reviewable with warnings. Mock limitations remain visible before approval.'
        : 'Timing validation passed for this mock plan.',
    overallStatus,
    items: [
      groupItem({
        id: 'timing-validation-item-frame-gate',
        label: 'Frame and timeline approval gate',
        checks: frameChecks,
        complexity,
        profile,
        summary: 'Checks confirmed output frame, timing base, FPS, total frames, and final timeline timing.',
        lowerCostRecommendations: [],
        developerNotes: ['Frames are execution values; seconds are display values.'],
      }),
      groupItem({
        id: 'timing-validation-item-caption-visual',
        label: 'Caption and visual readability',
        checks: captionVisualChecks,
        complexity,
        profile,
        summary: 'Checks caption readability, visual read time, and collision recommendations.',
        lowerCostRecommendations: lowerCostRecommendations.filter((item) =>
          ['simpler_caption_animation', 'reduce_emphasis_words', 'reduce_visual_cue_density', 'use_static_card', 'convert_animation_to_still'].includes(item.actionType),
        ),
        developerNotes: ['Caption readability and safe-zone collisions are heuristic mock checks only.'],
      }),
      groupItem({
        id: 'timing-validation-item-soundsync',
        label: 'Transition, SFX, and ducking safety',
        checks: soundSyncTimingChecks,
        complexity,
        profile,
        summary: 'Checks speech-safe transitions, beat alignment, cue-linked SFX, and voice-priority ducking.',
        lowerCostRecommendations: lowerCostRecommendations.filter((item) =>
          ['use_phrase_cuts_only', 'remove_beat_sync', 'reduce_sfx_density', 'simpler_transitions', 'voice_only_timing'].includes(item.actionType),
        ),
        developerNotes: ['AudioFlux is represented as planned future analysis metadata only.'],
      }),
      groupItem({
        id: 'timing-validation-item-downstream',
        label: 'Provider, Remotion, and worker readiness',
        checks: downstreamChecks,
        complexity,
        profile,
        summary: 'Checks provider clip duration, Remotion layer timing, prompt executability, and future worker readiness.',
        lowerCostRecommendations,
        developerNotes: ['Renderer and provider plans must not solve timing validation issues by themselves.'],
      }),
      groupItem({
        id: 'timing-validation-item-credit-impact',
        label: 'Timing credit impact',
        checks: complexityChecks,
        complexity,
        profile,
        estimatedPlanningCredits: profile.estimatedPlanningCredits,
        summary: `${profile.label}: ${profile.description}`,
        lowerCostRecommendations,
        developerNotes: [`Credit impact: ${profile.creditImpact}. Basic remains professional with simpler timing.`],
      }),
    ],
    creditProfilesUsed: [profile.id],
    totalEstimatedTimingCredits: profile.estimatedPlanningCredits,
    lowerCostRecommendations,
    globalChecks: checks,
    approvalBlocked,
    approvalBlockReasons,
    qaChecks: [
      'Timing validation runs before approval.',
      'Blocking or failed timing validation prevents approval.',
      'Timing complexity is reflected in credit estimate and lower-cost alternatives.',
      'Master/Caption/SoundSync timing plans are frozen in approved snapshots.',
    ],
    limitations: [
      'Mock-only timing validation.',
      'No real transcript alignment has run.',
      'No real AudioFlux, FFmpeg, Signalsmith Stretch, audio analysis, media processing, or Remotion rendering has run.',
      'Future workers are required for production timing verification.',
    ],
    notes: [
      `Timing complexity inferred as ${complexity}.`,
      `Approval blocked: ${approvalBlocked ? 'yes' : 'no'}.`,
      'Speech clarity, story meaning, and visual readability outrank beat/decorative timing.',
    ],
  }
}
