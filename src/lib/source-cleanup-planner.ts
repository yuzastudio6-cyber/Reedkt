import type {
  AdaptiveEditStrategyPlan,
  AspectRatioFramePlan,
  CleanupPreference,
  CompiledEditingIntent,
  CutReason,
  KeepReason,
  MasterTimingPlan,
  PlannerInput,
  SourceCleanupPlan,
  SourceRangePlan,
  TrimDecisionItem,
  TrimDecisionType,
  TrimRiskLevel,
  VideoUnderstandingReport,
} from '../types/reeditpro'
import { recommendCleanupPreference, getCleanupPreferenceProfile, getCleanupQaChecks } from './source-cleanup-policy'
import { secondsToFrames } from './timing-utils'

type CreateSourceCleanupPlanParams = {
  input: PlannerInput
  aspectRatioFramePlan?: AspectRatioFramePlan
  videoUnderstandingReport?: VideoUnderstandingReport
  compiledIntent?: CompiledEditingIntent
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  masterTimingPlan?: MasterTimingPlan
}

const cleanupOptions: CleanupPreference[] = [
  'preserve_natural',
  'light_cleanup',
  'balanced_cleanup',
  'tight_retention_cleanup',
  'aggressive_cleanup',
  'documentary_faithful',
  'tutorial_complete',
  'custom',
]

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

function textForClip(input: PlannerInput, clipId: string, videoUnderstandingReport?: VideoUnderstandingReport) {
  const clip = input.clips.find((item) => item.id === clipId)
  const understanding = videoUnderstandingReport?.clips.find((item) => item.clipId === clipId)

  return `${clip?.fileName ?? ''} ${clip?.detectedType ?? ''} ${clip?.notes ?? ''} ${clip?.sourceRole ?? ''} ${understanding?.transcriptSummary ?? ''} ${understanding?.visualSummary ?? ''}`.toLowerCase()
}

function sourceRangeForClip(params: {
  clipId: string
  durationSeconds: number
  fps: number
  notes: string[]
}): SourceRangePlan {
  return {
    clipId: params.clipId,
    startSeconds: 0,
    endSeconds: params.durationSeconds,
    startFrame: secondsToFrames(0, params.fps),
    endFrame: secondsToFrames(params.durationSeconds, params.fps),
    durationSeconds: params.durationSeconds,
    notes: params.notes,
  }
}

function hasRetakeLanguage(text: string) {
  return /\b(take|retry|again|version|alt|attempt|redo)\b|take\d|v\d/i.test(text)
}

function retakeBaseLabel(text: string) {
  return text
    .toLowerCase()
    .replace(/\b(take|retry|again|version|alt|attempt|redo|v)\s*\d*\b/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 42)
}

function qualityIssues(text: string) {
  const issues: CutReason[] = []
  if (/bad audio|noisy|muffled|wind|distorted/.test(text)) issues.push('bad_audio')
  if (/bad visual|blurry|shaky|dark|unusable/.test(text)) issues.push(text.includes('shaky') || text.includes('blurry') ? 'shaky_or_blurry' : 'bad_visual')
  if (/privacy|sensitive|private/.test(text)) issues.push('privacy_sensitive')
  return issues
}

function chooseDecision(params: {
  clipId: string
  text: string
  preference: CleanupPreference
  input: PlannerInput
  videoUnderstandingReport?: VideoUnderstandingReport
}): {
  decision: TrimDecisionType
  keepReasons: KeepReason[]
  cutReasons: CutReason[]
  riskLevel: TrimRiskLevel
  finalUse: TrimDecisionItem['finalUse']
  userReviewRequired: boolean
  affectedMeaningRisk: boolean
  reason: string
} {
  const clip = params.input.clips.find((item) => item.id === params.clipId)
  const understanding = params.videoUnderstandingReport?.clips.find((item) => item.clipId === params.clipId)
  const role = clip?.sourceRole ?? understanding?.detectedRole ?? 'unknown'
  const cutReasons = qualityIssues(params.text)
  const keepReasons: KeepReason[] = []
  const profile = getCleanupPreferenceProfile(params.preference)
  const isDocumentary = params.input.editingCategory === 'documentary_case_study' || params.preference === 'documentary_faithful'
  const isTutorial = params.input.editingCategory === 'education_explainer' || params.preference === 'tutorial_complete' || /tutorial|demo|walkthrough|step/.test(params.text)

  if (clip?.isImportant) keepReasons.push('user_marked_important')
  if (role === 'hook_candidate' || /hook|opening|first line/.test(params.text)) keepReasons.push('strong_hook')
  if (role === 'proof' || /proof|evidence|source|claim/.test(params.text)) keepReasons.push('proof_or_evidence', 'source_context_required')
  if (role === 'product' || /product|feature|demo|screen|ui|dashboard/.test(params.text)) keepReasons.push('product_demo_required')
  if (isTutorial) keepReasons.push('tutorial_step_required')
  if (role === 'ending' || /cta|call to action|subscribe|book|buy/.test(params.text)) keepReasons.push('cta')
  if (params.input.editingCategory === 'lifestyle' || /behind the scenes|bts|raw|natural|authentic/.test(params.text)) keepReasons.push('behind_the_scenes_authenticity')
  if (understanding?.strongMoments.length) keepReasons.push('good_visual_moment', 'key_story_beat')

  if (clip?.isOptional) cutReasons.push('user_marked_optional')
  if (hasRetakeLanguage(params.text)) cutReasons.push('repeated_take')
  if (/setup|cleanup|test shot|camera setup/.test(params.text)) cutReasons.push('setup_cleanup')
  if (/ramble|off topic|tangent/.test(params.text)) cutReasons.push('off_topic')
  if (/weak|unclear|confusing/.test(params.text)) cutReasons.push('weak_explanation')

  if (clip?.isImportant || keepReasons.includes('proof_or_evidence') || keepReasons.includes('tutorial_step_required')) {
    return {
      decision: keepReasons.includes('proof_or_evidence') || isDocumentary ? 'preserve' : 'keep',
      keepReasons: Array.from(new Set(keepReasons.length ? keepReasons : profile.defaultKeepReasons)),
      cutReasons: Array.from(new Set(cutReasons)),
      riskLevel: cutReasons.includes('privacy_sensitive') ? 'high' : 'low',
      finalUse: keepReasons.includes('proof_or_evidence') ? 'proof' : 'main_timeline',
      userReviewRequired: cutReasons.includes('privacy_sensitive'),
      affectedMeaningRisk: true,
      reason: clip?.isImportant
        ? 'User-marked important clip is preserved unless the user explicitly reviews a cut.'
        : keepReasons.includes('proof_or_evidence')
          ? 'Proof/evidence context should be preserved to avoid changing meaning.'
          : 'Required tutorial/product/story context is kept in the mock cleanup plan.',
    }
  }

  if (role === 'b_roll') {
    return {
      decision: 'move_to_broll',
      keepReasons: ['good_visual_moment'],
      cutReasons: Array.from(new Set(cutReasons)),
      riskLevel: 'low',
      finalUse: 'broll',
      userReviewRequired: false,
      affectedMeaningRisk: false,
      reason: 'B-roll source is repurposed as support footage instead of random filler.',
    }
  }

  if (clip?.isOptional && (params.preference === 'aggressive_cleanup' || params.preference === 'tight_retention_cleanup' || params.preference === 'balanced_cleanup')) {
    return {
      decision: 'cut',
      keepReasons: Array.from(new Set(keepReasons)),
      cutReasons: Array.from(new Set(cutReasons.length ? cutReasons : ['user_marked_optional'])),
      riskLevel: 'low',
      finalUse: 'removed',
      userReviewRequired: false,
      affectedMeaningRisk: false,
      reason: 'Optional clip can be removed if it does not improve the story or pacing.',
    }
  }

  if (params.preference === 'aggressive_cleanup' && cutReasons.length) {
    return {
      decision: 'tighten',
      keepReasons: Array.from(new Set(keepReasons.length ? keepReasons : ['key_story_beat'])),
      cutReasons: Array.from(new Set(cutReasons)),
      riskLevel: isDocumentary ? 'high' : 'medium',
      finalUse: isDocumentary ? 'user_review' : 'main_timeline',
      userReviewRequired: isDocumentary,
      affectedMeaningRisk: isDocumentary,
      reason: 'Aggressive cleanup can tighten likely weak sections, but meaning-sensitive material is marked for review.',
    }
  }

  if (params.preference === 'preserve_natural' || params.preference === 'light_cleanup') {
    return {
      decision: 'keep',
      keepReasons: Array.from(new Set(keepReasons.length ? keepReasons : profile.defaultKeepReasons)),
      cutReasons: Array.from(new Set(cutReasons)),
      riskLevel: cutReasons.includes('privacy_sensitive') ? 'high' : 'low',
      finalUse: 'main_timeline',
      userReviewRequired: cutReasons.includes('privacy_sensitive'),
      affectedMeaningRisk: false,
      reason: 'Cleanup preference preserves natural source rhythm while removing only obvious issues after review.',
    }
  }

  return {
    decision: cutReasons.length ? 'tighten' : 'keep',
    keepReasons: Array.from(new Set(keepReasons.length ? keepReasons : profile.defaultKeepReasons)),
    cutReasons: Array.from(new Set(cutReasons.length ? cutReasons : profile.defaultCutReasons.slice(0, 1))),
    riskLevel: cutReasons.includes('privacy_sensitive') ? 'high' : 'low',
    finalUse: 'main_timeline',
    userReviewRequired: cutReasons.includes('privacy_sensitive'),
    affectedMeaningRisk: false,
    reason: cutReasons.length
      ? 'Mock cleanup tightens likely weak portions while preserving the useful source point.'
      : 'Clip remains useful for the main timeline under the selected cleanup preference.',
  }
}

function durationImpactForDecision(decision: TrimDecisionItem, preference: CleanupPreference) {
  const duration = decision.sourceRange.durationSeconds

  if (decision.decision === 'cut') return -duration
  if (decision.decision === 'move_to_broll') return -Math.min(duration * 0.4, 4)
  if (decision.decision === 'tighten') return -Math.min(duration * (preference === 'aggressive_cleanup' ? 0.35 : 0.2), 5)
  return 0
}

function applyRetakeGroups(decisions: TrimDecisionItem[], input: PlannerInput) {
  const groups = new Map<string, TrimDecisionItem[]>()

  decisions.forEach((decision) => {
    const clip = input.clips.find((item) => item.id === decision.clipId)
    const text = `${clip?.fileName ?? ''} ${clip?.notes ?? ''}`

    if (!hasRetakeLanguage(text)) {
      return
    }

    const key = retakeBaseLabel(text) || `retake-${decision.clipId}`
    groups.set(key, [...(groups.get(key) ?? []), decision])
  })

  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([label, items], index) => {
      const selected = [...items].sort((a, b) => {
        const clipA = input.clips.find((clip) => clip.id === a.clipId)
        const clipB = input.clips.find((clip) => clip.id === b.clipId)
        if (clipA?.isImportant && !clipB?.isImportant) return -1
        if (!clipA?.isImportant && clipB?.isImportant) return 1
        return (clipB?.uploadedOrder ?? 0) - (clipA?.uploadedOrder ?? 0)
      })[0]
      const alternates = items.filter((item) => item.id !== selected.id)

      return {
        id: `retake-group-${index + 1}`,
        clipIds: items.map((item) => item.clipId),
        label: label || `Retake group ${index + 1}`,
        selectedClipId: selected.clipId,
        selectedDecisionItemId: selected.id,
        alternateDecisionItemIds: alternates.map((item) => item.id),
        reason: 'Mock retake group inferred from filename or notes. Later/important take is selected for planning; alternates remain reviewable.',
        userReviewRequired: alternates.length > 1,
        qaChecks: [
          'Retake selection is based on metadata only.',
          'User can review alternate takes before approval.',
          'No real transcript, visual, or audio comparison has run.',
        ],
      }
    })
}

export function createSourceCleanupPlan(params: CreateSourceCleanupPlanParams): SourceCleanupPlan {
  const recommendation = recommendCleanupPreference({ input: params.input })
  const confirmed = Boolean(params.input.cleanupPreferenceConfirmed && params.input.cleanupPreference)
  const selectedPreference = confirmed ? params.input.cleanupPreference : undefined
  const effectivePreference = selectedPreference ?? recommendation.recommendedPreference
  const profile = getCleanupPreferenceProfile(effectivePreference)
  const fps = params.masterTimingPlan?.timingBase.fps ?? 30

  const decisions = params.input.clips.map<TrimDecisionItem>((clip) => {
    const durationSeconds = parseDurationSeconds(clip.duration)
    const text = textForClip(params.input, clip.id, params.videoUnderstandingReport)
    const choice = chooseDecision({
      clipId: clip.id,
      input: params.input,
      preference: effectivePreference,
      text,
      videoUnderstandingReport: params.videoUnderstandingReport,
    })

    return {
      id: `trim-decision-${clip.id}`,
      clipId: clip.id,
      sourceRange: sourceRangeForClip({
        clipId: clip.id,
        durationSeconds,
        fps,
        notes: [
          'Mock full-clip source range; no real trim/silence detection has run.',
          params.masterTimingPlan ? 'Frames use the current MasterTimingPlan fps.' : 'Frames use 30fps as mock planning fallback only.',
        ],
      }),
      decision: choice.decision,
      keepReasons: choice.keepReasons,
      cutReasons: choice.cutReasons,
      riskLevel: choice.riskLevel,
      finalUse: choice.finalUse,
      userReviewRequired: choice.userReviewRequired || choice.riskLevel === 'high' || choice.riskLevel === 'blocking',
      reason: choice.reason,
      affectedMeaningRisk: choice.affectedMeaningRisk,
      linkedSegmentId: params.adaptiveEditStrategyPlan?.segmentStrategies.find((strategy) => strategy.clipId === clip.id)?.segmentId,
      linkedTimingCueIds: [`source-trim-cue-${clip.id}`],
      qaChecks: [
        ...getCleanupQaChecks(effectivePreference),
        choice.affectedMeaningRisk ? 'Meaning-sensitive clip must not be removed without review.' : 'Meaning risk is low in mock planning.',
      ],
      notes: [
        `Cleanup profile: ${profile.label}.`,
        params.compiledIntent ? `Compiled goal considered: ${params.compiledIntent.goalSummary}` : 'Compiled intent unavailable.',
        params.aspectRatioFramePlan?.status === 'confirmed' ? 'Output frame is confirmed for downstream timing.' : 'Output frame confirmation may still block final approval.',
      ],
    }
  })

  const retakeGroups = applyRetakeGroups(decisions, params.input)
  const retakeAlternateIds = new Set(retakeGroups.flatMap((group) => group.alternateDecisionItemIds))
  const decisionsWithRetakes = decisions.map((decision) => {
    if (!retakeAlternateIds.has(decision.id)) {
      return decision
    }

    return {
      ...decision,
      decision: effectivePreference === 'aggressive_cleanup' || effectivePreference === 'tight_retention_cleanup' ? 'cut' : 'use_as_alt_take',
      finalUse: effectivePreference === 'aggressive_cleanup' || effectivePreference === 'tight_retention_cleanup' ? 'removed' : 'alt_take',
      cutReasons: Array.from(new Set([...decision.cutReasons, 'repeated_take'])),
      userReviewRequired: decision.userReviewRequired || effectivePreference === 'aggressive_cleanup',
      reason: 'Alternate take is de-prioritized by mock retake grouping; user review remains available before approval.',
    } satisfies TrimDecisionItem
  })
  const preservedRanges = decisionsWithRetakes.filter((decision) =>
    decision.decision === 'keep' ||
    decision.decision === 'preserve' ||
    decision.decision === 'use_as_proof' ||
    decision.finalUse === 'proof' ||
    decision.keepReasons.length > 0,
  )
  const cutRanges = decisionsWithRetakes.filter((decision) => decision.decision === 'cut' || decision.finalUse === 'removed')
  const userReviewItems = decisionsWithRetakes.filter((decision) => decision.userReviewRequired || decision.decision === 'needs_user_review')
  const finalDurationImpactSeconds = decisionsWithRetakes.reduce((sum, decision) => sum + durationImpactForDecision(decision, effectivePreference), 0)

  return {
    id: `source-cleanup-${params.input.editingCategory}-${params.input.editLevel}`,
    status: params.input.clips.length === 0 ? 'not_started' : confirmed ? 'confirmed' : 'needs_confirmation',
    selectedPreference,
    recommendedPreference: recommendation,
    cleanupQuestion: {
      id: 'cleanup-question-how-clean',
      question: 'How clean should I make the cut?',
      options: cleanupOptions,
      recommendedOption: recommendation.recommendedPreference,
      reason: recommendation.reason,
      requiredBeforeApproval: true,
      answered: confirmed,
    },
    decisions: decisionsWithRetakes,
    retakeGroups,
    preservedRanges,
    cutRanges,
    userReviewItems,
    finalDurationImpactSeconds,
    meaningPreservationRules: [
      'Do not cut meaning.',
      'Do not distort claim or source context.',
      'Preserve required product and tutorial steps.',
      'Preserve evidence/proof context unless the user explicitly approves a change.',
      'User-marked important clips require review before removal.',
    ],
    globalRules: [
      'Source cleanup preference must be confirmed before final approval.',
      'Every trim/select decision includes a reason.',
      'No random cuts.',
      'Preserve meaning over pacing.',
      'Future workers execute approved trim decisions from approved snapshots.',
    ],
    qaChecks: [
      ...getCleanupQaChecks(effectivePreference),
      `${decisionsWithRetakes.length} trim/select decision(s) have mock source ranges and reasons.`,
      retakeGroups.length ? `${retakeGroups.length} retake group(s) inferred from metadata only.` : 'No retake groups inferred from clip metadata.',
      confirmed ? 'Cleanup preference is confirmed.' : 'Approval remains locked until cleanup preference is confirmed.',
    ],
    limitations: [
      'Mock-only cleanup plan.',
      'No real transcript analysis has run.',
      'No real silence detection has run.',
      'No real video/audio/image/frame analysis has run.',
      'No FFmpeg, VapourSynth, AudioFlux, Signalsmith Stretch, Remotion rendering, provider call, backend, or worker execution has run.',
      'Future transcript/media workers are required for exact trim execution.',
    ],
    notes: [
      recommendation.reason,
      `Selected/effective cleanup profile for planning: ${profile.label}.`,
      confirmed
        ? 'User confirmed cleanup style for this mock planning pass.'
        : 'Recommendation is not confirmation; user must confirm cleanup style before approval.',
    ],
  }
}
