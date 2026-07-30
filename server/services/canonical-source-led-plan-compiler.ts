import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../src/lib/approved-edit-execution-package-client'
import {
  buildCanonicalPlanningDraft,
  type CanonicalPlanningDraft,
} from '../../src/lib/canonical-planning-draft'
import { createGuidedEditPlan } from '../../src/lib/guided-edit-planner'
import type {
  CaptionVisualCueTimingPlan,
  EditPlan,
  MasterTimingPlan,
  PlannerInput,
  SoundSyncTransitionTimingPlan,
  SourceCleanupPlan,
} from '../../src/types/reeditpro'
import { createAudioPipelinePlan } from '../../src/lib/audio-pipeline-planner'
import { createColorPipelinePlan } from '../../src/lib/color-pipeline-planner'
import type {
  EditBriefMarkerRecord,
  EditBriefRecord,
} from './private-edit-brief-authority-store'

const SOURCE_LED_FPS = 30 as const
const ASCII_CAPTION = /^[\x20-\x7e]+$/

export interface CanonicalSourceLedPlanCompilation {
  plannerInput: PlannerInput
  plan: EditPlan
  canonicalDraft: CanonicalPlanningDraft
  evidence: {
    sourceMetadataAuthority: 'server_reverified_finalized_upload_ffprobe'
    editDirectionAuthority: 'server_reverified_chat_preferences_and_optional_edit_brief'
    exactPreferenceAuthority: 'server_reverified_exact_edit_preferences'
    browserPlanAccepted: false
    browserTimingAccepted: false
    sourceRangePolicy: 'preserve_every_verified_source_frame'
    sourceCount: number
    totalFrames: number
    fps: typeof SOURCE_LED_FPS
    captionCueCount: number
  }
}

/**
 * Compiles the first honest, deliberately bounded backend plan:
 *
 * - source order and full ranges come from finalized upload + FFprobe evidence;
 * - user direction comes from verified named-edit Chat, exact preferences, and
 *   an optional persisted ready Edit Brief when the user created one;
 * - edit settings come from exact server-owned preferences;
 * - captions, when present, must be explicit confirmed Edit Brief markers;
 * - no transcript/content inference, generated media, music, SFX, b-roll, or
 *   content-aware trim is invented.
 *
 * The caller cannot provide an EditPlan, MasterTimingPlan, estimate, work
 * graph, provider route, tool route, or renderer payload.
 */
export function compileCanonicalSourceLedPlan(input: {
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  editBrief?: EditBriefRecord
  confirmedCaptionMarkers: EditBriefMarkerRecord[]
}): CanonicalSourceLedPlanCompilation {
  assertBoundedSourceLedInput(input)
  const base = createGuidedEditPlan(input.plannerInput)
  const sourceFrames = input.sourceMediaAssets.map((asset) =>
    Math.round(asset.sourceMetadata!.durationSeconds! * SOURCE_LED_FPS))
  const totalFrames = sourceFrames.reduce((sum, frames) => sum + frames, 0)
  const sourceCleanupPlan = buildPreservingCleanupPlan(
    base.sourceCleanupPlan!,
    input.plannerInput,
    sourceFrames,
  )
  const captions = buildConfirmedCaptionCues(
    input.confirmedCaptionMarkers,
    totalFrames,
  )
  const masterTimingPlan = buildSourceLedMasterTimingPlan({
    template: base.masterTimingPlan!,
    plannerInput: input.plannerInput,
    sourceFrames,
    captions,
  })
  const captionVisualCueTimingPlan = buildSourceLedCaptionTimingPlan({
    template: base.captionVisualCueTimingPlan!,
    plannerInput: input.plannerInput,
    masterTimingPlan,
  })
  const soundSyncTransitionTimingPlan = buildSourceLedSoundSyncPlan({
    template: base.soundSyncTransitionTimingPlan!,
    masterTimingPlan,
  })
  const timingValidationPlan = structuredClone(base.timingValidationPlan!)
  timingValidationPlan.summary =
    'Server-derived frame timing preserves every verified source frame and uses only confirmed Edit Brief captions.'
  timingValidationPlan.qaChecks = [
    'Verify contiguous source coverage, explicit caption timing, and speech-safe hard-cut boundaries before approval.',
  ]
  timingValidationPlan.limitations = [
    'Content-aware trims remain disabled until transcript and visual-analysis worker evidence exists.',
  ]
  timingValidationPlan.notes = []
  // The active internal workflow has no user-facing Edit Level. Keep the
  // legacy planner field at its full-capability value, but compile source
  // audio/color through the strongest profile whose exact worker recipes are
  // currently admitted. This prevents an unavailable OpenColorIO/OpenCV path
  // from being implied while preserving the professional voice/color pass.
  const professionalEditingDirective =
    input.plannerInput.professionalEditingDirective ??
    base.professionalEditingDirective
  if (!professionalEditingDirective) {
    throw new Error(
      'Canonical source-led planning requires one compiled professional editing directive.',
    )
  }
  const professionalSourceBaselineInput: PlannerInput = {
    ...input.plannerInput,
    editLevel: 'pro',
    customInstructions: [
      'Use only the verified uploaded source footage.',
      'Use source-only professional voice cleanup with no music, SFX, beat sync, or generated audio.',
      'Apply only the bounded clean natural FFmpeg source color recipe; do not infer targeted face, person, or skin-isolation processing.',
    ].join('\n'),
    userInstructionHistory: [],
    professionalEditingDirective: {
      ...professionalEditingDirective,
      colorGradeStyle: 'clean_natural',
    },
    clips: input.plannerInput.clips.map((clip) => ({
      ...clip,
      fileName: `verified-source-${clip.uploadedOrder}.mp4`,
      detectedType: 'verified_uploaded_video',
      notes: undefined,
      sourceRole: undefined,
      previewLabel: undefined,
      thumbnailHint: undefined,
    })),
  }
  const audioPipelinePlan = createAudioPipelinePlan({
    input: professionalSourceBaselineInput,
    segmentEditPlans: [],
    visualAssetPlan: [],
  })
  const colorPipelinePlan = createColorPipelinePlan({
    input: professionalSourceBaselineInput,
    visualAssetPlan: [],
  })

  const plan: EditPlan = {
    ...base,
    goalSummary: input.editBrief?.fields.goal ?? base.goalSummary,
    sourceCleanupPlan,
    trimReviewPlan: {
      ...base.trimReviewPlan!,
      summary:
        'All verified source frames are preserved because no transcript or visual-analysis evidence authorized a content-aware cut.',
      userFacingReviewSummary: [
        'This first backend plan keeps every uploaded source frame in confirmed order.',
      ],
      qaChecks: [
        'Any later content-aware trim requires fresh analysis evidence and a new plan version.',
      ],
      limitations: [
        'No transcript, retake, silence, or semantic-cut inference was used.',
      ],
    },
    videoUnderstandingReport: undefined,
    adaptiveEditStrategy: undefined,
    adaptiveEditStrategyPlan: undefined,
    signatureRoutes: [{
      timeRange: 'full_edit',
      system: 'none',
      reason:
        'The bounded source-led route preserves verified uploads and explicit captions without generated visual systems.',
      creditImpact: 'none',
    }],
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    timingValidationPlan,
    visualAssetPlan: [],
    dataVizPlan: undefined,
    mapAnimationPlan: undefined,
    browserCapturePlan: undefined,
    providerPromptPlans: [],
    providerPromptGuidance: [],
    audioPipelinePlan,
    colorPipelinePlan,
    segmentEditPlans: [],
    soundSyncDirection:
      'Apply the approved source-bound professional voice recipe. Do not add music, SFX, beat sync, ducking, or inferred transcript edits.',
    captionDirection:
      'Render only the exact confirmed Edit Brief caption markers; never infer transcript text.',
  }
  const canonical = buildCanonicalPlanningDraft({
    plan,
    plannerInput: {
      ...input.plannerInput,
      sourceCleanupPlan,
      masterTimingPlan,
      captionVisualCueTimingPlan,
      soundSyncTransitionTimingPlan,
      timingValidationPlan,
    },
    sourceMediaAssets: input.sourceMediaAssets,
  })
  if (!canonical.ok) {
    throw new Error(
      `Server-owned source-led plan compilation failed: ${canonical.errors.join(' | ')}`,
    )
  }
  if (!canonical.draft.publication) {
    throw new Error(
      `Server-owned source-led plan is not publishable: ${canonical.draft.publicationBlockers.join(' | ')}`,
    )
  }
  return {
    plannerInput: {
      ...input.plannerInput,
      sourceCleanupPlan,
      masterTimingPlan,
      captionVisualCueTimingPlan,
      soundSyncTransitionTimingPlan,
      timingValidationPlan,
    },
    plan,
    canonicalDraft: canonical.draft,
    evidence: {
      sourceMetadataAuthority: 'server_reverified_finalized_upload_ffprobe',
      editDirectionAuthority:
        'server_reverified_chat_preferences_and_optional_edit_brief',
      exactPreferenceAuthority: 'server_reverified_exact_edit_preferences',
      browserPlanAccepted: false,
      browserTimingAccepted: false,
      sourceRangePolicy: 'preserve_every_verified_source_frame',
      sourceCount: input.sourceMediaAssets.length,
      totalFrames,
      fps: SOURCE_LED_FPS,
      captionCueCount: captions.length,
    },
  }
}

function assertBoundedSourceLedInput(input: {
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  editBrief?: EditBriefRecord
  confirmedCaptionMarkers: EditBriefMarkerRecord[]
}): void {
  if (
    input.sourceMediaAssets.length < 1 ||
    input.sourceMediaAssets.length > 8 ||
    input.sourceMediaAssets.length !== input.plannerInput.clips.length
  ) {
    throw new Error('The bounded source-led planner requires one to eight exact source videos.')
  }
  if (
    !input.plannerInput.aspectRatioConfirmed ||
    input.plannerInput.aspectRatio === 'let_ai_decide' ||
    !input.plannerInput.sourceOrderConfirmed ||
    !input.plannerInput.cleanupPreferenceConfirmed
  ) {
    throw new Error('The output frame, source order, and conservative cleanup policy must be confirmed.')
  }
  if (
    !['no_extra_visuals', 'keep_visuals_minimal'].includes(
      input.plannerInput.visualPreference,
    )
  ) {
    throw new Error(
      'Generated or explanatory visual requests require the later server visual-planning route.',
    )
  }
  if (input.editBrief && input.editBrief.fields.status !== 'ready') {
    throw new Error('The server-owned Edit Brief must be ready before planning.')
  }
  if (
    input.editBrief?.fields.musicPreference &&
    !['none', 'ai_decides'].includes(input.editBrief.fields.musicPreference)
  ) {
    throw new Error('Requested music requires a separately admitted audio-planning route.')
  }
  if (
    input.editBrief?.fields.captionPreference === 'none' &&
    input.confirmedCaptionMarkers.length > 0
  ) {
    throw new Error(
      'A caption-free Edit Brief cannot also contain confirmed caption markers.',
    )
  }
  input.sourceMediaAssets.forEach((asset, index) => {
    const metadata = asset.sourceMetadata
    if (
      asset.uploadedOrder !== index + 1 ||
      asset.uploadedClipId !== input.plannerInput.clips[index]?.id ||
      asset.privateArtifact !== true ||
      asset.publicUrl !== null ||
      asset.signedUrl !== null ||
      asset.mimeType.toLowerCase() !== 'video/mp4' ||
      metadata?.probeStatus !== 'probed' ||
      metadata.hasVideo !== true ||
      !Number.isFinite(metadata.durationSeconds) ||
      (metadata.durationSeconds ?? 0) <= 0
    ) {
      throw new Error(
        `Source ${index + 1} is missing finalized private MP4 and FFprobe authority.`,
      )
    }
    const frames = Math.round(metadata.durationSeconds! * SOURCE_LED_FPS)
    if (frames < 24) {
      throw new Error(`Source ${index + 1} is shorter than the 24-frame composition floor.`)
    }
  })
}

function buildPreservingCleanupPlan(
  template: SourceCleanupPlan,
  plannerInput: PlannerInput,
  sourceFrames: number[],
): SourceCleanupPlan {
  let timelineStartFrame = 0
  const decisions = plannerInput.clips.map((clip, index) => {
    const durationFrames = sourceFrames[index]!
    const timelineEndFrame = timelineStartFrame + durationFrames
    const durationSeconds = durationFrames / SOURCE_LED_FPS
    const decision = {
      id: `server-preserve-${index + 1}`,
      clipId: clip.id,
      sourceRange: {
        clipId: clip.id,
        startSeconds: 0,
        endSeconds: durationSeconds,
        durationSeconds,
        startFrame: 0,
        endFrame: durationFrames,
        durationFrames,
        fps: SOURCE_LED_FPS,
        notes: ['Exact complete source range from server-reverified FFprobe metadata.'],
      },
      selectedRange: {
        startSeconds: 0,
        endSeconds: durationSeconds,
        durationSeconds,
        startFrame: 0,
        endFrame: durationFrames,
        durationFrames,
        fps: SOURCE_LED_FPS,
      },
      timelineRange: {
        startSeconds: timelineStartFrame / SOURCE_LED_FPS,
        endSeconds: timelineEndFrame / SOURCE_LED_FPS,
        durationSeconds,
        startFrame: timelineStartFrame,
        endFrame: timelineEndFrame,
        durationFrames,
        fps: SOURCE_LED_FPS,
      },
      decision: 'preserve' as const,
      finalUse: 'main_timeline' as const,
      riskLevel: 'low' as const,
      reason:
        'Preserve the complete FFprobe-verified source range; no semantic trim authority exists yet.',
      keepReasons: ['source_context_required' as const],
      cutReasons: [],
      userReviewRequired: false,
      affectedMeaningRisk: false,
      linkedTimingCueIds: [],
      qaChecks: ['The selected range must preserve the complete verified source.'],
      notes: ['Server-derived conservative source range.'],
    }
    timelineStartFrame = timelineEndFrame
    return decision
  })
  return {
    ...template,
    id: 'server-source-led-cleanup-plan',
    status: 'confirmed',
    selectedPreference: plannerInput.cleanupPreference!,
    cleanupQuestion: {
      ...template.cleanupQuestion,
      answered: true,
    },
    decisions,
    preservedRanges: [...decisions],
    cutRanges: [],
    userReviewItems: [],
    finalDurationImpactSeconds: 0,
    limitations: [
      'Content-aware cleanup remains blocked until transcript and visual-analysis evidence exists.',
    ],
    notes: ['The exact verified source bytes remain non-destructively preserved.'],
  } as unknown as SourceCleanupPlan
}

function buildConfirmedCaptionCues(
  markers: EditBriefMarkerRecord[],
  totalFrames: number,
): Array<{
  id: string
  caption: string
  startFrame: number
  endFrame: number
}> {
  const captions = [...markers]
    .filter((marker) => marker.status === 'confirmed' && marker.markerType === 'caption')
    .sort((left, right) =>
      (left.startFrame ?? Math.round(left.startSeconds * SOURCE_LED_FPS)) -
      (right.startFrame ?? Math.round(right.startSeconds * SOURCE_LED_FPS)))
    .map((marker, index) => {
      const startFrame =
        marker.startFrame ?? Math.round(marker.startSeconds * SOURCE_LED_FPS)
      const endFrame = marker.endFrame ??
        Math.round((marker.endSeconds ?? marker.startSeconds) * SOURCE_LED_FPS)
      const caption = marker.note.trim()
      const frameAuthoritative =
        marker.timingStatus === 'frame_authoritative' &&
        marker.frameRate === SOURCE_LED_FPS
      const confirmedSecondsAwaitingServerFrameProjection =
        marker.timingStatus === 'display_seconds_only' &&
        marker.frameRate === undefined &&
        marker.startFrame === undefined &&
        marker.endFrame === undefined
      if (
        marker.timeKind !== 'range' ||
        marker.endSeconds === undefined ||
        (!frameAuthoritative && !confirmedSecondsAwaitingServerFrameProjection) ||
        !Number.isInteger(startFrame) ||
        !Number.isInteger(endFrame) ||
        startFrame < 0 ||
        endFrame <= startFrame ||
        endFrame > totalFrames ||
        caption.length < 1 ||
        caption.length > 120 ||
        !ASCII_CAPTION.test(caption) ||
        /[{}\\[\]]/.test(caption)
      ) {
        throw new Error(`Confirmed caption marker ${index + 1} is not execution-safe.`)
      }
      return {
        id: `server-caption-${index + 1}`,
        caption,
        startFrame,
        endFrame,
      }
    })
  if (captions.length > 7) {
    throw new Error('The bounded source-led route supports at most seven exact caption markers.')
  }
  let previousEnd = 0
  captions.forEach((caption, index) => {
    if (caption.startFrame < previousEnd) {
      throw new Error(`Confirmed caption marker ${index + 1} overlaps the previous marker.`)
    }
    previousEnd = caption.endFrame
  })
  if (
    captions.length === 1 &&
    (captions[0]!.startFrame !== 0 || captions[0]!.endFrame !== totalFrames)
  ) {
    throw new Error('A single confirmed caption must cover the exact approved edit duration.')
  }
  return captions
}

function buildSourceLedMasterTimingPlan(input: {
  template: MasterTimingPlan
  plannerInput: PlannerInput
  sourceFrames: number[]
  captions: Array<{ id: string; caption: string; startFrame: number; endFrame: number }>
}): MasterTimingPlan {
  let cursor = 0
  const sourceTimingItems = input.plannerInput.clips.map((clip, index) => {
    const durationFrames = input.sourceFrames[index]!
    const item = {
      id: `server-source-timing-${index + 1}`,
      clipId: clip.id,
      uploadedOrder: index + 1,
      sourceRange: frameRange(0, durationFrames),
      selectedRange: frameRange(0, durationFrames),
      role: 'main_story' as const,
      reason: 'Preserve the complete verified source in confirmed order.',
      trimNotes: ['No content-aware trimming is authorized.'],
      qaChecks: ['The selected range must equal the FFprobe-derived source duration.'],
    }
    return item
  })
  const finalTimelineSegments = input.plannerInput.clips.map((_clip, index) => {
    const startFrame = cursor
    const durationFrames = input.sourceFrames[index]!
    cursor += durationFrames
    return {
      id: `server-segment-${index + 1}`,
      segmentId: `server-segment-${index + 1}`,
      label: `Verified source ${index + 1}`,
      role: index === 0 ? 'hook' as const : 'proof' as const,
      finalRange: frameRange(startFrame, cursor),
      sourceTimingItemIds: [sourceTimingItems[index]!.id],
      timingCues: [],
      pacingNotes: ['Preserve the source duration without unsupported semantic cuts.'],
      qaChecks: ['Verify contiguous integer-frame coverage.'],
    }
  })
  const transitionTimingItems = finalTimelineSegments.slice(0, -1).map(
    (segment, index) => {
      const boundaryFrame = segment.finalRange.endFrame
      return {
        id: `server-hard-cut-${index + 1}`,
        transitionType: 'hard_cut' as const,
        timeRange: frameRange(boundaryFrame, boundaryFrame),
        fromSegmentId: segment.segmentId,
        toSegmentId: finalTimelineSegments[index + 1]!.segmentId,
        refinedTransitionTimingItemId: `server-refined-hard-cut-${index + 1}`,
        beatAligned: false,
        phraseBoundaryAligned: true,
        reason: 'Use an exact speech-safe hard cut at the verified source boundary.',
        qaChecks: ['The hard cut must remain on the exact source boundary.'],
      }
    },
  )
  const captionTimingItems = input.captions.map((caption) => ({
    id: caption.id,
    captionText: caption.caption,
    timeRange: frameRange(caption.startFrame, caption.endFrame),
    animationInFrames: 0,
    holdFrames: caption.endFrame - caption.startFrame,
    animationOutFrames: 0,
    readabilityScore: 'high' as const,
    qaChecks: ['Use only the exact user-confirmed caption text and frame range.'],
  }))
  const visualTimingItems = input.captions.map((caption) => ({
    id: `server-caption-visual-${caption.id}`,
    label: `Confirmed caption ${caption.id}`,
    visualType: 'caption_only' as const,
    timeRange: frameRange(caption.startFrame, caption.endFrame),
    revealFrames: 0,
    holdFrames: caption.endFrame - caption.startFrame,
    exitFrames: 0,
    readTimeFrames: caption.endFrame - caption.startFrame,
    reason: 'Represent one explicit Edit Brief caption marker.',
    qaChecks: ['Do not infer or rewrite caption content.'],
  }))
  const totalFrames = input.sourceFrames.reduce((sum, frames) => sum + frames, 0)
  return {
    ...input.template,
    id: 'server-source-led-master-timing-plan',
    status: 'ready',
    summary:
      'Server-owned MasterTiming preserves every verified source frame and exact confirmed caption ranges.',
    timingBase: {
      ...input.template.timingBase,
      fps: SOURCE_LED_FPS,
      totalDurationSeconds: totalFrames / SOURCE_LED_FPS,
      totalFrames,
      sourceDurationSeconds: totalFrames / SOURCE_LED_FPS,
      finalDurationSeconds: totalFrames / SOURCE_LED_FPS,
      frameRoundingMode: 'round',
      derivedFromAspectRatioFramePlan: true,
      aspectRatioConfirmed: true,
      notes: ['Derived from finalized FFprobe metadata; frames are execution authority.'],
    },
    sourceTimingItems,
    finalTimelineSegments,
    transcriptTimingPlan: {
      ...input.template.transcriptTimingPlan,
      status: 'ready',
      lines: [],
      phraseBoundaryCueIds: [],
      emotionalPauseCueIds: [],
      limitations: ['No transcript was inferred or used.'],
      qaChecks: ['Explicit Edit Brief captions are not treated as a transcript.'],
    },
    beatGridPlan: {
      ...input.template.beatGridPlan,
      status: 'ready',
      bpm: undefined,
      beatItems: [],
      dropCueIds: [],
      onsetCueIds: [],
      confidence: 'low',
      limitations: ['No music or beat analysis is requested.'],
      qaChecks: ['Hard cuts remain source-bound, not beat-bound.'],
    },
    captionTimingItems,
    visualTimingItems,
    transitionTimingItems,
    sfxTimingItems: [],
    musicDuckingTimingItems: [],
    remotionLayerTimingItems: [],
    providerClipTimingItems: [],
    globalRules: [
      'Preserve source order and full verified ranges.',
      'Never infer transcript, trims, generated assets, music, or SFX.',
    ],
    limitations: [
      'Content-aware editing requires separately verified transcript and visual analysis.',
    ],
    notes: [],
  } as unknown as MasterTimingPlan
}

function buildSourceLedCaptionTimingPlan(input: {
  template: CaptionVisualCueTimingPlan
  plannerInput: PlannerInput
  masterTimingPlan: MasterTimingPlan
}): CaptionVisualCueTimingPlan {
  const captions = input.masterTimingPlan.captionTimingItems
  return {
    ...input.template,
    id: 'server-source-led-caption-timing-plan',
    status: 'synced',
    summary: 'Every caption is an exact confirmed Edit Brief marker.',
    captionPolicy: {
      ...input.template.captionPolicy,
      chunkingMode: 'minimal_caption',
      animationStyle: 'premium_minimal',
      emphasisAllowed: false,
      maxEmphasisWordsPerCaption: 0,
      avoidRules: ['Do not infer text or move captions outside their confirmed ranges.'],
      qaChecks: ['Caption content and frames must equal the confirmed markers.'],
    },
    captionPhraseTimings: [],
    refinedCaptionTimings: captions.map((caption) => ({
      id: `refined-${caption.id}`,
      captionText: caption.captionText,
      timeRange: caption.timeRange,
      chunkingMode: 'minimal_caption',
      animationStyle: 'premium_minimal',
      emphasisWords: [],
      readabilityRisk: 'low',
      readabilityScore: 'high',
      safeZoneNotes: ['Use the confirmed 4K frame caption-safe zone.'],
      collisionAvoidanceNotes: ['No other overlays are admitted in this route.'],
      reason: 'Exact user-confirmed caption marker.',
      qaChecks: ['No text rewriting or inferred transcript content.'],
    })),
    visualCueTimings: input.masterTimingPlan.visualTimingItems.map((visual) => ({
      id: `refined-${visual.id}`,
      cueType: 'custom',
      triggerType: 'manual_planned',
      status: 'synced',
      label: visual.label,
      timeRange: visual.timeRange,
      visualReadTimeFrames: visual.readTimeFrames,
      revealFrames: visual.revealFrames,
      holdFrames: visual.holdFrames,
      exitFrames: visual.exitFrames,
      safeZoneNotes: ['Keep the exact caption inside the confirmed safe zone.'],
      reason: visual.reason,
      qaChecks: visual.qaChecks,
    })),
    collisionPlans: [],
    globalRules: ['Only explicit Edit Brief caption markers are rendered.'],
    qaChecks: ['Verify exact text, frames, and output-frame safe zones.'],
    limitations: ['No transcript alignment was claimed.'],
    notes: [],
  } as unknown as CaptionVisualCueTimingPlan
}

function buildSourceLedSoundSyncPlan(input: {
  template: SoundSyncTransitionTimingPlan
  masterTimingPlan: MasterTimingPlan
}): SoundSyncTransitionTimingPlan {
  const refinedTransitionTimings =
    input.masterTimingPlan.transitionTimingItems.map((transition, index) => {
      const boundaryFrame = transition.timeRange.startFrame
      const beatSnapDecision = {
        id: `server-hard-cut-snap-${index + 1}`,
        targetCueId: transition.id,
        requestedFrame: boundaryFrame,
        snappedFrame: boundaryFrame,
        snapDecision: 'snap_to_phrase_boundary' as const,
        speechSafe: true,
        reason: 'The exact source boundary is the approved speech-safe cut.',
        qaChecks: ['Do not move the cut to a beat or inferred cue.'],
      }
      return {
        id: `server-refined-hard-cut-${index + 1}`,
        transitionType: 'hard_cut' as const,
        timeRange: frameRange(boundaryFrame, boundaryFrame),
        fromSegmentId: transition.fromSegmentId,
        toSegmentId: transition.toSegmentId,
        linkedMasterTransitionTimingItemId: transition.id,
        beatSnapDecision,
        phraseBoundaryAligned: true,
        beatAligned: false,
        downbeatAligned: false,
        visualMotivated: false,
        audioMotivated: false,
        durationFrames: 0,
        riskLevel: 'low' as const,
        reason: 'Exact hard cut at the confirmed source boundary.',
        qaChecks: ['The refined cut must equal the MasterTiming boundary.'],
      }
    })
  return {
    ...input.template,
    id: 'server-source-led-soundsync-plan',
    status: 'ready_mock',
    summary: 'No music, SFX, beat sync, or ducking is admitted; only exact hard cuts remain.',
    beatGridPlan: {
      ...input.template.beatGridPlan,
      status: 'ready_mock',
      bpm: undefined,
      confidence: 'low',
      beatItems: [],
      musicPhrases: [],
      analysisToolPlanned: [],
      globalRules: ['Do not move source boundaries for beat alignment.'],
      limitations: ['No audio analysis was executed.'],
      qaChecks: ['Source hard cuts remain frame-exact.'],
    },
    beatSnapDecisions: refinedTransitionTimings.map(
      (transition) => transition.beatSnapDecision,
    ),
    refinedTransitionTimings,
    refinedSfxTimings: [],
    refinedMusicDuckingTimings: [],
    sfxDensityLevel: 'none',
    globalRules: ['No random SFX, music, beat sync, or ducking.'],
    qaChecks: [],
    limitations: ['Source audio is preserved without inferred processing.'],
    notes: [],
  } as SoundSyncTransitionTimingPlan
}

function frameRange(startFrame: number, endFrame: number) {
  const durationFrames = endFrame - startFrame
  return {
    startSeconds: startFrame / SOURCE_LED_FPS,
    endSeconds: endFrame / SOURCE_LED_FPS,
    durationSeconds: durationFrames / SOURCE_LED_FPS,
    startFrame,
    endFrame,
    durationFrames,
    fps: SOURCE_LED_FPS,
  }
}
