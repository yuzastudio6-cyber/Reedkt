import { createAspectRatioFramePlan } from '../aspect-ratio-frame-planner'
import { compileEditingIntent } from '../intent-compiler'
import { createPlanningInputTrace, normalizeOrderedUserInstructions } from '../planning-input-safety'
import {
  createSourceSequenceReviewState,
  getClipRoleLabel,
  inferClipSourceRole,
  inferSourceSequenceMode,
} from '../source-sequence'
import type { PlanValidationReport, PlannerRegressionReport } from '../planner-validation'
import type {
  CaptionVisualCueTimingPlan,
  ClipSource,
  CreditEstimate,
  EditPlan,
  MasterTimingPlan,
  PlannerInput,
  SignatureRoute,
  SoundSyncTransitionTimingPlan,
  SourceCleanupPlan,
  SourceSequenceMapItem,
  TimingValidationPlan,
  TrimReviewPlan,
  AdaptiveEditStrategyPlan,
  VideoUnderstandingReport,
} from '../../types/reeditpro'

function parseDurationSeconds(duration: string) {
  const [minutes = '0', seconds = '0'] = duration.split(':')

  return Number(minutes) * 60 + Number(seconds)
}

function range(startSeconds: number, durationSeconds: number, fps = 30) {
  const startFrame = Math.round(startSeconds * fps)
  const durationFrames = Math.max(1, Math.round(durationSeconds * fps))

  return {
    startSeconds,
    endSeconds: startSeconds + durationSeconds,
    durationSeconds,
    startFrame,
    endFrame: startFrame + durationFrames,
    durationFrames,
    fps,
  }
}

function systemLabel(system: SignatureRoute['system']) {
  const labels = {
    stroke_motion: 'Stroke Motion',
    graphic_design: 'Graphic Design / VisualExplain',
    real_motion: 'Real Motion',
    sound_sync: 'SoundSync',
    none: 'None',
  }

  return labels[system]
}

function shouldUseMinimalVisuals(input: PlannerInput) {
  return input.visualPreference === 'keep_visuals_minimal' ||
    input.visualPreference === 'no_extra_visuals' ||
    input.workflowType === 'simple_clean_edit'
}

function createGuidedSignatureRoutes(input: PlannerInput): SignatureRoute[] {
  const routes: SignatureRoute[] = [
    {
      timeRange: '00:00-00:04',
      system: 'sound_sync',
      reason: 'Establish mood and speech-first timing before adding visual density.',
      creditImpact: 'low',
    },
  ]

  if (shouldUseMinimalVisuals(input)) {
    routes.push({
      timeRange: '00:05-00:18',
      system: 'none',
      reason: 'The selected preference points toward a clean edit without unnecessary overlays.',
      creditImpact: 'none',
    })
    return routes
  }

  if (
    input.visualPreference === 'more_graphic_design' ||
    input.visualPreference === 'balanced_visual_mix' ||
    input.workflowType === 'education_explainer' ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'marketing_ad'
  ) {
    routes.push({
      timeRange: '00:05-00:10',
      system: 'graphic_design',
      reason: 'Use clean explanatory overlays only where they clarify the user goal.',
      creditImpact: 'medium',
    })
  }

  if (input.visualPreference === 'real_motion_if_useful' || input.creditPreference === 'premium_best_result') {
    routes.push({
      timeRange: '00:11-00:15',
      system: 'real_motion',
      reason: 'Real Motion remains optional and credit-heavy until the user approves.',
      creditImpact: 'premium',
    })
  }

  if (input.visualPreference === 'more_stroke_motion' || input.editLevel !== 'basic') {
    routes.push({
      timeRange: '00:16-00:24',
      system: 'stroke_motion',
      reason: 'Add restrained 2D motion for story emphasis without clutter.',
      creditImpact: 'medium',
    })
  }

  routes.push({
    timeRange: '00:24-00:32',
    system: 'sound_sync',
    reason: 'Support the final transition and emotional polish while protecting voice clarity.',
    creditImpact: 'low',
  })

  return routes
}

function createSourceSequenceMap(clips: ClipSource[], sourceOrderConfirmed: boolean): SourceSequenceMapItem[] {
  return clips.map((clip) => {
    const role = clip.sourceRole ?? inferClipSourceRole(clip)
    const roleLabel = getClipRoleLabel(role)

    return {
      clipId: clip.id,
      uploadedOrder: clip.uploadedOrder,
      detectedRole: `${roleLabel}: ${clip.detectedType}`,
      strengths: [
        clip.isImportant ? 'Marked important by user' : 'Useful source context',
        ...(clip.notes ? [`User note: ${clip.notes}`] : []),
      ],
      concerns: [
        clip.isOptional ? 'Marked optional, use only if it improves the story' : 'Needs timing review before final structure',
        ...(!sourceOrderConfirmed ? ['Source order is not confirmed yet.'] : []),
      ],
      possibleUses: [
        clip.uploadedOrder === 1 ? 'Opening context or hook support' : 'Supporting story segment',
        role === 'b_roll' ? 'B-roll or pacing cover' : 'Visual proof or story support',
      ],
    }
  })
}

function recommendedCleanupPreference(input: PlannerInput) {
  if (input.cleanupPreference) return input.cleanupPreference
  if (input.editingCategory === 'documentary_case_study') return 'documentary_faithful'
  if (input.editingCategory === 'education_explainer' || input.workflowType === 'product_demo') return 'tutorial_complete'
  if (input.editingCategory === 'lifestyle') return 'preserve_natural'

  return 'balanced_cleanup'
}

function createGuidedSourceCleanupPlan(input: PlannerInput): SourceCleanupPlan {
  const selectedPreference = input.cleanupPreference ?? recommendedCleanupPreference(input)
  const status = input.cleanupPreferenceConfirmed ? 'confirmed' : input.cleanupPreference ? 'needs_confirmation' : 'recommended'
  let cursor = 0
  const decisions = input.clips.map((clip) => {
    const duration = parseDurationSeconds(clip.duration)
    const startSeconds = cursor
    cursor += duration

    return {
      id: `guided-trim-${clip.id}`,
      clipId: clip.id,
      sourceRange: { startSeconds: 0, endSeconds: duration, durationSeconds: duration },
      selectedRange: { startSeconds: 0, endSeconds: Math.max(1, duration - 1), durationSeconds: Math.max(1, duration - 1) },
      timelineRange: range(startSeconds, Math.max(1, Math.min(duration, 8))),
      decision: clip.isOptional ? 'tighten' : 'keep',
      finalUse: clip.sourceRole === 'b_roll' || clip.isOptional ? 'broll' : 'main_timeline',
      riskLevel: clip.isImportant ? 'low' : 'medium',
      reason: clip.isImportant
        ? 'Keep this source because it anchors the user goal.'
        : 'Use this source only where it supports pacing or proof.',
      keepReasons: clip.isImportant ? ['User-marked important', 'Story anchor'] : ['Supports sequence'],
      cutReasons: clip.isOptional ? ['Optional clip can be shortened if credits or pacing need it'] : [],
      userReviewRequired: false,
      notes: ['Guided mock cleanup summary; full diagnostics load only in advanced mode.'],
    }
  })

  return {
    id: 'guided-source-cleanup-plan',
    status,
    selectedPreference,
    recommendedPreference: {
      recommendedPreference: selectedPreference,
      reason: 'Guided mode keeps the cleanup choice lightweight before full advanced diagnostics load.',
      confidence: 'medium',
      mustConfirm: true,
    },
    cleanupQuestion: {
      id: 'guided-cleanup-question',
      question: 'How clean should I make the cut?',
      reason: 'Cleanup style changes trims, timing, and the credit estimate, so it must be confirmed before approval.',
      options: [
        'preserve_natural',
        'light_cleanup',
        'balanced_cleanup',
        'tight_retention_cleanup',
        'documentary_faithful',
        'tutorial_complete',
      ],
      recommendedOption: selectedPreference,
      requiredBeforeApproval: true,
      answered: Boolean(input.cleanupPreferenceConfirmed),
    },
    decisions,
    retakeGroups: [],
    preservedRanges: decisions.filter((decision) => decision.decision === 'keep'),
    cutRanges: decisions.filter((decision) => decision.decision === 'cut'),
    userReviewItems: [],
    finalDurationImpactSeconds: -Math.min(6, input.clips.length),
    meaningPreservationRules: [
      'Preserve source meaning over pacing.',
      'Do not remove user-marked important clips without review.',
    ],
    globalRules: [
      'No random cuts.',
      'Cleanup must be approved before generation can start.',
    ],
    qaChecks: ['Meaning-sensitive cuts remain reviewable before approval.'],
    limitations: ['Guided cleanup is review-only. Full transcript and media analysis remain backend-gated.'],
    notes: ['The raw source stays preserved; this is a non-destructive planning summary.'],
  } as unknown as SourceCleanupPlan
}

function createGuidedTrimReviewPlan(input: PlannerInput): TrimReviewPlan {
  const approvalBlocked = !input.cleanupPreferenceConfirmed

  return {
    id: 'guided-trim-review-plan',
    summary: approvalBlocked
      ? 'Confirm cleanup style before trim review can clear approval.'
      : 'Trim review is clear for this guided plan.',
    retakeSelectionPlan: {
      id: 'guided-retake-selection',
      active: true,
      summary: 'No risky retake groups inferred in guided mode.',
      items: [],
      selectedCandidateCount: 0,
      userReviewRequiredCount: 0,
      globalRules: ['Select retakes professionally; do not remove meaning-sensitive footage blindly.'],
      limitations: ['Real transcript/media retake analysis requires future workers.'],
      notes: ['Full retake diagnostics load in advanced mode.'],
    },
    meaningPreservationValidationPlan: {
      id: 'guided-meaning-preservation',
      status: approvalBlocked ? 'warning' : 'passed',
      summary: approvalBlocked
        ? 'Cleanup confirmation is required before approval.'
        : 'Guided validation did not find meaning-preservation blockers.',
      checks: [],
      blockingReasons: [],
      userReviewRequired: false,
      userReviewItems: [],
      globalRules: ['Preserve source meaning, documentary context, tutorial steps, and user-marked important clips.'],
      qaChecks: ['Meaning preservation is checked again in the full planner before approval.'],
      limitations: ['Transcript and media comparison remain backend-gated.'],
      notes: [],
    },
    approvalBlocked,
    approvalBlockReasons: approvalBlocked ? ['Confirm the cleanup style before approving credits.'] : [],
    userFacingReviewSummary: ['Trim review remains lightweight in Guided mode.'],
    nextUserQuestions: approvalBlocked ? ['Which cleanup style should ReeditPro use?'] : [],
    qaChecks: ['Approval stays locked until cleanup and timing gates clear.'],
    limitations: ['Guided trim review is review-only.'],
  }
}

function createGuidedMasterTimingPlan(input: PlannerInput): MasterTimingPlan {
  const fps = 30
  const sourceDurationSeconds = input.clips.reduce((total, clip) => total + parseDurationSeconds(clip.duration), 0)
  const finalDurationSeconds = Math.max(12, Math.min(45, sourceDurationSeconds - (input.cleanupPreferenceConfirmed ? 4 : 0)))
  const status = input.aspectRatioConfirmed ? 'ready' : 'needs_frame_confirmation'
  const segments = input.clips.slice(0, 4).map((clip, index) => {
    const startSeconds = index * Math.max(3, finalDurationSeconds / Math.max(1, input.clips.length))
    const duration = Math.max(3, Math.min(8, parseDurationSeconds(clip.duration)))

    return {
      id: `guided-segment-${clip.id}`,
      label: index === 0 ? 'Opening context' : clip.detectedType,
      role: index === 0 ? 'hook' : index === input.clips.length - 1 ? 'cta' : 'proof',
      finalRange: range(startSeconds, duration, fps),
      sourceTimingItemIds: [`guided-source-${clip.id}`],
      timingCues: [],
      pacingNotes: ['Guided timing keeps speech and source meaning first.'],
      qaChecks: ['Review before approval.'],
    }
  })

  return {
    id: 'guided-master-timing-plan',
    status,
    summary: input.aspectRatioConfirmed
      ? 'Frame-aware guided timing is ready for approval review.'
      : 'Timing remains draft until the output frame is confirmed.',
    timingBase: {
      fps,
      totalDurationSeconds: finalDurationSeconds,
      totalFrames: Math.round(finalDurationSeconds * fps),
      sourceDurationSeconds,
      finalDurationSeconds,
      frameRoundingMode: 'round',
      derivedFromAspectRatioFramePlan: true,
      aspectRatioConfirmed: Boolean(input.aspectRatioConfirmed),
      notes: ['Frame-accurate execution values are mock-planned in Guided mode.'],
    },
    sourceTimingItems: input.clips.map((clip) => ({
      id: `guided-source-${clip.id}`,
      clipId: clip.id,
      uploadedOrder: clip.uploadedOrder,
      sourceRange: range(0, parseDurationSeconds(clip.duration), fps),
      selectedRange: range(0, Math.max(1, parseDurationSeconds(clip.duration) - 1), fps),
      role: clip.sourceRole ?? inferClipSourceRole(clip),
      reason: 'Preserve source order as planning context.',
      trimNotes: ['Final trim decisions remain reviewable before approval.'],
      qaChecks: ['No random cuts.'],
    })),
    finalTimelineSegments: segments,
    transcriptTimingPlan: {
      id: 'guided-transcript-timing',
      status,
      lines: [],
      phraseBoundaryCueIds: [],
      emotionalPauseCueIds: [],
      limitations: ['Transcript alignment remains backend-gated.'],
      qaChecks: ['Speech clarity outranks beat alignment.'],
    },
    beatGridPlan: {
      id: 'guided-beat-grid',
      status,
      bpm: input.editLevel === 'basic' ? undefined : 92,
      beatItems: [],
      dropCueIds: [],
      onsetCueIds: [],
      confidence: 'low',
      limitations: ['AudioFlux analysis remains backend-gated.'],
      qaChecks: ['Beat sync must not override speech clarity.'],
    },
    captionTimingItems: segments.slice(0, 3).map((segment, index) => ({
      id: `guided-caption-${index + 1}`,
      captionText: index === 0 ? 'Clear opening context' : 'Keep the key point readable',
      timeRange: segment.finalRange,
      animationInFrames: 6,
      holdFrames: Math.max(24, segment.finalRange.durationFrames - 12),
      animationOutFrames: 6,
      readabilityScore: 'high',
      qaChecks: ['Avoid faces, products, and visual proof labels.'],
    })),
    visualTimingItems: segments.slice(0, 3).map((segment, index) => ({
      id: `guided-visual-${index + 1}`,
      label: index === 0 ? 'Opening visual emphasis' : 'Supporting proof visual',
      visualType: index === 0 ? 'caption_only' : 'graphic_explainer',
      timeRange: segment.finalRange,
      revealFrames: 8,
      holdFrames: Math.max(36, segment.finalRange.durationFrames - 16),
      exitFrames: 8,
      readTimeFrames: Math.max(36, segment.finalRange.durationFrames),
      reason: 'Visual appears only where it supports the viewer understanding.',
      qaChecks: ['Meaning-timed, not random.'],
    })),
    transitionTimingItems: [
      {
        id: 'guided-transition-1',
        transitionType: 'clean_cut_transitions',
        timeRange: range(4, 0.4, fps),
        beatAligned: false,
        phraseBoundaryAligned: true,
        reason: 'Use phrase-safe cuts before beat sync.',
        qaChecks: ['Do not cut important words.'],
      },
    ],
    sfxTimingItems: [],
    musicDuckingTimingItems: [
      {
        id: 'guided-duck-1',
        timeRange: range(0, Math.min(8, finalDurationSeconds), fps),
        duckingStrength: 'light',
        attackFrames: 6,
        releaseFrames: 12,
        reason: 'Voice stays clear under any music bed.',
        qaChecks: ['Music must not overpower speech.'],
      },
    ],
    remotionLayerTimingItems: [],
    providerClipTimingItems: [],
    globalRules: ['Credits and generation remain locked until plan approval.'],
    qaChecks: [
      {
        id: 'guided-timing-qa-1',
        label: 'Speech-first timing',
        riskLevel: 'low',
        passedMock: true,
        message: 'Guided timing protects speech clarity before beat alignment.',
        linkedCueIds: [],
      },
    ],
    limitations: ['Guided timing is a lightweight frontend plan; full diagnostics load on demand.'],
    notes: [],
  } as unknown as MasterTimingPlan
}

function createGuidedCaptionVisualCueTimingPlan(input: PlannerInput, masterTimingPlan: MasterTimingPlan): CaptionVisualCueTimingPlan {
  const status = input.aspectRatioConfirmed ? 'synced' : 'blocked'

  return {
    id: 'guided-caption-visual-cue-timing',
    status,
    summary: input.aspectRatioConfirmed
      ? 'Guided caption and visual cue timing is reviewable.'
      : 'Caption and visual cue timing needs the confirmed output frame.',
    captionPolicy: {
      id: 'guided-caption-policy',
      chunkingMode: input.editLevel === 'basic' ? 'minimal_caption' : 'phrase_based',
      animationStyle: 'premium_minimal',
      maxWordsPerCaption: 7,
      minDurationFrames: 36,
      maxDurationFrames: 120,
      leadInFrames: 2,
      lagFrames: 4,
      animationInFrames: 6,
      animationOutFrames: 6,
      safeGapFrames: 4,
      emphasisAllowed: input.editLevel !== 'basic',
      maxEmphasisWordsPerCaption: input.editLevel === 'basic' ? 0 : 1,
      avoidRules: ['Do not cover faces, product details, maps, chart labels, or proof cards.'],
      qaChecks: ['Readable captions before decorative motion.'],
    },
    captionPhraseTimings: [],
    refinedCaptionTimings: masterTimingPlan.captionTimingItems.map((caption) => ({
      id: `refined-${caption.id}`,
      captionText: caption.captionText,
      timeRange: caption.timeRange,
      chunkingMode: input.editLevel === 'basic' ? 'minimal_caption' : 'phrase_based',
      animationStyle: 'premium_minimal',
      emphasisWords: [],
      readabilityRisk: 'low',
      readabilityScore: 'high',
      safeZoneNotes: ['Use confirmed frame safe zones.'],
      collisionAvoidanceNotes: ['Avoid planned visual/proof labels.'],
      reason: 'Keep captions readable and speech-aligned.',
      qaChecks: ['Caption text is short enough for the planned hold.'],
    })),
    visualCueTimings: masterTimingPlan.visualTimingItems.map((visual) => ({
      id: `refined-${visual.id}`,
      cueType: visual.visualType === 'graphic_explainer' ? 'card_reveal' : 'custom',
      triggerType: 'speech_phrase_start',
      status,
      label: visual.label,
      timeRange: visual.timeRange,
      visualReadTimeFrames: visual.readTimeFrames,
      revealFrames: visual.revealFrames,
      holdFrames: visual.holdFrames,
      exitFrames: visual.exitFrames,
      safeZoneNotes: ['Keep captions above graphics and masks.'],
      reason: visual.reason,
      qaChecks: visual.qaChecks,
    })),
    collisionPlans: [],
    globalRules: ['Visual cue timing must support meaning, not random motion.'],
    qaChecks: masterTimingPlan.qaChecks,
    limitations: ['Transcript and media alignment remain backend-gated.'],
    notes: [],
  } as CaptionVisualCueTimingPlan
}

function createGuidedSoundSyncTransitionTimingPlan(input: PlannerInput, masterTimingPlan: MasterTimingPlan): SoundSyncTransitionTimingPlan {
  const status = input.aspectRatioConfirmed ? 'ready_mock' : 'blocked'

  return {
    id: 'guided-soundsync-transition-timing',
    status,
    summary: input.editLevel === 'basic'
      ? 'SoundSync stays restrained for Basic: clean voice, light timing, no random SFX.'
      : 'SoundSync is planned for mood, transitions, SFX restraint, and voice-first ducking.',
    beatGridPlan: {
      id: 'guided-soundsync-beat-grid',
      status,
      bpm: input.editLevel === 'basic' ? undefined : 92,
      confidence: 'low',
      beatItems: [],
      musicPhrases: [
        {
          id: 'guided-music-phrase-1',
          phraseType: 'intro',
          label: 'Soft intro bed',
          timeRange: range(0, 8),
          energy: 'low',
          confidence: 'low',
          notes: ['Estimated timing only.'],
        },
      ],
      snapToleranceFrames: 4,
      analysisToolPlanned: ['audioflux'],
      globalRules: ['Speech clarity outranks beat alignment.'],
      limitations: ['AudioFlux execution remains backend-gated.'],
      qaChecks: ['Beat grid is advisory until a future worker analyzes audio.'],
    },
    beatSnapDecisions: [
      {
        id: 'guided-beat-snap-1',
        requestedFrame: 120,
        snappedFrame: 120,
        snapDecision: 'snap_to_phrase_boundary',
        speechSafe: true,
        reason: 'Phrase boundary is safer than forcing a beat cut.',
        qaChecks: ['Do not cut important words.'],
      },
    ],
    refinedTransitionTimings: masterTimingPlan.transitionTimingItems.map((transition) => ({
      id: `refined-${transition.id}`,
      transitionType: 'phrase_cut',
      timeRange: transition.timeRange,
      phraseBoundaryAligned: true,
      beatAligned: false,
      downbeatAligned: false,
      visualMotivated: true,
      audioMotivated: false,
      durationFrames: transition.timeRange.durationFrames,
      riskLevel: 'low',
      reason: transition.reason,
      qaChecks: transition.qaChecks,
    })),
    refinedSfxTimings: [],
    refinedMusicDuckingTimings: masterTimingPlan.musicDuckingTimingItems.map((ducking) => ({
      id: `refined-${ducking.id}`,
      timeRange: ducking.timeRange,
      duckingStrength: ducking.duckingStrength,
      reasonType: 'voice_clarity',
      attackFrames: ducking.attackFrames,
      releaseFrames: ducking.releaseFrames,
      preserveMusicDrop: false,
      voicePriority: true,
      reason: ducking.reason,
      qaChecks: ducking.qaChecks,
    })),
    sfxDensityLevel: input.editLevel === 'basic' ? 'none' : 'low',
    globalRules: ['Do not add random SFX.'],
    qaChecks: [
      {
        id: 'guided-soundsync-qa-1',
        label: 'Voice protected',
        riskLevel: 'low',
        passedMock: true,
        message: 'Music and SFX stay below speech priority.',
        linkedTransitionTimingItemIds: [],
        linkedSfxTimingItemIds: [],
        linkedDuckingTimingItemIds: ['refined-guided-duck-1'],
      },
    ],
    limitations: ['Audio analysis, provider calls, and SFX generation remain backend-gated.'],
    notes: [],
  } as SoundSyncTransitionTimingPlan
}

function createGuidedTimingValidationPlan(input: PlannerInput): TimingValidationPlan {
  const approvalBlocked = !input.aspectRatioConfirmed || !input.cleanupPreferenceConfirmed
  const status = approvalBlocked ? 'blocking' : 'passed'
  const checks = [
    {
      id: 'guided-frame-check',
      category: 'frame_confirmation',
      label: 'Output frame confirmed',
      status: input.aspectRatioConfirmed ? 'passed' : 'blocking',
      severity: input.aspectRatioConfirmed ? 'info' : 'blocking',
      message: input.aspectRatioConfirmed
        ? 'Output frame is confirmed for the guided plan.'
        : 'Confirm the output frame before approval.',
      relatedCueIds: [],
    },
    {
      id: 'guided-cleanup-check',
      category: 'approval_gate',
      label: 'Cleanup style confirmed',
      status: input.cleanupPreferenceConfirmed ? 'passed' : 'blocking',
      severity: input.cleanupPreferenceConfirmed ? 'info' : 'blocking',
      message: input.cleanupPreferenceConfirmed
        ? 'Cleanup style is confirmed before approval.'
        : 'Confirm cleanup style before approval.',
      relatedCueIds: [],
    },
  ]

  return {
    id: 'guided-timing-validation',
    active: true,
    summary: approvalBlocked
      ? 'Guided timing validation is blocking until setup gates are confirmed.'
      : 'Guided timing validation passed for the approval summary.',
    overallStatus: status,
    items: [
      {
        id: 'guided-validation-item',
        label: 'Guided timing baseline',
        complexity: input.editLevel === 'premium' ? 'moderate' : 'simple',
        creditProfileId: 'guided-credit-profile',
        status,
        checks,
        creditImpact: input.editLevel === 'premium' ? 'medium' : 'low',
        estimatedPlanningCredits: input.editLevel === 'premium' ? 6 : 3,
        lowerCostRecommendations: [],
        userFacingSummary: 'Frame, cleanup, caption readability, and voice-first timing remain gated before approval.',
        developerNotes: ['Full validation loads when advanced diagnostics are requested or approval is checked.'],
      },
    ],
    creditProfilesUsed: ['guided-credit-profile'],
    totalEstimatedTimingCredits: input.editLevel === 'premium' ? 6 : 3,
    lowerCostRecommendations: [],
    globalChecks: checks,
    approvalBlocked,
    approvalBlockReasons: [
      ...(!input.aspectRatioConfirmed ? ['Confirm output frame before approval.'] : []),
      ...(!input.cleanupPreferenceConfirmed ? ['Confirm cleanup style before approval.'] : []),
    ],
    qaChecks: ['Full timing validation runs before mock progress starts.'],
    limitations: ['Guided validation is lightweight and frontend-only.'],
    notes: [],
  } as TimingValidationPlan
}

function createGuidedAdaptiveStrategyPlan(input: PlannerInput): AdaptiveEditStrategyPlan {
  const segmentStrategies = input.clips.slice(0, 4).map((clip, index) => ({
    id: `guided-adaptive-${clip.id}`,
    clipId: clip.id,
    label: index === 0 ? 'Opening story beat' : clip.detectedType,
    segmentRole: index === 0 ? 'hook' : clip.isImportant ? 'proof' : 'context',
    decisionKind: input.visualPreference === 'keep_visuals_minimal' ? 'use_captions_only' : 'keep_speaker_focus',
    creativeIntensity: input.editLevel === 'premium' ? 'high_impact' : input.editLevel === 'pro' ? 'expressive' : 'restrained',
    generationRestraint: input.editLevel === 'basic' ? 'avoid_generation' : 'use_generation_only_if_needed',
    recommendedVisualSupport: input.visualPreference === 'more_graphic_design' ? 'graphic_explainer' : 'caption_only',
    recommendedSignatureSystem: input.visualPreference === 'more_stroke_motion' ? 'stroke_motion' : input.visualPreference === 'more_graphic_design' ? 'graphic_design' : 'sound_sync',
    recommendedLayoutMode: input.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'lower_visual_panel',
    recommendedSpeakerPresence: 'full_speaker',
    recommendedVisualDominance: input.visualPreference === 'keep_visuals_minimal' ? 'support' : 'balanced',
    recommendedToolHints: [],
    recommendedTransitionFamilies: ['clean_cut_transitions'],
    recommendedColorGrade: input.moodStyle === 'luxury' ? 'luxury_real_estate' : 'clean_natural',
    recommendedCaptionStyle: 'small_premium_subtitle',
    recommendedBrollPolicy: 'uploaded_footage_first',
    costComplexity: input.editLevel === 'premium' ? 'medium' : 'low',
    reasons: [
      {
        id: `guided-adaptive-reason-${clip.id}`,
        source: 'user_intent',
        explanation: 'Guided mode uses user intent and source order without loading full planner diagnostics.',
        priority: 'high',
      },
    ],
    mustFollowRules: ['Do not start generation before plan and credit approval.'],
    avoidRules: ['No random b-roll, effects, captions, or visuals.'],
    fallbackStrategy: ['Use uploaded footage and editor motion if generation is unnecessary.'],
    qaChecks: ['Verify this decision against the approved full plan before mock progress starts.'],
  }))

  return {
    id: 'guided-adaptive-edit-strategy',
    summary: 'Guided mode chooses restrained, source-aware editing decisions before advanced planner diagnostics load.',
    hookStrategy: {
      policy: input.workflowType === 'marketing_ad' ? 'required' : 'recommended',
      recommendation: 'Use a clear opening only if it supports the user goal.',
      selectedClipId: input.clips[0]?.id,
      reason: 'The first uploaded clip is treated as story context until the user approves the plan.',
      alternatives: ['Open with source context', 'Open with the strongest spoken line if social performance matters'],
    },
    pacingStrategy: {
      pacingStyle: input.workflowType === 'simple_clean_edit' ? 'natural' : 'clean_tight',
      cutIntensity: input.editLevel === 'basic' ? 'minimal' : 'balanced',
      creativeIntensity: input.editLevel === 'premium' ? 'high_impact' : input.editLevel === 'pro' ? 'expressive' : 'restrained',
      reason: 'Pacing follows the workflow and cleanup choice, not random retention tricks.',
      keepPausesWhere: ['Important emotion', 'Meaning-sensitive explanation'],
      tightenWhere: ['Dead space', 'Repeated setup'],
      avoidRules: ['Do not cut important words for beat alignment.'],
    },
    visualStrategySummary: {
      speakerLedSegments: input.clips.length,
      visualTakeoverSegments: input.visualPreference === 'more_graphic_design' ? 1 : 0,
      brollSegments: input.clips.filter((clip) => clip.sourceRole === 'b_roll').length,
      graphicSegments: input.visualPreference === 'more_graphic_design' ? 1 : 0,
      mapOrChartSegments: input.workflowType === 'education_explainer' ? 1 : 0,
      aiVideoSegments: input.editLevel === 'basic' ? 0 : 1,
      stillCardSegments: input.visualPreference === 'keep_visuals_minimal' ? 0 : 1,
      noExtraVisualSegments: input.visualPreference === 'keep_visuals_minimal' ? input.clips.length : 0,
      summary: 'Use the lightest visual system that still clarifies the edit.',
    },
    segmentStrategies,
    globalMustFollowRules: ['Chat-first flow', 'Plan and credit approval before generation'],
    globalAvoidRules: ['No generic template pass', 'No random AI generation'],
    tierConstraints: [input.editLevel === 'premium' ? 'Veo remains final fallback only.' : 'Basic/Pro cannot use Veo.'],
    modelPolicyNotes: [input.editLevel === 'premium' ? 'Premium can plan deeper fallbacks after approval.' : 'No Veo route for Basic/Pro.'],
    creditStrategyNotes: ['Show the estimate before approval.', 'Lower-cost alternatives stay available.'],
    qaChecks: ['Full planner validation runs before mock progress starts.'],
    limitations: ['Guided adaptive strategy is lightweight; full diagnostics load in Detailed/Developer modes.'],
  } as unknown as AdaptiveEditStrategyPlan
}

function createGuidedVideoUnderstandingReport(input: PlannerInput, adaptiveStrategyPlan: AdaptiveEditStrategyPlan): VideoUnderstandingReport {
  const clips = input.clips.map((clip) => ({
    clipId: clip.id,
    uploadedOrder: clip.uploadedOrder,
    fileName: clip.fileName,
    duration: clip.duration,
    detectedRole: clip.sourceRole ?? inferClipSourceRole(clip),
    roleConfidence: clip.isImportant ? 'high' : 'medium',
    transcriptSummary: clip.notes ?? clip.detectedType,
    visualSummary: clip.detectedType,
    audioSummary: 'Voice/audio readiness is mock-estimated in Guided mode.',
    strongMoments: clip.isImportant ? ['User-marked important'] : [],
    weakMoments: clip.isOptional ? ['Optional source'] : [],
    hookCandidates: clip.uploadedOrder === 1 ? ['Potential opening context'] : [],
    brollOpportunities: clip.sourceRole === 'b_roll' ? ['Use as supporting b-roll'] : [],
    visualSupportOpportunities: input.visualPreference === 'more_graphic_design' ? ['graphic_explainer'] : ['caption_only'],
    toolStrategyHints: [],
    visualQualityIssues: ['none'],
    audioQualityIssues: ['none'],
    safeZoneNotes: ['Respect confirmed frame safe zones.'],
    faceOrSpeakerNotes: ['Protect speaker face and expression.'],
    productOrObjectNotes: [],
    foregroundDepthNotes: [],
    aiNotes: ['Full video understanding diagnostics load on demand.'],
  }))

  return {
    id: 'guided-video-understanding',
    sourceSequenceMode: input.sourceSequenceMode,
    sourceOrderConfirmed: Boolean(input.sourceOrderConfirmed),
    overallSummary: 'Guided mode understands the source sequence at a lightweight level before loading full diagnostics.',
    clips,
    transcriptMeaning: {
      summary: 'Use user instructions, clip notes, and source order as the planning baseline.',
      keyPhrases: [input.customInstructions],
      hookLines: [],
      emotionalLines: input.moodStyle === 'emotional' ? [input.customInstructions] : [],
      explanationLines: input.workflowType === 'education_explainer' ? [input.customInstructions] : [],
      proofOrClaimLines: [],
      ctaLines: [],
      unclearLines: [],
      visualSupportNeeded: input.visualPreference === 'more_graphic_design' ? ['graphic_explainer'] : ['caption_only'],
      captionDensityRecommendation: input.editLevel === 'basic' ? 'low' : 'medium',
      notes: ['Transcript analysis remains backend-gated.'],
    },
    visualUnderstanding: {
      sceneTypeSummary: 'Source clips are treated as the truth source for planning.',
      speakerFraming: 'Protect speaker-safe areas until full media analysis exists.',
      faceSafeZoneNotes: ['Do not cover faces with captions or graphics.'],
      productSafeZoneNotes: ['Do not cover product/proof details.'],
      emptySpaceOpportunities: ['Use only if visible and useful.'],
      foregroundOpportunities: [],
      contactObjectOpportunities: [],
      depthCompositionOpportunities: [],
      brollQualityNotes: ['Use b-roll only when it supports meaning.'],
      colorLightingIssues: ['none'],
      notes: ['Full video understanding loads in advanced diagnostics.'],
    },
    audioUnderstanding: {
      voiceClarity: 'good',
      musicPresent: false,
      noiseLevel: 'low',
      loudnessConsistency: 'good',
      cleanupNeeded: true,
      soundSyncOpportunities: ['Voice-first music ducking', 'Phrase-safe transitions'],
      audioIssues: ['none'],
      notes: ['Audio analysis remains backend-gated.'],
    },
    visualSupportOpportunities: clips.slice(0, 3).map((clip, index) => ({
      id: `guided-opportunity-${clip.clipId}`,
      clipId: clip.clipId,
      opportunityType: input.visualPreference === 'more_graphic_design' ? 'graphic_explainer' : 'caption_only',
      label: index === 0 ? 'Opening clarity' : 'Meaning support',
      reason: 'Use visuals only when they clarify the source story.',
      suggestedSignatureSystem: input.visualPreference === 'more_graphic_design' ? 'graphic_design' : 'sound_sync',
      suggestedLayoutMode: input.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'lower_visual_panel',
      suggestedToolHints: [],
      creditImpact: input.visualPreference === 'keep_visuals_minimal' ? 'none' : 'low',
      priority: index === 0 ? 'high' : 'medium',
      qaChecks: ['Meaning-timed, not random.'],
    })),
    suggestedStrategy: {
      id: 'guided-adaptive-strategy-summary',
      summary: adaptiveStrategyPlan.summary,
      items: adaptiveStrategyPlan.segmentStrategies.map((strategy) => ({
        id: `guided-strategy-item-${strategy.id}`,
        clipId: strategy.clipId,
        label: strategy.label,
        decision: strategy.decisionKind,
        reason: strategy.reasons[0]?.explanation ?? adaptiveStrategyPlan.summary,
        userIntentInfluence: input.customInstructions,
        videoUnderstandingInfluence: 'Guided video understanding summary.',
        recommendedVisualSupport: strategy.recommendedVisualSupport,
        recommendedLayoutMode: strategy.recommendedLayoutMode,
        recommendedToolHints: strategy.recommendedToolHints,
        avoidRules: strategy.avoidRules,
        qaChecks: strategy.qaChecks,
      })),
      globalRules: adaptiveStrategyPlan.globalMustFollowRules,
      notes: adaptiveStrategyPlan.limitations,
    },
    adaptiveStrategyPlan,
    confidence: 'medium',
    limitations: ['Guided understanding is lightweight review metadata.'],
    qaConcerns: [],
    notes: ['Provider calls, workers, and media analysis remain backend-gated.'],
  } as VideoUnderstandingReport
}

function createGuidedCreditEstimate(input: PlannerInput, routes: SignatureRoute[], timingValidationPlan: TimingValidationPlan): CreditEstimate {
  const baseCredits = input.editLevel === 'premium' ? 44 : input.editLevel === 'pro' ? 28 : 18
  const realMotionCredits = routes.some((route) => route.system === 'real_motion') ? 22 : 0
  const visualCredits = routes.filter((route) => route.system === 'stroke_motion' || route.system === 'graphic_design').length * 7
  const timingCredits = timingValidationPlan.totalEstimatedTimingCredits
  const total = baseCredits + realMotionCredits + visualCredits + timingCredits

  return {
    total,
    breakdown: [
      { label: 'Edit planning', credits: baseCredits, reason: `${input.editLevel} planning, captions, cleanup, and professional edit structure.` },
      { label: 'Visual systems', credits: visualCredits + realMotionCredits, reason: 'Signature systems are planned before generation and can be revised before approval.' },
      { label: 'Timing validation', credits: timingCredits, reason: 'Frame-aware timing, captions, transitions, and SoundSync are checked before approval.' },
    ],
    timingCredits,
    timingTradeoffs: [],
    editLevel: input.editLevel,
    editingCategory: input.editingCategory,
    lowerCostAlternatives: [
      {
        label: 'Reduce generated visuals',
        estimatedSavings: Math.min(18, visualCredits),
        tradeoff: 'Use more uploaded footage and editor motion instead of generated assets.',
        actionHint: 'Use a cleaner visual mix',
      },
      ...(realMotionCredits > 0
        ? [{
            label: 'Remove Real Motion',
            estimatedSavings: realMotionCredits,
            tradeoff: 'Replace credit-heavy realistic overlays with VisualExplain or still-with-editor-motion.',
            actionHint: 'Remove Real Motion',
          }]
        : []),
    ],
    riskLevel: realMotionCredits > 0 ? 'high' : input.editLevel === 'premium' ? 'medium' : 'low',
    approvalCopy: 'Credits are estimated now and only used after you approve the plan.',
    approvalBlocked: timingValidationPlan.approvalBlocked,
    draftReason: timingValidationPlan.approvalBlocked ? timingValidationPlan.approvalBlockReasons.join(' ') : undefined,
    estimateVersion: 'guided-v1',
  }
}

export function createGuidedMockEditPlan(input: PlannerInput): EditPlan {
  const sourceOrderConfirmed = input.sourceOrderConfirmed ?? true
  const sourceSequenceMode = input.sourceSequenceMode ?? inferSourceSequenceMode(input.clips, input.customInstructions)
  const aspectRatioFramePlan = input.aspectRatioFramePlan ?? createAspectRatioFramePlan({ input })
  const frameAwareInput: PlannerInput = {
    ...input,
    aspectRatioFramePlan,
    sourceOrderConfirmed,
    sourceSequenceMode,
  }
  const compiledIntent = input.compiledIntent ?? compileEditingIntent({
    currentInput: frameAwareInput,
    referenceProvided: frameAwareInput.referenceUrl.trim().length > 0,
    sourceOrderConfirmed,
    userMessages: normalizeOrderedUserInstructions(
      frameAwareInput.userInstructionHistory,
      frameAwareInput.userInstructionHistory === undefined ? frameAwareInput.customInstructions : '',
    ),
  })
  const effectiveInput: PlannerInput = {
    ...frameAwareInput,
    ...compiledIntent.resolvedSettings,
    aspectRatioFramePlan,
    compiledIntent,
    professionalEditingDirective: compiledIntent.professionalEditingDirective,
    sourceOrderConfirmed,
    sourceSequenceMode,
  }
  const sourceCleanupPlan = input.sourceCleanupPlan ?? createGuidedSourceCleanupPlan(effectiveInput)
  const trimReviewPlan = input.trimReviewPlan ?? createGuidedTrimReviewPlan(effectiveInput)
  const masterTimingPlan = input.masterTimingPlan ?? createGuidedMasterTimingPlan(effectiveInput)
  const captionVisualCueTimingPlan = input.captionVisualCueTimingPlan ?? createGuidedCaptionVisualCueTimingPlan(effectiveInput, masterTimingPlan)
  const soundSyncTransitionTimingPlan = input.soundSyncTransitionTimingPlan ?? createGuidedSoundSyncTransitionTimingPlan(effectiveInput, masterTimingPlan)
  const timingValidationPlan = input.timingValidationPlan ?? createGuidedTimingValidationPlan(effectiveInput)
  const routes = createGuidedSignatureRoutes(effectiveInput)
  const adaptiveEditStrategyPlan = createGuidedAdaptiveStrategyPlan(effectiveInput)
  const videoUnderstandingReport = createGuidedVideoUnderstandingReport(effectiveInput, adaptiveEditStrategyPlan)
  const strongerSocialOpen =
    effectiveInput.structurePreference === 'restructure_for_social' ||
    effectiveInput.structurePreference === 'let_ai_recommend' ||
    effectiveInput.workflowType === 'social_short_viral_clip' ||
    effectiveInput.workflowType === 'marketing_ad'
  const recommendedStructure = [
    sourceOrderConfirmed ? 'Use confirmed source order as story context.' : 'Confirm source order before final approval.',
    sourceSequenceMode === 'unordered_clips_needs_ai_help'
      ? 'AI may suggest a stronger final structure later while preserving source meaning.'
      : 'Final edit order can differ only after ReeditPro shows it in the plan.',
    ...(strongerSocialOpen
      ? [
          'Open with the strongest clear story beat.',
          'Return to source context so the edit remains honest and readable.',
          'Close with the clearest emotional result or CTA.',
        ]
      : [
          'Preserve source sequence as the primary structure.',
          'Tighten weak pauses while keeping meaning intact.',
          'Use targeted overlays only when they clarify the spoken point.',
        ]),
  ]
  const hookPolicy = effectiveInput.workflowType === 'marketing_ad'
    ? 'required'
    : effectiveInput.workflowType === 'simple_clean_edit'
      ? 'avoid'
      : strongerSocialOpen
        ? 'recommended'
        : 'optional'
  const referenceProvided = effectiveInput.referenceUrl.trim().length > 0

  return {
    goalSummary: compiledIntent.goalSummary,
    planningInputTrace: createPlanningInputTrace(effectiveInput),
    sourceSequenceMap: createSourceSequenceMap(effectiveInput.clips, sourceOrderConfirmed),
    sourceSequenceReview: createSourceSequenceReviewState({
      clips: effectiveInput.clips,
      confirmed: sourceOrderConfirmed,
      customInstructions: effectiveInput.customInstructions,
      mode: sourceSequenceMode,
      userGuidance: 'Uploaded order is source/story context. Final reorder must appear in the plan before approval.',
      aiNotes: ['Guided mode keeps source sequence review lightweight.'],
    }),
    sourceCleanupPlan,
    trimReviewPlan,
    recommendedStructure,
    hookDecision: {
      policy: hookPolicy,
      recommendation:
        hookPolicy === 'avoid'
          ? 'No hook recommended. Keep the edit clean.'
          : hookPolicy === 'required'
            ? 'Strong hook required before the offer or proof sequence.'
            : 'Soft hook recommended only if it improves the viewer entry point.',
      reason: 'Guided mode summarizes the hook decision before full advanced planner diagnostics load.',
    },
    referenceDNA: referenceProvided
      ? {
          pacing: 'Use the reference for rhythm and beat changes, not shot order.',
          music: 'Study the intro energy and duck music under voice.',
          captions: 'Adapt caption density and contrast while keeping ReeditPro spacing rules.',
          transitions: 'Borrow transition logic only where it supports the user footage.',
          visualStyle: 'Translate the mood into ReeditPro visual systems without copying scenes.',
          adaptationRule: 'Reference DNA guides style; it does not create a shot-for-shot copy.',
        }
      : undefined,
    signatureRoutes: routes.map((route) => ({
      ...route,
      reason: `${route.reason} (${systemLabel(route.system)} is planned only after approval.)`,
    })),
    videoUnderstandingReport,
    adaptiveEditStrategy: videoUnderstandingReport.suggestedStrategy,
    adaptiveEditStrategyPlan,
    aspectRatioFramePlan,
    compiledIntent,
    professionalEditingDirective: compiledIntent.professionalEditingDirective,
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    timingValidationPlan,
    soundSyncDirection:
      effectiveInput.editLevel === 'basic'
        ? 'Keep SoundSync subtle: light cleanup, soft bed if needed, and no distracting transitions.'
        : 'Use SoundSync for mood, beat timing, transition sounds, ducking, and emotional polish while speech stays clear.',
    captionDirection: 'Use readable captions that avoid faces, important objects, and visual-system placement zones.',
    creditEstimate: createGuidedCreditEstimate(effectiveInput, routes, timingValidationPlan),
    approvalRequired: true,
  }
}

export function createGuidedPlanValidationReport(params: {
  plan: EditPlan
  scenarioId: string
}): PlanValidationReport {
  const { plan, scenarioId } = params
  const approvalBlocked = Boolean(plan.creditEstimate.approvalBlocked || plan.timingValidationPlan?.approvalBlocked)

  return {
    id: `guided-validation-${scenarioId}`,
    status: approvalBlocked ? 'warning' : 'passed',
    summary: approvalBlocked
      ? 'Guided validation is waiting for required setup gates.'
      : 'Guided validation passed. Full validation loads on demand before advanced review.',
    checks: [],
    blockingCount: 0,
    errorCount: 0,
    warningCount: approvalBlocked ? 1 : 0,
    passedCount: approvalBlocked ? 0 : 1,
  }
}

export const guidedPlannerRegressionPlaceholder: PlannerRegressionReport = {
  id: 'guided-regression-deferred',
  status: 'passed',
  summary: 'Full planner regression is deferred until advanced diagnostics are opened.',
  scenarioReports: [],
  globalChecks: [],
  blockingCount: 0,
  errorCount: 0,
  warningCount: 0,
  passedCount: 0,
}
